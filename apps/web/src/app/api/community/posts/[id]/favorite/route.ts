import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// 收藏/取消收藏
export async function POST(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const postId = params.id;

    // 检查是否已收藏
    const { data: existingFavorite } = await supabase
      .from('post_favorites')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingFavorite) {
      // 取消收藏
      await supabase
        .from('post_favorites')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      return NextResponse.json({ favorited: false });
    } else {
      // 添加收藏
      await supabase
        .from('post_favorites')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      return NextResponse.json({ favorited: true });
    }
  } catch (error: any) {
    console.error('收藏失败:', error);
    return NextResponse.json(
      { error: error.message || '操作失败，请重试' },
      { status: 500 }
    );
  }
}

