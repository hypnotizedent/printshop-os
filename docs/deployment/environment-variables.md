# Environment Variables Reference - PrintShop OS

## Overview

This document provides a comprehensive reference for all environment variables used across PrintShop OS components. Proper configuration of these variables is critical for security, functionality, and performance.

---

## Table of Contents

1. [General Configuration](#general-configuration)
2. [Strapi Variables](#strapi-variables)
3. [Appsmith Variables](#appsmith-variables)
4. [Botpress Variables](#botpress-variables)
5. [Database Variables](#database-variables)
6. [Security Best Practices](#security-best-practices)
7. [Secret Management](#secret-management)
8. [Environment-Specific Configs](#environment-specific-configurations)

---

## General Configuration

### NODE_ENV
**Component:** All Node.js services  
**Required:** Yes  
**Default:** development  
**Values:** `development` | `production` | `test`

```env
NODE_ENV=production
```

**Description:** Determines the runtime environment. In production mode:
- Optimized builds
- Error messages less verbose
- Better performance
- Caching enabled

### TZ
**Component:** All services  
**Required:** No  
**Default:** UTC

```env
TZ=America/New_York
```

**Description:** Sets the timezone for all containers. Use IANA timezone format.

### LOG_LEVEL
**Component:** All services  
**Required:** No  
**Default:** info  
**Values:** `error` | `warn` | `info` | `debug` | `trace`

```env
LOG_LEVEL=info
```

**Description:** Controls logging verbosity. Use `debug` or `trace` for troubleshooting.

---

## Strapi Variables

### Core Configuration

#### STRAPI_HOST
**Required:** No  
**Default:** 0.0.0.0

```env
STRAPI_HOST=0.0.0.0
```

**Description:** Host binding. Use 0.0.0.0 for Docker, localhost for local dev.

#### STRAPI_PORT
**Required:** No  
**Default:** 1337

```env
STRAPI_PORT=1337
```

**Description:** Port Strapi listens on.

#### STRAPI_URL
**Required:** Yes (Production)  
**Default:** http://localhost:1337

```env
STRAPI_URL=https://api.printshop.com
```

**Description:** Full public URL of Strapi instance. Used for email links, webhooks.

### Security Secrets

#### JWT_SECRET
**Required:** Yes  
**Default:** None (must be set)

```env
JWT_SECRET=your-very-long-random-jwt-secret-here
```

**Description:** Secret for JWT token generation. **CRITICAL:** Must be random and secure.

**Generate:**
```bash
openssl rand -base64 32
```

#### ADMIN_JWT_SECRET
**Required:** Yes  
**Default:** None (must be set)

```env
ADMIN_JWT_SECRET=your-admin-jwt-secret-different-from-jwt-secret
```

**Description:** Separate secret for admin panel JWTs.

**Generate:**
```bash
openssl rand -base64 32
```

#### APP_KEYS
**Required:** Yes  
**Default:** None (must be set)

```env
APP_KEYS=key1,key2,key3,key4
```

**Description:** Comma-separated list of keys for session cookies.

**Generate:**
```bash
echo "$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
```

#### API_TOKEN_SALT
**Required:** Yes  
**Default:** None (must be set)

```env
API_TOKEN_SALT=your-api-token-salt
```

**Description:** Salt for API token hashing.

**Generate:**
```bash
openssl rand -base64 32
```

### API Integration

#### STRAPI_API_TOKEN
**Required:** Yes (for Appsmith/Botpress)  
**Default:** None

```env
STRAPI_API_TOKEN=your-strapi-api-token-from-admin-panel
```

**Description:** API token generated in Strapi admin for external integrations.

**How to get:**
1. Login to Strapi admin
2. Settings → API Tokens
3. Create new token
4. Copy token value

---

## Appsmith Variables

### Core Configuration

#### APPSMITH_INSTANCE_NAME
**Required:** No  
**Default:** Appsmith

```env
APPSMITH_INSTANCE_NAME=PrintShop Production Dashboard
```

**Description:** Display name for Appsmith instance.

#### APPSMITH_API_URL
**Required:** No  
**Default:** http://localhost:8080

```env
APPSMITH_API_URL=https://dashboard.printshop.com
```

**Description:** Public URL of Appsmith instance.

### Security

#### APPSMITH_ENCRYPTION_PASSWORD
**Required:** Yes  
**Default:** None (must be set)

```env
APPSMITH_ENCRYPTION_PASSWORD=your-encryption-password
```

**Description:** Password for encrypting sensitive data.

**Generate:**
```bash
openssl rand -base64 32
```

#### APPSMITH_ENCRYPTION_SALT
**Required:** Yes  
**Default:** None (must be set)

```env
APPSMITH_ENCRYPTION_SALT=your-encryption-salt
```

**Description:** Salt for encryption.

**Generate:**
```bash
openssl rand -base64 32
```

### Database Connections

#### APPSMITH_MONGODB_URI
**Required:** Yes  
**Default:** None

```env
APPSMITH_MONGODB_URI=mongodb://root:password@mongo:27017/appsmith?authSource=admin
```

**Description:** MongoDB connection string. Format:
```
mongodb://[username:password@]host[:port]/database[?options]
```

#### APPSMITH_REDIS_URL
**Required:** Yes  
**Default:** None

```env
APPSMITH_REDIS_URL=redis://:password@redis:6379
```

**Description:** Redis connection string for sessions/cache.

### Email Configuration (Optional)

#### APPSMITH_MAIL_ENABLED
**Required:** No  
**Default:** false

```env
APPSMITH_MAIL_ENABLED=true
APPSMITH_MAIL_FROM=noreply@printshop.com
APPSMITH_MAIL_HOST=smtp.gmail.com
APPSMITH_MAIL_PORT=587
APPSMITH_MAIL_USERNAME=your-email@gmail.com
APPSMITH_MAIL_PASSWORD=your-app-password
```

**Description:** Email configuration for notifications.

---

## Botpress Variables

### Core Configuration

#### BP_HOST
**Required:** No  
**Default:** 0.0.0.0

```env
BP_HOST=0.0.0.0
```

**Description:** Host binding.

#### BP_PORT
**Required:** No  
**Default:** 3000

```env
BP_PORT=3000
```

**Description:** Port Botpress listens on.

#### BOTPRESS_URL
**Required:** Yes (Production)  
**Default:** http://localhost:3000

```env
BOTPRESS_URL=https://bot.printshop.com
EXTERNAL_URL=https://bot.printshop.com
```

**Description:** Public URL of Botpress instance.

### Database

#### DATABASE_URL
**Required:** Yes  
**Default:** None

```env
DATABASE_URL=postgres://strapi:password@postgres:5432/botpress
```

**Description:** PostgreSQL connection string for Botpress.

Format:
```
postgres://[user[:password]@][host][:port][/database]
```

### Production Mode

#### BP_PRODUCTION
**Required:** No  
**Default:** false

```env
BP_PRODUCTION=true
```

**Description:** Enables production mode (optimizations, less verbose logging).

### Integration

#### STRAPI_URL
**Required:** Yes (for Strapi integration)  
**Default:** None

```env
STRAPI_URL=http://strapi:1337
```

**Description:** Strapi URL for API calls. Use internal Docker network name.

#### STRAPI_API_TOKEN
**Required:** Yes (for Strapi integration)  
**Default:** None

```env
STRAPI_API_TOKEN=your-strapi-api-token
```

**Description:** API token for authenticating with Strapi.

---

## Database Variables

### PostgreSQL

#### POSTGRES_USER
**Required:** Yes  
**Default:** postgres

```env
POSTGRES_USER=strapi
```

**Description:** PostgreSQL superuser username.

#### POSTGRES_PASSWORD
**Required:** Yes  
**Default:** None (must be set)

```env
POSTGRES_PASSWORD=your-strong-postgres-password
```

**Description:** PostgreSQL superuser password.

**Generate:**
```bash
openssl rand -base64 24
```

#### POSTGRES_DB
**Required:** No  
**Default:** postgres

```env
POSTGRES_DB=printshop
```

**Description:** Default database name.

#### DATABASE_CLIENT
**Required:** Yes (Strapi)  
**Default:** sqlite

```env
DATABASE_CLIENT=postgres
```

**Description:** Database type. Use `postgres` for production, `sqlite` for dev.

#### DATABASE_HOST
**Required:** Yes (for postgres)  
**Default:** localhost

```env
DATABASE_HOST=postgres
```

**Description:** Database host. Use service name in Docker Compose.

#### DATABASE_PORT
**Required:** No  
**Default:** 5432

```env
DATABASE_PORT=5432
```

**Description:** PostgreSQL port.

#### DATABASE_NAME
**Required:** Yes (for postgres)  
**Default:** strapi

```env
DATABASE_NAME=printshop
```

**Description:** Database name for Strapi.

#### DATABASE_USERNAME
**Required:** Yes (for postgres)  
**Default:** strapi

```env
DATABASE_USERNAME=strapi
```

**Description:** Database user for Strapi.

#### DATABASE_PASSWORD
**Required:** Yes (for postgres)  
**Default:** None

```env
DATABASE_PASSWORD=your-database-password
```

**Description:** Database password for Strapi.

#### DATABASE_SSL
**Required:** No  
**Default:** false

```env
DATABASE_SSL=false
```

**Description:** Enable SSL for database connections. Set to `true` for cloud databases.

### Redis

#### REDIS_HOST
**Required:** No  
**Default:** localhost

```env
REDIS_HOST=redis
```

**Description:** Redis host.

#### REDIS_PORT
**Required:** No  
**Default:** 6379

```env
REDIS_PORT=6379
```

**Description:** Redis port.

#### REDIS_PASSWORD
**Required:** Yes (Production)  
**Default:** None

```env
REDIS_PASSWORD=your-redis-password
```

**Description:** Redis authentication password.

### MongoDB

#### MONGO_INITDB_ROOT_USERNAME
**Required:** Yes  
**Default:** root

```env
MONGO_INITDB_ROOT_USERNAME=root
```

**Description:** MongoDB root username.

#### MONGO_INITDB_ROOT_PASSWORD
**Required:** Yes  
**Default:** None

```env
MONGO_INITDB_ROOT_PASSWORD=your-mongo-password
```

**Description:** MongoDB root password.

#### MONGO_INITDB_DATABASE
**Required:** No  
**Default:** admin

```env
MONGO_INITDB_DATABASE=appsmith
```

**Description:** Initial database to create.

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Strong, Unique Passwords

**Bad:**
```env
POSTGRES_PASSWORD=password123
JWT_SECRET=secret
```

**Good:**
```env
POSTGRES_PASSWORD=K7mN$9pQ2xR@4vW#8jL!
JWT_SECRET=wX2kL9mN4pQ7rS0tU3vW6yZ8aB1cD4eF5gH8iJ0kL3mN6oP9qR2sT5uV8wX1yZ4aB7c
```

### 3. Rotate Secrets Regularly

**Schedule:**
- API tokens: Every 90 days
- Database passwords: Every 180 days
- JWT secrets: Every year or after security incident

### 4. Different Secrets Per Environment

```env
# Development
JWT_SECRET=dev-secret-not-for-production

# Production
JWT_SECRET=prod-secret-super-secure-random
```

### 5. Minimum Required Permissions

**Database users:**
```sql
-- Create limited user for Strapi
CREATE USER strapi_app WITH PASSWORD 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON DATABASE printshop TO strapi_app;

-- Don't use root/postgres user in production
```

---

## Secret Management

### Option 1: Docker Secrets (Docker Swarm)

```yaml
secrets:
  postgres_password:
    external: true
  jwt_secret:
    external: true

services:
  strapi:
    secrets:
      - postgres_password
      - jwt_secret
    environment:
      DATABASE_PASSWORD: /run/secrets/postgres_password
      JWT_SECRET: /run/secrets/jwt_secret
```

Create secrets:
```bash
echo "my-secure-password" | docker secret create postgres_password -
echo "my-jwt-secret" | docker secret create jwt_secret -
```

### Option 2: External Secret Manager

**AWS Secrets Manager:**
```bash
# Store secret
aws secretsmanager create-secret \
  --name printshop/postgres-password \
  --secret-string "my-password"

# Retrieve in script
export POSTGRES_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id printshop/postgres-password \
  --query SecretString \
  --output text)
```

**HashiCorp Vault:**
```bash
# Store secret
vault kv put secret/printshop postgres_password="my-password"

# Retrieve in script
export POSTGRES_PASSWORD=$(vault kv get -field=postgres_password secret/printshop)
```

### Option 3: Environment-Specific Files

```bash
# Keep separate .env files
.env.development
.env.staging
.env.production

# Load appropriate file
docker-compose --env-file .env.production up -d
```

**Store securely:**
- Encrypted storage
- Access control
- Audit logging
- Version control (encrypted repo like git-crypt)

---

## Environment-Specific Configurations

### Development

```env
# .env.development

NODE_ENV=development
LOG_LEVEL=debug

# Simple passwords OK for dev
POSTGRES_PASSWORD=dev_password
JWT_SECRET=dev-jwt-secret

# SQLite for quick setup
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Local URLs
STRAPI_URL=http://localhost:1337
APPSMITH_API_URL=http://localhost:8080
BOTPRESS_URL=http://localhost:3000
```

### Staging

```env
# .env.staging

NODE_ENV=production
LOG_LEVEL=info

# Secure passwords
POSTGRES_PASSWORD=${SECURE_POSTGRES_PASSWORD}
JWT_SECRET=${SECURE_JWT_SECRET}

# PostgreSQL
DATABASE_CLIENT=postgres
DATABASE_HOST=staging-db.internal
DATABASE_NAME=printshop_staging

# Staging URLs
STRAPI_URL=https://api-staging.printshop.com
APPSMITH_API_URL=https://dashboard-staging.printshop.com
BOTPRESS_URL=https://bot-staging.printshop.com
```

### Production

```env
# .env.production

NODE_ENV=production
LOG_LEVEL=warn

# Very secure passwords (from secret manager)
POSTGRES_PASSWORD=${SECRET_POSTGRES_PASSWORD}
JWT_SECRET=${SECRET_JWT_SECRET}
ADMIN_JWT_SECRET=${SECRET_ADMIN_JWT_SECRET}

# PostgreSQL with connection pooling
DATABASE_CLIENT=postgres
DATABASE_HOST=prod-db-primary.internal
DATABASE_NAME=printshop
DATABASE_SSL=true

# Production URLs (HTTPS)
STRAPI_URL=https://api.printshop.com
APPSMITH_API_URL=https://dashboard.printshop.com
BOTPRESS_URL=https://bot.printshop.com

# Production optimizations
APPSMITH_REDIS_URL=redis://redis-cluster:6379
```

---

## Variable Generation Script

Create `generate-secrets.sh`:

```bash
#!/bin/bash
# generate-secrets.sh - Generate secure random secrets

echo "Generating secure secrets for PrintShop OS..."
echo ""

echo "# Generated secrets - $(date)" > .env.secrets
echo "" >> .env.secrets

echo "JWT_SECRET=$(openssl rand -base64 48)" >> .env.secrets
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 48)" >> .env.secrets
echo "API_TOKEN_SALT=$(openssl rand -base64 32)" >> .env.secrets

APP_KEYS=""
for i in {1..4}; do
  KEY=$(openssl rand -base64 32)
  if [ $i -eq 1 ]; then
    APP_KEYS="$KEY"
  else
    APP_KEYS="$APP_KEYS,$KEY"
  fi
done
echo "APP_KEYS=$APP_KEYS" >> .env.secrets

echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)" >> .env.secrets
echo "REDIS_PASSWORD=$(openssl rand -base64 24)" >> .env.secrets
echo "MONGO_ROOT_PASSWORD=$(openssl rand -base64 24)" >> .env.secrets

echo "APPSMITH_ENCRYPTION_PASSWORD=$(openssl rand -base64 32)" >> .env.secrets
echo "APPSMITH_ENCRYPTION_SALT=$(openssl rand -base64 32)" >> .env.secrets

echo ""
echo "✅ Secrets generated in .env.secrets"
echo "⚠️  IMPORTANT: Review and merge into your .env file"
echo "⚠️  NEVER commit .env.secrets to version control!"
echo "⚠️  Store securely and delete after use"
```

Usage:
```bash
chmod +x generate-secrets.sh
./generate-secrets.sh
cat .env.secrets >> .env
rm .env.secrets  # After confirming values copied
```

---

## Validation Checklist

Before deploying, verify:

- [ ] All required variables are set
- [ ] No default/example values in production
- [ ] Secrets are strong and unique
- [ ] Database passwords are different from default
- [ ] JWT secrets are long random strings
- [ ] URLs match actual deployment
- [ ] SSL enabled for production databases
- [ ] .env file not committed to git
- [ ] Backup of environment variables stored securely

---

## Next Steps

- Review [Docker Setup](docker-setup.md)
- Setup [Disaster Recovery](disaster-recovery.md)
- Configure monitoring and alerting

---

**Environment Configuration Complete! ✅**
