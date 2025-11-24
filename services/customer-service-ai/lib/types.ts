/**
 * Types and interfaces for AI Quote Optimizer
 */

/**
 * Print configuration recommendation
 */
export interface PrintConfig {
  location: string; // 'front-chest', 'full-front', 'back', 'sleeve', 'full-wrap'
  size: string; // 'S', 'M', 'L', 'XL'
  method: string; // 'screen-print', 'DTG', 'embroidery', 'sublimation'
  colors: number;
  confidence: number; // 0-1
}

/**
 * Suggestion types for upsells and warnings
 */
export type SuggestionType = 'add-on' | 'upgrade' | 'warning';

/**
 * Individual suggestion/recommendation
 */
export interface Suggestion {
  type: SuggestionType;
  title: string;
  description: string;
  priceImpact: number; // Dollar amount impact
  confidence: number; // 0-1
}

/**
 * Design issue severity
 */
export type IssueSeverity = 'low' | 'medium' | 'high';

/**
 * Design quality issue
 */
export interface DesignIssue {
  severity: IssueSeverity;
  message: string;
  resolution: string; // How to fix it
}

/**
 * Complete quote optimization result
 */
export interface QuoteOptimization {
  printConfig: PrintConfig;
  suggestions: Suggestion[];
  issues: DesignIssue[];
  estimatedValue: number; // Total estimated quote value
  reasoning: string; // Explanation of recommendations
  analysisTimestamp: string;
  designHash?: string; // For caching
}

/**
 * Design analysis input
 */
export interface DesignInput {
  imageUrl?: string;
  imageBuffer?: Buffer;
  quantity: number;
  deadline?: Date;
  customerInfo?: {
    hasExistingBranding?: boolean;
    isRetailJob?: boolean;
    isEventJob?: boolean;
  };
}

/**
 * Design analysis result from LLM
 */
export interface DesignAnalysis {
  complexity: 'simple' | 'moderate' | 'complex';
  optimalLocation: string;
  recommendedSize: string;
  colorsDetected: number;
  issues: string[];
  suggestedMethod: string;
  confidence: number;
}

/**
 * Cost tracking for API usage
 */
export interface CostTracking {
  timestamp: string;
  model: string;
  tokensUsed: number;
  estimatedCost: number;
  designHash?: string;
  cacheHit: boolean;
}

/**
 * Quote optimizer configuration
 */
export interface OptimizerConfig {
  openaiApiKey: string;
  model?: string; // Default: 'gpt-4-vision-preview'
  enableCaching?: boolean;
  cacheExpiry?: number; // seconds
  maxCostPerAnalysis?: number; // dollars
}
