import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import campsData from '@/data/camps.json';
import type { Camp } from '@/types/camp';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 环境变量未设置');
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campId = searchParams.get('campId');

    if (!campId) {
      return NextResponse.json(
        { error: '营地ID是必填项' },
        { status: 400 }
      );
    }

    const camp = (campsData as Camp[]).find((c) => c.id === campId);
    if (!camp) {
      return NextResponse.json(
        { error: '找不到该营地' },
        { status: 404 }
      );
    }

    // 如果没有 OpenAI API Key，返回默认摘要
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        suitableFor: ['家庭出游', '新手露营者', '摄影爱好者'],
        notes: ['建议提前预订', '注意天气变化', '带好防蚊用品'],
      });
    }

    const systemPrompt = `你是新西兰户外露营专家。根据营地信息，生成简洁的摘要，包括：
1. 适合谁去（3-4个标签）
2. 注意事项（3-4条）

返回 JSON 格式：
{
  "suitableFor": ["标签1", "标签2"],
  "notes": ["注意事项1", "注意事项2"]
}

语气要轻松、自然、有旅行感。`;

    const userPrompt = `营地信息：
名称：${camp.name}
地区：${camp.region}
描述：${camp.description}
标签：${camp.tags.join('、')}
难度：${camp.difficulty}
设施：${camp.facilities.join('、')}

请生成摘要。`;

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
    return NextResponse.json(result);
  } catch (error) {
    console.error('生成摘要失败:', error);
    // 返回默认摘要
    return NextResponse.json({
      suitableFor: ['家庭出游', '新手露营者', '摄影爱好者'],
      notes: ['建议提前预订', '注意天气变化', '带好防蚊用品'],
    });
  }
}

