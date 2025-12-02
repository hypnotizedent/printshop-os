/**
 * Job Costs API Tests
 * Tests for cost entry, calculations, and retrieval
 */

import request from 'supertest';
import app from '../../index';
import * as db from '../../utils/db';
import * as cache from '../../utils/cache';
import { calculateCostMetrics } from '../job-costs';

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

describe('Job Costs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCache.mockResolvedValue(null);
    mockSetCache.mockResolvedValue();
  });

  describe('calculateCostMetrics', () => {
    it('should calculate supplier cost totals correctly', () => {
      const result = calculateCostMetrics({
        supplierCosts: [
          { supplier: 'S&S', itemName: 'Gildan 5000', quantity: 100, unitCost: 4.50, totalCost: 0 },
          { supplier: 'AS Colour', itemName: 'Staple Tee', quantity: 50, unitCost: 6.00, totalCost: 0 },
        ],
        overheadPercentage: 15,
        revenue: 1500
      });

      expect(result.totalSupplierCost).toBe(750); // (100*4.50) + (50*6.00) = 450 + 300
      expect(result.supplierCosts[0].totalCost).toBe(450);
      expect(result.supplierCosts[1].totalCost).toBe(300);
    });

    it('should calculate labor cost totals correctly', () => {
      const result = calculateCostMetrics({
        laborCosts: [
          { employeeId: '1', hoursWorked: 2, hourlyRate: 25, totalCost: 0, taskType: 'setup' },
          { employeeId: '2', hoursWorked: 4, hourlyRate: 20, totalCost: 0, taskType: 'production' },
        ],
        overheadPercentage: 15,
        revenue: 500
      });

      expect(result.totalLaborCost).toBe(130); // (2*25) + (4*20) = 50 + 80
      expect(result.laborCosts[0].totalCost).toBe(50);
      expect(result.laborCosts[1].totalCost).toBe(80);
    });

    it('should calculate material cost totals correctly', () => {
      const result = calculateCostMetrics({
        materialCosts: {
          inkCost: 25.00,
          threadCost: 15.00,
          screenCost: 50.00,
          vinylCost: 0,
          otherSupplies: 10.00
        },
        overheadPercentage: 15,
        revenue: 500
      });

      expect(result.totalMaterialCost).toBe(100); // 25 + 15 + 50 + 0 + 10
    });

    it('should calculate overhead at 15% of direct costs', () => {
      const result = calculateCostMetrics({
        supplierCosts: [
          { supplier: 'Test', itemName: 'Item', quantity: 10, unitCost: 10, totalCost: 0 }
        ],
        laborCosts: [
          { employeeId: '1', hoursWorked: 2, hourlyRate: 25, totalCost: 0, taskType: 'production' }
        ],
        materialCosts: {
          inkCost: 50,
          threadCost: 0,
          screenCost: 0,
          vinylCost: 0,
          otherSupplies: 0
        },
        overheadPercentage: 15,
        revenue: 500
      });

      // Direct costs: 100 (supplier) + 50 (labor) + 50 (material) = 200
      // Overhead: 200 * 0.15 = 30
      expect(result.overheadCost).toBe(30);
      expect(result.totalCost).toBe(230); // 200 + 30
    });

    it('should calculate profit correctly', () => {
      const result = calculateCostMetrics({
        supplierCosts: [
          { supplier: 'Test', itemName: 'Item', quantity: 10, unitCost: 10, totalCost: 0 }
        ],
        overheadPercentage: 15,
        revenue: 200
      });

      // Total cost: 100 + 15 (overhead) = 115
      // Profit: 200 - 115 = 85
      expect(result.profit).toBe(85);
    });

    it('should calculate profit margin correctly', () => {
      const result = calculateCostMetrics({
        supplierCosts: [
          { supplier: 'Test', itemName: 'Item', quantity: 10, unitCost: 10, totalCost: 0 }
        ],
        overheadPercentage: 15,
        revenue: 200
      });

      // Profit: 85, Revenue: 200
      // Margin: (85/200) * 100 = 42.5%
      expect(result.profitMargin).toBe(42.5);
    });

    it('should handle zero revenue without division by zero', () => {
      const result = calculateCostMetrics({
        supplierCosts: [
          { supplier: 'Test', itemName: 'Item', quantity: 10, unitCost: 10, totalCost: 0 }
        ],
        overheadPercentage: 15,
        revenue: 0
      });

      expect(result.profitMargin).toBe(0);
      expect(result.profit).toBe(-115); // Negative profit
    });

    it('should use default overhead percentage when not provided', () => {
      const result = calculateCostMetrics({
        supplierCosts: [
          { supplier: 'Test', itemName: 'Item', quantity: 100, unitCost: 1, totalCost: 0 }
        ],
        revenue: 200
      });

      expect(result.overheadPercentage).toBe(15);
      expect(result.overheadCost).toBe(15); // 100 * 0.15
    });
  });

  describe('POST /api/jobs/:id/costs', () => {
    it('should create job costs successfully', async () => {
      // Mock job exists
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'job-123' }] } as any) // Job check
        .mockResolvedValueOnce({ rows: [] } as any) // No existing cost
        .mockResolvedValueOnce({ rows: [] } as any); // Insert

      const response = await request(app)
        .post('/api/jobs/job-123/costs')
        .send({
          supplierCosts: [
            { supplier: 'S&S', itemName: 'Gildan 5000', quantity: 100, unitCost: 4.50 }
          ],
          laborCosts: [
            { employeeId: '1', hoursWorked: 2, hourlyRate: 25, taskType: 'setup' }
          ],
          materialCosts: { inkCost: 50, threadCost: 0, screenCost: 0, vinylCost: 0, otherSupplies: 0 },
          revenue: 1000
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobId', 'job-123');
      expect(response.body).toHaveProperty('totalSupplierCost', 450);
      expect(response.body).toHaveProperty('totalLaborCost', 50);
      expect(response.body).toHaveProperty('totalMaterialCost', 50);
      expect(response.body).toHaveProperty('profit');
      expect(response.body).toHaveProperty('profitMargin');
    });

    it('should return 404 for non-existent job', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/jobs/non-existent/costs')
        .send({
          revenue: 1000
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Job not found');
    });

    it('should update existing job costs', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'job-123' }] } as any) // Job check
        .mockResolvedValueOnce({ rows: [{ id: 'cost-1' }] } as any) // Existing cost found
        .mockResolvedValueOnce({ rows: [] } as any); // Update

      const response = await request(app)
        .post('/api/jobs/job-123/costs')
        .send({
          supplierCosts: [
            { supplier: 'S&S', itemName: 'Gildan 5000', quantity: 200, unitCost: 4.00 }
          ],
          revenue: 2000
        });

      expect(response.status).toBe(200);
      expect(response.body.totalSupplierCost).toBe(800);
    });
  });

  describe('GET /api/jobs/:id/costs', () => {
    it('should return job costs when found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          jobId: 'job-123',
          supplierCosts: JSON.stringify([{ supplier: 'S&S', itemName: 'Shirt', quantity: 100, unitCost: 5, totalCost: 500 }]),
          laborCosts: JSON.stringify([]),
          materialCosts: JSON.stringify({ inkCost: 25, threadCost: 0, screenCost: 0, vinylCost: 0, otherSupplies: 0 }),
          overheadPercentage: '15',
          totalSupplierCost: '500',
          totalLaborCost: '0',
          totalMaterialCost: '25',
          overheadCost: '78.75',
          totalCost: '603.75',
          revenue: '1000',
          profit: '396.25',
          profitMargin: '39.63',
          costEnteredAt: '2025-01-15T10:00:00Z'
        }]
      } as any);

      const response = await request(app).get('/api/jobs/job-123/costs');

      expect(response.status).toBe(200);
      expect(response.body.jobId).toBe('job-123');
      expect(response.body.totalSupplierCost).toBe(500);
      expect(response.body.profit).toBe(396.25);
    });

    it('should return 404 when job costs not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/api/jobs/non-existent/costs');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Job costs not found');
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        jobId: 'job-123',
        totalCost: 500,
        profit: 200
      };
      mockGetCache.mockResolvedValueOnce(cachedData);

      const response = await request(app).get('/api/jobs/job-123/costs');

      expect(response.status).toBe(200);
      expect(response.body.cached).toBe(true);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
