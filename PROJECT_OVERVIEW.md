# PrintShop OS - Project Overview

**Last Updated:** November 30, 2025  
**Repository:** hypnotizedent/printshop-os  
**Primary Branch:** main  
**Status:** V1 Release Complete - Ready for Production Deployment

## What is PrintShop OS?

PrintShop OS is a comprehensive, all-in-one management system for custom apparel print shops. It consolidates order management, production tracking, supplier integration, customer portals, and AI-powered features into a unified platform.

## Project Goals

1. **Replace Printavo** - Full operational replacement by January 1, 2026
2. **Real-time visibility** - Production floor, sales team, customers all connected
3. **Automation** - AI quote optimization, automated supplier sync, intelligent pricing
4. **Cost reduction** - Save $500+/month through Redis caching and automation
5. **Customer experience** - Self-service portal for orders, quotes, support

## Current Status (November 30, 2025)

### ✅ V1 Release Complete
All major features have been implemented and merged:

- **Strapi CMS:** 10+ content types, 3,317 customers, 12,854 orders imported
- **4 Backend Services:** api, job-estimator, production-dashboard, supplier-sync
- **Frontend:** Full React 19 application with all V1 features
- **AI Integration:** Customer Service AI with RAG, Milvus Vector Database
- **Infrastructure:** Business Services Stack (Invoice Ninja, n8n, Paperless, Penpot, Vaultwarden)

### 🎯 V1 Features Delivered

**Dashboard & Analytics:**
- Dashboard with widgets (Revenue, Orders, Production, Inventory)
- Reporting Dashboard (Sales, Production, Customer reports)

**Order Management:**
- Order list, detail, create, edit functionality
- Quote Builder with real-time pricing
- Invoice Generation with preview
- Payment Tracking with history

**Customer Management:**
- Customer search, detail, create functionality
- Customer Portal with routing

**Production Management:**
- Production Dashboard (Job Queue, Supervisor view)
- Production Calendar with capacity view
- Inventory/Product Catalog UI

**AI & Automation:**
- Customer Service AI with RAG
- Milvus Vector Database (designs, customers, orders, knowledge_base collections)
- Sentiment Analysis
- Design Analysis (color count, gradients, print recommendations)

**See:** `V1_RELEASE_NOTES.md` for complete feature list and deployment instructions

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

## Active Development Status (Nov 30, 2025)

### ✅ V1 Release PRs Merged (November 30, 2025)
- PR #147: Self-Hosted Business Services Stack
- PR #148: Milvus Vector Database for AI-Powered Features
- PR #157: Production Dashboard (Epic #86)
- PR #159: AI & Automation Epic - Customer Service AI with RAG
- PR #178: Wire V1 Frontend to Strapi Backend - Unified API client
- PR #179: Invoice Generation Feature with UI components
- PR #180: Payment Tracking Feature for orders
- PR #181: Inventory/Product Catalog Management UI
- PR #182: Reporting and Analytics Dashboard
- PR #183: Production Schedule Calendar View
- PR #189: Customer Portal Wiring (react-router-dom)
- PR #190: AI Customer Service with RAG (rebased)
- PR #191: Payment Tracking Chain (consolidated)
- PR #192: Invoice Generation Chain (consolidated)
- PR #193: Review and fix open/closed PRs

### 📊 Development Phases

**Phase 1: Foundation** ✅ Complete
- Strapi CMS setup
- Redis caching
- Basic infrastructure

**Phase 2: Core Features** ✅ Complete
- Production dashboard
- Customer portal
- Time tracking
- Support system

**Phase 3: Advanced Features** ✅ Complete
- AI quote optimization
- Analytics & reporting
- Supplier integration

**Phase 4: Automation Tools** 🔄 In Progress
- Label formatter
- Additional workflow automation
- V2 feature planning

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

**As of Nov 30, 2025:**
- ✅ **V1 Release Complete** - All major features merged
- ✅ **15 PRs merged** - Significant V1 development
- ✅ **240+ tests written** - Good coverage
- ✅ **0 security vulnerabilities** - Clean security scans
- ✅ **All V1 epics complete** - #86, #87, #88 closed
- ✅ **Ready for production** - Deployment documentation available

## Next Steps (V2 Planning)

1. **Production deployment** - Deploy V1 to production
2. **User acceptance testing** - Validate with real users
3. **V2 feature planning** - Gather feedback for next release
4. **Performance optimization** - Monitor and tune
5. **Documentation refinement** - Update based on user feedback
6. **Stale branch cleanup** - Remove merged feature branches

## Version History

- **Nov 30, 2025** - V1 Release Complete
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
