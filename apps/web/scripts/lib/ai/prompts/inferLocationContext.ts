/**
 * AI Prompt:推断地理上下文
 *
 * 输入:营地名称 + 坐标 + 地址(可选)
 * 输出:nearest_town, distance_to_town_km, sub_region, elevation_m, campfire_policy, pet_policy
 *
 * 这些字段是 Google Places API 不直接提供的,但 LLM 可以基于地理常识合理推断。
 * 用 GPT-4o-mini + 低温度,期望保守可靠的输出。
 */

import type OpenAI from 'openai';
import type { TrackedOpenAI } from '../client.js';
import { LocationContextSchema, type LocationContext } from '../schemas/locationContext.js';

const SYSTEM = `你是一位精通新西兰地理的专家,熟悉所有主要城镇、自然保护区、海拔分布、地区习俗。

你的任务:根据营地名称、坐标、地址,推断:
1. nearest_town:最近的有补给的城镇(如 Te Anau、Twizel),不是行政区。不知道返回 null。
2. distance_to_town_km:到该镇的大致公路距离(km)。注意公路距离 ≠ 直线距离,新西兰山区可能绕路。不知道返回 null。
3. sub_region:细分地理区域,如 "Mount Aspiring National Park"、"Coromandel Peninsula"、"Banks Peninsula"。不是行政区。不知道返回 null。
4. elevation_m:基于坐标 + 地区常识推断海拔(米)。海岸 0-50m,内陆河谷 100-500m,山区营地常 600-1500m。不确定返回 null。
5. campfire_policy:基于该地区常识。
   - DOC 营地几乎都禁明火 → 'not-allowed' 或 'fire-pit-only'
   - Holiday Park 通常 'fire-pit-only'
   - 北岛干燥地区夏季常禁火 → 'seasonal'
6. pet_policy:基于该地区常识。
   - DOC 多数营地禁宠 → 'not-allowed'
   - Holiday Park 多数允许或牵绳 → 'allowed' 或 'leashed-only'
   - 不知道返回 null

⚠️ 严守原则:
- 不要为了填字段而瞎编。不知道就返回 null。
- 不要给精确到米的海拔(那是猜的);给整百整十数字。
- distance_to_town_km 偏保守(宁多勿少)。

严格按 JSON schema 输出。`;

const EXAMPLE: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'user',
    content: `Camp: Aspiring Hut Camp
Coords: -44.523, 168.795
Address: Mount Aspiring National Park, Otago, New Zealand
Type: doc_basic`,
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      nearest_town: 'Wanaka',
      distance_to_town_km: 60,
      sub_region: 'Mount Aspiring National Park',
      elevation_m: 460,
      campfire_policy: 'not-allowed',
      pet_policy: 'not-allowed',
    }),
  },
];

export async function inferLocationContext(
  ai: TrackedOpenAI,
  input: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    campType?: string;
  },
  opts: { dryRun?: boolean } = {}
): Promise<LocationContext | null> {
  const userPrompt = [
    `Camp: ${input.name}`,
    `Coords: ${input.lat.toFixed(3)}, ${input.lng.toFixed(3)}`,
    input.address ? `Address: ${input.address}` : '',
    input.campType ? `Type: ${input.campType}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await ai.parse({
    task: 'inferLocationContext',
    schema: LocationContextSchema,
    schemaName: 'location_context',
    messages: [
      { role: 'system', content: SYSTEM },
      ...EXAMPLE,
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 400,
    temperature: 0.2, // 这种推断要严谨
    dryRun: opts.dryRun,
  });
  return result.data;
}
