# PrintShop OS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: In Development](https://img.shields.io/badge/Status-In%20Development-blue.svg)]()
[![Version: 0.1.0-alpha](https://img.shields.io/badge/Version-0.1.0--alpha-orange.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.github/PULL_REQUEST_TEMPLATE.md)
[![CI/CD Pipeline](https://github.com/hypnotizedent/printshop-os/actions/workflows/ci.yml/badge.svg)](https://github.com/hypnotizedent/printshop-os/actions/workflows/ci.yml)
[![Repository Audit](https://github.com/hypnotizedent/printshop-os/actions/workflows/audit.yml/badge.svg)](https://github.com/hypnotizedent/printshop-os/actions/workflows/audit.yml)

> A mission-critical business operating system for apparel print shops, orchestrating production workflows, customer interactions, and operational efficiency through a modern, integrated software architecture.

---


## 🎯 Vision

PrintShop OS is designed to be the central nervous system for print shop operations, connecting order intake, production management, and business operations in a seamless, automated workflow. Built with scalability, reliability, and disaster recovery in mind, this system aims to eliminate manual processes and enable real-time operational visibility.

**Development Timeline:** 60 days to Level 1 MVP  
**Architecture:** Multi-component microservices with centralized data management  
**Deployment:** Docker-based, multi-server capable with full disaster recovery support

---

## 🏗️ System Architecture

PrintShop OS consists of three main components working together in a coordinated architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PrintShop OS Ecosystem                       │
└─────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │   CUSTOMERS      │
                        │  (Order Intake)  │
                        └────────┬─────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │      BOTPRESS          │
                    │  (Conversational AI)   │
                    │  - Order Collection    │
                    │  - Customer Interface  │
                    │  - Auto-responses      │
                    └───────────┬────────────┘
                                │
                                │ API Calls
                                │
            ┌───────────────────▼─────────────────────┐
            │          STRAPI (Central Hub)           │
            │       Headless CMS / Database API       │
            │                                         │
            │  ┌─────────────────────────────────┐  │
            │  │  Data Models:                   │  │
            │  │  • Jobs & Orders                │  │
            │  │  • Customers                    │  │
            │  │  • Employees & Time Tracking    │  │
            │  │  • Inventory (Future)           │  │
            │  │  • Invoicing (Future)           │  │
            │  └─────────────────────────────────┘  │
            │                                         │
            │  • RESTful API                         │
            │  • PostgreSQL Database                 │
            │  • Authentication & Permissions        │
            └───────────────┬─────────────────────────┘
                            │
                            │ API Integration
                            │
                ┌───────────▼────────────┐
                │      APPSMITH          │
                │ (Production Dashboard) │
                │                        │
                │  • Job Queue View      │
                │  • Job Details         │
                │  • Time Clock          │
                │  • Status Updates      │
                │  • Mobile Optimized    │
                └────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  PRODUCTION  │
                    │     TEAM     │
                    └──────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Infrastructure Layer: Docker, PostgreSQL, Redis, MongoDB           │
│  Deployment: Multi-server, Load-balanced, Disaster Recovery Ready   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 🎨 **Strapi** - Central API & Database
The heart of the system, managing all data and providing RESTful APIs.
- **Purpose:** Central data repository and API gateway
- **Technology:** Node.js-based Headless CMS
- **Database:** PostgreSQL (production), SQLite (development)
- **Repository:** Separate repository (to be created)
- **Documentation:** [Phase 1 Guide](docs/phases/phase-1-strapi.md)

#### 📊 **Appsmith** - Internal Production Dashboard
Mobile-optimized interface for production team to manage jobs and track time.
- **Purpose:** Internal operations dashboard
- **Technology:** Low-code application builder
- **Features:** Job management, time clock, status updates
- **Repository:** Separate repository (to be created)
- **Documentation:** [Phase 2 Guide](docs/phases/phase-2-appsmith.md)

#### 💬 **Botpress** - Customer Order Intake
Conversational AI interface for automated customer order collection.
- **Purpose:** Customer-facing order intake automation
- **Technology:** Conversational AI platform
- **Features:** Order collection, customer communication, API integration
- **Repository:** Separate repository (to be created)
- **Documentation:** [Phase 3 Guide](docs/phases/phase-3-botpress.md)

#### 🎨 **Frontend** - Modern React UI
Customer-facing portal and internal management interface.
- **Purpose:** Customer portal and operations dashboard
- **Technology:** React 19 + TypeScript + Tailwind CSS + Vite
- **Features:** Order management, quote generation, customer portal, real-time updates
- **Location:** `./frontend` directory
- **Documentation:** [Frontend README](frontend/README_FRONTEND.md), [Integration Guide](docs/SPARK_FRONTEND_INTEGRATION.md)

#### 💰 **Job Estimator** - Pricing Engine
Flexible JSON-driven pricing calculator with sub-100ms performance.
- **Purpose:** Accurate quote pricing with configurable rules
- **Technology:** Node.js/TypeScript with Express REST API
- **Features:** Volume discounts, location surcharges, color multipliers, margin tracking, caching
- **Location:** `./services/job-estimator` directory
- **API Docs:** [Pricing API](services/job-estimator/docs/PRICING_API.md)

---

## 🚀 Technology Stack

### Core Technologies
- **Backend/API:** Strapi 5.31.2 (Node.js 20+)
- **Frontend:** React 19 + TypeScript + Tailwind CSS + Vite
- **Database:** PostgreSQL 15+ (Production), SQLite 3 (Development)
- **Frontend Dashboard:** Appsmith CE (Latest)
- **Conversational AI:** Botpress 12.x+
- **Caching/Queue:** Redis 7+ (caching + Bull queue for workflows)
- **Document Store:** MongoDB 6+ (for Appsmith)
- **Job Queue:** Bull 4.12.0 with Redis backend
- **WebSocket:** Socket.io 4.6.0 (real-time notifications)

### Infrastructure
- **Containerization:** Docker 24+, Docker Compose 2.x
- **Reverse Proxy:** Nginx (Optional)
- **Version Control:** Git
- **Deployment:** Multi-server capable with Docker Swarm or Kubernetes (future)

### Development Tools
- **Package Manager:** npm/yarn
- **Environment Management:** dotenv
- **API Testing:** Postman, Thunder Client
- **Monitoring:** Docker health checks, logs

---

## ⚡ Quick Start

### Prerequisites
- **Docker & Docker Compose:** Required for local development
- **Node.js 18+:** For local Strapi development
- **Git:** For version control
- **8GB RAM minimum:** 16GB recommended
- **20GB disk space:** For all containers and data

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os

# Copy environment template
cp .env.example .env

# Edit .env with your configurations
nano .env  # or use your preferred editor
```

### 2. Start the System

**Choose the appropriate docker-compose file for your use case:**

```bash
# Development (Appsmith + MongoDB + Redis)
docker-compose -f docker-compose.local.yml up -d

# Production (Strapi + PostgreSQL + all services)
docker-compose up -d

# AI Services only (LLM + Vector DB)
docker-compose -f docker-compose.ai.yml up -d

# Label Formatter service
docker-compose -f docker-compose.label-formatter.yml up -d

# View logs for any configuration
docker-compose -f <file> logs -f

# Check service status
docker-compose -f <file> ps
```

**Docker Compose Files:**

| File | Purpose | Services Included | When to Use |
|------|---------|-------------------|-------------|
| `docker-compose.yml` | **Production deployment** | Strapi, PostgreSQL, Redis, Frontend, All APIs | Production environment, full system deployment |
| `docker-compose.local.yml` | **Local development** | Appsmith CE, MongoDB, Redis | Dashboard development, internal tools |
| `docker-compose.ai.yml` | **AI services** | LLM service, Vector database (ChromaDB) | AI features, quote optimizer, customer service automation |
| `docker-compose.label-formatter.yml` | **Label formatter** | Label generation service, Image processor | Automated shipping label formatting |

**Common Commands:**
```bash
# Start specific stack
docker-compose -f <file> up -d

# Stop services
docker-compose -f <file> down

# View logs (all services)
docker-compose -f <file> logs -f

# View logs (specific service)
docker-compose -f <file> logs -f <service-name>

# Restart a service
docker-compose -f <file> restart <service-name>

# Rebuild after code changes
docker-compose -f <file> up -d --build

# Remove volumes (fresh start)
docker-compose -f <file> down -v
```

### 3. Access the Components

After startup (allow 2-3 minutes for initialization):

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React dashboard and customer portal |
| **Strapi Admin** | http://localhost:1337/admin | CMS admin panel |
| **Strapi API** | http://localhost:1337/api | REST API endpoints |
| **API Service** | http://localhost:3001 | Inventory & supplier integration |
| **Pricing Engine** | http://localhost:3004 | Job estimator API |
| **Appsmith** | http://localhost:8080 | Production dashboard |
| **Botpress** | http://localhost:3100 | AI chatbot |

### 4. Initial Configuration

1. **Strapi:** Create admin account on first access
2. **Appsmith:** Create workspace and connect to Strapi API
3. **Botpress:** Import conversation flows

📚 **Detailed Setup:** See [Docker Setup Guide](docs/deployment/docker-setup.md)

---

## 🌐 Production Deployment with Cloudflare Tunnel

### Prerequisites
- Cloudflare account with a domain configured
- Cloudflare Tunnel (`cloudflared`) installed and running on your server
- Docker and Docker Compose installed

### Cloudflare Tunnel Routes

Configure these routes in your Cloudflare Zero Trust dashboard under **Access > Tunnels > Configure**:

| Subdomain | Service URL | Description |
|-----------|-------------|-------------|
| `app.yourdomain.com` | `http://printshop-frontend:3000` | Frontend React App |
| `cms.yourdomain.com` | `http://printshop-strapi:1337` | Strapi CMS Admin & API |
| `api.yourdomain.com` | `http://printshop-api:3001` | Backend API Service |

### Configuration Steps

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Update the VITE_* URLs** in `.env` to match your Cloudflare tunnel subdomains:
   ```env
   # Example for domain "printshop.example.com"
   VITE_API_URL=https://api.printshop.example.com
   VITE_STRAPI_URL=https://cms.printshop.example.com
   VITE_PRICING_URL=https://api.printshop.example.com
   VITE_WS_URL=wss://api.printshop.example.com
   ```

3. **Generate secure values** for secrets:
   ```bash
   # Generate random keys for Strapi
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. **Build and start with the new configuration:**
   ```bash
   docker compose up -d --build
   ```

### Verifying the Setup

After deployment, verify each service is accessible:
- Frontend: `https://app.yourdomain.com`
- Strapi Admin: `https://cms.yourdomain.com/admin`
- API Health: `https://api.yourdomain.com/health`

> **💡 Tip:** After rebuilding the frontend, always hard refresh your browser (`Ctrl+Shift+R` on Windows/Linux, `Cmd+Shift+R` on Mac) or test in incognito mode to avoid cached content.

### Troubleshooting Cloudflare Tunnel

| Issue | Solution |
|-------|----------|
| Frontend shows blank page | Check browser console for CORS errors. Ensure VITE_* URLs match your tunnel domains. |
| API requests fail | Verify tunnel routes point to correct container names and ports. |
| WebSocket disconnects | Use `wss://` protocol for VITE_WS_URL with Cloudflare tunnels. |
| 502 Bad Gateway | Container may not be running. Check `docker compose ps` and `docker compose logs`. |
| Stale content after deploy | Hard refresh browser or use incognito/private mode. Wait 1-2 min for Cloudflare cache to expire. |

---

## 📁 Repository Structure

```
printshop-os/
├── .github/                    # GitHub templates and workflows
│   ├── ISSUE_TEMPLATE/        # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                       # Comprehensive documentation
│   ├── architecture/          # System architecture docs
│   ├── phases/                # Implementation phase guides
│   ├── deployment/            # Deployment and operations
│   ├── api/                   # API documentation
│   └── CONTRIBUTING.md        # Contribution guidelines
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── docker-compose.yml         # Local development orchestration
├── CHANGELOG.md               # Version history
├── LICENSE                    # MIT License
├── README.md                  # This file
├── ROADMAP.md                 # Technical roadmap
└── SECURITY.md                # Security policy
```

### Component Repositories
Each component will have its own dedicated repository:
- `printshop-strapi` - Strapi configuration and customizations
- `printshop-appsmith` - Appsmith application exports
- `printshop-botpress` - Botpress bot configurations and flows

### Python Integrations

The `printshop_os/` directory contains Python-based integrations:

```
printshop_os/
├── shipping/                  # Shipping integrations
│   ├── easypost_client.py    # EasyPost API integration
│   └── __init__.py
├── __init__.py
└── README.md                  # Python module documentation
```

**Quick Start:**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure API keys in .env
EASYPOST_API_KEY=your_key_here

# Use the integrations
python examples/easypost_example.py
```

📚 **See:** [EasyPost Integration Guide](docs/api/easypost-integration.md)

---

## ✨ Key Features

### 💰 Flexible Pricing Engine (Phase 2.3)
**JSON-driven pricing with sub-100ms calculations**
- Volume discounts, location surcharges, color multipliers
- Embroidery stitch count pricing
- Configurable margin targets (35% default)
- Rule precedence system (most specific wins)
- In-memory caching with 5-minute TTL
- Complete pricing history and audit trail
- **API:** `POST /pricing/calculate` - [Full API Docs](services/job-estimator/docs/PRICING_API.md)
- **Performance:** 10-20ms average calculation time
- **Tests:** 85 passing tests with comprehensive coverage

### 🔄 Quote → Order → Job Workflow Automation (Phase 2.2)
**Asynchronous workflow with real-time notifications**
- Quote approval triggers automatic order and job creation
- Bull queue with Redis for reliable async processing
- 3x retry logic with exponential backoff
- WebSocket notifications to production team
- Email confirmations to customers (Nodemailer)
- Complete audit trail for compliance
- **API:** `POST /api/quotes/:id/approve`, `GET /api/quotes/:id/workflow-status`
- **Architecture:** Bull queue + Socket.io + audit logging
- **Tests:** 30 passing tests covering workflows and edge cases

### 🔒 Security & Reliability
- PostgreSQL driver with connection pooling
- Docker containerization with health checks
- Graceful shutdown handlers (SIGTERM, SIGINT)
- XSS prevention with HTML escaping
- Comprehensive error handling and logging

---

## 📖 Documentation

### Planning & Project Management
- [Planning Stack](.github/PLANNING.md) - Planning organization and workflows
- [Implementation Roadmap](.github/IMPLEMENTATION_ROADMAP.md) - Detailed phase-by-phase roadmap
- [Project Board](.github/PROJECT_BOARD.md) - GitHub Projects board workflow
- [Quick Reference](.github/QUICK_REFERENCE.md) - Quick reference guide for getting started
- [Labels Guide](.github/LABELS.md) - Issue labeling scheme

### Architecture & Design
- [System Overview](docs/architecture/system-overview.md) - High-level architecture
- [Data Flow](docs/architecture/data-flow.md) - Data flow and API patterns
- [Component Architecture](docs/architecture/component-architecture.md) - Detailed component breakdown

### Implementation Guides
- [Phase 1: Strapi Setup](docs/phases/phase-1-strapi.md) - Central API and database
- [Phase 2: Appsmith Dashboard](docs/phases/phase-2-appsmith.md) - Production interface
- [Phase 3: Botpress Integration](docs/phases/phase-3-botpress.md) - Customer intake bot

### Deployment & Operations
- [Docker Setup](docs/deployment/docker-setup.md) - Container orchestration
- [Environment Variables](docs/deployment/environment-variables.md) - Configuration guide
- [Disaster Recovery](docs/deployment/disaster-recovery.md) - Backup and recovery procedures

### API Reference
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API documentation with OpenAPI specs
- [Strapi Endpoints](docs/api/strapi-endpoints.md) - Complete API reference
- [Integration Guide](docs/api/integration-guide.md) - Integration patterns

#### OpenAPI Specifications
- [`services/api/openapi.yaml`](services/api/openapi.yaml) - API Service (Auth, Analytics, Inventory)
- [`services/job-estimator/openapi.yaml`](services/job-estimator/openapi.yaml) - Pricing Engine
- [`services/production-dashboard/openapi.yaml`](services/production-dashboard/openapi.yaml) - Production Dashboard
- [`printshop-strapi/openapi.yaml`](printshop-strapi/openapi.yaml) - Strapi CMS

### Contributing
- [Contributing Guidelines](docs/CONTRIBUTING.md) - Development workflow and standards

---

## 🔧 Troubleshooting

### Common Issues

#### Container Health Check Failures
If containers show as "unhealthy" even when services are responding:

```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' printshop-strapi

# View detailed health check logs
docker inspect --format='{{json .State.Health}}' printshop-strapi | jq

# Manual health check test (uses -O /dev/null to accept 302 redirects)
docker exec printshop-strapi wget --no-verbose --tries=1 -O /dev/null http://localhost:1337
```

**Strapi shows unhealthy:**
- Strapi returns a 302 redirect on the root URL (normal behavior)
- The health check has been configured to accept this response
- First startup takes 2-3 minutes to build the admin panel
- Check logs: `docker compose logs strapi`

**Frontend shows unhealthy:**
- Ensure the build completed successfully: `docker compose logs frontend`
- The frontend uses `serve` to host static files
- Check if port 3000 is accessible inside the container

#### Strapi Admin Panel Slow on First Load
This is expected behavior. Strapi builds the admin panel on first access in development mode.
- Wait 1-2 minutes for the initial build
- Subsequent loads will be fast

#### Database Connection Errors
```bash
# Check if PostgreSQL is running
docker compose exec postgres pg_isready -U strapi

# View PostgreSQL logs
docker compose logs postgres

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d
```

#### Port Conflicts
If ports are already in use:
```bash
# Check what's using a port
lsof -i :5173
netstat -tulpn | grep 5173

# Stop conflicting services or modify docker-compose.yml ports
```

### Service-Specific Troubleshooting

| Service | Logs Command | Common Issues |
|---------|--------------|---------------|
| Strapi | `docker compose logs strapi` | Database connection, admin build |
| Frontend | `docker compose logs frontend` | Build failures, asset issues |
| Pricing Engine | `docker compose logs pricing-engine` | Missing data files |
| PostgreSQL | `docker compose logs postgres` | Connection refused, auth |
| Redis | `docker compose logs redis` | Memory issues, persistence |
| API | `docker compose logs api` | Connection to Strapi, supplier APIs |

### Cloudflare Tunnel / cloudflared Troubleshooting

If external access via Cloudflare Tunnel is failing:

> **Note:** PrintShop OS includes a built-in `printshop-cloudflared` container. If you're using an external `cloudflared` from homelab-infrastructure, adjust container names accordingly.

```bash
# Check printshop-cloudflared status (built-in container)
docker ps | grep printshop-cloudflared

# View cloudflared logs
docker logs printshop-cloudflared --tail 100

# Test if cloudflared can reach services
docker exec printshop-cloudflared ping -c 1 printshop-frontend

# Check network connectivity
docker network inspect printshop_network | grep printshop-cloudflared

# If using external cloudflared, connect it to the PrintShop network
docker network connect printshop_network cloudflared
```

**Common cloudflared issues:**

| Issue | Symptom | Solution |
|-------|---------|----------|
| Browser cached 502 | Works in incognito, 502 in regular browser | Hard refresh (Ctrl+Shift+R) or clear browser cache |
| 502 Bad Gateway | Page shows Cloudflare error | Verify `printshop-cloudflared` is on `printshop_network` |
| Blank page after deploy | White screen, no errors | Rebuild frontend with `--no-cache`, then hard refresh browser |
| SSL Certificate Error | Browser shows certificate warning | Use single-level subdomain (e.g., `printshop-app.domain.com` not `app.printshop.domain.com`) |
| Connection Refused | Tunnel shows service offline | Verify container is running and bound to 0.0.0.0 |
| Stale content after deploy | Old page content shows | Hard refresh browser (`Ctrl+Shift+R` / `Cmd+Shift+R`) or use incognito mode |

### Quick Diagnosis Commands

```bash
# Complete system status check
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check container resource usage
docker stats --no-stream

# Check Docker network configuration
docker network ls && docker network inspect printshop_network

# Test service endpoints from inside Docker network
docker exec printshop-strapi wget -qO- http://localhost:1337 > /dev/null && echo "Strapi OK" || echo "Strapi FAIL"
docker exec printshop-frontend wget -qO- http://localhost:3000 > /dev/null && echo "Frontend OK" || echo "Frontend FAIL"

# Check disk space
docker system df

# View system events
docker events --since="1h" --until="0m"
```

### Full System Reset
```bash
# Stop all services and remove volumes (WARNING: deletes all data)
./scripts/start-printshop.sh clean

# Recreate from scratch
./scripts/start-printshop.sh setup
./scripts/start-printshop.sh start
```

### 🔥 Nuclear Reset (Complete Fresh Start)

Use this when the system is in an unrecoverable state:

```bash
# Step 1: Stop all PrintShop containers
docker compose down -v

# Step 2: Remove any orphaned containers
docker compose down --remove-orphans

# Step 3: Prune all unused Docker resources (careful - affects all Docker projects!)
docker system prune -a --volumes

# Step 4: Remove all PrintShop-specific volumes
docker volume rm $(docker volume ls -q | grep printshop) 2>/dev/null || true

# Step 5: Remove all PrintShop images
docker rmi $(docker images -q --filter reference='*printshop*') 2>/dev/null || true

# Step 6: Recreate environment
cp .env.example .env
# Edit .env with your secrets

# Step 7: Build and start fresh
docker compose build --no-cache
docker compose up -d

# Step 8: Wait for services to initialize (Strapi takes 2-3 min)
sleep 180 && docker compose ps

# Step 9: Verify health
./test-system.sh
```

### Nuclear Reset for cloudflared

#### Option 1: Built-in `printshop-cloudflared` (Recommended)

If using the built-in cloudflared from docker-compose.yml:

```bash
# Restart the cloudflared service (container name is printshop-cloudflared)
docker compose restart cloudflared

# Or force rebuild
docker compose up -d --build cloudflared

# Verify tunnel is connected (use container name for logs)
docker logs printshop-cloudflared --tail 50
```

#### Option 2: External cloudflared (Homelab Infrastructure)

If using an external `cloudflared` container:

```bash
# Stop external cloudflared
docker stop cloudflared

# Remove cloudflared container
docker rm cloudflared

# Reconnect to Cloudflare (uses stored credentials)
# Note: Ensure tunnel token is configured in your cloudflared config
# Replace $CLOUDFLARED_TUNNEL_TOKEN with your actual tunnel token from Cloudflare dashboard
docker run -d --name cloudflared --restart unless-stopped \
  cloudflare/cloudflared:latest tunnel run --token $CLOUDFLARED_TUNNEL_TOKEN

# Reconnect to PrintShop network
docker network connect printshop_network cloudflared

# Verify tunnel is connected
docker logs cloudflared --tail 50
```

### Recovery Checklist

When troubleshooting a down system, check in this order:

1. **[ ] Docker Engine Running?**
   ```bash
   docker info > /dev/null 2>&1 && echo "Docker OK" || echo "Docker NOT running"
   ```

2. **[ ] Disk Space Available?**
   ```bash
   df -h / | tail -1 | awk '{print "Available: " $4}'
   ```

3. **[ ] Memory Available?**
   ```bash
   free -h | head -2
   ```

4. **[ ] PostgreSQL Healthy?**
   ```bash
   docker compose exec postgres pg_isready -U strapi
   ```

5. **[ ] Redis Healthy?**
   ```bash
   docker compose exec redis redis-cli ping
   ```

6. **[ ] All Containers Running?**
   ```bash
   docker compose ps
   ```

7. **[ ] Can Containers Talk to Each Other?**
   ```bash
   docker exec printshop-strapi ping -c 1 postgres
   ```

8. **[ ] External Access Working (if using cloudflared)?**
   ```bash
   curl -I https://your-domain.com
   ```

---

## 🛣️ Roadmap

### Level 1 MVP (Current - 60 Day Timeline)
- ✅ Repository structure and documentation
- 🔄 Phase 1: Strapi central database (In Progress)
- ⏳ Phase 2: Appsmith production dashboard
- ⏳ Phase 3: Botpress order intake

### Future Modules
- **Finance Module:** Invoicing, payments, accounting integration
- **Marketing Module:** Email campaigns, customer analytics
- **Sales Module:** CRM, quotes, order tracking
- **Inventory Module:** Stock management, supplier integration
- **Reporting Module:** Business intelligence, analytics dashboards
- **Mobile Apps:** Native iOS/Android applications

---

## 🤖 For AI/Copilot Sessions

If you're a Copilot or AI agent starting a new session, please read:
- **[COPILOT_CONTEXT.md](./COPILOT_CONTEXT.md)** - Server configuration and session context
- **[MASTER_CONTEXT.md](./MASTER_CONTEXT.md)** - Full project documentation
- **[Onboarding Guide](docs/ONBOARDING.md)** - Quick start and architecture overview

---

## 🏠 Infrastructure Architecture

PrintShop OS uses a **two-repository architecture** that separates business services from infrastructure tooling:

| Repository | Purpose | Location on docker-host |
|------------|---------|------------------------|
| **printshop-os** (this repo) | Business/application services | `~/stacks/printshop-os` |
| **homelab-infrastructure** | Infra & monitoring services | `/mnt/docker/*-stack` directories |

> **📍 Note:** The canonical path `~/stacks/printshop-os` expands to `/home/docker-host/stacks/printshop-os`. This is the active git repository and the only location that should be used for deployments.

### What Runs Where

**PrintShop OS** contains only business/application services:
- React Frontend, Strapi CMS, PostgreSQL, Redis
- Inventory API, Job Estimator, Supplier Sync
- Appsmith, Botpress

**Homelab Infrastructure** runs via dedicated stacks:
- `/mnt/docker/automation-stack` - n8n (workflow automation)
- `/mnt/docker/observability-stack` - Grafana, Prometheus, Loki
- `/mnt/docker/infrastructure-stack` - Uptime Kuma, MinIO, Dozzle, ntfy

All stacks share a Docker network (`homelab-network`) for cross-stack communication.

### Production URLs (Cloudflare Tunnel)

| Service | URL |
|---------|-----|
| Frontend | https://printshop-app.ronny.works |
| Strapi CMS | https://printshop.ronny.works |
| API | https://api.ronny.works |
| Grafana | https://grafana.ronny.works |
| n8n | https://n8n.ronny.works |

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 🤝 Contributing

We welcome contributions! This project is being developed with AI assistance and is designed to be AI-friendly.

Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) for:
- Development workflow
- Coding standards
- Commit message conventions
- Pull request process

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🔒 Security

Security is paramount for business-critical systems. 

- **Report vulnerabilities:** See [SECURITY.md](SECURITY.md)
- **Security best practices:** Documented in deployment guides
- **Regular updates:** Dependencies monitored and updated
- **Data protection:** Encryption at rest and in transit

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help
- 📖 **Documentation:** Check the `/docs` folder first
- 💬 **Discussions:** Use GitHub Discussions for questions
- 🐛 **Bug Reports:** Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
- ✨ **Feature Requests:** Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)
- ❓ **Questions:** Use the [Question template](.github/ISSUE_TEMPLATE/question.md)

### Links
- **Project Repository:** https://github.com/hypnotizedent/printshop-os
- **Issue Tracker:** https://github.com/hypnotizedent/printshop-os/issues
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Roadmap:** [ROADMAP.md](ROADMAP.md)

---

## 🙏 Acknowledgments

Built with modern open-source technologies:
- [Strapi](https://strapi.io/) - Open-source headless CMS
- [Appsmith](https://www.appsmith.com/) - Low-code application platform
- [Botpress](https://botpress.com/) - Conversational AI platform
- [PostgreSQL](https://www.postgresql.org/) - Advanced open-source database
- [Docker](https://www.docker.com/) - Container platform

---

<div align="center">

**Built for print shops, by print shop professionals, with AI assistance**

[Get Started](docs/phases/phase-1-strapi.md) | [Documentation](docs/) | [Contribute](docs/CONTRIBUTING.md)

</div>
