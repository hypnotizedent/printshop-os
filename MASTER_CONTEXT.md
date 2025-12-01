# PrintShop OS - Master Context

> ⚠️ **AI MODELS: READ THIS FIRST** - This file contains critical context for the entire project.

## 🏗️ Architecture Overview

### Core Services (4 Buckets)
| Service | Location | Port | Status |
|---------|----------|------|--------|
| Frontend | `/frontend` | 3000 | ✅ Active |
| Strapi CMS | `/printshop-strapi` | 1337 | ✅ Active |
| Job Estimator | `/services/job-estimator` | 3001 | ✅ Active |
| Supplier Sync | `/services/supplier-sync` | 3002 | ✅ Active |

### Data Locations
| Data Type | Location | Notes |
|-----------|----------|-------|
| Printavo Exports | `data/raw/printavo-exports/` | Raw exports, never modify |
| Line Items | `data/line-item-import-checkpoint.json` | 44K items, source for Top 500 |
| Customers | `data/customer-import-checkpoint.json` | 336 customers |
| Orders | `data/order-import-checkpoint.json` | 831 orders |
| Artwork | `data/artwork/` | Customer artwork uploads |

### Docker Host Paths
| Service | Container Path | Host Path |
|---------|---------------|-----------|
| Strapi Uploads | `/opt/app/public/uploads` | `/data/strapi-uploads` |
| MinIO Data | `/data` | `/data/minio` |
| PostgreSQL | `/var/lib/postgresql/data` | `/data/postgres` |

### File Types & Storage
| File Type | Current Location | Future Location |
|-----------|-----------------|-----------------|
| PNG/JPG (artwork) | MinIO `artwork` bucket | ✅ Working |
| DST (embroidery) | ⚠️ NOT YET IMPLEMENTED | MinIO `production-files` bucket |
| EPS/AI/PDF | ⚠️ NOT YET IMPLEMENTED | MinIO `production-files` bucket |

### API Endpoints
| Service | URL | Auth |
|---------|-----|------|
| Strapi API | `http://docker-host:1337/api` | Bearer token |
| Strapi Admin | `http://docker-host:1337/admin` | Session |
| Frontend | `http://docker-host:3000` | None |
| Job Estimator | `http://docker-host:3001` | None |

## 🐳 Docker Host Requirements

### Docker Compose V2 (Required)
The production docker-host requires Docker Compose V2 (plugin version). The old Python-based `docker-compose` (v1) has bugs with newer Docker versions.

**Install:**
```bash
sudo apt-get update && sudo apt-get install -y docker-compose-plugin
docker compose version  # Verify: should show v2.x
```

**Usage:**
```bash
# Use space, not hyphen
docker compose up -d        # ✅ Correct (V2)
docker-compose up -d        # ❌ Old/deprecated (V1)
```

### Health Check IPv4
All container health checks use `127.0.0.1` instead of `localhost` to avoid IPv6 resolution issues inside containers.

## 🚨 Known Issues

### MinIO File Types
- **Problem**: Printavo scraper only pulled PNGs
- **Need**: DST, EPS, PDF, AI files for production
- **Status**: ON HOLD until source files obtained

### Supplier Products (500K SKUs)
- **Problem**: Can't import 500K products into Strapi
- **Solution**: PR #160 implements curated Top 500 products system
- **Status**: Pending merge

## 📊 Current Data Counts
| Content Type | Count | Source |
|-------------|-------|--------|
| Customers | 336 | Printavo 2025 |
| Orders | 831 | Printavo 2025 |
| Line Items | 44,158 | Printavo 2025 |
| Products | 18 | Manual entry |

## 🔗 Related Repositories

| Repo | Purpose |
|------|---------|
| `hypnotizedent/ptavo` | Printavo API analysis & scraper code |
| `hypnotizedent/homelab-infrastructure` | Docker host infrastructure (separate stacks) |

## 🏠 Architecture Separation

PrintShop OS uses a **two-repository architecture**:

| Repository | Purpose | Location on docker-host |
|------------|---------|------------------------|
| **printshop-os** (this repo) | Business/application services | `/mnt/printshop/printshop-os` |
| **homelab-infrastructure** | Infrastructure & monitoring | `/mnt/docker/*-stack` directories |

### Homelab Infrastructure Stacks
- `/mnt/docker/automation-stack` → n8n (workflow automation)
- `/mnt/docker/observability-stack` → Grafana, Prometheus, Loki
- `/mnt/docker/infrastructure-stack` → Uptime Kuma, MinIO, Dozzle, ntfy

All stacks share `homelab-network` Docker network for cross-stack communication.

For onboarding, see: **[docs/ONBOARDING.md](docs/ONBOARDING.md)**
