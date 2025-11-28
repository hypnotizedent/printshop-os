# PrintShop OS - Agent Session Context

> **Purpose:** Quick context sync for AI agents and new sessions  
> **Last Updated:** November 27, 2025 @ 19:45 EST  
> **Status:** 🔄 Artwork Scrape Running (~7 hours)

---

## Current State Summary

### What We're Doing
Migrating from **Printavo** (paid SaaS) to **PrintShop OS** (self-hosted, open source) to achieve:
1. Full data ownership and backup
2. Custom supplier integrations (real-time inventory)
3. Enhanced UX and automation
4. Zero monthly subscription costs

### Where We Are

| Milestone | Status | Progress |
|-----------|--------|----------|
| Printavo Data Export | ✅ Complete | 100% |
| Customer Import | ✅ Complete | 3,317/3,317 |
| Order Import | ✅ Complete | 12,867/12,867 |
| Line Item Import | ⚠️ In Progress | ~38,000/44,158 (~86%) |
| Product Catalog (Top 500) | ✅ Complete | 500/500 |
| Artwork Archival | 🔄 **RUNNING NOW** | ~25/12,867 orders |
| Supplier API Integration | ⚠️ Partial | API built, creds needed |
| Frontend MVP | 🔴 Not Started | - |

### 🔴 ACTIVE PROCESS: Artwork Scrape

**Status:** Running since ~19:30 EST, estimated 7 hours  
**Monitor:** `tail -f data/artwork/scrape.log`

```bash
# Check progress
cat data/artwork/checkpoint.json | jq '{processed: .last_order_index, total: 12867}'

# After complete, sync to MinIO:
./scripts/sync-artwork-to-minio.sh
```

---

## Quick Reference

### Infrastructure

```
macbook (dev)     → 100.85.186.7
pve (proxmox)     → 100.96.211.33  
docker-host (prod) → 100.92.156.118  ← ALL CONTAINERS HERE
```

### Running Services

```bash
# Check status
ssh docker-host 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# View logs
ssh docker-host 'docker compose -f ~/stacks/printshop-os/docker-compose.yml logs -f'
```

### Key Files

| Purpose | Path |
|---------|------|
| Migration Status | `docs/PRINTAVO_MIGRATION_STATUS.md` |
| Artwork Strategy | `docs/ARTWORK_ARCHIVE_STRATEGY.md` |
| Architecture | `docs/ARCHITECTURE_OVERVIEW.md` |
| Service Directory | `SERVICE_DIRECTORY.md` |
| Line Item Checkpoint | `data/line-item-import-checkpoint.json` |
| Artwork Checkpoint | `data/artwork/checkpoint.json` |
| Source Data | `data/raw/printavo-exports/complete_2025-11-27_14-20-05/` |

### Database Access

```bash
# Query Strapi DB directly
ssh docker-host 'docker exec printshop-postgres psql -U strapi -d printshop -c "
  SELECT 
    (SELECT COUNT(*) FROM orders) as orders,
    (SELECT COUNT(*) FROM line_items) as line_items,
    (SELECT COUNT(*) FROM customers) as customers;
"'
```

### Strapi API

```bash
# Strapi URL
http://100.92.156.118:1337

# Token (for imports)
export STRAPI_TOKEN="73b35f5663a72296c3ca825d4f8e2a1af016aaeff8b252f1f80dc2cc99669919a94a0e1d982861470846a08ebd3ed7146093e86b9823814e939903de99524ea9e7e778de5317fd070f0d2ced8d22010d49b1815fe40eaefd7d78dceb27753112869b1b90351174efa710fc0958d2b08405d266bb79a68d7dc23f22686bff4c3d"
```

---

## Artwork Archive System

### Structure
```
data/artwork/
├── by_customer/                  # PRIMARY - for customer reorders
│   └── {customer-slug}-{id}/
│       └── {year}/
│           └── {visual_id}_{nickname}/
│               ├── artwork_1.png
│               └── order.json
│
├── by_order/                     # SECONDARY - symlinks for order lookup
│   └── {visual_id} → symlink to customer folder
│
├── index.json                    # Searchable master index
├── checkpoint.json               # Resume position
└── scrape.log                    # Progress log
```

### Scripts
| Script | Purpose |
|--------|---------|
| `scripts/printavo-artwork-scraper-v2.py` | Enhanced scraper (running now) |
| `scripts/sync-artwork-to-minio.sh` | Sync to MinIO for web access |

### MinIO Access (after sync)
- **Web Console:** http://docker-host:9001
- **S3 API:** http://docker-host:9000/artwork-archive/
- **Bucket:** `artwork-archive`

---

## Active Tasks Queue

### In Progress (Running)
1. **Artwork Scrape** - ~12,867 orders, ~7 hours
   - Script: `scripts/printavo-artwork-scraper-v2.py`
   - Monitor: `tail -f data/artwork/scrape.log`
   - Resume-safe via checkpoint

### Immediate (After Scrape)
2. **Sync Artwork to MinIO**
   - Script: `./scripts/sync-artwork-to-minio.sh`
   - Estimated: ~100-150 GB transfer

3. **Complete Line Item Import** - ~6,000 remaining
   - Checkpoint at index ~33,050
   - Script: `scripts/import-line-items.py`
   
### Blocked (Need Info)
4. **Supplier API Credentials**
   - AS Colour: Need API key
   - S&S Activewear: Need account setup
   - SanMar: Need SOAP credentials

---

## Tech Stack Rules

### Allowed
- Node.js + TypeScript
- Strapi 4.x (SQLite dev / PostgreSQL prod)
- React 19 + Vite + TailwindCSS
- Socket.io (production-dashboard only)
- Redis (caching)
- Python (migration scripts only)

### NOT Allowed
- GraphQL
- Additional frameworks
- New services (only 4 exist: api, job-estimator, production-dashboard, supplier-sync)

---

## Service Ports

| Service | Dev Port | Prod Port |
|---------|----------|-----------|
| Frontend | 3000 | 5173 |
| Strapi | 1337 | 1337 |
| API | 3001 | 3001 |
| Job Estimator | 3002 | 3002 |
| Production Dashboard | 3003 | 3003 |
| Supplier Sync | 3004 | 3004 |

---

## Common Commands

```bash
# Start local dev
cd frontend && npm run dev
cd printshop-strapi && npm run develop

# Run imports (activate venv first)
source .venv/bin/activate
export STRAPI_TOKEN="..."
python scripts/import-all-data.py

# Deploy to production
rsync -avz --exclude node_modules --exclude .git . docker-host:/mnt/printshop/printshop-os/
ssh docker-host 'cd /mnt/printshop/printshop-os && docker compose up -d --build'

# Check production status
ssh docker-host 'docker ps | grep printshop'
```

---

## Session Handoff Checklist

When ending a session, update:
- [ ] This file with current status
- [ ] `docs/PRINTAVO_MIGRATION_STATUS.md` with progress
- [ ] Commit checkpoint files if modified
- [ ] Note any blockers or questions

When starting a session:
1. Read this file first
2. Check `docker ps` on docker-host
3. Query database for current counts
4. Review recent git history: `git log --oneline -10`

---

## Contact & Resources

- **GitHub Repo:** github.com/hypnotizedent/printshop-os
- **Homelab Docs:** `../homelab-infrastructure/DOCS/`
- **Printavo Docs:** Deprecated, focus on migration only

---

<small>Generated with GitHub Copilot as directed by @ronnyworks</small>
