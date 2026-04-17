#!/usr/bin/env tsx
/**
 * Phase 4 辅助:Google 字段月度刷新
 *
 * Google Places TOS 要求:非 place_id 字段(rating/reviews/photos/...)
 * 必须 30 天内刷新,或显示在嵌入的 Google Map 中。
 * 本项目用 Leaflet+OSM 显示地图,所以走刷新路线。
 *
 * 建议设置每月 cron:
 *   0 3 1 * *   pnpm refresh:google
 *
 * 流程:
 *   1. 找出 last_enriched_at < 25 天前 的所有营地(只包含有 google_place_id 的)
 *   2. 重新拉 place details
 *   3. 更新 rating, ratingCount, photos, phone, website
 *   4. 不重跑 AI(节省成本),但更新 last_enriched_at
 *
 * 用法:
 *   pnpm refresh:google                  # 全量刷新
 *   pnpm refresh:google -- --limit 50    # 只刷 50 个
 *   pnpm refresh:google -- --dry-run     # 试跑
 */

import pLimit from 'p-limit';
import { parseCli, progress, progressEnd } from './lib/cli.js';
import { ensureAdminClient } from './lib/supabase-admin.js';
import { JobTracker } from './lib/job-tracker.js';
import { getPlaceDetails, buildPhotoUrl } from './lib/sources/google.js';
import { campToDbRow } from './lib/db-mapper.js';
import { computeQualityScore } from './lib/quality.js';
import { dbRowToCamp } from './lib/db-mapper.js';

const REFRESH_AGE_DAYS = 25; // < 30 天,留 5 天 buffer

async function main() {
  const opts = parseCli();
  console.log('🔄 Google Refresh');
  console.log(`   limit: ${opts.limit ?? '(all)'}`);
  console.log(`   dry:   ${opts.dryRun}`);
  console.log('');

  const supabase = await ensureAdminClient();
  const tracker = new JobTracker({
    source: 'google-refresh',
    jobType: 'refresh',
    metadata: { ...opts, refreshAgeDays: REFRESH_AGE_DAYS },
  });

  if (!opts.dryRun) await tracker.start();

  const cutoff = new Date(Date.now() - REFRESH_AGE_DAYS * 24 * 3600 * 1000).toISOString();

  let query = supabase
    .from('camps')
    .select('*')
    .not('google_place_id', 'is', null)
    .or(`last_enriched_at.is.null,last_enriched_at.lt.${cutoff}`);
  if (opts.limit) query = query.limit(opts.limit);

  const { data: rows, error } = await query;
  if (error) throw new Error(`无法读取 camps: ${error.message}`);
  if (!rows || rows.length === 0) {
    console.log(`✅ 没有需要刷新的营地(全部都在 ${REFRESH_AGE_DAYS} 天内)。退出。`);
    if (!opts.dryRun) await tracker.finish({ dryRun: opts.dryRun });
    return;
  }

  console.log(`📋 待刷新 ${rows.length} 个\n`);

  const concurrent = pLimit(5);
  const updates: any[] = [];
  let processed = 0;

  await Promise.all(
    rows.map((row) =>
      concurrent(async () => {
        try {
          const camp = dbRowToCamp(row);
          const placeId = camp.googlePlaceId;
          if (!placeId) {
            tracker.recordSkipped('no place_id');
            return;
          }
          const place = await getPlaceDetails(placeId);
          if (!place) {
            tracker.recordSkipped('place not found in Google', { placeId });
            return;
          }

          const updated: any = {
            id: camp.id,
            rating: place.rating ?? camp.rating,
            ratingCount: place.user_ratings_total ?? camp.ratingCount,
            phone: place.formatted_phone_number ?? camp.phone,
            website: place.website ?? camp.website,
            photos: place.photos
              ?.slice(0, 10)
              .map((p) => buildPhotoUrl(p.photo_reference, 1200)) ?? camp.photos,
            photoAttribution: {
              google: place.photos?.slice(0, 10).flatMap((p) => p.html_attributions ?? []) ?? [],
            },
            lastEnrichedAt: new Date().toISOString(),
          };

          // 重算质量分
          const merged = { ...camp, ...updated };
          updated.dataQualityScore = computeQualityScore(merged);

          updates.push(campToDbRow(updated));
          tracker.recordSuccess();
        } catch (e: any) {
          tracker.recordFailure(e.message ?? String(e), { id: row.id });
        } finally {
          processed++;
          progress(processed, rows.length, row.name?.slice(0, 30));
        }
      })
    )
  );

  progressEnd();

  if (opts.dryRun) {
    console.log(`\n🟡 DRY RUN — ${updates.length} 个待更新`);
    return;
  }

  console.log(`\n📝 写入 ${updates.length} 条更新...`);
  const BATCH = 50;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    const { error: e } = await supabase.from('camps').upsert(batch, { onConflict: 'id' });
    if (e) console.error(`  ❌ 批次 ${i / BATCH + 1} 失败:`, e.message);
    else console.log(`  ✓ 批次 ${i / BATCH + 1}: ${batch.length} 条`);
  }

  await tracker.finish({ dryRun: opts.dryRun });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
