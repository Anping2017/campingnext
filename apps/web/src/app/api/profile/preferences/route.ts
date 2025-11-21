import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: 保存到 Supabase 数据库
    // const supabase = createServerComponentClient();
    // const { data, error } = await supabase
    //   .from('user_preferences')
    //   .upsert({
    //     user_id: userId,
    //     ...body,
    //   });

    return NextResponse.json({
      success: true,
      message: '偏好设置已保存',
    });
  } catch (error) {
    console.error('保存偏好失败:', error);
    return NextResponse.json(
      { error: '保存失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: 从 Supabase 获取用户偏好
    // const supabase = createServerComponentClient();
    // const { data, error } = await supabase
    //   .from('user_preferences')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .single();

    return NextResponse.json({
      favoriteRegions: [],
      favoriteTypes: [],
      budget: 'medium',
      notifications: true,
    });
  } catch (error) {
    console.error('获取偏好失败:', error);
    return NextResponse.json(
      { error: '获取偏好失败' },
      { status: 500 }
    );
  }
}


