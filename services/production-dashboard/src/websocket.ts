/**
 * WebSocket Server Implementation
 * Handles real-time production dashboard updates
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClient, RedisClientType } from 'redis';
import { verifyWebSocketToken } from './middleware/auth';
import { User, OrderStatus, QueueItem, ProductionStage } from './types';

// Mock data stores (in production, these would be database queries)
const mockOrders = new Map<string, any>();
const mockQueue: QueueItem[] = [];

interface AuthenticatedSocket extends Socket {
  user?: User;
}

export class ProductionWebSocketServer {
  private io: Server;
  private redisPubClient?: RedisClientType;
  private redisSubClient?: RedisClientType;
  private useRedis: boolean;
  private connectedUsers: Map<string, User> = new Map();

  constructor(httpServer: HTTPServer, useRedis: boolean = false) {
    this.useRedis = useRedis;
    
    // Initialize Socket.IO with CORS
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Set up middleware and event handlers
    this.setupMiddleware();
    this.setupEventHandlers();

    // Initialize Redis if enabled
    if (useRedis) {
      this.initializeRedis();
    }
  }

  /**
   * Set up Socket.IO middleware for authentication
   */
  private setupMiddleware(): void {
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const user = verifyWebSocketToken(token as string);
      if (!user) {
        return next(new Error('Invalid or expired token'));
      }

      socket.user = user;
      next();
    });
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.user?.username} (${socket.id})`);
      
      if (socket.user) {
        this.connectedUsers.set(socket.id, socket.user);
      }

      // Send authentication confirmation
      socket.emit('connection:authenticated', {
        userId: socket.user?.id,
        timestamp: new Date()
      });

      // Subscribe to order updates
      socket.on('subscribe:orders', (data: { orderIds?: string[] }) => {
        if (data.orderIds && data.orderIds.length > 0) {
          data.orderIds.forEach(orderId => {
            socket.join(`order:${orderId}`);
          });
          console.log(`User ${socket.user?.username} subscribed to orders: ${data.orderIds.join(', ')}`);
        } else {
          // Subscribe to all orders
          socket.join('orders:all');
          console.log(`User ${socket.user?.username} subscribed to all orders`);
        }
      });

      // Update order status
      socket.on('update:status', async (data: { orderId: string; newStatus: OrderStatus }) => {
        if (!socket.user) return;

        // Check permissions
        if (socket.user.role === 'operator' && !this.canOperatorUpdateStatus(data.newStatus)) {
          socket.emit('error', {
            message: 'Insufficient permissions to update to this status',
            code: 'INSUFFICIENT_PERMISSIONS'
          });
          return;
        }

        try {
          const order = mockOrders.get(data.orderId);
          if (!order) {
            socket.emit('error', {
              message: 'Order not found',
              code: 'ORDER_NOT_FOUND'
            });
            return;
          }

          const oldStatus = order.status;
          order.status = data.newStatus;
          order.updatedAt = new Date();
          mockOrders.set(data.orderId, order);

          // Broadcast status change
          const statusUpdate = {
            orderId: data.orderId,
            oldStatus,
            newStatus: data.newStatus,
            timestamp: new Date()
          };

          this.broadcastToOrder(data.orderId, 'order:status_changed', statusUpdate);
          
          // Also broadcast via Redis if enabled
          if (this.useRedis && this.redisPubClient) {
            await this.redisPubClient.publish(
              'production:status_update',
              JSON.stringify(statusUpdate)
            );
          }

          console.log(`Order ${data.orderId} status updated: ${oldStatus} -> ${data.newStatus}`);
        } catch (error) {
          console.error('Error updating order status:', error);
          socket.emit('error', {
            message: 'Failed to update order status',
            code: 'UPDATE_FAILED'
          });
        }
      });

      // Query current queue
      socket.on('query:queue', (callback) => {
        if (typeof callback === 'function') {
          callback(mockQueue);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user?.username} (${socket.id})`);
        this.connectedUsers.delete(socket.id);
      });
    });
  }

  /**
   * Initialize Redis for pub/sub (multi-server support)
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redisPubClient = createClient({ url: redisUrl });
      this.redisSubClient = createClient({ url: redisUrl });

      await this.redisPubClient.connect();
      await this.redisSubClient.connect();

      // Subscribe to production updates
      await this.redisSubClient.subscribe('production:status_update', (message) => {
        const data = JSON.parse(message);
        this.broadcastToOrder(data.orderId, 'order:status_changed', data);
      });

      await this.redisSubClient.subscribe('production:queue_update', (message) => {
        const data = JSON.parse(message);
        this.io.to('orders:all').emit('queue:updated', data);
      });

      await this.redisSubClient.subscribe('production:resource_allocated', (message) => {
        const data = JSON.parse(message);
        this.io.to('orders:all').emit('resource:allocated', data);
      });

      console.log('Redis pub/sub initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.useRedis = false;
    }
  }

  /**
   * Check if operator can update to specific status
   */
  private canOperatorUpdateStatus(status: OrderStatus): boolean {
    const operatorAllowedStatuses: OrderStatus[] = [
      'in_screen',
      'in_printing',
      'in_curing',
      'in_quality_check',
      'on_hold'
    ];
    return operatorAllowedStatuses.includes(status);
  }

  /**
   * Broadcast event to specific order subscribers
   */
  private broadcastToOrder(orderId: string, event: string, data: any): void {
    this.io.to(`order:${orderId}`).emit(event, data);
    this.io.to('orders:all').emit(event, data);
  }

  /**
   * Broadcast queue update to all connected clients
   */
  public async broadcastQueueUpdate(queue: QueueItem[]): Promise<void> {
    const data = { queue, timestamp: new Date() };
    this.io.to('orders:all').emit('queue:updated', data);
    
    if (this.useRedis && this.redisPubClient) {
      await this.redisPubClient.publish(
        'production:queue_update',
        JSON.stringify(data)
      );
    }
  }

  /**
   * Broadcast resource allocation
   */
  public async broadcastResourceAllocation(
    resourceType: 'machine' | 'employee',
    resourceId: string,
    orderId: string
  ): Promise<void> {
    const data = { resourceType, resourceId, orderId, timestamp: new Date() };
    this.io.to('orders:all').emit('resource:allocated', data);
    
    if (this.useRedis && this.redisPubClient) {
      await this.redisPubClient.publish(
        'production:resource_allocated',
        JSON.stringify(data)
      );
    }
  }

  /**
   * Broadcast bottleneck alert
   */
  public broadcastBottleneckAlert(
    stage: ProductionStage,
    jobsWaiting: number,
    averageWaitTime: number
  ): void {
    const data = { stage, jobsWaiting, averageWaitTime, timestamp: new Date() };
    this.io.to('orders:all').emit('alert:bottleneck', data);
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users
   */
  public getConnectedUsers(): User[] {
    return Array.from(this.connectedUsers.values());
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): Server {
    return this.io;
  }

  /**
   * Clean up resources
   */
  public async close(): Promise<void> {
    if (this.redisPubClient) {
      await this.redisPubClient.quit();
    }
    if (this.redisSubClient) {
      await this.redisSubClient.quit();
    }
    this.io.close();
  }
}

// Helper functions for mock data (to be replaced with database calls)
export function setMockOrder(orderId: string, order: any): void {
  mockOrders.set(orderId, order);
}

export function getMockOrder(orderId: string): any {
  return mockOrders.get(orderId);
}

export function setMockQueue(queue: QueueItem[]): void {
  mockQueue.length = 0;
  mockQueue.push(...queue);
}

export function getMockQueue(): QueueItem[] {
  return [...mockQueue];
}
