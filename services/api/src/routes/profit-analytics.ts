/**
 * Profit Analytics API Routes
 * GET /api/analytics/profit/*
 * Provides profit metrics, trends, and analysis
 */

import { Router, Request, Response } from 'express';
import { query } from '../utils/db';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../utils/cache';

const router = Router();

interface ProfitOverview {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageProfitMargin: number;
  jobCount: number;
  profitableJobs: number;
  unprofitableJobs: number;
  profitTrend: { period: string; profit: number; margin: number }[];
}

interface ProductProfit {
  productType: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  jobCount: number;
}

interface DepartmentProfit {
  department: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  jobCount: number;
  laborCost: number;
}

interface JobProfitSummary {
  jobId: string;
  jobNumber: string;
  customerName: string;
  revenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  completedAt?: string;
}

/**
 * GET /api/analytics/profit/overview
 * Total profit metrics across all jobs
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, period = 'month' } = req.query;

    // Generate cache key
    const cacheKey = generateCacheKey('profit-overview', { start_date, end_date, period });
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Calculate date range
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date 
      ? new Date(start_date as string) 
      : new Date(endDate.getTime() - (period === 'year' ? 365 : period === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000);

    // Get aggregate profit metrics
    const aggregateResult = await query(
      `SELECT 
        COALESCE(SUM(revenue), 0) as total_revenue,
        COALESCE(SUM("totalCost"), 0) as total_cost,
        COALESCE(SUM(profit), 0) as total_profit,
        COALESCE(AVG("profitMargin"), 0) as avg_margin,
        COUNT(*) as job_count,
        SUM(CASE WHEN profit >= 0 THEN 1 ELSE 0 END) as profitable_jobs,
        SUM(CASE WHEN profit < 0 THEN 1 ELSE 0 END) as unprofitable_jobs
      FROM job_costs
      WHERE "costEnteredAt" BETWEEN $1 AND $2`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    // Get profit trend by period
    const trendResult = await query(
      `SELECT 
        DATE_TRUNC('${period === 'week' ? 'week' : 'month'}', "costEnteredAt") as period,
        COALESCE(SUM(profit), 0) as profit,
        COALESCE(AVG("profitMargin"), 0) as margin
      FROM job_costs
      WHERE "costEnteredAt" BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('${period === 'week' ? 'week' : 'month'}', "costEnteredAt")
      ORDER BY period DESC
      LIMIT 12`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const row = aggregateResult.rows[0] || {};
    const response: ProfitOverview = {
      totalRevenue: parseFloat(row.total_revenue) || 0,
      totalCost: parseFloat(row.total_cost) || 0,
      totalProfit: parseFloat(row.total_profit) || 0,
      averageProfitMargin: parseFloat(row.avg_margin) || 0,
      jobCount: parseInt(row.job_count) || 0,
      profitableJobs: parseInt(row.profitable_jobs) || 0,
      unprofitableJobs: parseInt(row.unprofitable_jobs) || 0,
      profitTrend: trendResult.rows.map(r => ({
        period: r.period?.toISOString?.() || String(r.period),
        profit: parseFloat(r.profit) || 0,
        margin: parseFloat(r.margin) || 0
      }))
    };

    await setCache(cacheKey, response, CACHE_TTL.REVENUE);
    return res.json(response);
  } catch (error) {
    console.error('Profit overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch profit overview' });
  }
});

/**
 * GET /api/analytics/profit/by-product
 * Profit breakdown by product type
 */
router.get('/by-product', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const cacheKey = generateCacheKey('profit-by-product', { start_date, end_date });
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date 
      ? new Date(start_date as string) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Join with jobs table to get product description/type
    const result = await query(
      `SELECT 
        COALESCE(j."productDescription", 'Unknown') as product_type,
        COALESCE(SUM(jc.revenue), 0) as revenue,
        COALESCE(SUM(jc."totalCost"), 0) as cost,
        COALESCE(SUM(jc.profit), 0) as profit,
        COALESCE(AVG(jc."profitMargin"), 0) as profit_margin,
        COUNT(*) as job_count
      FROM job_costs jc
      LEFT JOIN jobs j ON jc."jobId"::text = j.id::text OR jc."jobId"::text = j."documentId"::text
      WHERE jc."costEnteredAt" BETWEEN $1 AND $2
      GROUP BY COALESCE(j."productDescription", 'Unknown')
      ORDER BY profit DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const products: ProductProfit[] = result.rows.map(row => ({
      productType: row.product_type,
      revenue: parseFloat(row.revenue) || 0,
      cost: parseFloat(row.cost) || 0,
      profit: parseFloat(row.profit) || 0,
      profitMargin: parseFloat(row.profit_margin) || 0,
      jobCount: parseInt(row.job_count) || 0
    }));

    const response = { products, startDate: startDate.toISOString(), endDate: endDate.toISOString() };
    await setCache(cacheKey, response, CACHE_TTL.PRODUCTS);
    return res.json(response);
  } catch (error) {
    console.error('Profit by product error:', error);
    return res.status(500).json({ error: 'Failed to fetch profit by product' });
  }
});

/**
 * GET /api/analytics/profit/by-department
 * Profit breakdown by department (based on labor assignments)
 */
router.get('/by-department', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const cacheKey = generateCacheKey('profit-by-department', { start_date, end_date });
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date 
      ? new Date(start_date as string) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // This query aggregates by employee department through labor costs
    // Since laborCosts is stored as JSON, we need to parse and aggregate
    const result = await query(
      `SELECT 
        COALESCE(e.department, 'Unassigned') as department,
        COALESCE(SUM(jc.revenue), 0) as revenue,
        COALESCE(SUM(jc."totalCost"), 0) as cost,
        COALESCE(SUM(jc.profit), 0) as profit,
        COALESCE(AVG(jc."profitMargin"), 0) as profit_margin,
        COALESCE(SUM(jc."totalLaborCost"), 0) as labor_cost,
        COUNT(DISTINCT jc."jobId") as job_count
      FROM job_costs jc
      LEFT JOIN employees e ON e.id::text = ANY(
        ARRAY(SELECT jsonb_array_elements(jc."laborCosts"::jsonb)->>'employeeId')
      )
      WHERE jc."costEnteredAt" BETWEEN $1 AND $2
      GROUP BY COALESCE(e.department, 'Unassigned')
      ORDER BY profit DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const departments: DepartmentProfit[] = result.rows.map(row => ({
      department: row.department,
      revenue: parseFloat(row.revenue) || 0,
      cost: parseFloat(row.cost) || 0,
      profit: parseFloat(row.profit) || 0,
      profitMargin: parseFloat(row.profit_margin) || 0,
      jobCount: parseInt(row.job_count) || 0,
      laborCost: parseFloat(row.labor_cost) || 0
    }));

    const response = { departments, startDate: startDate.toISOString(), endDate: endDate.toISOString() };
    await setCache(cacheKey, response, CACHE_TTL.PRODUCTS);
    return res.json(response);
  } catch (error) {
    console.error('Profit by department error:', error);
    return res.status(500).json({ error: 'Failed to fetch profit by department' });
  }
});

/**
 * GET /api/analytics/profit/loss-leaders
 * Jobs with negative profit (loss leaders)
 */
router.get('/loss-leaders', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, limit = '20' } = req.query;

    const cacheKey = generateCacheKey('profit-loss-leaders', { start_date, end_date, limit });
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date 
      ? new Date(start_date as string) 
      : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    const result = await query(
      `SELECT 
        jc."jobId" as job_id,
        COALESCE(j."jobNumber", jc."jobId"::text) as job_number,
        COALESCE(c.name, 'Unknown Customer') as customer_name,
        jc.revenue,
        jc."totalCost" as total_cost,
        jc.profit,
        jc."profitMargin" as profit_margin,
        jc."costEnteredAt" as completed_at
      FROM job_costs jc
      LEFT JOIN jobs j ON jc."jobId"::text = j.id::text OR jc."jobId"::text = j."documentId"::text
      LEFT JOIN customers c ON j.customer = c.id OR j.customer::text = c."documentId"::text
      WHERE jc.profit < 0
        AND jc."costEnteredAt" BETWEEN $1 AND $2
      ORDER BY jc.profit ASC
      LIMIT $3`,
      [startDate.toISOString(), endDate.toISOString(), parseInt(limit as string)]
    );

    const lossLeaders: JobProfitSummary[] = result.rows.map(row => ({
      jobId: row.job_id,
      jobNumber: row.job_number,
      customerName: row.customer_name,
      revenue: parseFloat(row.revenue) || 0,
      totalCost: parseFloat(row.total_cost) || 0,
      profit: parseFloat(row.profit) || 0,
      profitMargin: parseFloat(row.profit_margin) || 0,
      completedAt: row.completed_at
    }));

    const response = { 
      lossLeaders, 
      totalLoss: lossLeaders.reduce((sum, j) => sum + j.profit, 0),
      count: lossLeaders.length,
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    };
    
    await setCache(cacheKey, response, CACHE_TTL.PRODUCTS);
    return res.json(response);
  } catch (error) {
    console.error('Loss leaders error:', error);
    return res.status(500).json({ error: 'Failed to fetch loss leaders' });
  }
});

/**
 * GET /api/analytics/profit/most-profitable
 * Top profit jobs
 */
router.get('/most-profitable', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, limit = '20' } = req.query;

    const cacheKey = generateCacheKey('profit-most-profitable', { start_date, end_date, limit });
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date 
      ? new Date(start_date as string) 
      : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    const result = await query(
      `SELECT 
        jc."jobId" as job_id,
        COALESCE(j."jobNumber", jc."jobId"::text) as job_number,
        COALESCE(c.name, 'Unknown Customer') as customer_name,
        jc.revenue,
        jc."totalCost" as total_cost,
        jc.profit,
        jc."profitMargin" as profit_margin,
        jc."costEnteredAt" as completed_at
      FROM job_costs jc
      LEFT JOIN jobs j ON jc."jobId"::text = j.id::text OR jc."jobId"::text = j."documentId"::text
      LEFT JOIN customers c ON j.customer = c.id OR j.customer::text = c."documentId"::text
      WHERE jc.profit > 0
        AND jc."costEnteredAt" BETWEEN $1 AND $2
      ORDER BY jc.profit DESC
      LIMIT $3`,
      [startDate.toISOString(), endDate.toISOString(), parseInt(limit as string)]
    );

    const mostProfitable: JobProfitSummary[] = result.rows.map(row => ({
      jobId: row.job_id,
      jobNumber: row.job_number,
      customerName: row.customer_name,
      revenue: parseFloat(row.revenue) || 0,
      totalCost: parseFloat(row.total_cost) || 0,
      profit: parseFloat(row.profit) || 0,
      profitMargin: parseFloat(row.profit_margin) || 0,
      completedAt: row.completed_at
    }));

    const response = { 
      mostProfitable, 
      totalProfit: mostProfitable.reduce((sum, j) => sum + j.profit, 0),
      count: mostProfitable.length,
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    };
    
    await setCache(cacheKey, response, CACHE_TTL.PRODUCTS);
    return res.json(response);
  } catch (error) {
    console.error('Most profitable error:', error);
    return res.status(500).json({ error: 'Failed to fetch most profitable jobs' });
  }
});

export default router;
