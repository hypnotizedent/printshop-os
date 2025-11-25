# Enterprise Foundation - Organization Strategy

**Last Updated:** November 25, 2025  
**Status:** Active  
**Purpose:** Single source of truth for project organization and agent guidelines

---

## Project Audit Results (Nov 25, 2025)

### Documentation Inventory
- **Total Files**: 218 .md files across entire project
- **Root Level**: 12 documentation files (architecture, status, roadmap, etc.)
- **Services**: 7 active services with 2-13 .md files each
- **Docs Folder**: Well-organized by category (api/, architecture/, deployment/, epics/)
- **README Files**: 23 across different services and folders

### Services Inventory
1. **api/** - Central API service (Printavo sync, quotes, supplier connectors)
2. **supplier-sync/** - TypeScript supplier integration service (AS Colour complete)
3. **customer-service-ai/** - AI automation
4. **job-estimator/** - Job estimation tools
5. **pricing/** - Pricing calculations (11 planning docs - needs consolidation)
6. **production-dashboard/** - Production tracking
7. **metadata-extraction/** - Image scraper and data processors

### Critical Issues Identified

#### 1. Duplicate Supplier-Sync Implementations ⚠️
**Active:** `/services/supplier-sync/` (TypeScript, AS Colour production-ready)
- TypeScript with CLI tools
- Client/transformer architecture
- Cache service (Redis, TTL strategy)
- 10 .md files, 3,000+ lines documentation
- JSONL file storage
- Status: ✅ Production ready

**Legacy:** `/services/api/supplier-sync/` (JavaScript, unclear status)
- JavaScript with Express server
- Prisma ORM database models
- Redis cache (117 tests, cost tracking)
- Cron job scheduling (node-cron)
- 3 cache documentation files
- Status: ⚠️ Archive recommended - features duplicated in new implementation

**Resolution:** Archive legacy to `/docs/archive/legacy-supplier-sync/`

#### 2. Daily Log Duplication ✅ RESOLVED
- ❌ Deleted: `/services/supplier-sync/TODAYS_WORK.md`
- ✅ Consolidated to: `/DEVELOPMENT_LOG.md` (root level only)

#### 3. Documentation Fragmentation
- **Pricing Service**: 11 planning docs (excessive, consolidate to 3)
- **IMPLEMENTATION_SUMMARY Files**: 6 files (acceptable - one per service)
- **Docker Compose Files**: 4 files without usage documentation

---

## Organization Structure (Validated Nov 25)

### Root Level Documentation
**Purpose:** High-level, cross-cutting project documentation

**Current Files (12):**
- `README.md` - Project overview, quickstart, setup
- `STATUS.md` - Current system state (242 lines)
- `ROADMAP.md` - Strategic direction (383 lines)
- `DEVELOPMENT_LOG.md` - Daily work journal (single source of truth)
- `ENTERPRISE_FOUNDATION.md` - This file (organization strategy)
- `SERVICE_DIRECTORY.md` - Service index and status
- `ARCHITECTURE.md` - System architecture
- `CHANGELOG.md` - Release notes
- `DEVELOPMENT_GUIDE.md` - Developer setup
- `SECURITY.md` - Security policies
- `SETUP_AI_ASSISTANT.md` - AI configuration
- `PROJECT_OVERVIEW.md` - Project vision

**Guidelines:**
- ✅ Keep architecture, status, roadmap at root
- ✅ Single daily log (DEVELOPMENT_LOG.md only)
- ❌ No service-specific daily logs
- ❌ No duplicate planning documents

### Services Structure
**Purpose:** Service-specific code and documentation

**Pattern:**
```
services/<service-name>/
├── README.md                    ← Service overview
├── IMPLEMENTATION_SUMMARY.md    ← Implementation status
├── package.json / requirements.txt
├── src/                         ← Source code
├── tests/                       ← Service-specific tests
└── docs/                        ← Service-specific docs
    ├── suppliers/               ← (for supplier-sync)
    ├── examples/
    └── guides/
```

**Example (supplier-sync):**
- `services/supplier-sync/README.md` - Quick start
- `services/supplier-sync/COMPLETE_DOCUMENTATION.md` - Full reference
- `services/supplier-sync/ARCHITECTURE.md` - Service architecture
- `services/supplier-sync/docs/` - Supplier-specific docs

### Docs Folder Structure
**Purpose:** Cross-service documentation and project-wide guides

**Current Organization:**
```
docs/
├── api/                  ← API documentation
├── architecture/         ← System design
├── deployment/          ← Deployment guides
├── epics/               ← Project epics
├── phases/              ← Phase planning
├── reference/           ← Reference materials
├── setup/               ← Setup guides
├── archive/             ← Deprecated/legacy docs
└── project-management/  ← PM artifacts
```

### Docker Compose Files
**Purpose:** Different deployment configurations

**Files:**
- `docker-compose.yml` - Production deployment
- `docker-compose.local.yml` - Local development (Appsmith + MongoDB + Redis)
- `docker-compose.ai.yml` - AI services
- `docker-compose.label-formatter.yml` - Label formatter service

**Action Required:** Document usage in root README.md

---

## Agent Guidelines (Critical - Follow These Rules)

### 1. Daily Work Logging
**Rule:** All daily work goes in `/DEVELOPMENT_LOG.md` only
- ✅ Update DEVELOPMENT_LOG.md with date-stamped entries
- ❌ Never create service-specific daily logs (e.g., TODAYS_WORK.md)
- ❌ Never create date-stamped log files (e.g., 2025-11-25.md)

**Format:**
```markdown
## YYYY-MM-DD

### [Feature/Area] - Status Emoji

#### What Was Implemented
- Bullet points

#### Results
- Validation details
```

### 2. Documentation Placement
**Decision Tree:**

**Q1: Is this service-specific?**
- YES → Place in `/services/<service-name>/docs/`
- NO → Continue to Q2

**Q2: Is this cross-service or architectural?**
- YES → Place in `/docs/` (organized by category)
- NO → Continue to Q3

**Q3: Is this project-wide status/planning?**
- YES → Update existing root-level file (STATUS.md, ROADMAP.md, etc.)
- NO → Ask: "Should this be in an existing doc?"

**Examples:**
- AS Colour integration guide → `/services/supplier-sync/docs/suppliers/ASCOLOUR.md`
- API authentication patterns → `/docs/api/authentication.md`
- Deployment checklist → `/docs/deployment/checklist.md`
- Today's work → `/DEVELOPMENT_LOG.md`

### 3. Before Creating New Documentation
**Checklist:**
1. Search for existing docs covering this topic
2. Check if content belongs in existing file
3. Verify correct folder per decision tree above
4. Use IMPLEMENTATION_SUMMARY.md for service summaries (one per service)
5. Avoid duplicate planning documents

### 4. Service Documentation Standard
**Required Files:**
- `README.md` - Quick start, basic usage
- `IMPLEMENTATION_SUMMARY.md` - Current implementation status

**Optional Files:**
- `ARCHITECTURE.md` - Service-specific architecture
- `COMPLETE_DOCUMENTATION.md` - Comprehensive reference
- `TESTING_GUIDE.md` - Testing instructions
- `docs/` folder - Extended documentation

### 5. Cleanup Protocol
**When you notice duplication:**
1. Identify canonical location (use decision tree)
2. Consolidate content to canonical location
3. Delete duplicate files
4. Update DEVELOPMENT_LOG.md with cleanup action
5. Commit with message: `docs: consolidate [topic] documentation`

---

## Navigation Guide

### "Where do I find...?"

**Daily work updates?**
→ `/DEVELOPMENT_LOG.md`

**Project roadmap?**
→ `/ROADMAP.md`

**Current system status?**
→ `/STATUS.md`

**Service list and status?**
→ `/SERVICE_DIRECTORY.md`

**AS Colour integration guide?**
→ `/services/supplier-sync/docs/suppliers/ASCOLOUR.md`

**How to add a new supplier?**
→ `/services/supplier-sync/docs/ADDING_NEW_SUPPLIER.md`

**API documentation?**
→ `/docs/api/`

**Architecture decisions?**
→ `/docs/architecture/` or `/ARCHITECTURE.md`

**Deployment instructions?**
→ `/docs/deployment/`

**Docker setup?**
→ Root `README.md` (Docker section)

---

## Cleanup Action Plan

### Phase 1: Immediate (This Week) ✅
- ✅ Audit legacy supplier-sync for unique code
- ✅ Consolidate daily logs (TODAYS_WORK.md → DEVELOPMENT_LOG.md)
- ✅ Delete duplicate daily log file
- 🚧 Archive legacy supplier-sync to `/docs/archive/`
- 🚧 Document docker-compose usage in root README.md

### Phase 2: Short Term (This Month)
- Consolidate pricing service docs (11 → 3 files)
- Standardize IMPLEMENTATION_SUMMARY.md format across all services
- Update SERVICE_DIRECTORY.md with current service status
- Add organization checklist to CONTRIBUTING.md

### Phase 3: Ongoing
- Enforce guidelines in PR reviews
- Quarterly documentation review (check for duplicates)
- Update this file when organization patterns change
- Maintain single source of truth principle

---

## Success Metrics

**Documentation Quality:**
- ✅ Single daily log (DEVELOPMENT_LOG.md)
- ✅ No duplicate supplier-sync implementations
- 🎯 All services have README.md + IMPLEMENTATION_SUMMARY.md
- 🎯 Clear docker-compose usage documentation
- 🎯 Consistent doc placement per guidelines

**Developer Experience:**
- 🎯 New developers find docs in expected locations
- 🎯 No confusion about where to log daily work
- 🎯 Clear service boundaries and responsibilities
- 🎯 Easy to find examples and guides

**Maintenance:**
- 🎯 Quarterly review finds minimal duplication
- 🎯 PR reviews catch misplaced documentation
- 🎯 DEVELOPMENT_LOG.md shows clear project progression

---

## Version History

**v2.0 (Nov 25, 2025):**
- Comprehensive audit of 218 .md files
- Identified and resolved duplicate supplier-sync implementations
- Established agent guidelines (5 simple rules)
- Created documentation decision tree
- Consolidated daily logs to single source of truth

**v1.0 (Initial):**
- Basic reorganization plan
- Phase-based implementation strategy
