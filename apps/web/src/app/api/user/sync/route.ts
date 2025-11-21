import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// 同步用户数据到 Supabase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, data, dataType, accessToken } = body;

    // 使用 accessToken 创建认证的 Supabase 客户端
    const supabase = getSupabaseClient(request, accessToken);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID必填' },
        { status: 400 }
      );
    }

    // 根据数据类型保存到不同的表
    let result;
    switch (dataType) {
      case 'preferences':
        // 保存用户偏好
        result = await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            preferences: data,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });
        break;

      case 'onboarding':
        // 保存引导数据
        result = await supabase
          .from('user_onboarding')
          .upsert({
            user_id: userId,
            onboarding_data: data,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });
        break;

      case 'trips':
        // 保存行程
        result = await supabase
          .from('user_trips')
          .insert({
            user_id: userId,
            trip_data: data,
            created_at: new Date().toISOString(),
          });
        break;

      case 'favorites':
        // 保存收藏
        result = await supabase
          .from('user_favorites')
          .upsert({
            user_id: userId,
            favorite_camps: data,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });
        break;

      default:
        return NextResponse.json(
          { error: '未知的数据类型' },
          { status: 400 }
        );
    }

    if (result.error) {
      console.error('Supabase 操作错误:', {
        error: result.error,
        dataType,
        userId,
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint,
      });
      return NextResponse.json(
        { 
          error: result.error.message,
          code: result.error.code,
          hint: result.error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('同步用户数据失败:', error);
    return NextResponse.json(
      { error: error.message || '同步失败，请重试' },
      { status: 500 }
    );
  }
}

// 获取用户数据
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
    const userId = searchParams.get('userId');
    const dataType = searchParams.get('dataType');

    if (!userId || !dataType) {
      return NextResponse.json(
        { error: '用户ID和数据类型必填' },
        { status: 400 }
      );
    }

    let result;
    switch (dataType) {
      case 'preferences':
        result = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', userId)
          .single();
        break;

      case 'onboarding':
        result = await supabase
          .from('user_onboarding')
          .select('onboarding_data')
          .eq('user_id', userId)
          .single();
        break;

      case 'trips':
        result = await supabase
          .from('user_trips')
          .select('trip_data, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        break;

      case 'favorites':
        result = await supabase
          .from('user_favorites')
          .select('favorite_camps')
          .eq('user_id', userId)
          .single();
        break;

      default:
        return NextResponse.json(
          { error: '未知的数据类型' },
          { status: 400 }
        );
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('获取用户数据失败:', error);
    return NextResponse.json(
      { error: '获取失败，请重试' },
      { status: 500 }
    );
  }
}

