import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// 获取营地列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const campType = searchParams.get('campType');
    const difficulty = searchParams.get('difficulty');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    let query = supabase.from('camps').select('*');

    if (region) {
      query = query.eq('region', region);
    }
    if (campType) {
      query = query.eq('camp_type', campType);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) {
      console.error('获取营地失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ camps: data || [] });
  } catch (error: any) {
    console.error('获取营地失败:', error);
    return NextResponse.json(
      { error: '获取营地失败，请重试' },
      { status: 500 }
    );
  }
}

// 创建或更新营地（用于初始化数据）
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { camps } = body;

    if (!Array.isArray(camps)) {
      return NextResponse.json(
        { error: 'camps 必须是数组' },
        { status: 400 }
      );
    }

    // 批量插入或更新营地
    const { data, error } = await supabase
      .from('camps')
      .upsert(camps, { onConflict: 'id' });

    if (error) {
      console.error('保存营地失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: camps.length });
  } catch (error: any) {
    console.error('保存营地失败:', error);
    return NextResponse.json(
      { error: '保存营地失败，请重试' },
      { status: 500 }
    );
  }
}

