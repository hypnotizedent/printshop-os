/**
 * Tests for Strapi Storage Integration
 * 
 * These tests mock the Strapi API to test the storage adapters
 */

import { StrapiRuleStorage, StrapiCalculationHistory, StrapiConfig } from '../lib/strapi-storage';
import { PricingRule, PricingInput, PricingOutput } from '../lib/pricing-rules-engine';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('StrapiRuleStorage', () => {
  const config: StrapiConfig = {
    baseUrl: 'http://localhost:1337',
    apiToken: 'test-token',
  };

  let storage: StrapiRuleStorage;

  beforeEach(() => {
    storage = new StrapiRuleStorage(config);
    mockFetch.mockReset();
  });

  describe('getRules', () => {
    it('should fetch all enabled rules from Strapi', async () => {
      const mockRules = [
        {
          id: 1,
          documentId: 'doc1',
          rule_id: 'volume-discount-v1',
          description: 'Volume discount',
          version: 1,
          effective_date: '2025-01-01',
          conditions: { quantity_min: 100 },
          calculations: { discount_pct: 10 },
          priority: 10,
          enabled: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockRules }),
      });

      const rules = await storage.getRules();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pricing-rules'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('volume-discount-v1');
      expect(rules[0].priority).toBe(10);
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(storage.getRules()).rejects.toThrow('Strapi API error');
    });
  });

  describe('getRule', () => {
    it('should fetch a specific rule by ID', async () => {
      const mockRule = {
        id: 1,
        documentId: 'doc1',
        rule_id: 'volume-discount-v1',
        description: 'Volume discount',
        version: 1,
        effective_date: '2025-01-01',
        conditions: { quantity_min: 100 },
        calculations: { discount_pct: 10 },
        priority: 10,
        enabled: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockRule] }),
      });

      const rule = await storage.getRule('volume-discount-v1');

      expect(rule).not.toBeNull();
      expect(rule?.id).toBe('volume-discount-v1');
    });

    it('should return null for non-existent rule', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const rule = await storage.getRule('non-existent');
      expect(rule).toBeNull();
    });

    it('should use cache on repeated calls', async () => {
      const mockRule = {
        id: 1,
        documentId: 'doc1',
        rule_id: 'volume-discount-v1',
        description: 'Volume discount',
        version: 1,
        effective_date: '2025-01-01',
        conditions: {},
        calculations: {},
        priority: 10,
        enabled: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockRule] }),
      });

      // First call - hits API
      await storage.getRule('volume-discount-v1');
      
      // Second call - should use cache
      await storage.getRule('volume-discount-v1');

      // Should only have called fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('createRule', () => {
    it('should create a new rule in Strapi', async () => {
      const newRule: PricingRule = {
        id: 'new-rule-v1',
        description: 'New rule',
        version: 1,
        effective_date: '2025-01-01',
        conditions: { quantity_min: 50 },
        calculations: { discount_pct: 5 },
        priority: 5,
        enabled: true,
      };

      const createdRule = {
        id: 1,
        documentId: 'doc-new',
        rule_id: 'new-rule-v1',
        description: 'New rule',
        version: 1,
        effective_date: '2025-01-01',
        conditions: { quantity_min: 50 },
        calculations: { discount_pct: 5 },
        priority: 5,
        enabled: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: createdRule }),
      });

      const result = await storage.createRule(newRule);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pricing-rules'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('new-rule-v1'),
        })
      );

      expect(result.id).toBe('new-rule-v1');
    });
  });

  describe('updateRule', () => {
    it('should update an existing rule', async () => {
      // Mock finding the existing rule
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{
            id: 1,
            documentId: 'doc1',
            rule_id: 'volume-discount-v1',
            description: 'Volume discount',
            version: 1,
            effective_date: '2025-01-01',
            conditions: {},
            calculations: { discount_pct: 10 },
            priority: 10,
            enabled: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          }],
        }),
      });

      // Mock the update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            id: 1,
            documentId: 'doc1',
            rule_id: 'volume-discount-v1',
            description: 'Updated discount',
            version: 1,
            effective_date: '2025-01-01',
            conditions: {},
            calculations: { discount_pct: 15 },
            priority: 10,
            enabled: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-02T00:00:00Z',
          },
        }),
      });

      const result = await storage.updateRule('volume-discount-v1', {
        description: 'Updated discount',
        calculations: { discount_pct: 15 },
      });

      expect(result.description).toBe('Updated discount');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw for non-existent rule', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await expect(
        storage.updateRule('non-existent', { description: 'Updated' })
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteRule', () => {
    it('should soft delete by disabling', async () => {
      // Mock finding the existing rule
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{
            id: 1,
            documentId: 'doc1',
            rule_id: 'to-delete-v1',
            description: 'To delete',
            version: 1,
            effective_date: '2025-01-01',
            conditions: {},
            calculations: {},
            priority: 10,
            enabled: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          }],
        }),
      });

      // Mock the update (soft delete)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { enabled: false } }),
      });

      const result = await storage.deleteRule('to-delete-v1');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/pricing-rules/doc1'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"enabled":false'),
        })
      );
    });

    it('should return false for non-existent rule', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const result = await storage.deleteRule('non-existent');
      expect(result).toBe(false);
    });
  });
});

describe('StrapiCalculationHistory', () => {
  const config: StrapiConfig = {
    baseUrl: 'http://localhost:1337',
    apiToken: 'test-token',
  };

  let history: StrapiCalculationHistory;

  beforeEach(() => {
    history = new StrapiCalculationHistory(config);
    mockFetch.mockReset();
  });

  describe('saveCalculation', () => {
    it('should save calculation to Strapi', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1 } }),
      });

      const input: PricingInput = {
        garment_id: 'ss-activewear-6001',
        quantity: 50,
        service: 'screen',
        print_locations: ['front'],
        color_count: 1,
      };

      const output: PricingOutput = {
        line_items: [],
        subtotal: 325,
        margin_pct: 35,
        total_price: 438.75,
        breakdown: {
          base_cost: 225,
          location_surcharges: 100,
          color_adjustments: 0,
          volume_discounts: 0,
          margin_amount: 113.75,
        },
        rules_applied: ['location-surcharges-v1'],
        calculation_time_ms: 2,
      };

      await history.saveCalculation(input, output, { quote_id: 'Q-001' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/price-calculations'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('438.75'),
        })
      );
    });

    it('should not throw on API error (graceful degradation)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const input: PricingInput = { quantity: 50 };
      const output: PricingOutput = {
        line_items: [],
        subtotal: 100,
        margin_pct: 35,
        total_price: 135,
        breakdown: {
          base_cost: 100,
          location_surcharges: 0,
          color_adjustments: 0,
          volume_discounts: 0,
          margin_amount: 35,
        },
        rules_applied: [],
        calculation_time_ms: 1,
      };

      // Should not throw
      await expect(history.saveCalculation(input, output)).resolves.toBeUndefined();
    });
  });

  describe('getCalculationHistory', () => {
    it('should fetch calculation history with filters', async () => {
      const mockCalculations = [
        {
          id: 1,
          documentId: 'calc1',
          input: { quantity: 50 },
          output: { total_price: 438.75 },
          rules_applied: ['rule1'],
          garment_id: 'ss-activewear-6001',
          quantity: 50,
          service: 'screen',
          total_price: 438.75,
          margin_pct: 35,
          calculation_time_ms: 2,
          customer_type: 'standard',
          quote_id: 'Q-001',
          order_id: null,
          notes: null,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCalculations }),
      });

      const result = await history.getCalculationHistory({
        garment_id: 'ss-activewear-6001',
      });

      expect(result).toHaveLength(1);
      expect(result[0].input.quantity).toBe(50);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('garment_id'),
        expect.anything()
      );
    });

    it('should return empty array on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await history.getCalculationHistory();
      expect(result).toEqual([]);
    });
  });

  describe('getCalculationByReference', () => {
    it('should fetch calculation by quote ID', async () => {
      const mockCalculation = {
        id: 1,
        documentId: 'calc1',
        input: { quantity: 50 },
        output: { total_price: 438.75 },
        rules_applied: [],
        quantity: 50,
        total_price: 438.75,
        margin_pct: 35,
        quote_id: 'Q-001',
        order_id: null,
        notes: null,
        createdAt: '2025-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockCalculation] }),
      });

      const result = await history.getCalculationByReference('quote', 'Q-001');

      expect(result).not.toBeNull();
      expect(result?.metadata.quote_id).toBe('Q-001');
    });

    it('should return null for non-existent reference', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const result = await history.getCalculationByReference('order', 'O-999');
      expect(result).toBeNull();
    });
  });

  describe('getAnalytics', () => {
    it('should calculate analytics from calculations', async () => {
      const mockCalculations = [
        { margin_pct: 35, calculation_time_ms: 2, total_price: 100, service: 'screen' },
        { margin_pct: 40, calculation_time_ms: 3, total_price: 200, service: 'screen' },
        { margin_pct: 35, calculation_time_ms: 4, total_price: 150, service: 'embroidery' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCalculations }),
      });

      const analytics = await history.getAnalytics();

      expect(analytics.total_calculations).toBe(3);
      expect(analytics.avg_margin_pct).toBeCloseTo(36.67, 1);
      expect(analytics.avg_calculation_time_ms).toBe(3);
      expect(analytics.total_revenue).toBe(450);
      expect(analytics.calculations_by_service).toEqual({
        screen: 2,
        embroidery: 1,
      });
    });

    it('should return empty analytics on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const analytics = await history.getAnalytics();

      expect(analytics.total_calculations).toBe(0);
      expect(analytics.total_revenue).toBe(0);
    });
  });
});
