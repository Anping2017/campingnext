import { OpenAI } from 'openai';
import type { Camp } from '@/types/camp';

// 延迟初始化 OpenAI 客户端
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 环境变量未设置。请检查 .env.local 文件并重启开发服务器。');
  }
  return new OpenAI({ apiKey });
}

// 安全解析 JSON，处理可能包含 markdown 代码块的情况
function safeParseJSON(content: string): any {
  try {
    // 尝试直接解析
    return JSON.parse(content);
  } catch {
    // 如果失败，尝试提取 JSON 代码块
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // 尝试提取第一个 { ... } 块
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      return JSON.parse(braceMatch[0]);
    }
    return {};
  }
}

interface RecommendParams {
  location: string;
  days: number;
  budget: 'low' | 'medium' | 'high';
  people: number;
}

interface RecommendResult {
  camps: Camp[];
  reasoning: string;
  routes: Array<{
    type: 'optimal' | 'scenic' | 'budget';
    description: string;
    timeline: string[];
    equipment: string[];
    notes: string[];
  }>;
}

/**
 * AI 推荐营地
 */
export async function recommendCamps(
  params: RecommendParams,
  availableCamps: Camp[]
): Promise<RecommendResult> {
  const systemPrompt = `你是新西兰户外露营专家。基于提供的营地数据，结合用户参数（地点、时间、预算、人数）推荐 3-5 个最合适的营地，并解释原因。

返回 JSON 格式：
{
  "camps": [营地ID数组],
  "reasoning": "推荐理由的详细解释"
}`;

  const userPrompt = `用户需求：
- 地点: ${params.location}
- 天数: ${params.days}
- 预算: ${params.budget}
- 人数: ${params.people}

可用营地数据：
${JSON.stringify(availableCamps, null, 2)}

请推荐最合适的营地，并详细解释原因。`;

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  const result = safeParseJSON(response.choices[0].message.content || '{}');
  
  // 根据推荐ID获取完整营地信息
  const recommendedCamps = availableCamps.filter((camp) =>
    result.camps?.includes(camp.id)
  );

  return {
    camps: recommendedCamps,
    reasoning: result.reasoning || '',
    routes: [], // 将在生成行程时填充
  };
}

/**
 * 生成行程路线
 */
export async function generateTrip(campId: string, camp: Camp): Promise<RecommendResult['routes']> {
  const systemPrompt = `根据营地数据生成 2-3 条可行路线。包括：
- 最优路线（时间最短）
- 风景优先路线（沿途最美）
- 省钱路线（成本最低）

每条路线包含：时间表、注意事项、推荐装备。`;

  const userPrompt = `营地信息：
${JSON.stringify(camp, null, 2)}

请生成详细的路线规划。`;

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  const result = safeParseJSON(response.choices[0].message.content || '{}');
  return result.routes || [];
}

/**
 * 轻量版推荐模型：基于规则匹配 + AI 文本总结
 */
export interface LightweightRecommendParams {
  preferences: string[]; // 偏好：['海边', '厕所', '新手友好'] 等
  userLocation?: { lat: number; lng: number }; // 用户当前位置
  maxDistance?: number; // 最大距离（公里）
  weather?: {
    condition: string; // 'sunny', 'rainy', 'cloudy'
    temperature: number; // 温度
  };
  viewedCamps?: string[]; // 用户历史浏览的营地ID
}

export interface LightweightRecommendResult {
  camps: Array<{
    camp: Camp;
    score: number; // 匹配分数
    reason: string; // AI 生成的推荐理由
  }>;
}

/**
 * 计算两点间距离（公里）- 使用 Haversine 公式
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 地球半径（公里）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 轻量版推荐：基于规则匹配筛选 Top 3，然后用 AI 生成推荐理由
 */
export async function recommendCampsLightweight(
  params: LightweightRecommendParams,
  availableCamps: Camp[]
): Promise<LightweightRecommendResult> {
  // 第一步：基于规则匹配和评分
  const scoredCamps = availableCamps.map((camp) => {
    let score = 0;

    // 1. 偏好匹配（权重：30分）
    if (params.preferences) {
      params.preferences.forEach((pref) => {
        // 偏好关键词映射
        if (pref === '海边' || pref === 'beach') {
          if (camp.tags.includes('海边')) score += 10;
        }
        if (pref === '厕所' || pref === 'toilet') {
          if (camp.facilities.includes('厕所')) score += 10;
        }
        if (pref === '新手友好' || pref === 'beginner' || pref === 'family') {
          if (camp.difficulty === 'easy' || camp.tags.includes('适合新手')) score += 10;
        }
        if (pref === '徒步' || pref === 'hiking') {
          if (camp.tags.includes('徒步')) score += 10;
        }
        if (pref === '森林' || pref === 'forest') {
          if (camp.tags.some((t) => t.includes('森林') || t.includes('徒步'))) score += 10;
        }
      });
    }

    // 2. 距离评分（权重：25分）- 距离越近分数越高
    if (params.userLocation && params.maxDistance) {
      const distance = calculateDistance(
        params.userLocation.lat,
        params.userLocation.lng,
        camp.lat,
        camp.lng
      );
      if (distance <= params.maxDistance) {
        // 距离越近分数越高，线性递减
        score += Math.max(0, 25 * (1 - distance / params.maxDistance));
      } else {
        // 超出最大距离，不推荐
        score = -1000;
      }
    }

    // 3. 天气适配（权重：15分）
    if (params.weather) {
      const { condition, temperature } = params.weather;
      // 雨天：优先有遮蔽设施的营地
      if (condition === 'rainy' && camp.facilities.some((f) => f.includes('遮蔽') || f.includes('棚'))) {
        score += 15;
      }
      // 晴天：海边营地加分
      if (condition === 'sunny' && camp.tags.includes('海边')) {
        score += 10;
      }
      // 温度适配：极端温度时，有设施的营地加分
      if ((temperature < 5 || temperature > 30) && camp.facilities.length > 2) {
        score += 5;
      }
    }

    // 4. 评分（权重：20分）
    score += camp.rating * 4; // 5分制转换为20分

    // 5. 价格（权重：10分）- 价格越低分数越高（简单处理）
    if (camp.price === 0) {
      score += 10; // 免费营地
    } else if (camp.price < 20) {
      score += 7;
    } else if (camp.price < 40) {
      score += 5;
    } else {
      score += 3;
    }

    // 6. 避免重复推荐用户已浏览的营地（轻微降分）
    if (params.viewedCamps?.includes(camp.id)) {
      score -= 5;
    }

    return { camp, score };
  });

  // 筛选并排序，取 Top 3
  const topCamps = scoredCamps
    .filter((item) => item.score > 0) // 只保留正分
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 第二步：使用 AI 生成推荐理由
  const result: LightweightRecommendResult = {
    camps: [],
  };

  if (topCamps.length === 0) {
    return result;
  }

  // 如果有 OpenAI API Key，生成 AI 推荐理由
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = getOpenAIClient();
      
      // 为每个营地生成推荐理由
      for (const { camp, score } of topCamps) {
        const reasonPrompt = `你是新西兰户外露营专家。根据以下信息，为这个营地生成一段简洁的推荐理由（50-80字）：

营地信息：
- 名称：${camp.name}
- 地区：${camp.region}
- 描述：${camp.description}
- 标签：${camp.tags.join('、')}
- 设施：${camp.facilities.join('、')}
- 难度：${camp.difficulty}
- 评分：${camp.rating}/5

用户偏好：${params.preferences.join('、')}
${params.weather ? `当前天气：${params.weather.condition}，${params.weather.temperature}°C` : ''}

请用轻松、自然的语气，突出这个营地为什么适合用户。直接返回推荐理由文本，不要返回 JSON 或其他格式。`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '你是新西兰户外露营专家，用轻松、自然的语气生成推荐理由。',
            },
            { role: 'user', content: reasonPrompt },
          ],
          temperature: 0.8,
          max_tokens: 150,
        });

        const reason = response.choices[0].message.content?.trim() || '这个营地很适合你的需求。';
        
        result.camps.push({
          camp,
          score,
          reason,
        });
      }
    } catch (error) {
      console.error('AI 生成推荐理由失败:', error);
      // 如果 AI 失败，使用默认理由
      topCamps.forEach(({ camp, score }) => {
        result.camps.push({
          camp,
          score,
          reason: `这个营地${camp.tags.join('、')}，${camp.description}`,
        });
      });
    }
  } else {
    // 没有 API Key，使用默认理由
    topCamps.forEach(({ camp, score }) => {
      result.camps.push({
        camp,
        score,
        reason: `这个营地${camp.tags.join('、')}，${camp.description}`,
      });
    });
  }

  return result;
}

