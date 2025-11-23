# 🔗 Spark Frontend → PrintShop OS Integration Plan

**Date:** November 23, 2025  
**Status:** Spark frontend deployed to GitHub (see: printshop-os-fronten--hypnotizedent.github.app)  
**Task:** Map Spark deliverable back to main repository architecture

---

## 🎯 Integration Objective

Bring Spark's frontend application into your `printshop-os` repository in a way that:
1. ✅ Integrates seamlessly with existing backend services
2. ✅ Follows established project structure
3. ✅ Maintains separation of concerns
4. ✅ Enables parallel backend/frontend development
5. ✅ Supports Docker deployment
6. ✅ Does NOT duplicate existing reference documentation

---

## 📁 Target Directory Structure

Your PrintShop OS repo should contain:

```
printshop-os/
├── frontend/                          ← Spark's built application
│   ├── src/
│   │   ├── components/               ← React components (from Spark)
│   │   ├── pages/                    ← Page components (from Spark)
│   │   ├── services/                 ← API client layer (from Spark)
│   │   ├── hooks/                    ← Custom hooks (from Spark)
│   │   ├── context/                  ← State management (from Spark)
│   │   ├── styles/                   ← Tailwind/CSS (from Spark)
│   │   └── App.tsx                   ← Main app (from Spark)
│   │
│   ├── public/                       ← Static assets
│   ├── tests/                        ← Component + integration tests
│   ├── stories/                      ← Storybook stories
│   │
│   ├── package.json                  ← npm config (Spark built)
│   ├── tsconfig.json                 ← TypeScript config (Spark)
│   ├── vite.config.ts                ← Build config (Spark)
│   ├── tailwind.config.js            ← Tailwind config (Spark)
│   ├── .env.example                  ← Environment template
│   ├── Dockerfile                    ← Container config (new)
│   ├── README.md                     ← Frontend setup guide (new)
│   └── .gitignore                    ← Build artifacts (new)
│
├── services/                         ← Backend services (existing)
│   ├── api/
│   ├── job-estimator/
│   ├── supplier-sync/
│   └── ...
│
├── docker-compose.yml                ← UPDATED (add frontend service)
├── docker-compose.local.yml          ← UPDATED (add frontend service)
├── .env.example                      ← UPDATED (frontend env vars)
│
└── docs/
    ├── FRONTEND_INTEGRATION_STRATEGY.md
    ├── SPARK_FRONTEND_TECHNICAL_BRIEF.md
    ├── FRONTEND_DEVELOPMENT_ROADMAP.md
    └── ... (existing docs)
```

---

## 🔄 Integration Steps

### Step 1: Determine Spark's Repository Location

```bash
# If Spark created a separate GitHub repo:
gh repo view hypnotizedent/printshop-os-frontend --json url

# Or check if it's embedded in the GitHub Pages deployment
# The URL "printshop-os-fronten--hypnotizedent.github.app" suggests:
# - Built by Spark
# - Hosted as GitHub Pages or GitHub App
# - Source code location: TBD
```

### Step 2: Extract Frontend Source Files

Once you find Spark's source code, you'll need to:

```bash
# If Spark created a separate repo, clone it:
git clone https://github.com/hypnotizedent/printshop-os-frontend
cd printshop-os-frontend

# Copy files into your main repo:
cp -r src/* /path/to/printshop-os/frontend/src/
cp package.json /path/to/printshop-os/frontend/
cp tsconfig.json /path/to/printshop-os/frontend/
cp vite.config.ts /path/to/printshop-os/frontend/
# ... etc

# Or if embedded in deployment:
# Extract from GitHub Actions workflow or build artifacts
```

### Step 3: Create Frontend Directory Structure

```bash
cd /Users/ronnyworks/Projects/printshop-os

# Create frontend directory
mkdir -p frontend/{src,public,tests,stories}

# Create subdirectories in src/
mkdir -p frontend/src/{components,pages,services,hooks,context,styles}

# Copy Spark's files
# (Step 2 would do this)
```

### Step 4: Create Integration Configuration Files

#### A. Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production=false

# Build application
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
RUN npm install -g serve
COPY --from=0 /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### B. Frontend .env.example

```bash
# frontend/.env.example

# API Endpoints
VITE_API_URL=http://localhost:3002
VITE_STRAPI_URL=http://localhost:1337
VITE_WS_URL=ws://localhost:3004

# JWT Configuration
VITE_JWT_STORAGE_KEY=printshop_auth_token

# Feature Flags
VITE_ENABLE_CUSTOMER_PORTAL=true
VITE_ENABLE_ADVANCED_PRICING=true
VITE_ENABLE_SUPPLIER_SYNC=true
VITE_ENABLE_ANALYTICS=true

# File Upload
VITE_MAX_FILE_SIZE=52428800        # 50MB
VITE_ALLOWED_FILE_TYPES=pdf,jpg,png,ai,eps,cdr

# Build
VITE_BUILD_TARGET=es2020
VITE_SOURCEMAP=false
```

#### C. Frontend .gitignore

```
# frontend/.gitignore

# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build output
dist/
build/
*.tsbuildinfo

# Testing
coverage/
.nyc_output/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Storybook
storybook-static/

# Logs
npm-debug.log*
yarn-debug.log*
```

#### D. Frontend README.md

```markdown
# PrintShop OS Frontend

> React + TypeScript frontend for PrintShop OS management system
> Built with Vite, Tailwind CSS, and modern development patterns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend services running (see main repo README)

### Setup

\`\`\`bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
\`\`\`

### Environment Variables

See `.env.example` for all available options:
- `VITE_API_URL` - Backend API endpoint
- `VITE_STRAPI_URL` - Strapi CMS endpoint
- `VITE_WS_URL` - WebSocket server endpoint
- Feature flags for optional features

## 📊 Project Structure

\`\`\`
src/
├── components/        # Reusable React components
├── pages/             # Page-level components
├── services/          # API client & business logic
├── hooks/             # Custom React hooks
├── context/           # Global state management
├── styles/            # Tailwind & global styles
└── App.tsx            # Main application component
\`\`\`

## 🔨 Development

\`\`\`bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# View Storybook
npm run storybook
\`\`\`

## 🐳 Docker

\`\`\`bash
# Build Docker image
docker build -t printshop-frontend:latest .

# Run container
docker run -p 3000:3000 printshop-frontend:latest
\`\`\`

## 📚 Backend Integration

Frontend connects to these backend services:

- **Strapi API** (port 1337): Central data hub
- **API Service** (port 3002): Business logic endpoints
- **Job Estimator** (port 3001): Pricing calculations
- **Production Dashboard** (port 3004): WebSocket updates

See `/docs/FRONTEND_INTEGRATION_STRATEGY.md` for complete API reference.

## 🧪 Testing

\`\`\`bash
# Unit tests
npm run test

# Coverage report
npm run test:coverage

# E2E tests (requires running backend)
npm run test:e2e
\`\`\`

## 📦 Building & Deployment

\`\`\`bash
# Build optimized bundle
npm run build

# Bundle will be in: dist/

# To deploy:
# 1. Build locally: npm run build
# 2. Push dist/ to hosting (Vercel, Netlify, S3+CloudFront)
# 3. Or use Docker: docker build -t printshop-frontend . && docker push
\`\`\`

## 🔗 API Integration Points

See documentation:
- Architecture: `/docs/FRONTEND_INTEGRATION_STRATEGY.md`
- API Reference: `/docs/SPARK_FRONTEND_TECHNICAL_BRIEF.md`
- Development Plan: `/docs/FRONTEND_DEVELOPMENT_ROADMAP.md`

## 🚀 MVP Milestone

Phase 1 ✅: UI components built with mock data
Phase 2 🔄: Real API integration (after backend schema ready)
Phase 3 📋: Advanced features (WebSocket, analytics)

See `FRONTEND_DEVELOPMENT_ROADMAP.md` for timeline.
```

### Step 5: Update Docker Compose

Update `docker-compose.yml` to include frontend service:

```yaml
# Add to docker-compose.yml

services:
  # ... existing services ...

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: printshop-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://api:3002
      VITE_STRAPI_URL: http://strapi:1337
      VITE_WS_URL: ws://localhost:3004
    networks:
      - printshop_network
    depends_on:
      - strapi
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

networks:
  printshop_network:
    # ... (existing config)
```

### Step 6: Update Environment Variables

Add frontend variables to `.env.example`:

```bash
# frontend/.env.example - ADD THESE:

# Frontend Build
VITE_BUILD_TARGET=es2020
VITE_SOURCEMAP=false

# Frontend Runtime
VITE_API_URL=http://localhost:3002
VITE_STRAPI_URL=http://localhost:1337
VITE_WS_URL=ws://localhost:3004
VITE_JWT_STORAGE_KEY=printshop_auth_token
VITE_ENABLE_CUSTOMER_PORTAL=true
VITE_ENABLE_ADVANCED_PRICING=true
```

---

## 🔗 Folder-by-Folder Connection Mapping

### Components → Backend
```
frontend/src/components/
├── Dashboard/
│   └── Dashboard.tsx → GET /api/orders
├── JobManager/
│   ├── Kanban.tsx → PATCH /api/orders/{id}/status
│   └── JobDetails.tsx → GET /api/orders/{id}
├── FileUpload/
│   └── Uploader.tsx → POST /api/files/upload
├── CustomerPortal/
│   ├── QuoteForm.tsx → POST /api/quotes
│   └── OrderHistory.tsx → GET /api/customer/orders
└── ...
```

### Services → APIs
```
frontend/src/services/
├── api.ts → HTTP client pointing to VITE_API_URL
├── auth.ts → JWT token management (Strapi auth)
├── websocket.ts → WebSocket at VITE_WS_URL
├── quote.ts → POST /api/quotes (Task 2.1)
├── orders.ts → GET /api/orders (Strapi)
└── ...
```

### Hooks → State Management
```
frontend/src/hooks/
├── useAuth.ts → Get/set JWT token
├── useOrders.ts → Fetch & manage orders
├── useQuotes.ts → Quote generation
└── useWebSocket.ts → Real-time updates
```

---

## 🚀 Full Integration Workflow

### Day 1: Spark Builds Frontend ✅
```
- Spark creates React components with mock data
- Builds UI with Tailwind CSS
- Creates Storybook stories
- Outputs: src/ directory, package.json, configs
```

### Day 2-3: Extract & Integrate into PrintShop OS
```
1. Get Spark's source files
2. Create /frontend directory in printshop-os
3. Copy all Spark files into frontend/
4. Create Dockerfile, .env.example, README.md
5. Update docker-compose.yml
6. Commit to main repo

Command sequence:
cd /Users/ronnyworks/Projects/printshop-os
mkdir -p frontend
# Copy Spark files...
git add frontend/
git commit -m "feat: Integrate Spark frontend application"
git push
```

### Day 3+: Backend Agents Continue
```
- Agents build API endpoints (Tasks 1.1, 1.2, 2.1, etc.)
- Frontend waits for Strapi schema (Task 1.2)
- Then frontend connects real APIs
- No idle time: both building in parallel
```

### Week 2: Full Integration
```
- Frontend Phase 1 complete (with mock data)
- Backend services complete
- Frontend Phase 2 (real APIs)
- All connected and tested
```

---

## 📋 Checklist: Frontend Integration

### Extract Frontend
- [ ] Find Spark's source code (GitHub repo or deployment artifacts)
- [ ] Clone/download frontend source files
- [ ] Verify all files present (src/, package.json, configs)

### Create Directory Structure
- [ ] Create `frontend/` directory in printshop-os
- [ ] Create subdirectories (src/, public/, tests/, stories/)
- [ ] Copy Spark files into place

### Create Configuration Files
- [ ] Create `frontend/Dockerfile`
- [ ] Create `frontend/.env.example`
- [ ] Create `frontend/.gitignore`
- [ ] Create `frontend/README.md`

### Update Project Config
- [ ] Update `docker-compose.yml` (add frontend service)
- [ ] Update `.env.example` (frontend variables)
- [ ] Update main `README.md` (mention frontend)

### Verify Integration
- [ ] `npm install` works in frontend/
- [ ] `npm run dev` starts dev server
- [ ] Docker build succeeds: `docker build frontend/`
- [ ] Frontend connects to mock data

### Commit to Repository
- [ ] Add all frontend files: `git add frontend/`
- [ ] Commit: `git commit -m "feat: Integrate Spark frontend"`
- [ ] Push: `git push`
- [ ] Verify in GitHub: printshop-os/frontend/

### Update Documentation
- [ ] Reference frontend location in main README
- [ ] Link to frontend-specific docs (FRONTEND_DEVELOPMENT_ROADMAP.md)
- [ ] Update architecture diagram to show frontend

---

## 🔗 How Frontend Connects Back to Backend

### Architecture Diagram
```
Frontend (localhost:3000)
    ↓
    ├─ API Calls → Strapi (localhost:1337)
    │            └─ PostgreSQL queries
    │
    ├─ API Calls → API Service (localhost:3002)
    │            ├─ Calls Job Estimator
    │            └─ Returns quote/order data
    │
    ├─ WebSocket → Production Dashboard (localhost:3004)
    │            └─ Real-time order updates
    │
    └─ Static Files → Docker Nginx
                      └─ Serves dist/ folder
```

### Data Flow Example: Creating a Quote
```
1. Frontend Form (src/components/QuoteForm)
   User enters: service, quantity, colors

2. API Call (src/services/quote.ts)
   POST /api/quotes
   Body: {service, quantity, colors, ...}

3. API Service (services/api/src/routes/quotes.ts)
   Receives request
   Calls: Job Estimator pricing function

4. Job Estimator (services/job-estimator/lib/pricing-engine.ts)
   Calculates price based on inputs
   Returns: quote breakdown with total

5. Strapi (services/api → stores in Strapi)
   Saves quote to PostgreSQL
   Returns: quote_id

6. Frontend (src/components/QuoteDisplay)
   Shows quote to user
   Displays quote total & breakdown
```

---

## 🎯 Success Criteria: Frontend Integrated

✅ Frontend directory in printshop-os
✅ All Spark files copied and organized
✅ Docker build succeeds
✅ `npm install` + `npm run dev` works
✅ Frontend can be started with `docker-compose up frontend`
✅ API endpoints reachable from frontend
✅ WebSocket can connect to backend
✅ Mock data displays correctly
✅ Documentation updated
✅ Committed to GitHub

---

## 🚀 Next Steps

1. **Locate Spark's Source Code**
   - Check GitHub for printshop-os-frontend repo
   - Or check GitHub Actions artifacts
   - Or contact/check Spark's deployment URL

2. **Execute Integration Steps 1-6 Above**
   - Copy files into frontend/ directory
   - Create configuration files
   - Update Docker Compose

3. **Test Integration**
   - `npm install` in frontend/
   - `npm run dev` (should start on port 3000)
   - `docker-compose up` (should run all services)
   - Frontend accessible at localhost:3000

4. **Commit to Repository**
   - Add all frontend files
   - Push to main repo
   - Update README with frontend reference

5. **Continue Backend Development**
   - Monitor agents (issues #89, #91, #92)
   - When Task 1.2 complete → update frontend API calls
   - Connect real backend data

---

**Status:** Ready for frontend integration  
**Timeline:** 1-2 hours to extract and integrate  
**Next:** Find Spark's source code location
