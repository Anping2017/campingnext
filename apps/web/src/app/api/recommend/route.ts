import { NextRequest, NextResponse } from 'next/server';
import { recommendCamps } from '@/lib/ai';
import campsData from '@/data/camps.json';
import type { Camp } from '@/types/camp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, days, budget, people } = body;

    if (!location) {
      return NextResponse.json(
        { error: '地点是必填项' },
        { status: 400 }
      );
    }

    // 调用 AI 推荐
    const result = await recommendCamps(
      {
        location,
        days: days || 2,
        budget: budget || 'medium',
        people: people || 2,
      },
      campsData as Camp[]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('推荐失败:', error);
    return NextResponse.json(
      { error: '推荐失败，请稍后重试' },
      { status: 500 }
    );
  }
}





