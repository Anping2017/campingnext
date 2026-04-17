import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import campsData from '@/data/camps.json';

/**
 * 初始化营地数据到 Supabase
 * 
 * 使用方法：
 * 1. 浏览器访问：POST http://localhost:3000/api/camps/init
 * 2. 或使用 curl：curl -X POST http://localhost:3000/api/camps/init
 * 3. 或在浏览器控制台：fetch('/api/camps/init', { method: 'POST' }).then(r => r.json()).then(console.log)
 * 
 * 注意：
 * - 此端点会使用 upsert，已存在的营地会被更新
 * - 确保 Supabase 已配置且 camps 表已创建
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置，请检查环境变量 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY' },
        { status: 503 }
      );
    }

    // 转换数据格式（从 JSON 格式转换为数据库格式）
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
      camp_type: camp.campType || null, // JSON 中是 campType，数据库中是 camp_type
    }));

    if (camps.length === 0) {
      return NextResponse.json(
        { error: '没有可初始化的营地数据' },
        { status: 400 }
      );
    }

    // 批量插入或更新（使用 upsert，如果已存在则更新）
    const { data, error } = await supabase
      .from('camps')
      .upsert(camps, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('初始化营地数据失败:', error);
      return NextResponse.json(
        { 
          error: error.message,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `成功初始化 ${camps.length} 个营地`,
      count: camps.length,
      data: data?.length || 0,
    });
  } catch (error: any) {
    console.error('初始化营地数据失败:', error);
    return NextResponse.json(
      { error: error.message || '初始化失败，请重试' },
      { status: 500 }
    );
  }
}

/**
 * GET 方法：检查数据库中的营地数量
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const { count, error } = await supabase
      .from('camps')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: count || 0,
      message: count === 0 
        ? '数据库中暂无营地数据，请使用 POST 方法初始化' 
        : `数据库中有 ${count} 个营地`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}

