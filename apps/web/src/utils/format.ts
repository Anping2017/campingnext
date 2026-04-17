/**
 * 格式化价格分类
 */
export function formatPrice(price: 'free' | 'cheap' | 'medium' | 'expensive'): string {
  const priceMap: Record<'free' | 'cheap' | 'medium' | 'expensive', string> = {
    free: '免费',
    cheap: '便宜',
    medium: '中等',
    expensive: '较贵',
  };
  return priceMap[price] || price;
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
export function formatRating(rating: number | string): string {
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (isNaN(numRating)) {
    return '0.0';
  }
  return numRating.toFixed(1);
}

/**
 * 格式化标签
 */
export function formatTags(tags: string[]): string {
  return tags.join(' · ');
}


