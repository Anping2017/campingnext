import { NextRequest } from 'next/server';
import { getSupabaseClient } from './supabase-server';

/**
 * 服务端检查用户是否为管理员
 */
export async function checkAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId: string | null; error?: string }> {
  try {
    // 从请求头获取 authorization token
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    
    // 创建带认证的 Supabase 客户端
    const supabase = getSupabaseClient(request, accessToken);
    if (!supabase) {
      return { isAdmin: false, userId: null, error: 'Supabase 未配置' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('获取用户失败:', authError);
      return { isAdmin: false, userId: null, error: '未登录' };
    }

    // 查询管理员表
    const { data, error } = await supabase
      .from('admins')
      .select('user_id, role, email')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // 如果是 "no rows" 错误，说明不是管理员
      if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('0 rows')) {
        return { isAdmin: false, userId: user.id, error: '不是管理员' };
      }
      // 其他错误（如 RLS 策略错误）
      console.error('查询管理员表失败:', { error, code: error.code, message: error.message, details: error.details });
      return { isAdmin: false, userId: user.id, error: `查询失败: ${error.message || error.code}` };
    }

    if (!data) {
      return { isAdmin: false, userId: user.id, error: '不是管理员' };
    }

    console.log('管理员权限验证成功:', { userId: user.id, email: data.email, role: data.role });
    return { isAdmin: true, userId: user.id };
  } catch (error: any) {
    console.error('检查管理员权限失败:', error);
    return { isAdmin: false, userId: null, error: error.message || '检查权限失败' };
  }
}

/**
 * 服务端检查用户是否为超级管理员
 */
export async function checkSuperAdmin(request: NextRequest): Promise<{ isSuperAdmin: boolean; userId: string | null; error?: string }> {
  const supabase = getSupabaseClient(request);
  if (!supabase) {
    return { isSuperAdmin: false, userId: null, error: 'Supabase 未配置' };
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { isSuperAdmin: false, userId: null, error: '未登录' };
    }

    const { data, error } = await supabase
      .from('admins')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (error || !data) {
      return { isSuperAdmin: false, userId: user.id, error: '不是超级管理员' };
    }

    return { isSuperAdmin: true, userId: user.id };
  } catch (error: any) {
    console.error('检查超级管理员权限失败:', error);
    return { isSuperAdmin: false, userId: null, error: error.message || '检查权限失败' };
  }
}









