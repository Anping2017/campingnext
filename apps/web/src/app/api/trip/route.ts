import { NextRequest, NextResponse } from 'next/server';
import { generateTrip } from '@/lib/ai';
import campsData from '@/data/camps.json';
import type { Camp } from '@/types/camp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campId } = body;

    if (!campId) {
      return NextResponse.json(
        { error: '营地ID是必填项' },
        { status: 400 }
      );
    }

    const camp = (campsData as Camp[]).find((c: Camp) => c.id === campId);
    if (!camp) {
      return NextResponse.json(
        { error: '找不到该营地' },
        { status: 404 }
      );
    }

    // 生成行程
    const routes = await generateTrip(campId, camp);

    return NextResponse.json({ routes, camp });
  } catch (error) {
    console.error('生成行程失败:', error);
    return NextResponse.json(
      { error: '生成行程失败，请稍后重试' },
      { status: 500 }
    );
  }
}


