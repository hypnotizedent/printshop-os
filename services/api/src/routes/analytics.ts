/**
 * Analytics API Router
 * Main entry point for all analytics endpoints
 */

import { Router } from 'express';
import revenueRouter from './analytics/revenue';
import productsRouter from './analytics/products';
import customersRouter from './analytics/customers';
import ordersRouter from './analytics/orders';
import exportRouter from './analytics/export';

const router = Router();

// Mount sub-routers
router.use('/revenue', revenueRouter);
router.use('/products', productsRouter);
router.use('/customers', customersRouter);
router.use('/orders', ordersRouter);
router.use('/export', exportRouter);

// Root analytics endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'PrintShop OS Analytics API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      revenue: '/api/analytics/revenue',
      products: '/api/analytics/products',
      customers: '/api/analytics/customers',
      orders: '/api/analytics/orders',
      export: '/api/analytics/export',
    },
  });
});

export default router;
