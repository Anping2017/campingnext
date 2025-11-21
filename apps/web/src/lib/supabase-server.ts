import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端（服务端使用，带用户认证）
export function getSupabaseClient(request: NextRequest, accessToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  // 优先使用参数中的 token，其次使用请求头中的 token
  const token = accessToken || request.headers.get('authorization')?.replace('Bearer ', '');

  // 创建 Supabase 客户端，如果提供了 token 则使用它
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    },
    auth: {
      persistSession: false, // 服务端不需要持久化 session
    },
  });

  return supabase;
}

