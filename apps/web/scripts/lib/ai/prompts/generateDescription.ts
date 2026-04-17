/**
 * AI Prompt:生成营地描述
 *
 * 输入:营地名称 + 已知事实(地址、类型、设施、坐标、评价摘要等)
 * 输出:short_description + description + highlights + 推断难度 + 推断人群
 *
 * 设计原则:
 *   - 优先用 facts 而非凭空发挥(降低幻觉)
 *   - 区分卡片用短描述和详情页长描述
 *   - 提取 3-5 个独立卖点(highlights)
 */

import type OpenAI from 'openai';
import type { TrackedOpenAI } from '../client.js';
import { CampDescriptionSchema, type CampDescription } from '../schemas/campDescription.js';

export interface DescriptionContext {
  name: string;
  region: string;
  campType?: string;
  address?: string;
  /** 简化的设施列表(可读名,如"厕所、电源") */
  knownFacilities?: string[];
  /** 简化的标签列表(可读名,如"海边、徒步") */
  knownTags?: string[];
  /** 评价综合摘要(来自 analyzeReviews) */
  reviewSummary?: string;
  /** 优点列表(可帮助 AI 提炼 highlights) */
  pros?: string[];
  /** 缺点列表(避免在 highlights 里写优点的反面) */
  cons?: string[];
  /** 海拔/位置上下文 */
  elevationM?: number;
  nearestTown?: string;
  /** 用户提供的描述(如果有,作为优先素材) */
  userHint?: string;
}

const SYSTEM = `你是一名专业的新西兰露营内容编辑,擅长为营地撰写吸引人但不浮夸的中文介绍。

你的任务:基于已知事实,为营地生成结构化的中文描述。

核心要求:
1. **only based on facts** — 不能编造未提及的事实。如设施、距离、海拔等只能用输入提供的信息。
2. short_description(20-50 字):像 Tinder bio,提炼最核心的吸引点,不能是设施罗列。
3. description(200-400 字):4 段式
   ① 营地定位(类型、位置、规模感觉)
   ② 环境特色(自然环境、视野)
   ③ 适合谁(家庭/独行/挑战派,从输入特征判断)
   ④ 实用提示(预订/季节/限制/注意事项)
4. highlights(3-5 条,每条 5-15 字):独立卖点,如:
   - ✅ "无敌海景"、"邻近徒步起点"、"温泉泡汤"
   - ❌ "有厕所"(算设施不算 highlight)、"环境优美"(空话)
5. inferred_difficulty:
   - easy: 通公路、停车方便、地势平缓
   - medium: 需要徒步/越野进入,或山地营地
   - hard: 需登山/长距离徒步进入(背包客营地)
6. inferred_audience(0-3 个):family / solo / group / beginner / experienced
   - 看 facilities 推:有 playground → family;有 wifi/cafe → solo OK
   - 看 difficulty 推:hard → experienced

不要使用空话套话("仿佛置身仙境"、"令人流连忘返"等)。

严格按 JSON schema 输出。`;

const EXAMPLE_DOC: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'user',
    content: `Generate description:
Name: Lake Pukaki Lookout Camp
Region: Mackenzie
CampType: doc_basic
Known facilities: 厕所、停车场
Known tags: 湖边、山景、星空
Nearest town: Twizel (15km)
Elevation: 520m
Review summary: 免费 DOC 营地,以 Mount Cook 湖景和星空为最大卖点,日出震撼。设施极简,常年大风,适合追求自然纯净的旅行者。`,
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      short_description: '免费 DOC 营地,Mount Cook 湖景星空双绝,设施极简但风景值回票价。',
      description:
        'Lake Pukaki Lookout Camp 是 Mackenzie 地区一处免费 DOC 营地,位于 Pukaki 湖畔、海拔 520 米,正对 Mount Cook,是观看日出和星空的绝佳位置。\n\n这里没有任何遮挡,湖光与雪山在不同时段呈现完全不同的色彩,夜晚则因远离光污染成为南半球最佳观星地之一。但环境也意味着常年大风,植被稀疏,几乎没有树荫。\n\n营地以"位置至上"为定位,适合自驾的徒步与摄影爱好者,以及追求极简自然的露营人。家庭用户和需要现代化设施的朋友可能会觉得过于硬核。\n\n实用提示:营地全免费、先到先得,只有简易厕所且无水源、无手机信号,需自备饮水、垃圾袋和保暖装备。最近镇 Twizel 距 15 公里,补给请提前完成。',
      highlights: ['Mount Cook 湖景', '南半球顶级星空', '免费露营', '极致安静', '日出绝景'],
      inferred_difficulty: 'easy',
      inferred_audience: ['solo', 'experienced'],
    }),
  },
];

const FEW_SHOT = [...EXAMPLE_DOC];

export async function generateDescription(
  ai: TrackedOpenAI,
  ctx: DescriptionContext,
  opts: { dryRun?: boolean } = {}
): Promise<CampDescription | null> {
  const userPrompt = buildPrompt(ctx);
  const result = await ai.parse({
    task: 'generateDescription',
    schema: CampDescriptionSchema,
    schemaName: 'camp_description',
    messages: [
      { role: 'system', content: SYSTEM },
      ...FEW_SHOT,
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 1500,
    temperature: 0.5, // 描述需要点创造性,但不能跑飞
    dryRun: opts.dryRun,
  });
  return result.data;
}

function buildPrompt(ctx: DescriptionContext): string {
  const lines: string[] = ['Generate description:'];
  lines.push(`Name: ${ctx.name}`);
  lines.push(`Region: ${ctx.region}`);
  if (ctx.campType) lines.push(`CampType: ${ctx.campType}`);
  if (ctx.address) lines.push(`Address: ${ctx.address}`);
  if (ctx.knownFacilities?.length) lines.push(`Known facilities: ${ctx.knownFacilities.join('、')}`);
  if (ctx.knownTags?.length) lines.push(`Known tags: ${ctx.knownTags.join('、')}`);
  if (ctx.nearestTown) lines.push(`Nearest town: ${ctx.nearestTown}`);
  if (ctx.elevationM !== undefined) lines.push(`Elevation: ${ctx.elevationM}m`);
  if (ctx.reviewSummary) lines.push(`Review summary: ${ctx.reviewSummary}`);
  if (ctx.pros?.length) lines.push(`Top pros: ${ctx.pros.slice(0, 5).join('; ')}`);
  if (ctx.cons?.length) lines.push(`Top cons: ${ctx.cons.slice(0, 3).join('; ')}`);
  if (ctx.userHint) lines.push(`User hint: ${ctx.userHint}`);
  return lines.join('\n');
}
