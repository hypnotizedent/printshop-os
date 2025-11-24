/**
 * PrintShop OS API Server
 * Main entry point for the Express API server
 */

import express from 'express';
import cors from 'cors';
import analyticsRouter from './routes/analytics';

const app = express();
const PORT = process.env.API_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/analytics', analyticsRouter);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`PrintShop OS API Server running on port ${PORT}`);
    console.log(`Analytics API: http://localhost:${PORT}/api/analytics`);
  });
}

export default app;
