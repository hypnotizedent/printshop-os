# PrintShop OS - Development Guide

**Last Updated:** November 24, 2025

## Prerequisites

### Required Software
- **Node.js:** 18+ (LTS recommended)
- **npm:** 9+ (comes with Node.js)
- **PostgreSQL:** 15+
- **Redis:** 7+
- **Git:** Latest version
- **Docker:** 20+ (optional but recommended)
- **Docker Compose:** 2+ (optional but recommended)

### Recommended Tools
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript + JavaScript Language Features
  - Tailwind CSS IntelliSense
  - GitHub Copilot
- **Postman** or **Insomnia** for API testing
- **Redis Commander** or **RedisInsight** for Redis debugging
- **pgAdmin** or **DBeaver** for PostgreSQL management

---

## Initial Setup

### 1. Clone Repository

```bash
cd ~/Projects
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os
```

### 2. Environment Configuration

Copy environment template and fill in values:

```bash
cp .env.example .env
```

**Edit `.env` with your settings:**

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=printshop_os
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Strapi
STRAPI_APP_KEYS=generate_random_keys_here
STRAPI_API_TOKEN_SALT=generate_random_salt_here
STRAPI_ADMIN_JWT_SECRET=generate_random_secret_here
STRAPI_JWT_SECRET=generate_random_secret_here

# OpenAI (for AI Quote Optimizer)
OPENAI_API_KEY=sk-your-key-here

# Supplier APIs (optional for development)
SS_ACTIVEWEAR_API_KEY=
SANMAR_CLIENT_ID=
SANMAR_CLIENT_SECRET=
AS_COLOUR_API_KEY=

# App Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Generate secure random values:**

```bash
# Generate random keys/secrets (run 4 times for each value)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Install Dependencies

**Option A: Using Docker (Recommended)**

```bash
# Start all services
docker-compose up -d

# Services will be available at:
# - Strapi: http://localhost:1337
# - Production Dashboard: http://localhost:3000
# - Analytics: http://localhost:3002
# - Frontend: http://localhost:5173
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

**Option B: Manual Installation**

```bash
# Install root dependencies
npm install

# Install Strapi dependencies
cd printshop-strapi && npm install

# Install Production Dashboard dependencies
cd ../services/production-dashboard && npm install

# Install Analytics dependencies
cd ../api && npm install

# Install Customer Service AI dependencies
cd ../customer-service-ai && npm install

# Install Frontend dependencies
cd ../../frontend && npm install
```

### 4. Database Setup

**If using Docker:**
Database is automatically created and configured.

**If manual installation:**

```bash
# Create database
createdb printshop_os

# Run Strapi (will auto-create tables)
cd printshop-strapi
npm run develop
```

**First-time Strapi setup:**
1. Navigate to http://localhost:1337/admin
2. Create admin user account
3. Strapi will auto-generate database schema

---

## Development Workflow

### Starting the Development Environment

**Using Docker:**

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Manual start:**

```bash
# Terminal 1: Start Strapi
cd printshop-strapi
npm run develop

# Terminal 2: Start Production Dashboard
cd services/production-dashboard
npm run dev

# Terminal 3: Start Analytics API
cd services/api
npm run dev

# Terminal 4: Start Frontend
cd frontend
npm run dev

# Terminal 5: Start Redis (if not using Docker)
redis-server

# Terminal 6: Start PostgreSQL (if not using Docker)
postgres -D /usr/local/var/postgres
```

### Stopping Services

**Docker:**
```bash
docker-compose down
```

**Manual:**
- Press `Ctrl+C` in each terminal

---

## Data Ingestion & AI Training

### Email History Ingestion
We use a script to ingest your email history (from Outlook/Exchange) to train the AI agent on your tone and customer interactions.

**The "Drag & Drop" Method (Mac):**
1.  Create a folder on your Desktop (e.g., `Training Emails`).
2.  Open Outlook for Mac.
3.  Select emails (Cmd+A) and **drag them** into the folder. This creates `.eml` files.
4.  Move the folder to: `data/raw/email-exports/`
5.  Run the ingestion script:

```bash
python3 services/customer-service-ai/scripts/ingest_mailbox.py
```

**Result:**
- The script parses all `.eml` and `.mbox` files.
- It generates Markdown training files in `data/intelligence/knowledge_base/email_history/`.
- The Agent automatically indexes these files on its next startup.

---

## Common Commands

### Development Commands

```bash
# Install dependencies for all services
npm run install:all

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Lint all code
npm run lint

# Format all code
npm run format

# Build all services for production
npm run build

# Clean all node_modules and build artifacts
npm run clean
```

### Strapi Commands

```bash
cd printshop-strapi

# Start development server (auto-reload)
npm run develop

# Start production server
npm start

# Build admin panel
npm run build

# Generate content type
npm run strapi generate

# Create admin user
npm run strapi admin:create-user
```

### Service-Specific Commands

**Production Dashboard:**
```bash
cd services/production-dashboard

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

**Analytics Service:**
```bash
cd services/api

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

**Frontend:**
```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

### Database Commands

```bash
# Backup database
pg_dump printshop_os > backup.sql

# Restore database
psql printshop_os < backup.sql

# Connect to database
psql printshop_os

# Reset database (WARNING: Deletes all data)
dropdb printshop_os && createdb printshop_os
```

### Redis Commands

```bash
# Connect to Redis CLI
redis-cli

# View all keys
redis-cli KEYS "*"

# Clear all cache
redis-cli FLUSHALL

# Monitor Redis commands
redis-cli MONITOR
```

---

## Testing

### Running Tests

**All tests:**
```bash
npm test
```

**Specific service:**
```bash
cd services/production-dashboard
npm test
```

**Watch mode (auto-rerun on changes):**
```bash
npm test -- --watch
```

**Coverage report:**
```bash
npm test -- --coverage
```

**Single test file:**
```bash
npm test time-clock.test.ts
```

### Writing Tests

**Test file structure:**
```typescript
// services/production-dashboard/tests/time-clock.test.ts
import { TimeClockService } from '../src/services/TimeClockService';

describe('TimeClockService', () => {
  let service: TimeClockService;

  beforeEach(() => {
    service = new TimeClockService();
  });

  describe('clockIn', () => {
    it('should clock in employee with valid PIN', async () => {
      const result = await service.clockIn('1234', 'JOB-001');
      expect(result.success).toBe(true);
    });

    it('should reject invalid PIN', async () => {
      await expect(service.clockIn('wrong', 'JOB-001'))
        .rejects.toThrow('Invalid PIN');
    });
  });
});
```

**Test naming conventions:**
- Test files: `{name}.test.ts`
- Describe blocks: Feature/class name
- It blocks: "should [expected behavior]"

---

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Production Dashboard",
      "type": "node",
      "request": "launch",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/services/production-dashboard/src/server.ts"],
      "cwd": "${workspaceFolder}/services/production-dashboard",
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Console Logging

**Best practices:**
```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('[TimeClockService] Clock in attempt:', { pin, jobNumber });
}

// Production-safe
logger.info('Employee clocked in', { employeeId, jobNumber });
```

### API Debugging

**Using curl:**
```bash
# Test time clock endpoint
curl -X POST http://localhost:3000/api/production/time-clock/in \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234", "jobNumber": "JOB-001"}'
```

**Using Postman:**
1. Import collection (if available)
2. Set environment variables
3. Test endpoints interactively

### Database Debugging

**Check database connections:**
```sql
SELECT * FROM pg_stat_activity WHERE datname = 'printshop_os';
```

**View slow queries:**
```sql
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Redis Debugging

**Monitor cache hits/misses:**
```bash
redis-cli INFO stats | grep keyspace
```

**View specific key:**
```bash
redis-cli GET cache:analytics:revenue:2024
```

---

## Code Style & Conventions

### TypeScript

**Use strict mode:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Type definitions:**
```typescript
// Good
interface TimeClockEntry {
  id: string;
  employeeId: string;
  clockIn: Date;
  clockOut?: Date;
}

// Avoid
const entry: any = { ... };
```

### Naming Conventions

```typescript
// Classes: PascalCase
class TimeClockService {}

// Interfaces: PascalCase with 'I' prefix (optional)
interface IEmployee {}

// Functions/variables: camelCase
const calculateLaborCost = () => {};
let totalHours = 0;

// Constants: SCREAMING_SNAKE_CASE
const MAX_CLOCK_ENTRIES = 100;
const CACHE_TTL = 3600;

// Files: kebab-case
time-clock.service.ts
order-history.component.tsx
```

### File Organization

```typescript
// Import order:
// 1. External dependencies
import express from 'express';
import { Request, Response } from 'express';

// 2. Internal modules (absolute imports)
import { TimeClockService } from '@/services/TimeClockService';

// 3. Relative imports
import { validatePin } from './validators';
import type { TimeClockEntry } from './types';

// 4. Type-only imports last
import type { Employee } from '@/types';
```

### Comments

**Good comments:**
```typescript
// Calculate labor cost based on time worked and hourly rate
// Includes overtime (1.5x) after 8 hours
const laborCost = calculateLaborCost(hours, rate);
```

**Avoid obvious comments:**
```typescript
// Bad - comment doesn't add value
// Set the name variable to John
const name = 'John';
```

**Use JSDoc for public APIs:**
```typescript
/**
 * Clock in an employee for a job
 * @param pin - Employee PIN (4 digits)
 * @param jobNumber - Job number to clock into
 * @returns Promise<TimeClockEntry>
 * @throws {Error} If PIN is invalid or employee already clocked in
 */
async clockIn(pin: string, jobNumber: string): Promise<TimeClockEntry> {
  // Implementation
}
```

---

## Git Workflow

### Branch Naming

```bash
# Feature branches (user-created)
feature/order-history
feature/analytics-dashboard

# Bug fixes
bugfix/time-clock-timezone
fix/cache-invalidation

# Agent-created branches (by GitHub Copilot)
copilot/production-dashboard-api
copilot/role-based-permissions
```

### Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes (no code change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
# Good
git commit -m "feat(time-clock): add PIN authentication"
git commit -m "fix(analytics): correct revenue calculation for refunds"
git commit -m "docs(readme): update setup instructions"

# Avoid
git commit -m "fixed stuff"
git commit -m "updates"
```

### Pull Request Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin feature/new-feature
   ```

4. **Create PR on GitHub:**
   - Draft initially
   - Mark ready when complete
   - CI checks run automatically

5. **Address review comments:**
   ```bash
   git add .
   git commit -m "fix: address review comments"
   git push
   ```

6. **Merge after approval:**
   - Use "Squash and merge" for clean history
   - Delete branch after merge

---

## Troubleshooting

### Common Issues

**1. Port already in use:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**2. Database connection error:**
```bash
# Check PostgreSQL is running
pg_isready

# Check connection settings in .env
cat .env | grep DATABASE
```

**3. Redis connection error:**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
redis-server
```

**4. Module not found:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**5. TypeScript errors:**
```bash
# Rebuild TypeScript
npm run build

# Check TypeScript version
npx tsc --version
```

**6. Docker issues:**
```bash
# Rebuild containers
docker-compose build --no-cache

# Remove all containers and volumes
docker-compose down -v

# View container logs
docker-compose logs <service-name>
```

### Getting Help

1. **Check documentation:**
   - PROJECT_OVERVIEW.md
   - ARCHITECTURE.md
   - SERVICE_DIRECTORY.md
   - This file (DEVELOPMENT_GUIDE.md)

2. **Check existing code:**
   - Look for similar implementations
   - Review tests for examples

3. **Check GitHub issues:**
   - Search for similar problems
   - Create new issue if needed

4. **Debug systematically:**
   - Reproduce the issue
   - Check logs
   - Isolate the problem
   - Test potential solutions

---

## Performance Tips

### Development Performance

**1. Use npm workspaces:**
Already configured - run commands from root.

**2. Enable caching:**
```bash
# TypeScript incremental compilation
# Already enabled in tsconfig.json

# Jest cache
# Already enabled by default
```

**3. Selective service start:**
```bash
# Only start services you need
docker-compose up strapi redis postgres
```

### Code Performance

**1. Use Redis caching:**
```typescript
// Always cache expensive operations
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await expensiveOperation();
await redis.setex(cacheKey, 3600, JSON.stringify(result));
```

**2. Optimize database queries:**
```typescript
// Use select to limit fields
const orders = await strapi.entityService.findMany('api::order.order', {
  fields: ['id', 'orderNumber', 'status'], // Only needed fields
  populate: ['customer'], // Only needed relations
  limit: 20 // Always paginate
});
```

**3. Avoid N+1 queries:**
```typescript
// Bad - N+1 query
const orders = await getOrders();
for (const order of orders) {
  const customer = await getCustomer(order.customerId); // N queries
}

// Good - batch load
const orders = await getOrders();
const customerIds = orders.map(o => o.customerId);
const customers = await getCustomers(customerIds); // 1 query
```

---

## Production Deployment (Planned)

### Environment Setup

**Production .env:**
```env
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host:5432/dbname
REDIS_URL=redis://user:pass@host:6379
OPENAI_API_KEY=sk-production-key
```

### Build Commands

```bash
# Build all services
npm run build

# Or individually
cd services/production-dashboard && npm run build
cd services/api && npm run build
cd frontend && npm run build
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis configured and accessible
- [ ] All tests passing
- [ ] Security scan complete (CodeQL)
- [ ] Performance tested
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] SSL certificates installed
- [ ] Domain configured

---

## Useful Resources

### Documentation
- [Strapi Docs](https://docs.strapi.io/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools
- [Redis Commander](http://joeferner.github.io/redis-commander/)
- [pgAdmin](https://www.pgadmin.org/)
- [Postman](https://www.postman.com/)
- [VS Code](https://code.visualstudio.com/)

### Project-Specific
- GitHub Repository: https://github.com/hypnotizedent/printshop-os
- Project Documentation: Root `*.md` files
- Issue Tracker: GitHub Issues

---

**Last Updated:** November 24, 2025  
**Next Review:** When major changes to development workflow  
**Maintained By:** Development team
