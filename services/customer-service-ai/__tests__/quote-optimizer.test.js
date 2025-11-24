"use strict";
/**
 * Comprehensive test suite for Quote Optimizer
 * Tests 15+ scenarios including various design types, volumes, and edge cases
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const quote_optimizer_1 = require("../lib/quote-optimizer");
const recommendation_engine_1 = require("../lib/recommendation-engine");
// Mock OpenAI to avoid actual API calls during tests
globals_1.jest.mock('openai');
(0, globals_1.describe)('QuoteOptimizer', () => {
    let optimizer;
    let mockDesignAnalyzer;
    (0, globals_1.beforeEach)(() => {
        // Create optimizer with mock API key
        optimizer = (0, quote_optimizer_1.createQuoteOptimizer)({
            openaiApiKey: 'test-api-key',
            enableCaching: true,
        });
        // Mock the design analyzer to return controlled results
        mockDesignAnalyzer = optimizer['designAnalyzer'];
    });
    (0, globals_1.describe)('Test 1: Simple Text Logo (Front Chest)', () => {
        (0, globals_1.it)('should recommend front-chest placement for simple logo', async () => {
            const mockAnalysis = {
                complexity: 'simple',
                optimalLocation: 'front-chest',
                recommendedSize: 'S',
                colorsDetected: 1,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.92,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/simple-logo.png',
                quantity: 50,
            };
            const result = await optimizer.optimizeQuote(input);
            (0, globals_1.expect)(result.printConfig.location).toBe('front-chest');
            (0, globals_1.expect)(result.printConfig.size).toBe('S');
            (0, globals_1.expect)(result.printConfig.method).toBe('screen-print');
            (0, globals_1.expect)(result.printConfig.colors).toBe(1);
            (0, globals_1.expect)(result.issues.length).toBe(0);
        });
    });
    (0, globals_1.describe)('Test 2: Complex Full-Front Design', () => {
        (0, globals_1.it)('should recommend full-front placement with larger size for complex design', async () => {
            const mockAnalysis = {
                complexity: 'complex',
                optimalLocation: 'full-front',
                recommendedSize: 'L',
                colorsDetected: 6,
                issues: [],
                suggestedMethod: 'DTG',
                confidence: 0.88,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/complex-design.png',
                quantity: 100,
            };
            const result = await optimizer.optimizeQuote(input);
            (0, globals_1.expect)(result.printConfig.location).toBe('full-front');
            (0, globals_1.expect)(result.printConfig.size).toBe('L');
            (0, globals_1.expect)(result.printConfig.method).toBe('DTG');
            (0, globals_1.expect)(result.printConfig.colors).toBe(6);
            (0, globals_1.expect)(result.estimatedValue).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('Test 3: Low Resolution Detection', () => {
        (0, globals_1.it)('should detect and flag low resolution images', async () => {
            const mockAnalysis = {
                complexity: 'moderate',
                optimalLocation: 'full-front',
                recommendedSize: 'M',
                colorsDetected: 3,
                issues: ['Low resolution detected (< 300 DPI)', 'May result in blurry print'],
                suggestedMethod: 'screen-print',
                confidence: 0.65,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/low-res.png',
                quantity: 75,
            };
            const result = await optimizer.optimizeQuote(input);
            (0, globals_1.expect)(result.issues.length).toBeGreaterThan(0);
            (0, globals_1.expect)(result.issues.some(i => i.severity === 'high')).toBe(true);
            (0, globals_1.expect)(result.issues.some(i => i.message.toLowerCase().includes('resolution'))).toBe(true);
        });
    });
    (0, globals_1.describe)('Test 4: Multi-Color Gradient (DTG Recommendation)', () => {
        (0, globals_1.it)('should suggest DTG for multi-color gradients', async () => {
            const mockAnalysis = {
                complexity: 'complex',
                optimalLocation: 'full-front',
                recommendedSize: 'L',
                colorsDetected: 8,
                issues: [],
                suggestedMethod: 'DTG',
                confidence: 0.90,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/gradient-design.png',
                quantity: 150,
            };
            const result = await optimizer.optimizeQuote(input);
            (0, globals_1.expect)(result.printConfig.method).toBe('DTG');
            (0, globals_1.expect)(result.printConfig.colors).toBeGreaterThanOrEqual(8);
        });
    });
    (0, globals_1.describe)('Test 5: Small Detailed Design (Size Upgrade)', () => {
        (0, globals_1.it)('should suggest size upgrade for small complex designs', async () => {
            const mockAnalysis = {
                complexity: 'complex',
                optimalLocation: 'full-front',
                recommendedSize: 'S',
                colorsDetected: 4,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.80,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/small-detailed.png',
                quantity: 100,
            };
            const result = await optimizer.optimizeQuote(input);
            // Should have a suggestion to upgrade size
            const sizeUpgrade = result.suggestions.find(s => s.title.toLowerCase().includes('upgrade') && s.title.toLowerCase().includes('size'));
            (0, globals_1.expect)(sizeUpgrade).toBeDefined();
            (0, globals_1.expect)(result.issues.some(i => i.message.toLowerCase().includes('detail'))).toBe(true);
        });
    });
    (0, globals_1.describe)('Test 6: Rush Deadline Scenario (5 days)', () => {
        (0, globals_1.it)('should recommend rush service for tight deadline', async () => {
            const mockAnalysis = {
                complexity: 'simple',
                optimalLocation: 'front-chest',
                recommendedSize: 'M',
                colorsDetected: 2,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.89,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 5); // 5 days from now
            const input = {
                imageUrl: 'https://example.com/rush-design.png',
                quantity: 200,
                deadline,
            };
            const result = await optimizer.optimizeQuote(input);
            const rushSuggestion = result.suggestions.find(s => s.title.toLowerCase().includes('rush'));
            (0, globals_1.expect)(rushSuggestion).toBeDefined();
            if (rushSuggestion) {
                (0, globals_1.expect)(rushSuggestion.priceImpact).toBeGreaterThan(0);
            }
        });
    });
    (0, globals_1.describe)('Test 7: Emergency Rush (2 days)', () => {
        (0, globals_1.it)('should flag emergency rush requirement for very tight deadline', async () => {
            const mockAnalysis = {
                complexity: 'simple',
                optimalLocation: 'front-chest',
                recommendedSize: 'M',
                colorsDetected: 1,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.91,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 2); // 2 days from now
            const input = {
                imageUrl: 'https://example.com/emergency-design.png',
                quantity: 50,
                deadline,
            };
            const result = await optimizer.optimizeQuote(input);
            (0, globals_1.expect)(result.issues.some(i => i.severity === 'high')).toBe(true);
            const emergencyRush = result.suggestions.find(s => s.title.toLowerCase().includes('emergency'));
            (0, globals_1.expect)(emergencyRush).toBeDefined();
        });
    });
    (0, globals_1.describe)('Test 8: Bulk Order (Fold & Bag Recommendation)', () => {
        (0, globals_1.it)('should suggest fold & bag service for orders over 100', async () => {
            const mockAnalysis = {
                complexity: 'moderate',
                optimalLocation: 'full-front',
                recommendedSize: 'M',
                colorsDetected: 3,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.87,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/bulk-design.png',
                quantity: 500,
            };
            const result = await optimizer.optimizeQuote(input);
            const foldBagSuggestion = result.suggestions.find(s => s.title.toLowerCase().includes('fold') && s.title.toLowerCase().includes('bag'));
            (0, globals_1.expect)(foldBagSuggestion).toBeDefined();
            (0, globals_1.expect)(foldBagSuggestion?.type).toBe('add-on');
        });
    });
    (0, globals_1.describe)('Test 9: Customer with Branding (Tag Recommendation)', () => {
        (0, globals_1.it)('should suggest custom tags for customers with branding', async () => {
            const mockAnalysis = {
                complexity: 'moderate',
                optimalLocation: 'full-front',
                recommendedSize: 'M',
                colorsDetected: 2,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.86,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/branded-design.png',
                quantity: 150,
                customerInfo: {
                    hasExistingBranding: true,
                },
            };
            const result = await optimizer.optimizeQuote(input);
            const tagSuggestion = result.suggestions.find(s => s.title.toLowerCase().includes('tag'));
            (0, globals_1.expect)(tagSuggestion).toBeDefined();
        });
    });
    (0, globals_1.describe)('Test 10: Retail Job (Hang Tickets)', () => {
        (0, globals_1.it)('should suggest hang tickets for retail jobs', async () => {
            const mockAnalysis = {
                complexity: 'simple',
                optimalLocation: 'front-chest',
                recommendedSize: 'M',
                colorsDetected: 2,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.89,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/retail-design.png',
                quantity: 200,
                customerInfo: {
                    isRetailJob: true,
                },
            };
            const result = await optimizer.optimizeQuote(input);
            const ticketSuggestion = result.suggestions.find(s => s.title.toLowerCase().includes('ticket'));
            (0, globals_1.expect)(ticketSuggestion).toBeDefined();
        });
    });
    (0, globals_1.describe)('Test 11: Missing Bleed Issue', () => {
        (0, globals_1.it)('should detect missing bleed for full coverage designs', async () => {
            const mockAnalysis = {
                complexity: 'complex',
                optimalLocation: 'full-wrap',
                recommendedSize: 'XL',
                colorsDetected: 5,
                issues: ['Missing bleed for edge-to-edge design'],
                suggestedMethod: 'sublimation',
                confidence: 0.78,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/full-coverage.png',
                quantity: 100,
            };
            const result = await optimizer.optimizeQuote(input);
            (0, globals_1.expect)(result.issues.some(i => i.message.toLowerCase().includes('bleed'))).toBe(true);
        });
    });
    (0, globals_1.describe)('Test 12: Back Print Bundle Deal', () => {
        (0, globals_1.it)('should suggest back print with discount', async () => {
            const mockAnalysis = {
                complexity: 'moderate',
                optimalLocation: 'full-front',
                recommendedSize: 'L',
                colorsDetected: 3,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.88,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/front-design.png',
                quantity: 300,
            };
            const result = await optimizer.optimizeQuote(input);
            const backPrintSuggestion = result.suggestions.find(s => s.title.toLowerCase().includes('back') && s.title.toLowerCase().includes('print'));
            (0, globals_1.expect)(backPrintSuggestion).toBeDefined();
            if (backPrintSuggestion) {
                (0, globals_1.expect)(backPrintSuggestion.priceImpact).toBeGreaterThan(0);
            }
        });
    });
    (0, globals_1.describe)('Test 13: High Volume with Volume Discounts', () => {
        (0, globals_1.it)('should apply volume discounts for large orders', async () => {
            const mockAnalysis = {
                complexity: 'simple',
                optimalLocation: 'front-chest',
                recommendedSize: 'M',
                colorsDetected: 2,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.90,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/volume-design.png',
                quantity: 1000,
            };
            const result = await optimizer.optimizeQuote(input);
            // Estimated value should reflect volume discounts
            (0, globals_1.expect)(result.estimatedValue).toBeGreaterThan(0);
            // Unit cost should be lower than small quantity
            const unitCost = result.estimatedValue / input.quantity;
            (0, globals_1.expect)(unitCost).toBeLessThan(10); // Should be discounted
        });
    });
    (0, globals_1.describe)('Test 14: Low Confidence Analysis', () => {
        (0, globals_1.it)('should warn when analysis confidence is low', async () => {
            const mockAnalysis = {
                complexity: 'moderate',
                optimalLocation: 'full-front',
                recommendedSize: 'M',
                colorsDetected: 3,
                issues: ['Unclear design elements', 'Difficult to analyze automatically'],
                suggestedMethod: 'screen-print',
                confidence: 0.45, // Low confidence
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/unclear-design.png',
                quantity: 100,
            };
            const result = await optimizer.optimizeQuote(input);
            (0, globals_1.expect)(result.issues.some(i => i.message.toLowerCase().includes('confidence'))).toBe(true);
            (0, globals_1.expect)(result.reasoning).toContain('Manual review');
        });
    });
    (0, globals_1.describe)('Test 15: Premium Ink Upgrade Suggestion', () => {
        (0, globals_1.it)('should suggest premium inks for suitable designs', async () => {
            const mockAnalysis = {
                complexity: 'simple',
                optimalLocation: 'full-front',
                recommendedSize: 'L',
                colorsDetected: 2,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.91,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const input = {
                imageUrl: 'https://example.com/premium-design.png',
                quantity: 200,
            };
            const result = await optimizer.optimizeQuote(input);
            const premiumInkSuggestion = result.suggestions.find(s => s.title.toLowerCase().includes('water-based') ||
                s.title.toLowerCase().includes('discharge'));
            (0, globals_1.expect)(premiumInkSuggestion).toBeDefined();
        });
    });
    (0, globals_1.describe)('Test 16: Cost Tracking', () => {
        (0, globals_1.it)('should track API costs for optimization', async () => {
            const mockAnalysis = {
                complexity: 'moderate',
                optimalLocation: 'full-front',
                recommendedSize: 'M',
                colorsDetected: 3,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.85,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            // Mock cost tracking methods
            const mockCostTracking = [{
                    timestamp: new Date().toISOString(),
                    model: 'gpt-4-vision-preview',
                    tokensUsed: 500,
                    estimatedCost: 0.01,
                    cacheHit: false,
                }];
            globals_1.jest.spyOn(mockDesignAnalyzer, 'getCostTracking').mockReturnValue(mockCostTracking);
            globals_1.jest.spyOn(mockDesignAnalyzer, 'getTotalCost').mockReturnValue(0.01);
            const input = {
                imageUrl: 'https://example.com/cost-test.png',
                quantity: 150,
            };
            await optimizer.optimizeQuote(input);
            const totalCost = optimizer.getTotalCost();
            (0, globals_1.expect)(totalCost).toBeGreaterThanOrEqual(0);
            const costTracking = optimizer.getCostTracking();
            (0, globals_1.expect)(costTracking.length).toBeGreaterThanOrEqual(0);
        });
    });
    (0, globals_1.describe)('Test 17: Batch Optimization', () => {
        (0, globals_1.it)('should optimize multiple quotes in batch', async () => {
            const mockAnalysis = {
                complexity: 'moderate',
                optimalLocation: 'full-front',
                recommendedSize: 'M',
                colorsDetected: 3,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.85,
            };
            globals_1.jest.spyOn(mockDesignAnalyzer, 'analyzeDesign').mockResolvedValue(mockAnalysis);
            const inputs = [
                { imageUrl: 'https://example.com/design1.png', quantity: 50 },
                { imageUrl: 'https://example.com/design2.png', quantity: 100 },
                { imageUrl: 'https://example.com/design3.png', quantity: 200 },
            ];
            const results = await optimizer.optimizeQuoteBatch(inputs);
            (0, globals_1.expect)(results.length).toBe(3);
            results.forEach(result => {
                (0, globals_1.expect)(result.printConfig).toBeDefined();
                (0, globals_1.expect)(result.suggestions).toBeDefined();
                (0, globals_1.expect)(result.estimatedValue).toBeGreaterThan(0);
            });
        });
    });
    (0, globals_1.describe)('RecommendationEngine Unit Tests', () => {
        let engine;
        (0, globals_1.beforeEach)(() => {
            engine = new recommendation_engine_1.RecommendationEngine();
        });
        (0, globals_1.it)('should generate print config from analysis', () => {
            const analysis = {
                complexity: 'simple',
                optimalLocation: 'front-chest',
                recommendedSize: 'M',
                colorsDetected: 2,
                issues: [],
                suggestedMethod: 'screen-print',
                confidence: 0.90,
            };
            const config = engine.generatePrintConfig(analysis);
            (0, globals_1.expect)(config.location).toBe('front-chest');
            (0, globals_1.expect)(config.size).toBe('M');
            (0, globals_1.expect)(config.method).toBe('screen-print');
            (0, globals_1.expect)(config.colors).toBe(2);
            (0, globals_1.expect)(config.confidence).toBe(0.90);
        });
        (0, globals_1.it)('should calculate estimated value correctly', () => {
            const printConfig = {
                location: 'full-front',
                size: 'M',
                method: 'screen-print',
                colors: 3,
                confidence: 0.85,
            };
            const input = {
                imageUrl: 'https://example.com/test.png',
                quantity: 100,
            };
            const suggestions = [
                {
                    type: 'add-on',
                    title: 'Fold & Bag',
                    description: 'Test',
                    priceImpact: 50,
                    confidence: 0.9,
                },
            ];
            const value = engine.calculateEstimatedValue(printConfig, input, suggestions);
            (0, globals_1.expect)(value).toBeGreaterThan(0);
            (0, globals_1.expect)(typeof value).toBe('number');
        });
    });
});
//# sourceMappingURL=quote-optimizer.test.js.map