/**
 * Revenue Analytics Endpoint
 * GET /api/analytics/revenue
 */

import { Router, Request, Response } from 'express';
import { query } from '../../utils/db';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../../utils/cache';

const router = Router();

interface RevenueQuery {
  period?: 'day' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month';
}

/**
 * GET /api/analytics/revenue
 * Query params:
 *   - period: day|week|month|year
 *   - start_date: ISO date
 *   - end_date: ISO date
 *   - group_by: day|week|month
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      period = 'month',
      start_date,
      end_date,
      group_by = 'month',
    } = req.query as RevenueQuery;

    // Generate cache key
    const cacheKey = generateCacheKey('revenue', { period, start_date, end_date, group_by });
    
    // Check cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Calculate date range
    const endDate = end_date ? new Date(end_date) : new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    if (start_date) {
      startDate = new Date(start_date);
    }

    // Build SQL query for total revenue
    const totalQuery = `
      SELECT 
        COALESCE(SUM(CAST("totalAmount" AS NUMERIC)), 0) as total_revenue,
        COUNT(*) as order_count,
        COALESCE(AVG(CAST("totalAmount" AS NUMERIC)), 0) as avg_order_value
      FROM orders
      WHERE "createdAt" BETWEEN $1 AND $2
        AND status NOT IN ('Cancelled')
    `;

    const totalResult = await query(totalQuery, [startDate.toISOString(), endDate.toISOString()]);
    
    // Build SQL query for period revenue grouping
    let groupByClause: string;
    let periodFormat: string;
    
    switch (group_by) {
      case 'day':
        groupByClause = "DATE_TRUNC('day', \"createdAt\")";
        periodFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        groupByClause = "DATE_TRUNC('week', \"createdAt\")";
        periodFormat = 'YYYY-WW';
        break;
      case 'month':
      default:
        groupByClause = "DATE_TRUNC('month', \"createdAt\")";
        periodFormat = 'YYYY-MM';
        break;
    }

    const periodQuery = `
      SELECT 
        ${groupByClause} as period,
        TO_CHAR(${groupByClause}, '${periodFormat}') as period_label,
        COALESCE(SUM(CAST("totalAmount" AS NUMERIC)), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE "createdAt" BETWEEN $1 AND $2
        AND status NOT IN ('Cancelled')
      GROUP BY ${groupByClause}
      ORDER BY ${groupByClause} DESC
      LIMIT 12
    `;

    const periodResult = await query(periodQuery, [startDate.toISOString(), endDate.toISOString()]);

    // Calculate growth rate (comparing to previous period)
    const previousPeriodStart = new Date(startDate);
    const periodDuration = endDate.getTime() - startDate.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

    const previousPeriodQuery = `
      SELECT COALESCE(SUM(CAST("totalAmount" AS NUMERIC)), 0) as revenue
      FROM orders
      WHERE "createdAt" BETWEEN $1 AND $2
        AND status NOT IN ('Cancelled')
    `;

    const previousResult = await query(previousPeriodQuery, [
      previousPeriodStart.toISOString(),
      startDate.toISOString(),
    ]);

    const currentRevenue = parseFloat(totalResult.rows[0]?.total_revenue || '0');
    const previousRevenue = parseFloat(previousResult.rows[0]?.revenue || '0');
    const growthRate = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Simple forecast (using linear extrapolation)
    const forecastNextPeriod = periodResult.rows.length > 1
      ? parseFloat(periodResult.rows[0]?.revenue || '0') * 1.05 // 5% growth assumption
      : currentRevenue;

    const response = {
      total_revenue: parseFloat(currentRevenue.toFixed(2)),
      order_count: parseInt(totalResult.rows[0]?.order_count || '0'),
      avg_order_value: parseFloat(totalResult.rows[0]?.avg_order_value || '0').toFixed(2),
      period_revenue: periodResult.rows.map((row) => ({
        period: row.period_label,
        revenue: parseFloat(row.revenue).toFixed(2),
        orders: parseInt(row.orders),
      })),
      growth_rate: parseFloat(growthRate.toFixed(2)),
      forecast_next_period: parseFloat(forecastNextPeriod.toFixed(2)),
      period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };

    // Cache the result
    await setCache(cacheKey, response, CACHE_TTL.REVENUE);

    return res.json(response);
  } catch (error) {
    console.error('Revenue analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

export default router;
