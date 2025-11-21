import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// 检查 Supabase 配置是否可用
export function isSupabaseConfigured(): boolean {
  // Next.js 会自动将 NEXT_PUBLIC_ 开头的环境变量注入到客户端
  // 直接使用 process.env 即可
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // 调试信息（仅在开发环境且配置缺失时显示）
  if (process.env.NODE_ENV === 'development' && (!url || !key)) {
    const allEnvKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
    console.warn('Supabase 配置检查: 配置缺失', {
      hasUrl: !!url,
      hasKey: !!key,
      url: url ? `${url.substring(0, 30)}...` : 'undefined',
      urlLength: url?.length || 0,
      keyLength: key?.length || 0,
      envKeys: allEnvKeys,
    });
  }
  
  // 检查是否为空字符串、只有空格，或占位符
  const isValid = !!(
    url && 
    typeof url === 'string' &&
    url.trim() && 
    url.trim().length > 0 &&
    !url.includes('your_supabase') &&
    !url.includes('placeholder') &&
    key && 
    typeof key === 'string' &&
    key.trim() && 
    key.trim().length > 0 &&
    !key.includes('your_supabase') &&
    !key.includes('placeholder')
  );
  
  return isValid;
}

// 客户端组件使用
export function createClientComponentClient() {
  // 在客户端，Next.js 会将 NEXT_PUBLIC_ 开头的环境变量注入到客户端
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 检查是否有效（不是空、不是占位符）
  const isValidUrl = url && url.trim() && !url.includes('your_supabase') && !url.includes('placeholder');
  const isValidKey = key && key.trim() && !key.includes('your_supabase') && !key.includes('placeholder');

  if (!isValidUrl || !isValidKey) {
    // 返回一个模拟客户端，避免应用崩溃
    // 所有操作都会静默失败，应用仍可正常使用（仅本地存储）
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase 未配置，认证功能不可用。应用将使用本地存储。', {
        url: url ? '已设置' : '未设置',
        key: key ? '已设置' : '未设置',
      });
    }
  return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
  );
  }

  return createBrowserClient(url.trim(), key.trim());
}

// 服务端组件使用
export function createServerComponentClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase 未配置，认证功能不可用。应用将使用本地存储。');
  return createClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
  );
  }

  return createClient(url, key);
}


