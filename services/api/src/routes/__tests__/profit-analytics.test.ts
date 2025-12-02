/**
 * Profit Analytics API Tests
 * Tests for profit overview, product/department breakdowns, and job profit analysis
 */

import request from 'supertest';
import app from '../../index';
import * as db from '../../utils/db';
import * as cache from '../../utils/cache';

// Mock database and cache
jest.mock('../../utils/db');
jest.mock('../../utils/cache', () => ({
  ...jest.requireActual('../../utils/cache'),
  getCache: jest.fn(),
  setCache: jest.fn(),
  generateCacheKey: jest.fn((...args) => JSON.stringify(args)),
}));

const mockQuery = db.query as jest.MockedFunction<typeof db.query>;
const mockGetCache = cache.getCache as jest.MockedFunction<typeof cache.getCache>;
const mockSetCache = cache.setCache as jest.MockedFunction<typeof cache.setCache>;

describe('Profit Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCache.mockResolvedValue(null);
    mockSetCache.mockResolvedValue();
  });

  describe('GET /api/analytics/profit/overview', () => {
    it('should return profit overview metrics', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            total_revenue: '50000',
            total_cost: '35000',
            total_profit: '15000',
            avg_margin: '30',
            job_count: '25',
            profitable_jobs: '22',
            unprofitable_jobs: '3'
          }]
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { period: new Date('2025-01-01'), profit: '5000', margin: '28' },
            { period: new Date('2024-12-01'), profit: '4500', margin: '32' }
          ]
        } as any);

      const response = await request(app).get('/api/analytics/profit/overview');

      expect(response.status).toBe(200);
      expect(response.body.totalRevenue).toBe(50000);
      expect(response.body.totalCost).toBe(35000);
      expect(response.body.totalProfit).toBe(15000);
      expect(response.body.averageProfitMargin).toBe(30);
      expect(response.body.jobCount).toBe(25);
      expect(response.body.profitableJobs).toBe(22);
      expect(response.body.unprofitableJobs).toBe(3);
      expect(response.body.profitTrend).toHaveLength(2);
    });

    it('should support date range filtering', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: '10000', total_cost: '7000', total_profit: '3000', avg_margin: '30', job_count: '10', profitable_jobs: '8', unprofitable_jobs: '2' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/analytics/profit/overview')
        .query({ start_date: '2025-01-01', end_date: '2025-01-31' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('BETWEEN'),
        expect.arrayContaining([expect.any(String), expect.any(String)])
      );
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        totalRevenue: 50000,
        totalProfit: 15000,
        profitTrend: []
      };
      mockGetCache.mockResolvedValueOnce(cachedData);

      const response = await request(app).get('/api/analytics/profit/overview');

      expect(response.status).toBe(200);
      expect(response.body.cached).toBe(true);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/api/analytics/profit/overview');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch profit overview');
    });
  });

  describe('GET /api/analytics/profit/by-product', () => {
    it('should return profit by product type', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { product_type: 'Screen Printing', revenue: '30000', cost: '18000', profit: '12000', profit_margin: '40', job_count: '15' },
          { product_type: 'Embroidery', revenue: '15000', cost: '10000', profit: '5000', profit_margin: '33.33', job_count: '8' }
        ]
      } as any);

      const response = await request(app).get('/api/analytics/profit/by-product');

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.products[0].productType).toBe('Screen Printing');
      expect(response.body.products[0].profit).toBe(12000);
      expect(response.body.products[1].productType).toBe('Embroidery');
    });

    it('should handle empty product data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/api/analytics/profit/by-product');

      expect(response.status).toBe(200);
      expect(response.body.products).toEqual([]);
    });
  });

  describe('GET /api/analytics/profit/by-department', () => {
    it('should return profit by department', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { department: 'screen-printing', revenue: '40000', cost: '25000', profit: '15000', profit_margin: '37.5', labor_cost: '8000', job_count: '20' },
          { department: 'embroidery', revenue: '20000', cost: '14000', profit: '6000', profit_margin: '30', labor_cost: '5000', job_count: '10' }
        ]
      } as any);

      const response = await request(app).get('/api/analytics/profit/by-department');

      expect(response.status).toBe(200);
      expect(response.body.departments).toHaveLength(2);
      expect(response.body.departments[0].department).toBe('screen-printing');
      expect(response.body.departments[0].laborCost).toBe(8000);
    });
  });

  describe('GET /api/analytics/profit/loss-leaders', () => {
    it('should return jobs with negative profit', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { job_id: 'job-1', job_number: 'JOB-001', customer_name: 'Customer A', revenue: '500', total_cost: '700', profit: '-200', profit_margin: '-40', completed_at: '2025-01-15' },
          { job_id: 'job-2', job_number: 'JOB-002', customer_name: 'Customer B', revenue: '300', total_cost: '400', profit: '-100', profit_margin: '-33.33', completed_at: '2025-01-10' }
        ]
      } as any);

      const response = await request(app).get('/api/analytics/profit/loss-leaders');

      expect(response.status).toBe(200);
      expect(response.body.lossLeaders).toHaveLength(2);
      expect(response.body.lossLeaders[0].profit).toBe(-200);
      expect(response.body.lossLeaders[1].profit).toBe(-100);
      expect(response.body.totalLoss).toBe(-300);
      expect(response.body.count).toBe(2);
    });

    it('should respect limit parameter', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { job_id: 'job-1', job_number: 'JOB-001', customer_name: 'Customer A', revenue: '500', total_cost: '700', profit: '-200', profit_margin: '-40' }
        ]
      } as any);

      const response = await request(app)
        .get('/api/analytics/profit/loss-leaders')
        .query({ limit: '5' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([5])
      );
    });

    it('should return empty array when no loss leaders', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/api/analytics/profit/loss-leaders');

      expect(response.status).toBe(200);
      expect(response.body.lossLeaders).toEqual([]);
      expect(response.body.totalLoss).toBe(0);
    });
  });

  describe('GET /api/analytics/profit/most-profitable', () => {
    it('should return most profitable jobs', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { job_id: 'job-1', job_number: 'JOB-100', customer_name: 'Big Corp', revenue: '10000', total_cost: '5000', profit: '5000', profit_margin: '50', completed_at: '2025-01-20' },
          { job_id: 'job-2', job_number: 'JOB-101', customer_name: 'Another Corp', revenue: '8000', total_cost: '5000', profit: '3000', profit_margin: '37.5', completed_at: '2025-01-18' }
        ]
      } as any);

      const response = await request(app).get('/api/analytics/profit/most-profitable');

      expect(response.status).toBe(200);
      expect(response.body.mostProfitable).toHaveLength(2);
      expect(response.body.mostProfitable[0].profit).toBe(5000);
      expect(response.body.mostProfitable[0].profitMargin).toBe(50);
      expect(response.body.totalProfit).toBe(8000);
      expect(response.body.count).toBe(2);
    });

    it('should support date range filtering', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/analytics/profit/most-profitable')
        .query({ start_date: '2025-01-01', end_date: '2025-12-31' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('profit > 0'),
        expect.arrayContaining([expect.any(String), expect.any(String), expect.any(Number)])
      );
    });
  });

  describe('Analytics API Root', () => {
    it('should include profit endpoint in analytics root', async () => {
      const response = await request(app).get('/api/analytics');

      expect(response.status).toBe(200);
      expect(response.body.endpoints).toHaveProperty('profit', '/api/analytics/profit');
    });
  });
});
