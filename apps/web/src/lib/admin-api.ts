'use client';

import { createClientComponentClient } from '@/lib/supabase';

/**
 * 带认证的 fetch 请求
 * 自动从 Supabase session 中获取 access_token 并添加到请求头
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const headers = {
    ...init?.headers,
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  return fetch(input, {
    ...init,
    headers,
  });
}




