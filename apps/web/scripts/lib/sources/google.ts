/**
 * Google Places API 客户端
 *
 * 包装:
 *   - findplacefromtext (按名搜索)
 *   - textsearch (按区域 + 关键词搜索)
 *   - place/details (详情)
 *   - place/photo (图片 URL)
 *
 * 限流:Bottleneck(默认 10 QPS,Google 配额内)
 * 重试:p-retry(3 次指数退避)
 *
 * 配置:GOOGLE_MAPS_API_KEY(.env.local)
 */

import Bottleneck from 'bottleneck';
import pRetry from 'p-retry';

const API_BASE = 'https://maps.googleapis.com/maps/api/place';

const limiter = new Bottleneck({
  minTime: 100, // 100ms 间隔 = 10 QPS
  maxConcurrent: 5,
});

function getApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      'GOOGLE_MAPS_API_KEY 未配置(在 apps/web/.env.local)。' +
        '获取方式:https://console.cloud.google.com/google/maps-apis'
    );
  }
  return key;
}

// =============================================================================
// 类型(只列我们用得上的字段)
// =============================================================================

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;                         // Google Maps URL
  types?: string[];
  reviews?: GoogleReview[];
  photos?: GooglePhoto[];
  opening_hours?: { weekday_text?: string[]; open_now?: boolean };
  price_level?: number;                 // 0-4
  business_status?: string;
  address_components?: GoogleAddrComp[];
}

export interface GoogleReview {
  author_name?: string;
  rating: number;
  text?: string;
  language?: string;
  time?: number;
  relative_time_description?: string;
}

export interface GooglePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions?: string[];
}

export interface GoogleAddrComp {
  long_name: string;
  short_name: string;
  types: string[];
}

// =============================================================================
// 操作函数
// =============================================================================

/**
 * 按文本搜索单个地点(返回 place_id)
 */
export async function findPlaceByName(
  name: string,
  opts: { biasLat?: number; biasLng?: number; biasRadius?: number } = {}
): Promise<string | null> {
  const key = getApiKey();
  const params = new URLSearchParams({
    input: name,
    inputtype: 'textquery',
    fields: 'place_id',
    key,
  });
  if (opts.biasLat !== undefined && opts.biasLng !== undefined) {
    params.set(
      'locationbias',
      `circle:${opts.biasRadius ?? 5000}@${opts.biasLat},${opts.biasLng}`
    );
  }

  const url = `${API_BASE}/findplacefromtext/json?${params.toString()}`;
  return limiter.schedule(() =>
    pRetry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`findPlace HTTP ${res.status}`);
        const data = (await res.json()) as any;
        if (data.status === 'ZERO_RESULTS') return null;
        if (data.status !== 'OK') throw new Error(`findPlace: ${data.status} ${data.error_message ?? ''}`);
        return data.candidates?.[0]?.place_id ?? null;
      },
      { retries: 3, minTimeout: 1000, factor: 2 }
    )
  );
}

/**
 * 按文本 + 区域搜索一组地点(返回 place 列表)
 *
 * 用于 import-google-camps 脚本,通过 "Holiday Park Auckland" 等查询批量获取候选。
 */
export async function searchPlaces(
  query: string,
  opts: { lat?: number; lng?: number; radiusM?: number } = {}
): Promise<GooglePlace[]> {
  const key = getApiKey();
  const params = new URLSearchParams({
    query,
    key,
  });
  if (opts.lat !== undefined && opts.lng !== undefined) {
    params.set('location', `${opts.lat},${opts.lng}`);
    params.set('radius', String(opts.radiusM ?? 50000));
  }
  const url = `${API_BASE}/textsearch/json?${params.toString()}`;

  return limiter.schedule(() =>
    pRetry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`searchPlaces HTTP ${res.status}`);
        const data = (await res.json()) as any;
        if (data.status === 'ZERO_RESULTS') return [];
        if (data.status !== 'OK')
          throw new Error(`searchPlaces: ${data.status} ${data.error_message ?? ''}`);
        return (data.results ?? []) as GooglePlace[];
      },
      { retries: 3, minTimeout: 1000, factor: 2 }
    )
  );
}

/**
 * 拉取某个 place_id 的详情
 */
export async function getPlaceDetails(placeId: string, lang = 'zh-CN'): Promise<GooglePlace | null> {
  const key = getApiKey();
  // fields 越多越贵,这里把所有需要的一次拿全
  const fields = [
    'name',
    'formatted_address',
    'address_components',
    'geometry',
    'rating',
    'user_ratings_total',
    'formatted_phone_number',
    'international_phone_number',
    'website',
    'url',
    'types',
    'reviews',
    'photos',
    'opening_hours',
    'price_level',
    'business_status',
  ].join(',');

  const params = new URLSearchParams({
    place_id: placeId,
    fields,
    key,
    language: lang,
  });
  const url = `${API_BASE}/details/json?${params.toString()}`;

  return limiter.schedule(() =>
    pRetry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`getPlaceDetails HTTP ${res.status}`);
        const data = (await res.json()) as any;
        if (data.status === 'NOT_FOUND') return null;
        if (data.status !== 'OK')
          throw new Error(`getPlaceDetails: ${data.status} ${data.error_message ?? ''}`);
        return data.result as GooglePlace;
      },
      { retries: 3, minTimeout: 1000, factor: 2 }
    )
  );
}

/**
 * 把 photo_reference 转为可访问的图片 URL
 *
 * 注意:返回的是包含 API key 的 URL,Google Photos 政策要求每月刷新。
 */
export function buildPhotoUrl(photoReference: string, maxWidth = 1200): string {
  const key = getApiKey();
  return `${API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${encodeURIComponent(photoReference)}&key=${key}`;
}

/**
 * 从 address_components 提取行政区域信息
 */
export function extractRegion(components?: GoogleAddrComp[]): string | null {
  if (!components) return null;
  const adminLevel1 = components.find((c) => c.types.includes('administrative_area_level_1'));
  if (adminLevel1) return adminLevel1.long_name;
  const locality = components.find((c) => c.types.includes('locality'));
  if (locality) return locality.long_name;
  return null;
}

/**
 * 从 Google place types 推断营地类型
 */
export function inferCampTypeFromGoogle(
  types: string[] | undefined,
  name: string
): import('../../../src/types/camp.js').CampType | undefined {
  const t = types?.join(' ').toLowerCase() ?? '';
  const n = name.toLowerCase();

  if (n.includes('holiday park') || n.includes('top 10')) return 'holiday_park';
  if (n.includes('glamping') || n.includes('luxury')) return 'glamping';
  if (n.includes('farm stay') || n.includes('farmstay')) return 'farm_stay';
  if (n.includes('freedom camp')) return 'freedom_camping';

  if (t.includes('campground') || t.includes('rv_park')) {
    return 'private_campground';
  }
  if (t.includes('lodging') || t.includes('park')) {
    return 'local_camp';
  }

  return undefined;
}
