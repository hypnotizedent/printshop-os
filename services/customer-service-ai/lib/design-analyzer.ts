/**
 * Design Analyzer - Image analysis using OpenAI Vision API
 */

import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { DesignInput, DesignAnalysis, CostTracking } from './types';
import crypto from 'crypto-js';

export class DesignAnalyzer {
  private openai: OpenAI;
  private model: string;
  private costTracking: CostTracking[] = [];
  private designCache: Map<string, { analysis: DesignAnalysis; timestamp: number }> = new Map();
  private cacheExpiry: number; // milliseconds

  constructor(apiKey: string, model: string = 'gpt-4-vision-preview', cacheExpiry: number = 3600) {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
    this.cacheExpiry = cacheExpiry * 1000; // Convert to milliseconds
  }

  /**
   * Analyze a design image and extract key characteristics
   */
  async analyzeDesign(input: DesignInput): Promise<DesignAnalysis> {
    // Generate hash for caching
    const designHash = this.generateDesignHash(input);
    
    // Check cache first
    const cached = this.checkCache(designHash);
    if (cached) {
      this.trackCost({
        timestamp: new Date().toISOString(),
        model: this.model,
        tokensUsed: 0,
        estimatedCost: 0,
        designHash,
        cacheHit: true,
      });
      return cached;
    }

    // Load prompt template
    const promptTemplate = this.loadPromptTemplate();

    // Prepare image for analysis
    const imageContent = await this.prepareImage(input);

    try {
      // Call OpenAI Vision API
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: promptTemplate,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this apparel design image according to the guidelines.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageContent,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for consistent analysis
      });

      // Extract and parse the response
      const content = response.choices[0]?.message?.content || '{}';
      const analysis = this.parseAnalysisResponse(content);

      // Track costs
      const tokensUsed = response.usage?.total_tokens || 0;
      this.trackCost({
        timestamp: new Date().toISOString(),
        model: this.model,
        tokensUsed,
        estimatedCost: this.calculateCost(tokensUsed),
        designHash,
        cacheHit: false,
      });

      // Cache the result
      this.cacheAnalysis(designHash, analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing design:', error);
      // Return a safe fallback analysis
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Generate a hash of the design for caching
   */
  private generateDesignHash(input: DesignInput): string {
    let hashInput: string;
    
    if (input.imageUrl) {
      hashInput = input.imageUrl;
    } else if (input.imageBuffer) {
      hashInput = input.imageBuffer.toString('base64').substring(0, 1000);
    } else {
      hashInput = 'no-image';
    }
    
    return crypto.SHA256(hashInput).toString();
  }

  /**
   * Check cache for existing analysis
   */
  private checkCache(designHash: string): DesignAnalysis | null {
    const cached = this.designCache.get(designHash);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheExpiry) {
      this.designCache.delete(designHash);
      return null;
    }

    return cached.analysis;
  }

  /**
   * Cache analysis result
   */
  private cacheAnalysis(designHash: string, analysis: DesignAnalysis): void {
    this.designCache.set(designHash, {
      analysis,
      timestamp: Date.now(),
    });
  }

  /**
   * Load prompt template from file
   */
  private loadPromptTemplate(): string {
    try {
      return readFileSync(`${__dirname}/prompts/design-analysis.txt`, 'utf-8');
    } catch (error) {
      // Fallback inline prompt if file not found
      return `Analyze this apparel design image and return JSON with: complexity, optimalLocation, recommendedSize, colorsDetected, issues, suggestedMethod, confidence.`;
    }
  }

  /**
   * Prepare image for API call
   */
  private async prepareImage(input: DesignInput): Promise<string> {
    if (input.imageUrl) {
      return input.imageUrl;
    }

    if (input.imageBuffer) {
      const base64 = input.imageBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    }

    throw new Error('No image provided');
  }

  /**
   * Parse JSON response from LLM
   */
  private parseAnalysisResponse(content: string): DesignAnalysis {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const parsed = JSON.parse(jsonStr);

      return {
        complexity: parsed.complexity || 'moderate',
        optimalLocation: parsed.optimalLocation || 'full-front',
        recommendedSize: parsed.recommendedSize || 'M',
        colorsDetected: parsed.colorsDetected || 3,
        issues: parsed.issues || [],
        suggestedMethod: parsed.suggestedMethod || 'screen-print',
        confidence: parsed.confidence || 0.7,
      };
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Fallback analysis when API fails
   */
  private getFallbackAnalysis(): DesignAnalysis {
    return {
      complexity: 'moderate',
      optimalLocation: 'full-front',
      recommendedSize: 'M',
      colorsDetected: 3,
      issues: ['Unable to analyze design automatically - manual review recommended'],
      suggestedMethod: 'screen-print',
      confidence: 0.5,
    };
  }

  /**
   * Calculate estimated cost based on tokens
   */
  private calculateCost(tokens: number): number {
    // GPT-4 Vision pricing (approximate)
    // Input: $0.01 per 1K tokens, Output: $0.03 per 1K tokens
    // Simplified: average $0.02 per 1K tokens
    return (tokens / 1000) * 0.02;
  }

  /**
   * Track cost for monitoring
   */
  private trackCost(tracking: CostTracking): void {
    this.costTracking.push(tracking);
  }

  /**
   * Get total cost tracking data
   */
  getCostTracking(): CostTracking[] {
    return this.costTracking;
  }

  /**
   * Get total estimated costs
   */
  getTotalCost(): number {
    return this.costTracking.reduce((sum, t) => sum + t.estimatedCost, 0);
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.designCache.clear();
  }
}
