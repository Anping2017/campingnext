import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import campsData from '@/data/camps.json';

// 初始化营地数据到 Supabase（仅用于开发/初始化）
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    // 检查是否已认证（可选，如果需要保护此端点）
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //   return NextResponse.json({ error: '未授权' }, { status: 401 });
    // }

    // 转换数据格式
    const camps = (campsData as any[]).map((camp) => ({
      id: camp.id,
      name: camp.name,
      region: camp.region,
      price: camp.price,
      tags: camp.tags || [],
      lat: camp.lat,
      lng: camp.lng,
      description: camp.description,
      facilities: camp.facilities || [],
      difficulty: camp.difficulty,
      rating: camp.rating,
      camp_type: camp.campType || null,
    }));

    // 批量插入或更新
    const { data, error } = await supabase
      .from('camps')
      .upsert(camps, { onConflict: 'id' });

    if (error) {
      console.error('初始化营地数据失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `成功初始化 ${camps.length} 个营地`,
      count: camps.length,
    });
  } catch (error: any) {
    console.error('初始化营地数据失败:', error);
    return NextResponse.json(
      { error: error.message || '初始化失败，请重试' },
      { status: 500 }
    );
  }
}

