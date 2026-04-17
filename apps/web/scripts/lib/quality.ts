/**
 * 数据质量评分
 *
 * 0-1 浮点数,字段完整度 + 内容质量综合评估。
 * 用于:
 *   - 公开端点排序(高分优先)
 *   - 后台 UI 显示数据成熟度
 *   - 决定是否需要人工补充
 */
import type { Camp } from '../../src/types/camp.js';

export interface QualityCheck {
  key: string;
  label: string;
  weight: number;
  passed: boolean;
}

/**
 * 评估单个营地的数据质量,返回 0-1 分数
 */
export function computeQualityScore(camp: Partial<Camp>): number {
  const checks = computeQualityChecks(camp);
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const passedWeight = checks.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0);
  return totalWeight > 0 ? Number((passedWeight / totalWeight).toFixed(3)) : 0;
}

/**
 * 详细检查(可用于 UI 显示哪些字段缺失)
 */
export function computeQualityChecks(camp: Partial<Camp>): QualityCheck[] {
  const c = camp as Camp;
  return [
    // 核心(权重 2)
    { key: 'name', label: '名字', weight: 2, passed: !!c.name && c.name.length > 2 },
    { key: 'description', label: '描述', weight: 2, passed: !!c.description && c.description.length >= 50 },
    { key: 'lat_lng', label: '坐标', weight: 2, passed: typeof c.lat === 'number' && typeof c.lng === 'number' },
    { key: 'region', label: '区域', weight: 2, passed: !!c.region && c.region !== 'Unknown' },
    { key: 'camp_type', label: '营地类型', weight: 2, passed: !!c.campType },

    // 重要(权重 1.5)
    { key: 'short_description', label: '短描述', weight: 1.5, passed: !!c.shortDescription },
    { key: 'highlights', label: '亮点', weight: 1.5, passed: Array.isArray(c.highlights) && c.highlights.length >= 3 },
    { key: 'rating', label: '评分', weight: 1.5, passed: typeof c.rating === 'number' && c.rating > 0 },
    { key: 'review_summary', label: 'AI 评价摘要', weight: 1.5, passed: !!c.reviewSummary },
    { key: 'review_pros', label: '优点列表', weight: 1.5, passed: Array.isArray(c.reviewPros) && c.reviewPros.length >= 1 },

    // 实用(权重 1)
    { key: 'address', label: '地址', weight: 1, passed: !!c.address },
    { key: 'phone_or_website', label: '电话/网站', weight: 1, passed: !!c.phone || !!c.website },
    { key: 'facilities', label: '设施', weight: 1, passed: Array.isArray(c.facilities) && c.facilities.length >= 3 },
    { key: 'tags', label: '标签', weight: 1, passed: Array.isArray(c.tags) && c.tags.length >= 2 },
    { key: 'price_detail', label: '价格详情', weight: 1, passed: c.price === 'free' || typeof c.pricePerNightNzd === 'number' },
    { key: 'nearest_town', label: '最近镇', weight: 1, passed: !!c.nearestTown },
    { key: 'photos', label: '图片', weight: 1, passed: Array.isArray(c.photos) && c.photos.length >= 1 },
    { key: 'pet_policy', label: '宠物政策', weight: 1, passed: !!c.petPolicy },

    // 加分项(权重 0.5)
    { key: 'booking', label: '预订信息', weight: 0.5, passed: c.bookingRequired !== undefined },
    { key: 'season', label: '季节', weight: 0.5, passed: !!c.yearRound || (c.seasonOpenMonth !== undefined && c.seasonCloseMonth !== undefined) },
    { key: 'capacity', label: '营位数', weight: 0.5, passed: typeof c.totalSites === 'number' && c.totalSites > 0 },
    { key: 'campervan_friendly', label: '房车支持', weight: 0.5, passed: c.campervanFriendly !== undefined },
    { key: 'review_aspects', label: '维度评分', weight: 0.5, passed: !!c.reviewAspects && Object.keys(c.reviewAspects).length > 0 },
    { key: 'campfire_policy', label: '篝火政策', weight: 0.5, passed: !!c.campfirePolicy },
  ];
}

/**
 * 字段验证 — 在写入前检查必填字段
 * @returns 错误列表(空数组表示通过)
 */
export function validateCamp(camp: Partial<Camp>): string[] {
  const errors: string[] = [];

  if (!camp.id) errors.push('缺少 id');
  if (!camp.name || camp.name.length < 2) errors.push('name 必填且长度 ≥ 2');
  if (typeof camp.lat !== 'number' || camp.lat < -47 || camp.lat > -34) {
    errors.push(`lat 异常(应在 NZ 范围 -47 ~ -34):${camp.lat}`);
  }
  if (typeof camp.lng !== 'number' || camp.lng < 166 || camp.lng > 179) {
    errors.push(`lng 异常(应在 NZ 范围 166 ~ 179):${camp.lng}`);
  }
  if (!camp.region) errors.push('缺少 region');
  if (!camp.description || camp.description.length < 20) {
    errors.push('description 必填且长度 ≥ 20');
  }
  if (!['easy', 'medium', 'hard'].includes(camp.difficulty as string)) {
    errors.push(`difficulty 必须是 easy/medium/hard,实际:${camp.difficulty}`);
  }
  if (!['free', 'cheap', 'medium', 'expensive'].includes(camp.price as string)) {
    errors.push(`price 必须是 free/cheap/medium/expensive,实际:${camp.price}`);
  }
  if (!['doc', 'google', 'manual', 'osm'].includes(camp.source as string)) {
    errors.push(`source 必须是 doc/google/manual/osm,实际:${camp.source}`);
  }
  if (!['pending', 'published', 'rejected', 'archived'].includes(camp.status as string)) {
    errors.push(`status 必须是 pending/published/rejected/archived,实际:${camp.status}`);
  }

  return errors;
}
