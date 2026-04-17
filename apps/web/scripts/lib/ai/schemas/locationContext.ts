/**
 * Zod schema:地理上下文推断结果
 *
 * 用于 inferLocationContext() — 从地址、坐标推断 nearest_town、sub_region、elevation 等。
 */
import { z } from 'zod';

export const LocationContextSchema = z.object({
  nearest_town: z
    .string()
    .nullable()
    .describe('最近的城镇/村庄名(如 "Te Anau"),不知道返回 null'),
  distance_to_town_km: z
    .number()
    .min(0)
    .max(500)
    .nullable()
    .describe('到最近城镇的大致公路距离(km),不知道返回 null'),
  sub_region: z
    .string()
    .nullable()
    .describe('细分区域名(如 "Mount Aspiring National Park"),不知道返回 null'),
  elevation_m: z
    .number()
    .min(-50)
    .max(4000)
    .nullable()
    .describe('海拔(米),不知道返回 null'),
  campfire_policy: z
    .enum(['allowed', 'not-allowed', 'fire-pit-only', 'seasonal'])
    .nullable()
    .describe('篝火政策(基于该区域常识推断,如 DOC 营地多禁明火)'),
  pet_policy: z
    .enum(['allowed', 'not-allowed', 'seasonal', 'conditional', 'leashed-only'])
    .nullable()
    .describe('宠物政策(基于该地区常识推断,如新西兰大多 DOC 营地禁宠)'),
});

export type LocationContext = z.infer<typeof LocationContextSchema>;
