/**
 * Production Dashboard API Test Suite
 * Tests for WebSocket + REST API
 */

import request from 'supertest';
import { io as ioClient, Socket } from 'socket.io-client';
import app, { httpServer, wsServer } from '../src/api';
import { generateToken } from '../src/middleware/auth';
import { User, OrderStatus } from '../src/types';

// Test users
const adminUser: User = {
  id: 'user-admin',
  username: 'admin',
  role: 'admin',
  email: 'admin@test.com'
};

const supervisorUser: User = {
  id: 'user-supervisor',
  username: 'supervisor',
  role: 'supervisor',
  email: 'supervisor@test.com'
};

const operatorUser: User = {
  id: 'user-operator',
  username: 'operator',
  role: 'operator',
  email: 'operator@test.com'
};

// Generate tokens
const adminToken = generateToken(adminUser);
const supervisorToken = generateToken(supervisorUser);
const operatorToken = generateToken(operatorUser);

// Server setup
let server: any;
let serverPort: number;

beforeAll((done) => {
  server = httpServer.listen(0, () => {
    serverPort = (server.address() as any).port;
    console.log(`Test server running on port ${serverPort}`);
    done();
  });
});

afterAll((done) => {
  wsServer.close().then(() => {
    server.close(done);
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('connections');
  });
});

describe('API Documentation', () => {
  it('should return API documentation', async () => {
    const response = await request(app)
      .get('/api/docs')
      .expect(200);

    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('endpoints');
    expect(response.body).toHaveProperty('authentication');
  });
});

describe('Authentication Middleware', () => {
  it('should reject requests without token', async () => {
    const response = await request(app)
      .get('/api/production/queue')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('token required');
  });

  it('should reject requests with invalid token', async () => {
    const response = await request(app)
      .get('/api/production/queue')
      .set('Authorization', 'Bearer invalid-token')
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Invalid or expired');
  });

  it('should accept requests with valid token', async () => {
    const response = await request(app)
      .get('/api/production/queue')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});

describe('Production Queue Endpoints', () => {
  describe('GET /api/production/queue', () => {
    it('should return production queue', async () => {
      const response = await request(app)
        .get('/api/production/queue')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('order');
      expect(response.body.data[0]).toHaveProperty('position');
    });
  });

  describe('POST /api/production/queue/reorder', () => {
    it('should reject non-supervisor users', async () => {
      const response = await request(app)
        .post('/api/production/queue/reorder')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ orderIds: ['order-001', 'order-002'] })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow supervisor to reorder queue', async () => {
      const response = await request(app)
        .post('/api/production/queue/reorder')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ orderIds: ['order-002', 'order-001', 'order-003'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].order.id).toBe('order-002');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/production/queue/reorder')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ orderIds: 'not-an-array' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/production/queue/:orderId', () => {
    it('should return specific order', async () => {
      const response = await request(app)
        .get('/api/production/queue/order-001')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data.order.id).toBe('order-001');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/production/queue/non-existent')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Resource Endpoints', () => {
  describe('GET /api/production/resources', () => {
    it('should return all resources', async () => {
      const response = await request(app)
        .get('/api/production/resources')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('machines');
      expect(response.body.data).toHaveProperty('employees');
      expect(Array.isArray(response.body.data.machines)).toBe(true);
      expect(Array.isArray(response.body.data.employees)).toBe(true);
    });
  });

  describe('GET /api/production/resources/machines', () => {
    it('should return all machines', async () => {
      const response = await request(app)
        .get('/api/production/resources/machines')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('type');
      expect(response.body.data[0]).toHaveProperty('status');
    });
  });

  describe('POST /api/production/resources/machines/:machineId/allocate', () => {
    it('should reject operator allocation', async () => {
      const response = await request(app)
        .post('/api/production/resources/machines/machine-001/allocate')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ orderId: 'order-001' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow supervisor to allocate machine', async () => {
      const response = await request(app)
        .post('/api/production/resources/machines/machine-002/allocate')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ orderId: 'order-001' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentJobId).toBe('order-001');
      expect(response.body.data.status).toBe('running');
    });
  });
});

describe('Order Endpoints', () => {
  describe('GET /api/production/orders/:id', () => {
    it('should return order details', async () => {
      const response = await request(app)
        .get('/api/production/orders/order-001')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('customerName');
    });
  });

  describe('POST /api/production/status', () => {
    it('should update order status', async () => {
      const response = await request(app)
        .post('/api/production/status')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ orderId: 'order-001', status: 'in_printing' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_printing');
    });

    it('should reject operator updating to restricted status', async () => {
      const response = await request(app)
        .post('/api/production/status')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ orderId: 'order-001', status: 'completed' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/production/status')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ orderId: 'order-001' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Analytics Endpoints', () => {
  describe('GET /api/production/analytics', () => {
    it('should return analytics data', async () => {
      const response = await request(app)
        .get('/api/production/analytics')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('throughput');
      expect(response.body.data).toHaveProperty('cycleTime');
      expect(response.body.data).toHaveProperty('utilization');
      expect(response.body.data).toHaveProperty('bottlenecks');
      expect(response.body.data).toHaveProperty('quality');
    });
  });

  describe('GET /api/production/analytics/throughput', () => {
    it('should return throughput metrics', async () => {
      const response = await request(app)
        .get('/api/production/analytics/throughput')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobsPerHour');
      expect(response.body.data).toHaveProperty('jobsPerDay');
    });
  });

  describe('GET /api/production/analytics/bottlenecks', () => {
    it('should return bottleneck analysis', async () => {
      const response = await request(app)
        .get('/api/production/analytics/bottlenecks')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

describe('WebSocket Connection', () => {
  let client: Socket;

  afterEach(() => {
    if (client && client.connected) {
      client.disconnect();
    }
  });

  it('should reject connection without token', (done) => {
    client = ioClient(`http://localhost:${serverPort}`);
    
    client.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication token required');
      done();
    });
  });

  it('should reject connection with invalid token', (done) => {
    client = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: 'invalid-token' }
    });
    
    client.on('connect_error', (error) => {
      expect(error.message).toContain('Invalid or expired');
      done();
    });
  });

  it('should accept connection with valid token', (done) => {
    client = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: operatorToken }
    });
    
    client.on('connection:authenticated', (data) => {
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('timestamp');
      done();
    });
  });

  it('should handle multiple concurrent connections', (done) => {
    const clients: Socket[] = [];
    const numClients = 10;
    let connectedCount = 0;

    for (let i = 0; i < numClients; i++) {
      const client = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: operatorToken }
      });

      client.on('connection:authenticated', () => {
        connectedCount++;
        if (connectedCount === numClients) {
          clients.forEach(c => c.disconnect());
          done();
        }
      });

      clients.push(client);
    }
  });
});

describe('WebSocket Events', () => {
  let client: Socket;

  beforeEach((done) => {
    client = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: operatorToken }
    });
    client.on('connection:authenticated', () => done());
  });

  afterEach(() => {
    if (client && client.connected) {
      client.disconnect();
    }
  });

  it('should subscribe to orders', (done) => {
    client.emit('subscribe:orders', { orderIds: ['order-001', 'order-002'] });
    setTimeout(() => {
      done();
    }, 100);
  });

  it('should query queue', (done) => {
    client.emit('query:queue', (queue: any) => {
      expect(Array.isArray(queue)).toBe(true);
      done();
    });
  });

  it('should update order status', (done) => {
    client.on('order:status_changed', (data) => {
      expect(data).toHaveProperty('orderId');
      expect(data).toHaveProperty('oldStatus');
      expect(data).toHaveProperty('newStatus');
      expect(data).toHaveProperty('timestamp');
      done();
    });

    client.emit('subscribe:orders', { orderIds: ['order-001'] });
    
    setTimeout(() => {
      client.emit('update:status', {
        orderId: 'order-001',
        newStatus: 'in_curing' as OrderStatus
      });
    }, 100);
  });

  it('should receive error for invalid order', (done) => {
    client.on('error', (data) => {
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('not found');
      done();
    });

    client.emit('update:status', {
      orderId: 'non-existent',
      newStatus: 'in_printing' as OrderStatus
    });
  });
});

describe('Performance Tests', () => {
  it('should handle REST API requests within 200ms', async () => {
    const start = Date.now();
    await request(app)
      .get('/api/production/queue')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200);
  });

  it('should handle 100+ concurrent WebSocket connections', (done) => {
    const clients: Socket[] = [];
    const numClients = 100;
    let connectedCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < numClients; i++) {
      const client = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: operatorToken }
      });

      client.on('connection:authenticated', () => {
        connectedCount++;
        if (connectedCount === numClients) {
          const duration = Date.now() - startTime;
          console.log(`${numClients} clients connected in ${duration}ms`);
          expect(wsServer.getConnectedUsersCount()).toBeGreaterThanOrEqual(numClients);
          clients.forEach(c => c.disconnect());
          done();
        }
      });

      clients.push(client);
    }
  }, 15000);
});

describe('Admin Endpoints', () => {
  describe('GET /api/production/connections', () => {
    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/production/connections')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return connections for admin', async () => {
      const response = await request(app)
        .get('/api/production/connections')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('users');
    });
  });
});

describe('Error Handling', () => {
  it('should return 404 for non-existent endpoint', async () => {
    const response = await request(app)
      .get('/api/production/nonexistent')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(404);

    expect(response.body.success).toBe(false);
  });
});
