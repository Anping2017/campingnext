import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/import-jobs
 *
 * 列出最近的 import jobs。
 * 查询参数:
 *   ?status=running|succeeded|failed|partial   按 status 过滤
 *   ?source=doc|google-text-search|...         按 source 过滤
 *   ?limit=20                                  默认 20
 *   ?offset=0                                  分页
 */
export async function GET(request: NextRequest) {
  try {
    const { isAdmin: isAdminUser, userId, error: authError } = await checkAdmin(request);
    if (!isAdminUser || !userId) {
      return NextResponse.json({ error: authError || '无权限访问' }, { status: 403 });
    }

    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    const supabase = getSupabaseClient(request, accessToken);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = supabase
      .from('import_jobs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      jobs: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('import-jobs GET 失败:', error);
    return NextResponse.json({ error: error.message ?? '失败' }, { status: 500 });
  }
}
