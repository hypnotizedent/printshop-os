# PrintShop OS - Project Overview

**Last Updated:** November 26, 2025  
**Repository:** hypnotizedent/printshop-os  
**Primary Branch:** main  
**Status:** Gap Analysis Complete - Implementation Phase Starting

## What is PrintShop OS?

PrintShop OS is a comprehensive, all-in-one management system for custom apparel print shops. It consolidates order management, production tracking, supplier integration, customer portals, and AI-powered features into a unified platform.

## Project Goals

1. **Replace Printavo** - Full operational replacement by January 1, 2026
2. **Real-time visibility** - Production floor, sales team, customers all connected
3. **Automation** - AI quote optimization, automated supplier sync, intelligent pricing
4. **Cost reduction** - Save $500+/month through Redis caching and automation
5. **Customer experience** - Self-service portal for orders, quotes, support

## Current Status (November 26, 2025)

### ✅ Operational Systems
- **Strapi CMS:** 10 content types, 336 customers, 831 orders imported
- **4 Services:** api, job-estimator, production-dashboard, supplier-sync
- **Admin UI:** http://localhost:1337/admin
- **Test Coverage:** 240+ tests across services

### 🎯 Critical Gaps Identified
**Priority 1 (BLOCKER):**
1. Authentication system (customer login, employee PIN)
2. Quote workflow backend (approval state machine)
3. Create orders/quotes from PrintShop OS

**Priority 2 (HIGH):**
4. Real-time job tracking (WebSocket → job status)
5. Support ticket API routes
6. Payment processing integration

**See:** `PRINTAVO_REPLACEMENT_PLAN.md` for full implementation strategy

## Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Language:** TypeScript (strict mode)
- **API Framework:** Express.js
- **CMS/Database:** Strapi 4.x with PostgreSQL 15+
- **Caching:** Redis 7+ (ioredis)
- **Real-time:** Socket.io WebSocket
- **Testing:** Jest with ts-jest
- **AI/ML:** OpenAI GPT-4 Vision API

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **UI Library:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS
- **State Management:** React Context + Hooks

### Infrastructure
- **Containers:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Security:** CodeQL scanning, JWT auth, bcrypt
- **Monitoring:** (Planned)

## Repository Structure

```
printshop-os/
├── services/                    # Backend microservices
│   ├── api/                    # Main API service
│   ├── production-dashboard/   # Production floor API + WebSocket
│   ├── customer-service-ai/    # AI quote optimizer
│   └── supplier-sync/          # Supplier integration layer
├── frontend/                    # React customer/admin UI
│   └── src/
│       ├── components/         # Reusable React components
│       │   ├── production/    # Production dashboard components
│       │   └── portal/        # Customer portal components
│       ├── pages/             # Page-level components
│       └── lib/               # Utilities and helpers
├── printshop-strapi/           # Strapi CMS backend
│   └── src/api/               # Strapi content types & controllers
├── data/                       # Data files and imports
├── docs/                       # Project documentation (legacy - being consolidated)
├── scripts/                    # Automation scripts
├── tests/                      # Integration tests
└── [Root Documentation]        # Current, authoritative docs (see below)
```

## Current Documentation (Authoritative)

**Read these first - they're kept up-to-date:**

1. **PROJECT_OVERVIEW.md** (this file) - High-level project understanding
2. **ARCHITECTURE.md** - System design, data flow, service interactions
3. **SERVICE_DIRECTORY.md** - Where everything lives, what each service does
4. **DEVELOPMENT_GUIDE.md** - Setup, commands, workflows, testing
5. **AGENT_PR_STATUS_REPORT.md** - Current PR status (updated Nov 24, 2025)

**Legacy docs (reference only, may be outdated):**
- `docs/` folder - Being phased out, consolidated into root docs
- Epic-specific docs (AI_AUTOMATION_EPIC.md, etc.) - Historical context
- Session completion reports - Point-in-time snapshots

## Active Development Status (Nov 24, 2025)

### ✅ Recently Merged (Past Week)
- PR #104: Redis Caching Layer (2,741 lines, 117 tests)
- PR #102: Production Dashboard Config (4,785 lines)

### 🔄 Ready for Review (8 PRs - Nov 24, 2025)
1. **PR #110** - Analytics & Reporting API (24 tests)
2. **PR #109** - AI Quote Optimizer (19 tests)
3. **PR #108** - Production Dashboard API (35 tests)
4. **PR #142** - Role-Based Permissions (28 tests)
5. **PR #139** - Time Clock & Job Detail (20 tests)
6. **PR #137** - SOP Library (25 tests)
7. **PR #136** - Order History (19 tests)
8. **PR #138** - Support Ticketing (21 tests)

**Total Tests:** 240+ tests across these 8 PRs  
**CI Status:** Running (triggered automatically when marked ready)

### ⚠️ Needs Attention
- **PR #141** - Data Normalization (49 tests, merge conflicts)
- **PR #140** - User Authentication (planning only, no code)

### 📊 Development Phases

**Phase 1: Foundation** ✅ Complete
- Strapi CMS setup
- Redis caching
- Basic infrastructure

**Phase 2: Core Features** 🔄 In Progress (8 PRs ready)
- Production dashboard
- Customer portal
- Time tracking
- Support system

**Phase 3: Advanced Features** 🔄 In Progress (3 PRs ready)
- AI quote optimization
- Analytics & reporting
- Supplier integration

**Phase 4: Automation Tools** 🆕 Planned
- Label formatter (Issue #143 - Agent assigned)
- Additional workflow automation

## Quick Start for New Contributors

1. **Read this file first** - Understand the big picture
2. **Read ARCHITECTURE.md** - Understand how systems connect
3. **Read SERVICE_DIRECTORY.md** - Know where to find things
4. **Read DEVELOPMENT_GUIDE.md** - Set up your environment
5. **Check AGENT_PR_STATUS_REPORT.md** - See what's happening now

## Key Concepts

### Services Architecture
- **Microservices approach** - Each service is independent
- **Strapi as central database** - Single source of truth
- **Redis for caching** - Performance optimization
- **WebSocket for real-time** - Production floor updates

### Data Flow
1. Frontend → API Service → Strapi CMS → PostgreSQL
2. External integrations → Supplier Sync → Strapi
3. Production floor → Production Dashboard API (WebSocket) → Strapi
4. Customers → Customer Portal → API Service → Strapi

### Authentication & Authorization
- **JWT tokens** for API authentication
- **Role-based access control** (Admin, Manager, Supervisor, Operator, Read-Only)
- **PIN authentication** for production floor (bcrypt hashed)
- **OAuth** for supplier integrations

## Common Workflows

### Adding a New Feature
1. Create issue in GitHub
2. Agent creates feature branch
3. Implement in appropriate service (see SERVICE_DIRECTORY.md)
4. Write tests (Jest)
5. Create PR (draft)
6. Mark ready when complete
7. CI checks run automatically
8. Code review → Merge

### Working with Strapi
- Content types live in `printshop-strapi/src/api/`
- Custom controllers for complex logic
- API routes auto-generated + custom routes
- Always update schema.json when changing structure

### Running Tests
```bash
# All tests
npm test

# Specific service
cd services/production-dashboard && npm test

# Watch mode
npm test -- --watch
```

## Environment Setup

See `DEVELOPMENT_GUIDE.md` for detailed setup instructions.

**Required:**
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional but recommended)

**Environment Variables:**
- `.env` - Main configuration
- `.env.example` - Template (always keep updated)

## Important Notes

### File Organization Rules
1. **Root docs are authoritative** - PROJECT_OVERVIEW.md, ARCHITECTURE.md, etc.
2. **Service-specific docs live with the service** - services/*/README.md
3. **Legacy docs in `/docs`** - Reference only, being consolidated
4. **No duplicate documentation** - One source of truth per topic
5. **Update docs when changing code** - Keep them in sync

### Naming Conventions
- **Services:** `kebab-case` (production-dashboard)
- **Components:** `PascalCase` (TimeClock.tsx)
- **Files:** `kebab-case.ts` (time-clock.service.ts)
- **Variables:** `camelCase` (totalRevenue)
- **Constants:** `SCREAMING_SNAKE_CASE` (CACHE_TTL)

### Git Workflow
- **Main branch:** Production-ready code
- **Feature branches:** `copilot/feature-name` (agent-created)
- **PRs:** Draft → Ready for Review → CI checks → Review → Merge
- **Commits:** Descriptive messages, reference issues

## Support & Resources

### Getting Help
1. Check this documentation first
2. Review ARCHITECTURE.md for system understanding
3. Check SERVICE_DIRECTORY.md to find the right service
4. Review existing tests for examples
5. Check GitHub issues for similar problems

### Key Files to Understand
- `package.json` files - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Test configuration
- `docker-compose.yml` - Service orchestration
- `.env.example` - Configuration options

## Maintenance

### Documentation Updates
- **When:** After every significant change
- **What:** Update relevant root documentation files
- **How:** Direct edits to markdown files
- **Who:** Anyone making changes must update docs

### Cleaning Up
- **Delete outdated docs** - If replaced by current documentation
- **Archive old reports** - Move session summaries to `docs/archive/`
- **Keep root clean** - Only current, essential docs at root level
- **Service docs with services** - Don't scatter documentation

## Project Health Indicators

**As of Nov 24, 2025:**
- ✅ **8 PRs ready for review** - Significant progress
- ✅ **240+ tests written** - Good coverage
- ✅ **0 security vulnerabilities** - Clean security scans
- ✅ **5 recent merges** - Active development
- ⚠️ **19 draft PRs total** - Need categorization
- ⚠️ **24 open issues** - Backlog management needed

## Next Steps (Strategic)

1. **Review & merge 8 ready PRs** - Unlock next phase
2. **Fix PR #141 merge conflict** - Complete supplier integration
3. **Close/implement PR #140** - User auth needs decision
4. **Categorize remaining PRs** - Triage draft PRs
5. **Production deployment planning** - Prepare for launch
6. **Documentation consolidation** - Archive legacy docs

## Version History

- **Nov 24, 2025** - Initial comprehensive documentation
- **Nov 23, 2025** - Merged Redis caching, dashboard config
- **Nov 21, 2025** - Repository created, initial structure

---

**For the most current information, always check:**
1. This file (PROJECT_OVERVIEW.md)
2. AGENT_PR_STATUS_REPORT.md
3. GitHub PR/Issue pages
4. Git commit history

**Questions?** Check ARCHITECTURE.md → SERVICE_DIRECTORY.md → DEVELOPMENT_GUIDE.md in that order.
