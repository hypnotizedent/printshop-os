/**
 * Job Costs API Routes
 * POST/GET /api/jobs/:id/costs
 * Handles cost entry and retrieval for jobs
 */

import { Router, Request, Response } from 'express';
import { query } from '../utils/db';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../utils/cache';

const router = Router();

// Types for cost data
interface SupplierCost {
  supplier: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  invoiceNumber?: string;
}

interface LaborCost {
  employeeId: string;
  employeeName?: string;
  hoursWorked: number;
  hourlyRate: number;
  totalCost: number;
  taskType: 'setup' | 'production' | 'cleanup' | 'rework';
  notes?: string;
}

interface MaterialCost {
  inkCost: number;
  threadCost: number;
  screenCost: number;
  vinylCost: number;
  otherSupplies: number;
  notes?: string;
}

interface JobCostRequest {
  supplierCosts?: SupplierCost[];
  laborCosts?: LaborCost[];
  materialCosts?: MaterialCost;
  overheadPercentage?: number;
  revenue?: number;
}

interface JobCostResponse {
  jobId: string;
  supplierCosts: SupplierCost[];
  laborCosts: LaborCost[];
  materialCosts: MaterialCost;
  overheadPercentage: number;
  totalSupplierCost: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  overheadCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  costEnteredAt?: string;
}

/**
 * Calculate total costs and profit metrics
 */
function calculateCostMetrics(data: JobCostRequest): Omit<JobCostResponse, 'jobId' | 'costEnteredAt'> {
  const supplierCosts = data.supplierCosts || [];
  const laborCosts = data.laborCosts || [];
  const materialCosts = data.materialCosts || {
    inkCost: 0,
    threadCost: 0,
    screenCost: 0,
    vinylCost: 0,
    otherSupplies: 0
  };
  const overheadPercentage = data.overheadPercentage ?? 15.0;
  const revenue = data.revenue ?? 0;

  // Calculate supplier cost totals for each line item
  const calculatedSupplierCosts = supplierCosts.map(sc => ({
    ...sc,
    totalCost: sc.quantity * sc.unitCost
  }));

  // Calculate labor cost totals for each line item
  const calculatedLaborCosts = laborCosts.map(lc => ({
    ...lc,
    totalCost: lc.hoursWorked * lc.hourlyRate
  }));

  // Calculate category totals
  const totalSupplierCost = calculatedSupplierCosts.reduce((sum, sc) => sum + sc.totalCost, 0);
  const totalLaborCost = calculatedLaborCosts.reduce((sum, lc) => sum + lc.totalCost, 0);
  const totalMaterialCost = 
    (materialCosts.inkCost || 0) + 
    (materialCosts.threadCost || 0) + 
    (materialCosts.screenCost || 0) + 
    (materialCosts.vinylCost || 0) + 
    (materialCosts.otherSupplies || 0);

  // Calculate direct costs and overhead
  const directCosts = totalSupplierCost + totalLaborCost + totalMaterialCost;
  const overheadCost = directCosts * (overheadPercentage / 100);
  const totalCost = directCosts + overheadCost;

  // Calculate profit metrics
  const profit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    supplierCosts: calculatedSupplierCosts,
    laborCosts: calculatedLaborCosts,
    materialCosts,
    overheadPercentage,
    totalSupplierCost: parseFloat(totalSupplierCost.toFixed(2)),
    totalLaborCost: parseFloat(totalLaborCost.toFixed(2)),
    totalMaterialCost: parseFloat(totalMaterialCost.toFixed(2)),
    overheadCost: parseFloat(overheadCost.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
    revenue: parseFloat(revenue.toFixed(2)),
    profit: parseFloat(profit.toFixed(2)),
    profitMargin: parseFloat(profitMargin.toFixed(2))
  };
}

/**
 * POST /api/jobs/:id/costs
 * Create or update costs for a job
 */
router.post('/:id/costs', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const costData: JobCostRequest = req.body;

    // Validate job exists
    const jobCheck = await query(
      'SELECT id FROM jobs WHERE id = $1 OR "documentId" = $1 LIMIT 1',
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate all cost metrics
    const metrics = calculateCostMetrics(costData);
    const costEnteredAt = new Date().toISOString();

    // Check if job cost record exists
    const existingCost = await query(
      'SELECT id FROM job_costs WHERE "jobId" = $1 LIMIT 1',
      [jobId]
    );

    if (existingCost.rows.length > 0) {
      // Update existing record
      await query(
        `UPDATE job_costs SET 
          "supplierCosts" = $2,
          "laborCosts" = $3,
          "materialCosts" = $4,
          "overheadPercentage" = $5,
          "totalSupplierCost" = $6,
          "totalLaborCost" = $7,
          "totalMaterialCost" = $8,
          "overheadCost" = $9,
          "totalCost" = $10,
          "revenue" = $11,
          "profit" = $12,
          "profitMargin" = $13,
          "costEnteredAt" = $14,
          "updatedAt" = NOW()
        WHERE "jobId" = $1`,
        [
          jobId,
          JSON.stringify(metrics.supplierCosts),
          JSON.stringify(metrics.laborCosts),
          JSON.stringify(metrics.materialCosts),
          metrics.overheadPercentage,
          metrics.totalSupplierCost,
          metrics.totalLaborCost,
          metrics.totalMaterialCost,
          metrics.overheadCost,
          metrics.totalCost,
          metrics.revenue,
          metrics.profit,
          metrics.profitMargin,
          costEnteredAt
        ]
      );
    } else {
      // Insert new record
      await query(
        `INSERT INTO job_costs (
          "jobId", "supplierCosts", "laborCosts", "materialCosts",
          "overheadPercentage", "totalSupplierCost", "totalLaborCost",
          "totalMaterialCost", "overheadCost", "totalCost", "revenue",
          "profit", "profitMargin", "costEnteredAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
        [
          jobId,
          JSON.stringify(metrics.supplierCosts),
          JSON.stringify(metrics.laborCosts),
          JSON.stringify(metrics.materialCosts),
          metrics.overheadPercentage,
          metrics.totalSupplierCost,
          metrics.totalLaborCost,
          metrics.totalMaterialCost,
          metrics.overheadCost,
          metrics.totalCost,
          metrics.revenue,
          metrics.profit,
          metrics.profitMargin,
          costEnteredAt
        ]
      );
    }

    // Invalidate cache
    const cacheKey = generateCacheKey('job-costs', { jobId });
    await setCache(cacheKey, null, 0);

    const response: JobCostResponse = {
      jobId,
      ...metrics,
      costEnteredAt
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Job costs update error:', error);
    return res.status(500).json({ error: 'Failed to update job costs' });
  }
});

/**
 * GET /api/jobs/:id/costs
 * Get cost breakdown for a job
 */
router.get('/:id/costs', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;

    // Check cache
    const cacheKey = generateCacheKey('job-costs', { jobId });
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Fetch job costs
    const result = await query(
      `SELECT 
        "jobId", "supplierCosts", "laborCosts", "materialCosts",
        "overheadPercentage", "totalSupplierCost", "totalLaborCost",
        "totalMaterialCost", "overheadCost", "totalCost", "revenue",
        "profit", "profitMargin", "costEnteredAt"
      FROM job_costs WHERE "jobId" = $1 LIMIT 1`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job costs not found' });
    }

    const row = result.rows[0];
    const response: JobCostResponse = {
      jobId: row.jobId,
      supplierCosts: typeof row.supplierCosts === 'string' 
        ? JSON.parse(row.supplierCosts) 
        : row.supplierCosts || [],
      laborCosts: typeof row.laborCosts === 'string' 
        ? JSON.parse(row.laborCosts) 
        : row.laborCosts || [],
      materialCosts: typeof row.materialCosts === 'string' 
        ? JSON.parse(row.materialCosts) 
        : row.materialCosts || { inkCost: 0, threadCost: 0, screenCost: 0, vinylCost: 0, otherSupplies: 0 },
      overheadPercentage: parseFloat(row.overheadPercentage) || 15.0,
      totalSupplierCost: parseFloat(row.totalSupplierCost) || 0,
      totalLaborCost: parseFloat(row.totalLaborCost) || 0,
      totalMaterialCost: parseFloat(row.totalMaterialCost) || 0,
      overheadCost: parseFloat(row.overheadCost) || 0,
      totalCost: parseFloat(row.totalCost) || 0,
      revenue: parseFloat(row.revenue) || 0,
      profit: parseFloat(row.profit) || 0,
      profitMargin: parseFloat(row.profitMargin) || 0,
      costEnteredAt: row.costEnteredAt
    };

    // Cache the result
    await setCache(cacheKey, response, CACHE_TTL.PRODUCTS);

    return res.json(response);
  } catch (error) {
    console.error('Job costs fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch job costs' });
  }
});

// Export the calculation function for testing
export { calculateCostMetrics };
export default router;
