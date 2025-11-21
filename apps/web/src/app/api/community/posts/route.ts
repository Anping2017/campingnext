import { NextRequest, NextResponse } from 'next/server';
import { CreatePostData } from '@/types/post';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const body: CreatePostData = await request.json();
    const { title, content, images, campId } = body;

    if (!title || !content || !images || images.length < 3) {
      return NextResponse.json(
        { error: '标题、内容和至少3张图片是必填项' },
        { status: 400 }
      );
    }

    if (images.length > 12) {
      return NextResponse.json(
        { error: '最多只能上传12张图片' },
        { status: 400 }
      );
    }

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // 从用户邮箱获取用户名
    const username = user.email?.split('@')[0] || user.id.substring(0, 8) || '用户';

    // 获取营地名称（如果有 campId）
    let campName = null;
    if (campId) {
      const { data: camp } = await supabase
        .from('camps')
        .select('name')
        .eq('id', campId)
        .single();
      campName = camp?.name || null;
    }

    // 插入帖子
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        username,
        title,
        content,
        images,
        camp_id: campId || null,
        camp_name: campName,
        likes: 0,
        comments: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('发布帖子失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 转换为前端格式
    const newPost = {
      id: post.id,
      userId: post.user_id,
      username: post.username,
      title: post.title,
      content: post.content,
      images: post.images,
      campId: post.camp_id || undefined,
      campName: post.camp_name || undefined,
      likes: post.likes,
      comments: post.comments,
      isLiked: false,
      isFavorited: false,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };

    return NextResponse.json(newPost);
  } catch (error: any) {
    console.error('发布帖子失败:', error);
    return NextResponse.json(
      { error: error.message || '发布失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const campId = searchParams.get('campId');
    const userId = searchParams.get('userId');

    // 获取当前用户（用于判断点赞和收藏状态）
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    // 构建查询
    let query = supabase.from('posts').select('*');
    
    if (campId) {
      query = query.eq('camp_id', campId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: posts, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('获取帖子失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 获取点赞和收藏状态
    const postIds = posts?.map(p => p.id) || [];
    let likedPostIds: string[] = [];
    let favoritedPostIds: string[] = [];

    if (currentUserId && postIds.length > 0) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      const { data: favorites } = await supabase
        .from('post_favorites')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      likedPostIds = likes?.map(l => l.post_id) || [];
      favoritedPostIds = favorites?.map(f => f.post_id) || [];
    }

    // 转换为前端格式
    const formattedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      userId: post.user_id,
      username: post.username,
      title: post.title,
      content: post.content,
      images: post.images || [],
      campId: post.camp_id || undefined,
      campName: post.camp_name || undefined,
      likes: post.likes || 0,
      comments: post.comments || 0,
      isLiked: likedPostIds.includes(post.id),
      isFavorited: favoritedPostIds.includes(post.id),
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    }));

    return NextResponse.json(formattedPosts);
  } catch (error: any) {
    console.error('获取帖子失败:', error);
    return NextResponse.json(
      { error: error.message || '获取帖子失败' },
      { status: 500 }
    );
  }
}


