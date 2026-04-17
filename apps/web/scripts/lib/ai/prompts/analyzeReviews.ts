/**
 * AI Prompt:分析 Google Maps 评价
 *
 * 输入:Google Places API 返回的 reviews 数组(英文为主)
 * 输出:结构化的优点/缺点 + 综合摘要 + 各维度评分 + 推断的设施
 *
 * Prompt Caching 友好:system message + few-shot 完全固定,只有用户消息变化
 */

import type OpenAI from 'openai';
import type { TrackedOpenAI } from '../client.js';
import { ReviewAnalysisSchema, type ReviewAnalysis } from '../schemas/reviewAnalysis.js';

/**
 * Google Maps 单条评价的最小数据结构
 */
export interface RawReview {
  rating: number;          // 1-5
  text?: string;           // 原文
  author_name?: string;
  language?: string;
  time?: number;
}

/**
 * SYSTEM PROMPT(完全固定 — prompt caching 关键)
 */
const SYSTEM = `你是一名专业的新西兰露营营地分析师,精通从用户评价中提取关键信息。

你的任务:分析一组 Google Maps 用户评价,产出结构化的中文分析。

核心要求:
1. **只基于评价中的事实**,不要泛泛猜测。如果评价没提到某点,就不要写。
2. 优点和缺点要**具体**,避免"风景好"、"还行"这类空话。
   - ❌ 不好:"环境优美"
   - ✅ 好:"日落时分海面金光闪闪"
3. 每条优点/缺点要分配 aspect 类别(view/facilities/location/cleanliness/value/staff/vibe/access/safety/other)。
4. sentiment 0-1:好评中表示推荐强度,差评中表示问题严重程度。
5. aspect_scores 只对评价中**明确提及**的维度打分,未提及的留 null,不要瞎给。
6. inferred_facilities 只填评价中明确提到的设施,使用项目标准 ID 列表。
7. data_concerns 用于标记疑似问题:评价过少(<3 条)、评价矛盾、疑似不是露营地等。
8. summary 100-150 字,正反兼顾,可读性强,不要列点。

aspect 字典(必须使用其中之一):
- view: 视野/景观(海景、山景、星空)
- facilities: 设施(厕所、厨房、淋浴等)
- location: 地理位置(交通、周边)
- cleanliness: 卫生
- value: 性价比/价格
- staff: 员工服务/接待
- vibe: 氛围(安静、热闹、家庭友好)
- access: 进入难度(路况、坡度、距离)
- safety: 安全
- other: 其他

输出严格按 JSON schema,不要额外说明。`;

/**
 * Few-shot 示例 1:好评为主的 DOC 营地
 */
const EXAMPLE_1: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'user',
    content: `Analyze these reviews for a campsite called "Lake Pukaki Lookout Camp":

⭐⭐⭐⭐⭐ "Stunning views of Mount Cook over the lake. Worth the drive. Pit toilets only, no water - bring your own."
⭐⭐⭐⭐⭐ "Most beautiful sunrise I've ever seen. Very basic facilities but the location makes up for it. Free DOC site."
⭐⭐⭐⭐ "Be aware: very windy, hard to pitch tents. Best in late summer. No cell signal."
⭐⭐⭐⭐⭐ "Free, peaceful, breathtaking. Loo was clean. Stargazing here is unreal."
⭐⭐⭐ "Nice spot but got crowded on weekends. Take all your trash with you."`,
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      pros: [
        { text: 'Mount Cook 湖景日出绝美,星空清晰', aspect: 'view', sentiment: 0.95 },
        { text: '免费 DOC 营地,性价比极高', aspect: 'value', sentiment: 0.9 },
        { text: '环境安静,远离喧嚣', aspect: 'vibe', sentiment: 0.8 },
        { text: '简易厕所相对干净', aspect: 'cleanliness', sentiment: 0.7 },
      ],
      cons: [
        { text: '风大,搭帐篷困难', aspect: 'access', sentiment: 0.65 },
        { text: '无饮用水,需自备', aspect: 'facilities', sentiment: 0.5 },
        { text: '无手机信号', aspect: 'access', sentiment: 0.4 },
        { text: '周末拥挤', aspect: 'vibe', sentiment: 0.45 },
      ],
      summary:
        '免费 DOC 营地,以 Mount Cook 湖景和星空为最大卖点,日出尤其震撼。设施极简(只有简易厕所,无水无信号),且常年大风,搭帐篷需做好准备。最适合追求自然纯净的旅行者,周末避开高峰更佳。',
      aspect_scores: {
        view: 4.9,
        location: 4.8,
        value: 5.0,
        facilities: 2.5,
        cleanliness: 3.8,
        staff: null,
      },
      inferred_facilities: ['toilet', 'parking'],
      data_concerns: [],
    }),
  },
];

/**
 * Few-shot 示例 2:差评较多的 Holiday Park
 */
const EXAMPLE_2: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'user',
    content: `Analyze these reviews for "Riverside Holiday Park":

⭐⭐⭐⭐ "Great location by the river, kids loved the pool. Showers were a bit dated but worked."
⭐⭐ "Reception staff was rude when we checked in late. Wifi barely worked. Won't return."
⭐⭐⭐ "OK for one night. Power site $45/night feels expensive for what you get."
⭐⭐ "Toilets needed cleaning. Loud campervan neighbors at 2am - park did nothing."
⭐⭐⭐⭐⭐ "Best playground we've found! Kids had a blast. Will book again."`,
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      pros: [
        { text: '河边位置好,亲子游乐场出色', aspect: 'view', sentiment: 0.85 },
        { text: '泳池受小朋友欢迎', aspect: 'facilities', sentiment: 0.8 },
      ],
      cons: [
        { text: '接待员态度差,迟到入住被冷遇', aspect: 'staff', sentiment: 0.8 },
        { text: 'WiFi 信号差,几乎不能用', aspect: 'facilities', sentiment: 0.7 },
        { text: '厕所卫生差,需要打扫', aspect: 'cleanliness', sentiment: 0.75 },
        { text: '夜间噪音管理不力,房车噪声扰人', aspect: 'vibe', sentiment: 0.7 },
      ],
      summary:
        '位置临河、亲子设施(尤其是游乐场和泳池)是亮点,适合带娃家庭。但服务态度参差、WiFi 不稳、卫生有改进空间,且夜间噪音管控不到位。$45/晚电营位偏贵,期望和价格不太匹配,建议短住。',
      aspect_scores: {
        view: 3.8,
        location: 4.0,
        facilities: 3.2,
        cleanliness: 2.5,
        staff: 2.0,
        value: 2.8,
      },
      inferred_facilities: ['toilet', 'shower', 'wifi', 'power', 'pool', 'playground', 'reception'],
      data_concerns: [],
    }),
  },
];

const FEW_SHOT: OpenAI.Chat.ChatCompletionMessageParam[] = [...EXAMPLE_1, ...EXAMPLE_2];

/**
 * 主入口
 */
export async function analyzeReviews(
  ai: TrackedOpenAI,
  campName: string,
  reviews: RawReview[],
  opts: { dryRun?: boolean } = {}
): Promise<ReviewAnalysis | null> {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  // 截断:取最多 15 条评价,每条最长 500 字符,以控制 token 用量
  const sampled = reviews.slice(0, 15).map((r) => ({
    rating: r.rating,
    text: (r.text ?? '').slice(0, 500),
  }));

  const reviewsBlock = sampled
    .map((r) => `${'⭐'.repeat(Math.round(r.rating))} "${r.text}"`)
    .join('\n');

  const userMessage: OpenAI.Chat.ChatCompletionMessageParam = {
    role: 'user',
    content: `Analyze these reviews for "${campName}":\n\n${reviewsBlock}`,
  };

  const result = await ai.parse({
    task: 'analyzeReviews',
    schema: ReviewAnalysisSchema,
    schemaName: 'review_analysis',
    messages: [
      { role: 'system', content: SYSTEM },
      ...FEW_SHOT,
      userMessage,
    ],
    maxTokens: 1500,
    temperature: 0.3,
    dryRun: opts.dryRun,
  });

  return result.data;
}
