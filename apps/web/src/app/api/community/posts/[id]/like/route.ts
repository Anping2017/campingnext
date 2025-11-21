import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// 点赞/取消点赞
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

    // 检查是否已点赞
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // 取消点赞
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      // 更新帖子点赞数
      const { data: post } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single();

      await supabase
        .from('posts')
        .update({ likes: Math.max(0, (post?.likes || 0) - 1) })
        .eq('id', postId);

      return NextResponse.json({ liked: false });
    } else {
      // 添加点赞
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      // 更新帖子点赞数
      const { data: post } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single();

      await supabase
        .from('posts')
        .update({ likes: (post?.likes || 0) + 1 })
        .eq('id', postId);

      return NextResponse.json({ liked: true });
    }
  } catch (error: any) {
    console.error('点赞失败:', error);
    return NextResponse.json(
      { error: error.message || '操作失败，请重试' },
      { status: 500 }
    );
  }
}

