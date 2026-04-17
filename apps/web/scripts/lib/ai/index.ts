/**
 * AI 模块统一入口
 *
 * 用法:
 *   import { TrackedOpenAI, analyzeReviews, generateDescription, inferLocationContext } from './lib/ai';
 *
 *   const ai = TrackedOpenAI.fromEnv({ verbose: true });
 *   const analysis = await analyzeReviews(ai, 'Lake Pukaki Camp', reviews);
 *   const desc = await generateDescription(ai, { name, region, ... });
 */

export { TrackedOpenAI } from './client.js';
export { analyzeReviews, type RawReview } from './prompts/analyzeReviews.js';
export { generateDescription, type DescriptionContext } from './prompts/generateDescription.js';
export { inferLocationContext } from './prompts/inferLocationContext.js';

export { ReviewAnalysisSchema, type ReviewAnalysis } from './schemas/reviewAnalysis.js';
export { CampDescriptionSchema, type CampDescription } from './schemas/campDescription.js';
export { LocationContextSchema, type LocationContext } from './schemas/locationContext.js';
