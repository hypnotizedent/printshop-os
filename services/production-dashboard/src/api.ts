/**
 * Production Dashboard API Server
 * WebSocket + REST API for real-time production updates
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { ProductionWebSocketServer, setMockOrder } from './websocket';
import { authenticateToken, requireRole } from './middleware/auth';
import queueRouter, { productionQueue } from './routes/queue';
import resourcesRouter from './routes/resources';
import analyticsRouter from './routes/analytics';
import { Order, OrderStatus, RESTResponse } from './types';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize WebSocket server
const useRedis = process.env.REDIS_ENABLED === 'true';
const wsServer = new ProductionWebSocketServer(httpServer, useRedis);

console.log(`WebSocket server initialized (Redis: ${useRedis ? 'enabled' : 'disabled'})`);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    connections: wsServer.getConnectedUsersCount(),
    redis: useRedis
  });
});

// API documentation endpoint
app.get('/api/docs', (_req: Request, res: Response) => {
  res.json({
    name: 'Production Dashboard API',
    version: '1.0.0',
    description: 'WebSocket + REST API for real-time production updates',
    endpoints: {
      rest: {
        queue: {
          'GET /api/production/queue': 'Get current production queue',
          'POST /api/production/queue/reorder': 'Reorder production queue (supervisor+)',
          'GET /api/production/queue/:orderId': 'Get specific order in queue'
        },
        resources: {
          'GET /api/production/resources': 'Get all resources',
          'GET /api/production/resources/machines': 'Get all machines',
          'GET /api/production/resources/machines/:machineId': 'Get specific machine',
          'POST /api/production/resources/machines/:machineId/allocate': 'Allocate machine (supervisor+)',
          'GET /api/production/resources/employees': 'Get all employees',
          'GET /api/production/resources/employees/:employeeId': 'Get specific employee',
          'POST /api/production/resources/employees/:employeeId/assign': 'Assign employee (supervisor+)'
        },
        orders: {
          'GET /api/production/orders/:id': 'Get order details',
          'POST /api/production/status': 'Update order status'
        },
        analytics: {
          'GET /api/production/analytics': 'Get all analytics/KPIs',
          'GET /api/production/analytics/throughput': 'Get throughput metrics',
          'GET /api/production/analytics/cycle-time': 'Get cycle time metrics',
          'GET /api/production/analytics/utilization': 'Get utilization metrics',
          'GET /api/production/analytics/bottlenecks': 'Get bottleneck analysis',
          'GET /api/production/analytics/quality': 'Get quality metrics'
        }
      },
      websocket: {
        connection: 'Connect with JWT token in auth.token or query.token',
        events: {
          serverToClient: [
            'connection:authenticated - Authentication successful',
            'order:status_changed - Order status updated',
            'queue:updated - Production queue changed',
            'resource:allocated - Machine/employee assigned',
            'alert:bottleneck - Job stuck in stage',
            'error - Error occurred'
          ],
          clientToServer: [
            'subscribe:orders - Subscribe to order updates',
            'update:status - Update order status',
            'query:queue - Get current queue'
          ]
        }
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>',
      roles: ['operator', 'supervisor', 'admin']
    }
  });
});

// Mount route modules
app.use('/api/production/queue', queueRouter);
app.use('/api/production/resources', resourcesRouter);
app.use('/api/production/analytics', analyticsRouter);

/**
 * GET /api/production/orders/:id
 * Get single order details
 */
app.get('/api/production/orders/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    // Find order in queue
    const queueItem = productionQueue.find(item => item.order.id === id);
    
    if (!queueItem) {
      const response: RESTResponse = {
        success: false,
        error: 'Order not found',
        timestamp: new Date()
      };
      res.status(404).json(response);
      return;
    }

    const response: RESTResponse<Order> = {
      success: true,
      data: queueItem.order,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch order',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/production/status
 * Update job status
 */
app.post('/api/production/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      const response: RESTResponse = {
        success: false,
        error: 'orderId and status are required',
        timestamp: new Date()
      };
      res.status(400).json(response);
      return;
    }

    // Check permissions for operators
    if (req.user?.role === 'operator') {
      const allowedStatuses: OrderStatus[] = [
        'in_screen',
        'in_printing',
        'in_curing',
        'in_quality_check',
        'on_hold'
      ];
      if (!allowedStatuses.includes(status)) {
        const response: RESTResponse = {
          success: false,
          error: 'Insufficient permissions to update to this status',
          timestamp: new Date()
        };
        res.status(403).json(response);
        return;
      }
    }

    // Find and update order
    const queueItem = productionQueue.find(item => item.order.id === orderId);
    
    if (!queueItem) {
      const response: RESTResponse = {
        success: false,
        error: 'Order not found',
        timestamp: new Date()
      };
      res.status(404).json(response);
      return;
    }

    const oldStatus = queueItem.order.status;
    queueItem.order.status = status;
    queueItem.order.updatedAt = new Date();

    // Update mock order for WebSocket
    setMockOrder(orderId, queueItem.order);

    // Broadcast status change via WebSocket
    const statusUpdate = {
      orderId,
      oldStatus,
      newStatus: status,
      timestamp: new Date()
    };

    // The WebSocket server will handle the broadcast when clients update via socket
    // For REST API updates, we need to broadcast manually
    wsServer.getIO().to(`order:${orderId}`).emit('order:status_changed', statusUpdate);
    wsServer.getIO().to('orders:all').emit('order:status_changed', statusUpdate);

    const response: RESTResponse<Order> = {
      success: true,
      data: queueItem.order,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to update order status',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/connections
 * Get connected users (admin only)
 */
app.get('/api/production/connections', authenticateToken, requireRole('admin'), (_req: Request, res: Response): void => {
  try {
    const users = wsServer.getConnectedUsers();
    const response: RESTResponse = {
      success: true,
      data: {
        count: wsServer.getConnectedUsersCount(),
        users
      },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch connections',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  const response: RESTResponse = {
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date()
  };
  res.status(404).json(response);
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const response: RESTResponse = {
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date()
  };
  res.status(500).json(response);
});

// Start server
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`Production Dashboard API server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`REST API: http://localhost:${PORT}/api/production`);
    console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
export { httpServer, wsServer };
