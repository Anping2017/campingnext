#!/usr/bin/env tsx
/**
 * Phase 4 入口:Google-only 营地批量采集(待人工审核)
 *
 * 流程:
 *   1. 对指定区域(--region)和关键词(--keyword,默认全套),跑 Google Text Search
 *   2. 对每个候选 place_id,去重(已有 google_place_id 跳过)
 *   3. 拉详情 + AI 增强(同 enrich-google 流程)
 *   4. 写入 status='pending',source='google'
 *   5. 等管理员后台审核 → published
 *
 * 用法:
 *   pnpm import:google -- --region Auckland --keyword "Holiday Park"
 *   pnpm import:google -- --region Otago        # 默认跑所有关键词
 *   pnpm import:google -- --dry-run --region Auckland
 *   pnpm import:google                          # 默认全区域全关键词(慢!)
 */

import pLimit from 'p-limit';
import { parseCli, progress, progressEnd } from './lib/cli.js';
import { ensureAdminClient } from './lib/supabase-admin.js';
import { JobTracker } from './lib/job-tracker.js';
import {
  searchPlaces,
  getPlaceDetails,
  buildPhotoUrl,
  extractRegion,
  inferCampTypeFromGoogle,
} from './lib/sources/google.js';
import { TrackedOpenAI, analyzeReviews, generateDescription, inferLocationContext } from './lib/ai/index.js';
import { findDuplicate, generateCampId, type DedupeCandidate } from './lib/dedupe.js';
import { campToDbRow } from './lib/db-mapper.js';
import { computeQualityScore, validateCamp } from './lib/quality.js';
import { NZ_REGIONS, matchRegion, normalizeRegion } from './lib/nz-regions.js';
import type { Camp, CampType } from '../src/types/camp.js';

// 默认搜索关键词(每个生成大约 20-60 个候选 / 区域)
const DEFAULT_KEYWORDS = [
  'Holiday Park',
  'Campground',
  'Campsite',
  'Freedom Camping',
  'Glamping',
];

async function main() {
  const opts = parseCli();
  console.log('🔎 Google-only Camp Import');
  console.log(`   region:  ${opts.region ?? '(all NZ)'}`);
  console.log(`   keyword: ${opts.keyword ?? '(default set)'}`);
  console.log(`   dry-run: ${opts.dryRun}`);
  console.log('');

  const supabase = await ensureAdminClient();
  const tracker = new JobTracker({
    source: 'google-text-search',
    jobType: 'import',
    metadata: { ...opts },
  });
  if (!opts.dryRun) await tracker.start();

  const ai = opts.noAi ? null : TrackedOpenAI.fromEnv({ verbose: opts.verbose });

  // 拉取已有营地用于去重
  const { data: existingRows } = await supabase
    .from('camps')
    .select('id, name, lat, lng, source, source_id, google_place_id');
  const existing: DedupeCandidate[] = (existingRows ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    lat: Number(r.lat),
    lng: Number(r.lng),
    source: r.source,
    sourceId: r.source_id,
    googlePlaceId: r.google_place_id,
  }));
  const existingIds = new Set(existing.map((e) => e.id));

  // 决定要跑的 region × keyword 组合
  const regions = opts.region
    ? NZ_REGIONS.filter((r) => r.name.toLowerCase() === opts.region!.toLowerCase())
    : NZ_REGIONS;
  const keywords = opts.keyword ? [opts.keyword] : DEFAULT_KEYWORDS;

  if (regions.length === 0) {
    console.error(`❌ 找不到区域 "${opts.region}"。可用列表:`);
    NZ_REGIONS.forEach((r) => console.error(`   - ${r.name}`));
    process.exit(1);
  }

  console.log(`📋 任务:${regions.length} 个区域 × ${keywords.length} 个关键词\n`);

  // 1. 先做所有 Text Search,收集候选
  const candidates: { placeId: string; query: string; region: string }[] = [];
  for (const region of regions) {
    for (const keyword of keywords) {
      const query = `${keyword} ${region.name}, New Zealand`;
      try {
        const results = await searchPlaces(query, {
          lat: region.center.lat,
          lng: region.center.lng,
          radiusM: 80000,
        });
        if (opts.limit && candidates.length >= opts.limit) break;
        for (const place of results) {
          if (!place.place_id) continue;
          candidates.push({ placeId: place.place_id, query, region: region.name });
          if (opts.limit && candidates.length >= opts.limit) break;
        }
        console.log(`  🔍 ${region.name} / "${keyword}": ${results.length} 个候选`);
      } catch (e: any) {
        tracker.recordFailure(`searchPlaces failed: ${e.message}`, { query });
      }
    }
  }

  // 去重 placeId
  const uniquePlaceIds = Array.from(new Map(candidates.map((c) => [c.placeId, c])).values());
  console.log(`\n📦 共 ${uniquePlaceIds.length} 个唯一候选 place_id\n`);

  if (uniquePlaceIds.length === 0) {
    console.log('  没有候选,退出。');
    if (!opts.dryRun) await tracker.finish({ dryRun: opts.dryRun });
    return;
  }

  // 2. 对每个候选拉详情 + AI 增强 + 去重写库
  const concurrent = pLimit(3);
  const newCamps: any[] = [];
  let processed = 0;

  await Promise.all(
    uniquePlaceIds.map((cand) =>
      concurrent(async () => {
        try {
          // 第一层去重:google_place_id
          const dup0 = existing.find((e) => e.googlePlaceId === cand.placeId);
          if (dup0) {
            tracker.recordSkipped(`google_place_id duplicate: ${dup0.name}`, { placeId: cand.placeId });
            return;
          }

          // 拉详情
          const place = await getPlaceDetails(cand.placeId);
          if (!place) {
            tracker.recordSkipped('no details', { placeId: cand.placeId });
            return;
          }

          const lat = place.geometry?.location?.lat;
          const lng = place.geometry?.location?.lng;
          if (lat === undefined || lng === undefined) {
            tracker.recordSkipped('missing coords', { name: place.name });
            return;
          }

          // 基础映射
          const region = matchRegion(extractRegion(place.address_components) ?? '') ?? cand.region;
          const campType = inferCampTypeFromGoogle(place.types, place.name) ?? 'private_campground';
          const id = generateCampId(place.name, region, existingIds);
          existingIds.add(id);

          const camp: Partial<Camp> = {
            id,
            name: place.name,
            slug: id,
            source: 'google',
            sourceId: place.place_id,
            googlePlaceId: place.place_id,
            status: 'pending',                // 等审核
            lat,
            lng,
            region,
            address: place.formatted_address,
            countryCode: 'NZ',
            campType,
            difficulty: 'easy',
            description: '', // AI 会生成
            price: place.price_level !== undefined && place.price_level >= 3 ? 'expensive' : 'medium',
            facilities: [],
            tags: [],
            rating: place.rating ?? 0,
            ratingCount: place.user_ratings_total,
            phone: place.formatted_phone_number,
            website: place.website,
            photos: place.photos
              ?.slice(0, 10)
              .map((p) => buildPhotoUrl(p.photo_reference, 1200)),
            photoAttribution: {
              google: place.photos?.slice(0, 10).flatMap((p) => p.html_attributions ?? []),
            },
            rawData: place,
            importedAt: new Date().toISOString(),
          };

          // 模糊去重
          const dup = findDuplicate(
            { name: camp.name!, lat: camp.lat!, lng: camp.lng!, source: 'google', googlePlaceId: place.place_id },
            existing
          );
          if (dup.isDuplicate) {
            tracker.recordSkipped(`fuzzy duplicate: ${dup.matchedName}`, { incoming: camp.name });
            return;
          }

          // AI 增强
          if (ai) {
            // 评价分析
            let reviewSummary: string | undefined;
            let pros: string[] | undefined;
            let cons: string[] | undefined;

            if (place.reviews && place.reviews.length > 0) {
              const analysis = await analyzeReviews(ai, camp.name!, place.reviews, { dryRun: opts.dryRun });
              if (analysis) {
                camp.reviewPros = analysis.pros as any;
                camp.reviewCons = analysis.cons as any;
                camp.reviewSummary = analysis.summary;
                camp.reviewAspects = removeNulls(analysis.aspect_scores);
                camp.facilities = analysis.inferred_facilities;
                reviewSummary = analysis.summary;
                pros = analysis.pros.map((p) => p.text);
                cons = analysis.cons.map((c) => c.text);
              }
            }

            // 位置上下文
            const locCtx = await inferLocationContext(
              ai,
              { name: camp.name!, lat: camp.lat!, lng: camp.lng!, address: camp.address, campType },
              { dryRun: opts.dryRun }
            );
            if (locCtx) {
              if (locCtx.nearest_town) camp.nearestTown = locCtx.nearest_town;
              if (locCtx.distance_to_town_km != null) camp.distanceToTownKm = locCtx.distance_to_town_km;
              if (locCtx.sub_region) camp.subRegion = locCtx.sub_region;
              if (locCtx.elevation_m != null) camp.elevationM = locCtx.elevation_m;
              if (locCtx.campfire_policy) camp.campfirePolicy = locCtx.campfire_policy;
              if (locCtx.pet_policy) camp.petPolicy = locCtx.pet_policy;
            }

            // 描述
            const desc = await generateDescription(
              ai,
              {
                name: camp.name!,
                region: camp.region!,
                campType,
                address: camp.address,
                knownFacilities: camp.facilities,
                reviewSummary,
                pros,
                cons,
                elevationM: camp.elevationM,
                nearestTown: camp.nearestTown,
              },
              { dryRun: opts.dryRun }
            );
            if (desc) {
              camp.shortDescription = desc.short_description;
              camp.description = desc.description;
              camp.highlights = desc.highlights;
              camp.difficulty = desc.inferred_difficulty;
            }
          }

          // fallback description(若无 AI 或 AI 失败)
          if (!camp.description || camp.description.length < 20) {
            camp.description = `位于 ${camp.region} 的${campType.replace(/_/g, ' ')}营地`;
          }

          // 验证
          const errors = validateCamp(camp);
          if (errors.length) {
            tracker.recordFailure(`validation: ${errors.join('; ')}`, {
              name: camp.name,
              placeId: place.place_id,
            });
            return;
          }

          camp.dataQualityScore = computeQualityScore(camp);
          newCamps.push(campToDbRow(camp));

          // 添加到 existing 避免本批次内重复
          existing.push({
            id: camp.id!,
            name: camp.name!,
            lat: camp.lat!,
            lng: camp.lng!,
            source: 'google',
            sourceId: place.place_id,
            googlePlaceId: place.place_id,
          });

          tracker.recordSuccess();
        } catch (e: any) {
          tracker.recordFailure(e.message ?? String(e), { placeId: cand.placeId });
        } finally {
          processed++;
          progress(processed, uniquePlaceIds.length, '');
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
    console.log(`\n🟡 DRY RUN — 不写库,共解析 ${newCamps.length} 个新营地`);
    newCamps.slice(0, 3).forEach((c, i) => {
      console.log(`\n[${i + 1}] ${c.name} (${c.region}, ${c.camp_type})`);
      console.log(`    short: ${c.short_description?.slice(0, 60)}`);
      console.log(`    quality: ${c.data_quality_score}`);
    });
    return;
  }

  // 写入(status='pending')
  console.log(`\n📝 写入 ${newCamps.length} 条 pending 营地...`);
  const BATCH = 50;
  for (let i = 0; i < newCamps.length; i += BATCH) {
    const batch = newCamps.slice(i, i + BATCH);
    const { error } = await supabase.from('camps').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ 批次 ${i / BATCH + 1} 失败:`, error.message);
    } else {
      console.log(`  ✓ 批次 ${i / BATCH + 1}: ${batch.length} 条`);
    }
  }

  await tracker.finish({ dryRun: opts.dryRun });
  console.log('\n✅ 完成。请到管理后台审核 pending 营地。');
}

function removeNulls(s: Record<string, number | null>): any {
  const out: any = {};
  for (const [k, v] of Object.entries(s)) {
    if (v != null) out[k] = v;
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
