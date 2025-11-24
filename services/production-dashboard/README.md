# Production Dashboard API

WebSocket + REST API for real-time production dashboard updates in PrintShop OS.

## Features

- **Real-time Updates**: WebSocket server using Socket.io for instant status updates
- **REST API**: Complete REST API for data queries and management
- **Authentication**: JWT-based authentication with role-based access control
- **Redis Support**: Optional Redis pub/sub for multi-server scaling
- **Resource Tracking**: Monitor machines and employees in real-time
- **Analytics**: Production KPIs including throughput, cycle time, and bottlenecks
- **High Performance**: Handles 100+ concurrent WebSocket connections

## Tech Stack

- Node.js + TypeScript
- Express.js (REST API)
- Socket.io (WebSocket)
- JWT (Authentication)
- Redis (Optional pub/sub)
- Jest + Supertest (Testing)

## Installation

```bash
npm install
```

## Configuration

Environment variables (optional):

```bash
PORT=3000                    # Server port (default: 3000)
JWT_SECRET=your-secret-key   # JWT secret (default: test key)
REDIS_ENABLED=true           # Enable Redis pub/sub (default: false)
REDIS_URL=redis://localhost:6379  # Redis URL
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Documentation

### REST Endpoints

#### Queue Management
- `GET /api/production/queue` - Get production queue
- `POST /api/production/queue/reorder` - Reorder queue (supervisor+)
- `GET /api/production/queue/:orderId` - Get order in queue

#### Resource Management
- `GET /api/production/resources` - Get all resources
- `GET /api/production/resources/machines` - Get machines
- `POST /api/production/resources/machines/:id/allocate` - Allocate machine (supervisor+)
- `GET /api/production/resources/employees` - Get employees
- `POST /api/production/resources/employees/:id/assign` - Assign employee (supervisor+)

#### Order Management
- `GET /api/production/orders/:id` - Get order details
- `POST /api/production/status` - Update order status

#### Analytics
- `GET /api/production/analytics` - Get all KPIs
- `GET /api/production/analytics/throughput` - Throughput metrics
- `GET /api/production/analytics/cycle-time` - Cycle time metrics
- `GET /api/production/analytics/utilization` - Resource utilization
- `GET /api/production/analytics/bottlenecks` - Bottleneck analysis
- `GET /api/production/analytics/quality` - Quality metrics

### WebSocket Events

#### Server → Client
- `connection:authenticated` - Authentication successful
- `order:status_changed` - Order status updated
- `queue:updated` - Production queue changed
- `resource:allocated` - Machine/employee assigned
- `alert:bottleneck` - Job stuck in stage
- `error` - Error occurred

#### Client → Server
- `authenticate` - Authenticate with JWT token
- `subscribe:orders` - Subscribe to order updates
- `update:status` - Update order status
- `query:queue` - Get current queue

## Authentication

All endpoints require JWT authentication. Include token in header:

```
Authorization: Bearer <your-jwt-token>
```

### Roles
- **operator**: Can view data and update basic statuses
- **supervisor**: Can reorder queue and allocate resources
- **admin**: Full access including connection monitoring

### WebSocket Authentication

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Example Usage

### REST API

```javascript
// Get production queue
const response = await fetch('http://localhost:3000/api/production/queue', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const data = await response.json();
console.log(data.data); // Queue items
```

### WebSocket

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

// Listen for authentication
socket.on('connection:authenticated', (data) => {
  console.log('Authenticated:', data.userId);
});

// Subscribe to order updates
socket.emit('subscribe:orders', { 
  orderIds: ['order-001', 'order-002'] 
});

// Listen for status changes
socket.on('order:status_changed', (data) => {
  console.log('Order updated:', data);
});

// Update order status
socket.emit('update:status', {
  orderId: 'order-001',
  newStatus: 'in_printing'
});
```

## Performance

- REST API response time: < 200ms
- WebSocket message latency: < 100ms
- Concurrent connections: 100+
- Test coverage: 20+ comprehensive tests

## Development

### Project Structure

```
services/production-dashboard/
├── src/
│   ├── api.ts              # Main API server
│   ├── websocket.ts        # WebSocket implementation
│   ├── types.ts            # TypeScript types
│   ├── middleware/
│   │   └── auth.ts         # JWT authentication
│   └── routes/
│       ├── queue.ts        # Queue management
│       ├── resources.ts    # Resource tracking
│       └── analytics.ts    # KPI endpoints
├── __tests__/
│   └── api.test.ts         # Comprehensive test suite
├── package.json
├── tsconfig.json
└── jest.config.js
```

## License

MIT
