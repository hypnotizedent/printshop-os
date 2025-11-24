/**
 * Production Dashboard Server
 * Main entry point for time clock and production tracking
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { createTimeClockRoutes } from './time-clock/time-clock.routes';
import { WebSocketService } from './websocket/websocket.service';

// Service container for dependency injection
export interface ServiceContainer {
  wsService: WebSocketService;
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize services
const wsService = new WebSocketService();
const services: ServiceContainer = {
  wsService,
};

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

// Make services available via request object
app.use((req: any, res: Response, next: NextFunction) => {
  req.services = services;
  next();
});

// API Routes
app.use('/api/production', createTimeClockRoutes());

// Initialize WebSocket
wsService.initialize(server);

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
