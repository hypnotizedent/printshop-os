# PrintShop OS - Onboarding Guide

> **Last Updated:** December 2025  
> **Audience:** New developers, automated agents (Copilot, CI bots)  
> **Time to Read:** 15-20 minutes

---

## Quick Start Checklist

Use this checklist to get up and running quickly:

- [ ] Read this document completely
- [ ] Understand the architecture separation (PrintShop OS vs Homelab Infrastructure)
- [ ] Clone the repository: `git clone https://github.com/hypnotizedent/printshop-os.git`
- [ ] Copy environment template: `cp .env.example .env`
- [ ] Configure required secrets in `.env`
- [ ] Start services: `docker compose up -d`
- [ ] Verify health: `docker compose ps`
- [ ] Access Strapi Admin: http://localhost:1337/admin
- [ ] Create first admin user (first run only)

---

## Architecture Overview

### Two-Repository Architecture

PrintShop OS uses a **clear separation** between business/application services and infrastructure tools:

| Repository | Purpose | Location on docker-host |
|------------|---------|------------------------|
| **printshop-os** | Business/application services | `~/stacks/printshop-os` |
| **homelab-infrastructure** | Infrastructure & monitoring | `/mnt/docker/*-stack` directories |

> **📍 Canonical Path:** `~/stacks/printshop-os` expands to `/home/docker-host/stacks/printshop-os`. This is the active git repository where all deployments and git operations should be performed.

### What Runs Where

#### PrintShop OS (This Repository)

Contains **only** business/application services:

| Service | Port | Description |
|---------|------|-------------|
| React Frontend | 3000 | Customer portal and admin UI |
| Strapi CMS | 1337 | Central API and content management |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Caching and sessions |
| Inventory API | 3002 | Supplier inventory integration |
| MongoDB | 27017 | Appsmith database (replica set) |
| Appsmith | 8080 | Production dashboard (low-code) |
| Botpress | 3100 | AI chatbot |
| Job Estimator | 3004 | Pricing engine |

#### Homelab Infrastructure (Separate Repository)

Infrastructure and monitoring tools run in dedicated stacks:

| Stack | Location | Services |
|-------|----------|----------|
| **automation-stack** | `/mnt/docker/automation-stack` | n8n (workflow automation) |
| **observability-stack** | `/mnt/docker/observability-stack` | Grafana, Prometheus, Loki |
| **infrastructure-stack** | `/mnt/docker/infrastructure-stack` | Uptime Kuma, MinIO, Dozzle, ntfy |

### Why This Separation?

1. **Clear responsibility boundaries** - Business logic separate from ops tooling
2. **Independent deployment** - Update apps without affecting monitoring
3. **Easier debugging** - Know where to look for issues
4. **Cleaner git history** - App changes don't mix with infra changes

---

## Infrastructure Map

### Network Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│  docker-host (100.92.156.118)                                           │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  homelab-network (shared Docker network)                           │ │
│  │                                                                    │ │
│  │   PrintShop OS Stack        Infrastructure Stack                   │ │
│  │  ┌──────────────────┐      ┌───────────────────┐                   │ │
│  │  │ printshop-frontend│      │ uptime-kuma :3001 │                   │ │
│  │  │ :3000             │      │ minio :9000-9001  │                   │ │
│  │  ├──────────────────┤      │ dozzle :9999      │                   │ │
│  │  │ printshop-strapi │      │ ntfy :8088        │                   │ │
│  │  │ :1337            │      └───────────────────┘                   │ │
│  │  ├──────────────────┤                                              │ │
│  │  │ printshop-postgres│     Observability Stack                     │ │
│  │  │ :5432            │      ┌───────────────────┐                   │ │
│  │  ├──────────────────┤      │ grafana :3002     │                   │ │
│  │  │ printshop-redis  │      │ prometheus :9090  │                   │ │
│  │  │ :6379            │      │ loki :3100        │                   │ │
│  │  └──────────────────┘      └───────────────────┘                   │ │
│  │                                                                    │ │
│  │   ← cloudflared container connects to all services →               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  External Access: Cloudflare Tunnel → *.ronny.works                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cloudflare Tunnel Routes (Current)

All public access goes through Cloudflare Tunnel with these routes:

| Subdomain | Domain | Service URL | Description |
|-----------|--------|-------------|-------------|
| `printshop-app` | ronny.works | `http://printshop-frontend:3000` | React Frontend |
| `printshop` | ronny.works | `http://printshop-strapi:1337` | Strapi CMS |
| `api` | ronny.works | `http://printshop-api:3001` | Backend API |
| `n8n` | ronny.works | `http://n8n:5678` | Workflow Automation |
| `grafana` | ronny.works | `http://grafana:3000` | Monitoring |
| `uptime` | ronny.works | `http://uptime-kuma:3001` | Status Page |

> **Note:** Free Cloudflare SSL only covers **one level** of subdomains. Use `mintprints-app.ronny.works`, not `app.mintprints.ronny.works`.

---

## Getting Started

### Prerequisites

- Docker 24.0+ and Docker Compose 2.0+ (use `docker compose`, not `docker-compose`)
- Git
- SSH access to deployment server (for production)
- 8GB RAM minimum (16GB recommended)
- 20GB disk space

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your values (see Environment Variables section)
nano .env

# 4. Start all services
docker compose up -d

# 5. Check health status
docker compose ps

# 6. Wait for Strapi to build (2-3 minutes on first run)
# Then create admin user at http://localhost:1337/admin
```

### Production Deployment

```bash
# Deploy to docker-host via Tailscale
rsync -avz --exclude node_modules --exclude .git . docker-host:~/stacks/printshop-os/

# SSH and start services
ssh docker-host 'cd ~/stacks/printshop-os && docker compose up -d --build'

# Connect cloudflared to the network (if not already)
ssh docker-host 'docker network connect printshop_network cloudflared'

# Verify external access
curl -I https://mintprints-app.ronny.works
curl -I https://mintprints.ronny.works
curl -I https://mintprints-api.ronny.works
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `secure_password_here` |
| `STRAPI_JWT_SECRET` | Strapi JWT secret (use `openssl rand -base64 32`) | `base64_secret` |
| `STRAPI_ADMIN_JWT_SECRET` | Strapi admin JWT secret | `base64_secret` |
| `STRAPI_APP_KEYS` | Comma-separated app keys (4 required) | `key1,key2,key3,key4` |

### Optional Variables (Supplier APIs)

| Variable | Description |
|----------|-------------|
| `SS_ACTIVEWEAR_API_KEY` | S&S Activewear API key |
| `SS_ACTIVEWEAR_ACCOUNT_NUMBER` | S&S account number |
| `ASCOLOUR_API_KEY` | AS Colour subscription key |
| `ASCOLOUR_EMAIL` | AS Colour login email |
| `ASCOLOUR_PASSWORD` | AS Colour login password |

### Production Variables (Cloudflare)

```bash
# For production with Cloudflare Tunnel
VITE_API_URL=https://mintprints-api.ronny.works
VITE_STRAPI_URL=https://mintprints.ronny.works
VITE_PRICING_URL=https://mintprints-api.ronny.works
VITE_WS_URL=wss://mintprints-api.ronny.works
```

---

## Key Files & Directories

```
printshop-os/
├── MASTER_CONTEXT.md          # Full project context - READ FIRST
├── ARCHITECTURE.md            # System architecture details
├── SERVICE_DIRECTORY.md       # Where everything is located
├── COPILOT_CONTEXT.md         # Context for AI agents
├── docker-compose.yml         # Main Docker configuration
├── .env.example               # Environment template
├── frontend/                  # React + Vite frontend
├── printshop-strapi/          # Strapi CMS
├── services/
│   ├── api/                   # Inventory & supplier API
│   ├── supplier-sync/         # Supplier integration
│   ├── job-estimator/         # Pricing engine
│   ├── production-dashboard/  # Analytics & real-time
│   └── customer-service-ai/   # AI assistant
├── scripts/                   # Utility scripts
├── data/                      # Data files (Printavo exports, products)
└── docs/                      # Additional documentation
```

---

## Adding New Services

### Checklist for Adding a Service

1. **Create service directory:** `services/<service-name>/`
2. **Add to docker-compose.yml:**
   ```yaml
   <service-name>:
     build: ./services/<service-name>
     container_name: printshop-<service-name>
     networks:
       - homelab-network
     healthcheck:
       test: ["CMD", "wget", "--spider", "http://localhost:PORT/health"]
       interval: 30s
       timeout: 10s
       retries: 3
       start_period: 30s
   ```
3. **Add Cloudflare route** (if external access needed):
   - Go to Cloudflare Zero Trust → Networks → Tunnels
   - Add public hostname pointing to `http://printshop-<service-name>:PORT`
4. **Update SERVICE_DIRECTORY.md** with new service
5. **Add environment variables** to `.env.example`
6. **Write tests** in `services/<service-name>/tests/`

### Checklist for Modifying Existing Services

1. **Check SERVICE_DIRECTORY.md** for service location
2. **Read service README** for specific patterns
3. **Run existing tests** before changes
4. **Update tests** if behavior changes
5. **Update documentation** if API changes

---

## For Automated Agents

### Context Files to Read

When starting a session, read these files in order:

1. **MASTER_CONTEXT.md** - Architecture, ports, data locations
2. **SERVICE_DIRECTORY.md** - Where everything is
3. **COPILOT_CONTEXT.md** - Session context and recent changes
4. **This file (ONBOARDING.md)** - Infrastructure and onboarding

### Agent-Friendly Quick Reference

| Need | File/Location |
|------|---------------|
| Project overview | `PROJECT_OVERVIEW.md` |
| Architecture diagram | `docs/ARCHITECTURE_OVERVIEW.md` |
| Service locations | `SERVICE_DIRECTORY.md` |
| Deployment commands | `docs/DEPLOYMENT.md` |
| Cloudflare setup | `docs/CLOUDFLARE_TUNNEL_SETUP.md` |
| Disaster recovery | `docs/deployment/disaster-recovery.md` |
| API reference | `docs/reference/PRINTAVO_API.md` |
| Strapi TypeScript fix | `docs/reference/STRAPI_TYPESCRIPT_API_FIX.md` |

### Overnight/Automated Task Suggestions

When running overnight jobs, consider:

1. **Code polish:** Linting, formatting, unused imports
2. **Test coverage:** Add missing tests for uncovered code
3. **Documentation:** Update outdated README files
4. **Health checks:** Review and fix failing monitors
5. **Log analysis:** Flag recurring errors in container logs
6. **Security:** Scan for outdated dependencies

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Connect cloudflared to network: `docker network connect printshop_network cloudflared` |
| Strapi slow on first load | Wait 2-3 minutes for admin panel build |
| Container unhealthy | Check logs: `docker logs <container> --tail 100` |
| Port conflict | Check SERVICE_DIRECTORY.md for port assignments |
| Database connection failed | Verify PostgreSQL is running: `docker compose ps` |

### Health Check Commands

```bash
# All containers status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Strapi health
curl -s http://localhost:1337/_health

# PostgreSQL health
docker exec printshop-postgres pg_isready -U strapi

# Redis health
docker exec printshop-redis redis-cli ping

# Full system test
./test-system.sh
```

### Log Access

```bash
# View all logs
docker compose logs -f

# Specific service
docker compose logs -f strapi

# Web-based log viewer (if Dozzle running)
# http://docker-host:9999
```

---

## Backup & Recovery

### Backup Locations

| Data | Backup Location | Frequency |
|------|-----------------|-----------|
| PostgreSQL | `/backups/postgres/` | Daily at 2 AM |
| MongoDB | `/backups/mongo/` | Daily at 2 AM |
| Strapi uploads | `/backups/strapi/` | Daily |
| Redis | In-memory (ephemeral) | N/A |

### Quick Recovery

```bash
# Restore PostgreSQL from backup
gunzip -c /backups/postgres/full-backup-YYYY-MM-DD.sql.gz | \
  docker exec -i printshop-postgres psql -U strapi

# Restart all services
docker compose down && docker compose up -d
```

See `docs/deployment/disaster-recovery.md` for complete procedures.

---

## Getting Help

- **Documentation:** Check `/docs` folder first
- **Issues:** Search existing GitHub issues
- **Discussions:** Use GitHub Discussions for questions
- **Security:** Report vulnerabilities via `SECURITY.md`

---

**Welcome to PrintShop OS! 🖨️**
