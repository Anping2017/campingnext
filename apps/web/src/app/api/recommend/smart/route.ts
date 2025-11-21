import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import campsData from '@/data/camps.json';
import type { Camp } from '@/types/camp';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// 安全解析 JSON
function safeParseJSON(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      return JSON.parse(braceMatch[0]);
    }
    return {};
  }
}

// 计算距离（Haversine公式）
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
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

// 奥克兰坐标
const AUCKLAND_COORDS = { lat: -36.8485, lng: 174.7633 };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, duration, startDate, endDate, preferences } = body;

    if (!origin || !preferences || preferences.length === 0) {
      return NextResponse.json(
        { error: '出发地和偏好是必填项' },
        { status: 400 }
      );
    }

    const allCamps = campsData as Camp[];

    // 如果指定了目的地，直接使用
    let targetRegion = destination;
    let destinationReason = '';

    // 如果没有指定目的地，使用AI推荐
    if (!targetRegion) {
      const openai = getOpenAIClient();
      
      if (openai) {
        try {
          const systemPrompt = `你是新西兰户外露营专家。根据用户需求推荐一个最适合的目的地（地区）。

可用地区：
${Array.from(new Set(allCamps.map((c) => c.region))).join('、')}

返回 JSON 格式：
{
  "region": "地区名称",
  "reason": "推荐理由（50-80字）"
}`;

          const userPrompt = `用户需求：
- 出发地: ${origin}
- 时常: ${duration ? `${duration} 天` : startDate && endDate ? `${startDate} 到 ${endDate}` : '未指定'}
- 偏好: ${preferences.join('、')}

请推荐一个最适合的目的地，并说明理由。`;

          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
          });

          const result = safeParseJSON(response.choices[0].message.content || '{}');
          targetRegion = result.region;
          destinationReason = result.reason || '';
        } catch (error) {
          console.error('AI推荐目的地失败:', error);
        }
      }

      // 如果没有AI推荐，使用规则匹配
      if (!targetRegion) {
        // 根据偏好选择最匹配的地区
        const regionScores: Record<string, number> = {};
        
        allCamps.forEach((camp) => {
          let score = 0;
          preferences.forEach((pref: string) => {
            if (pref === 'beach' && camp.tags.includes('海边')) score += 2;
            if (pref === 'quiet' && !camp.tags.some((t) => t.includes('热门'))) score += 1;
            if (pref === 'toilet' && camp.facilities.includes('厕所')) score += 2;
            if (pref === 'pet' && camp.facilities.includes('可宠')) score += 1;
            if (pref === 'family' && camp.difficulty === 'easy') score += 2;
            if (pref === 'hiking' && camp.tags.includes('徒步')) score += 2;
          });
          
          if (score > 0) {
            regionScores[camp.region] = (regionScores[camp.region] || 0) + score;
          }
        });

        // 选择得分最高的地区
        const sortedRegions = Object.entries(regionScores).sort((a, b) => b[1] - a[1]);
        targetRegion = sortedRegions[0]?.[0] || allCamps[0].region;
        destinationReason = `根据您的偏好，我们推荐 ${targetRegion} 地区，这里有多个符合您需求的优质营地。`;
      }
    } else {
      destinationReason = `${targetRegion} 是一个绝佳的露营目的地，拥有丰富的自然景观和优质的营地设施。`;
    }

    // 筛选该地区的营地
    let regionCamps = allCamps.filter((camp) => camp.region === targetRegion);

    // 如果该地区没有营地，使用所有营地
    if (regionCamps.length === 0) {
      regionCamps = allCamps;
    }

    // 根据偏好和距离评分
    const scoredCamps = regionCamps.map((camp) => {
      let score = 0;

      // 偏好匹配
      preferences.forEach((pref: string) => {
        if (pref === 'beach' && camp.tags.includes('海边')) score += 10;
        if (pref === 'quiet' && !camp.tags.some((t) => t.includes('热门'))) score += 5;
        if (pref === 'toilet' && camp.facilities.includes('厕所')) score += 10;
        if (pref === 'pet' && camp.facilities.includes('可宠')) score += 8;
        if (pref === 'family' && camp.difficulty === 'easy') score += 10;
        if (pref === 'hiking' && camp.tags.includes('徒步')) score += 10;
      });

      // 距离评分（从奥克兰出发）
      const distance = calculateDistance(AUCKLAND_COORDS.lat, AUCKLAND_COORDS.lng, camp.lat, camp.lng);
      if (distance < 200) {
        score += Math.max(0, 20 * (1 - distance / 200));
      }

      // 评分
      score += camp.rating * 4;

      // 价格
      if (camp.price === 0) score += 5;
      else if (camp.price < 20) score += 3;
      else if (camp.price < 40) score += 2;

      return { camp, score };
    });

    // 排序并取Top 5
    const topCamps = scoredCamps
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 为每个营地生成推荐理由
    const campsWithReasons = await Promise.all(
      topCamps.map(async ({ camp, score }) => {
        let reason = '';

        const openai = getOpenAIClient();
        if (openai) {
          try {
            const reasonPrompt = `为这个营地生成一段简洁的推荐理由（30-50字）：

营地：${camp.name}
地区：${camp.region}
描述：${camp.description}
标签：${camp.tags.join('、')}
设施：${camp.facilities.join('、')}
难度：${camp.difficulty}
评分：${camp.rating}/5

用户偏好：${preferences.join('、')}

用轻松、自然的语气，突出这个营地为什么适合用户。直接返回推荐理由文本，不要返回JSON。`;

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
              max_tokens: 100,
            });

            reason = response.choices[0].message.content?.trim() || '';
          } catch (error) {
            console.error('生成推荐理由失败:', error);
          }
        }

        if (!reason) {
          reason = `${camp.name}${camp.tags.length > 0 ? `，${camp.tags.slice(0, 2).join('、')}` : ''}，${camp.description}`;
        }

        return {
          camp,
          score,
          reason,
        };
      })
    );

    return NextResponse.json({
      destination: {
        region: targetRegion,
        reason: destinationReason,
      },
      camps: campsWithReasons,
    });
  } catch (error) {
    console.error('智能推荐失败:', error);
    return NextResponse.json(
      { error: '推荐失败，请稍后重试' },
      { status: 500 }
    );
  }
}


