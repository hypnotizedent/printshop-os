# Phase 1: Strapi Setup - Central API & Database

## Overview

This guide provides detailed, step-by-step instructions for setting up Strapi as the central data repository and API for PrintShop OS. This is the foundational phase that must be completed before implementing Appsmith and Botpress.

**Estimated Time:** 4-6 hours for complete setup  
**Skill Level:** Intermediate (Node.js and database knowledge helpful)  
**Prerequisites:** Docker or Node.js 18+ installed

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Options](#installation-options)
3. [Option A: Docker Installation](#option-a-docker-installation-recommended)
4. [Option B: Local Installation](#option-b-local-installation)
5. [Initial Configuration](#initial-configuration)
6. [Creating Collection Types](#creating-collection-types)
7. [API Permissions Configuration](#api-permissions-configuration)
8. [Testing the API](#testing-the-api)
9. [Docker Deployment](#docker-deployment-production)
10. [Common Troubleshooting](#common-troubleshooting)

---

## Prerequisites

### Required Software

**Option A (Docker - Recommended):**
- Docker 24+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.x ([Install Compose](https://docs.docker.com/compose/install/))
- 4GB RAM minimum, 8GB recommended
- 10GB disk space

**Option B (Local Development):**
- Node.js 18.x or 20.x ([Download Node.js](https://nodejs.org/))
- npm 9.x or yarn 1.22.x
- PostgreSQL 15+ (or SQLite for quick testing)
- 4GB RAM minimum
- 5GB disk space

### Knowledge Requirements

- Basic command line usage
- Understanding of REST APIs
- Basic database concepts
- JSON syntax knowledge

---

## Installation Options

### Option A: Docker (Production-Ready)

**Advantages:**
- Consistent environment
- Easy multi-service setup
- Production-ready
- Includes PostgreSQL

**Best for:** Production deployment, team collaboration

### Option B: Local Installation (Development)

**Advantages:**
- Faster iteration
- Direct file access
- Easier debugging
- Can use SQLite

**Best for:** Initial development, learning

---

## Option A: Docker Installation (Recommended)

### Step 1: Create Project Directory

```bash
# Create project directory
mkdir printshop-strapi
cd printshop-strapi

# Create necessary directories
mkdir -p config database
```

### Step 2: Create docker-compose.yml

Create a file named `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: strapi-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: strapi
      POSTGRES_PASSWORD: strapi_password
      POSTGRES_DB: printshop
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U strapi"]
      interval: 10s
      timeout: 5s
      retries: 5

  strapi:
    image: strapi/strapi:latest
    container_name: printshop-strapi
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: printshop
      DATABASE_USERNAME: strapi
      DATABASE_PASSWORD: strapi_password
      DATABASE_SSL: false
      JWT_SECRET: your-jwt-secret-change-this-in-production
      ADMIN_JWT_SECRET: your-admin-jwt-secret-change-this
      APP_KEYS: app-key-1,app-key-2,app-key-3,app-key-4
      API_TOKEN_SALT: your-api-token-salt-change-this
    volumes:
      - ./config:/opt/app/config
      - ./src:/opt/app/src
      - ./public:/opt/app/public
      - strapi_data:/opt/app/.tmp
    ports:
      - "1337:1337"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  strapi_data:
```

### Step 3: Start Strapi

```bash
# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f strapi

# Expected output:
# [2025-01-20 10:00:00.000] info: Strapi is running on http://localhost:1337
```

**First startup takes 2-3 minutes** while Strapi initializes the database.

### Step 4: Access Admin Panel

1. Open browser: `http://localhost:1337/admin`
2. You'll see the admin registration page
3. Create your admin account:
   - **First name:** Your first name
   - **Last name:** Your last name  
   - **Email:** admin@printshop.local (use a real email for production)
   - **Password:** Strong password (min 8 characters)
   - **Confirm password:** Same password

4. Click "Let's start"

**Expected Result:** You're now in the Strapi admin dashboard.

---

## Option B: Local Installation

### Step 1: Create Strapi Project

```bash
# Install Strapi globally (optional)
npm install -g create-strapi-app

# Create new Strapi project
npx create-strapi-app@latest printshop-strapi

# You'll be prompted:
# ? Choose your installation type: Custom
# ? Choose your preferred language: JavaScript
# ? Choose your default database client: postgres
# ? Database name: printshop
# ? Host: localhost
# ? Port: 5432
# ? Username: strapi
# ? Password: strapi_password
# ? Enable SSL connection: No
```

**Alternative (SQLite for quick testing):**
```bash
npx create-strapi-app@latest printshop-strapi --quickstart
```

### Step 2: Start Strapi

```bash
cd printshop-strapi
npm run develop

# Expected output:
# [2025-01-20 10:00:00.000] info: Strapi is running on http://localhost:1337
```

### Step 3: Create Admin Account

Follow Step 4 from Option A above.

---

## Initial Configuration

### Verify Installation

1. **Check Strapi version:**
   ```bash
   # For Docker
   docker exec printshop-strapi npm list strapi
   
   # For local
   npm list strapi
   ```
   
   Expected: `strapi@4.x.x`

2. **Test database connection:**
   - Admin panel loads without errors
   - No database connection errors in logs

### Generate API Token

You'll need an API token for Appsmith and Botpress integration.

1. In admin panel, go to **Settings** (gear icon in sidebar)
2. Click **API Tokens** under "GLOBAL SETTINGS"
3. Click **+ Create new API Token**
4. Fill in:
   - **Name:** Production API
   - **Description:** API token for Appsmith and Botpress
   - **Token duration:** Unlimited (for production) or 30 days (for testing)
   - **Token type:** Full access
5. Click **Save**
6. **IMPORTANT:** Copy the token immediately (it won't be shown again!)
7. Save token to `.env` file:
   ```bash
   STRAPI_API_TOKEN=your-actual-token-here
   ```

---

## Creating Collection Types

### Overview

We'll create four collection types:
1. **Customer** - Customer information
2. **Job** - Print jobs and orders
3. **Employee** - Employee records
4. **TimeClockEntry** - Time tracking

### Step 1: Create Customer Collection Type

1. In admin panel, click **Content-Type Builder** (puzzle piece icon)
2. Click **+ Create new collection type** under "COLLECTION TYPES"
3. Enter **Display name:** `Customer`
4. Click **Continue**

#### Add Customer Fields

**Field 1: Name**
1. Click **+ Add another field**
2. Select **Text**
3. Name: `Name`
4. Click **+ Add another field** (we'll configure after adding all fields)

**Field 2: Email**
1. Click **+ Add another field**
2. Select **Email**
3. Name: `Email`

**Now configure all fields:**

**Configure Name Field:**
1. Click on **Name** field
2. In **Advanced Settings** tab:
   - Check **Required field**
3. Click **Finish**

**Configure Email Field:**
1. Click on **Email** field
2. In **Advanced Settings** tab:
   - Check **Required field**
   - Check **Unique field**
3. Click **Finish**

**Save:**
1. Click **Save** button (top right)
2. Wait for server restart (automatic)

**Expected Result:** "Customer" appears in Content-Type Builder list.

### Step 2: Create Job Collection Type

1. Click **+ Create new collection type**
2. Display name: `Job`
3. Click **Continue**

#### Add Job Fields

Add these fields (click **+ Add another field** for each):

**Field 1: JobID**
- Type: **Text**
- Name: `JobID`

**Field 2: Status**
- Type: **Enumeration**
- Name: `Status`
- Values (add each with **+ Add new value**):
  - `Pending Artwork`
  - `In Production`
  - `Complete`
  - `Archived`

**Field 3: MockupImageURL**
- Type: **Text**
- Name: `MockupImageURL`

**Field 4: ArtFileURL**
- Type: **Text**
- Name: `ArtFileURL`

**Field 5: InkColors**
- Type: **JSON**
- Name: `InkColors`

**Field 6: ImprintLocations**
- Type: **JSON**
- Name: `ImprintLocations`

**Field 7: Quantity**
- Type: **Number**
- Number format: **integer**
- Name: `Quantity`

**Field 8: customer (Relation)**
- Type: **Relation**
- Relation configuration:
  - Left side: Job (current)
  - Relation: **Many to One**
  - Right side: Customer
- Name: `customer`

**Configure Fields:**

**JobID:**
- Advanced Settings:
  - Check **Required field**
  - Check **Unique field**

**Status:**
- Advanced Settings:
  - Check **Required field**
  - Default value: `Pending Artwork`

**Quantity:**
- Advanced Settings:
  - Minimum value: `1`

**Save:**
- Click **Save**
- Wait for restart

### Step 3: Create Employee Collection Type

1. Click **+ Create new collection type**
2. Display name: `Employee`
3. Click **Continue**

#### Add Employee Fields

**Field 1: EmployeeID**
- Type: **Text**
- Name: `EmployeeID`
- Advanced Settings:
  - Required field: ✓
  - Unique field: ✓

**Field 2: Name**
- Type: **Text**
- Name: `Name`
- Advanced Settings:
  - Required field: ✓

**Save:**
- Click **Save**
- Wait for restart

### Step 4: Create TimeClockEntry Collection Type

1. Click **+ Create new collection type**
2. Display name: `TimeClockEntry`
3. Click **Continue**

#### Add TimeClockEntry Fields

**Field 1: Timestamp**
- Type: **DateTime**
- Name: `Timestamp`
- Advanced Settings:
  - Required field: ✓

**Field 2: EntryType**
- Type: **Enumeration**
- Name: `EntryType`
- Values:
  - `Clock In`
  - `Clock Out`
- Advanced Settings:
  - Required field: ✓

**Field 3: employee (Relation)**
- Type: **Relation**
- Relation: **Many to One**
- Right side: Employee
- Name: `employee`

**Save:**
- Click **Save**
- Wait for restart

---

## API Permissions Configuration

### Overview

Configure public and authenticated access to APIs.

### Step 1: Configure Public Access

For testing and Botpress integration, we'll enable some public endpoints.

1. Go to **Settings** → **Roles** (under USERS & PERMISSIONS PLUGIN)
2. Click **Public**
3. Expand **Customer** permissions:
   - Check **find** (allows listing customers)
   - Check **findOne** (allows getting single customer)
   - Check **create** (allows creating customers)
4. Expand **Job** permissions:
   - Check **find**
   - Check **findOne**
5. Click **Save**

**Security Note:** In production, remove public access and use API tokens.

### Step 2: Configure Authenticated Access

1. Go to **Settings** → **API Tokens**
2. Click on your created token
3. Verify **Token type** is "Full access"

**Or configure granular permissions:**
1. **Settings** → **Roles** → **Authenticated**
2. Check all boxes for all collection types (for MVP)
3. Click **Save**

---

## Testing the API

### Test 1: Create a Customer

**Using cURL:**
```bash
curl -X POST http://localhost:1337/api/customers \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "Name": "John Doe",
      "Email": "john@example.com"
    }
  }'
```

**Expected Response:**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "Name": "John Doe",
      "Email": "john@example.com",
      "createdAt": "2025-01-20T10:00:00.000Z",
      "updatedAt": "2025-01-20T10:00:00.000Z"
    }
  },
  "meta": {}
}
```

### Test 2: Get All Customers

```bash
curl http://localhost:1337/api/customers
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "Name": "John Doe",
        "Email": "john@example.com",
        "createdAt": "2025-01-20T10:00:00.000Z",
        "updatedAt": "2025-01-20T10:00:00.000Z"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

### Test 3: Create a Job

```bash
curl -X POST http://localhost:1337/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "Status": "Pending Artwork",
      "Quantity": 100,
      "customer": 1
    }
  }'
```

### Test 4: Get Jobs with Customer Info

```bash
curl 'http://localhost:1337/api/jobs?populate=customer'
```

**Expected:** Jobs list with customer data populated.

---

## Docker Deployment (Production)

### Production Environment Variables

Create `.env.production`:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337

# Strong secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-production-jwt-secret
ADMIN_JWT_SECRET=your-production-admin-jwt-secret
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-production-api-token-salt

# PostgreSQL (production)
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=printshop_prod
DATABASE_USERNAME=strapi_prod
DATABASE_PASSWORD=strong-production-password
DATABASE_SSL=false

# URLs
URL=https://api.yourdomain.com
```

### Production docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: strapi-postgres-prod
    restart: always
    environment:
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - strapi-network

  strapi:
    image: strapi/strapi:latest
    container_name: printshop-strapi-prod
    restart: always
    env_file:
      - .env.production
    volumes:
      - ./config:/opt/app/config
      - ./src:/opt/app/src
      - ./public:/opt/app/public
      - strapi_uploads:/opt/app/public/uploads
    ports:
      - "1337:1337"
    networks:
      - strapi-network
    depends_on:
      - postgres

volumes:
  postgres_data:
  strapi_uploads:

networks:
  strapi-network:
    driver: bridge
```

### Deploy to Production

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Common Troubleshooting

### Issue: "Cannot connect to database"

**Symptoms:** Strapi won't start, database connection errors in logs

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```
2. Check database credentials in environment variables
3. Ensure PostgreSQL container is healthy:
   ```bash
   docker-compose ps
   ```
4. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```

### Issue: "Port 1337 already in use"

**Symptoms:** Error starting Strapi

**Solutions:**
1. Find process using port:
   ```bash
   lsof -i :1337  # Mac/Linux
   netstat -ano | findstr :1337  # Windows
   ```
2. Kill the process or change Strapi port in docker-compose.yml

### Issue: "Admin panel is blank/white screen"

**Symptoms:** Admin panel doesn't load

**Solutions:**
1. Clear browser cache and cookies
2. Try incognito/private window
3. Check browser console for errors
4. Rebuild Strapi admin:
   ```bash
   docker-compose exec strapi npm run build
   docker-compose restart strapi
   ```

### Issue: "API returns 403 Forbidden"

**Symptoms:** API calls fail with 403 error

**Solutions:**
1. Check API permissions in Settings → Roles
2. Verify API token is valid
3. Include Authorization header:
   ```bash
   curl -H 'Authorization: Bearer YOUR_TOKEN' ...
   ```

### Issue: "Strapi container keeps restarting"

**Symptoms:** Container restarts repeatedly

**Solutions:**
1. Check logs:
   ```bash
   docker-compose logs strapi
   ```
2. Common causes:
   - Missing environment variables
   - Database connection failures
   - Invalid configuration
3. Start in foreground to see errors:
   ```bash
   docker-compose up strapi
   ```

---

## Next Steps

After completing Phase 1:

1. **Verify all collection types** are created correctly
2. **Test API endpoints** with sample data
3. **Save API token** securely
4. **Document your API URL** for Phase 2
5. **Proceed to Phase 2**: [Appsmith Dashboard](phase-2-appsmith.md)

---

## Additional Resources

- [Official Strapi Documentation](https://docs.strapi.io/)
- [Strapi REST API Reference](https://docs.strapi.io/dev-docs/api/rest)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Phase 1 Complete! ✅**

You now have a fully functional Strapi instance serving as your central API and database for PrintShop OS.
