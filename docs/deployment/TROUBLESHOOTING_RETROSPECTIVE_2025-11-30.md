# Troubleshooting Retrospective: Docker Networking & Cloudflared Tunnel (Nov 30, 2025)

**Date:** November 30, 2025  
**Status:** Resolved ✅  
**Affected Services:** Frontend, Cloudflared Tunnel

---

## Summary

This document records the full end-to-end troubleshooting session that resolved a day-long outage affecting the PrintShop OS frontend and Cloudflared tunnel connectivity.

### Root Causes Identified

1. **Docker Network Subnet Changes** - Cloudflared container was disconnected from the PrintShop network after Docker Compose recreated containers with new IP assignments
2. **Stale Build Cache** - Frontend bundle changes were not reflected due to cached Docker layers
3. **Orphaned Networks/Volumes** - Legacy Docker networks and volumes causing conflicts

---

## What Was Done

### 1. Code Verification
- Pulled latest `main` branch
- Verified critical files (`App.tsx` and imports)
- Confirmed source code was correct

### 2. Full Docker Cleanup
- Removed all containers, networks, and volumes
- Purged all build caches
- Cleared orphaned/legacy Docker networks and volumes

### 3. Rebuild & Redeploy
- Rebuilt ALL images with `--no-cache` flag
- Restarted the entire stack

### 4. Cloudflared Tunnel Reconnection
- Reconnected `cloudflared` container to the correct Docker network
- Verified tunnel registration in Cloudflare dashboard
- Confirmed DNS sync and tunnel health

### 5. Verification
- Tested frontend access via https://printshop-app.ronny.works/
- Verified Cloudflared logs showed successful connections (no 502 errors)
- Confirmed DNS and HTTP reachability from both cloudflared and frontend containers

---

## Key Lessons Learned

### Docker Networking
- **When Docker Compose containers or IPs change**, cloudflared loses its connection to the service network
- **Always run** `docker network connect <network> cloudflared` after recreating containers
- **Check subnets** if containers can't reach each other by hostname

### Build Cache Issues
- If bundle changes are not showing after deployment, **always rebuild with `--no-cache`**
- Cached layers can persist even after source changes

### Cloudflared Debugging
- Check cloudflared logs for tunnel registration and connection errors
- Test DNS resolution from inside the cloudflared container
- Verify the tunnel can reach backend services by container name

---

## Troubleshooting Cheatsheet

### Nuclear Clean (Use When Nothing Else Works)

```bash
# Stop and remove everything
docker compose down

# Remove all containers, images, networks (WARNING: removes ALL Docker data)
docker system prune -af

# Remove all volumes
docker volume prune -f

# Rebuild without cache
docker compose build --no-cache

# Start fresh
docker compose up -d
```

### Cloudflared Network Reconnection

```bash
# Check which networks cloudflared is connected to
docker inspect cloudflared --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# Connect cloudflared to the PrintShop network
docker network connect printshop_network cloudflared

# Verify the connection
docker network inspect printshop_network | grep cloudflared
```

### Test Connectivity from Cloudflared

```bash
# Ping the frontend container from cloudflared
docker exec cloudflared ping -c 1 printshop-frontend

# Test HTTP access
docker exec cloudflared wget -qO- http://printshop-frontend:3000 | head -20

# Check cloudflared logs for errors
docker logs cloudflared --tail 100
```

### Quick Health Checks

```bash
# Check all PrintShop containers
docker ps | grep printshop

# Test external access
curl -I https://printshop-app.ronny.works
curl -I https://printshop.ronny.works
curl -I https://api.ronny.works

# Check container resource usage
docker stats --no-stream
```

### Check Frontend Assets

```bash
# Verify frontend is serving the correct bundle
curl -s https://printshop-app.ronny.works | grep -o 'assets/[^"]*\.js' | head -5

# Check bundle directly from container
docker exec printshop-frontend ls -la /app/dist/assets/
```

---

## If Nothing Works Checklist

When standard troubleshooting fails, follow this escalation path:

1. ☐ **Prune everything** (`docker system prune -af && docker volume prune -f`)
2. ☐ **Check subnet conflicts** (`docker network ls` and `docker network inspect <network>`)
3. ☐ **Reconnect cloudflared** to the correct network
4. ☐ **Rebuild with --no-cache**
5. ☐ **Restart cloudflared container** (`docker restart cloudflared`)
6. ☐ **Check Cloudflare Dashboard** for tunnel status
7. ☐ **Verify DNS records** point to the correct tunnel

---

## Historical Reference

### Screenshot - Frontend Restored (Nov 30, 2025)

The dashboard was successfully restored and accessible at `https://printshop-app.ronny.works/`:

![PrintShop OS Dashboard - Restored Nov 30, 2025](https://github.com/user-attachments/assets/2db4faad-6fbb-4a24-b91a-21b0d475a13a)

**Verified Working:**
- Dashboard with active jobs, revenue, and machine status
- Navigation sidebar fully functional
- All widgets loading correctly
- Theme switching operational

---

## Related Documentation

- [Cloudflare Tunnel Setup](../CLOUDFLARE_TUNNEL_SETUP.md) - Full tunnel configuration guide
- [Docker Setup Guide](./docker-setup.md) - Docker installation and configuration
- [Disaster Recovery](./disaster-recovery.md) - Backup and restore procedures

---

**Resolves:** Recent deployment issues, asset cache, and tunnel connectivity problems.

**Last Updated:** November 30, 2025
