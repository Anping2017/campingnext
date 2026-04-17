import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-server';
import { getSupabaseClient } from '@/lib/supabase-server';

// 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const { isAdmin: isAdminUser, userId, error: authError } = await checkAdmin(request);
    if (!isAdminUser || !userId) {
      return NextResponse.json(
        { error: authError || '无权限访问' },
        { status: 403 }
      );
    }

    // 从请求头获取 token，确保 Supabase 客户端有正确的认证
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    const supabase = getSupabaseClient(request, accessToken);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: posts, error } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('获取帖子列表失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 获取总数
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('获取帖子列表失败:', error);
    return NextResponse.json(
      { error: error.message || '获取帖子列表失败' },
      { status: 500 }
    );
  }
}

// 删除帖子
export async function DELETE(request: NextRequest) {
  try {
    // 检查管理员权限
    const { isAdmin: isAdminUser, userId, error: authError } = await checkAdmin(request);
    if (!isAdminUser || !userId) {
      return NextResponse.json(
        { error: authError || '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: '帖子ID必填' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('删除帖子失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '帖子已删除',
    });
  } catch (error: any) {
    console.error('删除帖子失败:', error);
    return NextResponse.json(
      { error: error.message || '删除帖子失败' },
      { status: 500 }
    );
  }
}









