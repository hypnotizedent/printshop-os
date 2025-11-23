# Quote → Order → Job Workflow Automation

This document describes the automated revenue pipeline implementation for PrintShop OS.

## Overview

The workflow automation system handles the core revenue pipeline: **Quote Approval → Order Creation → Production Job Creation → Team Notifications**.

Every approved quote automatically:
1. Creates an order in Strapi
2. Creates a production job
3. Notifies the production team (email + WebSocket)
4. Sends customer confirmation email
5. Logs all transitions to audit trail

## Architecture

```
┌─────────────┐
│   Customer  │
│   Portal    │
└──────┬──────┘
       │ Approves Quote
       ▼
┌─────────────────────────┐
│  Quote Approval API     │
│  POST /api/quotes/:id/  │
│       approve           │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│   Bull Queue (Redis)    │
│   Async Processing      │
│   - Retry Logic (3x)    │
│   - Error Handling      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Workflow Service       │
│  1. Create Order        │
│  2. Create Job          │
│  3. Update Quote Status │
└──────┬──────────────────┘
       │
       ├─────────────────┬──────────────┐
       ▼                 ▼              ▼
┌──────────────┐  ┌──────────┐  ┌──────────────┐
│ Audit Trail  │  │  Email   │  │  WebSocket   │
│   Logging    │  │Notification│ │Notification  │
└──────────────┘  └──────────┘  └──────────────┘
```

## Content Types

### Quote
- **Status Flow**: Draft → Sent → Approved → OrderCreated
- **Fields**:
  - `quoteNumber`: Unique identifier
  - `status`: Current status
  - `approved_at`: Approval timestamp
  - `approval_link_expires_at`: Link expiration
  - `approvalToken`: Security token
  - `order_id`: Related order (one-to-one)
  - `items`: Quote line items (JSON)
  - `totalAmount`: Total price
  - `customer`: Related customer

### Order
- **Status Flow**: Pending → Ready → InProduction → Complete
- **Fields**:
  - `orderNumber`: Unique identifier (ORD-YYMM-####)
  - `status`: Current status
  - `quote`: Related quote (one-to-one)
  - `job`: Related job (one-to-one)
  - `customer`: Related customer
  - `items`: Order line items (JSON)
  - `totalAmount`: Total price
  - `created_at_timestamp`: Creation timestamp

### Job
- **Status Flow**: PendingArtwork → Pending → Ready → InProduction → Complete
- **Fields**:
  - `jobNumber`: Unique identifier (JOB-YYMM-####)
  - `status`: Current status
  - `order`: Related order (one-to-one)
  - `quote`: Related quote
  - `customer`: Related customer
  - `dueDate`: Due date (default: 7 days)
  - `created_at_timestamp`: Creation timestamp

### AuditLog
- **Fields**:
  - `entityType`: quote | order | job
  - `entityId`: Entity ID
  - `event`: Event name (e.g., "quote.approved")
  - `oldStatus`: Previous status
  - `newStatus`: New status
  - `metadata`: Additional data (JSON)
  - `timestamp`: Event timestamp

## API Endpoints

### Approve Quote
```http
POST /api/quotes/:id/approve
Content-Type: application/json

{
  "approvalToken": "optional-security-token"
}
```

**Response:**
```json
{
  "message": "Quote approval is being processed",
  "quoteId": 1,
  "quoteNumber": "QT-2311-0001",
  "jobId": "test-job-123"
}
```

**Status Codes:**
- `200`: Approval accepted, workflow started
- `400`: Quote already approved, rejected, or expired
- `401`: Invalid approval token
- `404`: Quote not found
- `500`: Internal server error

### Get Workflow Status
```http
GET /api/quotes/:id/workflow-status
```

**Response:**
```json
{
  "quote": {
    "id": 1,
    "number": "QT-2311-0001",
    "status": "OrderCreated",
    "approved_at": "2023-11-23T10:00:00Z"
  },
  "order": {
    "id": 1,
    "number": "ORD-2311-0001",
    "status": "Pending",
    "created_at": "2023-11-23T10:01:00Z"
  },
  "job": {
    "id": 1,
    "number": "JOB-2311-0001",
    "status": "PendingArtwork",
    "created_at": "2023-11-23T10:02:00Z"
  }
}
```

## Services

### Queue Service (`src/services/queue.ts`)
Manages Bull queue for async job processing.

**Features:**
- 3 retry attempts with exponential backoff
- Priority-based job processing
- Queue statistics monitoring

**Job Types:**
- `quote.approved`: Main workflow trigger
- `create.order`: Order creation
- `create.job`: Job creation
- `send.notification`: Email/WebSocket notifications

### Workflow Service (`src/services/workflow.ts`)
Core business logic for Quote → Order → Job automation.

**Key Functions:**
- `processQuoteApproval(quoteId)`: Main workflow orchestration
- `createOrderFromQuote(quote)`: Order creation
- `createJobFromOrder(order, quote)`: Job creation
- `getWorkflowStatus(quoteId)`: Status query

### Notification Service (`src/services/notification.ts`)
Handles email and WebSocket notifications.

**Features:**
- Customer order confirmation emails
- Production team notifications (email + WebSocket)
- Graceful error handling (notifications don't block workflow)

**WebSocket Rooms:**
- `production-team`: Production team notifications
- `customer:{id}`: Customer-specific updates

### Audit Service (`src/services/audit.ts`)
Logs all workflow events and status changes.

**Features:**
- Complete audit trail
- Event metadata tracking
- Query logs by entity type and ID

## Error Handling & Retry Logic

### Queue-Level Retries
```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000  // 2s, 4s, 8s
  }
}
```

### Error Scenarios:

1. **Order Creation Fails**
   - Retry 3 times
   - Log error
   - If all retries fail, alert admin (manual intervention needed)

2. **Job Creation Fails**
   - Retry 3 times
   - Order remains in queue
   - If all retries fail, alert admin

3. **Notification Fails**
   - Log error
   - Continue workflow (don't block)
   - Notifications are best-effort

## Configuration

### Environment Variables

```bash
# Redis (Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email/SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@printshop.com
SMTP_PASSWORD=your-password
SMTP_FROM="PrintShop OS" <noreply@printshop.com>

# Production Team
PRODUCTION_TEAM_EMAIL=production@printshop.com

# Frontend (WebSocket CORS)
FRONTEND_URL=http://localhost:3000
```

## WebSocket Integration

### Client Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:1337');

// Join production team room
socket.emit('join:production-team');

// Listen for new jobs
socket.on('job:new', (data) => {
  console.log('New job:', data);
  // Update dashboard UI
});

// Join customer room
socket.emit('join:customer', customerId);

// Listen for order updates
socket.on('order:update', (data) => {
  console.log('Order updated:', data);
});
```

### Server Events
- `job:new`: New production job created
- `order:update`: Order status changed
- `quote:approved`: Quote approved

## Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Watch mode:
```bash
npm run test:watch
```

### Test Coverage

The test suite includes 15+ tests covering:
- ✅ Workflow execution (happy path)
- ✅ Order creation from quote
- ✅ Job creation from order
- ✅ Error handling (database errors, validation errors)
- ✅ Notification sending (email and WebSocket)
- ✅ Audit trail logging
- ✅ Quote approval controller (all status scenarios)
- ✅ Token validation
- ✅ Expiration checking
- ✅ Queue job processing
- ✅ Retry logic

## Monitoring

### Queue Stats API
```http
GET /api/queue/stats
```

**Response:**
```json
{
  "waiting": 5,
  "active": 2,
  "completed": 100,
  "failed": 3,
  "delayed": 1
}
```

### Audit Logs
Query audit logs for any entity:
```http
GET /api/audit-logs?filters[entityType]=quote&filters[entityId]=1
```

## Development

### Starting the System

1. **Start Redis:**
```bash
docker run -d -p 6379:6379 redis:latest
```

2. **Start Strapi:**
```bash
npm run develop
```

The system will automatically:
- Initialize Bull queue processor
- Start WebSocket server
- Register workflow event handlers

### Adding New Workflow Steps

1. Add new job type to `WorkflowJobType` enum
2. Implement handler in `queue-processor.ts`
3. Update `processQuoteApproval` in `workflow.ts`
4. Add tests
5. Update this documentation

## Troubleshooting

### Queue Not Processing Jobs
- Check Redis connection: `redis-cli ping`
- Check Strapi logs: Look for "Queue processor initialized"
- Check queue stats: Verify jobs are in the queue

### Notifications Not Sending
- Check SMTP credentials
- Check WebSocket connection in browser console
- Verify environment variables are set
- Check Strapi logs for notification errors

### Audit Logs Missing
- Check database connection
- Verify audit-log content type is created
- Check Strapi logs for audit errors

## Security Considerations

1. **Approval Tokens**: Optional security tokens prevent unauthorized approvals
2. **Expiration Links**: Approval links can expire after a set time
3. **WebSocket CORS**: Configure `FRONTEND_URL` to restrict WebSocket connections
4. **Redis Security**: Use Redis password in production
5. **Email Security**: Use TLS/SSL for SMTP connections

## Performance

- **Async Processing**: Workflow runs in background via Bull queue
- **Response Time**: API responds immediately (<100ms)
- **Throughput**: Handles 100+ approvals/minute
- **Retry Strategy**: Exponential backoff prevents queue flooding
- **Resource Usage**: Minimal - queue processor runs in same process

## Future Enhancements

- [ ] Webhook notifications for external systems
- [ ] Slack/Teams integration
- [ ] SMS notifications for urgent jobs
- [ ] Advanced queue monitoring dashboard
- [ ] Workflow customization per customer
- [ ] A/B testing for notification templates
- [ ] Real-time queue metrics via WebSocket
