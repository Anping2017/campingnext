// =============================================================================
// Camp 类型定义(v2)
// 与 Supabase camps 表 schema 对齐
// camelCase(TS)↔ snake_case(DB)的转换在 API route 层完成
// =============================================================================

/**
 * 营地类型(v2 扩充)
 * - 兼容旧值('DOC' / 'Holiday Park' 等)以便迁移期共存
 */
export type CampType =
  // 新版细分
  | 'doc_serviced'      // DOC 服务型(有水有电)
  | 'doc_basic'         // DOC 基础型(只有简易厕所)
  | 'doc_standard'      // DOC 标准型
  | 'holiday_park'      // Holiday Park
  | 'freedom_camping'   // Freedom Camping(免费)
  | 'local_camp'        // 地方政府营地
  | 'private_campground'// 私人营地
  | 'glamping'          // Glamping(奢华露营)
  | 'farm_stay'         // 农场住宿
  // 旧版兼容
  | 'DOC'
  | 'Holiday Park'
  | 'Freedom Camping'
  | 'Local Camp'
  | 'Private Campground';

export type CampSource = 'doc' | 'google' | 'manual' | 'osm';

export type CampStatus = 'pending' | 'published' | 'rejected' | 'archived';

export type CampDifficulty = 'easy' | 'medium' | 'hard';

export type CampPrice = 'free' | 'cheap' | 'medium' | 'expensive';

export type PriceUnit = 'per_person' | 'per_site' | 'per_vehicle';

export type PetPolicy =
  | 'allowed'
  | 'not-allowed'
  | 'seasonal'
  | 'conditional'
  | 'leashed-only';

export type CampfirePolicy =
  | 'allowed'
  | 'not-allowed'
  | 'fire-pit-only'
  | 'seasonal';

/**
 * 评价 aspect 分类(用于结构化 pros/cons)
 */
export type ReviewAspect =
  | 'view'         // 视野/景观
  | 'facilities'   // 设施
  | 'location'     // 地理位置
  | 'cleanliness'  // 卫生
  | 'value'        // 性价比
  | 'staff'        // 员工/服务
  | 'vibe'         // 氛围
  | 'access'       // 可达性/进入难度
  | 'safety'       // 安全
  | 'other';       // 其他

/**
 * 单条结构化评价(优点或缺点)
 */
export interface ReviewItem {
  /** 评价文本(中文,10-25 字) */
  text: string;
  /** 所属 aspect */
  aspect: ReviewAspect;
  /** 情感/严重程度 0-1 */
  sentiment: number;
}

/**
 * 各维度评分(0-5),只对评价中明确提及的维度给分
 */
export interface AspectScores {
  facilities?: number;
  location?: number;
  cleanliness?: number;
  value?: number;
  staff?: number;
  view?: number;
  vibe?: number;
  access?: number;
}

/**
 * 图片署名(满足 Google Photos 等数据源的合规要求)
 */
export interface PhotoAttribution {
  google?: string[];
  doc?: string[];
  manual?: string[];
}

/**
 * 主 Camp 类型(完整字段)
 */
export interface Camp {
  // ----- 标识 -----
  id: string;
  name: string;
  /** url-safe slug,如 'cathedral-cove-doc' */
  slug?: string;

  // ----- 多源追踪 -----
  source: CampSource;
  /** 原始系统 ID(如 DOC AssetID、Google place_id) */
  sourceId?: string;
  /** Google place_id(永久稳定) */
  googlePlaceId?: string;
  status: CampStatus;
  /** 原始 API 响应,debug/再推断用 */
  rawData?: unknown;

  // ----- 地理位置 -----
  lat: number;
  lng: number;
  /** 海拔(米) */
  elevationM?: number;
  /** 大区,如 'Otago' */
  region: string;
  /** 小区,如 'Mount Aspiring' */
  subRegion?: string;
  /** 最近城镇 */
  nearestTown?: string;
  /** 到镇上的距离(km) */
  distanceToTownKm?: number;
  address?: string;
  /** 国家代码,默认 'NZ' */
  countryCode?: string;

  // ----- 分类 -----
  campType?: CampType;
  difficulty: CampDifficulty;

  // ----- 描述(分层) -----
  /** 50 字内,卡片显示 */
  shortDescription?: string;
  /** 200-400 字,详情页主体 */
  description: string;
  /** 3-5 条卖点 */
  highlights?: string[];

  // ----- 价格 -----
  price: CampPrice;
  /** 实际价格(NZD) */
  pricePerNightNzd?: number;
  priceUnit?: PriceUnit;
  /** "儿童5岁以下免费,周末加价" */
  priceNotes?: string;

  // ----- 容量 -----
  totalSites?: number;
  tentFriendly?: boolean;
  campervanFriendly?: boolean;
  poweredSitesAvailable?: boolean;
  cabinAvailable?: boolean;
  maxStayNights?: number;

  // ----- 设施/标签 -----
  facilities: string[];
  tags: string[];

  // ----- 季节 -----
  yearRound?: boolean;
  /** 1-12 */
  seasonOpenMonth?: number;
  /** 1-12 */
  seasonCloseMonth?: number;

  // ----- 政策 -----
  bookingRequired?: boolean;
  bookingUrl?: string;
  petPolicy?: PetPolicy;
  campfirePolicy?: CampfirePolicy;
  alcoholAllowed?: boolean;

  // ----- 评价 -----
  rating: number;
  ratingCount?: number;
  reviewPros?: ReviewItem[];
  reviewCons?: ReviewItem[];
  /** AI 综合摘要,~100 字 */
  reviewSummary?: string;
  reviewAspects?: AspectScores;

  // ----- 联系 -----
  phone?: string;
  email?: string;
  website?: string;

  // ----- 资源 -----
  /** 图片 URL 数组 */
  photos?: string[];
  photoAttribution?: PhotoAttribution;

  // ----- 元数据 -----
  /** 字段完整度 0-1 */
  dataQualityScore?: number;
  createdAt?: string;
  updatedAt?: string;
  importedAt?: string;
  /** Google 数据最后刷新时间(用于 30 天 TOS 合规) */
  lastEnrichedAt?: string;
  /** 管理员最后审核时间 */
  lastVerifiedAt?: string;
}

// =============================================================================
// 旧字段兼容别名(过渡期使用,后续可移除)
// 现有组件如 CampCard、CampMap 等仍在用旧字段名
// =============================================================================

/**
 * 旧版 Camp 接口的兼容字段(仅过渡期使用)
 * 实际数据库中已替换为新 schema,但前端组件读取时可能还用旧字段名
 */
export type LegacyCamp = Camp & {
  /** @deprecated 使用 reviewPros */
  review_pros?: ReviewItem[] | string[];
  /** @deprecated 使用 reviewCons */
  review_cons?: ReviewItem[] | string[];
  /** @deprecated 使用 campType */
  camp_type?: CampType;
  /** @deprecated 使用 petPolicy */
  pet_policy?: PetPolicy;
};

// =============================================================================
// 推荐 / 行程相关(沿用)
// =============================================================================

export interface RecommendParams {
  location: string;
  days: number;
  budget: 'low' | 'medium' | 'high';
  people: number;
}

export interface TripRoute {
  type: 'optimal' | 'scenic' | 'budget';
  description: string;
  timeline: string[];
  equipment: string[];
  notes: string[];
}
