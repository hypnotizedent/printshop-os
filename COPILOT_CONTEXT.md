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

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React dashboard |
| Strapi Admin | http://localhost:1337/admin | CMS admin panel |
| Strapi API | http://localhost:1337/api | REST API |
| API Service | http://localhost:3001 | Inventory & supplier integration |
| Pricing Engine | http://localhost:3003 | Job estimator API |
| Appsmith | http://localhost:8080 | Production dashboard |
| Botpress | http://localhost:3100 | AI chatbot |

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

### 2025-11-30 Session
- ✅ Fixed Docker port conflicts (PR #199)
- ✅ Replaced mock data with real API calls (PR #198)
- ✅ Added startup script and portal API fixes (PR #200)
- ✅ Fixed supplier API environment variable warnings (this PR)

## 🚨 Known Issues

1. **Strapi /admin may be slow on first load** - Wait 1-2 minutes for admin panel to build
2. **Supplier APIs are optional** - Services will start without API keys but inventory sync won't work
3. **First run requires Strapi admin creation** - Visit http://localhost:1337/admin to create first admin user

## 📚 Additional Documentation

- `README.md` - Project overview
- `docs/ARCHITECTURE.md` - System architecture
- `docs/SERVICE_DIRECTORY.md` - Service inventory
- `MASTER_CONTEXT.md` - Full project context
- `DAILY_TASK_LOG.md` - Development history
