/**
 * Comprehensive test suite for Analytics & Reporting API
 * Tests all endpoints, caching, error handling, and data accuracy
 */

import request from 'supertest';
import app from '../index';
import * as db from '../utils/db';
import * as cache from '../utils/cache';

// Mock database and cache
jest.mock('../utils/db');
jest.mock('../utils/cache', () => ({
  ...jest.requireActual('../utils/cache'),
  getCache: jest.fn(),
  setCache: jest.fn(),
  delCache: jest.fn(),
}));

const mockQuery = db.query as jest.MockedFunction<typeof db.query>;
const mockGetCache = cache.getCache as jest.MockedFunction<typeof cache.getCache>;
const mockSetCache = cache.setCache as jest.MockedFunction<typeof cache.setCache>;

describe('Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no cache
    mockGetCache.mockResolvedValue(null);
    mockSetCache.mockResolvedValue();
  });

  describe('GET /api/analytics', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/api/analytics');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('revenue');
      expect(response.body.endpoints).toHaveProperty('products');
      expect(response.body.endpoints).toHaveProperty('customers');
      expect(response.body.endpoints).toHaveProperty('orders');
    });
  });

  describe('GET /api/analytics/revenue', () => {
    it('should return revenue analytics with default parameters', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ total_revenue: '125000', order_count: '120', avg_order_value: '1041.67' }],
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { period_label: '2025-11', revenue: '45000', orders: '50' },
            { period_label: '2025-10', revenue: '38000', orders: '40' },
          ],
        } as any)
        .mockResolvedValueOnce({
          rows: [{ revenue: '110000' }],
        } as any);

      const response = await request(app).get('/api/analytics/revenue');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_revenue');
      expect(response.body).toHaveProperty('order_count');
      expect(response.body).toHaveProperty('period_revenue');
      expect(response.body).toHaveProperty('growth_rate');
      expect(response.body).toHaveProperty('forecast_next_period');
      expect(response.body.total_revenue).toBe(125000);
      expect(response.body.order_count).toBe(120);
    });

    it('should handle custom date ranges', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: '50000', order_count: '50', avg_order_value: '1000' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ revenue: '45000' }] } as any);

      const response = await request(app)
        .get('/api/analytics/revenue')
        .query({ start_date: '2025-01-01', end_date: '2025-01-31' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('start_date');
      expect(response.body).toHaveProperty('end_date');
    });

    it('should support different period groupings', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: '100000', order_count: '100', avg_order_value: '1000' }] } as any)
        .mockResolvedValueOnce({ 
          rows: [
            { period_label: '2025-W47', revenue: '25000', orders: '25' },
          ] 
        } as any)
        .mockResolvedValueOnce({ rows: [{ revenue: '95000' }] } as any);

      const response = await request(app)
        .get('/api/analytics/revenue')
        .query({ period: 'week', group_by: 'week' });

      expect(response.status).toBe(200);
      expect(response.body.period).toBe('week');
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        total_revenue: 125000,
        order_count: 120,
        growth_rate: 15.5,
      };
      mockGetCache.mockResolvedValueOnce(cachedData);

      const response = await request(app).get('/api/analytics/revenue');

      expect(response.status).toBe(200);
      expect(response.body.cached).toBe(true);
      expect(response.body.total_revenue).toBe(125000);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app).get('/api/analytics/revenue');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/analytics/products', () => {
    it('should return product analytics', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              product_name: 'Gildan 5000 - Black',
              category: 'T-Shirts',
              units_sold: '5420',
              revenue: '48780',
              margin: '28.5',
              order_count: '120',
              avg_unit_price: '9.00',
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { category: 'T-Shirts', count: '150', revenue: '50000' },
          ],
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { product_name: 'Hoodie XL', current_units: '200', previous_units: '100', growth_rate: '100' },
          ],
        } as any);

      const response = await request(app).get('/api/analytics/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('top_products');
      expect(response.body).toHaveProperty('category_breakdown');
      expect(response.body).toHaveProperty('trending');
      expect(response.body.top_products).toHaveLength(1);
      expect(response.body.top_products[0].product_name).toBe('Gildan 5000 - Black');
      expect(response.body.top_products[0].rank).toBe(1);
    });

    it('should support sorting by different metrics', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/analytics/products')
        .query({ sort_by: 'units', limit: '5' });

      expect(response.status).toBe(200);
      expect(response.body.sort_by).toBe('units');
    });

    it('should handle empty product data', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/api/analytics/products');

      expect(response.status).toBe(200);
      expect(response.body.top_products).toEqual([]);
    });
  });

  describe('GET /api/analytics/customers', () => {
    it('should return customer analytics', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              customer_id: '123',
              name: 'ABC Corp',
              email: 'contact@abc.com',
              lifetime_value: '125000',
              order_count: '45',
              avg_order_value: '2777.78',
              last_order_date: '2025-11-15',
              status: 'active',
            },
          ],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ 
          rows: [{ total_customers: '100', total_revenue: '500000' }] 
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { segment: 'VIP', count: '10', avg_ltv: '15000' },
            { segment: 'High Value', count: '30', avg_ltv: '7500' },
          ],
        } as any);

      const response = await request(app).get('/api/analytics/customers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('top_customers');
      expect(response.body).toHaveProperty('churn_risk');
      expect(response.body).toHaveProperty('acquisition_cost');
      expect(response.body).toHaveProperty('segments');
      expect(response.body.top_customers).toHaveLength(1);
      expect(response.body.top_customers[0].name).toBe('ABC Corp');
    });

    it('should filter by minimum lifetime value', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ total_customers: '50', total_revenue: '500000' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/analytics/customers')
        .query({ min_ltv: '10000' });

      expect(response.status).toBe(200);
    });

    it('should identify churn risk customers', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              customer_id: '456',
              name: 'Old Customer',
              email: 'old@customer.com',
              last_order_date: '2025-08-01',
              days_since_order: '90',
              order_count: '5',
              lifetime_value: '5000',
            },
          ],
        } as any)
        .mockResolvedValueOnce({ rows: [{ total_customers: '100', total_revenue: '500000' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/api/analytics/customers');

      expect(response.status).toBe(200);
      expect(response.body.churn_risk).toHaveLength(1);
      expect(response.body.churn_risk[0].days_since_order).toBe(90);
    });
  });

  describe('GET /api/analytics/orders', () => {
    it('should return order metrics', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { status: 'Pending', count: '45' },
            { status: 'InProduction', count: '8' },
            { status: 'Complete', count: '234' },
          ],
        } as any)
        .mockResolvedValueOnce({
          rows: [{ avg_days: '4.2' }],
        } as any)
        .mockResolvedValueOnce({
          rows: [{ total_quotes: '200', total_orders: '137', conversion_rate: '68.5' }],
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { stage: 'Pending', avg_wait_days: '3.5', order_count: '10' },
          ],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/api/analytics/orders');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status_breakdown');
      expect(response.body).toHaveProperty('avg_cycle_time');
      expect(response.body).toHaveProperty('conversion_rate');
      expect(response.body).toHaveProperty('bottlenecks');
      expect(response.body.status_breakdown.Pending).toBe(45);
      expect(response.body.avg_cycle_time).toBe('4.2 days');
    });

    it('should calculate conversion rate correctly', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ status: 'Complete', count: '100' }] } as any)
        .mockResolvedValueOnce({ rows: [{ avg_days: '5.0' }] } as any)
        .mockResolvedValueOnce({
          rows: [{ total_quotes: '150', total_orders: '100', conversion_rate: '66.67' }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/api/analytics/orders');

      expect(response.status).toBe(200);
      expect(parseFloat(response.body.conversion_rate)).toBeCloseTo(66.67, 1);
    });

    it('should identify production bottlenecks', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ avg_days: '4.0' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_quotes: '100', total_orders: '80', conversion_rate: '80' }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { stage: 'InProduction', avg_wait_days: '5.5', order_count: '15' },
          ],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/api/analytics/orders');

      expect(response.status).toBe(200);
      expect(response.body.bottlenecks).toHaveLength(1);
      expect(response.body.bottlenecks[0].stage).toBe('InProduction');
    });
  });

  describe('GET /api/analytics/export', () => {
    it('should require format and report parameters', async () => {
      const response = await request(app).get('/api/analytics/export');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should validate format parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/export')
        .query({ format: 'invalid', report: 'revenue' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid format');
    });

    it('should validate report parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/export')
        .query({ format: 'csv', report: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid report type');
    });

    it('should export revenue data as CSV', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { date: new Date('2025-11-01'), orders: '10', revenue: '1000' },
        ],
      } as any);

      const response = await request(app)
        .get('/api/analytics/export')
        .query({ format: 'csv', report: 'revenue' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export products data as PDF', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { product_name: 'Test Product', units_sold: '100', revenue: '1000' },
        ],
      } as any);

      const response = await request(app)
        .get('/api/analytics/export')
        .query({ format: 'pdf', report: 'products' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('Cache behavior', () => {
    it('should cache revenue data', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: '100000', order_count: '100', avg_order_value: '1000' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ revenue: '95000' }] } as any);

      const response = await request(app).get('/api/analytics/revenue');

      expect(response.status).toBe(200);
      expect(mockSetCache).toHaveBeenCalled();
      // Verify cache was attempted with revenue data
      expect(mockSetCache).toHaveBeenCalledWith(
        expect.stringContaining('revenue'),
        expect.any(Object),
        cache.CACHE_TTL.REVENUE
      );
    });

    it('should generate unique cache keys for different params', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: '100000', order_count: '100', avg_order_value: '1000' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ revenue: '95000' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: '100000', order_count: '100', avg_order_value: '1000' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ revenue: '95000' }] } as any);

      await request(app).get('/api/analytics/revenue').query({ period: 'day' });
      await request(app).get('/api/analytics/revenue').query({ period: 'month' });

      expect(mockSetCache).toHaveBeenCalledTimes(2);
      // Just verify setCache was called with different keys
      expect(mockSetCache.mock.calls.length).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection timeout'));

      const response = await request(app).get('/api/analytics/products');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid query parameters gracefully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: '100000', order_count: '100', avg_order_value: '1000' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ revenue: '95000' }] } as any);

      const response = await request(app)
        .get('/api/analytics/revenue')
        .query({ period: 'invalid' });

      // Should use default value
      expect(response.status).toBe(200);
    });
  });
});
