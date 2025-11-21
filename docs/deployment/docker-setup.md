# Docker Setup Guide - PrintShop OS

## Overview

This guide provides comprehensive instructions for deploying PrintShop OS using Docker and Docker Compose. Docker provides consistent, isolated environments perfect for development, staging, and production deployments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Installation](#docker-installation)
3. [Single-Server Deployment](#single-server-deployment)
4. [Multi-Server Strategy](#multi-server-strategy)
5. [Network Configuration](#network-configuration)
6. [Volume Management](#volume-management)
7. [Health Checks and Monitoring](#health-checks-and-monitoring)
8. [Scaling and Load Balancing](#scaling-and-load-balancing)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum (Development):**
- CPU: 2 cores
- RAM: 8 GB
- Disk: 50 GB SSD
- OS: Linux, macOS, or Windows 10/11 with WSL2

**Recommended (Production):**
- CPU: 4 cores
- RAM: 16 GB
- Disk: 100 GB SSD
- OS: Linux (Ubuntu 22.04 LTS recommended)

### Software Prerequisites

- Docker 24.0+
- Docker Compose 2.0+
- Basic command line knowledge
- SSH access (for remote servers)

---

## Docker Installation

### Ubuntu/Debian

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
sudo docker --version
sudo docker compose version
```

### macOS

```bash
# Install using Homebrew
brew install --cask docker

# Or download Docker Desktop from:
# https://www.docker.com/products/docker-desktop

# Start Docker Desktop application
# Verify installation
docker --version
docker compose version
```

### Windows

1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Enable WSL2 backend (recommended)
4. Start Docker Desktop
5. Verify in PowerShell:
```powershell
docker --version
docker compose version
```

### Post-Installation (Linux)

```bash
# Add user to docker group (avoid using sudo)
sudo usermod -aG docker $USER

# Apply group membership (logout/login or run)
newgrp docker

# Verify
docker run hello-world
```

---

## Single-Server Deployment

### Complete PrintShop OS Stack

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL - Primary database
  postgres:
    image: postgres:15-alpine
    container_name: printshop-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-strapi}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-printshop}
      POSTGRES_INITDB_ARGS: "-E UTF8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - printshop_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-strapi}"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Redis - Caching and sessions
  redis:
    image: redis:7-alpine
    container_name: printshop-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - printshop_network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # MongoDB - For Appsmith
  mongo:
    image: mongo:6
    container_name: printshop-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER:-root}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    networks:
      - printshop_network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Strapi - Central API
  strapi:
    image: strapi/strapi:latest
    container_name: printshop-strapi
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: ${POSTGRES_DB:-printshop}
      DATABASE_USERNAME: ${POSTGRES_USER:-strapi}
      DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASE_SSL: false
      JWT_SECRET: ${STRAPI_JWT_SECRET}
      ADMIN_JWT_SECRET: ${STRAPI_ADMIN_JWT_SECRET}
      APP_KEYS: ${STRAPI_APP_KEYS}
      API_TOKEN_SALT: ${STRAPI_API_TOKEN_SALT}
    volumes:
      - strapi_data:/srv/app
      - strapi_uploads:/srv/app/public/uploads
    ports:
      - "1337:1337"
    networks:
      - printshop_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:1337/_health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Appsmith - Production Dashboard
  appsmith:
    image: appsmith/appsmith-ce:latest
    container_name: printshop-appsmith
    restart: unless-stopped
    environment:
      APPSMITH_INSTANCE_NAME: ${APPSMITH_INSTANCE_NAME:-PrintShop Dashboard}
      APPSMITH_ENCRYPTION_PASSWORD: ${APPSMITH_ENCRYPTION_PASSWORD}
      APPSMITH_ENCRYPTION_SALT: ${APPSMITH_ENCRYPTION_SALT}
      APPSMITH_MONGODB_URI: mongodb://${MONGO_ROOT_USER:-root}:${MONGO_ROOT_PASSWORD}@mongo:27017/appsmith?authSource=admin
      APPSMITH_REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    volumes:
      - appsmith_data:/appsmith-stacks
    ports:
      - "8080:80"
      - "8443:443"
    networks:
      - printshop_network
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_healthy
      strapi:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 90s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Botpress - Order Intake Bot
  botpress:
    image: botpress/server:latest
    container_name: printshop-botpress
    restart: unless-stopped
    environment:
      BP_HOST: 0.0.0.0
      BP_PORT: 3000
      DATABASE_URL: postgres://${POSTGRES_USER:-strapi}:${POSTGRES_PASSWORD}@postgres:5432/botpress
      BP_PRODUCTION: true
      EXTERNAL_URL: ${BOTPRESS_EXTERNAL_URL:-http://localhost:3000}
      STRAPI_URL: http://strapi:1337
      STRAPI_API_TOKEN: ${STRAPI_API_TOKEN}
    volumes:
      - botpress_data:/botpress/data
    ports:
      - "3000:3000"
    networks:
      - printshop_network
    depends_on:
      postgres:
        condition: service_healthy
      strapi:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  printshop_network:
    driver: bridge
    name: printshop_network

volumes:
  postgres_data:
    name: printshop_postgres_data
  redis_data:
    name: printshop_redis_data
  mongo_data:
    name: printshop_mongo_data
  strapi_data:
    name: printshop_strapi_data
  strapi_uploads:
    name: printshop_strapi_uploads
  appsmith_data:
    name: printshop_appsmith_data
  botpress_data:
    name: printshop_botpress_data
```

### Deployment Steps

```bash
# 1. Create project directory
mkdir printshop-os-deployment
cd printshop-os-deployment

# 2. Create docker-compose.yml (use content above)

# 3. Create .env file (see environment-variables.md)
cp .env.example .env
nano .env  # Edit with your values

# 4. Pull images
docker compose pull

# 5. Start services
docker compose up -d

# 6. View logs
docker compose logs -f

# 7. Check status
docker compose ps

# Expected output: All services "Up" and "healthy"
```

### Verification

```bash
# Check all services are running
docker compose ps

# Test Strapi
curl http://localhost:1337/_health

# Test Appsmith
curl http://localhost:8080/api/v1/health

# Test Botpress
curl http://localhost:3000/status

# View logs of specific service
docker compose logs strapi
docker compose logs appsmith
docker compose logs botpress
```

---

## Multi-Server Strategy

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Load Balancer                        │
│               (Nginx/HAProxy)                        │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
    ┌──────▼──────┐           ┌───────▼──────┐
    │  Server 1   │           │  Server 2     │
    │  (App)      │           │  (App)        │
    │  - Strapi   │           │  - Strapi     │
    │  - Appsmith │           │  - Appsmith   │
    │  - Botpress │           │  - Botpress   │
    └──────┬──────┘           └───────┬───────┘
           │                          │
           └──────────┬───────────────┘
                      │
              ┌───────▼────────┐
              │   Server 3      │
              │  (Database)     │
              │  - PostgreSQL   │
              │  - Redis        │
              │  - MongoDB      │
              └─────────────────┘
```

### Server 1 & 2 (Application Servers)

docker-compose-app.yml:
```yaml
version: '3.8'

services:
  strapi:
    image: strapi/strapi:latest
    restart: unless-stopped
    environment:
      DATABASE_HOST: db-server-ip
      # ... other config
    networks:
      - external_network

  appsmith:
    image: appsmith/appsmith-ce:latest
    restart: unless-stopped
    environment:
      APPSMITH_MONGODB_URI: mongodb://db-server-ip:27017/appsmith
      # ... other config
    networks:
      - external_network

  botpress:
    image: botpress/server:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://db-server-ip:5432/botpress
      # ... other config
    networks:
      - external_network

networks:
  external_network:
    external: true
```

### Server 3 (Database Server)

docker-compose-db.yml:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - /data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - external_network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --bind 0.0.0.0
    ports:
      - "6379:6379"
    networks:
      - external_network

  mongo:
    image: mongo:6
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    ports:
      - "27017:27017"
    networks:
      - external_network

networks:
  external_network:
    driver: bridge
```

---

## Network Configuration

### Internal Network (Single Server)

```yaml
networks:
  printshop_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### External Network (Multi-Server)

```bash
# Create external network on each server
docker network create --driver overlay --attachable printshop_external
```

### Firewall Rules

```bash
# Allow Docker communication (Ubuntu/Debian)
sudo ufw allow 2377/tcp  # Docker swarm
sudo ufw allow 7946/tcp  # Container network discovery
sudo ufw allow 7946/udp
sudo ufw allow 4789/udp  # Container ingress network

# Allow application ports
sudo ufw allow 1337/tcp  # Strapi
sudo ufw allow 8080/tcp  # Appsmith
sudo ufw allow 3000/tcp  # Botpress

# Allow database ports (only from app servers)
sudo ufw allow from APP_SERVER_IP to any port 5432  # PostgreSQL
sudo ufw allow from APP_SERVER_IP to any port 6379  # Redis
sudo ufw allow from APP_SERVER_IP to any port 27017 # MongoDB
```

---

## Volume Management

### Understanding Docker Volumes

Volumes persist data beyond container lifecycle:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect printshop_postgres_data

# Backup volume
docker run --rm \
  -v printshop_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volume
docker run --rm \
  -v printshop_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /

# Remove unused volumes
docker volume prune
```

### Volume Backup Strategy

```bash
#!/bin/bash
# backup-volumes.sh

BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec printshop-postgres pg_dumpall -U strapi > $BACKUP_DIR/postgres.sql

# Backup Strapi uploads
docker run --rm \
  -v printshop_strapi_uploads:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/strapi-uploads.tar.gz /data

# Backup Appsmith data
docker run --rm \
  -v printshop_appsmith_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/appsmith-data.tar.gz /data

echo "Backup completed: $BACKUP_DIR"
```

---

## Health Checks and Monitoring

### Built-in Health Checks

Already configured in docker-compose.yml:
- Automatic restart on failure
- Health check endpoints
- Dependency ordering

### Manual Health Check

```bash
# Check all services
docker compose ps

# Check specific service health
docker inspect printshop-strapi | grep -A 10 Health

# View health logs
docker compose logs --tail=50 strapi | grep health
```

### Monitoring with Docker Stats

```bash
# Real-time resource usage
docker stats

# Specific services
docker stats printshop-strapi printshop-postgres
```

### Log Aggregation

```bash
# View all logs
docker compose logs -f

# Filter by service
docker compose logs -f strapi

# Filter by time
docker compose logs --since 30m

# Export logs
docker compose logs > logs.txt
```

---

## Scaling and Load Balancing

### Horizontal Scaling

```bash
# Scale Strapi to 3 instances
docker compose up -d --scale strapi=3

# Requires load balancer configuration
```

### Load Balancer (Nginx)

nginx.conf:
```nginx
upstream strapi_backend {
    server localhost:1337;
    server localhost:1338;
    server localhost:1339;
}

server {
    listen 80;
    server_name api.printshop.com;

    location / {
        proxy_pass http://strapi_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs strapi

# Check resource usage
docker stats

# Restart services
docker compose restart

# Full reset
docker compose down
docker compose up -d
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker exec printshop-postgres psql -U strapi -d printshop -c "SELECT 1;"

# Check network
docker network inspect printshop_network

# Verify environment variables
docker compose config
```

### Port Conflicts

```bash
# Find what's using a port
sudo lsof -i :1337
sudo netstat -tulpn | grep 1337

# Change port in docker-compose.yml
ports:
  - "1338:1337"  # Use different external port
```

---

## Next Steps

- Review [Environment Variables](environment-variables.md)
- Setup [Disaster Recovery](disaster-recovery.md)
- Configure monitoring and alerting
- Plan for scaling

---

**Docker Setup Complete! ✅**
