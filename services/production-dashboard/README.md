<<<<<<< HEAD
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
=======
# Production Dashboard Service

Time clock and job tracking service for PrintShop OS production floor.

## Features

- ✅ Employee PIN authentication (bcrypt hashed)
- ✅ Clock in/out with job tracking
- ✅ Pause/resume for breaks
- ✅ Time entry editing with manager approval
- ✅ Real-time labor cost calculation
- ✅ WebSocket support for live updates
- ✅ 20 comprehensive tests

## Setup

### Install Dependencies
>>>>>>> origin/copilot/build-time-clock-job-detail

```bash
npm install
```

<<<<<<< HEAD
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
=======
### Environment Variables

Create a `.env` file:

```env
PORT=3001
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=your_strapi_token_here
```

### Run Development Server
>>>>>>> origin/copilot/build-time-clock-job-detail

```bash
npm run dev
```

<<<<<<< HEAD
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
=======
### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

## API Endpoints

### Time Clock Operations

- `POST /api/production/time-clock/in` - Clock in employee
  ```json
  {
    "employeeId": 1,
    "employeePin": "1234",
    "jobId": 100,
    "taskType": "Printing",
    "machineId": "press-1"
  }
  ```

- `POST /api/production/time-clock/out` - Clock out employee
  ```json
  {
    "entryId": 1,
    "notes": "Completed successfully",
    "issues": "Minor registration issue"
  }
  ```

- `POST /api/production/time-clock/pause` - Pause timer for break
  ```json
  {
    "entryId": 1
  }
  ```

- `POST /api/production/time-clock/resume` - Resume timer after break
  ```json
  {
    "entryId": 1
  }
  ```

- `GET /api/production/time-clock/active` - Get all active timers

### Time Entry Management

- `POST /api/production/time-entries` - Create time entry (same as clock in)

- `PATCH /api/production/time-entries/:id` - Edit time entry
  ```json
  {
    "clockIn": "2025-11-23T08:00:00Z",
    "clockOut": "2025-11-23T12:00:00Z",
    "breakTime": 30,
    "editedById": 2,
    "editReason": "Forgot to clock out"
  }
  ```

- `GET /api/production/time-entries` - Get time entries
  ```
  ?employeeId=1&startDate=2025-11-23T00:00:00Z&endDate=2025-11-23T23:59:59Z
  ```

- `POST /api/production/time-entries/:id/approve` - Approve/reject edit
  ```json
  {
    "approvedById": 3,
    "approved": true
  }
  ```

### Employee Summary

- `GET /api/production/employees/:id/time` - Get employee time summary
  ```
  ?startDate=2025-11-23T00:00:00Z&endDate=2025-11-23T23:59:59Z
  ```

## WebSocket Events

### Client → Server

- `ping` - Heartbeat check
- `subscribe` - Subscribe to channels
  ```json
  {
    "type": "subscribe",
    "payload": {
      "channels": ["time-clock", "approvals"]
    }
  }
  ```

### Server → Client

- `connected` - Connection established
- `employee:clocked-in` - Employee started work
- `employee:clocked-out` - Employee finished work
- `timer:update` - Timer value updated
- `timer:paused` - Timer paused for break
- `timer:resumed` - Timer resumed from break
- `edit:requested` - Time entry edit requested
- `edit:approved` - Time entry edit approved/rejected

## Architecture
>>>>>>> origin/copilot/build-time-clock-job-detail

```
services/production-dashboard/
├── src/
<<<<<<< HEAD
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
=======
│   ├── time-clock/
│   │   ├── time-clock.service.ts     # Business logic
│   │   ├── time-clock.controller.ts  # HTTP handlers
│   │   └── time-clock.routes.ts      # Route definitions
│   ├── websocket/
│   │   └── websocket.service.ts      # Real-time updates
│   ├── __tests__/
│   │   └── time-clock.test.ts        # Test suite (20 tests)
│   └── index.ts                      # Server entry point
>>>>>>> origin/copilot/build-time-clock-job-detail
├── package.json
├── tsconfig.json
└── jest.config.js
```

<<<<<<< HEAD
=======
## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Watch mode for development:

```bash
npm run test:watch
```

## Labor Cost Calculation

Labor costs are calculated as:

```typescript
productiveTime = (clockOut - clockIn) - breakTime
laborCost = (productiveTime / 60) * employeeHourlyRate
```

Updates are recalculated on:
- Clock out
- Time entry edit
- Break time changes

## Security

- Employee PINs are hashed with bcrypt (10 rounds)
- API endpoints should be authenticated (JWT recommended)
- Rate limiting recommended for PIN attempts
- All time entry edits require manager approval
- Audit trail maintained for all edits

## Integration

This service integrates with:
- **Strapi**: Employee and job data
- **WebSocket**: Real-time frontend updates
- **Frontend**: React components in `frontend/src/components/production/`

>>>>>>> origin/copilot/build-time-clock-job-detail
## License

MIT
