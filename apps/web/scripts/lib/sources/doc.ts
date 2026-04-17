/**
 * DOC(新西兰自然保护部)营地数据源
 *
 * 数据来源:
 *   - 官方 ArcGIS Open Data Portal:
 *     https://doc-deptconservation.opendata.arcgis.com/datasets/c417dcd7c9fb47b489df1f9f0a673190_0
 *   - 数据通过 ArcGIS REST FeatureServer 提供 GeoJSON 格式
 *   - 授权:CC BY 4.0(必须署名)
 *   - 更新频率:每周
 *
 * 配置(可在 .env.local 覆盖):
 *   DOC_CAMPSITES_API_URL  ArcGIS FeatureServer query 端点(默认见下方)
 *
 * 如默认 URL 失效,从 DOC Portal 数据集页面获取:
 *   1. 打开 https://doc-deptconservation.opendata.arcgis.com/datasets/c417dcd7c9fb47b489df1f9f0a673190_0
 *   2. 点击 "View Full Details" → "API" 标签
 *   3. 复制 GeoJSON URL,加上 `?where=1=1&outFields=*&f=geojson&outSR=4326`
 */

import { matchRegion, normalizeRegion, inferRegionByCoord } from '../nz-regions.js';
import type { Camp, CampType } from '../../../src/types/camp.js';
import { slugify, generateCampId } from '../dedupe.js';
import { computeQualityScore } from '../quality.js';

const DEFAULT_DOC_API_URL =
  'https://services.arcgis.com/aKxrz4j2cyDCP3Jv/arcgis/rest/services/DOC_Public_Conservation_Land_Campsites/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326';

// =============================================================================
// DOC GeoJSON 类型(实际响应可能字段更多,这里只列我们用得上的)
// =============================================================================

export interface DocFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  properties: {
    OBJECTID?: number;
    AssetID?: string | number;          // 主要 ID
    Name?: string;
    Region?: string;
    Place?: string;                     // 子区域
    Category?: string;                  // Standard / Basic / Serviced / Backcountry
    Type?: string;
    Facilities?: string;                // 文本,如 "Toilet, Water"
    Activities?: string;
    DocURL?: string;
    PageURL?: string;
    Url?: string;
    Description?: string;
    LongDescription?: string;
    BookingsRequired?: string | boolean;
    BookingURL?: string;
    Cost?: string;                      // 文本,如 "Free", "$15 per adult"
    Capacity?: number;
    NumberSites?: number;
    PoweredSites?: number;
    NonPoweredSites?: number;
    DogsAllowed?: string | boolean;
    AccessByVehicle?: string | boolean;
    AccessByBoat?: string | boolean;
    AccessByPlane?: string | boolean;
    SeasonalRestrictions?: string;
    [key: string]: unknown;             // 其他未知字段保留
  };
}

export interface DocFeatureCollection {
  type: 'FeatureCollection';
  features: DocFeature[];
  exceededTransferLimit?: boolean;
}

// =============================================================================
// API 调用
// =============================================================================

/**
 * 从 DOC API 抓取所有 campsites
 *
 * 注意:ArcGIS 默认有 maxRecordCount(通常 1000-2000),如果 exceededTransferLimit=true
 * 需要分页(用 resultOffset)。这里实现自动分页。
 */
export async function fetchAllDocCampsites(opts: { url?: string; limit?: number } = {}): Promise<DocFeature[]> {
  const baseUrl = opts.url ?? process.env.DOC_CAMPSITES_API_URL ?? DEFAULT_DOC_API_URL;
  console.log(`📡 拉取 DOC 数据:${baseUrl}`);

  const all: DocFeature[] = [];
  let offset = 0;
  const pageSize = 2000;

  while (true) {
    const sep = baseUrl.includes('?') ? '&' : '?';
    const pagedUrl = `${baseUrl}${sep}resultOffset=${offset}&resultRecordCount=${pageSize}`;
    const res = await fetch(pagedUrl);
    if (!res.ok) {
      throw new Error(`DOC API 失败:${res.status} ${res.statusText} (${pagedUrl})`);
    }
    const data = (await res.json()) as DocFeatureCollection;
    if (!data.features || data.features.length === 0) break;
    all.push(...data.features);
    console.log(`  ↳ 累计 ${all.length} 条`);

    if (opts.limit && all.length >= opts.limit) {
      return all.slice(0, opts.limit);
    }

    if (!data.exceededTransferLimit) break;
    offset += data.features.length;
    if (data.features.length < pageSize) break;
  }

  return all;
}

// =============================================================================
// 字段映射 DOC → Camp
// =============================================================================

/**
 * 将 DOC GeoJSON feature 映射为 Camp 对象(部分填充,后续 enrich 阶段可继续补)
 */
export function mapDocFeatureToCamp(
  feature: DocFeature,
  existingIds: Set<string> = new Set()
): Partial<Camp> & { source: 'doc'; sourceId: string } {
  const p = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;
  const name = (p.Name as string) || 'Unknown DOC Camp';
  const sourceId = String(p.AssetID ?? p.OBJECTID ?? slugify(name));

  // region 优先用 properties.Region,否则按坐标推断
  const region = matchRegion(p.Region as string) ?? inferRegionByCoord(lat, lng);

  // 营地类型映射
  const campType = mapDocCategoryToCampType(p.Category, p.Type);

  // 价格:DOC Cost 字段通常是 "Free" 或 "$X per adult"
  const { price, pricePerNightNzd, priceUnit, priceNotes } = parseDocCost(p.Cost);

  // 设施:DOC Facilities 字段是逗号分隔文本
  const facilities = parseDocFacilities(p.Facilities);

  // 标签:DOC Activities 字段
  const tags = parseDocActivities(p.Activities, region);

  // 预订
  const bookingRequired = parseBoolean(p.BookingsRequired);
  const bookingUrl = (p.BookingURL as string) || undefined;

  // 宠物
  const petPolicy = parsePetPolicy(p.DogsAllowed);

  // 容量
  const totalSites = (p.NumberSites as number) ?? (p.Capacity as number) ?? undefined;
  const poweredSitesAvailable = (p.PoweredSites as number) > 0 ? true : undefined;

  // ID(slug)
  const id = generateCampId(name, region, existingIds);
  existingIds.add(id);

  // 描述初版(如果 DOC 有 Description 字段就用,否则留空等 AI 生成)
  const description =
    (p.LongDescription as string) ||
    (p.Description as string) ||
    `位于 ${region} 的 DOC 营地。`; // 占位,后续 AI enrich 时会替换

  // 难度初版:Backcountry / Basic 算 medium,其他 easy
  const difficulty: Camp['difficulty'] =
    p.Category === 'Backcountry' || p.Category === 'Basic' ? 'medium' : 'easy';

  const camp: Partial<Camp> & { source: 'doc'; sourceId: string } = {
    id,
    name,
    slug: id,
    source: 'doc',
    sourceId,
    status: 'published',                 // DOC 数据可信,自动发布
    lat,
    lng,
    region,
    address: (p.Place as string) || undefined,
    countryCode: 'NZ',
    campType,
    difficulty,
    description,
    price,
    pricePerNightNzd,
    priceUnit,
    priceNotes,
    facilities,
    tags,
    totalSites,
    poweredSitesAvailable,
    bookingRequired,
    bookingUrl,
    petPolicy,
    rating: 0,                            // 后续 Google enrich 阶段填
    rawData: feature,                     // 完整原始 payload 留底
    importedAt: new Date().toISOString(),
  };

  // 自动算 quality score
  camp.dataQualityScore = computeQualityScore(camp);

  return camp;
}

// =============================================================================
// 解析辅助函数
// =============================================================================

function mapDocCategoryToCampType(category?: string, type?: string): CampType {
  const normalized = `${category ?? ''} ${type ?? ''}`.toLowerCase();
  if (normalized.includes('serviced')) return 'doc_serviced';
  if (normalized.includes('basic') || normalized.includes('backcountry')) return 'doc_basic';
  return 'doc_standard';
}

function parseDocCost(cost?: string): {
  price: Camp['price'];
  pricePerNightNzd?: number;
  priceUnit?: Camp['priceUnit'];
  priceNotes?: string;
} {
  if (!cost) return { price: 'cheap' };

  const lower = cost.toLowerCase();
  if (lower.includes('free') || lower.includes('no charge') || cost === '0') {
    return { price: 'free', pricePerNightNzd: 0 };
  }

  // 提取数字
  const match = cost.match(/\$?\s*(\d+(?:\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    let priceCategory: Camp['price'] = 'medium';
    if (num === 0) priceCategory = 'free';
    else if (num <= 15) priceCategory = 'cheap';
    else if (num <= 30) priceCategory = 'medium';
    else priceCategory = 'expensive';

    let unit: Camp['priceUnit'] = 'per_person';
    if (lower.includes('site')) unit = 'per_site';
    else if (lower.includes('vehicle')) unit = 'per_vehicle';

    return {
      price: priceCategory,
      pricePerNightNzd: num,
      priceUnit: unit,
      priceNotes: cost,
    };
  }

  return { price: 'cheap', priceNotes: cost };
}

const DOC_FACILITY_KEYWORDS: Record<string, string[]> = {
  toilet: ['toilet', 'loo', 'wc'],
  water: ['water', 'tap'],
  shower: ['shower'],
  kitchen: ['kitchen', 'cooking shelter'],
  power: ['power', 'electric'],
  shop: ['shop', 'store'],
  parking: ['parking', 'car park'],
  trash: ['rubbish', 'trash', 'waste'],
  'fire-pit': ['fire pit', 'fireplace', 'firewood'],
  bbq: ['bbq', 'barbecue', 'grill'],
};

function parseDocFacilities(text?: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const result: string[] = [];
  for (const [id, keywords] of Object.entries(DOC_FACILITY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      result.push(id);
    }
  }
  return result;
}

const DOC_ACTIVITY_KEYWORDS: Record<string, string[]> = {
  hiking: ['walking', 'hiking', 'tramping', 'trail', 'track'],
  fishing: ['fishing'],
  kayaking: ['kayak', 'canoe', 'paddling'],
  stargazing: ['stargazing', 'dark sky'],
  beach: ['beach', 'coastal', 'shore'],
  lake: ['lake', 'lakeside'],
  river: ['river', 'stream'],
  mountain: ['mountain', 'alpine'],
  forest: ['forest', 'bush'],
};

function parseDocActivities(text?: string, region?: string): string[] {
  const tags = new Set<string>();
  if (text) {
    const lower = text.toLowerCase();
    for (const [id, keywords] of Object.entries(DOC_ACTIVITY_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) tags.add(id);
    }
  }
  // 区域常识:Fiordland → mountain + forest
  if (region) {
    const r = region.toLowerCase();
    if (r.includes('fiordland') || r.includes('mackenzie')) {
      tags.add('mountain');
    }
    if (r.includes('coromandel') || r.includes('northland')) {
      tags.add('beach');
    }
  }
  return Array.from(tags);
}

function parseBoolean(v: unknown): boolean | undefined {
  if (v === true || v === false) return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    if (['yes', 'true', 'y', '1'].includes(s)) return true;
    if (['no', 'false', 'n', '0'].includes(s)) return false;
  }
  return undefined;
}

function parsePetPolicy(v: unknown): Camp['petPolicy'] {
  const b = parseBoolean(v);
  if (b === true) return 'leashed-only';
  if (b === false) return 'not-allowed';
  return undefined;
}
