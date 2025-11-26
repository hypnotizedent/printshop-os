/**
 * Golden Tests for Pricing Engine
 * 
 * These tests validate the pricing engine against known input/output pairs.
 * Golden tests ensure pricing consistency and prevent regressions.
 */

import fs from 'fs';
import path from 'path';
import { calculatePricing, PricingInput, PricingRule } from '../lib/pricing-rules-engine';

// Load golden test fixtures
const fixturesPath = path.join(__dirname, 'fixtures', 'golden-tests.json');
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

// Load sample pricing rules
const rulesPath = path.join(__dirname, '..', 'data', 'sample-pricing-rules.json');
const rules: PricingRule[] = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

interface GoldenTestCase {
  id: string;
  description: string;
  input: PricingInput;
  garment_cost: number;
  expected: {
    subtotal?: number;
    margin_pct?: number;
    total_price?: number;
    breakdown?: {
      base_cost?: number;
      location_surcharges?: number;
      color_adjustments?: number;
      volume_discounts?: number;
      margin_amount?: number;
    };
    rules_applied_contains?: string[];
  };
  assertions?: {
    color_adjustments_gt?: number;
    volume_discounts_gt?: number;
    total_price_gt?: number;
    total_price_lt?: number;
    line_items_contains_description?: string;
  };
}

describe('Pricing Engine Golden Tests', () => {
  const testCases: GoldenTestCase[] = fixtures.test_cases;

  describe('Core Pricing Calculations', () => {
    testCases.forEach((testCase) => {
      it(`[${testCase.id}] ${testCase.description}`, () => {
        // Calculate pricing
        const result = calculatePricing(testCase.input, rules, testCase.garment_cost);

        // Validate expected values
        if (testCase.expected.subtotal !== undefined) {
          expect(result.subtotal).toBeCloseTo(testCase.expected.subtotal, 2);
        }

        if (testCase.expected.margin_pct !== undefined) {
          expect(result.margin_pct).toBeCloseTo(testCase.expected.margin_pct, 1);
        }

        if (testCase.expected.total_price !== undefined) {
          expect(result.total_price).toBeCloseTo(testCase.expected.total_price, 2);
        }

        // Validate breakdown
        if (testCase.expected.breakdown) {
          const { breakdown } = testCase.expected;

          if (breakdown.base_cost !== undefined) {
            expect(result.breakdown.base_cost).toBeCloseTo(breakdown.base_cost, 2);
          }

          if (breakdown.location_surcharges !== undefined) {
            expect(result.breakdown.location_surcharges).toBeCloseTo(breakdown.location_surcharges, 2);
          }

          if (breakdown.color_adjustments !== undefined) {
            expect(result.breakdown.color_adjustments).toBeCloseTo(breakdown.color_adjustments, 2);
          }

          if (breakdown.volume_discounts !== undefined) {
            expect(result.breakdown.volume_discounts).toBeCloseTo(breakdown.volume_discounts, 2);
          }
        }

        // Validate rules applied
        if (testCase.expected.rules_applied_contains) {
          testCase.expected.rules_applied_contains.forEach((ruleId) => {
            expect(result.rules_applied).toContain(ruleId);
          });
        }

        // Additional assertions
        if (testCase.assertions) {
          const { assertions } = testCase;

          if (assertions.color_adjustments_gt !== undefined) {
            expect(result.breakdown.color_adjustments).toBeGreaterThan(assertions.color_adjustments_gt);
          }

          if (assertions.volume_discounts_gt !== undefined) {
            expect(result.breakdown.volume_discounts).toBeGreaterThan(assertions.volume_discounts_gt);
          }

          if (assertions.total_price_gt !== undefined) {
            expect(result.total_price).toBeGreaterThan(assertions.total_price_gt);
          }

          if (assertions.total_price_lt !== undefined) {
            expect(result.total_price).toBeLessThan(assertions.total_price_lt);
          }

          if (assertions.line_items_contains_description) {
            const descriptions = result.line_items.map((item) => item.description);
            expect(descriptions).toContain(assertions.line_items_contains_description);
          }
        }
      });
    });
  });

  describe('Calculation Performance', () => {
    it('should complete calculations in under 10ms', () => {
      testCases.forEach((testCase) => {
        const result = calculatePricing(testCase.input, rules, testCase.garment_cost);
        expect(result.calculation_time_ms).toBeLessThan(10);
      });
    });

    it('should handle 1000 calculations in under 100ms', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        const testCase = testCases[i % testCases.length];
        calculatePricing(testCase.input, rules, testCase.garment_cost);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity gracefully', () => {
      const input: PricingInput = {
        garment_id: 'test-garment',
        quantity: 0,
        service: 'screen',
        print_locations: ['front'],
        color_count: 1,
      };

      const result = calculatePricing(input, rules, 4.5);
      expect(result.total_price).toBe(0);
    });

    it('should handle missing optional fields', () => {
      const input: PricingInput = {
        quantity: 50,
      };

      const result = calculatePricing(input, rules, 4.5);
      expect(result.total_price).toBeGreaterThan(0);
      expect(result.rules_applied.length).toBeGreaterThan(0);
    });

    it('should handle empty print locations', () => {
      const input: PricingInput = {
        quantity: 50,
        service: 'screen',
        print_locations: [],
        color_count: 1,
      };

      const result = calculatePricing(input, rules, 4.5);
      expect(result.breakdown.location_surcharges).toBe(0);
    });

    it('should handle very large quantities', () => {
      const input: PricingInput = {
        quantity: 10000,
        service: 'screen',
        print_locations: ['front'],
        color_count: 1,
      };

      const result = calculatePricing(input, rules, 4.5);
      expect(result.total_price).toBeGreaterThan(0);
      expect(result.breakdown.volume_discounts).toBeGreaterThan(0);
    });

    it('should handle unknown service type', () => {
      const input: PricingInput = {
        quantity: 50,
        service: 'unknown-service',
        print_locations: ['front'],
        color_count: 2,
      };

      const result = calculatePricing(input, rules, 4.5);
      // Should still calculate but without service-specific rules
      expect(result.total_price).toBeGreaterThan(0);
    });
  });

  describe('Rule Precedence', () => {
    it('should apply higher priority rules first', () => {
      // Repeat customer discount has priority 15, volume discount has priority 10
      const input: PricingInput = {
        quantity: 150,
        service: 'screen',
        print_locations: ['front'],
        color_count: 1,
        customer_type: 'repeat_customer',
      };

      const result = calculatePricing(input, rules, 4.5);
      
      // Both rules should be applied
      expect(result.rules_applied).toContain('repeat-customer-discount-v1');
      expect(result.rules_applied).toContain('volume-discount-100-499-v1');
      
      // Repeat customer rule should appear first (higher priority)
      const repeatIndex = result.rules_applied.indexOf('repeat-customer-discount-v1');
      const volumeIndex = result.rules_applied.indexOf('volume-discount-100-499-v1');
      expect(repeatIndex).toBeLessThan(volumeIndex);
    });
  });

  describe('Date-Based Rule Filtering', () => {
    it('should only apply rules with valid effective dates', () => {
      // Create a future-dated rule
      const futureRules: PricingRule[] = [
        ...rules,
        {
          id: 'future-discount-v1',
          description: 'Future discount (should not apply)',
          version: 1,
          effective_date: '2099-01-01',
          conditions: { quantity_min: 1 },
          calculations: { discount_pct: 50 },
          priority: 100,
          enabled: true,
        },
      ];

      const input: PricingInput = {
        quantity: 50,
        service: 'screen',
        print_locations: ['front'],
        color_count: 1,
      };

      const result = calculatePricing(input, futureRules, 4.5);
      
      // Future rule should not be applied
      expect(result.rules_applied).not.toContain('future-discount-v1');
    });

    it('should not apply expired rules', () => {
      const expiredRules: PricingRule[] = [
        ...rules,
        {
          id: 'expired-discount-v1',
          description: 'Expired discount (should not apply)',
          version: 1,
          effective_date: '2020-01-01',
          expiry_date: '2020-12-31',
          conditions: { quantity_min: 1 },
          calculations: { discount_pct: 50 },
          priority: 100,
          enabled: true,
        },
      ];

      const input: PricingInput = {
        quantity: 50,
        service: 'screen',
        print_locations: ['front'],
        color_count: 1,
      };

      const result = calculatePricing(input, expiredRules, 4.5);
      
      // Expired rule should not be applied
      expect(result.rules_applied).not.toContain('expired-discount-v1');
    });
  });

  describe('Disabled Rules', () => {
    it('should not apply disabled rules', () => {
      const rulesWithDisabled: PricingRule[] = rules.map((rule) =>
        rule.id === 'volume-discount-100-499-v1'
          ? { ...rule, enabled: false }
          : rule
      );

      const input: PricingInput = {
        quantity: 150,
        service: 'screen',
        print_locations: ['front'],
        color_count: 1,
      };

      const result = calculatePricing(input, rulesWithDisabled, 4.5);
      
      // Disabled rule should not be applied
      expect(result.rules_applied).not.toContain('volume-discount-100-499-v1');
    });
  });

  describe('Snapshot Regression Prevention', () => {
    // These tests snapshot exact outputs to catch any unintended changes
    
    it('snapshot: 50 units basic order', () => {
      const input: PricingInput = {
        garment_id: 'ss-activewear-6001',
        quantity: 50,
        service: 'screen',
        print_locations: ['front'],
        color_count: 1,
      };

      const result = calculatePricing(input, rules, 4.5);
      
      expect(result).toMatchSnapshot({
        calculation_time_ms: expect.any(Number),
      });
    });

    it('snapshot: 100 units with volume discount', () => {
      const input: PricingInput = {
        garment_id: 'bella-canvas-3001',
        quantity: 100,
        service: 'screen',
        print_locations: ['front', 'back'],
        color_count: 2,
      };

      const result = calculatePricing(input, rules, 5.0);
      
      expect(result).toMatchSnapshot({
        calculation_time_ms: expect.any(Number),
      });
    });

    it('snapshot: embroidery order', () => {
      const input: PricingInput = {
        garment_id: 'polo-001',
        quantity: 36,
        service: 'embroidery',
        stitch_count: 8000,
        print_locations: ['left-chest'],
      };

      const result = calculatePricing(input, rules, 12.0);
      
      expect(result).toMatchSnapshot({
        calculation_time_ms: expect.any(Number),
      });
    });
  });
});

describe('Golden Test Fixtures Validation', () => {
  it('should have valid test fixture file', () => {
    expect(fixtures.version).toBeDefined();
    expect(fixtures.test_cases).toBeDefined();
    expect(Array.isArray(fixtures.test_cases)).toBe(true);
    expect(fixtures.test_cases.length).toBeGreaterThan(0);
  });

  it('should have unique test case IDs', () => {
    const ids = fixtures.test_cases.map((tc: GoldenTestCase) => tc.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should have required fields in all test cases', () => {
    fixtures.test_cases.forEach((tc: GoldenTestCase) => {
      expect(tc.id).toBeDefined();
      expect(tc.description).toBeDefined();
      expect(tc.input).toBeDefined();
      expect(tc.input.quantity).toBeDefined();
      expect(tc.garment_cost).toBeDefined();
      expect(tc.expected).toBeDefined();
    });
  });
});
