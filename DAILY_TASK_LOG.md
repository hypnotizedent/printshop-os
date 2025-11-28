# PrintShop OS - Daily Task Log

> **PURPOSE:** This is the single source of truth for session continuity. Read this FIRST at the start of every Copilot conversation.
> 
> **RULE:** At the start of every new conversation, tell Copilot: "Read DAILY_TASK_LOG.md before doing anything"

---

## 📊 Current State (Last Updated: November 28, 2025)

### Data Status
| Data Type | Source Count | In Strapi | Status |
|-----------|--------------|-----------|--------|
| Customers | 3,358 | 3,319 | ✅ Imported |
| Orders | 12,867 | 12,868 | ✅ Imported |
| Line Items | 44,158 | 0 | ❌ Pending |
| Products | 105 (Printavo) + 400K (Suppliers) | 0 | ❌ Pending |
| Artwork | 106,303 files (205 GB) | 0 | ❌ Scraped locally, not uploaded |

### Infrastructure Status
| Service | Container | Status | Port |
|---------|-----------|--------|------|
| PostgreSQL | printshop-postgres | ✅ Healthy | 5432 |
| Redis | printshop-redis | ✅ Healthy | 6379 |
| Strapi CMS | printshop-strapi | ⚠️ Unhealthy (but running) | 1337 |
| API Service | printshop-api | ✅ Healthy | 3002 |
| Frontend | printshop-frontend | ✅ Healthy | 3000 |
| MinIO | printshop-minio | ✅ Healthy | 9000/9001 |

### Credentials (Reference)
```
Strapi Admin: ronny@ronny.works / PrintShop2025!
Strapi API Token: dc23c1734c2dea...d5090951e (full in .env)
S&S Activewear: 31810 / 07d8c0de-a385-4eeb-b310-8ba7bc55d3d8
SanMar SFTP: 180164 / dMvGlWLTScz2Hh (port 2200)
AS Colour: Subscription-Key in .env + JWT Bearer
Printavo: ronny@mintprints.com / tApazCfvuQE-0Tl3YLIofg
```

---

## 🎯 Immediate Priorities (P0)

1. **Import Line Items** - 44,158 items ready in `data/raw/printavo-exports/complete_2025-11-27_14-20-05/lineitems.json`
   - Script ready: `scripts/sync-line-items.py`
   - Checkpoint: `data/line-item-import-checkpoint.json`

2. **Upload Artwork to MinIO** - 205 GB in `data/artwork/by_order/`
   - Script ready: `scripts/sync-artwork-minio.py`
   - 9,307 orders with artwork indexed

3. **Fix Strapi Health** - Container running but marked unhealthy

---

## 📅 Comprehensive Daily Log

### Day 1: November 21, 2025 (Friday) - Project Inception

**What Happened:**
- Created printshop-os repository on GitHub
- Initial project structure with monorepo layout
- Set up basic Strapi CMS scaffolding
- Defined 4-service architecture:
  1. `services/api` - Central API for Printavo sync
  2. `services/job-estimator` - Pricing engine
  3. `services/production-dashboard` - Shop floor tracking
  4. `services/supplier-sync` - Supplier integrations

**Key Decisions:**
- Node.js + TypeScript only (no Python services)
- Strapi 4.x (later upgraded to 5.x)
- React 19 + Vite + TailwindCSS for frontend
- REST-only API (no GraphQL)

**Commits:** Initial commits, project setup

---

### Day 2: November 22, 2025 (Saturday) - Strapi + Data Architecture

**What Happened:**
- Installed Strapi CMS locally
- Created initial content types: customer, order, job
- Started Printavo API integration research
- Tested Printavo API endpoints

**Key Files Created:**
- `printshop-strapi/` - Full Strapi installation
- First content type schemas

**Printavo API Discovery:**
- Base URL: `https://www.printavo.com/api/v1`
- Auth: email + token as query params
- Endpoints tested: orders, customers, orderstatuses, products, tasks

---

### Day 3: November 23, 2025 (Sunday) - Repository Consolidation

**What Happened:**
- **MAJOR:** Discovered 4 separate pricing repos existed
- Consolidated all code into single printshop-os monorepo
- Total lines of code after merge: 51,969+
- Created Flexible Pricing Engine (PR #98)
- Created Workflow Automation (PR #99)

**Problems Identified:**
- Duplicate supplier-sync implementations
- Scattered documentation (218 markdown files)
- No single source of truth

**Key Decisions:**
- Adopted HLBPA pattern (High-Level Big Picture Architect)
- Maximum 10 markdown files in root
- All others go to `docs/` subdirectories

---

### Day 4: November 24, 2025 (Monday) - "Merge Hell" Day

**What Happened:**
- Attempted to merge 16 feature branches into main
- Resulted in 50+ merge conflicts
- Spent ~2 hours on conflict resolution
- Closed 7 duplicate issues
- Cleaned up 5 merged branches

**Problems Encountered:**
- Duplicate tracking in both GitHub Issues AND PRs
- Branches created for features that already existed
- Documentation sprawl causing confusion

**Post-Mortem Conclusions:**
1. Work on ONE branch at a time
2. Delete branches after merge
3. Issues for planning, PRs for implementation only
4. No session summaries or implementation reports

---

### Day 5: November 25, 2025 (Tuesday) - Enterprise Foundation

**What Happened:**
- Full repository audit completed
- Found 218 markdown files across project
- Identified 7 active services (later consolidated to 4)
- Archived legacy `services/api/supplier-sync/` to `docs/archive/`
- Established service inventory

**Repository Audit Results:**
- 40,710 files total
- 277+ commits
- 37 branches
- 854 markdown files
- Conclusion: "60% complete but 0% operational"

**MVP Gap Analysis Created:**
- Priority 1 (BLOCKER): Auth system, Quote workflow, Order creation
- Priority 2 (HIGH): Real-time tracking, Support API, Payments
- Priority 3 (MEDIUM): Production dashboard, Inventory

---

### Day 6: November 26, 2025 (Wednesday) - Auth System + Major Cleanup

**What Happened:**
- Deleted 26 stale branches
- Consolidated root docs to 10 files (HLBPA compliant)
- Implemented Phase 1-3 of MVP:
  - Customer signup/login
  - Employee PIN validation
  - 18 tests passing
  - Strapi auth routes working

**Auth Routes Created:**
- `/api/auth/customer/login`
- `/api/auth/customer/register`
- `/api/auth/employee/validate-pin`

**Documentation Cleanup:**
- Moved 200+ files to `docs/` or `docs/archive/`
- Created `docs/ARCHIVE_2025_11_26/`

---

### Day 7: November 27, 2025 (Thursday) - MAJOR DATA MIGRATION DAY

**What Happened (Morning):**
- Deployed Strapi to docker-host (100.92.156.118)
- Full Printavo data extraction completed
- All 3 supplier APIs verified working

**Printavo Data Extracted:**
| Data | Count | Size |
|------|-------|------|
| Orders | 12,867 | 61 MB |
| Customers | 3,358 | 3.8 MB |
| Line Items | 44,158 | 23 MB |
| Tasks | 1,463 | - |
| Expenses | 297 | - |
| Products | 105 | - |
| Statuses | 25 | - |

**What Happened (Afternoon):**
- Created import scripts
- Imported 3,317 customers (deduplicated)
- Imported 12,854 orders (all years, deduplicated)
- Cleaned duplicates: 2,485 customers + 1,331 orders

**Supplier APIs Verified:**
| Supplier | Auth | Status | Products |
|----------|------|--------|----------|
| AS Colour | Subscription-Key + JWT | ✅ | 522 |
| S&S Activewear | Basic Auth | ✅ | 211,000+ |
| SanMar | SOAP + SFTP | ✅ | 415,000+ |

**🚨 THE BIG DISCUSSION: 500 Products vs 400K Products**

We spent significant time planning how to handle the massive supplier catalogs:

**Problem:** 
- Printavo has 105 products (our historical orders)
- Suppliers have 600,000+ products combined
- Can't import all to Strapi (too slow, too large)

**Solution Agreed Upon:**
1. **Top 500 Products** - Pre-load in Strapi from Printavo order history
   - These 500 products account for 13,045 units ordered
   - Used for autocomplete and quick quote creation
   - Fast local queries

2. **Full Supplier Catalogs** - External storage with AI/agent access
   - Store in MinIO or external vector database
   - Use Pinecone (free tier) for semantic search
   - AI agent can query when asked "what products do we have in red?"
   - OpenAI embeddings for product descriptions

3. **Redis Caching** - 3-tier TTL strategy
   | Data Type | TTL | Rationale |
   |-----------|-----|-----------|
   | Product Info | 24 hours | Rarely changes |
   | Pricing | 1 hour | Can fluctuate |
   | Inventory | 15 minutes | Real-time critical |

**🗂️ MINIO FOLDER STRUCTURE (Hot Folder Architecture)**

We designed a complete file organization system:

```
printshop-artwork/                      # MinIO bucket
├── pending/                            # Awaiting customer approval
│   └── {order-id}/
│       ├── original/                   # As-uploaded files
│       └── converted/                  # Print-ready versions
├── approved/                           # Ready for production
│   └── {order-id}/
│       ├── screen-printing/            # Separated by print method
│       ├── embroidery/
│       ├── dtg/
│       └── metadata.json               # Colors, sizes, specs
├── in-production/                      # Currently on machine queues
│   └── {order-id}/
└── archive/                            # Completed jobs
    └── {year}/{month}/{customer-slug}/
        └── {order-id}/
```

**Machine Hot Folders (On Production Floor):**
```
/mnt/production/                        # NFS mount from docker-host
├── screenpro-600/                      # Screen printing machine
│   ├── incoming/                       # Files to print (synced from MinIO)
│   ├── processing/                     # Currently printing
│   └── completed/                      # Done (watched for auto-archive)
├── barudan/                            # Embroidery machine
│   └── incoming/                       # DST files
└── dtg-printer/
    └── incoming/                       # DTG-ready files
```

**AI Agent Integration Plan:**
- Agent receives query: "What red polo shirts do we have?"
- Agent queries Pinecone vector DB with embeddings
- Returns: "AS Colour 5101 in Burgundy, S&S Hanes 054 in Deep Red..."
- If customer orders, fetch real-time inventory from supplier API
- Cache result in Redis for 15 minutes

**What Happened (Evening):**
- Created artwork scraper v2: `scripts/printavo-artwork-scraper-v2.py`
- Started scraping artwork by customer folder
- ~4% complete when session ended

**Artwork Scraper Structure:**
```
data/artwork/
├── by_customer/                        # PRIMARY - for reorders
│   └── {customer-slug}-{id}/
│       └── {year}/{visual_id}_{nickname}/
├── by_order/                           # SECONDARY - symlinks
├── index.json                          # Searchable master index
└── checkpoint.json                     # Resume position
```

**Evening Session Extended:**
- Ran full artwork scrape overnight
- Morning result: 106,303 files, 205 GB, 9,307 orders, 2,661 customers
- Index generated: `data/artwork/index.json` (99,740 lines)

---

### Day 8: November 28, 2025 (Friday) - Session Continuity Crisis

**What Happened (Morning):**
- Discovered SSH connection instability to docker-host
- Multiple "Connection reset by peer" errors
- Realized AI memory loss between sessions causing repeated work

**Docker Update Issue:**
- Attempted to restart Docker on docker-host
- SSH connections kept dropping
- Worried about data loss (confirmed data is safe)

**Current State Verified:**
- PostgreSQL: 3,319 customers, 12,868 orders ✅
- Line Items: 0 (never imported) ❌
- Products: 0 (never imported) ❌
- Artwork: 205 GB on local Mac, not uploaded ❌

**Session Continuity Solution Initiated:**
- Created this DAILY_TASK_LOG.md
- Planning session history auto-append
- VS Code automation improvements

---

## 📋 Pending Tasks (Backlog)

### Data Import
- [ ] Import 44,158 line items to Strapi
- [ ] Import top 500 products to Strapi
- [ ] Upload 205 GB artwork to MinIO
- [ ] Link line items to orders

### Supplier Integration
- [ ] Sync AS Colour catalog (522 products)
- [ ] Set up S&S API polling
- [ ] Download SanMar EPDD.csv (494 MB)
- [ ] Create Pinecone index for product search

### AI/Agent System
- [ ] Set up Pinecone account (free tier)
- [ ] Create product embeddings
- [ ] Build agent query interface
- [ ] Integrate with n8n for automation

### Production System
- [ ] Configure MinIO buckets (pending, approved, in-production, archive)
- [ ] Set up machine hot folders
- [ ] Create file watcher for auto-archive

---

## 🔧 Quick Commands

```bash
# Check docker-host status
ssh docker-host 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# Check database counts
ssh docker-host 'docker exec printshop-postgres psql -U strapi -d printshop -c "SELECT (SELECT COUNT(*) FROM customers) as customers, (SELECT COUNT(*) FROM orders) as orders, (SELECT COUNT(*) FROM line_items) as line_items;"'

# Import line items
source .venv/bin/activate && python scripts/sync-line-items.py

# Upload artwork to MinIO
source .venv/bin/activate && python scripts/sync-artwork-minio.py

# Deploy to homelab
rsync -avz --exclude node_modules --exclude .git . docker-host:/mnt/printshop/printshop-os/ && ssh docker-host 'cd /mnt/printshop/printshop-os && docker compose up -d --build'

# View logs
ssh docker-host 'cd ~/stacks/printshop-os && docker-compose logs -f --tail=100'
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `DAILY_TASK_LOG.md` | This file - session continuity |
| `SERVICE_DIRECTORY.md` | Where all code lives |
| `ARCHITECTURE.md` | How the system works |
| `PROJECT_OVERVIEW.md` | What this project is |
| `.vscode/session-state.json` | Auto-generated context |
| `data/artwork/index.json` | Artwork master index |
| `data/customer-import-checkpoint.json` | Import progress |
| `data/order-import-checkpoint.json` | Import progress |

---

## 💡 Lessons Learned

1. **Document as you go** - Not after
2. **One branch at a time** - Merge conflicts are hell
3. **Delete branches after merge** - Keep repo clean
4. **Session continuity matters** - AI forgets everything
5. **Checkpoint everything** - Imports fail, connections drop
6. **Verify before assuming** - Check actual data counts
7. **Simple is better** - 4 services, not 7

---

## 📝 Session Notes Template

When starting a new session, add a section like this:

```markdown
### Session: [Date] [Time] - [Brief Title]

**Started:** [Time]
**Goal:** [What we're trying to accomplish]

**Actions:**
1. [What was done]
2. [What was done]

**Results:**
- [Outcome]

**Next Steps:**
- [ ] [What to do next]

**Ended:** [Time]
```

---

*Last Updated: November 28, 2025 @ [auto-fill time]*
*Total Sessions: 12+*
*Total Commits: 277+*
*Days Since Project Start: 8*
