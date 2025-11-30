# PrintShop OS - Copilot Session Context

> **Last Updated:** 2025-11-30
> **Purpose:** Provide context for new Copilot/AI agent sessions

## 🖥️ Server Configuration

### Docker Host Location
- **Server:** docker-host (Tailscale network)
- **Repository Path:** `/home/docker-host/stacks/printshop-os`
- **User:** docker-host
- **SSH Access:** `ssh docker-host@docker-host` (via Tailscale)
- **Git Auth:** SSH key authenticated (`ssh -T git@github.com` works)

### Quick Commands
```bash
# Navigate to project
cd /home/docker-host/stacks/printshop-os

# Pull latest changes
git pull origin main

# Start all services
./scripts/start-printshop.sh start

# View logs
./scripts/start-printshop.sh logs

# Check status
./scripts/start-printshop.sh status

# Stop all services
./scripts/start-printshop.sh stop
```

## 🌐 Service URLs (After Docker Start)

| Service | URL | Port | Description |
|---------|-----|------|-------------|
| Frontend | http://localhost:5173 | 5173 | React dashboard (served via 'serve') |
| Strapi Admin | http://localhost:1337/admin | 1337 | CMS admin panel |
| Strapi API | http://localhost:1337/api | 1337 | REST API |
| API Service | http://localhost:3001 | 3001 | Inventory & supplier integration |
| Pricing Engine | http://localhost:3004 | 3004 | Job estimator API (internal 3001→external 3004) |
| Appsmith | http://localhost:8080 | 8080 | Production dashboard |
| Botpress | http://localhost:3100 | 3100 | AI chatbot |
| PostgreSQL | localhost:5432 | 5432 | Primary database |
| Redis | localhost:6379 | 6379 | Caching & sessions |
| MongoDB | localhost:27017 | 27017 | Appsmith database |

## 📁 Key Directories

```
/home/docker-host/stacks/printshop-os/
├── frontend/                 # React + Vite frontend
├── printshop-strapi/         # Strapi CMS (central API)
├── services/
│   ├── api/                  # Inventory & supplier API
│   ├── supplier-sync/        # Supplier integration (S&S, AS Colour, SanMar)
│   ├── job-estimator/        # Pricing engine
│   ├── production-dashboard/ # Analytics service
│   └── customer-service-ai/  # AI assistant service
├── scripts/
│   ├── start-printshop.sh    # Main startup script
│   └── init-databases.sql    # Database initialization
├── docker-compose.yml        # Main Docker configuration
└── .env                      # Environment variables (not in git)
```

## 🔐 Environment Variables

Environment file location: `/home/docker-host/stacks/printshop-os/.env`

**Critical variables to configure:**
- `POSTGRES_PASSWORD` - Database password
- `STRAPI_JWT_SECRET` - Strapi JWT secret
- `STRAPI_ADMIN_JWT_SECRET` - Strapi admin JWT secret
- `SS_ACTIVEWEAR_API_KEY` - S&S Activewear API key
- `SS_ACTIVEWEAR_ACCOUNT_NUMBER` - S&S account number
- `ASCOLOUR_API_KEY` - AS Colour subscription key
- `ASCOLOUR_EMAIL` / `ASCOLOUR_PASSWORD` - AS Colour login

See `.env.example` for full list.

## 📦 Supplier API Documentation

Extensive supplier integration docs are in:
- `services/supplier-sync/COMPLETE_DOCUMENTATION.md` - Full API docs
- `services/supplier-sync/ARCHITECTURE.md` - System architecture
- `services/supplier-sync/TESTING_GUIDE.md` - Testing procedures
- `services/supplier-sync/TEST_RESULTS.md` - Verified test results

### Configured Suppliers
| Supplier | Status | Auth Method |
|----------|--------|-------------|
| S&S Activewear | ✅ Production | API Key + Account Number |
| AS Colour | ✅ Production | Subscription-Key + Bearer Token |
| SanMar | 🚧 In Progress | SFTP Username/Password |

## 🗄️ Database

- **Type:** PostgreSQL 15 (Docker)
- **Container:** printshop-postgres
- **Default DB:** printshop
- **Default User:** strapi
- **Port:** 5432

Strapi data is stored in PostgreSQL when running via Docker.
Local development can use SQLite (see `printshop-strapi/.env.example`).

## 📋 Recent Session History

### 2025-11-30 Sessions
- ✅ Fixed Docker port conflicts (PR #199)
- ✅ Replaced mock data with real API calls (PR #198)
- ✅ Added startup script and portal API fixes (PR #200)
- ✅ Fixed supplier API environment variable warnings
- ✅ Fixed health check configurations for Strapi and Frontend
- ✅ Updated documentation with correct port mappings
- ✅ Added Cloudflare Tunnel production configuration

### Key PRs Merged for Initial Setup (v1.0 Stabilization)
The following PRs were critical for getting the system from initial development to a working state:

| PR | Description | Impact |
|----|-------------|--------|
| #198 | Replace mock data with real Strapi API calls | Frontend now fetches real data |
| #199 | Fix Docker port conflicts | Pricing engine moved to port 3004 |
| #200 | Add startup script, portal API fixes | Simplified deployment process |
| - | Health check fixes | Strapi/Frontend containers now healthy |
| - | Environment variable documentation | Clear setup instructions |
| - | Cloudflare Tunnel configuration | Frontend uses configurable public URLs |

## 🌐 Production URLs (Cloudflare Tunnel)

For production deployments via Cloudflare Tunnel, the frontend needs to use public URLs instead of internal Docker service names. The URLs are configured via environment variables in `.env`:

```bash
# Local development (default)
VITE_API_URL=http://localhost:3001
VITE_STRAPI_URL=http://localhost:1337
VITE_PRICING_URL=http://localhost:3004
VITE_WS_URL=ws://localhost:3004

# Production with Cloudflare Tunnel (example)
VITE_API_URL=https://api.printshop.example.com
VITE_STRAPI_URL=https://cms.printshop.example.com
VITE_PRICING_URL=https://api.printshop.example.com
VITE_WS_URL=wss://api.printshop.example.com
```

**Important:** After changing VITE_* variables, rebuild the frontend:
```bash
docker compose up -d --build frontend
```

## 🔧 Health Check Configuration

### Current Health Check Status
All services now include proper health checks in docker-compose.yml:

| Container | Health Check | Start Period | Notes |
|-----------|--------------|--------------|-------|
| postgres | pg_isready | - | Uses built-in readiness |
| redis | redis-cli ping | - | Uses built-in readiness |
| mongo | mongosh --eval | - | Uses built-in readiness |
| strapi | wget http://localhost:1337 | 180s | Needs time to build admin panel |
| api | wget /health | 30s | Fast startup |
| pricing-engine | wget /health | 30s | Fast startup |
| frontend | wget http://localhost:3000 | 60s | Needs time to serve build |

### Troubleshooting Health Checks
```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' printshop-strapi

# View health check logs
docker inspect --format='{{json .State.Health}}' printshop-strapi | jq

# Manual health check test
docker exec printshop-strapi wget --spider http://localhost:1337
```

## 🚨 Known Issues

1. **Strapi /admin may be slow on first load** - Wait 1-2 minutes for admin panel to build
2. **Supplier APIs are optional** - Services will start without API keys but inventory sync won't work
3. **First run requires Strapi admin creation** - Visit http://localhost:1337/admin to create first admin user

### Cloudflare Tunnel Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Frontend shows blank page | Wrong VITE_* URLs | Update `.env` with correct Cloudflare URLs, rebuild frontend |
| API returns 404 | Tunnel route misconfigured | Check tunnel routes in Cloudflare Zero Trust dashboard |
| CORS errors in browser | API URL mismatch | Ensure VITE_API_URL matches your actual tunnel domain |
| WebSocket fails to connect | HTTP instead of HTTPS | Use `wss://` for VITE_WS_URL when using Cloudflare Tunnel |
| 502 Bad Gateway | Container not running | Run `docker compose ps` to check container status |

## 📚 Additional Documentation

- `README.md` - Project overview
- `docs/ARCHITECTURE.md` - System architecture
- `docs/SERVICE_DIRECTORY.md` - Service inventory
- `MASTER_CONTEXT.md` - Full project context
- `DAILY_TASK_LOG.md` - Development history
