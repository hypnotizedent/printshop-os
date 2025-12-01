# Cloudflare Tunnel Setup for PrintShop OS

**Last Updated:** December 2025

This guide covers deploying PrintShop OS with Cloudflare Tunnel for secure external access with SSL termination.

---

## Overview

Cloudflare Tunnel provides:
- SSL/TLS termination (HTTPS)
- DDoS protection
- No exposed ports required
- Easy domain routing

---

## Cloudflared Container Options

PrintShop OS supports two cloudflared configurations:

### Option 1: Built-in cloudflared (Recommended for New Deployments)

The docker-compose.yml includes a `printshop-cloudflared` container that's pre-configured on the `printshop_network`. This is the simplest setup:

```yaml
# Already defined in docker-compose.yml
cloudflared:
  image: cloudflare/cloudflared:latest
  container_name: printshop-cloudflared
  networks:
    printshop_network:
      ipv4_address: 172.21.0.250
```

Just set `CLOUDFLARE_TUNNEL_TOKEN` in your `.env` file and start the stack.

### Option 2: External cloudflared (Homelab Infrastructure)

If you're using a shared `cloudflared` container from `homelab-infrastructure`:

1. The external cloudflared must be connected to `printshop_network`
2. Remove or disable `printshop-cloudflared` from docker-compose.yml to avoid conflicts
3. Run: `docker network connect printshop_network cloudflared`

---

## Infrastructure

| Component | Location | Notes |
|-----------|----------|-------|
| Docker Host | 100.92.156.118 (Tailscale) | Dell R730XD via Proxmox |
| Cloudflared | Running on docker-host | Connects to Cloudflare edge |
| Tunnel Config | Cloudflare Dashboard | Not a local config file |

---

## ⚠️ SSL Certificate Limitations

**CRITICAL:** Free Cloudflare SSL only covers **one level of subdomains**.

| Domain Pattern | SSL Coverage | Works? |
|----------------|--------------|--------|
| `ronny.works` | ✅ Covered | Yes |
| `*.ronny.works` | ✅ Covered | Yes |
| `*.printshop.ronny.works` | ❌ NOT Covered | **No** |

### ❌ Incorrect (Won't Work)
```
app.printshop.ronny.works     ← Two levels deep, SSL fails
api.printshop.ronny.works     ← Two levels deep, SSL fails
```

### ✅ Correct (Works)
```
printshop-app.ronny.works     ← Single level, SSL works
printshop.ronny.works         ← Single level, SSL works
api.ronny.works               ← Single level, SSL works
```

---

## Production URLs

| Service | Production URL | Docker Container |
|---------|----------------|------------------|
| Frontend | https://printshop-app.ronny.works | printshop-frontend:3000 |
| Strapi CMS | https://printshop.ronny.works | printshop-strapi:1337 |
| API | https://api.ronny.works | printshop-api:3001 |

### Infrastructure Services (Homelab Stacks)

These services run in the `homelab-infrastructure` repository stacks and share the same tunnel:

| Service | Production URL | Docker Container |
|---------|----------------|------------------|
| n8n (Automation) | https://n8n.ronny.works | n8n:5678 |
| Grafana (Monitoring) | https://grafana.ronny.works | grafana:3000 |
| Uptime Kuma | https://uptime.ronny.works | uptime-kuma:3001 |

> **Note:** Keep Cloudflare tunnel routes in sync with running services. Update the tunnel configuration in Cloudflare Zero Trust dashboard whenever services are added or removed.

---

## Docker Network Requirements

The cloudflared container must be on the **same Docker network** as the services it proxies.

### Connect cloudflared to the PrintShop network

```bash
# One-time command to connect cloudflared to printshop_network
docker network connect printshop_network cloudflared

# Verify connection
docker network inspect printshop_network | grep cloudflared
```

### Why This Is Required

Without network connectivity:
1. cloudflared cannot resolve container names (e.g., `printshop-frontend`)
2. You'll see `502 Bad Gateway` errors
3. DNS lookups for container names will fail

---

## Tunnel Configuration (Cloudflare Dashboard)

Configure routes in **Cloudflare Zero Trust → Networks → Tunnels → [Your Tunnel] → Public Hostnames**.

### Frontend Route
| Field | Value |
|-------|-------|
| Subdomain | `printshop-app` |
| Domain | `ronny.works` |
| Service Type | HTTP |
| URL | `printshop-frontend:3000` |

### Strapi CMS Route
| Field | Value |
|-------|-------|
| Subdomain | `printshop` |
| Domain | `ronny.works` |
| Service Type | HTTP |
| URL | `printshop-strapi:1337` |

### API Route
| Field | Value |
|-------|-------|
| Subdomain | `api` |
| Domain | `ronny.works` |
| Service Type | HTTP |
| URL | `printshop-api:3001` |

### Infrastructure Services Routes

#### n8n (Workflow Automation)
| Field | Value |
|-------|-------|
| Subdomain | `n8n` |
| Domain | `ronny.works` |
| Service Type | HTTP |
| URL | `n8n:5678` |

#### Grafana (Monitoring)
| Field | Value |
|-------|-------|
| Subdomain | `grafana` |
| Domain | `ronny.works` |
| Service Type | HTTP |
| URL | `grafana:3000` |

#### Uptime Kuma (Status Page)
| Field | Value |
|-------|-------|
| Subdomain | `uptime` |
| Domain | `ronny.works` |
| Service Type | HTTP |
| URL | `uptime-kuma:3001` |

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
| Disable cache | DevTools (F12) → Network tab → Check "Disable cache" | During active debugging (while DevTools open) |

### Why This Happens

1. Cloudflare edge caches responses (including errors) for performance
2. Browser caches responses locally
3. Even after server fix, cached 502 persists until cache expires or is cleared

### Prevention

After every deployment, always test in incognito window first before reporting issues.

---

## Troubleshooting 502 Bad Gateway

### 1. Check if cloudflared is on the correct network

```bash
# List networks for cloudflared
docker inspect cloudflared --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# Should include: printshop_network
```

### 2. Test container name resolution from cloudflared

```bash
# Exec into cloudflared and test DNS
docker exec cloudflared ping -c 1 printshop-frontend

# If this fails, the network connection is missing
```

### 3. Check if the service is listening on 0.0.0.0

```bash
# Check listening ports inside the container
docker exec printshop-frontend netstat -tlnp

# Should show: 0.0.0.0:3000, NOT 127.0.0.1:3000
```

### 4. Verify the service is healthy

```bash
# Check container status
docker ps --filter name=printshop

# View logs
docker logs printshop-frontend --tail 50
```

### 5. Test direct access within Docker network

```bash
# From another container on the same network
docker exec printshop-strapi curl -I http://printshop-frontend:3000
```

---

## Environment Variables for Production Build

When building the frontend for production, set these VITE_ variables:

```bash
# In .env or docker-compose build args
VITE_API_URL=https://api.ronny.works
VITE_STRAPI_URL=https://printshop.ronny.works
VITE_PRICING_URL=https://api.ronny.works
VITE_WS_URL=wss://api.ronny.works
```

**Important:** VITE_ variables are baked into the static bundle at build time, not runtime.

---

## Deployment Commands

```bash
# Deploy to docker-host (via Tailscale)
rsync -avz --exclude node_modules --exclude .git . docker-host:~/stacks/printshop-os/
ssh docker-host 'cd ~/stacks/printshop-os && docker compose up -d --build'

# Connect cloudflared to the network (if not already connected)
ssh docker-host 'docker network connect printshop_network cloudflared'

# Verify services
ssh docker-host 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
```

---

## Quick Health Check

```bash
# Check all PrintShop containers
docker ps | grep printshop

# Test external access
curl -I https://printshop-app.ronny.works
curl -I https://printshop.ronny.works
curl -I https://api.ronny.works
```

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | cloudflared not on same network | `docker network connect printshop_network cloudflared` |
| 502 on non-root paths only | SPA routing not configured | Rebuild frontend (uses serve.json for rewrites) |
| Connection refused | Service binding to 127.0.0.1 | Update CMD to bind to 0.0.0.0 |
| SSL certificate error | Using nested subdomain | Use single-level subdomain pattern |
| Empty page loads | Wrong VITE_ URLs | Rebuild frontend with correct production URLs |
| Stale assets after deploy | Docker build cache | Rebuild with `docker compose build --no-cache` |
| Containers unreachable | Orphaned networks/volumes | Run `docker system prune -af && docker volume prune -f` |

### Special Case: 502 Only on Non-Root URLs

If the root URL (`/`) works but other paths like `/dashboard` or `/portal` return 502:

1. **Verify SPA routing is configured** - The frontend uses `serve.json` for path rewrites
2. **Check Cloudflare tunnel doesn't have path-specific routes** - All paths should go to the same service
3. **Rebuild the frontend** to ensure the serve configuration is included:

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

---

## Nuclear Recovery (When Nothing Works)

If standard troubleshooting fails, follow this escalation path:

```bash
# 1. Stop everything
docker compose down

# 2. Full cleanup (WARNING: removes all Docker data)
docker system prune -af && docker volume prune -f

# 3. Rebuild without cache
docker compose build --no-cache

# 4. Start fresh
docker compose up -d

# 5. Reconnect cloudflared to the network
docker network connect printshop_network cloudflared

# 6. Verify
curl -I https://printshop-app.ronny.works
```

For a detailed case study, see [Troubleshooting Retrospective (Nov 30, 2025)](deployment/TROUBLESHOOTING_RETROSPECTIVE_2025-11-30.md) and [Troubleshooting Log (Dec 1, 2025)](deployment/TROUBLESHOOTING_LOG_2025-12-01.md).

---

## Related Documentation

- [docker-compose.yml](../../docker-compose.yml) - Container configuration
- [.env.production.example](../../.env.production.example) - Environment variables
- [SERVICE_DIRECTORY.md](../../SERVICE_DIRECTORY.md) - Full service inventory
- [Troubleshooting Retrospective (Nov 30, 2025)](deployment/TROUBLESHOOTING_RETROSPECTIVE_2025-11-30.md) - Detailed case study of Docker/tunnel recovery
- [Troubleshooting Log (Dec 1, 2025)](deployment/TROUBLESHOOTING_LOG_2025-12-01.md) - Browser cache issues and deployment troubleshooting
