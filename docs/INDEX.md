# PrintShop OS Documentation

> **Last Updated:** November 29, 2025  
> **Status:** Production Migration Complete

---

## Quick Start

| I want to... | Read this |
|--------------|-----------|
| Understand the system | [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) |
| Check migration status | [PRINTAVO_MIGRATION_STATUS.md](PRINTAVO_MIGRATION_STATUS.md) |
| Set up supplier APIs | [SUPPLIER_INTEGRATION.md](SUPPLIER_INTEGRATION.md) |
| Contribute code | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Track audit action items | [AUDIT_ACTION_ITEMS.md](AUDIT_ACTION_ITEMS.md) |

---

## Documentation Structure

```
docs/
├── ARCHITECTURE_OVERVIEW.md    # System architecture (HLBPA style)
├── AUDIT_ACTION_ITEMS.md       # Living audit dashboard (action items)
├── PRINTAVO_MIGRATION_STATUS.md # Data import progress
├── SUPPLIER_INTEGRATION.md      # Supplier API documentation
├── CONTRIBUTING.md              # Contribution guidelines
├── diagrams/                    # Mermaid diagrams (.mmd)
├── deployment/                  # Deployment guides
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
| **Strapi CMS** | http://docker-host:1337 | API & Admin |
| **Inventory API** | http://docker-host:3002 | Supplier inventory |
| **MinIO** | http://docker-host:9000 | Artwork storage |
| **PostgreSQL** | docker-host:5432 | Database |
| **Dozzle** | http://docker-host:9999 | Log viewer |

---

## Session Summaries (Nov 26-27, 2025)

### Completed
- ✅ Full Printavo data export and import (12,854 orders, 49,216 line items)
- ✅ Strapi CMS deployment to docker-host
- ✅ Inventory API with all 3 suppliers configured
- ✅ AS Colour dual-auth implemented and tested
- ✅ Docker-compose cleaned and updated
- ✅ Documentation consolidated (HLBPA style)

### In Progress
- 🔄 Artwork scrape (~510/12,867 orders, ~12GB)

### Not Started
- 🔴 Frontend MVP
- 🔴 Production dashboard
- 🔴 Automated backups

---

<small>Generated with GitHub Copilot as directed by @ronnyworks</small>
