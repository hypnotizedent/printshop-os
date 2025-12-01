# PrintShop OS Documentation

> **Last Updated:** December 2025  
> **Status:** Production Deployment Complete

---

## Quick Start

| I want to... | Read this |
|--------------|-----------|
| **Get started (new developer/agent)** | [ONBOARDING.md](ONBOARDING.md) |
| Understand the system | [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) |
| Deploy to production | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Check migration status | [PRINTAVO_MIGRATION_STATUS.md](PRINTAVO_MIGRATION_STATUS.md) |
| Set up supplier APIs | [SUPPLIER_INTEGRATION.md](SUPPLIER_INTEGRATION.md) |
| Contribute code | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Track audit action items | [AUDIT_ACTION_ITEMS.md](AUDIT_ACTION_ITEMS.md) |

---

## Documentation Structure

```
docs/
├── ONBOARDING.md               # Quick start for developers/agents
├── DEPLOYMENT.md               # Full deployment guide
├── ARCHITECTURE_OVERVIEW.md    # System architecture (HLBPA style)
├── CLOUDFLARE_TUNNEL_SETUP.md  # External access via Cloudflare
├── AUDIT_ACTION_ITEMS.md       # Living audit dashboard (action items)
├── PRINTAVO_MIGRATION_STATUS.md # Data import progress
├── SUPPLIER_INTEGRATION.md      # Supplier API documentation
├── CONTRIBUTING.md              # Contribution guidelines
├── diagrams/                    # Mermaid diagrams (.mmd)
├── deployment/                  # Deployment guides
│   └── disaster-recovery.md     # Backup and restore procedures
├── setup/                       # Setup instructions
└── ARCHIVE_*/                   # Historical documentation
```

---

## Key Documents

### [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)
High-level system architecture following HLBPA principles:
- System context and container diagrams
- Data model and entity relationships
- Key workflows (inventory check, order creation)
- Deployment view and quick commands
- Gap analysis

### [AUDIT_ACTION_ITEMS.md](AUDIT_ACTION_ITEMS.md)
Living Audit Dashboard with actionable sub-issues:
- Branch review (8 unmerged branches)
- Test coverage inventory
- Service documentation status
- Documentation consolidation
- Archive cleanup
- Audit automation

### [PRINTAVO_MIGRATION_STATUS.md](PRINTAVO_MIGRATION_STATUS.md)
Current status of Printavo data migration:
- Import progress (orders, customers, line items)
- Artwork archival status
- Supplier integration status

### [SUPPLIER_INTEGRATION.md](SUPPLIER_INTEGRATION.md)
Supplier API integration documentation:
- AS Colour (dual-auth)
- S&S Activewear
- SanMar (SFTP)

---

## Infrastructure Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| **Strapi CMS** | https://printshop.ronny.works | API & Admin |
| **Frontend** | https://printshop-app.ronny.works | React UI |
| **API** | https://api.ronny.works | Backend API |
| **Inventory API** | http://docker-host:3002 | Supplier inventory |
| **MinIO** | http://docker-host:9000 | Artwork storage |
| **PostgreSQL** | docker-host:5432 | Database |
| **Dozzle** | http://docker-host:9999 | Log viewer |

---

## For Automated/Overnight Agents

Suggested tasks for overnight automation:

### Code Quality
- [ ] Run linters and fix formatting issues
- [ ] Remove unused imports and dead code
- [ ] Add missing JSDoc/TypeScript documentation

### Test Coverage
- [ ] Add missing unit tests for uncovered functions
- [ ] Add integration tests for API endpoints
- [ ] Validate existing tests still pass

### Documentation
- [ ] Update outdated README files in services
- [ ] Ensure API documentation matches implementation
- [ ] Archive stale session reports

### Monitoring & Health
- [ ] Review container logs for recurring errors
- [ ] Check health check configurations
- [ ] Flag failing monitors in Uptime Kuma

### Security
- [ ] Scan for outdated dependencies (`npm audit`)
- [ ] Check for exposed secrets in code
- [ ] Review API authentication coverage

---

## Session Summaries (Dec 2025)

### Completed
- ✅ Full Printavo data export and import (12,854 orders, 49,216 line items)
- ✅ Strapi CMS deployment to docker-host
- ✅ Inventory API with all 3 suppliers configured
- ✅ AS Colour dual-auth implemented and tested
- ✅ Docker-compose cleaned and updated
- ✅ Documentation consolidated (HLBPA style)
- ✅ Frontend deployed with Cloudflare Tunnel
- ✅ Architecture separation documented (printshop-os vs homelab-infrastructure)
- ✅ Onboarding guide created for developers/agents

### In Progress
- 🔄 Artwork scrape (~510/12,867 orders, ~12GB)

### Not Started
- 🔴 Production dashboard enhancements
- 🔴 Automated backups (scripts exist, need scheduling)

---

<small>Generated with GitHub Copilot as directed by @ronnyworks</small>
