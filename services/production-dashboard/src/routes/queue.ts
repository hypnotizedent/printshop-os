/**
 * Production Queue Management Routes
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { strictLimiter } from '../middleware/rateLimiter';
import { QueueItem, Order, RESTResponse } from '../types';
import { setMockQueue } from '../websocket';

const router = Router();

// Mock queue data (in production, this would query a database)
let productionQueue: QueueItem[] = [];

// Initialize with some sample data
function initializeMockQueue(): void {
  if (productionQueue.length === 0) {
    const sampleOrders: Order[] = [
      {
        id: 'order-001',
        jobId: 'JOB-1234',
        customerId: 'cust-123',
        customerName: 'Acme Corporation',
        status: 'approved',
        priority: 1,
        service: 'screen',
        quantity: 100,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 'order-002',
        jobId: 'JOB-1235',
        customerId: 'cust-124',
        customerName: 'Tech Startup Inc',
        status: 'in_printing',
        priority: 2,
        service: 'dtg',
        quantity: 50,
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(),
        assignedMachine: 'DTG-001',
        assignedEmployee: 'emp-001'
      },
      {
        id: 'order-003',
        jobId: 'JOB-1236',
        customerId: 'cust-125',
        customerName: 'Sports Team LLC',
        status: 'in_screen',
        priority: 3,
        service: 'embroidery',
        quantity: 75,
        dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    productionQueue = sampleOrders.map((order, index) => ({
      order,
      position: index + 1,
      estimatedStartTime: new Date(Date.now() + (index * 2) * 60 * 60 * 1000)
    }));
  }
}

initializeMockQueue();

/**
 * GET /api/production/queue
 * Get current production queue
 */
router.get('/', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const response: RESTResponse<QueueItem[]> = {
      success: true,
      data: productionQueue,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch production queue',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/production/queue/reorder
 * Reorder production queue
 * Body: { orderIds: string[] } - Array of order IDs in desired order
 */
router.post('/reorder', strictLimiter, authenticateToken, requireRole('supervisor', 'admin'), (req: Request, res: Response): void => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds)) {
      const response: RESTResponse = {
        success: false,
        error: 'orderIds must be an array',
        timestamp: new Date()
      };
      res.status(400).json(response);
      return;
    }

    // Create a map of current queue items by order ID
    const queueMap = new Map<string, QueueItem>();
    productionQueue.forEach(item => {
      queueMap.set(item.order.id, item);
    });

    // Reorder the queue based on provided order IDs
    const newQueue: QueueItem[] = [];
    orderIds.forEach((orderId, index) => {
      const item = queueMap.get(orderId);
      if (item) {
        newQueue.push({
          ...item,
          position: index + 1,
          estimatedStartTime: new Date(Date.now() + (index * 2) * 60 * 60 * 1000)
        });
        queueMap.delete(orderId);
      }
    });

    // Add remaining items that weren't in the reorder list
    queueMap.forEach(item => {
      newQueue.push({
        ...item,
        position: newQueue.length + 1
      });
    });

    productionQueue = newQueue;
    setMockQueue(newQueue);

    const response: RESTResponse<QueueItem[]> = {
      success: true,
      data: productionQueue,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to reorder production queue',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/queue/:orderId
 * Get specific order in queue
 */
router.get('/:orderId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { orderId } = req.params;
    const queueItem = productionQueue.find(item => item.order.id === orderId);

    if (!queueItem) {
      const response: RESTResponse = {
        success: false,
        error: 'Order not found in queue',
        timestamp: new Date()
      };
      res.status(404).json(response);
      return;
    }

    const response: RESTResponse<QueueItem> = {
      success: true,
      data: queueItem,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch order from queue',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

export default router;
export { productionQueue };
