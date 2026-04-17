import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-server';

/**
 * 检查当前用户是否为管理员
 * 注意：客户端需要传递 session token 在请求头中
 */
export async function GET(request: NextRequest) {
  try {
    const { isAdmin: isAdminUser, userId, error } = await checkAdmin(request);
    
    return NextResponse.json({
      isAdmin: isAdminUser,
      userId,
      error: error || null,
    });
  } catch (error: any) {
    console.error('检查管理员权限失败:', error);
    return NextResponse.json(
      { isAdmin: false, userId: null, error: error.message || '检查权限失败' },
      { status: 500 }
    );
  }
}









