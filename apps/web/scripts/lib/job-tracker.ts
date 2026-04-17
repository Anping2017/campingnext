/**
 * Import Jobs 跟踪
 *
 * 在 import_jobs 表中记录每次批量导入的状态、进度、错误、成本。
 * 用于:
 *   - 后台监控
 *   - 失败排查
 *   - 成本审计
 */
import { getAdminSupabase } from './supabase-admin.js';

export interface JobInit {
  source: string;     // 'doc' | 'google-text-search' | 'google-enrich' | ...
  jobType: 'import' | 'enrich' | 'refresh';
  metadata?: Record<string, unknown>;
}

export interface JobError {
  /** 处理时间(ISO) */
  at: string;
  /** 错误对象 */
  message: string;
  /** 上下文(如营地 id、source_id) */
  context?: Record<string, unknown>;
}

export class JobTracker {
  private jobId: string | null = null;
  private startedAt = Date.now();
  private counters = { total: 0, success: 0, failed: 0, skipped: 0 };
  private errors: JobError[] = [];
  private cost = 0;
  private readonly initData: JobInit;

  constructor(init: JobInit) {
    this.initData = init;
  }

  /** 开始 — 写入 import_jobs 表 status='running' */
  async start(): Promise<void> {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('import_jobs')
      .insert({
        source: this.initData.source,
        job_type: this.initData.jobType,
        status: 'running',
        metadata: this.initData.metadata ?? {},
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`无法创建 import_job:${error?.message ?? 'unknown'}`);
    }
    this.jobId = data.id;
    console.log(`📋 import_job 开始:${this.jobId} (${this.initData.source}/${this.initData.jobType})`);
  }

  recordSuccess() {
    this.counters.total++;
    this.counters.success++;
  }

  recordSkipped(reason?: string, context?: Record<string, unknown>) {
    this.counters.total++;
    this.counters.skipped++;
    if (reason) {
      // 不算错误,只在 verbose 时打印
      if (process.env.VERBOSE) {
        console.log(`  ⏭  skipped:${reason}`, context);
      }
    }
  }

  recordFailure(message: string, context?: Record<string, unknown>) {
    this.counters.total++;
    this.counters.failed++;
    this.errors.push({
      at: new Date().toISOString(),
      message,
      context,
    });
    console.warn(`  ❌ failed:${message}`, context ?? '');
  }

  addCost(usd: number) {
    this.cost += usd;
  }

  /** 完成 — 更新 import_jobs 表(status, finished_at, counts, cost, error_log) */
  async finish(opts: { dryRun?: boolean } = {}): Promise<void> {
    if (!this.jobId) {
      console.warn('JobTracker.finish 调用但 jobId 不存在(可能 start 失败)');
      return;
    }

    const status =
      this.counters.failed === 0 && this.counters.success > 0
        ? 'succeeded'
        : this.counters.success > 0
        ? 'partial'
        : 'failed';

    const supabase = getAdminSupabase();
    const { error } = await supabase
      .from('import_jobs')
      .update({
        status,
        finished_at: new Date().toISOString(),
        total_count: this.counters.total,
        success_count: this.counters.success,
        failed_count: this.counters.failed,
        skipped_count: this.counters.skipped,
        cost_usd: Number(this.cost.toFixed(4)),
        error_log: this.errors.slice(0, 100), // 最多 100 条错误日志
        metadata: {
          ...(this.initData.metadata ?? {}),
          duration_ms: Date.now() - this.startedAt,
          dryRun: opts.dryRun,
        },
      })
      .eq('id', this.jobId);

    if (error) {
      console.error(`无法更新 import_job ${this.jobId}:${error.message}`);
    }

    this.printSummary(status);
  }

  private printSummary(status: string) {
    const dur = ((Date.now() - this.startedAt) / 1000).toFixed(1);
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Job ${status.toUpperCase()} (${dur}s)`);
    console.log(`   total:    ${this.counters.total}`);
    console.log(`   success:  ${this.counters.success}`);
    console.log(`   skipped:  ${this.counters.skipped}`);
    console.log(`   failed:   ${this.counters.failed}`);
    console.log(`   cost:     $${this.cost.toFixed(4)}`);
    console.log(`   job_id:   ${this.jobId}`);
    console.log('═══════════════════════════════════════');
  }
}
