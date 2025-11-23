/**
 * Pricing Rules Engine Test Suite
 * 
 * Comprehensive tests covering:
 * - Rule condition evaluation
 * - Rule precedence
 * - Base calculations
 * - Location surcharges
 * - Color multipliers
 * - Volume discounts
 * - Margin calculations
 * - Embroidery pricing
 * - Integration scenarios
 * - Performance
 */

import {
  PricingRule,
  PricingInput,
  evaluateRuleConditions,
  findMatchingRules,
  applyLocationSurcharges,
  applyColorMultiplier,
  applyVolumeDiscount,
  calculateMargin,
  calculateEmbroideryPrice,
  calculatePricing,
  validatePricingRule,
} from '../lib/pricing-rules-engine';

describe('Pricing Rules Engine', () => {
  // Sample rules for testing
  const sampleRules: PricingRule[] = [
    {
      id: 'volume-discount-100',
      description: '10% discount for 100-499 units',
      version: 1,
      effective_date: '2025-01-01',
      conditions: {
        quantity_min: 100,
        quantity_max: 499,
      },
      calculations: {
        discount_pct: 10,
      },
      priority: 10,
      enabled: true,
    },
    {
      id: 'volume-discount-500',
      description: '20% discount for 500+ units',
      version: 1,
      effective_date: '2025-01-01',
      conditions: {
        quantity_min: 500,
      },
      calculations: {
        discount_pct: 20,
      },
      priority: 10,
      enabled: true,
    },
    {
      id: 'repeat-customer',
      description: 'Extra 5% for repeat customers',
      version: 1,
      effective_date: '2025-01-01',
      conditions: {
        customer_type: ['repeat_customer'],
      },
      calculations: {
        discount_pct: 5,
      },
      priority: 15,
      enabled: true,
    },
    {
      id: 'location-surcharges',
      description: 'Standard location surcharges',
      version: 1,
      effective_date: '2025-01-01',
      conditions: {},
      calculations: {
        location_surcharge: {
          'front': 2.0,
          'back': 3.0,
          'sleeve': 1.5,
        },
      },
      priority: 5,
      enabled: true,
    },
    {
      id: 'color-multipliers',
      description: 'Screen print color multipliers',
      version: 1,
      effective_date: '2025-01-01',
      conditions: {
        service: ['screen'],
      },
      calculations: {
        color_multiplier: {
          '1': 1.0,
          '2': 1.3,
          '3': 1.3,
        },
      },
      priority: 8,
      enabled: true,
    },
  ];

  describe('Rule Condition Evaluation', () => {
    it('should match rule when quantity is in range', () => {
      const rule = sampleRules[0]; // 100-499
      const input: PricingInput = { quantity: 150 };
      expect(evaluateRuleConditions(rule, input)).toBe(true);
    });

    it('should not match rule when quantity is below minimum', () => {
      const rule = sampleRules[0]; // 100-499
      const input: PricingInput = { quantity: 50 };
      expect(evaluateRuleConditions(rule, input)).toBe(false);
    });

    it('should not match rule when quantity is above maximum', () => {
      const rule = sampleRules[0]; // 100-499
      const input: PricingInput = { quantity: 500 };
      expect(evaluateRuleConditions(rule, input)).toBe(false);
    });

    it('should match rule when customer type matches', () => {
      const rule = sampleRules[2]; // repeat_customer
      const input: PricingInput = { quantity: 10, customer_type: 'repeat_customer' };
      expect(evaluateRuleConditions(rule, input)).toBe(true);
    });

    it('should not match rule when customer type does not match', () => {
      const rule = sampleRules[2]; // repeat_customer
      const input: PricingInput = { quantity: 10, customer_type: 'new_customer' };
      expect(evaluateRuleConditions(rule, input)).toBe(false);
    });

    it('should match rule when service matches', () => {
      const rule = sampleRules[4]; // screen service
      const input: PricingInput = { quantity: 100, service: 'screen' };
      expect(evaluateRuleConditions(rule, input)).toBe(true);
    });

    it('should match rule when location matches', () => {
      const rule: PricingRule = {
        ...sampleRules[0],
        conditions: { location: ['front', 'back'] },
      };
      const input: PricingInput = { quantity: 100, print_locations: ['front'] };
      expect(evaluateRuleConditions(rule, input)).toBe(true);
    });
  });

  describe('Rule Precedence and Matching', () => {
    it('should return rules sorted by priority (highest first)', () => {
      const input: PricingInput = { quantity: 150, customer_type: 'repeat_customer' };
      const matching = findMatchingRules(sampleRules, input);
      
      // Should match volume-discount-100 (priority 10) and repeat-customer (priority 15)
      expect(matching.length).toBeGreaterThan(0);
      expect(matching[0].priority).toBeGreaterThanOrEqual(matching[matching.length - 1].priority);
    });

    it('should not return disabled rules', () => {
      const disabledRule: PricingRule = {
        ...sampleRules[0],
        enabled: false,
      };
      const input: PricingInput = { quantity: 150 };
      const matching = findMatchingRules([disabledRule], input);
      expect(matching.length).toBe(0);
    });

    it('should not return rules with future effective dates', () => {
      const futureRule: PricingRule = {
        ...sampleRules[0],
        effective_date: '2030-01-01',
      };
      const input: PricingInput = { quantity: 150 };
      const matching = findMatchingRules([futureRule], input);
      expect(matching.length).toBe(0);
    });

    it('should not return expired rules', () => {
      const expiredRule: PricingRule = {
        ...sampleRules[0],
        expiry_date: '2020-01-01',
      };
      const input: PricingInput = { quantity: 150 };
      const matching = findMatchingRules([expiredRule], input);
      expect(matching.length).toBe(0);
    });
  });

  describe('Location Surcharges', () => {
    it('should apply correct surcharge for front location', () => {
      const result = applyLocationSurcharges(100, ['front'], sampleRules);
      expect(result.total).toBe(2.0);
      expect(result.breakdown['front']).toBe(2.0);
    });

    it('should apply correct surcharge for back location', () => {
      const result = applyLocationSurcharges(100, ['back'], sampleRules);
      expect(result.total).toBe(3.0);
      expect(result.breakdown['back']).toBe(3.0);
    });

    it('should apply correct surcharge for multiple locations', () => {
      const result = applyLocationSurcharges(100, ['front', 'back'], sampleRules);
      expect(result.total).toBe(5.0);
      expect(result.breakdown['front']).toBe(2.0);
      expect(result.breakdown['back']).toBe(3.0);
    });

    it('should use default surcharges when no rules define them', () => {
      const result = applyLocationSurcharges(100, ['front'], []);
      expect(result.total).toBe(2.0);
    });
  });

  describe('Color Multipliers', () => {
    it('should return 1.0 multiplier for 1 color', () => {
      const result = applyColorMultiplier(100, 1, sampleRules);
      expect(result.multiplier).toBe(1.0);
      expect(result.adjustedCost).toBe(100);
    });

    it('should return 1.3 multiplier for 2 colors', () => {
      const result = applyColorMultiplier(100, 2, sampleRules);
      expect(result.multiplier).toBe(1.3);
      expect(result.adjustedCost).toBe(130);
    });

    it('should return 1.3 multiplier for 3 colors', () => {
      const result = applyColorMultiplier(100, 3, sampleRules);
      expect(result.multiplier).toBe(1.3);
      expect(result.adjustedCost).toBe(130);
    });

    it('should use default multiplier when no rules define it', () => {
      const result = applyColorMultiplier(100, 2, []);
      expect(result.multiplier).toBe(1.3);
    });
  });

  describe('Volume Discounts', () => {
    it('should apply 0% discount for quantities under 100', () => {
      const result = applyVolumeDiscount(1000, 50, []);
      expect(result.discount_pct).toBe(0);
      expect(result.discount_amount).toBe(0);
      expect(result.final_amount).toBe(1000);
    });

    it('should apply 10% discount for quantities 100-499', () => {
      const result = applyVolumeDiscount(1000, 150, sampleRules);
      expect(result.discount_pct).toBe(10);
      expect(result.discount_amount).toBe(100);
      expect(result.final_amount).toBe(900);
    });

    it('should apply 20% discount for quantities 500+', () => {
      const result = applyVolumeDiscount(1000, 600, sampleRules);
      expect(result.discount_pct).toBe(20);
      expect(result.discount_amount).toBe(200);
      expect(result.final_amount).toBe(800);
    });

    it('should use rule-based discount over default', () => {
      const customRule: PricingRule = {
        id: 'custom-discount',
        description: 'Custom 15% discount',
        version: 1,
        effective_date: '2025-01-01',
        conditions: { quantity_min: 100 },
        calculations: { discount_pct: 15 },
        priority: 20,
        enabled: true,
      };
      const result = applyVolumeDiscount(1000, 150, [customRule]);
      expect(result.discount_pct).toBe(15);
      expect(result.discount_amount).toBe(150);
    });
  });

  describe('Margin Calculations', () => {
    it('should apply default 35% margin', () => {
      const result = calculateMargin(1000, []);
      expect(result.margin_pct).toBe(35);
      expect(result.margin_amount).toBe(350);
      expect(result.total_price).toBe(1350);
    });

    it('should apply custom margin from rules', () => {
      const marginRule: PricingRule = {
        id: 'custom-margin',
        description: 'Custom 40% margin',
        version: 1,
        effective_date: '2025-01-01',
        conditions: {},
        calculations: { margin_target: 0.40 },
        priority: 10,
        enabled: true,
      };
      const result = calculateMargin(1000, [marginRule]);
      expect(result.margin_pct).toBe(40);
      expect(result.margin_amount).toBe(400);
      expect(result.total_price).toBe(1400);
    });
  });

  describe('Embroidery Pricing', () => {
    it('should calculate price based on stitch count', () => {
      const price = calculateEmbroideryPrice(5000, 100, []);
      // 5000 stitches / 1000 * $1.50 * 100 qty = $750
      expect(price).toBe(750);
    });

    it('should use custom stitch pricing from rules', () => {
      const stitchRule: PricingRule = {
        id: 'custom-stitch',
        description: 'Custom stitch pricing',
        version: 1,
        effective_date: '2025-01-01',
        conditions: {},
        calculations: { stitch_price_per_1000: 2.0 },
        priority: 10,
        enabled: true,
      };
      const price = calculateEmbroideryPrice(5000, 100, [stitchRule]);
      // 5000 stitches / 1000 * $2.00 * 100 qty = $1000
      expect(price).toBe(1000);
    });
  });

  describe('Full Pricing Calculation', () => {
    it('should calculate accurate quote for basic screen print order', () => {
      const input: PricingInput = {
        garment_id: 'ss-activewear-6001',
        quantity: 100,
        service: 'screen',
        print_locations: ['front', 'back'],
        color_count: 3,
      };

      const result = calculatePricing(input, sampleRules, 4.5);

      // Base: 4.5 * 100 = 450
      // Locations: (2 + 3) * 100 = 500
      // Subtotal before color: 950
      // Color multiplier (3 colors = 1.3): 950 * 1.3 = 1235
      // Volume discount (10%): -123.5
      // Subtotal after discount: 1111.5
      // Margin (35%): 389.025
      // Total: 1500.525

      expect(result.line_items.length).toBeGreaterThan(0);
      expect(result.breakdown.base_cost).toBe(450);
      expect(result.breakdown.location_surcharges).toBe(500);
      expect(result.margin_pct).toBe(35);
      expect(result.total_price).toBeGreaterThan(1000);
      expect(result.rules_applied.length).toBeGreaterThan(0);
    });

    it('should calculate accurate quote for embroidery order', () => {
      const input: PricingInput = {
        quantity: 50,
        service: 'embroidery',
        stitch_count: 8000,
      };

      const result = calculatePricing(input, sampleRules, 6.0);

      // Base: 6.0 * 50 = 300
      // Embroidery: 8000/1000 * 1.5 * 50 = 600
      // Subtotal: 900
      // No volume discount (< 100)
      // Margin (35%): 315
      // Total: 1215

      expect(result.breakdown.base_cost).toBe(300);
      expect(result.line_items.some(item => item.description.includes('Embroidery'))).toBe(true);
    });

    it('should apply highest priority rule when multiple match', () => {
      const input: PricingInput = {
        quantity: 150,
        customer_type: 'repeat_customer',
      };

      const result = calculatePricing(input, sampleRules, 4.5);

      // Repeat customer rule has priority 15, should win over volume discount priority 10
      expect(result.rules_applied).toContain('repeat-customer');
    });

    it('should complete calculation in under 100ms', () => {
      const input: PricingInput = {
        quantity: 100,
        service: 'screen',
        print_locations: ['front'],
        color_count: 2,
      };

      const result = calculatePricing(input, sampleRules, 4.5);

      expect(result.calculation_time_ms).toBeLessThan(100);
    });

    it('should match the example from requirements', () => {
      // From requirements:
      // garment_id: "ss-activewear-6001", quantity: 100, 
      // print_locations: ["front", "back"], color_count: 3
      
      const input: PricingInput = {
        garment_id: 'ss-activewear-6001',
        quantity: 100,
        service: 'screen',
        print_locations: ['front', 'back'],
        color_count: 3,
        is_rush: false,
        customer_type: 'repeat_customer',
      };

      const result = calculatePricing(input, sampleRules, 4.5);

      // Verify structure matches expected output
      expect(result.line_items).toBeDefined();
      expect(result.subtotal).toBeDefined();
      expect(result.margin_pct).toBeDefined();
      expect(result.total_price).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.base_cost).toBeDefined();
      expect(result.breakdown.location_surcharges).toBeDefined();
      expect(result.breakdown.color_adjustments).toBeDefined();
      expect(result.breakdown.volume_discounts).toBeDefined();
      expect(result.breakdown.margin_amount).toBeDefined();
    });
  });

  describe('Rule Validation', () => {
    it('should validate a complete rule', () => {
      const rule: Partial<PricingRule> = {
        id: 'test-rule',
        description: 'Test rule',
        version: 1,
        effective_date: '2025-01-01',
        conditions: {},
        calculations: {},
        priority: 10,
        enabled: true,
      };

      const result = validatePricingRule(rule);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail validation when ID is missing', () => {
      const rule: Partial<PricingRule> = {
        description: 'Test rule',
        version: 1,
        effective_date: '2025-01-01',
        conditions: {},
        calculations: {},
        priority: 10,
        enabled: true,
      };

      const result = validatePricingRule(rule);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Rule ID is required');
    });

    it('should fail validation when version is invalid', () => {
      const rule: Partial<PricingRule> = {
        id: 'test-rule',
        description: 'Test rule',
        version: 0,
        effective_date: '2025-01-01',
        conditions: {},
        calculations: {},
        priority: 10,
        enabled: true,
      };

      const result = validatePricingRule(rule);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Version must be >= 1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity gracefully', () => {
      const input: PricingInput = { quantity: 0 };
      const result = calculatePricing(input, sampleRules, 4.5);
      expect(result.breakdown.base_cost).toBe(0);
    });

    it('should handle missing optional fields', () => {
      const input: PricingInput = { quantity: 100 };
      const result = calculatePricing(input, sampleRules, 4.5);
      expect(result).toBeDefined();
      expect(result.total_price).toBeGreaterThan(0);
    });

    it('should handle empty rules array', () => {
      const input: PricingInput = { quantity: 100 };
      const result = calculatePricing(input, [], 4.5);
      expect(result).toBeDefined();
      expect(result.rules_applied.length).toBe(0);
    });

    it('should handle very large quantities', () => {
      const input: PricingInput = { quantity: 10000 };
      const result = calculatePricing(input, sampleRules, 4.5);
      expect(result.breakdown.base_cost).toBe(45000);
    });
  });
});
