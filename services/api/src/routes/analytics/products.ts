/**
 * Product Analytics Endpoint
 * GET /api/analytics/products
 */

import { Router, Request, Response } from 'express';
import { query } from '../../utils/db';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../../utils/cache';

const router = Router();

interface ProductQuery {
  period?: 'month' | 'quarter' | 'year';
  limit?: string;
  sort_by?: 'revenue' | 'units' | 'margin';
}

/**
 * GET /api/analytics/products
 * Query params:
 *   - period: month|quarter|year
 *   - limit: number (default 10)
 *   - sort_by: revenue|units|margin
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      period = 'month',
      limit = '10',
      sort_by = 'revenue',
    } = req.query as ProductQuery;

    const limitNum = parseInt(limit) || 10;

    // Generate cache key
    const cacheKey = generateCacheKey('products', { period, limit: limitNum, sort_by });
    
    // Check cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

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

    // Extract product data from order items (stored as JSON)
    // This aggregates products from the items field in orders
    const productsQuery = `
      WITH product_data AS (
        SELECT 
          o.id,
          o."totalAmount",
          o."createdAt",
          jsonb_array_elements(o.items::jsonb) as item
        FROM orders o
        WHERE o."createdAt" BETWEEN $1 AND $2
          AND o.status NOT IN ('Cancelled')
      ),
      aggregated AS (
        SELECT 
          COALESCE(item->>'description', item->>'product_name', 'Unknown Product') as product_name,
          COALESCE(item->>'category', 'Uncategorized') as category,
          SUM(COALESCE((item->>'quantity')::numeric, 0)) as units_sold,
          SUM(COALESCE((item->>'quantity')::numeric, 0) * COALESCE((item->>'unitCost')::numeric, 0)) as revenue,
          COUNT(DISTINCT id) as order_count,
          AVG(COALESCE((item->>'unitCost')::numeric, 0)) as avg_unit_price
        FROM product_data
        WHERE item IS NOT NULL
        GROUP BY product_name, category
      )
      SELECT 
        product_name,
        category,
        units_sold,
        revenue,
        order_count,
        avg_unit_price,
        CASE 
          WHEN revenue > 0 THEN ((revenue * 0.3) / revenue * 100)
          ELSE 0 
        END as margin
      FROM aggregated
      WHERE units_sold > 0
      ORDER BY 
        CASE 
          WHEN $3 = 'units' THEN units_sold
          WHEN $3 = 'margin' THEN revenue * 0.3
          ELSE revenue
        END DESC
      LIMIT $4
    `;

    const productsResult = await query(productsQuery, [
      startDate.toISOString(),
      endDate.toISOString(),
      sort_by,
      limitNum,
    ]);

    // Get category breakdown
    const categoryQuery = `
      WITH product_data AS (
        SELECT 
          o.id,
          jsonb_array_elements(o.items::jsonb) as item
        FROM orders o
        WHERE o."createdAt" BETWEEN $1 AND $2
          AND o.status NOT IN ('Cancelled')
      )
      SELECT 
        COALESCE(item->>'category', 'Uncategorized') as category,
        COUNT(*) as count,
        SUM(COALESCE((item->>'quantity')::numeric, 0) * COALESCE((item->>'unitCost')::numeric, 0)) as revenue
      FROM product_data
      WHERE item IS NOT NULL
      GROUP BY category
      ORDER BY revenue DESC
    `;

    const categoryResult = await query(categoryQuery, [
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    // Calculate trending products (growth in last period)
    const trendingQuery = `
      WITH current_period AS (
        SELECT 
          COALESCE(item->>'description', item->>'product_name', 'Unknown Product') as product_name,
          SUM(COALESCE((item->>'quantity')::numeric, 0)) as units
        FROM orders o,
          jsonb_array_elements(o.items::jsonb) as item
        WHERE o."createdAt" BETWEEN $1 AND $2
          AND o.status NOT IN ('Cancelled')
        GROUP BY product_name
      ),
      previous_period AS (
        SELECT 
          COALESCE(item->>'description', item->>'product_name', 'Unknown Product') as product_name,
          SUM(COALESCE((item->>'quantity')::numeric, 0)) as units
        FROM orders o,
          jsonb_array_elements(o.items::jsonb) as item
        WHERE o."createdAt" BETWEEN $3 AND $1
          AND o.status NOT IN ('Cancelled')
        GROUP BY product_name
      )
      SELECT 
        c.product_name,
        c.units as current_units,
        COALESCE(p.units, 0) as previous_units,
        CASE 
          WHEN COALESCE(p.units, 0) > 0 
          THEN ((c.units - COALESCE(p.units, 0)) / COALESCE(p.units, 0) * 100)
          ELSE 100
        END as growth_rate
      FROM current_period c
      LEFT JOIN previous_period p ON c.product_name = p.product_name
      WHERE c.units > 0
      ORDER BY growth_rate DESC
      LIMIT 5
    `;

    const previousPeriodStart = new Date(startDate);
    const periodDuration = endDate.getTime() - startDate.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

    const trendingResult = await query(trendingQuery, [
      startDate.toISOString(),
      endDate.toISOString(),
      previousPeriodStart.toISOString(),
    ]);

    const response = {
      top_products: productsResult.rows.map((row, index) => ({
        product_name: row.product_name,
        category: row.category,
        units_sold: parseInt(row.units_sold || '0'),
        revenue: parseFloat(row.revenue || '0').toFixed(2),
        margin: parseFloat(row.margin || '0').toFixed(2),
        order_count: parseInt(row.order_count || '0'),
        avg_unit_price: parseFloat(row.avg_unit_price || '0').toFixed(2),
        rank: index + 1,
      })),
      category_breakdown: categoryResult.rows.reduce((acc, row) => {
        acc[row.category] = {
          count: parseInt(row.count || '0'),
          revenue: parseFloat(row.revenue || '0').toFixed(2),
        };
        return acc;
      }, {} as Record<string, any>),
      trending: trendingResult.rows.map((row) => ({
        product_name: row.product_name,
        current_units: parseInt(row.current_units || '0'),
        previous_units: parseInt(row.previous_units || '0'),
        growth_rate: parseFloat(row.growth_rate || '0').toFixed(2),
      })),
      period,
      sort_by,
    };

    // Cache the result
    await setCache(cacheKey, response, CACHE_TTL.PRODUCTS);

    return res.json(response);
  } catch (error) {
    console.error('Product analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

export default router;
