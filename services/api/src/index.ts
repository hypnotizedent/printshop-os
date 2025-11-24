/**
 * Main API Server
 * Express server for PrintShop OS authentication and customer portal
 */

import * as express from 'express';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 PrintShop OS API running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  });
}

export default app;
