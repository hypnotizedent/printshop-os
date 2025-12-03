# 🚀 PrintShop OS - Strapi CMS

Strapi is the headless CMS powering PrintShop OS. It provides the REST API for all data operations.

## 🔧 Quick Setup

```bash
# Install dependencies
npm install

# Start in development mode (auto-rebuilds admin panel)
npm run develop

# Build for production
npm run build
npm run start
```

## ⚠️ Troubleshooting: Admin Panel Not Loading

**Problem:** Visiting `http://your-server:1337/admin` shows a blank page or 404, but `http://your-server:1337` works.

**Cause:** Strapi doesn't know its public URL, so admin panel assets are served from incorrect paths.

**Solution:**

1. **Set the `PUBLIC_URL` environment variable** to the URL where Strapi is publicly accessible:

   ```bash
   # In your .env file
   PUBLIC_URL=http://100.92.156.118:1337  # For direct IP access
   # OR
   PUBLIC_URL=https://mintprints.ronny.works  # For domain with Cloudflare Tunnel
   ```

2. **Rebuild the admin panel:**

   ```bash
   npm run build
   npm run start
   ```

3. **For Docker deployments:**

   ```bash
   # Stop the container
   docker compose down strapi
   
   # Rebuild and restart
   docker compose up -d --build strapi
   ```

**Important:** Always rebuild after changing `PUBLIC_URL`. The admin panel assets are generated at build time with hardcoded URLs.

## 📁 Configuration Files

| File | Purpose |
|------|---------|
| `config/server.ts` | Server host, port, and public URL |
| `config/admin.ts` | Admin panel settings |
| `config/database.ts` | Database connection (SQLite/PostgreSQL) |
| `config/middlewares.ts` | Request processing middleware |

## 🗄️ Content Types

| Type | API Endpoint | Description |
|------|-------------|-------------|
| Customer | `/api/customers` | Customer records |
| Order | `/api/orders` | Orders and quotes |
| Job | `/api/jobs` | Production jobs |
| Product | `/api/products` | Supplier product catalog |
| Employee | `/api/employees` | Staff records |
| Time Clock Entry | `/api/time-clock-entries` | Time tracking |

## 📚 Learn More

- [Strapi Documentation](https://docs.strapi.io)
- [Resource Center](https://strapi.io/resource-center)
- [Strapi Community Discord](https://discord.strapi.io)
