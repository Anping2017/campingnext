/**
 * Service-role Supabase 客户端(仅 scripts 使用)
 *
 * 使用 service_role key 绕过 RLS,可读写所有表。
 * 极其敏感,绝不可暴露到前端。
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 自动加载 apps/web/.env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../../.env.local') });

let cachedClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      '❌ NEXT_PUBLIC_SUPABASE_URL 未配置。请检查 apps/web/.env.local。'
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      '❌ SUPABASE_SERVICE_ROLE_KEY 未配置。\n' +
        '   请在 Supabase Dashboard → Settings → API → 复制 service_role key,\n' +
        '   然后追加到 apps/web/.env.local:\n' +
        '   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...\n' +
        '   ⚠️  这个 key 权限极高,绝不可加 NEXT_PUBLIC_ 前缀!'
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

/**
 * 健康检查 — 启动时调用,失败立即退出
 */
export async function ensureAdminClient(): Promise<SupabaseClient> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('camps').select('id', { head: true, count: 'exact' });
  if (error) {
    throw new Error(`❌ Supabase 连接失败:${error.message}`);
  }
  return supabase;
}
