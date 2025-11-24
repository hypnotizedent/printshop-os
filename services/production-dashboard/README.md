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

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
PORT=3001
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=your_strapi_token_here
```

### Run Development Server

```bash
npm run dev
```

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

```
services/production-dashboard/
├── src/
│   ├── time-clock/
│   │   ├── time-clock.service.ts     # Business logic
│   │   ├── time-clock.controller.ts  # HTTP handlers
│   │   └── time-clock.routes.ts      # Route definitions
│   ├── websocket/
│   │   └── websocket.service.ts      # Real-time updates
│   ├── __tests__/
│   │   └── time-clock.test.ts        # Test suite (20 tests)
│   └── index.ts                      # Server entry point
├── package.json
├── tsconfig.json
└── jest.config.js
```

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

## License

MIT
