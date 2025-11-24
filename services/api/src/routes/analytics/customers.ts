/**
 * Customer Analytics Endpoint
 * GET /api/analytics/customers
 */

import { Router, Request, Response } from 'express';
import { query } from '../../utils/db';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../../utils/cache';

const router = Router();

interface CustomerQuery {
  period?: 'month' | 'quarter' | 'year' | 'all_time';
  limit?: string;
  min_ltv?: string;
}

/**
 * GET /api/analytics/customers
 * Query params:
 *   - period: month|quarter|year|all_time
 *   - limit: number
 *   - min_ltv: number (filter by lifetime value)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      period = 'all_time',
      limit = '10',
      min_ltv = '0',
    } = req.query as CustomerQuery;

    const limitNum = parseInt(limit) || 10;
    const minLtv = parseFloat(min_ltv) || 0;

    // Generate cache key
    const cacheKey = generateCacheKey('customers', { period, limit: limitNum, min_ltv: minLtv });
    
    // Check cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Calculate date range
    const endDate = new Date();
    let startDate: Date | null = null;

    if (period !== 'all_time') {
      startDate = new Date();
      switch (period) {
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'month':
        default:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }
    }

    // Build query for top customers
    const dateFilter = startDate 
      ? 'AND o."createdAt" BETWEEN $2 AND $3'
      : '';
    
    const topCustomersQuery = `
      SELECT 
        c.id as customer_id,
        c.name,
        c.email,
        COALESCE(SUM(CAST(o."totalAmount" AS NUMERIC)), 0) as lifetime_value,
        COUNT(o.id) as order_count,
        COALESCE(AVG(CAST(o."totalAmount" AS NUMERIC)), 0) as avg_order_value,
        MAX(o."createdAt") as last_order_date,
        CASE 
          WHEN MAX(o."createdAt") > NOW() - INTERVAL '30 days' THEN 'active'
          WHEN MAX(o."createdAt") > NOW() - INTERVAL '90 days' THEN 'inactive'
          ELSE 'dormant'
        END as status
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE o.status NOT IN ('Cancelled')
        ${dateFilter}
      GROUP BY c.id, c.name, c.email
      HAVING COALESCE(SUM(CAST(o."totalAmount" AS NUMERIC)), 0) >= $1
      ORDER BY lifetime_value DESC
      LIMIT ${limitNum}
    `;

    const params = startDate 
      ? [minLtv, startDate.toISOString(), endDate.toISOString()]
      : [minLtv];

    const customersResult = await query(topCustomersQuery, params);

    // Calculate churn risk (customers who haven't ordered in 60+ days)
    const churnRiskQuery = `
      SELECT 
        c.id as customer_id,
        c.name,
        c.email,
        MAX(o."createdAt") as last_order_date,
        COUNT(o.id) as order_count,
        COALESCE(SUM(CAST(o."totalAmount" AS NUMERIC)), 0) as lifetime_value,
        EXTRACT(DAY FROM NOW() - MAX(o."createdAt")) as days_since_order
      FROM customers c
      INNER JOIN orders o ON c.id = o.customer_id
      WHERE o.status NOT IN ('Cancelled')
      GROUP BY c.id, c.name, c.email
      HAVING MAX(o."createdAt") < NOW() - INTERVAL '60 days'
        AND MAX(o."createdAt") > NOW() - INTERVAL '180 days'
        AND COUNT(o.id) >= 3
      ORDER BY lifetime_value DESC
      LIMIT 10
    `;

    const churnRiskResult = await query(churnRiskQuery);

    // Calculate average customer acquisition cost (simple estimate)
    const acquisitionCostQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COALESCE(SUM(CAST(o."totalAmount" AS NUMERIC)), 0) as total_revenue
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE o.status NOT IN ('Cancelled')
        ${startDate ? 'AND o."createdAt" BETWEEN $1 AND $2' : ''}
    `;

    const acqParams = startDate 
      ? [startDate.toISOString(), endDate.toISOString()]
      : [];

    const acqResult = await query(acquisitionCostQuery, acqParams);
    const totalCustomers = parseInt(acqResult.rows[0]?.total_customers || '0');
    const totalRevenue = parseFloat(acqResult.rows[0]?.total_revenue || '0');
    
    // Estimate acquisition cost (configurable ratio of average revenue per customer)
    const acqCostRatio = parseFloat(process.env.CUSTOMER_ACQ_COST_RATIO || '0.1'); // Default 10%
    const acquisitionCost = totalCustomers > 0 
      ? (totalRevenue / totalCustomers) * acqCostRatio 
      : 0;

    // Get customer segments
    const segmentsQuery = `
      WITH customer_metrics AS (
        SELECT 
          c.id,
          COALESCE(SUM(CAST(o."totalAmount" AS NUMERIC)), 0) as ltv,
          COUNT(o.id) as order_count
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE o.status NOT IN ('Cancelled')
        GROUP BY c.id
      )
      SELECT 
        CASE 
          WHEN ltv >= 10000 THEN 'VIP'
          WHEN ltv >= 5000 THEN 'High Value'
          WHEN ltv >= 1000 THEN 'Medium Value'
          WHEN ltv > 0 THEN 'Low Value'
          ELSE 'No Orders'
        END as segment,
        COUNT(*) as count,
        COALESCE(AVG(ltv), 0) as avg_ltv
      FROM customer_metrics
      GROUP BY segment
      ORDER BY avg_ltv DESC
    `;

    const segmentsResult = await query(segmentsQuery);

    const response = {
      top_customers: customersResult.rows.map((row) => ({
        customer_id: row.customer_id,
        name: row.name,
        email: row.email,
        lifetime_value: parseFloat(row.lifetime_value || '0').toFixed(2),
        order_count: parseInt(row.order_count || '0'),
        avg_order_value: parseFloat(row.avg_order_value || '0').toFixed(2),
        last_order_date: row.last_order_date,
        status: row.status,
      })),
      churn_risk: churnRiskResult.rows.map((row) => ({
        customer_id: row.customer_id,
        name: row.name,
        email: row.email,
        last_order_date: row.last_order_date,
        days_since_order: parseInt(row.days_since_order || '0'),
        order_count: parseInt(row.order_count || '0'),
        lifetime_value: parseFloat(row.lifetime_value || '0').toFixed(2),
      })),
      acquisition_cost: parseFloat(acquisitionCost.toFixed(2)),
      segments: segmentsResult.rows.map((row) => ({
        segment: row.segment,
        count: parseInt(row.count || '0'),
        avg_ltv: parseFloat(row.avg_ltv || '0').toFixed(2),
      })),
      period,
    };

    // Cache the result
    await setCache(cacheKey, response, CACHE_TTL.CUSTOMERS);

    return res.json(response);
  } catch (error) {
    console.error('Customer analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

export default router;
