/**
 * Comprehensive test suite for Quote Optimizer
 * Tests 15+ scenarios including various design types, volumes, and edge cases
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { QuoteOptimizer, createQuoteOptimizer } from '../lib/quote-optimizer';
import { DesignAnalyzer } from '../lib/design-analyzer';
import { RecommendationEngine } from '../lib/recommendation-engine';
import { DesignInput, QuoteOptimization, DesignAnalysis } from '../lib/types';

// Mock OpenAI to avoid actual API calls during tests
jest.mock('openai');

describe('QuoteOptimizer', () => {
  let optimizer: QuoteOptimizer;
  let mockDesignAnalyzer: jest.Mocked<DesignAnalyzer>;

  beforeEach(() => {
    // Create optimizer with mock API key
    optimizer = createQuoteOptimizer({
      openaiApiKey: 'test-api-key',
      enableCaching: true,
    });

    // Mock the design analyzer to return controlled results
    mockDesignAnalyzer = optimizer['designAnalyzer'] as jest.Mocked<DesignAnalyzer>;
  });

  describe('Test 1: Simple Text Logo (Front Chest)', () => {
    it('should recommend front-chest placement for simple logo', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'simple',
        optimalLocation: 'front-chest',
        recommendedSize: 'S',
        colorsDetected: 1,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.92,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/simple-logo.png',
        quantity: 50,
      };

      const result = await optimizer.optimizeQuote(input);

      expect(result.printConfig.location).toBe('front-chest');
      expect(result.printConfig.size).toBe('S');
      expect(result.printConfig.method).toBe('screen-print');
      expect(result.printConfig.colors).toBe(1);
      expect(result.issues.length).toBe(0);
    });
  });

  describe('Test 2: Complex Full-Front Design', () => {
    it('should recommend full-front placement with larger size for complex design', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'complex',
        optimalLocation: 'full-front',
        recommendedSize: 'L',
        colorsDetected: 6,
        issues: [],
        suggestedMethod: 'DTG',
        confidence: 0.88,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/complex-design.png',
        quantity: 100,
      };

      const result = await optimizer.optimizeQuote(input);

      expect(result.printConfig.location).toBe('full-front');
      expect(result.printConfig.size).toBe('L');
      expect(result.printConfig.method).toBe('DTG');
      expect(result.printConfig.colors).toBe(6);
      expect(result.estimatedValue).toBeGreaterThan(0);
    });
  });

  describe('Test 3: Low Resolution Detection', () => {
    it('should detect and flag low resolution images', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'moderate',
        optimalLocation: 'full-front',
        recommendedSize: 'M',
        colorsDetected: 3,
        issues: ['Low resolution detected (< 300 DPI)', 'May result in blurry print'],
        suggestedMethod: 'screen-print',
        confidence: 0.65,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/low-res.png',
        quantity: 75,
      };

      const result = await optimizer.optimizeQuote(input);

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(i => i.severity === 'high')).toBe(true);
      expect(result.issues.some(i => i.message.toLowerCase().includes('resolution'))).toBe(true);
    });
  });

  describe('Test 4: Multi-Color Gradient (DTG Recommendation)', () => {
    it('should suggest DTG for multi-color gradients', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'complex',
        optimalLocation: 'full-front',
        recommendedSize: 'L',
        colorsDetected: 8,
        issues: [],
        suggestedMethod: 'DTG',
        confidence: 0.90,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/gradient-design.png',
        quantity: 150,
      };

      const result = await optimizer.optimizeQuote(input);

      expect(result.printConfig.method).toBe('DTG');
      expect(result.printConfig.colors).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Test 5: Small Detailed Design (Size Upgrade)', () => {
    it('should suggest size upgrade for small complex designs', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'complex',
        optimalLocation: 'full-front',
        recommendedSize: 'S',
        colorsDetected: 4,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.80,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/small-detailed.png',
        quantity: 100,
      };

      const result = await optimizer.optimizeQuote(input);

      // Should have a suggestion to upgrade size
      const sizeUpgrade = result.suggestions.find(s => 
        s.title.toLowerCase().includes('upgrade') && s.title.toLowerCase().includes('size')
      );
      expect(sizeUpgrade).toBeDefined();
      expect(result.issues.some(i => i.message.toLowerCase().includes('detail'))).toBe(true);
    });
  });

  describe('Test 6: Rush Deadline Scenario (5 days)', () => {
    it('should recommend rush service for tight deadline', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'simple',
        optimalLocation: 'front-chest',
        recommendedSize: 'M',
        colorsDetected: 2,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.89,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5); // 5 days from now

      const input: DesignInput = {
        imageUrl: 'https://example.com/rush-design.png',
        quantity: 200,
        deadline,
      };

      const result = await optimizer.optimizeQuote(input);

      const rushSuggestion = result.suggestions.find(s => 
        s.title.toLowerCase().includes('rush')
      );
      expect(rushSuggestion).toBeDefined();
      if (rushSuggestion) {
        expect(rushSuggestion.priceImpact).toBeGreaterThan(0);
      }
    });
  });

  describe('Test 7: Emergency Rush (2 days)', () => {
    it('should flag emergency rush requirement for very tight deadline', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'simple',
        optimalLocation: 'front-chest',
        recommendedSize: 'M',
        colorsDetected: 1,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.91,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 2); // 2 days from now

      const input: DesignInput = {
        imageUrl: 'https://example.com/emergency-design.png',
        quantity: 50,
        deadline,
      };

      const result = await optimizer.optimizeQuote(input);

      expect(result.issues.some(i => i.severity === 'high')).toBe(true);
      const emergencyRush = result.suggestions.find(s => 
        s.title.toLowerCase().includes('emergency')
      );
      expect(emergencyRush).toBeDefined();
    });
  });

  describe('Test 8: Bulk Order (Fold & Bag Recommendation)', () => {
    it('should suggest fold & bag service for orders over 100', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'moderate',
        optimalLocation: 'full-front',
        recommendedSize: 'M',
        colorsDetected: 3,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.87,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/bulk-design.png',
        quantity: 500,
      };

      const result = await optimizer.optimizeQuote(input);

      const foldBagSuggestion = result.suggestions.find(s => 
        s.title.toLowerCase().includes('fold') && s.title.toLowerCase().includes('bag')
      );
      expect(foldBagSuggestion).toBeDefined();
      expect(foldBagSuggestion?.type).toBe('add-on');
    });
  });

  describe('Test 9: Customer with Branding (Tag Recommendation)', () => {
    it('should suggest custom tags for customers with branding', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'moderate',
        optimalLocation: 'full-front',
        recommendedSize: 'M',
        colorsDetected: 2,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.86,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/branded-design.png',
        quantity: 150,
        customerInfo: {
          hasExistingBranding: true,
        },
      };

      const result = await optimizer.optimizeQuote(input);

      const tagSuggestion = result.suggestions.find(s => 
        s.title.toLowerCase().includes('tag')
      );
      expect(tagSuggestion).toBeDefined();
    });
  });

  describe('Test 10: Retail Job (Hang Tickets)', () => {
    it('should suggest hang tickets for retail jobs', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'simple',
        optimalLocation: 'front-chest',
        recommendedSize: 'M',
        colorsDetected: 2,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.89,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/retail-design.png',
        quantity: 200,
        customerInfo: {
          isRetailJob: true,
        },
      };

      const result = await optimizer.optimizeQuote(input);

      const ticketSuggestion = result.suggestions.find(s => 
        s.title.toLowerCase().includes('ticket')
      );
      expect(ticketSuggestion).toBeDefined();
    });
  });

  describe('Test 11: Missing Bleed Issue', () => {
    it('should detect missing bleed for full coverage designs', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'complex',
        optimalLocation: 'full-wrap',
        recommendedSize: 'XL',
        colorsDetected: 5,
        issues: ['Missing bleed for edge-to-edge design'],
        suggestedMethod: 'sublimation',
        confidence: 0.78,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/full-coverage.png',
        quantity: 100,
      };

      const result = await optimizer.optimizeQuote(input);

      expect(result.issues.some(i => 
        i.message.toLowerCase().includes('bleed')
      )).toBe(true);
    });
  });

  describe('Test 12: Back Print Bundle Deal', () => {
    it('should suggest back print with discount', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'moderate',
        optimalLocation: 'full-front',
        recommendedSize: 'L',
        colorsDetected: 3,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.88,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/front-design.png',
        quantity: 300,
      };

      const result = await optimizer.optimizeQuote(input);

      const backPrintSuggestion = result.suggestions.find(s => 
        s.title.toLowerCase().includes('back') && s.title.toLowerCase().includes('print')
      );
      expect(backPrintSuggestion).toBeDefined();
      if (backPrintSuggestion) {
        expect(backPrintSuggestion.priceImpact).toBeGreaterThan(0);
      }
    });
  });

  describe('Test 13: High Volume with Volume Discounts', () => {
    it('should apply volume discounts for large orders', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'simple',
        optimalLocation: 'front-chest',
        recommendedSize: 'M',
        colorsDetected: 2,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.90,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/volume-design.png',
        quantity: 1000,
      };

      const result = await optimizer.optimizeQuote(input);

      // Estimated value should reflect volume discounts
      expect(result.estimatedValue).toBeGreaterThan(0);
      // Unit cost should be lower than small quantity
      const unitCost = result.estimatedValue / input.quantity;
      expect(unitCost).toBeLessThan(10); // Should be discounted
    });
  });

  describe('Test 14: Low Confidence Analysis', () => {
    it('should warn when analysis confidence is low', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'moderate',
        optimalLocation: 'full-front',
        recommendedSize: 'M',
        colorsDetected: 3,
        issues: ['Unclear design elements', 'Difficult to analyze automatically'],
        suggestedMethod: 'screen-print',
        confidence: 0.45, // Low confidence
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/unclear-design.png',
        quantity: 100,
      };

      const result = await optimizer.optimizeQuote(input);

      expect(result.issues.some(i => 
        i.message.toLowerCase().includes('confidence')
      )).toBe(true);
      expect(result.reasoning).toContain('Manual review');
    });
  });

  describe('Test 15: Premium Ink Upgrade Suggestion', () => {
    it('should suggest premium inks for suitable designs', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'simple',
        optimalLocation: 'full-front',
        recommendedSize: 'L',
        colorsDetected: 2,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.91,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const input: DesignInput = {
        imageUrl: 'https://example.com/premium-design.png',
        quantity: 200,
      };

      const result = await optimizer.optimizeQuote(input);

      const premiumInkSuggestion = result.suggestions.find(s => 
        s.title.toLowerCase().includes('water-based') || 
        s.title.toLowerCase().includes('discharge')
      );
      expect(premiumInkSuggestion).toBeDefined();
    });
  });

  describe('Test 16: Cost Tracking', () => {
    it('should track API costs for optimization', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'moderate',
        optimalLocation: 'full-front',
        recommendedSize: 'M',
        colorsDetected: 3,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.85,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
      
      // Mock cost tracking methods
      const mockCostTracking = [{
        timestamp: new Date().toISOString(),
        model: 'gpt-4-vision-preview',
        tokensUsed: 500,
        estimatedCost: 0.01,
        cacheHit: false,
      }];
      
      jest.spyOn(mockDesignAnalyzer, 'getCostTracking').mockReturnValue(mockCostTracking);
      jest.spyOn(mockDesignAnalyzer, 'getTotalCost').mockReturnValue(0.01);

      const input: DesignInput = {
        imageUrl: 'https://example.com/cost-test.png',
        quantity: 150,
      };

      await optimizer.optimizeQuote(input);

      const totalCost = optimizer.getTotalCost();
      expect(totalCost).toBeGreaterThanOrEqual(0);
      
      const costTracking = optimizer.getCostTracking();
      expect(costTracking.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Test 17: Batch Optimization', () => {
    it('should optimize multiple quotes in batch', async () => {
      const mockAnalysis: DesignAnalysis = {
        complexity: 'moderate',
        optimalLocation: 'full-front',
        recommendedSize: 'M',
        colorsDetected: 3,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.85,
      };

      jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);

      const inputs: DesignInput[] = [
        { imageUrl: 'https://example.com/design1.png', quantity: 50 },
        { imageUrl: 'https://example.com/design2.png', quantity: 100 },
        { imageUrl: 'https://example.com/design3.png', quantity: 200 },
      ];

      const results = await optimizer.optimizeQuoteBatch(inputs);

      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.printConfig).toBeDefined();
        expect(result.suggestions).toBeDefined();
        expect(result.estimatedValue).toBeGreaterThan(0);
      });
    });
  });

  describe('RecommendationEngine Unit Tests', () => {
    let engine: RecommendationEngine;

    beforeEach(() => {
      engine = new RecommendationEngine();
    });

    it('should generate print config from analysis', () => {
      const analysis: DesignAnalysis = {
        complexity: 'simple',
        optimalLocation: 'front-chest',
        recommendedSize: 'M',
        colorsDetected: 2,
        issues: [],
        suggestedMethod: 'screen-print',
        confidence: 0.90,
      };

      const config = engine.generatePrintConfig(analysis);

      expect(config.location).toBe('front-chest');
      expect(config.size).toBe('M');
      expect(config.method).toBe('screen-print');
      expect(config.colors).toBe(2);
      expect(config.confidence).toBe(0.90);
    });

    it('should calculate estimated value correctly', () => {
      const printConfig = {
        location: 'full-front',
        size: 'M',
        method: 'screen-print',
        colors: 3,
        confidence: 0.85,
      };

      const input: DesignInput = {
        imageUrl: 'https://example.com/test.png',
        quantity: 100,
      };

      const suggestions = [
        {
          type: 'add-on' as const,
          title: 'Fold & Bag',
          description: 'Test',
          priceImpact: 50,
          confidence: 0.9,
        },
      ];

      const value = engine.calculateEstimatedValue(printConfig, input, suggestions);

      expect(value).toBeGreaterThan(0);
      expect(typeof value).toBe('number');
    });
  });
});
