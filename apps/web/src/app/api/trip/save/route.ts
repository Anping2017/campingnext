import { NextRequest, NextResponse } from 'next/server';
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必要字段
    if (!body.id || !body.origin || !body.days) {
      return NextResponse.json(
        { error: '缺少必要字段' },
        { status: 400 }
      );
    }

    // TODO: 保存到 Supabase 数据库
    // 当集成 Supabase 后，取消注释以下代码：
    // const supabase = createServerComponentClient();
    // const { data, error } = await supabase
    //   .from('trips')
    //   .insert({
    //     id: body.id,
    //     user_id: (await supabase.auth.getUser()).data.user?.id,
    //     origin: body.origin,
    //     days: body.days,
    //     daily_plans: body.dailyPlans,
    //     notes: body.notes,
    //     created_at: body.createdAt,
    //   });
    // 
    // if (error) {
    //   throw error;
    // }

    // 暂时返回成功（MVP阶段，可以存储在 localStorage 或未来集成数据库）
    return NextResponse.json({
      success: true,
      message: '行程已保存',
      id: body.id,
      // 提示：前端可以将行程保存到 localStorage
      suggestion: '行程已保存，你可以在"我的行程"中查看',
    });
  } catch (error) {
    console.error('保存行程失败:', error);
    return NextResponse.json(
      { error: '保存失败，请稍后重试' },
      { status: 500 }
    );
  }
}

