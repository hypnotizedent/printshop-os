/**
 * Quote Optimizer - Main orchestrator for AI-powered quote optimization
 */

import * as crypto from 'crypto-js';
import { DesignAnalyzer } from './design-analyzer';
import { RecommendationEngine } from './recommendation-engine';
import { 
  OptimizerConfig, 
  DesignInput, 
  QuoteOptimization, 
  CostTracking 
} from './types';

export class QuoteOptimizer {
  private designAnalyzer: DesignAnalyzer;
  private recommendationEngine: RecommendationEngine;
  private config: OptimizerConfig;

  constructor(config: OptimizerConfig) {
    this.config = {
      model: 'gpt-4-vision-preview',
      enableCaching: true,
      cacheExpiry: 3600, // 1 hour
      maxCostPerAnalysis: 0.05, // $0.05 max
      ...config,
    };

    this.designAnalyzer = new DesignAnalyzer(
      this.config.openaiApiKey,
      this.config.model,
      this.config.cacheExpiry
    );

    this.recommendationEngine = new RecommendationEngine();
  }

  /**
   * Main optimization function - analyzes design and generates complete quote optimization
   */
  async optimizeQuote(input: DesignInput): Promise<QuoteOptimization> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze the design using AI vision
      const designAnalysis = await this.designAnalyzer.analyzeDesign(input);

      // Step 2: Generate print configuration
      const printConfig = this.recommendationEngine.generatePrintConfig(designAnalysis);

      // Step 3: Generate suggestions (add-ons, upgrades)
      const suggestions = this.recommendationEngine.generateSuggestions(designAnalysis, input);

      // Step 4: Detect design issues
      const issues = this.recommendationEngine.detectIssues(designAnalysis, input);

      // Step 5: Calculate estimated value
      const estimatedValue = this.recommendationEngine.calculateEstimatedValue(
        printConfig,
        input,
        suggestions
      );

      // Step 6: Generate reasoning/explanation
      const reasoning = this.generateReasoning(designAnalysis, printConfig, suggestions, issues);

      const processingTime = Date.now() - startTime;

      const optimization: QuoteOptimization = {
        printConfig,
        suggestions,
        issues,
        estimatedValue,
        reasoning,
        analysisTimestamp: new Date().toISOString(),
        designHash: this.generateDesignHash(input),
      };

      // Log performance metrics
      console.log(`Quote optimization completed in ${processingTime}ms`);
      console.log(`Estimated value: $${estimatedValue.toFixed(2)}`);
      console.log(`Suggestions: ${suggestions.length}, Issues: ${issues.length}`);

      return optimization;
    } catch (error) {
      console.error('Error optimizing quote:', error);
      throw new Error(`Failed to optimize quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate human-readable reasoning for recommendations
   */
  private generateReasoning(
    analysis: any,
    printConfig: any,
    suggestions: any[],
    issues: any[]
  ): string {
    const parts: string[] = [];

    // Design analysis summary
    parts.push(
      `Based on the design analysis, this is a ${analysis.complexity} design with ${analysis.colorsDetected} colors. ` +
      `We recommend ${printConfig.method} printing at ${printConfig.size} size on the ${printConfig.location}.`
    );

    // Suggestions reasoning
    if (suggestions.length > 0) {
      const topSuggestions = suggestions.slice(0, 3);
      parts.push(
        `We've identified ${suggestions.length} optimization opportunities: ` +
        topSuggestions.map(s => s.title).join(', ') + 
        `. These recommendations could increase quote value while enhancing customer satisfaction.`
      );
    }

    // Issues reasoning
    if (issues.length > 0) {
      const highIssues = issues.filter(i => i.severity === 'high');
      if (highIssues.length > 0) {
        parts.push(
          `⚠️ Important: ${highIssues.length} design issue(s) require attention before production. ` +
          `Please review: ${highIssues.map(i => i.message).join('; ')}.`
        );
      }
    }

    // Confidence note
    if (printConfig.confidence < 0.7) {
      parts.push(
        `Note: Automated analysis has moderate confidence (${(printConfig.confidence * 100).toFixed(0)}%). ` +
        `Manual review recommended before finalizing quote.`
      );
    }

    return parts.join(' ');
  }

  /**
   * Generate design hash for tracking
   */
  private generateDesignHash(input: DesignInput): string {
    const hashInput = input.imageUrl || input.imageBuffer?.toString('base64').substring(0, 100) || 'no-image';
    return crypto.SHA256(hashInput).toString();
  }

  /**
   * Get cost tracking data
   */
  getCostTracking(): CostTracking[] {
    return this.designAnalyzer.getCostTracking();
  }

  /**
   * Get total costs incurred
   */
  getTotalCost(): number {
    return this.designAnalyzer.getTotalCost();
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.designAnalyzer.clearCache();
  }

  /**
   * Batch optimize multiple quotes
   */
  async optimizeQuoteBatch(inputs: DesignInput[]): Promise<QuoteOptimization[]> {
    console.log(`Starting batch optimization for ${inputs.length} designs...`);
    
    const results = await Promise.all(
      inputs.map(async (input, index) => {
        try {
          console.log(`Processing design ${index + 1}/${inputs.length}...`);
          return await this.optimizeQuote(input);
        } catch (error) {
          console.error(`Error processing design ${index + 1}:`, error);
          throw error;
        }
      })
    );

    const totalCost = this.getTotalCost();
    const avgCost = totalCost / inputs.length;
    
    console.log(`Batch optimization complete. Total cost: $${totalCost.toFixed(4)}, Avg: $${avgCost.toFixed(4)}`);
    
    return results;
  }

  /**
   * Get optimizer configuration
   */
  getConfig(): OptimizerConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create optimizer instance
 */
export function createQuoteOptimizer(config: OptimizerConfig): QuoteOptimizer {
  return new QuoteOptimizer(config);
}

/**
 * Example usage
 */
export async function exampleUsage() {
  const optimizer = createQuoteOptimizer({
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    enableCaching: true,
  });

  const result = await optimizer.optimizeQuote({
    imageUrl: 'https://example.com/design.png',
    quantity: 250,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    customerInfo: {
      hasExistingBranding: true,
      isRetailJob: true,
    },
  });

  console.log('Quote Optimization Result:');
  console.log(JSON.stringify(result, null, 2));
}
