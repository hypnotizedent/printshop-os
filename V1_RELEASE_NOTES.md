# PrintShop OS V1 Release Notes

**Version:** 1.0.0  
**Release Date:** November 30, 2025  
**Repository:** hypnotizedent/printshop-os  
**Branch:** main

---

## Summary

PrintShop OS V1 is a comprehensive, all-in-one management system for custom apparel print shops. This release consolidates order management, production tracking, supplier integration, customer portals, and AI-powered features into a unified platform designed to replace Printavo by January 1, 2026.

---

## Features Included

### Core Backend

| Feature | Description |
|---------|-------------|
| Strapi CMS | 10+ content types for orders, customers, jobs, invoices, payments |
| PostgreSQL + Redis | Production database with caching layer |
| Unified API Client | `frontend/src/lib/api-client.ts` for consistent API access |
| 4 Backend Services | api, job-estimator, production-dashboard, supplier-sync |

### Frontend Features

| Feature | Description |
|---------|-------------|
| Dashboard | Widgets for Revenue, Orders, Production, Inventory metrics |
| Order Management | List, detail, create, edit order functionality |
| Customer Management | Search, detail, create customer functionality |
| Quote Builder | Real-time pricing with artwork upload |
| Invoice Generation | Invoice creation with PDF preview |
| Payment Tracking | Payment history and status tracking |
| Reporting Dashboard | Sales, Production, and Customer analytics |
| Production Dashboard | Job Queue and Supervisor view |
| Production Calendar | Capacity planning and schedule view |
| Customer Portal | Self-service portal with react-router-dom routing |
| Inventory/Product Catalog | Product management UI |
| AI Assistant | Chat widget and dedicated AI page |

### AI & Automation

| Feature | Description |
|---------|-------------|
| Customer Service AI | RAG-powered customer support chatbot |
| Milvus Vector Database | Self-hosted vector DB ($0/month vs $70+ cloud) |
| Sentiment Analysis | Customer communication analysis |
| Design Analysis | Color count, gradients, print method recommendations |

**Vector Database Collections:**
- `designs` - Design file embeddings for similarity search
- `customers` - Customer data for intelligent queries
- `orders` - Order history for context
- `knowledge_base` - Company policies and SOPs

### Infrastructure

| Component | Description |
|-----------|-------------|
| Business Services Stack | Invoice Ninja, n8n, Paperless, Penpot, Vaultwarden |
| Docker Compose | Complete containerized deployment |
| Traefik SSL | HTTPS with Cloudflare integration |

### Supplier Integration

| Supplier | Status | Records |
|----------|--------|---------|
| AS Colour | ✅ Complete | 522 products |
| SanMar | ✅ Complete | 415,000 records |
| S&S Activewear | ✅ Complete | 211,000+ products |

### Imported Data

| Data Type | Count |
|-----------|-------|
| Orders | 12,854 |
| Customers | 3,317 |
| Line Items | 49,216 |
| Products | 710 |

---

## PRs Merged

All V1 features were delivered through the following pull requests:

| PR | Title | Description |
|----|-------|-------------|
| #147 | Self-Hosted Business Services Stack | Invoice Ninja, n8n, Paperless, Penpot, Vaultwarden |
| #148 | Milvus Vector Database | AI-powered semantic search and RAG |
| #157 | Production Dashboard | Epic #86 - Job Queue, Supervisor Dashboard |
| #159 | AI & Automation Epic | Customer Service AI with RAG |
| #178 | Wire V1 Frontend to Strapi | Unified API client implementation |
| #179 | Invoice Generation | Invoice creation with UI components |
| #180 | Payment Tracking | Payment status and history tracking |
| #181 | Inventory/Product Catalog | Product management UI |
| #182 | Reporting Dashboard | Sales, Production, Customer reports |
| #183 | Production Calendar | Schedule and capacity view |
| #189 | Customer Portal Wiring | react-router-dom routing |
| #190 | AI Customer Service | RAG implementation (rebased) |
| #191 | Payment Tracking Chain | Consolidated payment features |
| #192 | Invoice Generation Chain | Consolidated invoice features |
| #193 | PR Review and Fixes | Final cleanup and fixes |

---

## Breaking Changes

None for V1 release. This is a new deployment.

---

## Deployment Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- Tailscale (for production network access)

### Local Development

```bash
# Clone repository
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os

# Install dependencies
npm install

# Start Strapi CMS
cd printshop-strapi
npm install
npm run develop

# Start frontend (in separate terminal)
cd frontend
npm install
npm run dev
```

### Production Deployment

```bash
# Deploy to docker-host (via Tailscale)
rsync -avz --exclude node_modules --exclude .git . docker-host:/mnt/printshop/printshop-os/
ssh docker-host 'cd /mnt/printshop/printshop-os && docker compose up -d --build'

# View logs
ssh docker-host 'cd /mnt/printshop/printshop-os && docker compose logs -f printshop-strapi'

# Quick status check
ssh docker-host 'docker ps --format "table {{.Names}}\t{{.Status}}"'
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Strapi
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=printshop
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=<your-password>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI (for AI features)
OPENAI_API_KEY=<your-api-key>

# Milvus
MILVUS_HOST=localhost
MILVUS_PORT=19530
```

### Access URLs

| Service | Local URL | Production URL |
|---------|-----------|----------------|
| Strapi Admin | http://localhost:1337/admin | https://printshop.ronny.works/admin |
| Frontend | http://localhost:5173 | https://app.printshop.ronny.works |

---

## Known Issues

None identified for V1 release.

---

## Post-Release Tasks

1. **Branch Cleanup** - 30+ stale branches from merged PRs need deletion
2. **Issue Closure** - Issues #86, #87, #88, #175, #186, #187, #188 to be closed
3. **Documentation Archive** - Legacy docs in `docs/` folder being consolidated

---

## Testing

```bash
# Run all tests
npm test

# Run specific service tests
cd services/production-dashboard && npm test

# Watch mode
npm test -- --watch
```

**Test Coverage:** 240+ tests across all services

---

## Contributors

- @hypnotizedent - Project Lead
- AI-assisted development with GitHub Copilot

---

## Support

For issues or questions:
- Check `DEVELOPMENT_GUIDE.md` for setup help
- Check `ARCHITECTURE.md` for system design
- Check `SERVICE_DIRECTORY.md` for service locations
- Open a GitHub issue for bugs or feature requests

---

## What's Next (V2 Roadmap)

1. **Production Deployment** - Deploy V1 to production environment
2. **User Acceptance Testing** - Validate with real print shop operations
3. **Performance Monitoring** - Set up observability and alerting
4. **Mobile App** - Native mobile experience for production floor
5. **Advanced AI Features** - Expanded design analysis and recommendations

See `ROADMAP.md` for detailed V2 planning.

---

**Thank you for using PrintShop OS!**

*Version 1.0.0 - November 30, 2025*
