/**
 * Customer Segmentation Service
 * 
 * Auto-detects customer segments based on order history patterns.
 * 
 * Segments:
 * - VIP: 4+ orders in last 30 days OR totalSpend >= $10k with orderFrequency >= 2/month
 * - B2B: orderCount >= 3 AND repeatSimilarity >= 0.7 (70% of orders are similar products)
 * - Middleman: avgOrderValue >= $2000 AND orderCount >= 3
 * - B2C: default for all others
 */

export enum CustomerSegment {
  VIP = 'vip',
  B2B = 'b2b',
  MIDDLEMAN = 'middleman',
  B2C = 'b2c',
}

export interface Order {
  id: string;
  totalAmount: number;
  createdAt: string | Date;
  status?: string;
  items?: OrderItem[];
  lineItems?: OrderItem[];
}

export interface OrderItem {
  productType?: string;
  color?: string;
  printMethod?: string;
  quantity?: number;
  description?: string;
  name?: string;
}

export interface ProductSignature {
  productType: string;
  color: string;
  printMethod: string;
  quantityBucket: string;
}

export interface OrderCriteria {
  totalOrders: number;
  ordersLast30Days: number;
  totalSpend: number;
  avgOrderValue: number;
  orderFrequencyPerMonth: number;
  repeatSimilarity: number;
  firstOrderDate: Date | null;
  lastOrderDate: Date | null;
}

export interface SegmentDetails {
  segment: CustomerSegment;
  criteria: OrderCriteria;
  detectedAt: string;
  reason: string;
}

export interface SegmentUpdateResult {
  customerId: string;
  previousSegment: CustomerSegment | null;
  newSegment: CustomerSegment;
  autoDetected: boolean;
  details: SegmentDetails;
}

export interface SegmentDistribution {
  vip: number;
  b2b: number;
  middleman: number;
  b2c: number;
  total: number;
}

// Thresholds for segment detection
const THRESHOLDS = {
  VIP: {
    ORDERS_LAST_30_DAYS: 4,
    TOTAL_SPEND: 10000,
    ORDERS_PER_MONTH: 2,
  },
  B2B: {
    MIN_ORDERS: 3,
    REPEAT_SIMILARITY: 0.7,
  },
  MIDDLEMAN: {
    AVG_ORDER_VALUE: 2000,
    MIN_ORDERS: 3,
  },
};

/**
 * Generate quantity bucket for product signature
 */
function getQuantityBucket(quantity: number | undefined): string {
  if (!quantity) return 'unknown';
  if (quantity <= 12) return 'small';
  if (quantity <= 48) return 'medium';
  if (quantity <= 144) return 'large';
  return 'bulk';
}

/**
 * Extract product signature from order item
 */
function getProductSignature(item: OrderItem): ProductSignature {
  return {
    productType: (item.productType || item.name || item.description || 'unknown').toLowerCase().trim(),
    color: (item.color || 'unknown').toLowerCase().trim(),
    printMethod: (item.printMethod || 'unknown').toLowerCase().trim(),
    quantityBucket: getQuantityBucket(item.quantity),
  };
}

/**
 * Convert product signature to string for comparison
 */
function signatureToString(sig: ProductSignature): string {
  return `${sig.productType}|${sig.color}|${sig.printMethod}|${sig.quantityBucket}`;
}

/**
 * Calculate repeat similarity from orders
 * 
 * Compares product signatures (productType, color, printMethod, quantity bucket)
 * across orders to determine how similar the orders are.
 * 
 * similarity = 1 - (uniqueSignatures / totalSignatures)
 * 
 * A high similarity (close to 1) means the customer orders similar products repeatedly.
 */
export function calculateRepeatSimilarity(orders: Order[]): number {
  if (!orders || orders.length < 2) {
    return 0;
  }

  const allSignatures: string[] = [];

  for (const order of orders) {
    const items = order.items || order.lineItems || [];
    for (const item of items) {
      const sig = getProductSignature(item);
      allSignatures.push(signatureToString(sig));
    }
  }

  if (allSignatures.length === 0) {
    return 0;
  }

  const uniqueSignatures = new Set(allSignatures);
  const totalSignatures = allSignatures.length;
  const uniqueCount = uniqueSignatures.size;

  // similarity = 1 - (uniqueCount / totalCount)
  // If all signatures are the same, uniqueCount = 1, similarity = 1 - (1/n) ≈ 1
  // If all signatures are different, uniqueCount = n, similarity = 1 - (n/n) = 0
  const similarity = 1 - (uniqueCount / totalSignatures);

  return Math.max(0, Math.min(1, similarity));
}

/**
 * Calculate order criteria/statistics for a customer
 */
export function calculateCriteria(orders: Order[]): OrderCriteria {
  if (!orders || orders.length === 0) {
    return {
      totalOrders: 0,
      ordersLast30Days: 0,
      totalSpend: 0,
      avgOrderValue: 0,
      orderFrequencyPerMonth: 0,
      repeatSimilarity: 0,
      firstOrderDate: null,
      lastOrderDate: null,
    };
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const orderDates = orders.map((o) => new Date(o.createdAt)).sort((a, b) => a.getTime() - b.getTime());
  const firstOrderDate = orderDates[0];
  const lastOrderDate = orderDates[orderDates.length - 1];

  // Calculate months since first order
  const monthsSinceFirstOrder = Math.max(
    1,
    (now.getTime() - firstOrderDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );

  // Count orders in last 30 days
  const ordersLast30Days = orders.filter((o) => new Date(o.createdAt) >= thirtyDaysAgo).length;

  // Calculate total spend
  const totalSpend = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Calculate average order value
  const avgOrderValue = orders.length > 0 ? totalSpend / orders.length : 0;

  // Calculate order frequency per month
  const orderFrequencyPerMonth = orders.length / monthsSinceFirstOrder;

  // Calculate repeat similarity
  const repeatSimilarity = calculateRepeatSimilarity(orders);

  return {
    totalOrders: orders.length,
    ordersLast30Days,
    totalSpend,
    avgOrderValue,
    orderFrequencyPerMonth,
    repeatSimilarity,
    firstOrderDate,
    lastOrderDate,
  };
}

/**
 * Detect customer segment based on order criteria
 * 
 * Priority order:
 * 1. VIP - highest priority (most valuable customers)
 * 2. Middleman - high-value resellers
 * 3. B2B - repeat business customers
 * 4. B2C - default consumer segment
 */
export function detectSegment(criteria: OrderCriteria): { segment: CustomerSegment; reason: string } {
  // Check VIP criteria
  // VIP: 4+ orders in last 30 days OR totalSpend >= $10k with orderFrequency >= 2/month
  if (criteria.ordersLast30Days >= THRESHOLDS.VIP.ORDERS_LAST_30_DAYS) {
    return {
      segment: CustomerSegment.VIP,
      reason: `VIP: ${criteria.ordersLast30Days} orders in last 30 days (threshold: ${THRESHOLDS.VIP.ORDERS_LAST_30_DAYS})`,
    };
  }

  if (
    criteria.totalSpend >= THRESHOLDS.VIP.TOTAL_SPEND &&
    criteria.orderFrequencyPerMonth >= THRESHOLDS.VIP.ORDERS_PER_MONTH
  ) {
    return {
      segment: CustomerSegment.VIP,
      reason: `VIP: $${criteria.totalSpend.toFixed(2)} total spend with ${criteria.orderFrequencyPerMonth.toFixed(1)} orders/month`,
    };
  }

  // Check Middleman criteria
  // Middleman: avgOrderValue >= $2000 AND orderCount >= 3
  if (
    criteria.avgOrderValue >= THRESHOLDS.MIDDLEMAN.AVG_ORDER_VALUE &&
    criteria.totalOrders >= THRESHOLDS.MIDDLEMAN.MIN_ORDERS
  ) {
    return {
      segment: CustomerSegment.MIDDLEMAN,
      reason: `Middleman: $${criteria.avgOrderValue.toFixed(2)} avg order value with ${criteria.totalOrders} orders`,
    };
  }

  // Check B2B criteria
  // B2B: orderCount >= 3 AND repeatSimilarity >= 0.7
  if (
    criteria.totalOrders >= THRESHOLDS.B2B.MIN_ORDERS &&
    criteria.repeatSimilarity >= THRESHOLDS.B2B.REPEAT_SIMILARITY
  ) {
    return {
      segment: CustomerSegment.B2B,
      reason: `B2B: ${criteria.totalOrders} orders with ${(criteria.repeatSimilarity * 100).toFixed(0)}% repeat similarity`,
    };
  }

  // Default to B2C
  return {
    segment: CustomerSegment.B2C,
    reason: 'B2C: Default consumer segment',
  };
}

/**
 * Customer Segmentation Service class
 * 
 * Provides methods to detect and update customer segments based on order history.
 */
export class CustomerSegmentationService {
  private strapiBaseUrl: string;

  constructor(strapiBaseUrl?: string) {
    this.strapiBaseUrl = strapiBaseUrl || process.env.STRAPI_URL || 'http://localhost:1337';
  }

  /**
   * Fetch customer orders from Strapi
   */
  async fetchCustomerOrders(customerId: string): Promise<Order[]> {
    try {
      const response = await fetch(
        `${this.strapiBaseUrl}/api/orders?filters[customer][documentId][$eq]=${customerId}&sort=createdAt:desc&pagination[limit]=1000`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json() as { data?: any[] };
      return (data.data || []).map((o: any) => ({
        id: o.documentId || o.id,
        totalAmount: o.totalAmount || 0,
        createdAt: o.createdAt,
        status: o.status,
        items: o.items || [],
        lineItems: o.lineItems || [],
      }));
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }
  }

  /**
   * Fetch customer from Strapi
   */
  async fetchCustomer(customerId: string): Promise<any> {
    try {
      const response = await fetch(`${this.strapiBaseUrl}/api/customers/${customerId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch customer: ${response.status}`);
      }

      const data = await response.json() as { data?: any };
      return data.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  /**
   * Get segment details for a customer
   */
  async getSegment(customerId: string): Promise<SegmentDetails | null> {
    try {
      const customer = await this.fetchCustomer(customerId);

      if (!customer.segment) {
        return null;
      }

      return {
        segment: customer.segment as CustomerSegment,
        criteria: customer.segmentDetails?.criteria || {},
        detectedAt: customer.lastSegmentUpdate || new Date().toISOString(),
        reason: customer.segmentDetails?.reason || 'Unknown',
      };
    } catch (error) {
      console.error('Error getting customer segment:', error);
      throw error;
    }
  }

  /**
   * Detect and optionally update customer segment
   */
  async detectAndUpdateSegment(customerId: string, autoUpdate: boolean = true): Promise<SegmentUpdateResult> {
    try {
      // Fetch current customer
      const customer = await this.fetchCustomer(customerId);
      const previousSegment = customer.segment as CustomerSegment | null;

      // Fetch customer orders
      const orders = await this.fetchCustomerOrders(customerId);

      // Calculate criteria
      const criteria = calculateCriteria(orders);

      // Detect segment
      const { segment, reason } = detectSegment(criteria);

      const details: SegmentDetails = {
        segment,
        criteria,
        detectedAt: new Date().toISOString(),
        reason,
      };

      // Update if requested and segment changed
      if (autoUpdate) {
        await this.updateSegment(customerId, segment, details, true);
      }

      return {
        customerId,
        previousSegment,
        newSegment: segment,
        autoDetected: true,
        details,
      };
    } catch (error) {
      console.error('Error detecting customer segment:', error);
      throw error;
    }
  }

  /**
   * Update customer segment in Strapi
   */
  async updateSegment(
    customerId: string,
    segment: CustomerSegment,
    details: SegmentDetails,
    autoDetected: boolean = true
  ): Promise<void> {
    try {
      const response = await fetch(`${this.strapiBaseUrl}/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            segment,
            segmentAutoDetected: autoDetected,
            segmentDetails: details,
            lastSegmentUpdate: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update customer segment: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating customer segment:', error);
      throw error;
    }
  }

  /**
   * Manually override customer segment
   */
  async overrideSegment(customerId: string, segment: CustomerSegment): Promise<SegmentUpdateResult> {
    try {
      const customer = await this.fetchCustomer(customerId);
      const previousSegment = customer.segment as CustomerSegment | null;

      const details: SegmentDetails = {
        segment,
        criteria: customer.segmentDetails?.criteria || {},
        detectedAt: new Date().toISOString(),
        reason: 'Manual override',
      };

      await this.updateSegment(customerId, segment, details, false);

      return {
        customerId,
        previousSegment,
        newSegment: segment,
        autoDetected: false,
        details,
      };
    } catch (error) {
      console.error('Error overriding customer segment:', error);
      throw error;
    }
  }

  /**
   * Get segment distribution across all customers
   */
  async getSegmentDistribution(): Promise<SegmentDistribution> {
    try {
      const response = await fetch(
        `${this.strapiBaseUrl}/api/customers?pagination[limit]=10000&fields[0]=segment`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }

      const data = await response.json() as { data?: any[] };
      const customers = data.data || [];

      const distribution: SegmentDistribution = {
        vip: 0,
        b2b: 0,
        middleman: 0,
        b2c: 0,
        total: customers.length,
      };

      for (const customer of customers) {
        const segment = (customer.segment as CustomerSegment) || CustomerSegment.B2C;
        distribution[segment]++;
      }

      return distribution;
    } catch (error) {
      console.error('Error getting segment distribution:', error);
      throw error;
    }
  }
}

export default CustomerSegmentationService;
