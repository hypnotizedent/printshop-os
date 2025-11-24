/**
 * AI Quote Optimizer - Main Entry Point
 * 
 * This module provides AI-powered quote optimization for PrintShop OS.
 * It analyzes design images using OpenAI Vision API and generates
 * comprehensive recommendations for print configuration, pricing, and add-ons.
 * 
 * @example
 * ```typescript
 * import { createQuoteOptimizer } from '@printshop-os/customer-service-ai';
 * 
 * const optimizer = createQuoteOptimizer({
 *   openaiApiKey: process.env.OPENAI_API_KEY,
 *   enableCaching: true,
 * });
 * 
 * const result = await optimizer.optimizeQuote({
 *   imageUrl: 'https://example.com/design.png',
 *   quantity: 250,
 *   deadline: new Date('2024-12-01'),
 * });
 * 
 * console.log(result.estimatedValue); // $2,450.00
 * console.log(result.suggestions); // Array of add-on recommendations
 * ```
 */

export { QuoteOptimizer, createQuoteOptimizer } from './quote-optimizer';
export { DesignAnalyzer } from './design-analyzer';
export { RecommendationEngine } from './recommendation-engine';

export * from './types';
