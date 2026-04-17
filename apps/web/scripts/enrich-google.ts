#!/usr/bin/env tsx
/**
 * Phase 3 入口:用 Google Places 数据丰富已有营地
 *
 * 流程:
 *   1. 查 Supabase 所有 source='doc'(或 --source 指定)的营地
 *   2. 对每个营地,如果 google_place_id 未知,先按 name+coords 反查
 *   3. 拉 place details(rating, reviews, photos, phone, website, ...)
 *   4. 跑 AI:
 *      - analyzeReviews → 结构化 pros/cons + summary + aspect_scores + inferred_facilities
 *      - inferLocationContext → nearest_town, sub_region, elevation, campfire_policy 等
 *      - generateDescription → short_description + description + highlights(若 description 为占位)
 *   5. 合并字段(优先 Google 真实数据 > AI 推断)
 *   6. 更新 DB,设 last_enriched_at
 *
 * 用法:
 *   pnpm enrich:google                          # 全量
 *   pnpm enrich:google -- --limit 5             # 只跑 5 个
 *   pnpm enrich:google -- --source doc          # 只跑 DOC 营地
 *   pnpm enrich:google -- --dry-run --limit 3   # 试跑
 *   pnpm enrich:google -- --no-ai               # 只拉 Google 数据,跳过 AI
 *   pnpm enrich:google -- --force-refresh       # 即使已 enriched 也重跑
 */

import pLimit from 'p-limit';
import { parseCli, progress, progressEnd } from './lib/cli.js';
import { ensureAdminClient } from './lib/supabase-admin.js';
import { JobTracker } from './lib/job-tracker.js';
import {
  findPlaceByName,
  getPlaceDetails,
  buildPhotoUrl,
  extractRegion,
  type GooglePlace,
} from './lib/sources/google.js';
import {
  TrackedOpenAI,
  analyzeReviews,
  generateDescription,
  inferLocationContext,
} from './lib/ai/index.js';
import { campToDbRow, dbRowToCamp } from './lib/db-mapper.js';
import { computeQualityScore } from './lib/quality.js';
import { matchRegion, normalizeRegion } from './lib/nz-regions.js';
import type { Camp, ReviewItem, AspectScores } from '../src/types/camp.js';

async function main() {
  const opts = parseCli();
  console.log('🌐 Google Enrichment');
  console.log(`   dry-run: ${opts.dryRun}`);
  console.log(`   no-ai:   ${opts.noAi}`);
  console.log(`   limit:   ${opts.limit ?? '(all)'}`);
  console.log(`   source:  ${opts.source ?? 'doc'}`);
  console.log('');

  const supabase = await ensureAdminClient();
  const tracker = new JobTracker({
    source: 'google-enrich',
    jobType: 'enrich',
    metadata: { ...opts },
  });

  if (!opts.dryRun) await tracker.start();

  const ai = opts.noAi ? null : TrackedOpenAI.fromEnv({ verbose: opts.verbose });

  // 拉取候选营地
  let query = supabase.from('camps').select('*').eq('source', opts.source ?? 'doc');
  if (!opts.forceRefresh) {
    query = query.is('last_enriched_at', null);
  }
  if (opts.limit) query = query.limit(opts.limit);

  const { data: rows, error } = await query;
  if (error) throw new Error(`无法读取 camps: ${error.message}`);
  if (!rows || rows.length === 0) {
    console.log('✅ 没有需要丰富的营地。退出。');
    if (!opts.dryRun) await tracker.finish({ dryRun: opts.dryRun });
    return;
  }

  console.log(`📋 待丰富 ${rows.length} 个营地\n`);

  // 控制并发(Google API 已有 limiter,这里再额外控制一层避免太多并行 AI 请求)
  const concurrent = pLimit(3);

  let processed = 0;
  const updates: any[] = [];

  await Promise.all(
    rows.map((row) =>
      concurrent(async () => {
        const camp = dbRowToCamp(row);
        try {
          const updated = await enrichOne(camp, ai, opts);
          if (updated) {
            updates.push(campToDbRow(updated));
            tracker.recordSuccess();
          } else {
            tracker.recordSkipped('no Google match');
          }
        } catch (e: any) {
          tracker.recordFailure(e.message ?? String(e), { id: camp.id, name: camp.name });
        } finally {
          processed++;
          progress(processed, rows.length, camp.name?.slice(0, 30));
        }
      })
    )
  );

  progressEnd();

  if (ai) {
    tracker.addCost(ai.getTotalCost());
    console.log(`\n💰 AI 累计成本:$${ai.getTotalCost().toFixed(4)}`);
  }

  if (opts.dryRun) {
    console.log(`\n🟡 DRY RUN — 不写库,共解析 ${updates.length} 个`);
    return;
  }

  // 批量 upsert
  console.log(`\n📝 写入 ${updates.length} 条更新...`);
  const BATCH = 50;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    const { error: upsertError } = await supabase.from('camps').upsert(batch, { onConflict: 'id' });
    if (upsertError) {
      console.error(`  ❌ 批次 ${i / BATCH + 1} 失败:`, upsertError.message);
    } else {
      console.log(`  ✓ 批次 ${i / BATCH + 1}: ${batch.length} 条`);
    }
  }

  await tracker.finish({ dryRun: opts.dryRun });
}

/**
 * 单个营地的丰富流程
 */
async function enrichOne(
  camp: Camp,
  ai: TrackedOpenAI | null,
  opts: ReturnType<typeof parseCli>
): Promise<Partial<Camp> | null> {
  // 1. 找到 Google place_id
  let placeId = camp.googlePlaceId;
  if (!placeId) {
    placeId = await findPlaceByName(`${camp.name} ${camp.region} New Zealand`, {
      biasLat: camp.lat,
      biasLng: camp.lng,
      biasRadius: 3000,
    });
  }
  if (!placeId) return null;

  // 2. 拉取详情
  const place = await getPlaceDetails(placeId);
  if (!place) return null;

  // 3. 转换 Google 数据 → Camp 字段
  const googleFields = mapGooglePlaceToFields(place);

  // 4. AI 增强
  let reviewAnalysis = null;
  let locationCtx = null;
  let descriptionGen = null;

  if (ai) {
    // 评价分析(仅当有 reviews)
    if (place.reviews && place.reviews.length > 0) {
      try {
        reviewAnalysis = await analyzeReviews(ai, camp.name, place.reviews, { dryRun: opts.dryRun });
      } catch (e) {
        console.warn(`  ⚠️ analyzeReviews 失败:${(e as Error).message}`);
      }
    }

    // 位置上下文
    try {
      locationCtx = await inferLocationContext(
        ai,
        {
          name: camp.name,
          lat: camp.lat,
          lng: camp.lng,
          address: googleFields.address ?? camp.address,
          campType: camp.campType,
        },
        { dryRun: opts.dryRun }
      );
    } catch (e) {
      console.warn(`  ⚠️ inferLocationContext 失败:${(e as Error).message}`);
    }

    // 描述(仅当现有 description 是占位或太短)
    const needDescription =
      !camp.description ||
      camp.description.length < 80 ||
      camp.description.startsWith('位于') && camp.description.length < 100;

    if (needDescription) {
      try {
        descriptionGen = await generateDescription(
          ai,
          {
            name: camp.name,
            region: camp.region,
            campType: camp.campType,
            address: googleFields.address ?? camp.address,
            knownFacilities: [...(camp.facilities ?? []), ...(reviewAnalysis?.inferred_facilities ?? [])],
            knownTags: camp.tags,
            reviewSummary: reviewAnalysis?.summary,
            pros: reviewAnalysis?.pros.map((p) => p.text),
            cons: reviewAnalysis?.cons.map((c) => c.text),
            elevationM: locationCtx?.elevation_m ?? undefined,
            nearestTown: locationCtx?.nearest_town ?? undefined,
          },
          { dryRun: opts.dryRun }
        );
      } catch (e) {
        console.warn(`  ⚠️ generateDescription 失败:${(e as Error).message}`);
      }
    }
  }

  // 5. 合并字段(优先级:Google 真实数据 > AI 推断 > 现有数据)
  const merged: Partial<Camp> = {
    id: camp.id,
    googlePlaceId: placeId,
    rating: googleFields.rating ?? camp.rating,
    ratingCount: googleFields.ratingCount ?? camp.ratingCount,
    address: googleFields.address ?? camp.address,
    phone: googleFields.phone ?? camp.phone,
    website: googleFields.website ?? camp.website,
    photos: googleFields.photos ?? camp.photos,
    photoAttribution: googleFields.photoAttribution ?? camp.photoAttribution,
    region: matchRegion(googleFields.region ?? '') ?? camp.region,
    lastEnrichedAt: new Date().toISOString(),
  };

  // 评价数据
  if (reviewAnalysis) {
    merged.reviewPros = reviewAnalysis.pros as ReviewItem[];
    merged.reviewCons = reviewAnalysis.cons as ReviewItem[];
    merged.reviewSummary = reviewAnalysis.summary;
    merged.reviewAspects = removeNullsFromAspects(reviewAnalysis.aspect_scores);

    // 合并 inferred_facilities
    if (reviewAnalysis.inferred_facilities.length > 0) {
      merged.facilities = Array.from(
        new Set([...(camp.facilities ?? []), ...reviewAnalysis.inferred_facilities])
      );
    }
  }

  // 位置上下文
  if (locationCtx) {
    if (locationCtx.nearest_town) merged.nearestTown = locationCtx.nearest_town;
    if (locationCtx.distance_to_town_km != null) merged.distanceToTownKm = locationCtx.distance_to_town_km;
    if (locationCtx.sub_region) merged.subRegion = locationCtx.sub_region;
    if (locationCtx.elevation_m != null) merged.elevationM = locationCtx.elevation_m;
    if (locationCtx.campfire_policy && !camp.campfirePolicy) {
      merged.campfirePolicy = locationCtx.campfire_policy;
    }
    if (locationCtx.pet_policy && !camp.petPolicy) {
      merged.petPolicy = locationCtx.pet_policy;
    }
  }

  // 描述
  if (descriptionGen) {
    merged.shortDescription = descriptionGen.short_description;
    merged.description = descriptionGen.description;
    merged.highlights = descriptionGen.highlights;
    if (descriptionGen.inferred_difficulty && !camp.difficulty) {
      merged.difficulty = descriptionGen.inferred_difficulty;
    }
  }

  // 重算 quality score(基于合并后字段)
  const fullCamp = { ...camp, ...merged };
  merged.dataQualityScore = computeQualityScore(fullCamp);

  return merged;
}

/**
 * Google 字段 → Camp 字段(纯映射,无 AI)
 */
function mapGooglePlaceToFields(place: GooglePlace): Partial<Camp> & {
  ratingCount?: number;
  region?: string | null;
} {
  const fields: any = {};

  if (place.rating !== undefined) fields.rating = place.rating;
  if (place.user_ratings_total !== undefined) fields.ratingCount = place.user_ratings_total;
  if (place.formatted_address) fields.address = place.formatted_address;
  if (place.formatted_phone_number) fields.phone = place.formatted_phone_number;
  if (place.website) fields.website = place.website;

  // 区域
  fields.region = extractRegion(place.address_components);

  // 图片(转换为 photo URL,Google 政策要求每月刷新)
  if (place.photos && place.photos.length > 0) {
    fields.photos = place.photos.slice(0, 10).map((p) => buildPhotoUrl(p.photo_reference, 1200));
    fields.photoAttribution = {
      google: place.photos.slice(0, 10).flatMap((p) => p.html_attributions ?? []),
    };
  }

  return fields;
}

function removeNullsFromAspects(s: Record<string, number | null>): AspectScores {
  const out: AspectScores = {};
  for (const [k, v] of Object.entries(s)) {
    if (v != null) out[k as keyof AspectScores] = v;
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
