# PrintShop OS Deployment Guide

**Last Updated:** December 2025

This guide provides comprehensive instructions for deploying PrintShop OS, including all services, databases, and external integrations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Service Port Reference](#service-port-reference)
4. [First-Time Setup](#first-time-setup)
5. [MongoDB Replica Set Setup](#mongodb-replica-set-setup)
6. [Cloudflare Tunnel Setup](#cloudflare-tunnel-setup)
7. [Credential Management](#credential-management)
8. [Deployment Commands](#deployment-commands)
9. [Troubleshooting](#troubleshooting)
10. [Orphan Container Cleanup](#orphan-container-cleanup)

---

## Architecture Overview

### Two-Repository Architecture

PrintShop OS uses a **clear separation** between business/application services and infrastructure tools:

| Repository | Purpose | Services |
|------------|---------|----------|
| **printshop-os** | Business/application services | Frontend, Strapi, PostgreSQL, Redis, APIs |
| **homelab-infrastructure** | Infrastructure & monitoring | Uptime Kuma, MinIO, Dozzle, ntfy, Grafana, Prometheus |

### Infrastructure Layout on docker-host

> **📍 Canonical Path:** The single source of truth for PrintShop OS on docker-host is `~/stacks/printshop-os` (expands to `/home/docker-host/stacks/printshop-os`). Always use this path for deployments and git operations.

```
docker-host (100.92.156.118)
├── ~/stacks/printshop-os/            # PrintShop OS (this repo) - CANONICAL LOCATION
│   └── docker-compose.yml            # Business services
│
└── /mnt/docker/                      # Homelab Infrastructure
    ├── automation-stack/             # n8n workflows
    ├── observability-stack/          # Grafana, Prometheus, Loki
    └── infrastructure-stack/         # Uptime Kuma, MinIO, Dozzle, ntfy
```

### Shared Network

All stacks connect via the `homelab-network` Docker network for cross-stack communication:

```bash
# Services can reference each other by container name:
# - printshop-strapi from n8n: http://printshop-strapi:1337
# - Grafana from any stack: http://grafana:3000
```

### Cloudflare Tunnel Routes (Current)

| Subdomain | Service | Container URL |
|-----------|---------|---------------|
| printshop-app.ronny.works | React Frontend | http://printshop-frontend:3000 |
| printshop.ronny.works | Strapi CMS | http://printshop-strapi:1337 |
| api.ronny.works | Backend API | http://printshop-api:3001 |
| n8n.ronny.works | Workflow Automation | http://n8n:5678 |
| grafana.ronny.works | Monitoring | http://grafana:3000 |
| uptime.ronny.works | Status Page | http://uptime-kuma:3001 |

> **Note:** Free Cloudflare SSL only covers one subdomain level. Use `printshop-app.ronny.works`, not `app.printshop.ronny.works`.

---

## Prerequisites

### Required Software

- **Docker** 24.0+ and **Docker Compose** 2.0+
  - Use `docker compose` (with space, V2), not `docker-compose` (with hyphen, V1 deprecated)
- **Git** for version control
- **SSH access** to deployment server (for remote deployments)

### Cloudflare (for external access)

- Cloudflare account with domain configured
- Cloudflare Tunnel (`cloudflared`) installed and running
- DNS records pointed to tunnel

### System Requirements

| Environment | CPU | RAM | Disk |
|-------------|-----|-----|------|
| Development | 2 cores | 8 GB | 50 GB SSD |
| Production | 4+ cores | 16+ GB | 100+ GB SSD |

---

## Service Port Reference

| Service | Internal Port | External Port | URL |
|---------|--------------|---------------|-----|
| Frontend | 3000 | 5173 | http://localhost:5173 |
| API | 3001 | 3001 | http://localhost:3001 |
| Strapi CMS | 1337 | 1337 | http://localhost:1337 |
| Appsmith | 80 | 8080 | http://localhost:8080 |
| Botpress | 3000 | 3100 | http://localhost:3100 |
| Pricing Engine | 3001 | 3004 | http://localhost:3004 |
| PostgreSQL | 5432 | 5432 | - |
| MongoDB | 27017 | 27017 | - |
| Redis | 6379 | 6379 | - |
| n8n | 5678 | 5678 | http://localhost:5678 |
| Grafana | 3000 | 3002 | http://localhost:3002 |
| Prometheus | 9090 | 9090 | http://localhost:9090 |

### Production URLs (Cloudflare Tunnel)

| Service | Production URL |
|---------|----------------|
| Frontend | https://printshop-app.ronny.works |
| Strapi CMS | https://printshop.ronny.works |
| API | https://api.ronny.works |

---

## First-Time Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os
```

### 2. Environment File Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your actual values
nano .env  # or vim, code, etc.
```

**Critical variables to update:**
- `POSTGRES_PASSWORD` - PostgreSQL password
- `MONGO_INITDB_ROOT_PASSWORD` - MongoDB password
- `STRAPI_JWT_SECRET` - Strapi JWT secret
- `STRAPI_ADMIN_JWT_SECRET` - Strapi admin JWT secret
- `STRAPI_APP_KEYS` - Comma-separated app keys
- `APPSMITH_ENCRYPTION_PASSWORD` - Appsmith encryption password
- `APPSMITH_ENCRYPTION_SALT` - Appsmith encryption salt

### 3. Generate Secure Secrets

```bash
# Generate random secrets for production use
openssl rand -base64 32  # For JWT secrets
openssl rand -base64 48  # For app keys

# Generate 4 app keys for Strapi
echo "$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
```

### 4. Initialize MongoDB Replica Set

Appsmith requires MongoDB to run as a replica set. Run the initialization script:

```bash
chmod +x scripts/init-mongo-replica.sh
./scripts/init-mongo-replica.sh
```

This script will:
1. Generate a MongoDB keyfile for replica set authentication
2. Set proper permissions on the keyfile
3. Start the MongoDB container
4. Initialize the replica set

### 5. Start All Services

```bash
docker compose up -d
```

### 6. Verify Services

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Quick health check
./scripts/health-check.sh
```

---

## MongoDB Replica Set Setup

### Why Replica Set?

Appsmith requires MongoDB to run as a replica set for:
- Transaction support
- Change streams (for real-time updates)
- Data consistency guarantees

### Manual Setup (If Script Fails)

#### 1. Generate Keyfile

```bash
# Generate keyfile
openssl rand -base64 756 > mongo-keyfile

# Set permissions (required by MongoDB)
chmod 400 mongo-keyfile

# Set ownership to MongoDB user (UID 999)
sudo chown 999:999 mongo-keyfile
```

#### 2. Start MongoDB

```bash
docker compose up -d mongo
sleep 15
```

#### 3. Initialize Replica Set

```bash
# Source environment variables
source .env

# Initialize replica set
docker exec printshop-mongo mongosh \
  -u "${MONGO_INITDB_ROOT_USERNAME:-root}" \
  -p "${MONGO_INITDB_ROOT_PASSWORD}" \
  --authenticationDatabase admin \
  --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
```

#### 4. Verify Replica Set

```bash
docker exec printshop-mongo mongosh \
  -u root \
  -p "${MONGO_INITDB_ROOT_PASSWORD}" \
  --authenticationDatabase admin \
  --eval "rs.status()"
```

---

## Cloudflare Tunnel Setup

For detailed Cloudflare Tunnel configuration, see [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md).

### Quick Summary

1. **Choose cloudflared option** - PrintShop OS includes a built-in `printshop-cloudflared` container, or you can use an external cloudflared
2. **Create a tunnel** in Cloudflare Zero Trust dashboard
3. **Configure public hostnames** to route to container names:

| Subdomain | Domain | Service URL |
|-----------|--------|-------------|
| printshop-app | ronny.works | http://printshop-frontend:3000 |
| printshop | ronny.works | http://printshop-strapi:1337 |
| api | ronny.works | http://printshop-api:3001 |

4. **Network configuration**:

| cloudflared Type | Container Name | Network Setup |
|------------------|----------------|---------------|
| **Built-in** (docker-compose.yml) | `printshop-cloudflared` | Auto-configured on `printshop_network` |
| **External** (homelab-infrastructure) | `cloudflared` | Run: `docker network connect printshop_network cloudflared` |

### SSL Certificate Note

Free Cloudflare SSL only covers **one level of subdomains**:
- ✅ `printshop.ronny.works` (works)
- ✅ `api.ronny.works` (works)
- ❌ `app.printshop.ronny.works` (won't work - two levels)

---

## Credential Management

### Services Requiring Credentials

| Service | Credential Type | How to Update |
|---------|----------------|---------------|
| PostgreSQL | Database password | Update `POSTGRES_PASSWORD` in `.env`, restart postgres |
| MongoDB | Root password | Update `MONGO_INITDB_ROOT_PASSWORD` in `.env`, reinitialize |
| Redis | Password (optional) | Update `REDIS_PASSWORD` in `.env`, restart redis |
| Strapi | JWT secrets | Update `STRAPI_*` vars in `.env`, restart strapi |
| Appsmith | Encryption keys | Update `APPSMITH_*` vars in `.env`, restart appsmith |

### Rotating Credentials

```bash
# Generate new secrets
NEW_SECRET=$(openssl rand -base64 32)

# Update .env file
sed -i "s/STRAPI_JWT_SECRET=.*/STRAPI_JWT_SECRET=$NEW_SECRET/" .env

# Restart affected services
docker compose restart strapi
```

### Environment Variables Reference

See [environment-variables.md](./deployment/environment-variables.md) for complete variable documentation.

---

## Deployment Commands

### Standard Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Clean up orphan containers (if services were removed)
docker compose up -d --remove-orphans
```

### Remote Deployment (via SSH)

```bash
# Deploy to docker-host (via Tailscale)
rsync -avz --exclude node_modules --exclude .git . docker-host:~/stacks/printshop-os/

# SSH and start services
ssh docker-host 'cd ~/stacks/printshop-os && docker compose up -d --build'

# Reconnect cloudflared if needed
ssh docker-host 'docker network connect printshop_network cloudflared'
```

### Force Rebuild (No Cache)

```bash
docker compose build --no-cache
docker compose up -d
```

### Post-Deployment Checklist

After running `docker compose up -d --build`:

- [ ] Wait 30 seconds for containers to become healthy
- [ ] Verify containers: `docker ps --filter "name=printshop"`
- [ ] **Test in incognito/private window first** (browsers cache 502 errors!)
- [ ] Hard refresh regular browser: Ctrl+Shift+R / Cmd+Shift+R
- [ ] Check tunnel logs: `docker logs printshop-cloudflared --tail 20`
- [ ] Verify internal connectivity: `docker exec printshop-api wget -qO- --spider http://printshop-frontend:3000`

---

## Troubleshooting

### Common Startup Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| MongoDB fails to start | Missing keyfile | Run `./scripts/init-mongo-replica.sh` |
| Appsmith shows error | MongoDB not in replica set mode | Initialize replica set |
| Strapi 502 error | Database not ready | Wait for postgres healthcheck, then restart strapi |
| Frontend 502 (external access) | External cloudflared not on network | `docker network connect printshop_network cloudflared` |
| Frontend 502 (built-in cloudflared) | Network issue or container not running | Check with `docker ps --filter name=printshop-cloudflared` |

### Checking Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f strapi

# Last 100 lines
docker compose logs --tail 100 strapi

# Since timestamp
docker compose logs --since 30m

# Check cloudflared logs (built-in)
docker logs printshop-cloudflared --tail 50
```

### Healthcheck Failures

```bash
# Check container health
docker inspect printshop-strapi --format='{{json .State.Health}}'

# Manual health test
curl -I http://localhost:1337/_health
curl -I http://localhost:8080/api/v1/health
```

### Database Connection Issues

```bash
# Test PostgreSQL
docker exec printshop-postgres psql -U strapi -d printshop -c "SELECT 1;"

# Test MongoDB
docker exec printshop-mongo mongosh -u root -p $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --eval "db.adminCommand('ping')"

# Test Redis
docker exec printshop-redis redis-cli ping
```

---

## Post-Deployment Verification

After every deployment, verify the system is working correctly:

### Quick Verification Commands

```bash
# 1. Check all containers are running
docker ps --filter name=printshop --format "table {{.Names}}\t{{.Status}}"

# 2. Verify containers are on the correct network (should output: printshop_network)
docker inspect printshop-cloudflared --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker inspect printshop-frontend --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# 3. Test container-to-container connectivity (uses wget or curl depending on container)
docker exec printshop-api wget -qO- --spider http://printshop-frontend:3000 && echo "Frontend reachable" || \
  docker exec printshop-api curl -sf http://printshop-frontend:3000 > /dev/null && echo "Frontend reachable"

# 4. Verify tunnel is connected
docker logs printshop-cloudflared --tail 10 | grep -i "Registered tunnel connection"

# 5. Test from host
curl -I http://localhost:5173
```

### Browser Hard Refresh After Deployment

After rebuilding the frontend, browsers may cache old content. Always:

1. **Hard refresh the page**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Or test in incognito/private mode** first
3. **Wait 1-2 minutes** for Cloudflare edge caches to expire

### Full Verification Checklist

For a complete post-deployment verification checklist, see the [Cloudflare Tunnel Setup Guide](./CLOUDFLARE_TUNNEL_SETUP.md#post-deployment-verification-checklist).

---

## Orphan Container Cleanup

When services are removed from `docker-compose.yml`, old containers remain. Clean them up:

```bash
# Start services and remove orphans
docker compose up -d --remove-orphans

# Manual orphan cleanup
docker container prune -f
```

### Full Docker Cleanup (Nuclear Option)

⚠️ **Warning:** This removes ALL Docker data including volumes!

```bash
# Stop everything
docker compose down

# Remove all containers, images, networks
docker system prune -af

# Remove all volumes (DATA LOSS!)
docker volume prune -f

# Rebuild fresh
docker compose build --no-cache
docker compose up -d
```

---

## Related Documentation

- [Docker Setup Guide](./deployment/docker-setup.md) - Detailed Docker configuration
- [Environment Variables](./deployment/environment-variables.md) - All environment variables
- [Cloudflare Tunnel Setup](./CLOUDFLARE_TUNNEL_SETUP.md) - External access configuration
- [Troubleshooting Retrospective (Nov 30, 2025)](./deployment/TROUBLESHOOTING_RETROSPECTIVE_2025-11-30.md) - Case study of common issues
- [Troubleshooting Log (Dec 1, 2025)](./deployment/TROUBLESHOOTING_LOG_2025-12-01.md) - Browser cache issues
- [Disaster Recovery](./deployment/disaster-recovery.md) - Backup and restore procedures

---

## Git Sync Instructions

After making changes on the server:

```bash
# Commit current working state
git add -A
git commit -m "fix: deployment configuration changes"
git push origin main
```

To update server from repository:

```bash
cd ~/stacks/printshop-os
git pull origin main
docker compose up -d --remove-orphans
```

---

**Deployment Guide Complete! ✅**
