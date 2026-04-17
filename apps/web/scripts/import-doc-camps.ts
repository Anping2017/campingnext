#!/usr/bin/env tsx
/**
 * Phase 2 入口:DOC 官方营地批量导入
 *
 * 流程:
 *   1. 调用 DOC ArcGIS API,拉取所有 campsites GeoJSON
 *   2. 字段映射 → Camp 对象
 *   3. 去重检查(source+source_id 唯一)
 *   4. 批量写入 Supabase(status='published',source='doc')
 *   5. 记录到 import_jobs 表
 *
 * 用法:
 *   pnpm import:doc                  # 实跑
 *   pnpm import:doc -- --dry-run     # 试跑,不写库
 *   pnpm import:doc -- --limit 10    # 只处理前 10 条
 *   pnpm import:doc -- --verbose     # 详细日志
 */

import { parseCli, progress, progressEnd } from './lib/cli.js';
import { ensureAdminClient } from './lib/supabase-admin.js';
import { JobTracker } from './lib/job-tracker.js';
import { fetchAllDocCampsites, mapDocFeatureToCamp } from './lib/sources/doc.js';
import { findDuplicate, type DedupeCandidate } from './lib/dedupe.js';
import { validateCamp } from './lib/quality.js';
import { campToDbRow } from './lib/db-mapper.js';

async function main() {
  const opts = parseCli();
  console.log('🏕  DOC Campsites Import');
  console.log(`   dry-run: ${opts.dryRun}`);
  console.log(`   limit:   ${opts.limit ?? '(all)'}`);
  console.log('');

  // 1. 健康检查
  const supabase = await ensureAdminClient();
  const tracker = new JobTracker({
    source: 'doc',
    jobType: 'import',
    metadata: { dryRun: opts.dryRun, limit: opts.limit, cli: process.argv.slice(2).join(' ') },
  });

  if (!opts.dryRun) {
    await tracker.start();
  }

  try {
    // 2. 拉取 DOC 数据
    const features = await fetchAllDocCampsites({ limit: opts.limit });
    console.log(`✅ 拉取完成,共 ${features.length} 条 DOC 营地\n`);

    // 3. 拉取已有营地用于去重
    const { data: existingRows } = await supabase
      .from('camps')
      .select('id, name, lat, lng, source, source_id, google_place_id');
    const existing: DedupeCandidate[] =
      (existingRows ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        lat: Number(r.lat),
        lng: Number(r.lng),
        source: r.source,
        sourceId: r.source_id,
        googlePlaceId: r.google_place_id,
      })) ?? [];

    const existingIds = new Set(existing.map((e) => e.id));

    // 4. 字段映射 + 去重 + 批量写入
    console.log('🔄 转换并写入...');
    const camps: any[] = [];

    for (let i = 0; i < features.length; i++) {
      const camp = mapDocFeatureToCamp(features[i], existingIds);

      // 验证
      const errors = validateCamp(camp);
      if (errors.length) {
        tracker.recordFailure(`字段验证失败: ${errors.join('; ')}`, {
          name: camp.name,
          sourceId: camp.sourceId,
        });
        continue;
      }

      // 去重
      const dup = findDuplicate(camp as any, existing);
      if (dup.isDuplicate) {
        tracker.recordSkipped(`duplicate: ${dup.reason} → ${dup.matchedName}`, {
          incoming: camp.name,
          matchedId: dup.matchedId,
        });
        continue;
      }

      camps.push(campToDbRow(camp as any));
      progress(i + 1, features.length, camp.name?.slice(0, 30));
    }
    progressEnd();

    console.log(`\n📦 准备写入 ${camps.length} 条新营地(skipped ${tracker['counters'].skipped})\n`);

    if (opts.dryRun) {
      console.log('🟡 DRY RUN — 不实际写库。前 3 条预览:');
      camps.slice(0, 3).forEach((c, i) => {
        console.log(`\n[${i + 1}] ${c.name} (${c.region})`);
        console.log(`    type=${c.camp_type} price=${c.price} difficulty=${c.difficulty}`);
        console.log(`    facilities=${(c.facilities ?? []).join(',')}`);
        console.log(`    tags=${(c.tags ?? []).join(',')}`);
        console.log(`    quality=${c.data_quality_score}`);
      });
      console.log('\n✅ DRY RUN 完成');
      return;
    }

    // 分批 upsert(每批 100 条,避免请求过大)
    const BATCH = 100;
    for (let i = 0; i < camps.length; i += BATCH) {
      const batch = camps.slice(i, i + BATCH);
      const { data, error } = await supabase.from('camps').upsert(batch, { onConflict: 'id' }).select('id');
      if (error) {
        console.error(`❌ 批次 ${i / BATCH + 1} 失败:`, error.message);
        batch.forEach((c) =>
          tracker.recordFailure(`upsert failed: ${error.message}`, { id: c.id, name: c.name })
        );
      } else {
        (data ?? []).forEach(() => tracker.recordSuccess());
        console.log(`  ✓ 批次 ${i / BATCH + 1}: ${batch.length} 条写入`);
      }
    }
  } catch (err: any) {
    console.error('💥 致命错误:', err);
    tracker.recordFailure(`fatal: ${err.message ?? String(err)}`);
    throw err;
  } finally {
    if (!opts.dryRun) {
      await tracker.finish({ dryRun: opts.dryRun });
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
