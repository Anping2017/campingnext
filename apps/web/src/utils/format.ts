/**
 * 格式化价格
 */
export function formatPrice(price: number): string {
  if (price === 0) return '免费';
  return `$${price}/晚`;
}

/**
 * 格式化难度
 */
export function formatDifficulty(difficulty: string): string {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return map[difficulty] || difficulty;
}

/**
 * 格式化评分
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * 格式化标签
 */
export function formatTags(tags: string[]): string {
  return tags.join(' · ');
}


