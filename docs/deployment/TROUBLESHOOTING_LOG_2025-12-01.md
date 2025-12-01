# Deployment Troubleshooting Log - December 1, 2025

**Date:** December 1, 2025  
**Status:** Resolved ✅  
**Affected Services:** Frontend

---

## Issue Summary

After merging PR #243 (ArrowRight icon fix) and PR #244 (docs path fix), the frontend showed:
- 502 Bad Gateway errors via Cloudflare
- Blank page in some cases
- Browser console errors: "Error refreshing token: TypeError: Failed to fetch"

---

## Root Causes Identified

1. **Browser cache** - Old 502 error responses were cached by the browser
2. **Container rebuild needed** - Frontend needed rebuild to pick up merged changes
3. **Documentation confusion** - Wrong container names in troubleshooting docs

---

## Resolution Steps

### Step 1: Pull latest code

```bash
cd ~/stacks/printshop-os
git pull origin main
```

### Step 2: Rebuild frontend

```bash
docker compose up -d --build frontend
```

### Step 3: Verify container connectivity

```bash
# Check containers are on same network
docker inspect printshop-cloudflared --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker inspect printshop-frontend --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# Verify frontend is reachable internally
docker exec printshop-api wget -qO- --spider http://printshop-frontend:3000 && echo "Frontend reachable"

# Check tunnel logs
docker logs printshop-cloudflared --tail 20
```

### Step 4: Clear browser cache

**CRITICAL**: After fixing server-side issues, browsers cache 502 error responses!

**Solutions (in order of preference):**
1. **Incognito window** - Test in private/incognito mode first
2. **Hard refresh** - Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
3. **Clear site data** - Browser Settings → Privacy → Clear browsing data → Select "Cached images and files"
4. **DevTools disable cache** - F12 → Network tab → Check "Disable cache" (while DevTools open)

---

## Verification Commands

```bash
# Test from server
curl -I https://printshop-app.ronny.works

# Check all containers healthy
docker ps --filter "name=printshop" --format "table {{.Names}}\t{{.Status}}"

# Test internal connectivity
docker exec printshop-api wget -qO- --spider http://printshop-frontend:3000
```

---

## Lessons Learned

1. **Always test in incognito first after deployments** - Browsers cache error responses
2. **Browser-cached 502 errors persist** even after server is fixed
3. **Container naming:** The built-in cloudflared container is named `printshop-cloudflared`, not `cloudflared`
4. **Network name:** `printshop_network`, not `printshop-os_default`

---

## Related Documentation

- [Cloudflare Tunnel Setup](../CLOUDFLARE_TUNNEL_SETUP.md) - Full tunnel configuration
- [Troubleshooting Retrospective (Nov 30, 2025)](./TROUBLESHOOTING_RETROSPECTIVE_2025-11-30.md) - Previous session
- [Deployment Guide](../DEPLOYMENT.md) - Standard deployment procedures

---

**Last Updated:** December 1, 2025
