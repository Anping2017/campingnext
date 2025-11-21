import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: 从 Supabase 数据库获取用户的行程列表
    // const supabase = createServerComponentClient();
    // const { data: user } = await supabase.auth.getUser();
    // const { data, error } = await supabase
    //   .from('trips')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .order('created_at', { ascending: false });

    // 暂时返回空数组（MVP阶段，前端从localStorage获取）
    return NextResponse.json({
      trips: [],
      message: '请从 localStorage 获取行程列表',
    });
  } catch (error) {
    console.error('获取行程列表失败:', error);
    return NextResponse.json(
      { error: '获取行程列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}


