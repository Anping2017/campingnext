import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/camps/stats
 *
 * 返回营地数据的聚合统计:
 *   - 按 status 分组(pending / published / rejected / archived)
 *   - 按 source 分组(doc / google / manual / osm)
 *   - 按 region 分组
 *   - 按 camp_type 分组
 *   - 总数 / 平均 quality_score / 平均 rating
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

    // 拉取所有营地的关键字段(用于聚合)
    const { data, error } = await supabase
      .from('camps')
      .select('id, status, source, region, camp_type, rating, data_quality_score');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const camps = data ?? [];

    // 按 status 分组
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byCampType: Record<string, number> = {};
    let totalRating = 0;
    let ratingCount = 0;
    let totalQuality = 0;
    let qualityCount = 0;

    for (const c of camps as any[]) {
      byStatus[c.status ?? 'unknown'] = (byStatus[c.status ?? 'unknown'] ?? 0) + 1;
      bySource[c.source ?? 'unknown'] = (bySource[c.source ?? 'unknown'] ?? 0) + 1;
      byRegion[c.region ?? 'Unknown'] = (byRegion[c.region ?? 'Unknown'] ?? 0) + 1;
      byCampType[c.camp_type ?? 'unknown'] = (byCampType[c.camp_type ?? 'unknown'] ?? 0) + 1;
      if (typeof c.rating === 'number' && c.rating > 0) {
        totalRating += c.rating;
        ratingCount++;
      }
      if (typeof c.data_quality_score === 'number') {
        totalQuality += c.data_quality_score;
        qualityCount++;
      }
    }

    // 拉最近 10 个 import_jobs
    const { data: jobs } = await supabase
      .from('import_jobs')
      .select('id, source, job_type, status, started_at, finished_at, total_count, success_count, failed_count, skipped_count, cost_usd')
      .order('started_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      total: camps.length,
      byStatus,
      bySource,
      byRegion,
      byCampType,
      avgRating: ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : 0,
      avgQuality: qualityCount > 0 ? Number((totalQuality / qualityCount).toFixed(3)) : 0,
      ratingCoverage: camps.length > 0 ? Number((ratingCount / camps.length).toFixed(2)) : 0,
      recentJobs: jobs ?? [],
    });
  } catch (error: any) {
    console.error('camps/stats 失败:', error);
    return NextResponse.json({ error: error.message ?? '失败' }, { status: 500 });
  }
}
