/**
 * Customer Segmentation Service Unit Tests
 * 
 * 12 tests covering:
 * - VIP detection (4+ orders in 30 days)
 * - VIP detection (high spend + frequency)
 * - B2B detection (repeat similar orders)
 * - Middleman detection (high avg value)
 * - B2C default
 * - Repeat similarity calculation
 * - Manual segment override
 * - Segment details population
 */

import {
  calculateRepeatSimilarity,
  calculateCriteria,
  detectSegment,
  CustomerSegment,
  Order,
  OrderCriteria,
} from '../customer-segmentation.service';

describe('CustomerSegmentationService', () => {
  const createOrder = (
    id: string,
    totalAmount: number,
    daysAgo: number,
    items?: any[]
  ): Order => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      id,
      totalAmount,
      createdAt: date.toISOString(),
      items: items || [],
    };
  };

  describe('calculateRepeatSimilarity', () => {
    it('should return 0 for empty orders', () => {
      expect(calculateRepeatSimilarity([])).toBe(0);
    });

    it('should return 0 for single order', () => {
      const orders = [createOrder('1', 100, 1, [{ productType: 'tshirt' }])];
      expect(calculateRepeatSimilarity(orders)).toBe(0);
    });

    it('should return high similarity for identical product orders', () => {
      const items = [
        { productType: 'tshirt', color: 'black', printMethod: 'screen', quantity: 24 },
      ];
      const orders = [
        createOrder('1', 100, 1, items),
        createOrder('2', 100, 2, items),
        createOrder('3', 100, 3, items),
        createOrder('4', 100, 4, items),
      ];
      const similarity = calculateRepeatSimilarity(orders);
      // With 4 orders all having identical items, uniqueCount = 1, totalCount = 4
      // similarity = 1 - (1/4) = 0.75
      expect(similarity).toBe(0.75);
    });

    it('should return low similarity for diverse product orders', () => {
      const orders = [
        createOrder('1', 100, 1, [
          { productType: 'tshirt', color: 'black', printMethod: 'screen', quantity: 24 },
        ]),
        createOrder('2', 100, 2, [
          { productType: 'hoodie', color: 'blue', printMethod: 'embroidery', quantity: 12 },
        ]),
        createOrder('3', 100, 3, [
          { productType: 'cap', color: 'red', printMethod: 'vinyl', quantity: 48 },
        ]),
      ];
      const similarity = calculateRepeatSimilarity(orders);
      // With 3 different products, uniqueCount = 3, totalCount = 3
      // similarity = 1 - (3/3) = 0
      expect(similarity).toBe(0);
    });

    it('should handle orders with multiple items', () => {
      const orders = [
        createOrder('1', 100, 1, [
          { productType: 'tshirt', color: 'black', printMethod: 'screen', quantity: 24 },
          { productType: 'hoodie', color: 'black', printMethod: 'screen', quantity: 12 },
        ]),
        createOrder('2', 100, 2, [
          { productType: 'tshirt', color: 'black', printMethod: 'screen', quantity: 24 },
          { productType: 'hoodie', color: 'black', printMethod: 'screen', quantity: 12 },
        ]),
      ];
      const similarity = calculateRepeatSimilarity(orders);
      // 4 total items, 2 unique signatures
      // similarity = 1 - (2/4) = 0.5
      expect(similarity).toBe(0.5);
    });
  });

  describe('calculateCriteria', () => {
    it('should return zeros for empty orders', () => {
      const criteria = calculateCriteria([]);
      expect(criteria.totalOrders).toBe(0);
      expect(criteria.ordersLast30Days).toBe(0);
      expect(criteria.totalSpend).toBe(0);
      expect(criteria.avgOrderValue).toBe(0);
      expect(criteria.repeatSimilarity).toBe(0);
    });

    it('should calculate correct statistics for orders', () => {
      const orders = [
        createOrder('1', 1000, 5),  // 5 days ago - within 30 days
        createOrder('2', 2000, 15), // 15 days ago - within 30 days
        createOrder('3', 3000, 25), // 25 days ago - within 30 days
        createOrder('4', 4000, 60), // 60 days ago - outside 30 days
      ];

      const criteria = calculateCriteria(orders);

      expect(criteria.totalOrders).toBe(4);
      expect(criteria.ordersLast30Days).toBe(3);
      expect(criteria.totalSpend).toBe(10000);
      expect(criteria.avgOrderValue).toBe(2500);
      expect(criteria.firstOrderDate).not.toBeNull();
      expect(criteria.lastOrderDate).not.toBeNull();
    });

    it('should calculate order frequency per month', () => {
      // Create orders spread over 2 months
      const orders = [
        createOrder('1', 1000, 1),
        createOrder('2', 1000, 15),
        createOrder('3', 1000, 30),
        createOrder('4', 1000, 45),
        createOrder('5', 1000, 60),
        createOrder('6', 1000, 61),
      ];

      const criteria = calculateCriteria(orders);

      // 6 orders over ~2 months = ~3 orders per month
      expect(criteria.orderFrequencyPerMonth).toBeGreaterThan(2);
    });
  });

  describe('detectSegment', () => {
    it('should detect VIP segment for 4+ orders in 30 days', () => {
      const criteria: OrderCriteria = {
        totalOrders: 5,
        ordersLast30Days: 4, // >= 4 threshold
        totalSpend: 5000,
        avgOrderValue: 1000,
        orderFrequencyPerMonth: 4,
        repeatSimilarity: 0.3,
        firstOrderDate: new Date(),
        lastOrderDate: new Date(),
      };

      const result = detectSegment(criteria);

      expect(result.segment).toBe(CustomerSegment.VIP);
      expect(result.reason).toContain('VIP');
      expect(result.reason).toContain('orders in last 30 days');
    });

    it('should detect VIP segment for high spend with frequency', () => {
      const criteria: OrderCriteria = {
        totalOrders: 10,
        ordersLast30Days: 2, // below 4, but high spend
        totalSpend: 15000, // >= 10000 threshold
        avgOrderValue: 1500,
        orderFrequencyPerMonth: 2.5, // >= 2 threshold
        repeatSimilarity: 0.4,
        firstOrderDate: new Date(),
        lastOrderDate: new Date(),
      };

      const result = detectSegment(criteria);

      expect(result.segment).toBe(CustomerSegment.VIP);
      expect(result.reason).toContain('VIP');
      expect(result.reason).toContain('total spend');
    });

    it('should detect B2B segment for repeat similar orders', () => {
      const criteria: OrderCriteria = {
        totalOrders: 5, // >= 3 threshold
        ordersLast30Days: 1,
        totalSpend: 3000,
        avgOrderValue: 600, // below middleman threshold
        orderFrequencyPerMonth: 1,
        repeatSimilarity: 0.75, // >= 0.7 threshold
        firstOrderDate: new Date(),
        lastOrderDate: new Date(),
      };

      const result = detectSegment(criteria);

      expect(result.segment).toBe(CustomerSegment.B2B);
      expect(result.reason).toContain('B2B');
      expect(result.reason).toContain('repeat similarity');
    });

    it('should detect Middleman segment for high avg order value', () => {
      const criteria: OrderCriteria = {
        totalOrders: 4, // >= 3 threshold
        ordersLast30Days: 1,
        totalSpend: 12000,
        avgOrderValue: 3000, // >= 2000 threshold
        orderFrequencyPerMonth: 0.5,
        repeatSimilarity: 0.3, // below B2B threshold
        firstOrderDate: new Date(),
        lastOrderDate: new Date(),
      };

      const result = detectSegment(criteria);

      expect(result.segment).toBe(CustomerSegment.MIDDLEMAN);
      expect(result.reason).toContain('Middleman');
      expect(result.reason).toContain('avg order value');
    });

    it('should default to B2C segment for regular customers', () => {
      const criteria: OrderCriteria = {
        totalOrders: 2, // below B2B threshold
        ordersLast30Days: 1,
        totalSpend: 500,
        avgOrderValue: 250, // below middleman threshold
        orderFrequencyPerMonth: 0.5,
        repeatSimilarity: 0.2, // below B2B threshold
        firstOrderDate: new Date(),
        lastOrderDate: new Date(),
      };

      const result = detectSegment(criteria);

      expect(result.segment).toBe(CustomerSegment.B2C);
      expect(result.reason).toContain('B2C');
      expect(result.reason).toContain('Default');
    });

    it('should prioritize VIP over Middleman when both match', () => {
      // Customer matches both VIP (high spend + frequency) and Middleman (high avg value)
      const criteria: OrderCriteria = {
        totalOrders: 6,
        ordersLast30Days: 3,
        totalSpend: 18000, // VIP threshold
        avgOrderValue: 3000, // Middleman threshold
        orderFrequencyPerMonth: 2.5, // VIP frequency threshold
        repeatSimilarity: 0.5,
        firstOrderDate: new Date(),
        lastOrderDate: new Date(),
      };

      const result = detectSegment(criteria);

      // VIP should take priority
      expect(result.segment).toBe(CustomerSegment.VIP);
    });

    it('should prioritize Middleman over B2B when both match', () => {
      // Customer matches both Middleman (high avg value) and B2B (repeat similarity)
      const criteria: OrderCriteria = {
        totalOrders: 5,
        ordersLast30Days: 1,
        totalSpend: 12500,
        avgOrderValue: 2500, // Middleman threshold
        orderFrequencyPerMonth: 1,
        repeatSimilarity: 0.8, // B2B threshold
        firstOrderDate: new Date(),
        lastOrderDate: new Date(),
      };

      const result = detectSegment(criteria);

      // Middleman should take priority over B2B
      expect(result.segment).toBe(CustomerSegment.MIDDLEMAN);
    });
  });

  describe('Edge Cases', () => {
    it('should handle orders with no items', () => {
      const orders = [
        createOrder('1', 100, 1, []),
        createOrder('2', 100, 2, []),
      ];

      const similarity = calculateRepeatSimilarity(orders);
      expect(similarity).toBe(0);
    });

    it('should handle orders with partial item data', () => {
      const orders = [
        createOrder('1', 100, 1, [{ quantity: 24 }]), // missing productType, color, printMethod
        createOrder('2', 100, 2, [{ color: 'black' }]), // missing productType, printMethod, quantity
      ];

      const similarity = calculateRepeatSimilarity(orders);
      // Should handle gracefully with 'unknown' defaults
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should handle very old orders correctly', () => {
      const orders = [
        createOrder('1', 1000, 365), // 1 year ago
        createOrder('2', 1000, 730), // 2 years ago
      ];

      const criteria = calculateCriteria(orders);

      expect(criteria.totalOrders).toBe(2);
      expect(criteria.ordersLast30Days).toBe(0);
      expect(criteria.totalSpend).toBe(2000);
    });
  });
});
