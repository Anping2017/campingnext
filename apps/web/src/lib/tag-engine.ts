/**
 * 高级标签选择引擎
 * 基于规则和上下文的智能标签推断系统
 */

import { TAGS, TagOption } from './camp-metadata';

// 标签关系定义
export interface TagRelationship {
  // 依赖关系：如果标签 A 依赖标签 B，则选择 A 时必须选择 B
  dependencies: Record<string, string[]>;
  // 互斥关系：如果标签 A 和 B 互斥，则不能同时选择
  exclusives: Array<[string, string]>;
  // 关联关系：如果标签 A 和 B 关联，选择 A 时建议选择 B
  associations: Record<string, string[]>;
  // 优先级：某些标签的优先级更高，应该优先选择
  priorities: Record<string, number>;
}

// 标签关系配置
export const TAG_RELATIONSHIPS: TagRelationship = {
  // 依赖关系
  dependencies: {
    // 活动标签依赖地理位置标签
    'kayaking': ['beach', 'lake', 'river'], // 皮划艇需要水域
    'fishing': ['beach', 'lake', 'river'], // 钓鱼需要水域
    'hiking': ['mountain', 'forest'], // 徒步通常在山地或森林
    'stargazing': ['quiet'], // 观星需要安静环境
  },
  // 互斥关系
  exclusives: [
    ['sunny', 'shady'], // 阳光充足和有树荫互斥
    ['quiet', 'challenging'], // 安静和挑战性通常不共存
    ['beginner', 'challenging'], // 新手和挑战性互斥
  ],
  // 关联关系
  associations: {
    'beach': ['photography', 'scenic'], // 海边通常景色好，适合摄影
    'mountain': ['hiking', 'scenic', 'challenging'], // 山区通常适合徒步，景色好，有挑战性
    'lake': ['photography', 'scenic', 'kayaking', 'fishing'], // 湖边通常景色好，适合水上活动
    'forest': ['hiking', 'quiet', 'shady'], // 森林通常安静，有树荫，适合徒步
    'river': ['fishing', 'kayaking'], // 河边适合钓鱼和皮划艇
    'family': ['beginner', 'playground'], // 家庭友好通常适合新手，有游乐场
    'photography': ['scenic'], // 适合摄影通常景色好
    'heritage': ['scenic', 'photography'], // 历史遗迹通常景色好，适合摄影
  },
  // 优先级（数字越大优先级越高）
  priorities: {
    'heritage': 10, // 历史遗迹优先级最高
    'scenic': 8, // 景色好优先级高
    'challenging': 7, // 挑战性优先级较高
    'beginner': 6, // 新手友好优先级较高
    'family': 6, // 家庭友好优先级较高
    'quiet': 5, // 安静优先级中等
    'photography': 5, // 适合摄影优先级中等
    'hiking': 4, // 适合徒步优先级中等
    'fishing': 3, // 适合钓鱼优先级较低
    'kayaking': 3, // 适合皮划艇优先级较低
    'stargazing': 4, // 适合观星优先级中等
    'sunny': 2, // 阳光充足优先级较低
    'shady': 2, // 有树荫优先级较低
    'windy': 1, // 多风优先级最低
    'sheltered': 2, // 有遮挡优先级较低
  },
};

// 标签选择上下文
export interface TagContext {
  name: string;
  description: string;
  address: string;
  region?: string;
  campType?: string;
  facilities: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  reviews?: string[]; // Google Maps 评价
  placeTypes?: string[]; // Google Maps 地点类型
}

// 标签候选（带置信度）
export interface TagCandidate {
  tagId: string;
  confidence: number; // 0-1 之间的置信度
  reason: string; // 选择原因
}

/**
 * 基于规则和上下文推断标签
 */
export function inferTagsWithRules(context: TagContext): TagCandidate[] {
  const candidates: TagCandidate[] = [];
  const searchText = `${context.name} ${context.description} ${context.address || ''}`.toLowerCase();
  const reviewsText = context.reviews?.join(' ').toLowerCase() || '';
  const fullText = `${searchText} ${reviewsText}`;

  // 地理位置标签推断
  const locationKeywords = {
    'beach': ['beach', 'coast', 'coastal', 'shore', 'seaside', 'ocean', '海边', '海岸', '海滨', '海滩'],
    'mountain': ['mountain', 'alpine', 'peak', 'summit', 'hill', '山', '峰', '山顶', '山区', '高山'],
    'lake': ['lake', 'lakeside', 'lakeshore', '湖', '湖边', '湖畔', '湖岸'],
    'forest': ['forest', 'wood', 'woods', 'woodland', 'bush', '森林', '树林', '林地', '丛林'],
    'river': ['river', 'stream', 'creek', 'waterway', '河', '河流', '溪流', '河边'],
  };

  for (const [tagId, keywords] of Object.entries(locationKeywords)) {
    const matches = keywords.filter(kw => fullText.includes(kw)).length;
    if (matches > 0) {
      candidates.push({
        tagId,
        confidence: Math.min(0.9, 0.5 + matches * 0.1),
        reason: `地理位置关键词匹配: ${keywords.filter(kw => fullText.includes(kw)).join(', ')}`,
      });
    }
  }

  // 活动标签推断
  const activityKeywords = {
    'hiking': ['hiking', 'walking', 'trail', 'track', 'tramping', '徒步', '步道', '健行', '远足'],
    'fishing': ['fishing', 'fish', 'angling', '钓鱼', '垂钓'],
    'kayaking': ['kayak', 'canoe', 'paddle', 'paddling', 'water sports', '皮划艇', '划船', '水上运动'],
    'stargazing': ['star', 'night sky', 'astronomy', 'dark sky', '观星', '星空', '天文'],
    'photography': ['photo', 'photography', 'scenic', 'beautiful', 'picturesque', '摄影', '景色', '美景', '风景'],
  };

  for (const [tagId, keywords] of Object.entries(activityKeywords)) {
    const matches = keywords.filter(kw => fullText.includes(kw)).length;
    if (matches > 0) {
      candidates.push({
        tagId,
        confidence: Math.min(0.85, 0.4 + matches * 0.15),
        reason: `活动关键词匹配: ${keywords.filter(kw => fullText.includes(kw)).join(', ')}`,
      });
    }
  }

  // 适合人群标签推断
  if (context.facilities.includes('playground')) {
    candidates.push({
      tagId: 'family',
      confidence: 0.9,
      reason: '有游乐场设施',
    });
  }

  const suitabilityKeywords = {
    'beginner': ['beginner', 'easy', 'simple', 'accessible', '新手', '简单', '容易', '适合初学者'],
    'family': ['family', 'family-friendly', 'children', 'kids', 'child', '家庭', '儿童', '孩子', '亲子'],
    'solo': ['solo', 'alone', 'single', '独行', '独自', '单人'],
    'group': ['group', 'team', 'large', '团体', '团队', '多人'],
  };

  for (const [tagId, keywords] of Object.entries(suitabilityKeywords)) {
    const matches = keywords.filter(kw => fullText.includes(kw)).length;
    if (matches > 0) {
      candidates.push({
        tagId,
        confidence: Math.min(0.8, 0.5 + matches * 0.1),
        reason: `适合人群关键词匹配: ${keywords.filter(kw => fullText.includes(kw)).join(', ')}`,
      });
    }
  }

  // 特色标签推断
  const featureKeywords = {
    'scenic': ['scenic', 'beautiful', 'stunning', 'picturesque', 'breathtaking', '景色', '美景', '风景', '壮观', '美丽'],
    'quiet': ['quiet', 'peaceful', 'tranquil', 'serene', '安静', '宁静', '静谧', '幽静'],
    'challenging': ['challenging', 'difficult', 'hard', 'tough', 'demanding', '挑战', '困难', '艰难', '有挑战性'],
    'heritage': ['heritage', 'unesco', 'historic', 'historical', '世界遗产', '历史遗迹', '历史', '古迹', '遗址'],
    'sunny': ['sunny', 'sun', 'sunshine', '阳光', '日照', '阳光充足'],
    'shady': ['shade', 'shady', 'tree', 'trees', '树荫', '有树', '遮阴'],
    'windy': ['wind', 'windy', 'breeze', '风', '多风', '有风'],
    'sheltered': ['shelter', 'sheltered', 'protected', '遮挡', '避风', '有遮挡'],
  };

  for (const [tagId, keywords] of Object.entries(featureKeywords)) {
    const matches = keywords.filter(kw => fullText.includes(kw)).length;
    if (matches > 0) {
      candidates.push({
        tagId,
        confidence: Math.min(0.75, 0.3 + matches * 0.15),
        reason: `特色关键词匹配: ${keywords.filter(kw => fullText.includes(kw)).join(', ')}`,
      });
    }
  }

  // 基于营地类型的推断
  if (context.campType === 'DOC') {
    candidates.push({
      tagId: 'quiet',
      confidence: 0.7,
      reason: 'DOC 营地通常安静',
    });
    candidates.push({
      tagId: 'scenic',
      confidence: 0.6,
      reason: 'DOC 营地通常景色好',
    });
  } else if (context.campType === 'Holiday Park') {
    candidates.push({
      tagId: 'family',
      confidence: 0.8,
      reason: 'Holiday Park 通常适合家庭',
    });
    candidates.push({
      tagId: 'beginner',
      confidence: 0.7,
      reason: 'Holiday Park 通常适合新手',
    });
  }

  // 基于难度的推断
  if (context.difficulty === 'easy') {
    candidates.push({
      tagId: 'beginner',
      confidence: 0.8,
      reason: '难度简单，适合新手',
    });
  } else if (context.difficulty === 'hard') {
    candidates.push({
      tagId: 'challenging',
      confidence: 0.8,
      reason: '难度高，具有挑战性',
    });
  }

  // 基于 Google Maps 地点类型的推断
  if (context.placeTypes) {
    const placeTypesText = context.placeTypes.join(' ').toLowerCase();
    if (placeTypesText.includes('national_park') || placeTypesText.includes('park')) {
      candidates.push({
        tagId: 'scenic',
        confidence: 0.7,
        reason: '国家公园或公园通常景色好',
      });
    }
    if (placeTypesText.includes('beach') || placeTypesText.includes('coast')) {
      candidates.push({
        tagId: 'beach',
        confidence: 0.8,
        reason: 'Google Maps 类型显示为海滩',
      });
    }
  }

  return candidates;
}

/**
 * 应用标签关系规则，优化标签选择
 */
export function applyTagRelationships(
  candidates: TagCandidate[],
  selectedTags: string[] = []
): string[] {
  const finalTags = [...selectedTags];
  const candidateMap = new Map(candidates.map(c => [c.tagId, c]));

  // 按置信度和优先级排序
  const sortedCandidates = candidates
    .filter(c => !finalTags.includes(c.tagId)) // 排除已选择的标签
    .sort((a, b) => {
      const priorityA = TAG_RELATIONSHIPS.priorities[a.tagId] || 0;
      const priorityB = TAG_RELATIONSHIPS.priorities[b.tagId] || 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // 优先级高的在前
      }
      return b.confidence - a.confidence; // 置信度高的在前
    });

  // 选择标签，应用关系规则
  for (const candidate of sortedCandidates) {
    const tagId = candidate.tagId;

    // 检查互斥关系
    const isExclusive = TAG_RELATIONSHIPS.exclusives.some(
      ([tag1, tag2]) => (tag1 === tagId && finalTags.includes(tag2)) || (tag2 === tagId && finalTags.includes(tag1))
    );
    if (isExclusive) {
      continue; // 跳过互斥标签
    }

    // 检查依赖关系
    const dependencies = TAG_RELATIONSHIPS.dependencies[tagId] || [];
    const hasAllDependencies = dependencies.every(dep => finalTags.includes(dep));
    if (dependencies.length > 0 && !hasAllDependencies) {
      // 如果依赖的标签不存在，尝试添加依赖标签（如果置信度足够）
      for (const dep of dependencies) {
        if (!finalTags.includes(dep)) {
          const depCandidate = candidateMap.get(dep);
          if (depCandidate && depCandidate.confidence > 0.3) {
            finalTags.push(dep);
          }
        }
      }
      // 如果仍然没有所有依赖，跳过此标签
      const stillMissingDeps = dependencies.filter(dep => !finalTags.includes(dep));
      if (stillMissingDeps.length > 0) {
        continue;
      }
    }

    // 添加标签（置信度阈值：0.4）
    if (candidate.confidence >= 0.4) {
      finalTags.push(tagId);

      // 应用关联关系
      const associations = TAG_RELATIONSHIPS.associations[tagId] || [];
      for (const assoc of associations) {
        if (!finalTags.includes(assoc)) {
          const assocCandidate = candidateMap.get(assoc);
          if (assocCandidate && assocCandidate.confidence >= 0.3) {
            finalTags.push(assoc);
          }
        }
      }
    }
  }

  return [...new Set(finalTags)]; // 去重
}

/**
 * 智能标签选择：结合 AI 结果和规则推断
 */
export function selectTagsIntelligently(
  aiTags: string[],
  context: TagContext
): string[] {
  // 1. 基于规则推断标签候选
  const ruleCandidates = inferTagsWithRules(context);

  // 2. 将 AI 标签转换为候选（置信度较高）
  const aiCandidates: TagCandidate[] = aiTags.map(tagId => ({
    tagId,
    confidence: 0.7, // AI 标签默认置信度
    reason: 'AI 生成',
  }));

  // 3. 合并候选（AI 标签优先）
  const allCandidates = [
    ...aiCandidates,
    ...ruleCandidates.filter(c => !aiTags.includes(c.tagId)), // 排除 AI 已选择的标签
  ];

  // 4. 应用关系规则，选择最终标签
  const finalTags = applyTagRelationships(allCandidates, aiTags);

  // 5. 限制标签数量（最多 8 个，优先选择置信度高和优先级高的）
  const tagScores = finalTags.map(tagId => {
    const candidate = allCandidates.find(c => c.tagId === tagId);
    const priority = TAG_RELATIONSHIPS.priorities[tagId] || 0;
    return {
      tagId,
      score: (candidate?.confidence || 0.5) * 0.6 + priority * 0.4,
    };
  });

  tagScores.sort((a, b) => b.score - a.score);

  // 返回前 8 个标签
  return tagScores.slice(0, 8).map(t => t.tagId);
}

/**
 * 验证标签组合的合理性
 */
export function validateTagCombination(tags: string[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 检查互斥关系
  for (const [tag1, tag2] of TAG_RELATIONSHIPS.exclusives) {
    if (tags.includes(tag1) && tags.includes(tag2)) {
      issues.push(`标签 "${getTagLabel(tag1)}" 和 "${getTagLabel(tag2)}" 不能同时存在`);
    }
  }

  // 检查依赖关系
  for (const [tagId, dependencies] of Object.entries(TAG_RELATIONSHIPS.dependencies)) {
    if (tags.includes(tagId)) {
      const missingDeps = dependencies.filter(dep => !tags.includes(dep));
      if (missingDeps.length > 0) {
        issues.push(`标签 "${getTagLabel(tagId)}" 需要依赖标签: ${missingDeps.map(getTagLabel).join(', ')}`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// 辅助函数：获取标签标签
function getTagLabel(tagId: string): string {
  const tag = TAGS.find(t => t.id === tagId);
  return tag ? tag.label : tagId;
}

