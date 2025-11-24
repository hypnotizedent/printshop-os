/**
 * Order Metrics Endpoint
 * GET /api/analytics/orders
 */

import { Router, Request, Response } from 'express';
import { query } from '../../utils/db';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../../utils/cache';

const router = Router();

interface OrderQuery {
  period?: 'day' | 'week' | 'month';
}

/**
 * GET /api/analytics/orders
 * Query params:
 *   - period: day|week|month
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query as OrderQuery;

    // Generate cache key
    const cacheKey = generateCacheKey('orders', { period });
    
    // Check cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // Get status breakdown
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      WHERE "createdAt" BETWEEN $1 AND $2
      GROUP BY status
      ORDER BY count DESC
    `;

    const statusResult = await query(statusQuery, [
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    // Calculate average cycle time (from creation to completion)
    const cycleTimeQuery = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400) as avg_days
      FROM orders
      WHERE status = 'Complete'
        AND "createdAt" BETWEEN $1 AND $2
    `;

    const cycleTimeResult = await query(cycleTimeQuery, [
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    const avgCycleDays = parseFloat(cycleTimeResult.rows[0]?.avg_days || '0');

    // Calculate conversion rate from quotes to orders
    const conversionQuery = `
      WITH quote_counts AS (
        SELECT COUNT(*) as total_quotes
        FROM quotes
        WHERE "createdAt" BETWEEN $1 AND $2
      ),
      order_counts AS (
        SELECT COUNT(*) as total_orders
        FROM orders
        WHERE "createdAt" BETWEEN $1 AND $2
          AND status NOT IN ('Cancelled')
      )
      SELECT 
        q.total_quotes,
        o.total_orders,
        CASE 
          WHEN q.total_quotes > 0 
          THEN (o.total_orders::float / q.total_quotes::float * 100)
          ELSE 0 
        END as conversion_rate
      FROM quote_counts q, order_counts o
    `;

    const conversionResult = await query(conversionQuery, [
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    // Identify bottlenecks (orders stuck in a status for too long)
    const bottlenecksQuery = `
      WITH status_durations AS (
        SELECT 
          status,
          AVG(EXTRACT(EPOCH FROM (NOW() - "updatedAt")) / 86400) as avg_wait_days,
          COUNT(*) as order_count
        FROM orders
        WHERE status NOT IN ('Complete', 'Cancelled')
          AND "createdAt" BETWEEN $1 AND $2
        GROUP BY status
      )
      SELECT 
        status as stage,
        avg_wait_days,
        order_count
      FROM status_durations
      WHERE avg_wait_days > 2
      ORDER BY avg_wait_days DESC
    `;

    const bottlenecksResult = await query(bottlenecksQuery, [
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    // Get orders by day for trend analysis
    const trendQuery = `
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count,
        COALESCE(SUM(CAST("totalAmount" AS NUMERIC)), 0) as revenue
      FROM orders
      WHERE "createdAt" BETWEEN $1 AND $2
        AND status NOT IN ('Cancelled')
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
      LIMIT 30
    `;

    const trendResult = await query(trendQuery, [
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    const statusBreakdown = statusResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    const response = {
      status_breakdown: statusBreakdown,
      avg_cycle_time: `${avgCycleDays.toFixed(1)} days`,
      conversion_rate: parseFloat(
        conversionResult.rows[0]?.conversion_rate || '0'
      ).toFixed(2),
      total_quotes: parseInt(conversionResult.rows[0]?.total_quotes || '0'),
      total_orders: parseInt(conversionResult.rows[0]?.total_orders || '0'),
      bottlenecks: bottlenecksResult.rows.map((row) => ({
        stage: row.stage,
        avg_wait: `${parseFloat(row.avg_wait_days || '0').toFixed(1)} days`,
        order_count: parseInt(row.order_count || '0'),
      })),
      daily_trend: trendResult.rows.map((row) => ({
        date: new Date(row.date).toISOString().split('T')[0],
        count: parseInt(row.count || '0'),
        revenue: parseFloat(row.revenue || '0').toFixed(2),
      })),
      period,
    };

    // Cache the result
    await setCache(cacheKey, response, CACHE_TTL.ORDERS);

    return res.json(response);
  } catch (error) {
    console.error('Order analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch order analytics' });
  }
});

export default router;
