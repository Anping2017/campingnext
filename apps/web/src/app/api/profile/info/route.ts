import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, bio } = body;

    // TODO: 保存到 Supabase 数据库
    // const supabase = createServerComponentClient();
    // const { data, error } = await supabase
    //   .from('profiles')
    //   .upsert({
    //     user_id: userId,
    //     username,
    //     email,
    //     bio,
    //   });

    return NextResponse.json({
      success: true,
      message: '资料已更新',
    });
  } catch (error) {
    console.error('更新资料失败:', error);
    return NextResponse.json(
      { error: '更新失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: 从 Supabase 获取用户资料
    // const supabase = createServerComponentClient();
    // const { data, error } = await supabase
    //   .from('profiles')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .single();

    return NextResponse.json({
      username: '露营爱好者',
      email: 'user@example.com',
      bio: '',
      joinDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取资料失败:', error);
    return NextResponse.json(
      { error: '获取资料失败' },
      { status: 500 }
    );
  }
}


