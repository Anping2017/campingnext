/**
 * Zod schema:Google Maps 评价分析结果
 *
 * 用于 analyzeReviews() 的强类型输出约束。
 *
 * ⚠️  OpenAI Structured Output 限制:
 *   - 所有字段必须是 required(用 .nullable() 表示可选)
 *   - 不能用 .optional()
 *   - Object 必须用 .strict()
 */
import { z } from 'zod';

export const ReviewAspectEnum = z.enum([
  'view',         // 视野/景观
  'facilities',   // 设施
  'location',     // 地理位置
  'cleanliness',  // 卫生
  'value',        // 性价比
  'staff',        // 员工/服务
  'vibe',         // 氛围
  'access',       // 可达性
  'safety',       // 安全
  'other',
]);

const ReviewItemSchema = z.object({
  text: z.string().describe('简洁的中文描述,10-25 字'),
  aspect: ReviewAspectEnum.describe('评价所属 aspect'),
  sentiment: z.number().min(0).max(1).describe('情感强度 0-1(优点为正向强度,缺点为负面严重程度)'),
});

const AspectScoresSchema = z.object({
  facilities: z.number().min(0).max(5).nullable().describe('设施评分 0-5,无评价提及则 null'),
  location: z.number().min(0).max(5).nullable().describe('位置评分 0-5'),
  cleanliness: z.number().min(0).max(5).nullable().describe('卫生评分 0-5'),
  value: z.number().min(0).max(5).nullable().describe('性价比评分 0-5'),
  staff: z.number().min(0).max(5).nullable().describe('员工服务评分 0-5'),
  view: z.number().min(0).max(5).nullable().describe('视野评分 0-5'),
});

export const ReviewAnalysisSchema = z.object({
  pros: z
    .array(ReviewItemSchema)
    .max(5)
    .describe('从好评中提取的 3-5 个独立优点。空数组表示无好评。'),
  cons: z
    .array(ReviewItemSchema)
    .max(4)
    .describe('从差评中提取的 0-4 个主要问题。空数组表示无差评。'),
  summary: z
    .string()
    .max(200)
    .describe('100-150 字的中文综合摘要,正反兼顾,避免空话套话'),
  aspect_scores: AspectScoresSchema.describe(
    '各维度 0-5 评分。未在评价中明确提及的维度返回 null。'
  ),
  inferred_facilities: z
    .array(z.string())
    .describe(
      '从评价文本中推断的设施 ID(从评价中"明确提到"的才算)。' +
        '使用以下 ID 之一:toilet, water, parking, trash, shower, kitchen, power, ' +
        'wifi, laundry, hot-spring, spa, cafe, bbq, fire-pit, playground, pool, shop, reception'
    ),
  data_concerns: z
    .array(z.string())
    .describe('数据可疑信号(如"评价过少"、"评价矛盾"、"疑似不是营地")。空数组表示无问题。'),
});

export type ReviewAnalysis = z.infer<typeof ReviewAnalysisSchema>;
