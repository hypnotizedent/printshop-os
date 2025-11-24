/**
 * Production Dashboard Server
 * Main entry point for time clock and production tracking
 */

import express from 'express';
import { createServer } from 'http';
import { createTimeClockRoutes } from './time-clock/time-clock.routes';
import { WebSocketService } from './websocket/websocket.service';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'production-dashboard' });
});

// API Routes
app.use('/api/production', createTimeClockRoutes());

// Initialize WebSocket
const wsService = new WebSocketService();
wsService.initialize(server);

// Store WebSocket service globally for use in controllers
// In a real app, we'd use dependency injection
(global as any).wsService = wsService;

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Production Dashboard server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    wsService.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    wsService.close();
    process.exit(0);
  });
});
