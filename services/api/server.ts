/**
 * Customer Portal API Server
 * 
 * REST API server for customer portal functionality
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import customerOrdersRouter from './routes/customer-orders';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'customer-portal-api',
  });
});

// Mount customer orders routes
app.use('/api/customer', customerOrdersRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`Customer Portal API Server listening on port ${PORT}`);
    console.log(`GET  http://localhost:${PORT}/api/customer/orders`);
    console.log(`GET  http://localhost:${PORT}/api/customer/orders/:id`);
    console.log(`GET  http://localhost:${PORT}/api/customer/orders/:id/invoice`);
    console.log(`GET  http://localhost:${PORT}/api/customer/orders/:id/files`);
  });
}

export default app;
