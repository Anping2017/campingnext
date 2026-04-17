/**
 * 新西兰主要地理区域常量
 * 用于 Google Text Search 枚举,以及 region 标准化
 *
 * 顺序:北岛(北→南)→ 南岛(北→南)
 */

export interface NzRegion {
  /** 区域显示名(标准化后存入 camps.region) */
  name: string;
  /** 区域中心点(用于范围限定) */
  center: { lat: number; lng: number };
  /** 别名,用于地址解析 */
  aliases: string[];
  /** 主岛 */
  island: 'north' | 'south' | 'stewart';
}

export const NZ_REGIONS: NzRegion[] = [
  // ===== 北岛 =====
  { name: 'Northland',          center: { lat: -35.4, lng: 173.5 }, aliases: ['Far North'], island: 'north' },
  { name: 'Auckland',           center: { lat: -36.85, lng: 174.76 }, aliases: ['Auckland Region'], island: 'north' },
  { name: 'Waikato',            center: { lat: -37.78, lng: 175.28 }, aliases: ['Hamilton'], island: 'north' },
  { name: 'Coromandel',         center: { lat: -36.75, lng: 175.5 }, aliases: ['Coromandel Peninsula'], island: 'north' },
  { name: 'Bay of Plenty',      center: { lat: -37.69, lng: 176.17 }, aliases: ['Tauranga', 'Rotorua'], island: 'north' },
  { name: 'Gisborne',           center: { lat: -38.66, lng: 178.02 }, aliases: ['East Cape'], island: 'north' },
  { name: 'Hawke\'s Bay',       center: { lat: -39.49, lng: 176.91 }, aliases: ['Napier', 'Hastings'], island: 'north' },
  { name: 'Taranaki',           center: { lat: -39.06, lng: 174.07 }, aliases: ['New Plymouth', 'Mt Taranaki'], island: 'north' },
  { name: 'Manawatu-Whanganui', center: { lat: -39.95, lng: 175.51 }, aliases: ['Manawatu', 'Whanganui', 'Palmerston North'], island: 'north' },
  { name: 'Wairarapa',          center: { lat: -41.12, lng: 175.66 }, aliases: ['Masterton'], island: 'north' },
  { name: 'Wellington',         center: { lat: -41.29, lng: 174.78 }, aliases: ['Wellington Region', 'Kapiti'], island: 'north' },
  { name: 'Central North Island', center: { lat: -38.95, lng: 175.79 }, aliases: ['Tongariro', 'Taupo', 'Ruapehu'], island: 'north' },

  // ===== 南岛 =====
  { name: 'Tasman',             center: { lat: -41.27, lng: 172.87 }, aliases: ['Abel Tasman', 'Motueka'], island: 'south' },
  { name: 'Nelson',             center: { lat: -41.27, lng: 173.28 }, aliases: ['Nelson Region'], island: 'south' },
  { name: 'Marlborough',        center: { lat: -41.51, lng: 173.95 }, aliases: ['Blenheim', 'Picton', 'Marlborough Sounds'], island: 'south' },
  { name: 'West Coast',         center: { lat: -42.71, lng: 171.4 }, aliases: ['Greymouth', 'Hokitika', 'Westland'], island: 'south' },
  { name: 'Canterbury',         center: { lat: -43.53, lng: 172.64 }, aliases: ['Christchurch', 'Banks Peninsula'], island: 'south' },
  { name: 'Mackenzie',          center: { lat: -44.23, lng: 170.10 }, aliases: ['Tekapo', 'Mt Cook', 'Aoraki'], island: 'south' },
  { name: 'Otago',              center: { lat: -45.0, lng: 170.5 }, aliases: ['Dunedin', 'Wanaka', 'Queenstown'], island: 'south' },
  { name: 'Central Otago',      center: { lat: -45.05, lng: 169.36 }, aliases: ['Cromwell', 'Alexandra'], island: 'south' },
  { name: 'Fiordland',          center: { lat: -45.42, lng: 167.72 }, aliases: ['Te Anau', 'Milford', 'Doubtful Sound'], island: 'south' },
  { name: 'Southland',          center: { lat: -46.44, lng: 168.36 }, aliases: ['Invercargill', 'Catlins'], island: 'south' },

  // ===== 离岛 =====
  { name: 'Stewart Island',     center: { lat: -46.93, lng: 167.84 }, aliases: ['Rakiura'], island: 'stewart' },
];

/** 区域名 → NzRegion 映射(支持别名) */
const regionLookup = new Map<string, NzRegion>();
NZ_REGIONS.forEach((r) => {
  regionLookup.set(r.name.toLowerCase(), r);
  r.aliases.forEach((a) => regionLookup.set(a.toLowerCase(), r));
});

/**
 * 从地址或文本中匹配区域(模糊匹配)
 * @returns 标准化的区域名,匹配不到返回 null
 */
export function matchRegion(input: string): string | null {
  if (!input) return null;
  const lower = input.toLowerCase();

  // 精确匹配
  for (const [key, region] of regionLookup) {
    if (lower.includes(key)) {
      return region.name;
    }
  }

  return null;
}

/**
 * 标准化:把任意大小写/别名输入转成标准 region 名
 */
export function normalizeRegion(input: string | null | undefined): string {
  if (!input) return 'Unknown';
  const matched = matchRegion(input);
  return matched ?? input.trim();
}

/**
 * 估算坐标点最近的区域(根据中心点距离)
 */
export function inferRegionByCoord(lat: number, lng: number): string {
  let nearest = NZ_REGIONS[0];
  let minDist = Infinity;
  for (const r of NZ_REGIONS) {
    const d = haversineKm(lat, lng, r.center.lat, r.center.lng);
    if (d < minDist) {
      minDist = d;
      nearest = r;
    }
  }
  return nearest.name;
}

/** 简化的 Haversine 距离(km) */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
