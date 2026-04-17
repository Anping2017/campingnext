/**
 * TrackedOpenAI — OpenAI 客户端封装
 *
 * 特性:
 *   - Zod Structured Output(类型安全,无需手动 JSON.parse)
 *   - 自动重试(p-retry, 指数退避)
 *   - Token 用量 + 成本累计追踪
 *   - 详细日志
 *   - Dry-run 模式(打印 prompt 不调用)
 *
 * Prompt Caching:
 *   OpenAI 自动对 1024+ tokens 的 messages 前缀做 caching。
 *   只要 system message + few-shot examples 完全一致,后续调用 input cost 减半。
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import pRetry from 'p-retry';
import { z } from 'zod';

// 价格表(USD per 1M tokens)— 2024 年 OpenAI 定价
// 参考:https://openai.com/api/pricing/
const PRICING: Record<string, { input: number; cachedInput: number; output: number }> = {
  'gpt-4o-mini':     { input: 0.150,  cachedInput: 0.075,  output: 0.600 },
  'gpt-4o':          { input: 2.500,  cachedInput: 1.250,  output: 10.000 },
  'gpt-4-turbo':     { input: 10.000, cachedInput: 10.000, output: 30.000 },
};

export interface CallOptions<T> {
  /** 任务名(用于日志) */
  task: string;
  /** OpenAI 模型 */
  model?: string;
  /** Messages */
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  /** 期望输出的 Zod schema */
  schema: z.ZodType<T>;
  /** Schema 名(给 OpenAI 看) */
  schemaName: string;
  /** 最大 output tokens */
  maxTokens?: number;
  /** 温度(默认 0.3,低温度更稳) */
  temperature?: number;
  /** 重试次数(默认 3) */
  retries?: number;
  /** Dry-run 不实际调用,返回 null */
  dryRun?: boolean;
}

export interface CallResult<T> {
  data: T | null;
  usage: {
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
  durationMs: number;
}

export class TrackedOpenAI {
  private client: OpenAI;
  private totals = {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    cost: 0,
    calls: 0,
  };
  private verbose: boolean;

  constructor(apiKey: string, opts: { verbose?: boolean } = {}) {
    this.client = new OpenAI({ apiKey });
    this.verbose = opts.verbose ?? false;
  }

  static fromEnv(opts: { verbose?: boolean } = {}): TrackedOpenAI {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY 未设置(在 apps/web/.env.local)');
    }
    return new TrackedOpenAI(key, opts);
  }

  async parse<T>(opts: CallOptions<T>): Promise<CallResult<T>> {
    const model = opts.model ?? 'gpt-4o-mini';
    const start = Date.now();

    if (opts.dryRun) {
      // 估算 token(粗略:1 token ≈ 4 字符)
      const promptText = opts.messages.map((m) => JSON.stringify(m)).join('\n');
      const estimatedInput = Math.ceil(promptText.length / 4);
      const estimatedOutput = opts.maxTokens ?? 800;
      const cost = computeCost(model, estimatedInput, 0, estimatedOutput);
      console.log(`[DRY-RUN] [${opts.task}] est: in=${estimatedInput} out=${estimatedOutput} ~$${cost.toFixed(5)}`);
      return {
        data: null,
        usage: {
          inputTokens: estimatedInput,
          cachedInputTokens: 0,
          outputTokens: estimatedOutput,
          totalTokens: estimatedInput + estimatedOutput,
          cost,
        },
        durationMs: 0,
      };
    }

    const result = await pRetry(
      async () => {
        const completion = await this.client.beta.chat.completions.parse({
          model,
          messages: opts.messages,
          response_format: zodResponseFormat(opts.schema, opts.schemaName),
          temperature: opts.temperature ?? 0.3,
          max_tokens: opts.maxTokens ?? 1500,
        });
        const choice = completion.choices[0];
        if (choice.message.refusal) {
          throw new Error(`OpenAI refused: ${choice.message.refusal}`);
        }
        return completion;
      },
      {
        retries: opts.retries ?? 3,
        minTimeout: 1000,
        factor: 2,
        onFailedAttempt: (err) => {
          console.warn(`[AI] [${opts.task}] retry ${err.attemptNumber}/${(opts.retries ?? 3) + 1}: ${err.message}`);
        },
      }
    );

    const usage = result.usage;
    const inputTokens = usage?.prompt_tokens ?? 0;
    const cachedInputTokens = usage?.prompt_tokens_details?.cached_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    const cost = computeCost(model, inputTokens - cachedInputTokens, cachedInputTokens, outputTokens);

    this.totals.inputTokens += inputTokens;
    this.totals.cachedInputTokens += cachedInputTokens;
    this.totals.outputTokens += outputTokens;
    this.totals.cost += cost;
    this.totals.calls++;

    const durationMs = Date.now() - start;

    if (this.verbose) {
      const cacheTag = cachedInputTokens > 0 ? ` (cached:${cachedInputTokens})` : '';
      console.log(
        `[AI] [${opts.task}] ${durationMs}ms ` +
          `in=${inputTokens}${cacheTag} out=${outputTokens} $${cost.toFixed(5)} ` +
          `cum=$${this.totals.cost.toFixed(4)}`
      );
    }

    return {
      data: result.choices[0].message.parsed as T,
      usage: { inputTokens, cachedInputTokens, outputTokens, totalTokens: inputTokens + outputTokens, cost },
      durationMs,
    };
  }

  /** 当前累计成本(USD) */
  getTotalCost(): number {
    return this.totals.cost;
  }

  /** 当前累计 token 用量 */
  getTotalUsage() {
    return { ...this.totals };
  }

  /** 重置累计 */
  resetUsage() {
    this.totals = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, cost: 0, calls: 0 };
  }
}

function computeCost(
  model: string,
  inputTokens: number,
  cachedInputTokens: number,
  outputTokens: number
): number {
  const p = PRICING[model] ?? PRICING['gpt-4o-mini'];
  return (
    (inputTokens / 1_000_000) * p.input +
    (cachedInputTokens / 1_000_000) * p.cachedInput +
    (outputTokens / 1_000_000) * p.output
  );
}
