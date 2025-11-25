/**
 * API Mock Tests - Tests pricing engine, quote generation, and data persistence
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrintavoSuccessResponses, mockPrintavoEdgeCases } from '../mocks/printavo-responses';
// import { mockStrapiSuccessResponses, mockStrapiEdgeCases } from '../mocks/strapi-responses';
import { transformPrintavoToStrapi, transformPrintavoOrdersBatch } from '../lib/printavo-mapper';
import { OrderStatus, validateStrapiOrder } from '../lib/strapi-schema';

/**
 * Mock Pricing Engine for testing
 */
class MockPricingEngine {
  private baseRates: Map<string, number> = new Map([
    ['screen-print', 7.5],
    ['embroidery', 12.5],
    ['direct-print', 15.0],
    ['laser-engrave', 8.0],
  ]);

  private setupFees: Map<string, number> = new Map([
    ['screen-print', 50.0],
    ['embroidery', 75.0],
    ['direct-print', 25.0],
    ['laser-engrave', 35.0],
  ]);

  private minimumCharge = 50.0;
  private taxRate = 0.08;
  private markupPercentage = 0.25;

  calculatePrice(
    quantity: number,
    service: string,
    colors: number = 1,
    locations: number = 1,
  ): {
    unitCost: number;
    setupFee: number;
    subtotal: number;
    tax: number;
    total: number;
  } {
    const baseRate = this.baseRates.get(service) || 7.5;
    const setupFee = this.setupFees.get(service) || 50.0;

    // Quantity discount tiers
    let unitCost = baseRate;
    if (quantity >= 500) unitCost *= 0.85;
    else if (quantity >= 250) unitCost *= 0.90;
    else if (quantity >= 100) unitCost *= 0.95;

    // Multi-color surcharge
    if (colors > 1) {
      unitCost *= 1 + (colors - 1) * 0.1;
    }

    // Multi-location surcharge
    if (locations > 1) {
      unitCost *= 1 + (locations - 1) * 0.05;
    }

    const subtotal = Math.max(setupFee + quantity * unitCost, this.minimumCharge);
    const tax = subtotal * this.taxRate;
    const total = subtotal + tax;

    return {
      unitCost,
      setupFee,
      subtotal,
      tax,
      total,
    };
  }

  generateQuote(items: Array<{ quantity: number; service: string; colors?: number; locations?: number }>) {
    let totalSubtotal = 0;
    let totalSetupFees = 0;
    const lineItems = [];

    for (const item of items) {
      const pricing = this.calculatePrice(
        item.quantity,
        item.service,
        item.colors || 1,
        item.locations || 1,
      );

      totalSubtotal += pricing.subtotal;
      totalSetupFees += pricing.setupFee;

      lineItems.push({
        quantity: item.quantity,
        service: item.service,
        colors: item.colors || 1,
        locations: item.locations || 1,
        unitCost: pricing.unitCost,
        setupFee: pricing.setupFee,
        subtotal: pricing.subtotal,
      });
    }

    const subtotal = totalSubtotal;
    const tax = subtotal * this.taxRate;
    const total = subtotal + tax;

    return {
      quoteNumber: `Q-${Date.now()}`,
      lineItems,
      subtotal,
      setupFees: totalSetupFees,
      tax,
      total,
      markupApplied: this.markupPercentage * 100,
    };
  }
}

/**
 * Mock Data Persistence Store
 */
class MockDataStore {
  private orders: Map<string, any> = new Map();
  private quotes: Map<string, any> = new Map();
  private syncSessions: Map<string, any> = new Map();

  saveOrder(id: string, order: any): boolean {
    this.orders.set(id, { ...order, savedAt: new Date().toISOString() });
    return true;
  }

  getOrder(id: string): any | null {
    return this.orders.get(id) || null;
  }

  getAllOrders(): any[] {
    return Array.from(this.orders.values());
  }

  orderExists(id: string): boolean {
    return this.orders.has(id);
  }

  deleteOrder(id: string): boolean {
    return this.orders.delete(id);
  }

  saveQuote(id: string, quote: any): boolean {
    this.quotes.set(id, { ...quote, savedAt: new Date().toISOString() });
    return true;
  }

  getQuote(id: string): any | null {
    return this.quotes.get(id) || null;
  }

  getAllQuotes(): any[] {
    return Array.from(this.quotes.values());
  }

  startSyncSession(sessionId: string): void {
    this.syncSessions.set(sessionId, {
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      ordersProcessed: 0,
      ordersSuccessful: 0,
      ordersFailed: 0,
      errors: [],
    });
  }

  updateSyncSession(sessionId: string, updates: any): void {
    const session = this.syncSessions.get(sessionId);
    if (session) {
      this.syncSessions.set(sessionId, { ...session, ...updates });
    }
  }

  completeSyncSession(sessionId: string): any {
    const session = this.syncSessions.get(sessionId);
    if (session) {
      const completed = {
        ...session,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
      this.syncSessions.set(sessionId, completed);
      return completed;
    }
    return null;
  }

  getSyncSession(sessionId: string): any {
    return this.syncSessions.get(sessionId) || null;
  }

  clear(): void {
    this.orders.clear();
    this.quotes.clear();
    this.syncSessions.clear();
  }
}

/**
 * Test Suite
 */
describe('API Mock Tests - Pricing, Quotes, and Persistence', () => {
  let pricingEngine: MockPricingEngine;
  let dataStore: MockDataStore;

  beforeEach(() => {
    pricingEngine = new MockPricingEngine();
    dataStore = new MockDataStore();
  });

  afterEach(() => {
    dataStore.clear();
  });

  // ============================================================================
  // Pricing Engine Tests
  // ============================================================================
  describe('Pricing Engine', () => {
    it('should calculate base price for screen print', () => {
      const pricing = pricingEngine.calculatePrice(100, 'screen-print', 1, 1);

      expect(pricing.unitCost).toBe(7.5 * 0.95); // 100pc gets 5% discount
      expect(pricing.setupFee).toBe(50.0);
      expect(pricing.subtotal).toBeGreaterThan(0);
      expect(pricing.tax).toBeGreaterThan(0);
      expect(pricing.total).toBeGreaterThan(0);
    });

    it('should apply quantity discounts', () => {
      const price100 = pricingEngine.calculatePrice(100, 'screen-print');
      const price250 = pricingEngine.calculatePrice(250, 'screen-print');
      const price500 = pricingEngine.calculatePrice(500, 'screen-print');

      expect(price250.unitCost).toBeLessThan(price100.unitCost);
      expect(price500.unitCost).toBeLessThan(price250.unitCost);
    });

    it('should apply multi-color surcharge', () => {
      const oneColor = pricingEngine.calculatePrice(100, 'screen-print', 1, 1);
      const twoColor = pricingEngine.calculatePrice(100, 'screen-print', 2, 1);
      const fourColor = pricingEngine.calculatePrice(100, 'screen-print', 4, 1);

      expect(twoColor.unitCost).toBeGreaterThan(oneColor.unitCost);
      expect(fourColor.unitCost).toBeGreaterThan(twoColor.unitCost);
    });

    it('should apply multi-location surcharge', () => {
      const oneLocation = pricingEngine.calculatePrice(100, 'screen-print', 1, 1);
      const twoLocation = pricingEngine.calculatePrice(100, 'screen-print', 1, 2);
      const threeLocation = pricingEngine.calculatePrice(100, 'screen-print', 1, 3);

      expect(twoLocation.unitCost).toBeGreaterThan(oneLocation.unitCost);
      expect(threeLocation.unitCost).toBeGreaterThan(twoLocation.unitCost);
    });

    it('should calculate 100pc 1-color screen print example', () => {
      const pricing = pricingEngine.calculatePrice(100, 'screen-print', 1, 1);

      // 100 * 7.5 * 0.95 (5% discount) = 712.5
      // + 50 setup = 762.5
      // Expected subtotal: ~752 (with minimum charge logic)
      expect(pricing.subtotal).toBeCloseTo(762.5, 0);
    });

    it('should include tax in total', () => {
      const pricing = pricingEngine.calculatePrice(100, 'screen-print');

      expect(pricing.total).toBe(pricing.subtotal + pricing.tax);
      expect(pricing.tax).toBeCloseTo(pricing.subtotal * 0.08, 1);
    });

    it('should handle embroidery pricing', () => {
      const pricing = pricingEngine.calculatePrice(50, 'embroidery');

      expect(pricing.setupFee).toBe(75.0);
      expect(pricing.unitCost).toBeDefined();
    });

    it('should handle direct print pricing', () => {
      const pricing = pricingEngine.calculatePrice(250, 'direct-print');

      expect(pricing.setupFee).toBe(25.0);
      expect(pricing.unitCost).toBeDefined();
    });

    it('should enforce minimum charge', () => {
      const pricing = pricingEngine.calculatePrice(1, 'screen-print');

      expect(pricing.subtotal).toBeGreaterThanOrEqual(50.0);
    });

    it('should handle unknown service type', () => {
      const pricing = pricingEngine.calculatePrice(100, 'unknown-service');

      expect(pricing.unitCost).toBe(7.5 * 0.95); // Falls back to default
      expect(pricing.setupFee).toBe(50.0);
    });

    it('should handle very large quantities', () => {
      const pricing = pricingEngine.calculatePrice(10000, 'screen-print');

      expect(pricing.unitCost).toBe(7.5 * 0.85); // 500+ pc discount
      expect(pricing.total).toBeGreaterThan(0);
    });

    it('should calculate combined discounts correctly', () => {
      // 500pc, 4-color, 2-location
      const pricing = pricingEngine.calculatePrice(500, 'screen-print', 4, 2);

      // Base: 7.5
      // 500+ discount: 7.5 * 0.85 = 6.375
      // 4-color surcharge: 6.375 * 1.3 = 8.2875
      // 2-location surcharge: 8.2875 * 1.05 = 8.702
      expect(pricing.unitCost).toBeCloseTo(8.702, 1);
    });
  });

  // ============================================================================
  // Quote Generation Tests
  // ============================================================================
  describe('Quote Generation', () => {
    it('should generate quote with single line item', () => {
      const items = [{ quantity: 100, service: 'screen-print' }];
      const quote = pricingEngine.generateQuote(items);

      expect(quote).toHaveProperty('quoteNumber');
      expect(quote).toHaveProperty('lineItems');
      expect(quote).toHaveProperty('subtotal');
      expect(quote).toHaveProperty('tax');
      expect(quote).toHaveProperty('total');
      expect(quote.lineItems.length).toBe(1);
    });

    it('should generate quote with multiple line items', () => {
      const items = [
        { quantity: 100, service: 'screen-print' },
        { quantity: 50, service: 'embroidery' },
        { quantity: 200, service: 'direct-print' },
      ];

      const quote = pricingEngine.generateQuote(items);
      expect(quote.lineItems.length).toBe(3);
    });

    it('should aggregate line items correctly', () => {
      const items = [
        { quantity: 100, service: 'screen-print' },
        { quantity: 100, service: 'screen-print' },
      ];

      const quote = pricingEngine.generateQuote(items);
      expect(quote.subtotal).toBeGreaterThan(0);
      expect(quote.total).toBeGreaterThan(0);
    });

    it('should calculate tax on total subtotal', () => {
      const items = [
        { quantity: 100, service: 'screen-print' },
        { quantity: 50, service: 'embroidery' },
      ];

      const quote = pricingEngine.generateQuote(items);
      expect(quote.tax).toBeCloseTo(quote.subtotal * 0.08, 1);
    });

    it('should include markup information', () => {
      const items = [{ quantity: 100, service: 'screen-print' }];
      const quote = pricingEngine.generateQuote(items);

      expect(quote.markupApplied).toBe(25);
    });

    it('should persist quote to store', () => {
      const items = [{ quantity: 100, service: 'screen-print' }];
      const quote = pricingEngine.generateQuote(items);

      const saved = dataStore.saveQuote(quote.quoteNumber, quote);
      expect(saved).toBe(true);

      const retrieved = dataStore.getQuote(quote.quoteNumber);
      expect(retrieved).toBeDefined();
      expect(retrieved.quoteNumber).toBe(quote.quoteNumber);
    });
  });

  // ============================================================================
  // Data Persistence Tests
  // ============================================================================
  describe('Data Persistence - Orders', () => {
    it('should save order to store', () => {
      const order = mockPrintavoSuccessResponses.order_100pc_1color_chest;
      const strapiOrder = transformPrintavoToStrapi(order);

      const saved = dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);
      expect(saved).toBe(true);
    });

    it('should retrieve saved order', () => {
      const order = mockPrintavoSuccessResponses.order_100pc_1color_chest;
      const strapiOrder = transformPrintavoToStrapi(order);

      dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);
      const retrieved = dataStore.getOrder(strapiOrder.printavoId);

      expect(retrieved).toBeDefined();
      expect(retrieved.printavoId).toBe(strapiOrder.printavoId);
    });

    it('should update existing order', () => {
      const order = mockPrintavoSuccessResponses.order_100pc_1color_chest;
      const strapiOrder = transformPrintavoToStrapi(order);

      dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);

      const updated = { ...strapiOrder, status: OrderStatus.IN_PRODUCTION };
      dataStore.saveOrder(strapiOrder.printavoId, updated);

      const retrieved = dataStore.getOrder(strapiOrder.printavoId);
      expect(retrieved.status).toBe(OrderStatus.IN_PRODUCTION);
    });

    it('should check order existence', () => {
      const order = mockPrintavoSuccessResponses.order_100pc_1color_chest;
      const strapiOrder = transformPrintavoToStrapi(order);

      expect(dataStore.orderExists(strapiOrder.printavoId)).toBe(false);

      dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);
      expect(dataStore.orderExists(strapiOrder.printavoId)).toBe(true);
    });

    it('should retrieve all orders', () => {
      const orders = [
        mockPrintavoSuccessResponses.order_100pc_1color_chest,
        mockPrintavoSuccessResponses.order_caps_embroidery_multicolor,
        mockPrintavoSuccessResponses.order_ready_to_ship,
      ];

      for (const order of orders) {
        const strapiOrder = transformPrintavoToStrapi(order);
        dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);
      }

      const all = dataStore.getAllOrders();
      expect(all.length).toBe(3);
    });

    it('should delete order', () => {
      const order = mockPrintavoSuccessResponses.order_100pc_1color_chest;
      const strapiOrder = transformPrintavoToStrapi(order);

      dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);
      expect(dataStore.orderExists(strapiOrder.printavoId)).toBe(true);

      const deleted = dataStore.deleteOrder(strapiOrder.printavoId);
      expect(deleted).toBe(true);
      expect(dataStore.orderExists(strapiOrder.printavoId)).toBe(false);
    });

    it('should timestamp saved orders', () => {
      const order = mockPrintavoSuccessResponses.order_100pc_1color_chest;
      const strapiOrder = transformPrintavoToStrapi(order);

      dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);
      const retrieved = dataStore.getOrder(strapiOrder.printavoId);

      expect(retrieved.savedAt).toBeDefined();
      expect(new Date(retrieved.savedAt).getTime()).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Data Persistence Tests - Quotes
  // ============================================================================
  describe('Data Persistence - Quotes', () => {
    it('should save quote to store', () => {
      const items = [{ quantity: 100, service: 'screen-print' }];
      const quote = pricingEngine.generateQuote(items);

      const saved = dataStore.saveQuote(quote.quoteNumber, quote);
      expect(saved).toBe(true);
    });

    it('should retrieve saved quote', () => {
      const items = [{ quantity: 100, service: 'screen-print' }];
      const quote = pricingEngine.generateQuote(items);

      dataStore.saveQuote(quote.quoteNumber, quote);
      const retrieved = dataStore.getQuote(quote.quoteNumber);

      expect(retrieved.quoteNumber).toBe(quote.quoteNumber);
      expect(retrieved.total).toBe(quote.total);
    });

    it('should retrieve all quotes', () => {
      const items1 = [{ quantity: 100, service: 'screen-print' }];
      const items2 = [{ quantity: 50, service: 'embroidery' }];
      const items3 = [{ quantity: 200, service: 'direct-print' }];

      const quote1 = pricingEngine.generateQuote(items1);
      const quote2 = pricingEngine.generateQuote(items2);
      const quote3 = pricingEngine.generateQuote(items3);

      dataStore.saveQuote(quote1.quoteNumber, quote1);
      dataStore.saveQuote(quote2.quoteNumber, quote2);
      dataStore.saveQuote(quote3.quoteNumber, quote3);

      const all = dataStore.getAllQuotes();
      expect(all.length).toBe(3);
    });
  });

  // ============================================================================
  // Sync Session Tests
  // ============================================================================
  describe('Data Persistence - Sync Sessions', () => {
    it('should start sync session', () => {
      const sessionId = 'sync-001';
      dataStore.startSyncSession(sessionId);

      const session = dataStore.getSyncSession(sessionId);
      expect(session).toBeDefined();
      expect(session.status).toBe('in_progress');
      expect(session.ordersProcessed).toBe(0);
    });

    it('should update sync session progress', () => {
      const sessionId = 'sync-001';
      dataStore.startSyncSession(sessionId);

      dataStore.updateSyncSession(sessionId, {
        ordersProcessed: 10,
        ordersSuccessful: 9,
        ordersFailed: 1,
      });

      const session = dataStore.getSyncSession(sessionId);
      expect(session.ordersProcessed).toBe(10);
      expect(session.ordersSuccessful).toBe(9);
    });

    it('should complete sync session', () => {
      const sessionId = 'sync-001';
      dataStore.startSyncSession(sessionId);
      dataStore.updateSyncSession(sessionId, {
        ordersProcessed: 100,
        ordersSuccessful: 98,
        ordersFailed: 2,
      });

      const completed = dataStore.completeSyncSession(sessionId);
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
    });

    it('should track sync errors', () => {
      const sessionId = 'sync-001';
      dataStore.startSyncSession(sessionId);

      dataStore.updateSyncSession(sessionId, {
        ordersProcessed: 100,
        ordersFailed: 2,
        errors: [
          { orderId: 1, error: 'Invalid email' },
          { orderId: 2, error: 'Missing address' },
        ],
      });

      const session = dataStore.getSyncSession(sessionId);
      expect(session.errors.length).toBe(2);
    });
  });

  // ============================================================================
  // Integration Tests - End-to-End
  // ============================================================================
  describe('End-to-End Integration', () => {
    it('should complete full order creation workflow', () => {
      // 1. Generate quote
      const items = [{ quantity: 100, service: 'screen-print' }];
      const quote = pricingEngine.generateQuote(items);

      dataStore.saveQuote(quote.quoteNumber, quote);

      // 2. Create order from quote
      const order = {
        quoteReference: quote.quoteNumber,
        customer: { name: 'Test Customer', email: 'test@example.com' },
        total: quote.total,
        status: 'quote',
      };

      dataStore.saveOrder('order-001', order);

      // 3. Retrieve and verify
      const savedQuote = dataStore.getQuote(quote.quoteNumber);
      const savedOrder = dataStore.getOrder('order-001');

      expect(savedQuote.quoteNumber).toBe(quote.quoteNumber);
      expect(savedOrder.quoteReference).toBe(quote.quoteNumber);
      expect(savedOrder.total).toBe(quote.total);
    });

    it('should complete full sync workflow', () => {
      const sessionId = 'sync-batch-001';

      // 1. Start sync
      dataStore.startSyncSession(sessionId);

      // 2. Process orders
      const orders = [
        mockPrintavoSuccessResponses.order_100pc_1color_chest,
        mockPrintavoSuccessResponses.order_caps_embroidery_multicolor,
      ];

      const result = transformPrintavoOrdersBatch(orders);

      // 3. Save transformed orders
      for (const order of result.successful) {
        dataStore.saveOrder(order.printavoId, order);
      }

      // 4. Update session
      dataStore.updateSyncSession(sessionId, {
        ordersProcessed: orders.length,
        ordersSuccessful: result.successful.length,
        ordersFailed: result.errors.length,
      });

      // 5. Complete session
      const completed = dataStore.completeSyncSession(sessionId);

      expect(completed.ordersProcessed).toBe(2);
      expect(completed.ordersSuccessful).toBeGreaterThan(0);
      expect(completed.status).toBe('completed');
    });

    it('should validate order data throughout persistence', () => {
      const order = mockPrintavoSuccessResponses.order_100pc_1color_chest;
      const strapiOrder = transformPrintavoToStrapi(order);

      // Validate before saving
      const validation1 = validateStrapiOrder(strapiOrder);
      expect(validation1.isValid).toBe(true);

      // Save
      dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);

      // Retrieve and validate again
      const retrieved = dataStore.getOrder(strapiOrder.printavoId);
      const validation2 = validateStrapiOrder(retrieved);
      expect(validation2.isValid).toBe(true);
    });

    it('should handle multiple concurrent operations', () => {
      // Create multiple quotes
      const quotes = [];
      for (let i = 0; i < 5; i++) {
        const quote = pricingEngine.generateQuote([
          { quantity: 100 + i * 50, service: 'screen-print' },
        ]);
        quotes.push(quote);
        dataStore.saveQuote(quote.quoteNumber, quote);
      }

      // Create multiple orders
      const orders = [
        mockPrintavoSuccessResponses.order_100pc_1color_chest,
        mockPrintavoSuccessResponses.order_caps_embroidery_multicolor,
        mockPrintavoSuccessResponses.order_ready_to_ship,
      ];

      const transformed = [];
      for (const order of orders) {
        const strapiOrder = transformPrintavoToStrapi(order);
        transformed.push(strapiOrder);
        dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);
      }

      // Verify all were saved
      expect(dataStore.getAllQuotes().length).toBe(5);
      expect(dataStore.getAllOrders().length).toBe(3);
    });
  });

  // ============================================================================
  // Error Handling and Edge Cases
  // ============================================================================
  describe('Error Handling and Edge Cases', () => {
    it('should handle empty quote generation', () => {
      const quote = pricingEngine.generateQuote([]);
      expect(quote.total).toBe(0);
    });

    it('should handle retrieve non-existent order', () => {
      const retrieved = dataStore.getOrder('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should handle retrieve non-existent quote', () => {
      const retrieved = dataStore.getQuote('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should handle edge case orders with minimal data', () => {
      const minimalOrder = mockPrintavoEdgeCases.order_minimal_fields;
      const transformed = transformPrintavoToStrapi(minimalOrder);

      dataStore.saveOrder(transformed.printavoId, transformed);
      const retrieved = dataStore.getOrder(transformed.printavoId);

      expect(retrieved).toBeDefined();
      expect(retrieved.printavoId).toBe(transformed.printavoId);
    });

    it('should handle bulk operations performance', () => {
      const start = Date.now();

      // Save 1000 orders
      for (let i = 0; i < 1000; i++) {
        dataStore.saveOrder(`order-${i}`, {
          id: i,
          status: 'quote',
          total: Math.random() * 1000,
        });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should clear all data', () => {
      const order = mockPrintavoSuccessResponses.order_100pc_1color_chest;
      const strapiOrder = transformPrintavoToStrapi(order);

      dataStore.saveOrder(strapiOrder.printavoId, strapiOrder);
      expect(dataStore.getAllOrders().length).toBeGreaterThan(0);

      dataStore.clear();
      expect(dataStore.getAllOrders().length).toBe(0);
    });
  });
});
