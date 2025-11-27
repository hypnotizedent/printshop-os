# PostgreSQL Deployment Guide for PrintShop OS

**Created:** November 26, 2025  
**Target:** Production server deployment with PostgreSQL

---

## Overview

Migrating from SQLite (development) to PostgreSQL (production) for:
- Better concurrent access
- Production-grade reliability
- Backup and replication support
- Same server as Immich (shared infrastructure)

---

## Server Requirements

### Minimum Specs
- **CPU:** 2+ cores
- **RAM:** 4GB (8GB recommended)
- **Storage:** 50GB SSD
- **OS:** Ubuntu 22.04 LTS / Debian 12

### Software Stack
- PostgreSQL 15+
- Node.js 20 LTS
- PM2 (process manager)
- Nginx (reverse proxy)
- Redis (optional, for caching)

---

## PostgreSQL Setup

### 1. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE printshop_os;
CREATE USER printshop WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE printshop_os TO printshop;

# Enable extensions (optional but recommended)
\c printshop_os
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

### 3. Configure PostgreSQL

Edit `/etc/postgresql/15/main/pg_hba.conf`:
```
# Allow local connections
local   all             printshop                               md5
host    all             printshop       127.0.0.1/32            md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## Strapi Configuration

### 1. Update Database Config

Edit `printshop-strapi/config/database.ts`:

```typescript
import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    sqlite: {
      connection: {
        filename: path.join(
          __dirname,
          '..',
          '..',
          env('DATABASE_FILENAME', '.tmp/data.db')
        ),
      },
      useNullAsDefault: true,
    },
    postgres: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'printshop_os'),
        user: env('DATABASE_USERNAME', 'printshop'),
        password: env('DATABASE_PASSWORD', ''),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
```

### 2. Production Environment File

Create `printshop-strapi/.env.production`:

```env
# Application
HOST=0.0.0.0
PORT=1337
APP_KEYS=your_app_key_1,your_app_key_2,your_app_key_3,your_app_key_4
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_token_salt
JWT_SECRET=your_jwt_secret

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=printshop_os
DATABASE_USERNAME=printshop
DATABASE_PASSWORD=your_secure_password_here
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Optional: Redis for caching
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

### 3. Generate Secure Keys

```bash
# Generate random keys
openssl rand -base64 32  # Run 4 times for APP_KEYS
openssl rand -base64 32  # API_TOKEN_SALT
openssl rand -base64 32  # ADMIN_JWT_SECRET
openssl rand -base64 32  # TRANSFER_TOKEN_SALT
openssl rand -base64 32  # JWT_SECRET
```

---

## Data Migration (SQLite → PostgreSQL)

### Option 1: Fresh Start (Recommended for MVP)

Since you have import scripts, re-import data to PostgreSQL:

```bash
# 1. Start Strapi with PostgreSQL
cd printshop-strapi
NODE_ENV=production npm run build
NODE_ENV=production npm run start

# 2. Re-run import scripts
cd ../scripts
python3 import-2025-customers.py
bash import-2025-orders.sh
python3 link-orders-customers.py
```

### Option 2: Data Export/Import

```bash
# Export from SQLite (using Strapi export)
cd printshop-strapi
npm run strapi export -- --file=backup

# Import to PostgreSQL
NODE_ENV=production npm run strapi import -- --file=backup.tar.gz
```

---

## Docker Compose (Production)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: printshop-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: printshop_os
      POSTGRES_USER: printshop
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - printshop
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U printshop -d printshop_os"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: printshop-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - printshop
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  strapi:
    build:
      context: ./printshop-strapi
      dockerfile: Dockerfile
    container_name: printshop-strapi
    restart: unless-stopped
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: printshop_os
      DATABASE_USERNAME: printshop
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
    env_file:
      - ./printshop-strapi/.env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "1337:1337"
    volumes:
      - strapi_uploads:/app/public/uploads
    networks:
      - printshop

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: printshop-frontend
    restart: unless-stopped
    ports:
      - "5000:80"
    depends_on:
      - strapi
    networks:
      - printshop

volumes:
  postgres_data:
  redis_data:
  strapi_uploads:

networks:
  printshop:
    driver: bridge
```

---

## Nginx Reverse Proxy

Create `/etc/nginx/sites-available/printshop`:

```nginx
# PrintShop OS - Main Application
server {
    listen 80;
    server_name printshop.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Strapi API
    location /api {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Strapi Admin
    location /admin {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket for Production Dashboard
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/printshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## PM2 Process Manager

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'strapi',
      cwd: './printshop-strapi',
      script: 'npm',
      args: 'run start',
      env_production: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'production-dashboard',
      cwd: './services/production-dashboard',
      script: 'npm',
      args: 'run start',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
    },
    {
      name: 'job-estimator',
      cwd: './services/job-estimator',
      script: 'npm',
      args: 'run start',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
    },
  ],
};
```

Start services:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Auto-start on reboot
```

---

## Backup Strategy

### Automated PostgreSQL Backups

Create `scripts/backup-postgres.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/printshop"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/printshop_os_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup with compression
pg_dump -U printshop printshop_os | gzip > $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /path/to/scripts/backup-postgres.sh
```

---

## Deployment Checklist

### Before Deployment
- [ ] Generate all secure keys/passwords
- [ ] Test PostgreSQL connection locally
- [ ] Build Strapi production bundle
- [ ] Test import scripts work

### During Deployment
- [ ] Install PostgreSQL on server
- [ ] Create database and user
- [ ] Copy `.env.production` to server
- [ ] Deploy code (git pull or rsync)
- [ ] Run `npm install --production`
- [ ] Run `npm run build` for Strapi
- [ ] Import data (customers, orders)
- [ ] Configure Nginx
- [ ] Start PM2 services

### After Deployment
- [ ] Verify all APIs respond
- [ ] Test admin login
- [ ] Verify data integrity (customer count, order count)
- [ ] Set up backup cron job
- [ ] Configure SSL (Let's Encrypt)
- [ ] Monitor logs for errors

---

## Monitoring

### PM2 Monitoring
```bash
pm2 monit          # Real-time monitoring
pm2 logs           # View logs
pm2 status         # Service status
```

### PostgreSQL Monitoring
```bash
# Connection count
psql -U printshop -d printshop_os -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
psql -U printshop -d printshop_os -c "SELECT pg_size_pretty(pg_database_size('printshop_os'));"
```

---

## Troubleshooting

### Common Issues

**Connection refused:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check port is open
sudo netstat -tlnp | grep 5432
```

**Permission denied:**
```bash
# Reset user password
sudo -u postgres psql
ALTER USER printshop WITH PASSWORD 'new_password';
```

**Strapi won't start:**
```bash
# Check logs
pm2 logs strapi --lines 100

# Verify database connection
psql -U printshop -d printshop_os -c "SELECT 1;"
```

---

## Next Steps

After PostgreSQL deployment:
1. Set up SSL certificates (Let's Encrypt)
2. Configure firewall (UFW)
3. Set up monitoring (Uptime Kuma)
4. Configure automated backups
5. Test disaster recovery

