/**
 * Camp 类型(camelCase, TS) ↔ camps 表(snake_case, DB)的字段映射
 *
 * 规则:
 *   - 数组/JSONB 字段保持原样
 *   - 时间戳序列化为 ISO 字符串
 *   - undefined 不写入(让 DB 用默认值或保持现有)
 */

import type { Camp } from '../../src/types/camp.js';

/**
 * Camp(TS)→ DB row(snake_case)
 * 用于 upsert 时
 */
export function campToDbRow(camp: Partial<Camp>): Record<string, any> {
  const row: Record<string, any> = {};

  // 标识
  if (camp.id !== undefined) row.id = camp.id;
  if (camp.name !== undefined) row.name = camp.name;
  if (camp.slug !== undefined) row.slug = camp.slug;

  // 多源
  if (camp.source !== undefined) row.source = camp.source;
  if (camp.sourceId !== undefined) row.source_id = camp.sourceId;
  if (camp.googlePlaceId !== undefined) row.google_place_id = camp.googlePlaceId;
  if (camp.status !== undefined) row.status = camp.status;
  if (camp.rawData !== undefined) row.raw_data = camp.rawData;

  // 地理
  if (camp.lat !== undefined) row.lat = camp.lat;
  if (camp.lng !== undefined) row.lng = camp.lng;
  if (camp.elevationM !== undefined) row.elevation_m = camp.elevationM;
  if (camp.region !== undefined) row.region = camp.region;
  if (camp.subRegion !== undefined) row.sub_region = camp.subRegion;
  if (camp.nearestTown !== undefined) row.nearest_town = camp.nearestTown;
  if (camp.distanceToTownKm !== undefined) row.distance_to_town_km = camp.distanceToTownKm;
  if (camp.address !== undefined) row.address = camp.address;
  if (camp.countryCode !== undefined) row.country_code = camp.countryCode;

  // 分类
  if (camp.campType !== undefined) row.camp_type = camp.campType;
  if (camp.difficulty !== undefined) row.difficulty = camp.difficulty;

  // 描述
  if (camp.shortDescription !== undefined) row.short_description = camp.shortDescription;
  if (camp.description !== undefined) row.description = camp.description;
  if (camp.highlights !== undefined) row.highlights = camp.highlights;

  // 价格
  if (camp.price !== undefined) row.price = camp.price;
  if (camp.pricePerNightNzd !== undefined) row.price_per_night_nzd = camp.pricePerNightNzd;
  if (camp.priceUnit !== undefined) row.price_unit = camp.priceUnit;
  if (camp.priceNotes !== undefined) row.price_notes = camp.priceNotes;

  // 容量
  if (camp.totalSites !== undefined) row.total_sites = camp.totalSites;
  if (camp.tentFriendly !== undefined) row.tent_friendly = camp.tentFriendly;
  if (camp.campervanFriendly !== undefined) row.campervan_friendly = camp.campervanFriendly;
  if (camp.poweredSitesAvailable !== undefined) row.powered_sites_available = camp.poweredSitesAvailable;
  if (camp.cabinAvailable !== undefined) row.cabin_available = camp.cabinAvailable;
  if (camp.maxStayNights !== undefined) row.max_stay_nights = camp.maxStayNights;

  // 设施/标签
  if (camp.facilities !== undefined) row.facilities = camp.facilities;
  if (camp.tags !== undefined) row.tags = camp.tags;

  // 季节
  if (camp.yearRound !== undefined) row.year_round = camp.yearRound;
  if (camp.seasonOpenMonth !== undefined) row.season_open_month = camp.seasonOpenMonth;
  if (camp.seasonCloseMonth !== undefined) row.season_close_month = camp.seasonCloseMonth;

  // 政策
  if (camp.bookingRequired !== undefined) row.booking_required = camp.bookingRequired;
  if (camp.bookingUrl !== undefined) row.booking_url = camp.bookingUrl;
  if (camp.petPolicy !== undefined) row.pet_policy = camp.petPolicy;
  if (camp.campfirePolicy !== undefined) row.campfire_policy = camp.campfirePolicy;
  if (camp.alcoholAllowed !== undefined) row.alcohol_allowed = camp.alcoholAllowed;

  // 评价
  if (camp.rating !== undefined) row.rating = camp.rating;
  if (camp.ratingCount !== undefined) row.rating_count = camp.ratingCount;
  if (camp.reviewPros !== undefined) row.review_pros = camp.reviewPros;
  if (camp.reviewCons !== undefined) row.review_cons = camp.reviewCons;
  if (camp.reviewSummary !== undefined) row.review_summary = camp.reviewSummary;
  if (camp.reviewAspects !== undefined) row.review_aspects = camp.reviewAspects;

  // 联系
  if (camp.phone !== undefined) row.phone = camp.phone;
  if (camp.email !== undefined) row.email = camp.email;
  if (camp.website !== undefined) row.website = camp.website;

  // 资源
  if (camp.photos !== undefined) row.photos = camp.photos;
  if (camp.photoAttribution !== undefined) row.photo_attribution = camp.photoAttribution;

  // 元数据
  if (camp.dataQualityScore !== undefined) row.data_quality_score = camp.dataQualityScore;
  if (camp.importedAt !== undefined) row.imported_at = camp.importedAt;
  if (camp.lastEnrichedAt !== undefined) row.last_enriched_at = camp.lastEnrichedAt;
  if (camp.lastVerifiedAt !== undefined) row.last_verified_at = camp.lastVerifiedAt;

  return row;
}

/**
 * DB row(snake_case)→ Camp(TS)
 * 用于读取后返回前端
 */
export function dbRowToCamp(row: Record<string, any>): Camp {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? undefined,

    source: row.source,
    sourceId: row.source_id ?? undefined,
    googlePlaceId: row.google_place_id ?? undefined,
    status: row.status,
    rawData: row.raw_data ?? undefined,

    lat: typeof row.lat === 'string' ? parseFloat(row.lat) : row.lat,
    lng: typeof row.lng === 'string' ? parseFloat(row.lng) : row.lng,
    elevationM: row.elevation_m ?? undefined,
    region: row.region,
    subRegion: row.sub_region ?? undefined,
    nearestTown: row.nearest_town ?? undefined,
    distanceToTownKm: row.distance_to_town_km ?? undefined,
    address: row.address ?? undefined,
    countryCode: row.country_code ?? undefined,

    campType: row.camp_type ?? undefined,
    difficulty: row.difficulty,

    shortDescription: row.short_description ?? undefined,
    description: row.description,
    highlights: row.highlights ?? undefined,

    price: row.price,
    pricePerNightNzd: row.price_per_night_nzd ?? undefined,
    priceUnit: row.price_unit ?? undefined,
    priceNotes: row.price_notes ?? undefined,

    totalSites: row.total_sites ?? undefined,
    tentFriendly: row.tent_friendly ?? undefined,
    campervanFriendly: row.campervan_friendly ?? undefined,
    poweredSitesAvailable: row.powered_sites_available ?? undefined,
    cabinAvailable: row.cabin_available ?? undefined,
    maxStayNights: row.max_stay_nights ?? undefined,

    facilities: row.facilities ?? [],
    tags: row.tags ?? [],

    yearRound: row.year_round ?? undefined,
    seasonOpenMonth: row.season_open_month ?? undefined,
    seasonCloseMonth: row.season_close_month ?? undefined,

    bookingRequired: row.booking_required ?? undefined,
    bookingUrl: row.booking_url ?? undefined,
    petPolicy: row.pet_policy ?? undefined,
    campfirePolicy: row.campfire_policy ?? undefined,
    alcoholAllowed: row.alcohol_allowed ?? undefined,

    rating: typeof row.rating === 'string' ? parseFloat(row.rating) : row.rating,
    ratingCount: row.rating_count ?? undefined,
    reviewPros: row.review_pros ?? undefined,
    reviewCons: row.review_cons ?? undefined,
    reviewSummary: row.review_summary ?? undefined,
    reviewAspects: row.review_aspects ?? undefined,

    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,

    photos: row.photos ?? undefined,
    photoAttribution: row.photo_attribution ?? undefined,

    dataQualityScore: row.data_quality_score ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    importedAt: row.imported_at ?? undefined,
    lastEnrichedAt: row.last_enriched_at ?? undefined,
    lastVerifiedAt: row.last_verified_at ?? undefined,
  };
}
