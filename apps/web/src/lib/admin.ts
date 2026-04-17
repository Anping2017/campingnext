import { createClientComponentClient } from './supabase';

/**
 * 检查用户是否为管理员（客户端使用）
 * 注意：需要使用带 session 的客户端才能通过 RLS 检查
 */
export async function isAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) {
    console.log('isAdmin: userId 为空');
    return false;
  }

  try {
    // 使用客户端组件客户端，它会自动包含用户的 session
    const supabase = createClientComponentClient();
    
    // 先获取当前 session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('获取 session 失败:', sessionError);
    }
    if (!session) {
      console.log('isAdmin: 没有 session');
      return false;
    }

    console.log('isAdmin: 开始查询 admins 表', { userId, sessionUserId: session.user.id });

    // 使用带 session 的客户端查询
    const { data, error } = await supabase
      .from('admins')
      .select('user_id, role, email')
      .eq('user_id', userId)
      .single();

    if (error) {
      // 如果是 "no rows" 错误，说明不是管理员
      if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('0 rows')) {
        console.log('isAdmin: 不是管理员（表中无记录）');
        return false;
      }
      // 如果是权限错误，说明不是管理员或 RLS 策略问题
      if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('permission denied')) {
        console.warn('isAdmin: RLS 策略阻止查询，可能不是管理员或策略未正确配置', error);
        return false;
      }
      console.error('isAdmin: 查询失败', { error, code: error.code, message: error.message });
      return false;
    }

    const isAdminUser = !!data;
    console.log('isAdmin: 查询结果', { isAdminUser, data });
    return isAdminUser;
  } catch (error: any) {
    console.error('isAdmin: 检查管理员权限失败', error);
    return false;
  }
}

/**
 * 检查用户是否为超级管理员
 */
export async function isSuperAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('admins')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('检查超级管理员权限失败:', error);
    return false;
  }
}

/**
 * 获取管理员信息
 */
export async function getAdminInfo(userId: string | undefined): Promise<{ role: string; email: string } | null> {
  if (!userId) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('admins')
      .select('role, email')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      role: data.role,
      email: data.email,
    };
  } catch (error) {
    console.error('获取管理员信息失败:', error);
    return null;
  }
}









