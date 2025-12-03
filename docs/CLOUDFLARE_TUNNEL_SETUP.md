# Cloudflare Tunnel Setup for PrintShop OS

**Last Updated:** December 2025

This guide covers deploying PrintShop OS with the centralized Cloudflare Tunnel architecture.

---

## Overview

PrintShop OS uses a **centralized Cloudflare Tunnel** managed by a dedicated stack at `~/stacks/cloudflared/`. This provides:

- SSL/TLS termination (HTTPS)
- DDoS protection
- No exposed ports required
- Easy domain routing
- **Cross-stack connectivity** - One tunnel serves multiple stacks

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ~/stacks/cloudflared/                            │
│                   (Centralized Tunnel Stack)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  homelab-cloudflared                         │   │
│  │              (Cloudflare Tunnel Container)                   │   │
│  └───────────────────────┬─────────────────────────────────────┘   │
│                          │                                          │
│              ┌───────────┴───────────┐                             │
│              │    tunnel_network     │ (external Docker network)   │
│              └───────────┬───────────┘                             │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PrintShop OS │  │ Observability │  │   Automation  │
│               │  │    Stack      │  │     Stack     │
├───────────────┤  ├───────────────┤  ├───────────────┤
│ • strapi      │  │ • grafana     │  │ • n8n         │
│ • frontend    │  │ • prometheus  │  │ • ...         │
│ • api         │  │ • ...         │  │               │
│ • appsmith    │  │               │  │               │
│ • botpress    │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Why Centralized Tunnel?

The previous embedded `cloudflared` container in PrintShop OS caused:

1. **502 errors** - DNS resolution failures between cloudflared and services
2. **Unreliable restarts** - Cloudflared caches stale DNS, requires frequent restarts
3. **Not scalable** - Can't reach services in other stacks (observability, automation)
4. **Tight coupling** - Tunnel config was mixed with application config

The centralized approach:
- One tunnel serves all stacks
- Services connect via `tunnel_network` external network
- Tunnel config lives in dedicated tunnel-stack
- No cloudflared in individual application stacks

---

## Infrastructure

| Component | Location | Notes |
|-----------|----------|-------|
| Docker Host | 100.92.156.118 (Tailscale) | Dell R730XD via Proxmox |
| Cloudflared | `~/stacks/cloudflared/` | Centralized tunnel container |
| Tunnel Config | Cloudflare Dashboard | Routes configured via dashboard |
| Tunnel Stack | `~/stacks/cloudflared/docker-compose.yml` | Managed separately from PrintShop OS |
| Tunnel Network | `tunnel_network` | External Docker network |
| Tunnel Token | Environment variable | `CLOUDFLARE_TUNNEL_TOKEN` in cloudflared stack |

---

## Prerequisites

### 1. Start the Tunnel Stack

The Cloudflare Tunnel is managed in a dedicated stack at `~/stacks/cloudflared/`:

```bash
# Navigate to the cloudflared stack
cd ~/stacks/cloudflared

# Start the tunnel stack (if not already running)
docker compose up -d

# Verify tunnel_network exists
docker network ls | grep tunnel_network
```

**Cloudflared Stack Configuration** (`~/stacks/cloudflared/docker-compose.yml`):

```yaml
networks:
  tunnel_network:
    name: tunnel_network
    driver: bridge

services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: homelab-cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - tunnel_network
```

The `CLOUDFLARE_TUNNEL_TOKEN` is stored in the cloudflared stack's `.env` file or directly in `docker-compose.yml`.

### 2. Verify Tunnel is Running

```bash
# Check cloudflared container
docker ps | grep cloudflared

# Check tunnel logs
docker logs cloudflared --tail 20 | grep -i "Registered tunnel connection"
```

---

## Starting PrintShop OS

Use the startup script to ensure tunnel connectivity:

```bash
cd ~/stacks/printshop-os
./scripts/start-with-tunnel.sh
```

This script:
1. Verifies `tunnel_network` exists
2. Starts all PrintShop OS services
3. Waits for services to become healthy
4. Verifies internal connectivity

### Manual Start (Alternative)

```bash
# Start the stack
docker compose up -d

# If tunnel_network wasn't available at startup, reconnect:
./scripts/connect-networks.sh
```

---

## Production URLs

| Service | Production URL | Container:Port |
|---------|----------------|----------------|
| Frontend | https://mintprints-app.ronny.works | printshop-frontend:3000 |
| Strapi CMS | https://mintprints.ronny.works | printshop-strapi:1337 |
| API | https://mintprints-api.ronny.works | printshop-api:3001 |
| Appsmith | https://appsmith.ronny.works | printshop-appsmith:80 |
| Botpress | https://botpress.ronny.works | printshop-botpress:3000 |

### Infrastructure Services (Homelab Stacks)

These services run in the `homelab-infrastructure` repository stacks and share the same tunnel:

| Service | Production URL | Container:Port |
|---------|----------------|----------------|
| n8n (Automation) | https://n8n.ronny.works | n8n:5678 |
| Grafana (Monitoring) | https://grafana.ronny.works | grafana:3000 |
| Uptime Kuma | https://uptime.ronny.works | uptime-kuma:3001 |

---

## ⚠️ SSL Certificate Limitations

**CRITICAL:** Free Cloudflare SSL only covers **one level of subdomains**.

| Domain Pattern | SSL Coverage | Works? |
|----------------|--------------|--------|
| `ronny.works` | ✅ Covered | Yes |
| `*.ronny.works` | ✅ Covered | Yes |
| `*.mintprints.ronny.works` | ❌ NOT Covered | **No** |

### ❌ Incorrect (Won't Work)
```
app.mintprints.ronny.works    ← Two levels deep, SSL fails
api.mintprints.ronny.works    ← Two levels deep, SSL fails
```

### ✅ Correct (Works)
```
mintprints-app.ronny.works    ← Single level, SSL works
mintprints.ronny.works        ← Single level, SSL works
mintprints-api.ronny.works    ← Single level, SSL works
```

---

## Tunnel Configuration (Cloudflare Dashboard)

Configure routes in **Cloudflare Zero Trust → Networks → Tunnels → [Your Tunnel] → Public Hostnames**.

### Frontend Route
| Field | Value |
|-------|-------|
| Subdomain | `mintprints-app` |
| Domain | `ronny.works` |
| Service Type | HTTP |
| URL | `printshop-frontend:3000` |

### Strapi CMS Route
| Field | Value |
|-------|-------|
| Subdomain | `mintprints` |
| Domain | `ronny.works` |
| Service Type | HTTP |
| URL | `printshop-strapi:1337` |

### API Route
| Field | Value |
|-------|-------|
| Subdomain | `mintprints-api` |
| Domain | `ronny.works` |
| Service Type | HTTP |
| URL | `printshop-api:3001` |

---

## Network Connectivity

### How It Works

1. The tunnel stack creates `tunnel_network` as a Docker bridge network
2. PrintShop OS services connect to both `printshop_network` (internal) and `tunnel_network` (external)
3. The cloudflared container can resolve and reach all services on `tunnel_network`

### Services on tunnel_network

These services are exposed via tunnel_network for public access:

| Service | Container Name | Internal Port |
|---------|---------------|---------------|
| Strapi | printshop-strapi | 1337 |
| Frontend | printshop-frontend | 3000 |
| API | printshop-api | 3001 |
| Appsmith | printshop-appsmith | 80 |
| Botpress | printshop-botpress | 3000 |

### Services NOT on tunnel_network

These stay internal-only (no public access needed):

- printshop-postgres
- printshop-redis
- printshop-mongo
- printshop-pricing-engine

---

## Troubleshooting

### Quick Diagnosis

Run the network verification script:

```bash
./scripts/verify-network.sh
```

This checks:
- Network configuration
- Container connectivity
- DNS resolution
- HTTP reachability

### Check if services are on tunnel_network

```bash
# List networks for a container
docker inspect printshop-frontend --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# Should include both: printshop_network tunnel_network
```

### Reconnect to tunnel_network

If services were started before tunnel_network existed:

```bash
./scripts/connect-networks.sh
```

### Test container name resolution from cloudflared

```bash
# Exec into cloudflared and test DNS
docker exec cloudflared ping -c 1 printshop-frontend

# If this fails, the network connection is missing
```

### Common Causes of 502 Errors

| Cause | Symptom | Solution |
|-------|---------|----------|
| Services not on tunnel_network | Cannot resolve container names | `./scripts/connect-networks.sh` |
| tunnel_network doesn't exist | Network not found error | Start tunnel-stack first |
| Services not healthy | Tunnel connects but service returns error | Wait for healthchecks |
| Browser cache | Works in incognito but not regular browser | Hard refresh (Ctrl+Shift+R) |

### Service Health Check

```bash
# Check container health
docker ps --filter name=printshop --format "table {{.Names}}\t{{.Status}}"

# Manual health test
curl -I http://localhost:1337
curl -I http://localhost:5173
curl -I http://localhost:3001/health
```

### Test Direct Access Within Docker Network

```bash
# From the API container
docker exec printshop-api wget -qO- --spider http://printshop-frontend:3000 && echo "OK"
docker exec printshop-api wget -qO- --spider http://printshop-strapi:1337 && echo "OK"
```

---

## ⚠️ Browser Cache Issues (False 502 Errors)

**IMPORTANT:** Browsers aggressively cache error responses, including 502 Bad Gateway errors.

### Symptoms

- Site works in incognito/private window
- Regular browser shows 502 or blank page
- Server logs show successful requests
- `curl` from server works fine

### Solutions

| Method | How To | When to Use |
|--------|--------|-------------|
| Incognito test | Chrome: Ctrl+Shift+N / Firefox: Ctrl+Shift+P (Cmd on Mac) | First test after any deployment |
| Hard refresh | Ctrl+Shift+R / Cmd+Shift+R | Quick cache bypass |
| Clear site data | DevTools (F12) → Application tab → Clear site data | Persistent cache issues |
| Disable cache | DevTools (F12) → Network tab → Check "Disable cache" | During active debugging |

---

## Environment Variables for Production Build

When building the frontend for production, set these VITE_ variables:

```bash
# In .env or docker-compose build args
VITE_API_URL=https://mintprints-api.ronny.works
VITE_STRAPI_URL=https://mintprints.ronny.works
VITE_PRICING_URL=https://mintprints-api.ronny.works
VITE_WS_URL=wss://mintprints-api.ronny.works
```

**Important:** VITE_ variables are baked into the static bundle at build time, not runtime.

---

## Deployment Commands

### Deploy to docker-host

```bash
# Deploy to docker-host (via Tailscale)
rsync -avz --exclude node_modules --exclude .git . docker-host:~/stacks/printshop-os/

# Start with tunnel connectivity
ssh docker-host 'cd ~/stacks/printshop-os && ./scripts/start-with-tunnel.sh'

# Or manual start
ssh docker-host 'cd ~/stacks/printshop-os && docker compose up -d --build'
```

### Verify External Access

```bash
# Test public URLs
curl -I https://mintprints-app.ronny.works
curl -I https://mintprints.ronny.works
curl -I https://mintprints-api.ronny.works/health
```

---

## Quick Health Check

```bash
# Check all PrintShop containers
docker ps | grep printshop

# Check network connectivity
./scripts/verify-network.sh

# Test external access
curl -I https://mintprints-app.ronny.works
curl -I https://mintprints.ronny.works
curl -I https://mintprints-api.ronny.works
```

---

## Nuclear Recovery (When Nothing Works)

If standard troubleshooting fails:

```bash
# 1. Stop PrintShop OS
docker compose down

# 2. Verify tunnel-stack is running
docker ps | grep cloudflared
docker network ls | grep tunnel_network

# 3. If tunnel-stack is down, start it first
cd ~/stacks/infrastructure/stacks/tunnel-stack
docker compose up -d

# 4. Return to PrintShop OS and start fresh
cd ~/stacks/printshop-os
docker compose up -d

# 5. Verify connectivity
./scripts/connect-networks.sh --check
./scripts/verify-network.sh

# 6. Test public access
curl -I https://mintprints-app.ronny.works
```

---

## Post-Deployment Verification Checklist

After deploying PrintShop OS:

### 1. Verify Container Status
```bash
docker ps --filter name=printshop --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 2. Verify Network Connectivity
```bash
# Verify services are on tunnel_network
docker inspect printshop-frontend --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
# Should output: printshop_network tunnel_network
```

### 3. Verify Internal Connectivity
```bash
docker exec printshop-api wget -qO- --spider http://printshop-frontend:3000 && echo "Frontend OK"
docker exec printshop-api wget -qO- --spider http://printshop-strapi:1337 && echo "Strapi OK"
```

### 4. Test External Access
```bash
curl -I https://mintprints-app.ronny.works
curl -I https://mintprints.ronny.works
curl -I https://mintprints-api.ronny.works/health
```

### 5. Browser Verification
1. Open https://mintprints-app.ronny.works in incognito/private mode
2. Verify the page loads correctly
3. Check browser DevTools console for errors

---

## Related Documentation

- [docker-compose.yml](../docker-compose.yml) - Container configuration
- [.env.production.example](../.env.production.example) - Environment variables
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [scripts/start-with-tunnel.sh](../scripts/start-with-tunnel.sh) - Startup script
- [scripts/connect-networks.sh](../scripts/connect-networks.sh) - Network connection script
