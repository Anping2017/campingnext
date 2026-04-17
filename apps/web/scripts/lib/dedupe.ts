/**
 * 去重逻辑
 *
 * 三层去重策略:
 * 1. (source, source_id) 唯一(强约束,DB 索引保证)
 * 2. google_place_id 全局唯一(强约束,DB 索引保证)
 * 3. 模糊匹配:同名 + 坐标 < 500m → 视为重复(用于跨源去重)
 */

import { haversineKm } from './nz-regions.js';
import type { Camp } from '../../src/types/camp.js';

export interface DedupeCandidate {
  id: string;
  name: string;
  lat: number;
  lng: number;
  source: string;
  sourceId?: string | null;
  googlePlaceId?: string | null;
}

export interface DedupeResult {
  isDuplicate: boolean;
  reason?: 'source_id' | 'google_place_id' | 'fuzzy_match';
  matchedId?: string;
  matchedName?: string;
  /** 0-1,模糊匹配置信度 */
  confidence?: number;
}

/**
 * 检查待写入营地是否已存在
 *
 * @param incoming 待写入营地(部分字段)
 * @param existing 现有营地列表(通常从 Supabase 查询返回)
 */
export function findDuplicate(
  incoming: Pick<Camp, 'name' | 'lat' | 'lng' | 'source' | 'sourceId' | 'googlePlaceId'>,
  existing: DedupeCandidate[]
): DedupeResult {
  // 强约束 1:source + source_id
  if (incoming.sourceId) {
    const match = existing.find(
      (e) => e.source === incoming.source && e.sourceId === incoming.sourceId
    );
    if (match) {
      return {
        isDuplicate: true,
        reason: 'source_id',
        matchedId: match.id,
        matchedName: match.name,
        confidence: 1.0,
      };
    }
  }

  // 强约束 2:google_place_id
  if (incoming.googlePlaceId) {
    const match = existing.find((e) => e.googlePlaceId === incoming.googlePlaceId);
    if (match) {
      return {
        isDuplicate: true,
        reason: 'google_place_id',
        matchedId: match.id,
        matchedName: match.name,
        confidence: 1.0,
      };
    }
  }

  // 模糊匹配:同名(归一化)+ 坐标距离 < 500m
  const normalizedIncomingName = normalizeName(incoming.name);
  for (const e of existing) {
    const distKm = haversineKm(incoming.lat, incoming.lng, e.lat, e.lng);
    if (distKm < 0.5) {
      // 距离很近,检查名字相似度
      const sim = nameSimilarity(normalizedIncomingName, normalizeName(e.name));
      if (sim >= 0.7) {
        return {
          isDuplicate: true,
          reason: 'fuzzy_match',
          matchedId: e.id,
          matchedName: e.name,
          confidence: sim,
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * 归一化名字:去标点、大小写、多余空格、常见后缀
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')         // 去括号内容
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 去标点(保留中文)
    .replace(/\b(doc|department of conservation|holiday park|campground|campsite|camping ground)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 名字相似度 0-1(简化的 Jaccard token similarity)
 */
export function nameSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const tokensA = new Set(a.split(/\s+/).filter((t) => t.length > 1));
  const tokensB = new Set(b.split(/\s+/).filter((t) => t.length > 1));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersect = 0;
  for (const t of tokensA) if (tokensB.has(t)) intersect++;
  const union = tokensA.size + tokensB.size - intersect;
  return intersect / union;
}

/**
 * 生成营地 id(slug):name + region 的 url-safe slug
 * 处理冲突:加数字后缀
 */
export function generateCampId(name: string, region: string, existingIds: Set<string> = new Set()): string {
  const base = slugify(`${name} ${region}`);
  if (!existingIds.has(base)) return base;

  // 冲突,加数字后缀
  let i = 2;
  while (existingIds.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** url-safe slug,支持中英文 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // 去音标
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
