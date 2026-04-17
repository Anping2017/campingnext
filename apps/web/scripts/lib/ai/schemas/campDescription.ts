/**
 * Zod schema:营地描述生成结果
 *
 * 用于 generateDescription() 的强类型输出约束。
 */
import { z } from 'zod';

export const CampDescriptionSchema = z.object({
  short_description: z
    .string()
    .min(15)
    .max(80)
    .describe('20-50 字中文,卡片显示用。提炼最核心吸引点,无空话。'),
  description: z
    .string()
    .min(80)
    .max(500)
    .describe('200-400 字中文详细描述。结构:开头一句营地定位 → 环境特色 → 适合人群 → 注意事项'),
  highlights: z
    .array(z.string().min(4).max(20))
    .min(3)
    .max(5)
    .describe('3-5 条独立卖点,每条 5-15 字,如"无敌海景"、"邻近徒步起点"、"温泉泡汤"。' +
              '避免与设施重复(如"有厕所"不算 highlight)'),
  inferred_difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('根据地点类型/海拔/可达性推断的难度'),
  inferred_audience: z
    .array(z.enum(['family', 'solo', 'group', 'beginner', 'experienced']))
    .describe('适合人群标签(0-3 个)'),
});

export type CampDescription = z.infer<typeof CampDescriptionSchema>;
