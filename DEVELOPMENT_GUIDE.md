# PrintShop OS - Development Guide

**Last Updated:** November 25, 2024

## Prerequisites

### Required Software
- **Node.js:** 20+ (LTS recommended)
- **npm:** 9+ (comes with Node.js)
- **PostgreSQL:** 15+
- **Redis:** 7+
- **MongoDB:** 6+ (for Appsmith)
- **Git:** Latest version
- **Docker:** 24+ (recommended)
- **Docker Compose:** 2+ (recommended)

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

## Quick Start (Docker Compose)

The easiest way to run the full PrintShop OS stack locally:

```bash
# Clone the repository
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os

# Start all services
docker compose up -d

# Run system test
./test-system.sh

# View logs
docker compose logs -f
```

**Access Points:**
- **Strapi Admin:** http://localhost:1337/admin
- **Strapi API:** http://localhost:1337/api
- **Appsmith Dashboard:** http://localhost:8080
- **Frontend:** http://localhost:3000
- **Database:** localhost:5432
- **Redis:** localhost:6379
- **MongoDB:** localhost:27017

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
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=printshop
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=secure_password_change_this

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Strapi
STRAPI_APP_KEYS=generate_random_keys_here
STRAPI_API_TOKEN_SALT=generate_random_salt_here
STRAPI_ADMIN_JWT_SECRET=generate_random_secret_here
STRAPI_JWT_SECRET=generate_random_secret_here

# OpenAI (optional - for AI features)
OPENAI_API_KEY=sk-your-key-here

# App Configuration
NODE_ENV=development
TZ=America/New_York
```

**Generate secure random values:**

```bash
# Generate random keys/secrets (run 4 times for each value)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Start Services

**Using Docker (Recommended):**

```bash
# Start all services
docker compose up -d

# Wait for services to be healthy
docker compose ps

# Run system test
./test-system.sh

# Services will be available at URLs listed above
```

**Manual Installation (Advanced):**

```bash
# Start PostgreSQL
docker run -d --name printshop-postgres \
  -e POSTGRES_USER=strapi \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=printshop \
  -p 5432:5432 \
  postgres:15-alpine

# Start Redis
docker run -d --name printshop-redis \
  -p 6379:6379 \
  redis:7-alpine

# Install Strapi dependencies
cd printshop-strapi
npm install

# Start Strapi
npm run develop

# Install Pricing Engine dependencies
cd ../services/job-estimator
npm install

# Run Pricing Engine tests
npm test
```

### 4. First-Time Strapi Setup

1. Navigate to http://localhost:1337/admin
2. Create admin user account
3. Strapi will auto-generate database schema
4. Generate API token: Settings → API Tokens → Create New
5. Copy token to `.env` file

---

## Development Workflow

### Starting Services

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d strapi

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f strapi

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

### Running Tests

```bash
# System test (all services)
./test-system.sh

# Pricing Engine tests
cd services/job-estimator
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Development Commands

```bash
# Strapi development mode (with admin panel)
cd printshop-strapi
npm run develop

# Strapi production mode
npm start

# Build Strapi admin panel
npm run build

# Pricing Engine API (development)
cd services/job-estimator
npm run api:dev

# Pricing Engine API (production)
npm run api:start

# Frontend development server
cd frontend
npm run dev

# Frontend production build
npm run build
```

---

## Project Structure

```
printshop-os/
├── services/
│   ├── job-estimator/           # Pricing Engine (PR #98)
│   │   ├── lib/
│   │   │   ├── pricing-rules-engine.ts
│   │   │   ├── pricing-api.ts
│   │   │   └── api-server.ts
│   │   └── tests/               # 85 tests
│   │
│   ├── api/                     # Additional APIs
│   └── customer-service-ai/     # AI services
│
├── printshop-strapi/            # Strapi CMS + Workflow (PR #99)
│   ├── src/
│   │   ├── api/
│   │   │   ├── quote/
│   │   │   ├── order/
│   │   │   └── job/
│   │   └── services/
│   │       ├── workflow.ts      # State machine
│   │       ├── queue.ts         # Bull Queue
│   │       ├── notification.ts  # Email delivery
│   │       └── audit.ts         # Activity logging
│   └── tests/                   # 30 tests
│
├── frontend/                    # React + Vite UI
│   └── src/
│
├── docs/                        # Documentation
│   ├── archive/                 # Historical docs
│   ├── api/
│   ├── architecture/
│   └── phases/
│
├── scripts/                     # Utility scripts
├── tests/                       # Integration tests
├── data/                        # Data storage
│
├── docker-compose.yml           # Main services
├── docker-compose.ai.yml        # AI services
├── docker-compose.local.yml     # Local overrides
├── docker-compose.label-formatter.yml
│
├── STATUS.md                    # Current system state
├── ROADMAP.md                   # Future plans
├── README.md                    # Getting started
├── ARCHITECTURE.md              # System design
├── test-system.sh               # System test script
└── .env                         # Environment variables
```

---

## Common Tasks

### Database Operations

```bash
# Backup database
docker compose exec postgres pg_dump -U strapi printshop > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U strapi printshop

# Connect to database
docker compose exec postgres psql -U strapi printshop

# Check database connection
docker compose exec postgres pg_isready -U strapi
```

### Redis Operations

```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Check Redis health
docker compose exec redis redis-cli PING

# View all keys
docker compose exec redis redis-cli KEYS "*"

# Clear all cache
docker compose exec redis redis-cli FLUSHALL

# Monitor Redis commands
docker compose exec redis redis-cli MONITOR
```

### Service Management

```bash
# Restart single service
docker compose restart strapi

# Rebuild service
docker compose up -d --build strapi

# View service status
docker compose ps

# View resource usage
docker stats

# Remove stopped containers
docker compose rm

# Pull latest images
docker compose pull
```

---

## Testing

### System Test

```bash
# Run comprehensive system test
./test-system.sh

# Expected output: 12-15 tests passing
# Tests: Docker services, databases, Strapi API, Pricing Engine, Workflow Automation
```

### Unit Tests

```bash
# Pricing Engine (85 tests)
cd services/job-estimator
npm test

# Strapi/Workflow (30 tests)
cd printshop-strapi
npm test

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Single test file
npm test pricing-rules-engine.test.ts
```

### Integration Tests

```bash
# Test Pricing Engine API
curl -X POST http://localhost:3001/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "product": "t-shirt",
      "quantity": 100,
      "colors": 2,
      "printLocations": ["front", "back"]
    }]
  }'

# Test Strapi API
curl http://localhost:1337/api/orders

# Test health endpoints
curl http://localhost:1337/_health
curl http://localhost:3001/health
```

---

## Code Style & Conventions

### TypeScript

```typescript
// Use strict typing
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: Customer;
  items: OrderItem[];
  createdAt: Date;
}

// Avoid 'any' type
// Bad
const data: any = await fetchData();

// Good
const data: Order[] = await fetchOrders();
```

### Naming Conventions

```typescript
// Classes: PascalCase
class PricingRulesEngine {}
class WorkflowService {}

// Interfaces: PascalCase
interface Order {}
interface PricingRule {}

// Functions/variables: camelCase
const calculatePrice = () => {};
let totalCost = 0;

// Constants: SCREAMING_SNAKE_CASE
const MAX_QUANTITY = 10000;
const CACHE_TTL_SECONDS = 3600;

// Files: kebab-case
pricing-rules-engine.ts
workflow-service.ts
order-repository.ts
```

### File Organization

```typescript
// Import order:
// 1. External dependencies
import express from 'express';
import { Request, Response } from 'express';

// 2. Internal modules
import { PricingRulesEngine } from './pricing-rules-engine';
import { WorkflowService } from './workflow-service';

// 3. Types
import type { Order, PricingRule } from './types';

// 4. Constants
import { MAX_QUANTITY, CACHE_TTL } from './constants';
```

---

## Git Workflow

### Branch Naming

```bash
# Feature branches
feature/order-history
feature/analytics-dashboard

# Bug fixes
fix/time-clock-timezone
bugfix/cache-invalidation

# Agent-created branches (GitHub Copilot)
copilot/production-dashboard
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
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(pricing): add volume discount tiers"
git commit -m "fix(workflow): correct order status transition"
git commit -m "docs(readme): update setup instructions"
git commit -m "test(pricing): add edge case tests"
git commit -m "chore: update dependencies"
```

---

## Troubleshooting

### Common Issues

**1. Services won't start:**
```bash
# Check docker is running
docker ps

# Check docker-compose syntax
docker compose config

# Restart services
docker compose down && docker compose up -d

# View error logs
docker compose logs
```

**2. Port already in use:**
```bash
# Find process using port
lsof -i :1337

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

**3. Database connection error:**
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check connection
docker compose exec postgres pg_isready -U strapi

# View database logs
docker compose logs postgres

# Verify .env settings
cat .env | grep DATABASE
```

**4. Redis connection error:**
```bash
# Check Redis is running
docker compose ps redis

# Test connection
docker compose exec redis redis-cli PING

# View Redis logs
docker compose logs redis
```

**5. Strapi won't start:**
```bash
# Clear Strapi cache
rm -rf printshop-strapi/.cache printshop-strapi/build

# Rebuild
cd printshop-strapi
npm run build

# Check logs
docker compose logs strapi
```

**6. Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

**7. Test failures:**
```bash
# Update snapshots
npm test -- -u

# Clear Jest cache
npm test -- --clearCache

# Run in verbose mode
npm test -- --verbose
```

### Performance Issues

**Slow Docker:**
```bash
# Prune unused resources
docker system prune -a

# Increase Docker memory (Docker Desktop settings)
# Memory: 4GB+ recommended
```

**Slow npm install:**
```bash
# Use npm ci for faster installs
npm ci

# Clear npm cache
npm cache clean --force
```

---

## Environment Variables Reference

### Core Services

```env
# General
NODE_ENV=development
LOG_LEVEL=info
TZ=America/New_York

# PostgreSQL
POSTGRES_USER=strapi
POSTGRES_PASSWORD=secure_password_change_this
POSTGRES_DB=printshop
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Strapi
STRAPI_HOST=0.0.0.0
STRAPI_PORT=1337
STRAPI_URL=http://localhost:1337
STRAPI_APP_KEYS=key1,key2,key3,key4
STRAPI_API_TOKEN_SALT=your-salt-here
STRAPI_ADMIN_JWT_SECRET=your-secret-here
STRAPI_JWT_SECRET=your-jwt-secret-here

# MongoDB (Appsmith)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=secure_password
MONGO_INITDB_DATABASE=appsmith

# Appsmith
APPSMITH_ENCRYPTION_PASSWORD=secure_password
APPSMITH_ENCRYPTION_SALT=secure_salt
```

### Optional Services

```env
# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OpenAI (AI features)
OPENAI_API_KEY=sk-your-key-here

# Supplier APIs (future)
SS_ACTIVEWEAR_API_KEY=
SANMAR_CLIENT_ID=
SANMAR_CLIENT_SECRET=
AS_COLOUR_API_KEY=
```

---

## Quick Reference Commands

```bash
# Start everything
docker compose up -d && ./test-system.sh

# View all logs
docker compose logs -f

# Restart a service
docker compose restart strapi

# Clean slate (remove all data)
docker compose down -v && docker compose up -d

# Check service health
docker compose ps
docker compose exec postgres pg_isready -U strapi
docker compose exec redis redis-cli PING

# Run tests
./test-system.sh
cd services/job-estimator && npm test

# View database
docker compose exec postgres psql -U strapi printshop

# View Redis
docker compose exec redis redis-cli

# Backup database
docker compose exec postgres pg_dump -U strapi printshop > backup.sql
```

---

## Getting Help

1. **Check current status:**
   - Read `STATUS.md` for system state
   - Run `./test-system.sh` to verify health

2. **Check documentation:**
   - `STATUS.md` - Current state
   - `ROADMAP.md` - Future plans
   - `ARCHITECTURE.md` - System design
   - `README.md` - Getting started

3. **Check logs:**
   ```bash
   docker compose logs [service]
   ```

4. **Check GitHub:**
   - Issues: https://github.com/hypnotizedent/printshop-os/issues
   - PRs: https://github.com/hypnotizedent/printshop-os/pulls

---

**Last Updated:** November 25, 2024  
**Maintained By:** Development team
