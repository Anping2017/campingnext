import { NextRequest, NextResponse } from 'next/server';
import { recommendCampsLightweight } from '@/lib/ai';
import campsData from '@/data/camps.json';
import type { Camp } from '@/types/camp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences, userLocation, maxDistance, weather, viewedCamps } = body;

    if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
      return NextResponse.json(
        { error: '偏好是必填项，且必须是非空数组' },
        { status: 400 }
      );
    }

    // 调用轻量版推荐
    const result = await recommendCampsLightweight(
      {
        preferences,
        userLocation,
        maxDistance: maxDistance || 500, // 默认最大距离 500 公里
        weather,
        viewedCamps,
      },
      campsData as Camp[]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('轻量推荐失败:', error);
    return NextResponse.json(
      { error: '推荐失败，请稍后重试' },
      { status: 500 }
    );
  }
}


