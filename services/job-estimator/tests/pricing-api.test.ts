/**
 * Pricing API Service Test Suite
 */

import {
  PricingAPIService,
  InMemoryRuleStorage,
  InMemoryCalculationHistory,
} from '../lib/pricing-api';
import { PricingRule, PricingInput } from '../lib/pricing-rules-engine';

describe('Pricing API Service', () => {
  let apiService: PricingAPIService;
  let ruleStorage: InMemoryRuleStorage;
  let calculationHistory: InMemoryCalculationHistory;

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
  ];

  beforeEach(() => {
    ruleStorage = new InMemoryRuleStorage(sampleRules);
    calculationHistory = new InMemoryCalculationHistory();
    apiService = new PricingAPIService(ruleStorage, calculationHistory);
    
    // Set some garment costs
    apiService.setGarmentCost('ss-activewear-6001', 4.5);
    apiService.setGarmentCost('bella-canvas-3001', 5.0);
  });

  describe('Pricing Calculation', () => {
    it('should calculate pricing for a basic order', async () => {
      const input: PricingInput = {
        garment_id: 'ss-activewear-6001',
        quantity: 100,
        service: 'screen',
        print_locations: ['front'],
        color_count: 2,
      };

      const result = await apiService.calculate(input);

      expect(result).toBeDefined();
      expect(result.total_price).toBeGreaterThan(0);
      expect(result.margin_pct).toBe(35);
      expect(result.line_items.length).toBeGreaterThan(0);
      expect(result.calculation_time_ms).toBeLessThan(100);
    });

    it('should use garment cost from lookup', async () => {
      const input: PricingInput = {
        garment_id: 'bella-canvas-3001',
        quantity: 50,
      };

      const result = await apiService.calculate(input);

      // Bella Canvas costs $5.00, should be reflected in base cost
      expect(result.breakdown.base_cost).toBe(250); // 50 * 5.0
    });

    it('should use default cost when garment not found', async () => {
      const input: PricingInput = {
        garment_id: 'unknown-garment',
        quantity: 100,
      };

      const result = await apiService.calculate(input);

      // Default cost is $4.50
      expect(result.breakdown.base_cost).toBe(450); // 100 * 4.5
    });

    it('should save calculation to history', async () => {
      const input: PricingInput = {
        quantity: 100,
        service: 'screen',
      };

      await apiService.calculate(input);

      const history = await apiService.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].input.quantity).toBe(100);
    });

    it('should not save to history in dry run mode', async () => {
      const input: PricingInput = {
        quantity: 100,
      };

      await apiService.calculate(input, { dryRun: true });

      const history = await apiService.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('Caching', () => {
    it('should cache pricing results', async () => {
      const input: PricingInput = {
        quantity: 100,
        service: 'screen',
        print_locations: ['front'],
      };

      // First call
      const result1 = await apiService.calculate(input);
      
      // Second call should use cache
      const result2 = await apiService.calculate(input);

      expect(result1.total_price).toBe(result2.total_price);
      
      // Only one entry in history (cache doesn't save)
      const history = await apiService.getHistory();
      expect(history.length).toBe(1);
    });

    it('should bypass cache when useCache is false', async () => {
      const input: PricingInput = {
        quantity: 100,
      };

      await apiService.calculate(input, { useCache: false });
      await apiService.calculate(input, { useCache: false });

      const history = await apiService.getHistory();
      expect(history.length).toBe(2);
    });

    it('should clear cache', async () => {
      const input: PricingInput = {
        quantity: 100,
      };

      await apiService.calculate(input);
      const stats1 = apiService.getCacheStats();
      expect(stats1.size).toBeGreaterThan(0);

      apiService.clearCache();
      const stats2 = apiService.getCacheStats();
      expect(stats2.size).toBe(0);
    });

    it('should invalidate cache when rules change', async () => {
      const input: PricingInput = {
        quantity: 100,
      };

      // Calculate and cache
      await apiService.calculate(input);
      const stats1 = apiService.getCacheStats();
      expect(stats1.size).toBeGreaterThan(0);

      // Create new rule
      const newRule: PricingRule = {
        id: 'test-rule',
        description: 'Test',
        version: 1,
        effective_date: '2025-01-01',
        conditions: {},
        calculations: {},
        priority: 1,
        enabled: true,
      };
      await apiService.createRule(newRule);

      // Cache should be cleared
      const stats2 = apiService.getCacheStats();
      expect(stats2.size).toBe(0);
    });
  });

  describe('Rule Management', () => {
    it('should create a new rule', async () => {
      const newRule: PricingRule = {
        id: 'new-rule',
        description: 'New test rule',
        version: 1,
        effective_date: '2025-01-01',
        conditions: { quantity_min: 50 },
        calculations: { discount_pct: 5 },
        priority: 8,
        enabled: true,
      };

      const created = await apiService.createRule(newRule);

      expect(created.id).toBe('new-rule');
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
    });

    it('should not create duplicate rule', async () => {
      const newRule: PricingRule = {
        id: 'volume-discount-100', // Already exists
        description: 'Duplicate',
        version: 1,
        effective_date: '2025-01-01',
        conditions: {},
        calculations: {},
        priority: 1,
        enabled: true,
      };

      await expect(apiService.createRule(newRule)).rejects.toThrow();
    });

    it('should update an existing rule', async () => {
      const updated = await apiService.updateRule('volume-discount-100', {
        description: 'Updated description',
        enabled: false,
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.enabled).toBe(false);
      expect(updated.updated_at).toBeDefined();
    });

    it('should not update non-existent rule', async () => {
      await expect(
        apiService.updateRule('non-existent', { description: 'Test' })
      ).rejects.toThrow();
    });

    it('should delete a rule', async () => {
      const deleted = await apiService.deleteRule('volume-discount-100');
      expect(deleted).toBe(true);

      const rules = await apiService.getRules();
      expect(rules.find(r => r.id === 'volume-discount-100')).toBeUndefined();
    });

    it('should get all rules', async () => {
      const rules = await apiService.getRules();
      expect(rules.length).toBe(2);
    });

    it('should get specific rule', async () => {
      const rule = await apiService.getRule('volume-discount-100');
      expect(rule).toBeDefined();
      expect(rule?.description).toBe('10% discount for 100-499 units');
    });
  });

  describe('Calculation History', () => {
    it('should retrieve calculation history', async () => {
      await apiService.calculate({ quantity: 100 });
      await apiService.calculate({ quantity: 200 });

      const history = await apiService.getHistory();
      expect(history.length).toBe(2);
    });

    it('should filter history by garment_id', async () => {
      await apiService.calculate({ garment_id: 'ss-activewear-6001', quantity: 100 });
      await apiService.calculate({ garment_id: 'bella-canvas-3001', quantity: 100 });

      const filtered = await apiService.getHistory({ garment_id: 'ss-activewear-6001' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].input.garment_id).toBe('ss-activewear-6001');
    });

    it('should filter history by customer_type', async () => {
      await apiService.calculate({ quantity: 100, customer_type: 'repeat_customer' });
      await apiService.calculate({ quantity: 100, customer_type: 'new_customer' });

      const filtered = await apiService.getHistory({ customer_type: 'repeat_customer' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].input.customer_type).toBe('repeat_customer');
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate performance metrics', async () => {
      // Use different inputs to avoid caching
      await apiService.calculate({ quantity: 100, service: 'screen' });
      await apiService.calculate({ quantity: 200, service: 'embroidery' });
      await apiService.calculate({ quantity: 300, service: 'dtg' });

      const metrics = await apiService.getPerformanceMetrics();

      expect(metrics.total_calculations).toBe(3);
      expect(metrics.avg_calculation_time_ms).toBeGreaterThanOrEqual(0);
      expect(metrics.avg_calculation_time_ms).toBeLessThan(100);
    });

    it('should handle empty metrics', async () => {
      const metrics = await apiService.getPerformanceMetrics();

      expect(metrics.total_calculations).toBe(0);
      expect(metrics.avg_calculation_time_ms).toBe(0);
    });
  });

  describe('Requirements Compliance', () => {
    it('should match the API input/output format from requirements', async () => {
      const input: PricingInput = {
        garment_id: 'ss-activewear-6001',
        quantity: 100,
        service: 'screen',
        print_locations: ['front', 'back'],
        color_count: 3,
        is_rush: false,
        customer_type: 'repeat_customer',
      };

      const result = await apiService.calculate(input);

      // Verify output structure matches requirements
      expect(result).toHaveProperty('line_items');
      expect(result).toHaveProperty('subtotal');
      expect(result).toHaveProperty('margin_pct');
      expect(result).toHaveProperty('total_price');
      expect(result).toHaveProperty('breakdown');

      // Verify line_items structure
      expect(Array.isArray(result.line_items)).toBe(true);
      if (result.line_items.length > 0) {
        const item = result.line_items[0];
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('total');
      }

      // Verify breakdown structure
      expect(result.breakdown).toHaveProperty('base_cost');
      expect(result.breakdown).toHaveProperty('location_surcharges');
      expect(result.breakdown).toHaveProperty('color_adjustments');
      expect(result.breakdown).toHaveProperty('volume_discounts');
      expect(result.breakdown).toHaveProperty('margin_amount');
    });

    it('should complete calculation in under 100ms', async () => {
      const input: PricingInput = {
        quantity: 100,
        service: 'screen',
        print_locations: ['front', 'back'],
        color_count: 3,
      };

      const result = await apiService.calculate(input);
      expect(result.calculation_time_ms).toBeLessThan(100);
    });

    it('should handle all required features from acceptance criteria', async () => {
      // Base garment cost lookup
      apiService.setGarmentCost('test-garment', 5.0);
      
      const input: PricingInput = {
        garment_id: 'test-garment',
        quantity: 100,
        service: 'screen',
        print_locations: ['front', 'back'], // Print location surcharges
        color_count: 3, // Color count multipliers
        stitch_count: 5000, // For embroidery
        is_rush: false,
        customer_type: 'repeat_customer',
      };

      const result = await apiService.calculate(input);

      // Volume tier discounts (100-499 = -10%)
      expect(result.breakdown.volume_discounts).toBeGreaterThan(0);
      
      // Margin calculation (35% default)
      expect(result.margin_pct).toBe(35);
      
      // Full breakdown
      expect(result.breakdown.base_cost).toBeGreaterThan(0);
      expect(result.breakdown.location_surcharges).toBeGreaterThan(0);
      expect(result.breakdown.margin_amount).toBeGreaterThan(0);
    });
  });
});
