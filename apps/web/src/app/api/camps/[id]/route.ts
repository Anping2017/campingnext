import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// 获取单个营地信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const { data: camp, error } = await supabase
      .from('camps')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '营地不存在' },
          { status: 404 }
        );
      }
      console.error('获取营地失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 转换为前端格式
    const formattedCamp = {
      id: camp.id,
      name: camp.name,
      region: camp.region,
      price: parseFloat(camp.price),
      tags: camp.tags || [],
      lat: parseFloat(camp.lat),
      lng: parseFloat(camp.lng),
      description: camp.description,
      facilities: camp.facilities || [],
      difficulty: camp.difficulty,
      rating: parseFloat(camp.rating),
      campType: camp.camp_type || undefined,
    };

    return NextResponse.json(formattedCamp);
  } catch (error: any) {
    console.error('获取营地失败:', error);
    return NextResponse.json(
      { error: '获取营地失败，请重试' },
      { status: 500 }
    );
  }
}

