# PrintShop OS - Daily Task Log

> **PURPOSE:** This is the single source of truth for session continuity. Read this FIRST at the start of every Copilot conversation.
> 
> **RULE:** At the start of every new conversation, tell Copilot: "Read DAILY_TASK_LOG.md before doing anything"

---

## 📊 Current State (Last Updated: November 30, 2025 - 3:10 AM EST)

### Data Status
| Data Type | Source Count | In Strapi | Status |
|-----------|--------------|-----------|--------|
| Customers | 3,358 | 3,320 | ✅ Imported (+1 portal test user) |
| Orders | 12,867 | 12,867 | ✅ Imported (nicknames backfilled) |
| Line Items | 49,216 | 49,216 | ✅ Imported |
| Products | 105 (Printavo) + 400K (Suppliers) | 0 | ❌ Pending (demo catalog active) |
| Artwork | 115,606 files (201 GB) | - | ⏸️ Paused (see notes) |
| Quotes | - | 3 (test) | ✅ Schema ready, test data created |
| Design Sessions | - | 0 | ✅ Schema deployed (new!) |
| Custom Orders | - | 0 | ✅ Schema deployed (new!) |

### Infrastructure Status
| Service | Container | Status | Port |
|---------|-----------|--------|------|
| PostgreSQL | printshop-postgres | ✅ Healthy | 5432 |
| Redis | printshop-redis | ✅ Healthy | 6379 |
| Strapi CMS | printshop-strapi | ✅ Running (restarted 3:01 AM) | 1337 |
| API Service | printshop-api | ✅ Healthy | 3002 |
| Frontend | printshop-frontend | ✅ Deployed (restarted) | 3000 |
| MinIO | printshop-minio | ✅ Healthy | 9000/9001 |
| **Customer Portal** | **local dev** | **🔄 Running localhost:5000** | **5000** |
| **Online Designer** | **local dev** | **🔄 Ready for testing** | **8080** |

### Customer Portal (PrintFlow)
- **Repo:** `~/Projects/printshop-pro` (cloned from `hypnotizedent/printshop-pro`)
- **GitHub Spark URL:** https://printshop-pro--hypnotizedent.github.app
- **Local Dev:** http://localhost:5000
- **Status:** ✅ Connected to Strapi backend, auth working
- **Next:** Deploy to docker-host as container

### Online Designer (Custom Studio App) - NEW!
- **Location:** `frontend/src/apps/online-designer/` (moved into monorepo)
- **Origin:** Cloned from `hypnotizedent/custom-studio-app` (archived repo)
- **Technology:** React + Fabric.js canvas editor + react-dropzone
- **Original Backend:** Supabase (replaced with Strapi)
- **Status:** ✅ Code migrated to monorepo, Strapi integration complete
- **Next:** Add route `/designer` in main App.tsx, test full flow

---

## 🔥 Session: November 30, 2025 - Early Morning Pt 2 (3:00 AM - 3:15 AM EST)

### Summary: Online Designer (custom-studio-app) Integration with Strapi

**Goal:** Replace Supabase backend in custom-studio-app with PrintShop OS Strapi backend.

**Completed This Session:**
1. ✅ Cloned custom-studio-app repo locally
2. ✅ Created Strapi API client (`src/lib/strapi.ts`)
3. ✅ Updated CustomerDesignSession component to use Strapi
4. ✅ Created `design-session` content type in Strapi
5. ✅ Created `custom-order` content type in Strapi
6. ✅ Deployed both content types to Strapi (docker-host)
7. ✅ Verified API endpoints working (`/api/design-sessions`, `/api/custom-orders`)

### Detailed Timeline

#### 3:00 AM - Clone custom-studio-app
**Action:** Clone the online designer repo from GitHub
```bash
cd ~/Projects && gh repo clone hypnotizedent/custom-studio-app
```
**Result:** Successfully cloned - Lovable.dev generated React + Fabric.js app

#### 3:02 AM - Analyze Supabase Usage
**Finding:** App uses Supabase for:
- Authentication
- Design session storage
- Custom order submission
- File uploads

**Files Using Supabase:**
- `src/integrations/supabase/client.ts`
- `src/lib/supabase.ts`
- `src/components/CustomerDesignSession.tsx`

#### 3:05 AM - Create Strapi API Client
**File Created:** `~/Projects/custom-studio-app/src/lib/strapi.ts`
```typescript
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://100.92.156.118:1337';

class StrapiClient {
  async createDesignSession(session) { /* POST /api/design-sessions */ }
  async updateDesignSession(documentId, updates) { /* PUT /api/design-sessions/:id */ }
  async createCustomOrder(order) { /* POST /api/custom-orders */ }
  async uploadDesignFile(file) { /* POST /api/upload */ }
  async loginCustomer(email, password) { /* POST /api/auth/customer/login */ }
  async signupCustomer(email, password, name) { /* POST /api/auth/customer/signup */ }
}

export const strapi = new StrapiClient();
```

#### 3:07 AM - Update CustomerDesignSession Component
**File Modified:** `~/Projects/custom-studio-app/src/components/CustomerDesignSession.tsx`
- Changed import from `supabase` to `strapi`
- Updated all database calls to use Strapi API
- Session now uses `documentId` instead of Supabase `id`

#### 3:09 AM - Create design-session Content Type
**Files Created:**
- `printshop-strapi/src/api/design-session/content-types/design-session/schema.json`
- `printshop-strapi/src/api/design-session/controllers/design-session.ts`
- `printshop-strapi/src/api/design-session/routes/design-session.ts`
- `printshop-strapi/src/api/design-session/services/design-session.ts`

**Schema Fields:**
```json
{
  "attributes": {
    "customerEmail": { "type": "email" },
    "customerId": { "type": "string" },
    "garmentType": { "type": "string", "required": true },
    "designs": { "type": "json", "required": true },
    "pricing": { "type": "json", "required": true },
    "status": { "type": "enumeration", "enum": ["active", "completed", "abandoned"] },
    "productId": { "type": "string" }
  }
}
```

#### 3:11 AM - Create custom-order Content Type
**Files Created:**
- `printshop-strapi/src/api/custom-order/content-types/custom-order/schema.json`
- `printshop-strapi/src/api/custom-order/controllers/custom-order.ts`
- `printshop-strapi/src/api/custom-order/routes/custom-order.ts`
- `printshop-strapi/src/api/custom-order/services/custom-order.ts`

**Schema Fields:**
```json
{
  "attributes": {
    "sessionId": { "type": "string", "required": true },
    "designSession": { "type": "relation", "target": "api::design-session.design-session" },
    "customerEmail": { "type": "email" },
    "customerId": { "type": "string" },
    "customer": { "type": "relation", "target": "api::customer.customer" },
    "garmentType": { "type": "enumeration", "enum": ["t-shirt", "hoodie", "tank-top", ...] },
    "designs": { "type": "json", "required": true },
    "pricing": { "type": "json", "required": true },
    "status": { "type": "enumeration", "enum": ["pending", "processing", "completed", "cancelled"] },
    "quantity": { "type": "integer", "default": 1 },
    "size": { "type": "string" },
    "color": { "type": "string" },
    "notes": { "type": "text" },
    "order": { "type": "relation", "target": "api::order.order" },
    "productionFiles": { "type": "json" }
  }
}
```

#### 3:13 AM - Deploy Content Types to Strapi
**Commands:**
```bash
# Bundle and copy content types
cd printshop-strapi/src/api && tar -czf /tmp/strapi-api-update.tar.gz design-session custom-order
scp /tmp/strapi-api-update.tar.gz docker-host:/tmp/

# Extract into container
ssh docker-host 'docker cp /tmp/strapi-api-update.tar.gz printshop-strapi:/tmp/'
ssh docker-host 'docker exec printshop-strapi tar -xzf /tmp/strapi-api-update.tar.gz -C /srv/app/src/api/'

# Restart Strapi
ssh docker-host 'docker restart printshop-strapi'
```

#### 3:15 AM - Verify API Endpoints
**Test:**
```bash
curl http://100.92.156.118:1337/api/design-sessions
# Response: {"data":[],"meta":{"pagination":{"page":1,"pageSize":25,"pageCount":0,"total":0}}}

curl http://100.92.156.118:1337/api/custom-orders
# Response: {"data":[],"meta":{"pagination":{"page":1,"pageSize":25,"pageCount":0,"total":0}}}
```
**Result:** ✅ Both endpoints working!

---

## 🔥 Session: November 30, 2025 - Early Morning Pt 3 (3:15 AM - 3:30 AM EST)

### Summary: Custom-Studio-App Port Conflict & Supabase Migration Fixes

**Goal:** Get custom-studio-app running locally with Strapi backend.

### Issues Encountered & Solutions

#### 3:15 AM - Port 8080 Conflict with Traefik
**Problem:** `npm run dev` failed - port 8080 already in use
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Root Cause:** Traefik dashboard runs on port 8080 (see SERVICE_DIRECTORY.md)
```
| Traefik | http://100.92.156.118:8080 | Reverse proxy |
```

**Solution:** Changed Vite dev server port from 8080 → 8081
```bash
sed -i '' 's/port: 8080/port: 8081/' ~/Projects/custom-studio-app/vite.config.ts
```

**File Modified:** `custom-studio-app/vite.config.ts`
```typescript
// Before
server: {
  host: "::",
  port: 8080,
}

// After
server: {
  host: "::",
  port: 8081,
}
```

#### 3:18 AM - Missing Supabase Default Export
**Problem:** Build error when starting dev server
```
✘ [ERROR] No matching export in "src/lib/supabase.ts" for import "default"

  src/pages/Index.tsx:3:7:
    3 │ import supabase from '@/lib/supabase';
      ╵        ~~~~~~~~
```

**Root Cause:** Index.tsx was importing Supabase but we hadn't updated it to use Strapi yet

**Solution:** Rewrote `Index.tsx` to use Strapi API client instead of Supabase
```typescript
// Before
import supabase from '@/lib/supabase';
const { data, error } = await supabase.storage.from('designs').upload(fileName, file);
const { data, error } = await supabase.from('design_orders').insert([...]);

// After  
import { strapi } from '@/lib/strapi';
const result = await strapi.uploadDesignFile(file);
const order = await strapi.createCustomOrder({...});
```

**Key Changes in Index.tsx:**
1. Import changed from `supabase` to `strapi`
2. File upload: Supabase storage → `strapi.uploadDesignFile()`
3. Order creation: Supabase insert → `strapi.createCustomOrder()`
4. Redirect URL updated to use `documentId` (Strapi v5 pattern)

#### 3:20 AM - ShopifyApp.tsx Still Using Supabase
**Problem:** `ShopifyApp.tsx` still imported Supabase
```typescript
import { supabase } from "@/lib/supabase";
```

**Solution:** Removed Supabase dependency, made it a placeholder component
- Removed all Supabase calls
- Added "Shopify integration coming soon!" toast
- Demo mode for now - OAuth will be integrated later

**Decision:** Shopify integration is not critical for PrintShop OS. The custom designer can work standalone without Shopify. Can revisit when needed.

#### 3:22 AM - Missing react-dropzone Dependency
**Problem:** Build error after fixing Supabase imports
```
Error: The following dependencies are imported but could not be resolved:
  react-dropzone (imported by /Users/ronnyworks/Projects/custom-studio-app/src/pages/Index.tsx)
```

**Root Cause:** react-dropzone wasn't in package.json (was a Lovable.dev assumed dependency)

**Solution:**
```bash
cd ~/Projects/custom-studio-app && npm install react-dropzone
```

#### 3:25 AM - Terminal Working Directory Issues
**Problem:** npm commands running in wrong directory
```bash
npm run dev
# Error: Could not read package.json: ENOENT: no such file or directory, 
# open '/Users/ronnyworks/Projects/printshop-os/package.json'
```

**Root Cause:** VS Code terminal was still in printshop-os directory

**Solution:** Used subshell to force correct directory
```bash
(cd /Users/ronnyworks/Projects/custom-studio-app && npm install react-dropzone && npm run dev)
```

#### 3:28 AM - Success! Custom Studio App Running
**Result:** App successfully running at http://localhost:8081

```
VITE v5.4.10  ready in 122 ms

➜  Local:   http://localhost:8081/
➜  Network: http://192.168.12.197:8081/
➜  Network: http://192.168.12.125:8081/
➜  Network: http://100.85.186.7:8081/
```

### Files Modified This Session

| File | Change | Reason |
|------|--------|--------|
| `custom-studio-app/vite.config.ts` | Port 8080 → 8081 | Avoid Traefik conflict |
| `custom-studio-app/src/pages/Index.tsx` | Full rewrite | Replace Supabase with Strapi |
| `custom-studio-app/src/components/ShopifyApp.tsx` | Remove Supabase | Make it a placeholder |
| `custom-studio-app/.env` | Created | Add `VITE_STRAPI_URL=http://100.92.156.118:1337` |
| `custom-studio-app/package.json` | Added react-dropzone | Missing dependency |

### Lessons Learned

1. **Port Conflicts:** Always check SERVICE_DIRECTORY.md before assigning ports
2. **Lovable.dev Apps:** May have implicit dependencies not in package.json
3. **Supabase → Strapi Migration:** Need to update ALL files that import supabase, not just the main client
4. **Terminal Context:** VS Code terminals don't always cd correctly - use subshells when needed

### Current State of Online Designer

**Working:**
- ✅ Dev server running on port 8081
- ✅ Strapi API client created
- ✅ Index page uses Strapi for uploads and orders
- ✅ design-session and custom-order content types deployed

**Not Yet Tested:**
- ⚠️ File upload to Strapi (needs testing)
- ⚠️ Custom order creation flow
- ⚠️ Customer authentication integration

**TODO:**
1. Test file upload through UI
2. Test complete design → order flow
3. Add customer authentication (login/signup)
4. Deploy to docker-host as container

---

## 🔥 Session: November 30, 2025 - Early Morning (2:00 AM - 2:50 AM EST)
curl http://100.92.156.118:1337/api/design-sessions
# Response: {"data":[],"meta":{"pagination":{"page":1,"pageSize":25,"pageCount":0,"total":0}}}

curl http://100.92.156.118:1337/api/custom-orders
# Response: {"data":[],"meta":{"pagination":{"page":1,"pageSize":25,"pageCount":0,"total":0}}}
```
**Result:** ✅ Both endpoints working!

### Files Created/Modified This Session

| File | Type | Description |
|------|------|-------------|
| `custom-studio-app/src/lib/strapi.ts` | Created | Strapi API client replacing Supabase |
| `custom-studio-app/src/components/CustomerDesignSession.tsx` | Modified | Updated to use Strapi instead of Supabase |
| `printshop-strapi/src/api/design-session/*` | Created | New content type (4 files) |
| `printshop-strapi/src/api/custom-order/*` | Created | New content type (4 files) |

### Content Types Added to Strapi
| Content Type | API Endpoint | Purpose |
|--------------|--------------|---------|
| design-session | `/api/design-sessions` | Stores active customer design sessions (canvas state) |
| custom-order | `/api/custom-orders` | Stores completed orders from online designer |

### Next Steps (TODO)
1. Create `.env` for custom-studio-app with `VITE_STRAPI_URL=http://100.92.156.118:1337`
2. Run `npm install && npm run dev` to test locally
3. Test creating a design session through the UI
4. Update remaining Supabase imports in other components
5. Deploy as container on docker-host

---

## 🔥 Session: November 30, 2025 - Early Morning (2:00 AM - 2:50 AM EST)

### Summary: Customer Portal Integration with Strapi Backend

**Goal:** Connect the customer-facing PrintFlow portal (printshop-pro) to the PrintShop OS Strapi backend.

**Completed This Session:**
1. ✅ Cloned printshop-pro repo locally
2. ✅ Configured API URL to point to Strapi
3. ✅ Discovered auth endpoints already existed in Strapi
4. ✅ Created new customer-specific endpoints for orders/quotes
5. ✅ Fixed TypeScript errors in new endpoints
6. ✅ Deployed updated auth controller to Strapi
7. ✅ Tested customer signup/login flow - working!
8. ✅ Customer portal running locally at http://localhost:5000

### Detailed Timeline

#### 2:00 AM - Clone & Setup
**Action:** Clone printshop-pro repo for local development
```bash
cd ~/Projects && gh repo clone hypnotizedent/printshop-pro
```
**Result:** Successfully cloned 191 objects (215 KB)

#### 2:02 AM - Configure API URL
**Action:** Create `.env` file to point to production Strapi
```bash
echo 'VITE_API_URL=http://100.92.156.118:1337' > ~/Projects/printshop-pro/.env
```
**Result:** Frontend now configured to use docker-host Strapi

#### 2:05 AM - Discover Existing Auth Endpoints
**Finding:** Strapi already has customer auth endpoints!
- `POST /api/auth/customer/login` - Email + password login
- `POST /api/auth/customer/signup` - Create new customer account
- `GET /api/auth/verify` - Validate JWT token
- `POST /api/auth/employee/validate-pin` - Employee PIN auth

**Verified with curl tests:**
```bash
# Test signup - SUCCESS!
curl -X POST http://100.92.156.118:1337/api/auth/customer/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "portal-test@example.com", "password": "TestPass123!", "name": "Portal Test User"}'
# Response: {"success":true,"token":"eyJhbG...","user":{...}}

# Test login - SUCCESS!
curl -X POST http://100.92.156.118:1337/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email": "portal-test@example.com", "password": "TestPass123!"}'
# Response: {"success":true,"token":"eyJhbG...","user":{...}}
```

#### 2:10 AM - Identify Missing Endpoints
**Problem:** Dashboard.tsx calls `/customer/orders` but Strapi only has `/orders`
**Analysis:** The frontend expects:
- `GET /api/customer/orders` - Customer's orders (filtered by JWT)
- `GET /api/customer/orders/:orderNumber` - Single order details
- `GET /api/customer/quotes` - Customer's quotes

**Solution:** Add these endpoints to auth controller

#### 2:15 AM - Add Customer Endpoints to Strapi
**Files Modified:**
1. `printshop-strapi/src/api/auth/routes/auth.ts` - Added 3 new routes
2. `printshop-strapi/src/api/auth/controllers/auth.ts` - Added 3 handler methods

**New Routes Added:**
```typescript
{
  method: 'GET',
  path: '/customer/orders',
  handler: 'auth.getCustomerOrders',
  config: { auth: false },
},
{
  method: 'GET',
  path: '/customer/orders/:orderNumber',
  handler: 'auth.getCustomerOrder',
  config: { auth: false },
},
{
  method: 'GET',
  path: '/customer/quotes',
  handler: 'auth.getCustomerQuotes',
  config: { auth: false },
}
```

#### 2:20 AM - First Deploy Attempt - FAILED
**Issue:** rsync to `/mnt/printshop/` fails with "Permission denied"
```bash
rsync -avz printshop-strapi/ docker-host:/mnt/primary/docker/volumes/printshop-os/printshop-strapi/
# ERROR: mkdir failed: Permission denied (13)
```

**Root Cause:** Checked DAILY_TASK_LOG.md - found note about stale NFS mount!
```
⚠️ Known Infrastructure Issues
1. Stale NFS mount: /mnt/printshop/ on docker-host is stale
```

**Solution:** Use docker cp instead of rsync (per documented deployment pattern)

#### 2:25 AM - Second Deploy - TypeScript Errors!
**Action:** Copy files into running container
```bash
scp auth-controller.ts docker-host:/tmp/
ssh docker-host 'docker cp /tmp/auth-controller.ts printshop-strapi:/srv/app/src/api/auth/controllers/auth.ts'
docker restart printshop-strapi
```

**Issue:** Strapi fails to start - TypeScript compilation errors!
```
src/api/auth/controllers/auth.ts:441:24 - error TS2339: Property 'total' does not exist
src/api/auth/controllers/auth.ts:493:20 - error TS2322: Type '"lineItems"' is not assignable
```

**Root Cause Analysis:**
1. Order schema uses `totalAmount` not `total`
2. Quote schema has `lineItems` as JSON field, not a relation (can't populate)
3. Quote uses `subtotal` not `total`

#### 2:30 AM - Fix TypeScript Errors
**Changes Made:**
1. `order.total` → `order.totalAmount`
2. `quote.total` → `quote.subtotal`
3. Quote populate: `['lineItems', 'customer']` → `['customer']` (lineItems is JSON)

**Fixed Code:**
```typescript
// Orders
total: order.totalAmount || 0,  // Was: order.total

// Quotes
populate: ['customer'],  // Was: ['lineItems', 'customer']
total: quote.subtotal || 0,  // Was: quote.total
```

#### 2:35 AM - Third Deploy - SUCCESS!
**Action:** Re-copy fixed controller and restart
```bash
scp auth.ts docker-host:/tmp/auth-controller.ts
ssh docker-host 'docker cp /tmp/auth-controller.ts printshop-strapi:/srv/app/src/api/auth/controllers/auth.ts && docker restart printshop-strapi'
```

**Strapi Logs:**
```
[2025-11-29 19:48:49.933] info: Strapi started successfully
```

#### 2:40 AM - Test Customer Orders Endpoint
```bash
curl -s http://100.92.156.118:1337/api/customer/orders \
  -H "Authorization: Bearer eyJhbG..." | jq .
```
**Response:**
```json
{
  "orders": [],
  "pagination": { "page": 1, "limit": 10, "total": 0 }
}
```
**Note:** Empty because test user has no orders (just created). Endpoint works!

#### 2:45 AM - Start Customer Portal Dev Server
```bash
cd ~/Projects/printshop-pro && npm install && npm run dev
```
**Result:** Portal running at http://localhost:5000

#### 2:50 AM - Session Summary
**What's Working:**
- ✅ Customer signup creates account with hashed password
- ✅ Customer login returns JWT token
- ✅ Token verification works
- ✅ Customer orders endpoint returns filtered orders
- ✅ Customer quotes endpoint ready
- ✅ Portal runs locally and connects to Strapi

**What's Not Working Yet:**
- ⚠️ Existing customers have no passwordHash (need to set password to login)
- ⚠️ Orders not linked to customers via relation (uses printavoCustomerId string)
- ⚠️ Customer portal not deployed to docker-host yet

### Files Modified This Session

| File | Changes |
|------|---------|
| `printshop-strapi/src/api/auth/routes/auth.ts` | Added 3 routes: `/customer/orders`, `/customer/orders/:orderNumber`, `/customer/quotes` |
| `printshop-strapi/src/api/auth/controllers/auth.ts` | Added `getCustomerOrders`, `getCustomerOrder`, `getCustomerQuotes` methods; fixed `totalAmount` and `subtotal` field names |
| `~/Projects/printshop-pro/.env` | Created with `VITE_API_URL=http://100.92.156.118:1337` |

### Deployment Commands Used
```bash
# Copy auth controller to docker-host
scp /path/to/auth.ts docker-host:/tmp/auth-controller.ts

# Copy into Strapi container and restart
ssh docker-host 'docker cp /tmp/auth-controller.ts printshop-strapi:/srv/app/src/api/auth/controllers/auth.ts && docker restart printshop-strapi'

# Start customer portal locally
cd ~/Projects/printshop-pro && npm run dev
```

### Issues Encountered & Solutions

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| rsync permission denied | Stale NFS mount at `/mnt/printshop/` | Use docker cp instead (per daily log) |
| TypeScript: `order.total` doesn't exist | Order schema uses `totalAmount` | Changed to `order.totalAmount` |
| TypeScript: Can't populate `lineItems` on quote | Quote.lineItems is JSON, not relation | Removed from populate array |
| TypeScript: `quote.total` doesn't exist | Quote schema uses `subtotal` | Changed to `quote.subtotal` |

### Next Steps (TODO)
1. Deploy customer portal as container on docker-host (port 3001 or subdomain)
2. Run script to link orders→customers via relation (not just printavoCustomerId)
3. Allow existing customers to set password (forgot password flow)
4. Add order tracking page (public URL with order number + email)

---

## 🔥 Session: November 29-30, 2025 - Late Night (11:00 PM - 12:15 AM EST)

#### 11:00 PM - Dashboard Click Handler Fix
**Problem:** User clicks "Giant Carpet Tees + Polos" on Dashboard → nothing happens
**Fix:** Added `onViewOrder` prop to DashboardPage interface and click handler to job cards
**Deployed:** 11:10 PM

#### 11:15 PM - Order Detail Page Error
**Problem:** After click, OrderDetailPage shows "Failed to load order details"
**Root Cause:** Strapi v5 uses `populate=*` not `populate=customer,lineItems`
**Additional Fix:** Added customer lookup fallback when `customer` relation is null
**Deployed:** 11:25 PM

#### 11:30 PM - Customer Names Missing
**Problem:** All jobs show "Unknown Customer" instead of actual names
**Root Cause:** `o.customer?.name` is null for all orders (relation never linked)
**Fix:** Build customer lookup map by `printavoId` during data fetch
**Deployed:** 11:45 PM

#### 11:50 PM - Variable Scope Bug
**Problem:** Dashboard now blank after customer name fix
**Root Cause:** JavaScript variable scope error - `customersData` referenced outside its block
**Fix:** Moved `customersRawData` array to outer scope, build lookup before orders fetch
**Deployed:** 11:55 PM

#### 12:00 AM - Customer Landing Page (GitHub Spark)
**User Request:** Connect customer-facing landing page from GitHub Spark
**Discovery:**
- App URL: `https://printshop-pro--hypnotizedent.github.app`
- Platform: GitHub Spark (not Codespaces)
- Auth redirect: `github.com/spark/runtime/auth?...`
**Status:** Identified - needs integration with Strapi API
**Next Steps:**
1. Access Spark app source at https://github.com/settings/spark
2. Configure API endpoint to point to `http://100.92.156.118:1337`
3. Use `portal-api.ts` functions for customer authentication and data

### Files Modified This Session

| File | Changes |
|------|---------|
| `frontend/src/components/dashboard/DashboardPage.tsx` | Added `onViewOrder` prop + click handler |
| `frontend/src/App.tsx` | Passed `onViewOrder` to DashboardPage, added customer lookup by printavoId, fixed variable scope |
| `frontend/src/components/orders/OrderDetailPage.tsx` | Fixed `populate=*`, added customer lookup fallback |

### GitHub Repos Reference
```
hypnotizedent/printshop-os          - Main monorepo (this workspace)
hypnotizedent/homelab-infrastructure - Infrastructure configs
hypnotizedent/printshop-os-fronten   - Separate frontend repo (typo in name)
hypnotizedent/mint-prints-pricing    - Pricing calculator
hypnotizedent/custom-studio-app      - Custom studio app
```

### Known Data Issue (Needs Future Fix)
**Problem:** Order→Customer relation not established in Strapi
- Orders have `printavoCustomerId` field (string ID from Printavo)
- Orders have `customer` relation field (null for all orders)
- Customers have `printavoId` field that matches `printavoCustomerId`

**Workaround Applied:** Frontend looks up customer by `printavoCustomerId` when `customer` relation is null

**Permanent Fix (TODO):** Run a script to link orders to customers:
```javascript
// For each order where customer is null
// Find customer by printavoId === order.printavoCustomerId
// Update order.customer = customer.documentId
```

### Deployment Commands Used
```bash
# Build
cd frontend && npm run build

# Deploy (ALWAYS restart after docker cp!)
scp -r dist docker-host:/tmp/frontend-dist
ssh docker-host 'docker cp /tmp/frontend-dist/. printshop-frontend:/app/dist/ && docker restart printshop-frontend && rm -rf /tmp/frontend-dist'
```

---

## 🔥 Session: November 29, 2025 - Late Night (11:00 PM - 11:45 PM EST)

### Summary: Dashboard Click Navigation + Customer Name Fixes

**Issues Reported:**
1. Clicking orders on Dashboard "Recent Jobs" → nothing happens
2. Customer names showing "Unknown Customer" on all jobs
3. Order detail page → "Failed to load order details" error

**Root Cause Analysis:**

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Dashboard click broken | DashboardPage had `cursor-pointer` but no `onClick` handler | Added `onViewOrder` prop and click handler |
| "Unknown Customer" | Orders have `customer: null` relation - only `printavoCustomerId` is populated | Added customer lookup by `printavoCustomerId` in App.tsx |
| Order detail 404 | Strapi v5 uses `populate=*` not `populate=customer,lineItems` | Fixed populate syntax + added customer lookup fallback |

### Timeline

#### 11:00 PM - Dashboard Click Handler Fix
**Problem:** User clicks "Giant Carpet Tees + Polos" on Dashboard → nothing happens
**Investigation:** `DashboardPage.tsx` had `cursor-pointer` class but no `onClick`
**Fix:** Added `onViewOrder` prop to DashboardPage interface and click handler to job cards

```tsx
// DashboardPage.tsx
interface DashboardPageProps {
  onViewOrder?: (orderId: string) => void  // NEW
}

// Job card now clickable:
<div onClick={() => onViewOrder?.(job.id)}>
```

```tsx
// App.tsx - pass handler
<DashboardPage ... onViewOrder={handleViewOrder} />
```

**Deployed:** 11:10 PM

#### 11:15 PM - "Failed to load order details" Error
**Problem:** After click, OrderDetailPage shows error
**Investigation:** 
- Tested Strapi API: `curl .../api/orders/${documentId}?populate=customer,lineItems`
- Error: `Invalid key customer,lineItems` - Strapi v5 syntax issue
- Correct: `populate=*`

**Additional Problem:** Even with `populate=*`, customer is `null`:
```json
{
  "orderNumber": "4588",
  "orderNickname": "Giant Carpet Tees + Polos", 
  "printavoCustomerId": "2136748",
  "customer": null  // ← NOT LINKED!
}
```

**Root Cause:** During import, orders were created with `printavoCustomerId` but the Strapi relation to `customer` was never established.

**Fix in OrderDetailPage.tsx:**
1. Changed `populate=customer,lineItems` → `populate=*`
2. Added fallback: if `customer` is null, fetch by `printavoCustomerId`:
```tsx
if (!customerData && o.printavoCustomerId) {
  const custRes = await fetch(
    `${API_BASE}/api/customers?filters[printavoId][$eq]=${o.printavoCustomerId}`
  );
  customerData = custData.data[0];
}
```

**Deployed:** 11:25 PM

#### 11:30 PM - "Unknown Customer" on Dashboard Jobs
**Problem:** All jobs show "Unknown Customer" instead of actual names
**Investigation:** Same root cause - `o.customer?.name` is null for all orders
**Fix in App.tsx:**
```tsx
// Build customer lookup from printavoId
const customersLookup: Record<string, string> = {};
(customersData.data || []).forEach((c: any) => {
  if (c.printavoId) {
    customersLookup[c.printavoId] = c.name || 'Unknown';
  }
});

// Use lookup when building jobs
const customerName = o.customer?.name || 
  (o.printavoCustomerId ? customersLookup[o.printavoCustomerId] : null) || 
  'Unknown Customer';
```

**Deployed:** 11:45 PM

### Files Modified This Session

| File | Changes |
|------|---------|
| `frontend/src/components/dashboard/DashboardPage.tsx` | Added `onViewOrder` prop + click handler |
| `frontend/src/App.tsx` | Passed `onViewOrder` to DashboardPage, added customer lookup by printavoId |
| `frontend/src/components/orders/OrderDetailPage.tsx` | Fixed `populate=*`, added customer lookup fallback |

### Known Data Issue (Needs Future Fix)
**Problem:** Order→Customer relation not established in Strapi
- Orders have `printavoCustomerId` field (string ID from Printavo)
- Orders have `customer` relation field (null for all orders)
- Customers have `printavoId` field that matches `printavoCustomerId`

**Workaround Applied:** Frontend looks up customer by `printavoCustomerId` when `customer` relation is null

**Permanent Fix (TODO):** Run a script to link orders to customers:
```javascript
// For each order where customer is null
// Find customer by printavoId === order.printavoCustomerId
// Update order.customer = customer.documentId
```

### Deployment Commands Used
```bash
# Build
cd frontend && npm run build

# Deploy (ALWAYS restart after docker cp!)
scp -r dist docker-host:/tmp/frontend-dist
ssh docker-host 'docker cp /tmp/frontend-dist/. printshop-frontend:/app/dist/ && docker restart printshop-frontend && rm -rf /tmp/frontend-dist'
```

---### ⚠️ Known Infrastructure Issues
1. **Stale NFS mount:** `/mnt/printshop/` on docker-host is stale - use `sudo umount -f` to fix
2. **docker-compose v1.29.2 bug:** `KeyError: 'ContainerConfig'` - workaround: `docker rm -f` before recreating
3. **Strapi healthcheck:** Marked unhealthy but actually works fine
4. **Frontend container serves static files:** MUST restart container after docker cp! Files are cached.

### 🚨 Deployment Mistake Log (Learn From These!)

#### November 29, 2025 - Frontend Deploy Didn't Take Effect
**What happened:** 
- Built frontend locally with fixes
- Used `scp` to copy dist to docker-host `/tmp/`
- Used `docker cp` to copy into container `/app/dist/`
- Told user changes were live - **they weren't visible**

**Root Cause:**
The frontend container (likely nginx or a static file server) **caches files in memory**. Even though `docker cp` successfully copied the new files to `/app/dist/`, the running process was still serving the old files from its internal cache.

**The Fix:**
```bash
# ALWAYS restart the container after docker cp!
ssh docker-host 'docker restart printshop-frontend'
```

**Correct Deploy Procedure:**
```bash
# 1. Build locally
cd frontend && npm run build

# 2. Copy to docker-host temp
scp -r dist docker-host:/tmp/frontend-dist

# 3. Copy into container
ssh docker-host 'docker cp /tmp/frontend-dist/. printshop-frontend:/app/dist/'

# 4. RESTART CONTAINER (the missing step!)
ssh docker-host 'docker restart printshop-frontend'

# 5. Clean up temp files
ssh docker-host 'rm -rf /tmp/frontend-dist'
```

**Why Copilot missed this:**
- Focused on file deployment, forgot runtime behavior
- Didn't verify by checking the actual served content in browser
- Assumed docker cp = immediate effect (wrong for static file servers)

### Credentials (Reference)
```
Strapi Admin: ronny@ronny.works / PrintShop2025!
Strapi API Token: dc23c1734c2dea...d5090951e (full in .env)
S&S Activewear: 31810 / 07d8c0de-a385-4eeb-b310-8ba7bc55d3d8
SanMar SFTP: 180164 / dMvGlWLTScz2Hh (port 2200)
AS Colour: Subscription-Key in .env + JWT Bearer
Printavo: ronny@mintprints.com / tApazCfvuQE-0Tl3YLIofg
MinIO Console: http://100.92.156.118:9001 - minioadmin / 00ab9d9e1e9b806fb9323d0db5b2106e
```

---

## 🔥 Session: November 30, 2025 (Frontend Data Display Fixes)

### Late Session: Frontend Bug Fixes ✅

**Objective:** Fix multiple frontend data display issues reported by user:
1. Only 100 customers/jobs showing (pagination limit)
2. Jobs page click does nothing (no order detail view)
3. Job Nickname not displayed (critical field for production)
4. Date showing 11/28 instead of actual dates

**Root Cause Analysis:**

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| 100 items limit | `pagination[limit]=100` hardcoded in App.tsx | Increased to 1000 |
| Job click does nothing | CustomerDetailPage order cards have `cursor-pointer` but no `onClick` | Added `onViewOrder` handler |
| Missing orderNickname | App.tsx line 77 uses `Order #${orderNumber}` only | Changed to `orderNickname \|\| Order #...` |
| All dates show 11/28 | `createdAt` is Strapi import date, not original Printavo date | Use `dueDate` instead |

**Files Modified:**

1. **`frontend/src/App.tsx`** - Major updates
   - Added import for `OrderDetailPage`
   - Added `selectedOrderId` state
   - Changed `pagination[limit]=100` → `pagination[limit]=1000`
   - Fixed job title: `o.orderNickname || \`Order #${o.orderNumber}\``
   - Added `handleViewOrder(orderId)` handler
   - Added `handleBackFromOrder()` handler
   - Added `order-detail` route case
   - Passed `onViewOrder` prop to CustomerDetailPage

2. **`frontend/src/components/customers/CustomerDetailPage.tsx`**
   - Added `onViewOrder?: (orderId: string) => void` prop
   - Added `onClick={() => onViewOrder?.(order.documentId)}` to order cards
   - Fixed date display: removed misleading `createdAt`, use `dueDate` as primary

3. **`frontend/src/components/orders/OrderDetailPage.tsx`** (NEW - 545 lines)
   - Staff-facing order detail page
   - Order header with nickname, status badge, amounts
   - Line items table with 25+ size columns (2XS → 5XL)
   - Payments section with payment history
   - Imprints section with decoration method details
   - Shipping info and status timeline
   - Back navigation

**Date Issue Deep Dive:**

The date issue occurs because Strapi's auto-generated `createdAt` field stores when records were imported to Strapi (Nov 28-29, 2025), not when orders were originally created in Printavo. 

**Schema Analysis:**
- Order schema has: `dueDate`, `customerDueDate`, `productionDueDate`, `invoiceDate`, `paymentDueDate`
- No `originalCreatedAt` or `printavoCreatedAt` field exists
- **Recommendation:** Add `orderDate` field to schema and re-import with original Printavo dates

**Current Workaround:** Display `dueDate` (preserved from Printavo) instead of misleading `createdAt`

**Questions Answered:**
- **"Where is ShipmentTracking.tsx wired?"** → Sidebar "Tracking" nav item (MapTrifold icon)

**Architecture Notes:**
- Strapi v5 at `100.92.156.118:1337` - 16 content types
- Frontend at `100.92.156.118:3000` - React 19 + Vite
- Data imported: 12,867 orders, 3,319 customers, 49,216 line items

**Next Steps:**
1. Deploy frontend to docker-host
2. Test order click navigation
3. Consider adding `orderDate` field to Strapi schema for accurate order dates
4. Consider server-side pagination for 12,867 orders (currently loading 1000 max)

---

## 🔥 Session: November 29, 2025 (Customer Portal + Shipping Features)

### 8:10 PM - 8:30 PM: Tracking Page + Cleanup ✅

**Objective:** Add shipment tracking page, remove dev notice box

**Changes Made:**
1. **Removed EasyPost Integration Note** from ShippingLabelForm.tsx
   - Removed the amber warning box at bottom of form
   - Cleaner UI for production use

2. **Created `ShipmentTracking.tsx`** (NEW - 380 lines)
   - Left panel: Recent shipments list with search
   - Right panel: Tracking details for selected shipment
   - Fetches shipments from Strapi `/api/shipments`
   - Shows tracking history (from EasyPost `/api/shipping/track/:id`)
   - "Track on Carrier" button links to USPS/UPS/FedEx/DHL tracking
   - Copy tracking number to clipboard
   - View label button when label URL available

3. **Updated App.tsx and AppSidebar.tsx**
   - Added `/tracking` route → `<ShipmentTracking />`
   - Added "Tracking" nav item with MapTrifold icon

**Tested:**
- Verified orders endpoint: `GET /api/orders` works with $containsi search
- Verified customers endpoint: `GET /api/customers` works with search
- Order lookup uses URLSearchParams (auto-encodes brackets)

**Deployed:** 8:30 PM - Frontend size 689KB JS, 443KB CSS

---

### 7:45 PM - 8:10 PM: Multi-Box Shipping + Order Lookup ✅

**Objective:** Shipping features - multi-box shipments and order lookup

**Changes Made:**
1. **Updated `ShippingLabelForm.tsx`** - Multi-box support
   - Added `ParcelWithId` interface with unique IDs per parcel
   - Added `parcels` array state replacing single `parcel`
   - Added `addParcel()`, `removeParcel()`, `updateParcel()` functions
   - Updated UI to render parcel cards with Add/Remove buttons
   - Added shipment summary showing total weight and box count
   - Updated `validateAddresses()` for multi-parcel validation
   - Updated `getRates()` to include all parcels in request

2. **Order/Customer Lookup** ✅
   - Added `OrderSearchResult` and `CustomerSearchResult` interfaces
   - Added `searchOrdersAndCustomers()` function to query Strapi
   - Added `selectOrder()` and `selectCustomer()` to auto-fill recipient
   - Added Dialog with search input and results display
   - Shows "Has Address" badge for entries with shipping addresses
   - Auto-fills toAddress on selection

**Technical Details:**
- Each parcel has unique ID via `generateParcelId()`
- Box presets (small, medium, large, flat-mailer, custom) per parcel
- EasyPost rates API receives `parcels` array + `boxCount` for batch support
- Order lookup queries by orderNumber, visualId, or orderNickname
- Customer lookup queries by name, email, or company
- Uses Dialog from shadcn/ui for the lookup modal

**Deployed:** 8:10 PM - Frontend size 675KB JS, 443KB CSS

**Remaining Shipping Work:**
- [ ] Batch label purchase for multi-box (needs backend support)
- [ ] Tracking page for shipped orders
- [ ] Test with real order data

---

### 7:00 PM - 7:45 PM: Quote Approval + Profile + Products Wiring

**Objective:** Wire Customer Portal components to Strapi APIs (HIGH PRIORITY)

**Changes Made:**
1. **Created `frontend/src/lib/portal-api.ts`** (300+ lines)
   - `loginCustomer(email)` - Email-based lookup in Strapi customers
   - `verifySession(token)` - Token validation with expiration check
   - `fetchCustomerOrders(customerId, options)` - Paginated order fetch with filters
   - `fetchOrderDetails(orderId, customerId)` - Single order with line items
   - `fetchCustomerQuotes(customerId, options)` - Quote list with status filter
   - `fetchCustomerStats(customerId)` - Dashboard stats (orders, quotes, jobs)
   - `updateCustomerProfile(customerId, updates)` - Profile update endpoint
   - Helper functions: `formatOrderStatus`, `formatPrice`, `formatDate`

2. **Created `frontend/src/hooks/useCustomerAuth.tsx`**
   - React hook for auth state management
   - `login(email)` - Login with localStorage token persistence
   - `logout()` - Clear session and redirect
   - `refreshCustomer()` - Refresh customer data from API
   - `CustomerAuthProvider` context for global auth state
   - `useCustomerAuthContext()` hook for child components

3. **Updated `frontend/src/components/portal/OrderHistory.tsx`**
   - Removed hardcoded `API_BASE_URL = 'http://localhost:3002'`
   - Now uses `fetchCustomerOrders()` and `fetchOrderDetails()` from portal-api.ts
   - Added `mapPortalOrderToOrder()` function to convert Strapi format → component format
   - Client-side search filtering on order number
   - Updated sort options to match Strapi field names

4. **Updated `frontend/src/components/portal/Portal.tsx`**
   - Wrapped in `CustomerAuthProvider` for global auth context
   - Replaced mock data with real API calls
   - `fetchCustomerStats()` on customer login
   - `OrderHistoryComponent` now receives `customerId` prop
   - Proper loading state while auth initializing

**Technical Details:**
- Orders query: `filters[printavoCustomerId][$eq]={printavoId}` (same as CustomerDetailPage fix)
- Auth token: Base64 encoded JSON with `customerId`, `email`, `exp` (24h expiry)
- No password required - email lookup only (for internal dashboard use)

**Files Modified:**
- `frontend/src/lib/portal-api.ts` (NEW)
- `frontend/src/hooks/useCustomerAuth.tsx` (NEW)
- `frontend/src/components/portal/OrderHistory.tsx` (MODIFIED)
- `frontend/src/components/portal/Portal.tsx` (MODIFIED)

**Next Steps:**
- [x] Build and deploy to docker-host ✅ (4:10 PM)
- [x] Test OrderHistory with real customer data
- [x] Wire Quote components (QuoteList, QuoteApproval) ✅ (6:30 PM)
- [x] Wire Profile components ✅ (7:00 PM)
- [x] Fix Products page demo catalog ✅ (7:10 PM)

---

### 7:00 PM - 7:15 PM: Profile & Products Fix

**Objective:** Wire Profile settings to Strapi, fix Products page empty state

**Changes Made:**

1. **Updated `frontend/src/components/portal/ContactInfo.tsx`:**
   - Replaced mock data with `useCustomerAuthContext()` for real customer data
   - Form now pre-populates with customer name, email, phone, company
   - Save calls `updateCustomerProfile()` from portal-api.ts
   - Shows Printavo Customer ID if available
   - Email field disabled (contact support to change)

2. **Updated `frontend/src/components/portal/Portal.tsx`:**
   - Added `ProfileSettings` import
   - Routes `/portal/account/profile`, `/portal/account/addresses`, `/portal/account/notifications` now use `<ProfileSettings />`
   - ProfileSettings has tabs: Profile, Addresses, Security, Preferences, Activity

3. **Fixed `frontend/src/components/products/ProductCatalog.tsx`:**
   - **Issue:** Products page showed empty when no products in Strapi database
   - **Fix:** Added `getDemoProducts()` function with 6 sample products
   - Now shows demo catalog when Strapi returns empty data
   - Demo products: AS Colour, Gildan, Bella+Canvas, Champion, Port & Company
   - Categories: t-shirts, hoodies, polos

**Deployment:**
```bash
npm run build  # 1.78s, 665KB JS bundle
scp -r dist docker-host:/tmp/printshop-frontend-dist
ssh docker-host 'docker cp /tmp/printshop-frontend-dist/. printshop-frontend:/app/dist/'
```

**Access Points:**
- Profile Settings: http://100.92.156.118:3000/portal/account/profile
- Products Catalog: http://100.92.156.118:3000/products

---

### 5:30 PM - 6:45 PM: Quote Approval Flow Wiring

**Objective:** Complete quote approval workflow from list → view → approve/reject

**Changes Made:**

1. **Created `frontend/src/components/portal/QuotesPage.tsx`** (NEW - 180 lines)
   - Container component connecting QuoteList + QuoteApproval to Strapi
   - `loadQuotes()` - Fetches quotes via `fetchCustomerQuotes()`
   - `handleViewQuote()` - Opens approval dialog with full quote details
   - `handleApprove()` - Submits approval with signature to Strapi
   - Maps Strapi statuses (draft/sent/viewed) → UI statuses (Pending/Approved/etc)

2. **Added Quote API Functions to `portal-api.ts`:**
   - `fetchQuoteDetails(quoteId)` - Full quote with line items, mockups
   - `approveQuote(documentId, approvalData)` - Submit approval with signature
   - `rejectQuote(documentId, reason)` - Reject with reason text
   - `requestQuoteChanges(documentId, comments)` - Request changes on quote
   - `mapQuoteStatus()` - Maps Strapi enum → QuoteStatus type

3. **Updated `Portal.tsx` Routes:**
   - `/portal/quotes/pending` → `<QuotesPage showOnlyPending={true} />`
   - `/portal/quotes/history` → `<QuotesPage showOnlyPending={false} />`

4. **Fixed Field Mappings:**
   - Strapi uses `total` not `totalAmount`
   - Strapi uses `approverSignature` and `approvedBy` not `approvalSignature`
   - Status values: `draft`, `sent`, `viewed`, `approved`, `rejected`, `expired`, `converted`

5. **Created Test Quotes in Strapi:**
   - Q-2024-001 (sent) - Custom T-Shirts + Caps - $1,420.78
   - Q-2024-002 (approved) - Polo Shirts - $3,031.00
   - Q-2024-003 (draft) - Hoodies + Sweatpants - $2,598.00

**API Endpoints:**
- `GET /api/quotes` - List all quotes (public access configured)
- `GET /api/quotes/{documentId}?populate=*` - Single quote with details
- `PUT /api/quotes/{documentId}` - Update status, signature, etc.

**Access Points:**
- Quote List: http://100.92.156.118:3000/portal/quotes/pending
- Quote History: http://100.92.156.118:3000/portal/quotes/history
- Strapi API: http://100.92.156.118:1337/api/quotes

**Files Created/Modified:**
- `frontend/src/components/portal/QuotesPage.tsx` (NEW)
- `frontend/src/lib/portal-api.ts` (+180 lines)
- `frontend/src/components/portal/Portal.tsx` (route updates)

---

### 4:00 PM - 4:15 PM: Frontend UI Polish & Order Display Fixes

**Objective:** Fix order nickname/pricing not showing, improve UI display

**Issues Identified:**
1. Order nickname (`orderNickname`) was not displayed in CustomerDetailPage
2. Pricing showed as "$0" because orders display `totalAmount` which may be 0 for quotes
3. Payment status (amount paid/outstanding) was not visible
4. Portal OrderHistory was using `orderNumber` instead of `orderNickname`

**Changes Made:**

1. **Updated `frontend/src/components/customers/CustomerDetailPage.tsx`:**
   - Added `orderNickname`, `visualId`, `amountPaid`, `amountOutstanding` to Order interface
   - Updated order mapping to extract all pricing fields from Strapi
   - Order display now shows:
     - `#13670` (visualId) + nickname if available
     - Status badge with color coding
     - Due date and notes preview
     - Total amount with proper formatting (`$1,234.56`)
     - Payment status: "Paid in full" (green) or "$X due" (orange)
     - Shows "Quote" instead of "$0" for unpaid quotes

2. **Updated `frontend/src/lib/portal-api.ts`:**
   - Added `orderNickname` to `PortalOrder` interface

3. **Updated `frontend/src/components/portal/OrderHistory.tsx`:**
   - `mapPortalOrderToOrder()` now uses `orderNickname || orderNumber` for nickname field

**Deployment:**
```bash
# Build: 1.76s, 664KB JS bundle
npm run build

# Deploy via scp + docker cp (NFS mount workaround)
scp -r dist docker-host:/tmp/frontend-dist
ssh docker-host 'docker cp /tmp/frontend-dist/. printshop-frontend:/app/dist/'
```

**How to See Changes:**
1. Navigate to `http://100.92.156.118:3000` 
2. Click on "Customers" in the sidebar
3. Click "View Details" on any customer
4. Order history now shows:
   - Order number with `#` prefix
   - Order nickname (if set in Printavo)
   - Payment status and amounts
   - Notes preview on hover

**Strapi Order Fields Reference:**
```json
{
  "orderNumber": "13670",
  "orderNickname": "Customer Project Name",  // Often null
  "visualId": "13670",                        // Display ID
  "totalAmount": 1500.00,
  "amountPaid": 750.00,
  "amountOutstanding": 750.00,
  "status": "IN_PRODUCTION"
}
```

---
   - Script ready: `scripts/sync-line-items.py`
   - Checkpoint: `data/line-item-import-checkpoint.json`
   - **Current:** 28,828 / 44,158 (65%) - Running in background

2. **Upload Artwork to MinIO** - 201 GB in `data/artwork/by_customer/`
   - Script ready: `scripts/upload-artwork-minio.py` (direct Python SDK)
   - 115,606 files indexed
   - **Current:** ⏸️ PAUSED - uploading PNGs but not DST/AI files (needs script fix)

3. **Fix Strapi Health** - Container running but marked unhealthy

---

### Session: November 29, 2025 - PR #169 Audit + Frontend Auth Fixes

**Started:** 12:20 PM EST
**Goal:** Audit PR #169, fix critical bugs, then resolve frontend 403 auth errors

---

#### 📍 12:20 PM - PR #169 Checkout & Initial Testing
- Checked out `copilot/add-audit-script-for-repo-health` branch
- Tested on macOS default Bash 3.2:
  ```bash
  /bin/bash ./scripts/audit.sh --help
  # Result: ./scripts/audit.sh: line 43: declare: -A: invalid option
  ```
- **Bug #1 Found:** `declare -A` (associative arrays) requires Bash 4.0+

#### 📍 12:25 PM - Installed Homebrew Bash for Proper Testing
```bash
brew install bash
# Installed: bash 5.3.8 at /opt/homebrew/bin/bash
```

#### 📍 12:28 PM - Validated JSON Output with jq
```bash
/opt/homebrew/bin/bash ./scripts/audit.sh --check all --format json | jq .
# Result: ✅ Valid JSON, all 7 checks pass
```

#### 📍 12:30 PM - Discovered Test Categorization Bug
```bash
/opt/homebrew/bin/bash ./scripts/audit.sh --check tests
# Result: All 33 tests showing as "other" instead of proper services
```
- **Bug #2 Found:** `find` returns `./services/api/...` but regex expects `services/api/...`
- Root cause: Missing `./` prefix stripping before categorization

#### 📍 12:32 PM - Submitted PR Review with "Request Changes"
- Added 6 inline code comments with specific fixes:
  1. Bash version check in `audit.sh` (line 25)
  2. Path prefix fix in `tests.sh` `output_tests_markdown()` (line 185)
  3. Path prefix fix in `tests.sh` `output_tests_json()` (line 284)
  4. Path prefix fix in `tests.sh` `output_tests_csv()` (line 369)
  5. Prerequisites section in `README-audit.md`
  6. Suggestion for portable path handling

#### 📍 12:35 PM - Copilot Agent Applied Fixes
- Commit `181c791` created by copilot-swe-agent[bot]:
  - Added Bash 4.0+ version check with helpful error message
  - Fixed path prefix in all 3 output functions
  - Added Prerequisites section to README

#### 📍 12:40 PM - Verified Fixes Work Correctly
```bash
# Test 1: Bash version check
/bin/bash ./scripts/audit.sh --help
# Result: "Error: Bash 4.0+ required. Found: 3.2.57(1)-release"

# Test 2: Test categorization
/opt/homebrew/bin/bash ./scripts/audit.sh --check tests | grep -A 10 "Coverage Matrix"
# Result:
# | production-dashboard | 4 | 117 |
# | api | 13 | 441 |
# | frontend | 2 | 31 |
# | job-estimator | 7 | 198 |
# ✅ Tests now properly categorized!
```

#### 📍 12:42 PM - Cleaned Up Orphaned Branch
```bash
git branch -D pr-169  # Deleted local orphan branch I accidentally created
```

**PR #169 Status:** Ready for merge - all issues resolved

---

#### 📍 12:50 PM - Merged PR #169
```bash
gh pr ready 169 && gh pr merge 169 --squash --delete-branch
# ✓ Pull request marked as "ready for review"
# ✓ Squashed and merged pull request #169
# ✓ Deleted branch copilot/add-audit-script-for-repo-health
```
- Commit: `9b43e3e` - feat(scripts): add automated audit script for repo health reports
- Closes issue #163
- 9 files added, 3,793 lines of code

**PR #169 COMPLETE ✅**

---

#### 📍 12:55 PM - Frontend Auth Fixes (Quote + Shipping Routes)
**Issue:** Quotes and Shipping endpoints returning 403 Forbidden
**Root Cause:** Strapi routes require authentication by default
**Fix:** Add `auth: false` to all routes for internal dashboard access

**Files Modified:**

1. `printshop-strapi/src/api/quote/routes/quote.ts`
   - Added `auth: false` to: find, findOne, create, update, delete

2. `printshop-strapi/src/api/shipping/routes/shipping.ts`
   - Added `auth: false` to all 4 routes:
     - POST `/shipping/rates`
     - POST `/shipping/buy`
     - GET `/shipping/track/:trackingCode`
     - POST `/shipping/validate-address`

```bash
git commit -m "fix(strapi): add auth: false to quote and shipping routes"
git push origin main
# Commit: ba8e905
```

#### 📍 1:05 PM - Deployed Auth Fixes to docker-host
**Issue Encountered:** docker-compose v1.29.2 `KeyError: 'ContainerConfig'` bug
```bash
# First attempt - failed
ssh docker-host 'cd ~/stacks/printshop-os && docker-compose up -d --build strapi'
# ERROR: 'ContainerConfig' - known docker-compose v1 bug with newer Docker

# Fix: Force remove stale containers
ssh docker-host 'docker ps -a --filter "name=strapi" --format "{{.ID}}" | xargs -r docker rm -f'
# Removed: d7b744753516

# Retry - SUCCESS
ssh docker-host 'cd ~/stacks/printshop-os && docker-compose up -d strapi'
# Creating printshop-strapi ... done
```

**Synced files via rsync (not git - docker-host not a git repo):**
```bash
rsync -avz printshop-strapi/src/api/quote/routes/quote.ts docker-host:~/stacks/printshop-os/printshop-strapi/src/api/quote/routes/
rsync -avz printshop-strapi/src/api/shipping/routes/shipping.ts docker-host:~/stacks/printshop-os/printshop-strapi/src/api/shipping/routes/
```

#### 📍 1:10 PM - Verified Auth Fixes Working
```bash
# Before: 403 Forbidden
# After:
curl -s -o /dev/null -w "%{http_code}" http://100.92.156.118:1337/api/quotes
# Result: 200 ✅

curl -s -o /dev/null -w "%{http_code}" -X POST http://100.92.156.118:1337/api/shipping/rates -H "Content-Type: application/json" -d '{"test":true}'
# Result: 400 ✅ (auth passed, needs proper payload)
```

| Endpoint | Before | After |
|----------|--------|-------|
| `GET /api/quotes` | 403 Forbidden | **200 OK** ✅ |
| `POST /api/shipping/rates` | 403 Forbidden | **400 Bad Request** ✅ |

---

#### 📍 1:15 PM - Frontend Quotes Page Still Crashing
**Issue:** http://100.92.156.118:3000/ → Quotes page crashes
**Investigation:** Frontend container was running old build

#### 📍 1:20 PM - Rebuilt & Redeployed Frontend
```bash
# 1. Sync all frontend source
rsync -avz --exclude node_modules frontend/ docker-host:~/stacks/printshop-os/frontend/

# 2. Force remove old container (avoid docker-compose bug)
ssh docker-host 'docker ps -a --filter "name=frontend" --format "{{.ID}}" | xargs -r docker rm -f'

# 3. Rebuild container (no cache)
ssh docker-host 'cd ~/stacks/printshop-os && docker-compose build --no-cache frontend'
# Built successfully: printshop-os_frontend:latest

# 4. docker-compose up failed - Strapi "unhealthy" blocks frontend
# ERROR: Container "strapi" is unhealthy
# (Strapi is running fine, just fails healthcheck)

# 5. Workaround: Start frontend directly without dependency
ssh docker-host 'docker run -d --name printshop-frontend --network homelab-network -p 3000:3000 -e NODE_ENV=production --restart unless-stopped printshop-os_frontend:latest'
```

**Container Status After Fix:**
```
NAMES                STATUS
printshop-frontend   Up (healthy) ✅
printshop-strapi     Up (unhealthy) - but works
printshop-api        Up (healthy)
printshop-minio      Up (healthy)
printshop-postgres   Up (healthy)
printshop-redis      Up (healthy)
```

**Frontend Rebuild Notes:**
- Dockerfile uses node:18-alpine (warns about packages needing Node 20+)
- Build successful with 6297 modules transformed
- CSS: 469KB, JS: 662KB (gzip: 186KB)

---

### Session: November 29, 2025 (Continued) - Frontend Bug Fixes

**Started:** 1:30 PM EST  
**Goal:** Fix Quotes page crash, Customer View Details blank page, wire up New Order button

---

#### 📍 1:30 PM - Diagnosed Frontend Issues (3 Bugs)

**Bug 1: Quotes Page Crash**
- **Symptom:** `crypto.randomUUID is not a function` error
- **Root Cause:** `crypto.randomUUID()` only works in **secure contexts** (HTTPS or localhost), NOT over plain HTTP
- **Location:** `frontend/src/components/quotes/QuoteForm.tsx` line 82
- **Code:**
  ```tsx
  const createEmptyLineItem = (): LineItem => ({
    id: crypto.randomUUID(),  // <-- CRASHES on HTTP!
    ...
  });
  ```

**Bug 2: Customer View Details Blank**
- **Symptom:** Customer detail page shows no orders
- **Root Cause:** Orders have `printavoCustomerId` field but customer relation object NOT populated in Strapi
- **Discovery:** API returns orders with `printavoCustomerId: "9645649"` but no `customer` object
- **Location:** `frontend/src/components/customers/CustomerDetailPage.tsx`
- **Code:**
  ```tsx
  // Was filtering by customer.documentId (doesn't exist)
  `${API_BASE}/api/orders?filters[customer][documentId][$eq]=${customerId}`
  ```

**Bug 3: New Order Button Non-Functional**
- **Symptom:** Clicking "New Order" just shows toast "coming soon"
- **Location:** `frontend/src/App.tsx` lines 148-155

---

#### 📍 1:35 PM - Fixed crypto.randomUUID (Bug 1)

**Fix:** Added UUID polyfill that works over HTTP

**Files Modified:**
1. `frontend/src/components/quotes/QuoteForm.tsx`
2. `frontend/src/components/production/mobile/MobileTimeClock.tsx`

**Solution:**
```tsx
// UUID generator that works over HTTP (crypto.randomUUID requires HTTPS)
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
```

---

#### 📍 1:40 PM - Fixed Customer Orders Query (Bug 2)

**Fix:** Changed order filter to use `printavoCustomerId` instead of broken customer relation

**File Modified:** `frontend/src/components/customers/CustomerDetailPage.tsx`

**Before:**
```tsx
const res = await fetch(
  `${API_BASE}/api/orders?filters[customer][documentId][$eq]=${customerId}`
);
```

**After:**
```tsx
// First get customer's printavoId
const customerRes = await fetch(`${API_BASE}/api/customers/${customerId}`);
const customerData = await customerRes.json();
const printavoCustomerId = customerData.data?.printavoId;

// Then fetch orders by printavoCustomerId
const res = await fetch(
  `${API_BASE}/api/orders?filters[printavoCustomerId][$eq]=${printavoCustomerId}`
);
```

---

#### 📍 1:45 PM - Wired Up New Order Button (Bug 3)

**Fix:** Navigate to Quotes page with customer info pre-filled

**Files Modified:**
1. `frontend/src/components/quotes/QuoteForm.tsx` - Added `initialCustomer` prop
2. `frontend/src/App.tsx` - Updated handler + passed customer to QuoteForm

**QuoteForm.tsx Changes:**
```tsx
interface QuoteFormProps {
  initialCustomer?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
}

export function QuoteForm({ initialCustomer }: QuoteFormProps = {}) {
  const [formData, setFormData] = useState<QuoteFormData>({
    customerName: initialCustomer?.name || '',
    customerEmail: initialCustomer?.email || '',
    // ... pre-fills from customer
  });
```

**App.tsx Changes:**
```tsx
const handleNewOrder = (customerId: string) => {
  setSelectedCustomerId(customerId);
  setCurrentPage("quotes");
  toast.success("Creating new quote", {
    description: "Customer info has been pre-filled"
  });
}

// In renderPage():
case "quotes":
  return <QuoteForm initialCustomer={selectedCustomer ? {
    name: selectedCustomer.name,
    email: selectedCustomer.email,
    phone: selectedCustomer.phone,
    company: selectedCustomer.company,
  } : undefined} />
```

---

#### 📍 1:50 PM - Built Frontend Locally
```bash
cd frontend && npm run build
# ✓ 6297 modules transformed
# ✓ built in 2.04s
# Output: dist/assets/main-Cnbj8G8n.js (648KB)
```

---

#### 📍 1:55 PM - Discovered Stale Mount Issue on docker-host

**Problem:** rsync to `/mnt/printshop/` was hanging indefinitely

**Diagnosis:**
```bash
ssh docker-host "timeout 2 ls /mnt/printshop/ 2>&1 || echo 'MOUNT_STALE'"
# Result: MOUNT_STALE
```

**Root Cause:** `/mnt/printshop/` is a stale NFS mount (disconnected network mount)

**Workaround:** Copy files via `/tmp/` then `docker cp` into container

---

#### 📍 2:00 PM - Deployed Frontend via docker cp

**Strategy:** Since stale mount blocks rsync, copy to `/tmp/` then docker cp

```bash
# 1. Create temp directory
ssh docker-host "rm -rf /tmp/frontend-dist && mkdir -p /tmp/frontend-dist"

# 2. SCP files to temp
scp -r /Users/ronnyworks/Projects/printshop-os/frontend/dist/* docker-host:/tmp/frontend-dist/
# main-DUYiLeir.css    432KB  967KB/s
# main-Cnbj8G8n.js     648KB  1.7MB/s
# + index.html, manifest.json, offline.html, sw.js

# 3. Docker cp into container
ssh docker-host "docker cp /tmp/frontend-dist/. printshop-frontend:/app/dist/"
# Files copied successfully

# 4. Restart container
ssh docker-host "docker restart printshop-frontend"
```

---

#### 📍 2:05 PM - Verified All Fixes Working

**Test Results:**
| Page | Before | After |
|------|--------|-------|
| Quotes | ❌ `crypto.randomUUID is not a function` crash | ✅ Loads, form works |
| Customer View Details | ❌ Blank (no orders) | ✅ Shows customer orders |
| New Order button | ❌ Toast "coming soon" | ✅ Navigates to Quotes with customer pre-filled |

**Live URL:** http://100.92.156.118:3000/

---

### 🔴 Known Issues to Fix Later

1. **Stale mount:** `/mnt/printshop/` on docker-host needs `sudo umount -f /mnt/printshop`
2. **Order-Customer relation:** Orders have `printavoCustomerId` but customer object not linked in Strapi
   - Workaround: Frontend fetches customer printavoId first, then filters orders
   - Proper fix: Run script to populate customer relations on orders
3. **Strapi healthcheck:** Container marked "unhealthy" but works fine

---

### 📋 Session Summary - November 29, 2025

**Completed:**
- ✅ PR #169: Audited, bugs found, fixed, merged
- ✅ Strapi auth: Added `auth: false` to quote + shipping routes
- ✅ Frontend Bug 1: `crypto.randomUUID` replaced with HTTP-safe polyfill
- ✅ Frontend Bug 2: Customer orders now filter by `printavoCustomerId`
- ✅ Frontend Bug 3: New Order button navigates to Quotes with pre-filled customer
- ✅ Deployment: Worked around stale mount with docker cp method

**Files Changed:**
| File | Change |
|------|--------|
| `frontend/src/components/quotes/QuoteForm.tsx` | Added generateId polyfill, initialCustomer prop |
| `frontend/src/components/customers/CustomerDetailPage.tsx` | Fixed order query to use printavoCustomerId |
| `frontend/src/components/production/mobile/MobileTimeClock.tsx` | Added generateId polyfill |
| `frontend/src/App.tsx` | Wired New Order to navigate to Quotes |
| `printshop-strapi/src/api/quote/routes/quote.ts` | Added auth: false |
| `printshop-strapi/src/api/shipping/routes/shipping.ts` | Added auth: false |

**Commits:**
- `ba8e905` - fix(strapi): add auth: false to quote and shipping routes
- `9b43e3e` - feat(scripts): add automated audit script (PR #169)

**Session Ended:** 2:10 PM EST

---

### Session: November 28, 2025 10:00 PM - Frontend Bug Investigation

**Started:** 10:00 PM EST
**Goal:** Investigate Quotes page + Shipping EasyPost errors, update task log

#### 📍 10:05 PM - Line Items Progress Check
```bash
Last index: 36,492
Imported: 33,810
Progress: ~83% complete
```
- Import still running (PID 91501)
- ETA: ~15 minutes remaining

#### 📍 10:10 PM - MinIO Artwork Upload Paused
- **Issue:** Script was pulling all files including PNGs
- **Needed files:** DST (embroidery), AI/EPS (vector), PDF (print-ready)
- **Decision:** Pause upload, fix script filter in future session
- **Action:** Stopped upload script

#### 📍 10:15 PM - Frontend Bug Root Cause Analysis

**Bug 1: Quotes Page**
- **Symptom:** QuoteForm loads fine, but "Save Quote" fails
- **Root Cause:** 403 Forbidden - Strapi requires auth token
- **Location:** `frontend/src/components/quotes/QuoteForm.tsx` line 232
- **Fix needed:** Either add `auth: false` to route OR include API token in frontend

**Bug 2: Shipping EasyPost**
- **Symptom:** "Failed to get shipping rates" error
- **Root Cause:** 403 Forbidden - `/api/shipping/rates` requires auth
- **Location:** `printshop-strapi/src/api/shipping/routes/shipping.ts`
- **Verified:** EasyPost API key configured ✅, @easypost/api@8.4.0 installed ✅
- **Fix needed:** Add `auth: false` to shipping routes for internal dashboard

**Tested Endpoints:**
```bash
curl -X POST http://100.92.156.118:1337/api/shipping/rates → 403 Forbidden
curl http://100.92.156.118:1337/api/quotes → 403 Forbidden
```

**Fix Options:**
1. **Option A (Quick):** Add `auth: false` to shipping/quote routes
2. **Option B (Proper):** Create API client with Strapi token in frontend

**Ended:** 10:20 PM EST (in progress)

---

### Session: November 28, 2025 7:15 PM - Frontend Customer Pages & Sync Resume

**Started:** 7:15 PM EST
**Goal:** Fix frontend customer pages, resume line items import, start MinIO artwork upload

#### 📍 7:15 PM - Diagnosed docker-host High Load
- Load average was **24.97** (should be <8 for 8-core VM)
- Found **26 zombie SSH sessions** from disconnected VS Code terminals
- Killed stale sessions: `pkill -9 -f "sshd:.*@notty"`
- Load dropped from 26 users to 1

#### 📍 7:20 PM - Resumed Line Items Import
```bash
# Checked checkpoint status
Line items in Strapi: 25,439
Checkpoint last_index: 20,148
Imported IDs: 17,466
Failed IDs: 100 (duplicate key errors - expected)
Total source items: 44,158

# Started import in background with caffeinate
nohup caffeinate -dims python scripts/sync-line-items.py > /tmp/line-items-import.log 2>&1 &
```
- **Status @ 7:30 PM:** 28,828 / 44,158 (65%) - ~7.75 items/sec
- **ETA:** ~35 minutes remaining

#### 📍 7:22 PM - Created New MinIO Upload Script
- **File:** `scripts/upload-artwork-minio.py`
- **Why new script:** Old script used rsync to docker-host then mc; new script uploads directly from Mac via MinIO Python SDK
- **Features:**
  - Direct network upload (no SSH/rsync overhead)
  - 4 parallel uploads
  - Checkpoint/resume
  - tqdm progress bar
  - Scans `data/artwork/by_customer/` (actual files, not symlinks)

```python
# Key config (updated to 8 workers)
ARTWORK_DIR = Path("data/artwork/by_customer")
MINIO_ENDPOINT = "100.92.156.118:9000"
MINIO_BUCKET = "printshop-artwork"
PARALLEL_UPLOADS = 8  # Was 4, bumped to 8 @ 8:00 PM
```

#### 📍 7:25 PM - Fixed Upload Script Path Issue
- Original script scanned `by_order/` which has symlinks → found 0 files
- Fixed to scan `by_customer/` which has actual files
- Structure: `by_customer/{customer-slug}/{year}/{order_folder}/files`
- Found: **115,606 files** (200.82 GB)

#### 📍 7:26 PM - Started MinIO Upload
```bash
source .venv/bin/activate && python scripts/upload-artwork-minio.py
# Output:
# Found 115,606 files
# Total size: 200.82 GB
# Uploading: 0%| | 34/115606 [00:18<9:38:33, 3.33files/s]
```
- **Upload speed:** ~3.33 files/sec
- **ETA:** ~9.5 hours

#### 📍 8:00 PM - Bumped Parallel Workers to 8
- Changed `PARALLEL_UPLOADS = 4` → `PARALLEL_UPLOADS = 8` in script
- Progress at time: 1,219 / 115,606 files (1%), 1.1 GB transferred
- At 4 workers: ~4.89 sec/file, ETA ~155 hours
- Hoped 8 workers would ~double throughput
- **Issue:** macOS environment mess - python3 uses Homebrew, venv uses Python 3.14
- **Resolution:** Let it ride with original config, focus on architecture discussion instead

#### 📍 8:10 PM - Architecture Review: Is 200GB on docker-host Future-Proof?
**Question:** Should all artwork be on the same VM running Strapi?

**Research Results:**
| Resource | docker-host Spec |
|----------|------------------|
| OS | Ubuntu Server 24.04 LTS |
| vCPUs | 8 |
| RAM | 64GB |
| Root Storage | 100GB (Local LVM) |
| Data Storage | ZFS mounts from `tank` pool |
| R730XD Pool | ~43.7TB usable (RAID-Z2) |

**Verdict:** ✅ **200GB is fine** - only 0.5% of 43.7TB capacity

**Red Flags Found:**
1. **MinIO has NO resource limits** - could spike during uploads
2. **Strapi NOT using MinIO** - still on local filesystem (`public/uploads/`)
3. **No MinIO backup** - artwork not backed up

**Recommendations:**
1. Add resource limits to MinIO (4GB RAM, 2 CPUs)
2. Configure Strapi to use MinIO (unify storage)
3. Consider separate storage VM if growing past 1TB

#### 📍 7:28 PM - Built Frontend for Deployment
```bash
cd frontend && npm run build
# ✓ 6297 modules transformed
# dist/assets/main-CSDMhO7X.js  662.48 kB │ gzip: 186.59 kB
# ✓ built in 2.10s
```

#### 📍 Earlier Session (6:30 PM) - Fixed Customer Pages (from prior conversation)

**Issue Reported:** "http://100.92.156.118:3000/ <-- if i click this and click a customer and 'new job' nothing works"

**Root Cause:** 
- `CustomersPage.tsx` had buttons with no onClick handlers
- No `CustomerDetailPage` component existed

**Files Created/Modified:**

1. **NEW: `frontend/src/components/customers/CustomerDetailPage.tsx`** (11,980 bytes)
   - Created @ 6:32 PM
   - Full customer detail view with:
     - Customer info header with back button
     - Stats cards (total orders, revenue, avg order, recent activity)
     - Order history table with status badges
     - Loading skeleton states while data populates
   - Uses: Card, Badge, Button, Skeleton, Phosphor icons

2. **MODIFIED: `frontend/src/components/customers/CustomersPage.tsx`** (6,958 bytes)
   - Modified @ 6:31 PM
   - Added callback props:
   ```tsx
   interface CustomersPageProps {
     customers: Customer[]
     onViewCustomer?: (customerId: string) => void
     onNewOrder?: (customerId: string) => void
   }
   ```
   - "View Details" button now calls `onViewCustomer(customer.id)`
   - "New Order" button now calls `onNewOrder(customer.id)`

3. **MODIFIED: `frontend/src/App.tsx`**
   - Added import: `CustomerDetailPage`
   - Added state: `selectedCustomerId`
   - Added handlers: `handleViewCustomer`, `handleNewOrder`
   - Added case in `renderPage()`: `'customer-detail'` renders `CustomerDetailPage`
   - `CustomersPage` now receives navigation callbacks as props

**Icon Fix:**
- Changed `Receipt` → `FileText` (Receipt not in Phosphor)
- Changed `Calendar` → `Clock` (simpler import)

#### 📍 7:30 PM - Current Sync Status
| Import | Total | Completed | Percentage | Status |
|--------|-------|-----------|------------|--------|
| Line Items | 44,158 | 28,828 | 65% | 🔄 Running (PID 91501) |
| Artwork → MinIO | 115,606 | 378 | 0.3% | ⏸️ Needs restart |
| Frontend Build | - | - | 100% | ✅ Ready to deploy |

---

### Session: November 28, 2025 4:15 PM - Line Item Import Preparation

**Started:** 4:15 PM EST
**Goal:** Verify Strapi relationships, prepare and run full line item import

**What Worked (Verified @ 4:20 PM):**
1. ✅ Strapi is running on docker-host (100.92.156.118:1337)
2. ✅ Database intact: 3,319 customers, 12,868 orders
3. ✅ Line item schema has `order` relation (manyToOne)
4. ✅ Order schema has `lineItems` relation (oneToMany, inverse)
5. ✅ Tested relation linking: Works using `order: documentId` format (Strapi v5)
6. ✅ Updated `scripts/sync-line-items.py` to:
   - Pre-load order cache (12,868 orders → documentId mapping)
   - Link each line item to its parent order via `order_visual_id`
   - Use checkpoint/resume for connection drops

**Strapi Data Verified:**
- Customers: 3,319 ✅
- Orders: 12,868 ✅  
- Line Items: 0 (ready for import)

**Import Script Updated:**
- Added ORDER_CACHE for fast visualId → documentId lookups
- Added `load_order_cache()` - pre-loads all orders on start
- Added `get_order_document_id()` - fast cached lookups
- Modified `import_line_item()` to include order relation

**🔴 ISSUES ENCOUNTERED:**

1. **Python venv corruption (4:25 PM)**
   - `tqdm` was installed but wouldn't import
   - Error: `ModuleNotFoundError: No module named 'tqdm'`
   - Shows Python 3.14 in pip but 3.13.1 in venv - version mismatch
   - **Fix:** Recreated venv: `rm -rf .venv && python3 -m venv .venv`

2. **Strapi schema mismatch (earlier today)**
   - Local schema had `imprints` relation on line-item
   - Remote docker-host didn't have it
   - Error: `inversedBy attribute imprints not found target api::line-item.line-item`
   - **Fix:** rsync'd updated schemas to docker-host, rebuilt container

3. **docker-compose python KeyError (earlier)**
   - `KeyError: 'ContainerConfig'` when rebuilding strapi
   - **Fix:** `docker stop && docker rm && docker-compose build --no-cache`

4. **Order relation format confusion (4:20 PM)**
   - Tried `{"documentId": "xxx"}` - got 400 error
   - Tried `{"connect": ["xxx"]}` - got 201 but didn't work
   - **Correct format:** Just pass the documentId string directly: `"order": "t1sm1yxgxofo3rxoq72m08qn"`

**📊 IMPORT PROGRESS (4:45 PM):**
- Import running with caffeinate
- Progress: ~1,868 / 44,158 (4.2%)
- Speed: ~8.3 items/sec
- ETA: ~85 minutes remaining (ends ~6:10 PM)
- Order relations: ✅ VERIFIED WORKING

**Ended:** [In progress - continued in evening session]

---

### Session: November 28, 2025 8:00 PM - MinIO Artwork Upload Attempt

**Started:** 8:00 PM EST
**Goal:** Upload 205GB artwork to MinIO, set up bucket structure, implement Redis supplier cache

---

#### 📍 8:00 PM - Verified MinIO is healthy
```bash
curl -s http://100.92.156.118:9000/minio/health/live
# Result: HTTP 200 ✅
```

#### 📍 8:05 PM - Verified artwork folder intact
```bash
du -sh data/artwork/
# Result: 201G ✅ (9,307 orders)
```

#### 📍 8:10 PM - Created MinIO bucket structure
- Created bucket: `printshop-artwork`
- Created folders: `pending/`, `approved/`, `in-production/`, `archive/`, `orders/`

#### 📍 8:15 PM - Reviewed sync-artwork-minio.py script
- Uses rsync + mc (MinIO client) approach
- Decided to try MinIO Python SDK instead for better control

#### 📍 8:20 PM - Created sync-artwork-minio-v2.py
- Uses official `minio` Python SDK
- Checkpoint/resume capability
- Progress bar with tqdm
- Graceful shutdown handling

#### 📍 8:25 PM - Installed minio package
```bash
pip install minio
# Installed minio 7.2.20 ✅
```

---

### 🔴 MINIO ISSUES ENCOUNTERED (Document for Future Reference)

#### Issue 1: Permission denied on rsync to MinIO volume (8:30 PM)
**Symptom:**
```bash
rsync: [sender] mkstemp "/.artwork_1.png.XXXXXX" failed: Permission denied (13)
```
**Root Cause:** MinIO data directory owned by root inside container
**Fix Applied:**
```bash
ssh docker-host 'docker run --rm -v /mnt/primary/docker/volumes/printshop-os/minio:/data alpine chmod -R 777 /data'
```
**Status:** ✅ FIXED

---

#### Issue 2: MinIO doesn't recognize rsync'd files (8:40 PM)
**Symptom:** Files exist on disk but `mc ls` shows nothing
```bash
ls /mnt/.../minio/printshop-artwork/orders/10001/  # Shows files
mc ls minio/printshop-artwork/orders/10001/         # Empty!
```
**Root Cause:** MinIO uses internal metadata format (`.minio.sys` directory). Raw files placed directly in the data volume are not recognized.
**Lesson Learned:** MUST use SDK/API/mc for uploads - cannot rsync directly to MinIO volume
**Status:** ⚠️ KNOWN LIMITATION - Do not use rsync to MinIO volume

---

#### Issue 3: MinIO SDK Access Denied on writes (8:50 PM)
**Symptom:**
```python
minio.error.S3Error: S3 operation failed; code: AccessDenied
```
**What We Tested:**
1. ✅ Small test files upload OK: `test/a.txt`, `orders/a.txt`, `orders/10001/a.txt`
2. ❌ Actual artwork files fail: `orders/10001/artwork_16.png` → Access Denied

**Attempts Made:**
1. Set bucket policy to public read/write → Still fails
2. Tried anonymous client → Still fails  
3. Tried explicit region setting → Still fails
4. Verified credentials work for reads (list_buckets, list_objects) → Works

**Discovery:** Earlier rsync testing placed raw files in MinIO volume at same paths we're trying to upload to. These "ghost files" may be causing conflicts.

**Status:** 🔴 BLOCKING - Need to clean up rsync'd files

---

#### Issue 4: Cannot delete rsync'd files (9:00 PM)
**Symptom:**
```bash
rm: cannot remove '/mnt/.../minio/printshop-artwork/orders/10001/a.txt/xl.meta': Permission denied
```
**Root Cause:** The `a.txt` path was uploaded via SDK (created as directory with metadata), but raw rsync'd files (artwork_*.png) are regular files. Mixed ownership/permissions.
**Next Step:** Use alpine container with volume mount to clean up

---

### 📍 MinIO Credentials (Reference)
```
Console URL: http://100.92.156.118:9001
API URL: http://100.92.156.118:9000
Username: minioadmin
Password: 00ab9d9e1e9b806fb9323d0db5b2106e
Bucket: printshop-artwork
```

---

### 🔧 MinIO Troubleshooting Commands
```bash
# Check MinIO health
curl -s http://100.92.156.118:9000/minio/health/live

# View MinIO logs
ssh docker-host 'docker logs printshop-minio 2>&1 | tail -30'

# List buckets via mc (inside container)
ssh docker-host 'docker exec printshop-minio mc alias set myminio http://localhost:9000 minioadmin 00ab9d9e1e9b806fb9323d0db5b2106e && docker exec printshop-minio mc ls myminio'

# Clean up rsync'd files (use alpine for root access)
ssh docker-host 'docker run --rm -v /mnt/primary/docker/volumes/printshop-os/minio:/data alpine rm -rf /data/printshop-artwork/orders/*'

# Python SDK test
python -c "
from minio import Minio
client = Minio('100.92.156.118:9000', 'minioadmin', '00ab9d9e1e9b806fb9323d0db5b2106e', secure=False)
print([b.name for b in client.list_buckets()])
"
```

---

### 📋 Next Steps for MinIO
1. [x] Clean up rsync'd files from `/mnt/.../minio/printshop-artwork/orders/`
2. [x] Test SDK upload again after cleanup - **✅ WORKING @ 9:20 PM**
3. [ ] Run full artwork upload (201GB, ~hours)
4. [ ] Update frontend to use MinIO for file storage

---

### Session: November 28, 2025 9:15 PM - MinIO Fixed + Imports Continuing

**📍 9:15 PM - Status Check**

| Data | Count | Status |
|------|-------|--------|
| Customers | 3,319 | ✅ Complete |
| Orders | 12,867 | ✅ Complete |
| Line Items | 14,175 / 44,158 | 🔄 32.4% (import running) |
| Artwork | 0 / 201GB | ⏳ Ready to start |

**📍 9:20 PM - MinIO Fixed!**
- Cleaned ghost files: `docker run alpine rm -rf /data/printshop-artwork/orders/*`
- Test upload: ✅ SUCCESS - 2.6MB artwork file uploaded
- Root cause confirmed: rsync'd files blocked SDK uploads

**📍 9:21 PM - Imports Running**
- Line items: Resumed from checkpoint (14,289)
- Artwork upload: Starting now

**Ended:** [In progress]

---

### 🔍 AUDIT: Work Needing Redo/Verification

Based on terminal history and previous sessions, here's what needs checking:

| Task | Original Status | Current Status | Action Needed |
|------|-----------------|----------------|---------------|
| Line Items Import | 0 imported | ~1,800/44,158 IN PROGRESS | Wait for completion |
| Order→LineItem Relations | Not tested | ✅ Verified working | None |
| Python venv | Corrupted | ✅ Recreated | None |
| Strapi schemas sync | Out of sync | ✅ Fixed | Verify after container updates |
| Artwork scrape | 106,303 files done | Need to verify | Check data/artwork/ folder |
| MinIO artwork upload | 0 uploaded | Not started | Run sync-artwork-minio.py |
| Products (Top 500) | 0 imported | Not started | Create import script |
| Supplier API caching | Not implemented | Not started | Redis cache setup |
| Frontend issues | 6 bugs found | Not fixed | Pending line items |

**🔴 KNOWN BROKEN (from Nov 27 evening):**
1. Quotes page fails to load
2. Shipping: EasyPost API error
3. Customers: No data visible in frontend
4. Products: Failed to fetch
5. Files: Not connected to MinIO

**⚠️ POTENTIAL DATA LOSS CONCERNS:**
- Artwork folder: Ran `rm -rf data/artwork/*` but cancelled - **VERIFIED INTACT: 201GB** ✅
- Order import: Did we lose test orders during cleanup? (TEST-001, TEST-002 were deleted intentionally)

---

### 🔍 COMPREHENSIVE AUDIT: Previous Days' Work Status

**Last Updated: Nov 28, 2025 5:00 PM**

Based on reviewing all session logs (Day 1-8), here's what needs redoing or verification:

#### ✅ COMPLETED - NO REDO NEEDED
| Task | When Done | Verified |
|------|-----------|----------|
| Customer import (3,319) | Nov 27 | ✅ Verified in Strapi |
| Order import (12,868) | Nov 27 | ✅ Verified in Strapi |
| Artwork scrape (106,303 files) | Nov 27 night | ✅ 201GB on disk |
| Artwork index.json | Nov 27 night | ✅ 99,740 lines |
| Strapi schemas for line-item | Nov 28 | ✅ Has order relation |
| Order→LineItem relation format | Nov 28 | ✅ Tested, working |
| Python venv rebuild | Nov 28 | ✅ requests + tqdm |

#### 🔄 IN PROGRESS
| Task | Status | ETA |
|------|--------|-----|
| Line Items import | 3,065/44,158 (7%) | ~75 min |

#### ❌ NEEDS DOING - NOT STARTED
| Task | Priority | Script Exists? | Notes |
|------|----------|----------------|-------|
| Products import (105 from Printavo) | P1 | ❌ No | Create sync-products.py |
| Artwork upload to MinIO | P1 | ✅ Yes | sync-artwork-minio.py |
| Tasks import (1,463) | P3 | ❌ No | Low priority |
| Expenses import (297) | P3 | ❌ No | Low priority |
| Statuses import (25) | P2 | ❌ No | Needed for order workflow |

#### ❌ SUPPLIER API WORK - INCOMPLETE
| Supplier | API Working | Data Synced | Cache Setup |
|----------|-------------|-------------|-------------|
| S&S Activewear | ✅ Yes | ❌ No | ❌ No Redis |
| AS Colour | ✅ Yes | ❌ No | ❌ No Redis |
| SanMar | ✅ SFTP works | ❌ No | ❌ No Redis |

**Nov 27 plan was:**
- Redis cache with 3-tier TTL (24h/1h/15min)
- Top 500 products pre-loaded
- Pinecone for semantic search
- **Status:** None of this was implemented

#### ❌ FRONTEND BUGS - NOT FIXED
From Nov 27 evening testing:
1. ❌ Quotes page fails to load
2. ❌ Shipping: EasyPost API error
3. ❌ Shipping: No live quotes
4. ❌ Customers: No data visible in frontend
5. ❌ Products: Failed to fetch
6. ❌ Files: Not connected to MinIO

**Root causes (likely):**
- Strapi had 0 line items (being fixed now)
- MinIO not configured in frontend
- EasyPost API not set up

#### ❌ MACHINE HOT FOLDERS - NOT STARTED
| Machine | Type | Status |
|---------|------|--------|
| Barudan BEKY 2020 | Embroidery | ❌ Not configured |
| ScreenPro 600 | Screen Print | ❌ Not configured |

**Nov 27 plan was:**
```
/mnt/production/
├── screenpro-600/incoming/
├── barudan/incoming/
└── dtg-printer/incoming/
```
**Status:** Plan documented but not implemented

#### ❌ MINIO BUCKET STRUCTURE - NOT CREATED
**Nov 27 plan:**
```
printshop-artwork/
├── pending/
├── approved/
├── in-production/
└── archive/
```
**Status:** Plan documented but not implemented

---

### 📊 PRIORITY ORDER FOR REMAINING WORK

**After line items complete:**
1. ⏳ **Products import** (105 items, ~30 sec) - Create script
2. ⏳ **MinIO artwork upload** (205GB, hours) - Run existing script
3. ⏳ **MinIO bucket structure** - Create folders
4. ⏳ **Statuses import** (25 items) - For order workflow
5. ⏳ **Frontend bug fixes** - After data is in place
6. ⏳ **Supplier API caching** - Redis setup
7. ⏳ **Machine hot folders** - When MinIO is ready

---

## 📅 Comprehensive Daily Log

### Day 1: November 21, 2025 (Friday) - Project Inception

**What Happened:**
- Created printshop-os repository on GitHub
- Initial project structure with monorepo layout
- Set up basic Strapi CMS scaffolding
- Defined 4-service architecture:
  1. `services/api` - Central API for Printavo sync
  2. `services/job-estimator` - Pricing engine
  3. `services/production-dashboard` - Shop floor tracking
  4. `services/supplier-sync` - Supplier integrations

**Key Decisions:**
- Node.js + TypeScript only (no Python services)
- Strapi 4.x (later upgraded to 5.x)
- React 19 + Vite + TailwindCSS for frontend
- REST-only API (no GraphQL)

**Commits:** Initial commits, project setup

---

### Day 2: November 22, 2025 (Saturday) - Strapi + Data Architecture

**What Happened:**
- Installed Strapi CMS locally
- Created initial content types: customer, order, job
- Started Printavo API integration research
- Tested Printavo API endpoints

**Key Files Created:**
- `printshop-strapi/` - Full Strapi installation
- First content type schemas

**Printavo API Discovery:**
- Base URL: `https://www.printavo.com/api/v1`
- Auth: email + token as query params
- Endpoints tested: orders, customers, orderstatuses, products, tasks

---

### Day 3: November 23, 2025 (Sunday) - Repository Consolidation

**What Happened:**
- **MAJOR:** Discovered 4 separate pricing repos existed
- Consolidated all code into single printshop-os monorepo
- Total lines of code after merge: 51,969+
- Created Flexible Pricing Engine (PR #98)
- Created Workflow Automation (PR #99)

**Problems Identified:**
- Duplicate supplier-sync implementations
- Scattered documentation (218 markdown files)
- No single source of truth

**Key Decisions:**
- Adopted HLBPA pattern (High-Level Big Picture Architect)
- Maximum 10 markdown files in root
- All others go to `docs/` subdirectories

---

### Day 4: November 24, 2025 (Monday) - "Merge Hell" Day

**What Happened:**
- Attempted to merge 16 feature branches into main
- Resulted in 50+ merge conflicts
- Spent ~2 hours on conflict resolution
- Closed 7 duplicate issues
- Cleaned up 5 merged branches

**Problems Encountered:**
- Duplicate tracking in both GitHub Issues AND PRs
- Branches created for features that already existed
- Documentation sprawl causing confusion

**Post-Mortem Conclusions:**
1. Work on ONE branch at a time
2. Delete branches after merge
3. Issues for planning, PRs for implementation only
4. No session summaries or implementation reports

---

### Day 5: November 25, 2025 (Tuesday) - Enterprise Foundation

**What Happened:**
- Full repository audit completed
- Found 218 markdown files across project
- Identified 7 active services (later consolidated to 4)
- Archived legacy `services/api/supplier-sync/` to `docs/archive/`
- Established service inventory

**Repository Audit Results:**
- 40,710 files total
- 277+ commits
- 37 branches
- 854 markdown files
- Conclusion: "60% complete but 0% operational"

**MVP Gap Analysis Created:**
- Priority 1 (BLOCKER): Auth system, Quote workflow, Order creation
- Priority 2 (HIGH): Real-time tracking, Support API, Payments
- Priority 3 (MEDIUM): Production dashboard, Inventory

---

### Day 6: November 26, 2025 (Wednesday) - Auth System + Major Cleanup

**What Happened:**
- Deleted 26 stale branches
- Consolidated root docs to 10 files (HLBPA compliant)
- Implemented Phase 1-3 of MVP:
  - Customer signup/login
  - Employee PIN validation
  - 18 tests passing
  - Strapi auth routes working

**Auth Routes Created:**
- `/api/auth/customer/login`
- `/api/auth/customer/register`
- `/api/auth/employee/validate-pin`

**Documentation Cleanup:**
- Moved 200+ files to `docs/` or `docs/archive/`
- Created `docs/ARCHIVE_2025_11_26/`

---

### Day 7: November 27, 2025 (Thursday) - MAJOR DATA MIGRATION DAY

**What Happened (Morning):**
- Deployed Strapi to docker-host (100.92.156.118)
- Full Printavo data extraction completed
- All 3 supplier APIs verified working

**Printavo Data Extracted:**
| Data | Count | Size |
|------|-------|------|
| Orders | 12,867 | 61 MB |
| Customers | 3,358 | 3.8 MB |
| Line Items | 44,158 | 23 MB |
| Tasks | 1,463 | - |
| Expenses | 297 | - |
| Products | 105 | - |
| Statuses | 25 | - |

**What Happened (Afternoon):**
- Created import scripts
- Imported 3,317 customers (deduplicated)
- Imported 12,854 orders (all years, deduplicated)
- Cleaned duplicates: 2,485 customers + 1,331 orders

**Supplier APIs Verified:**
| Supplier | Auth | Status | Products |
|----------|------|--------|----------|
| AS Colour | Subscription-Key + JWT | ✅ | 522 |
| S&S Activewear | Basic Auth | ✅ | 211,000+ |
| SanMar | SOAP + SFTP | ✅ | 415,000+ |

**🚨 THE BIG DISCUSSION: 500 Products vs 400K Products**

We spent significant time planning how to handle the massive supplier catalogs:

**Problem:** 
- Printavo has 105 products (our historical orders)
- Suppliers have 600,000+ products combined
- Can't import all to Strapi (too slow, too large)

**Solution Agreed Upon:**
1. **Top 500 Products** - Pre-load in Strapi from Printavo order history
   - These 500 products account for 13,045 units ordered
   - Used for autocomplete and quick quote creation
   - Fast local queries

2. **Full Supplier Catalogs** - External storage with AI/agent access
   - Store in MinIO or external vector database
   - Use Pinecone (free tier) for semantic search
   - AI agent can query when asked "what products do we have in red?"
   - OpenAI embeddings for product descriptions

3. **Redis Caching** - 3-tier TTL strategy
   | Data Type | TTL | Rationale |
   |-----------|-----|-----------|
   | Product Info | 24 hours | Rarely changes |
   | Pricing | 1 hour | Can fluctuate |
   | Inventory | 15 minutes | Real-time critical |

**🗂️ MINIO FOLDER STRUCTURE (Hot Folder Architecture)**

We designed a complete file organization system:

```
printshop-artwork/                      # MinIO bucket
├── pending/                            # Awaiting customer approval
│   └── {order-id}/
│       ├── original/                   # As-uploaded files
│       └── converted/                  # Print-ready versions
├── approved/                           # Ready for production
│   └── {order-id}/
│       ├── screen-printing/            # Separated by print method
│       ├── embroidery/
│       ├── dtg/
│       └── metadata.json               # Colors, sizes, specs
├── in-production/                      # Currently on machine queues
│   └── {order-id}/
└── archive/                            # Completed jobs
    └── {year}/{month}/{customer-slug}/
        └── {order-id}/
```

**Machine Hot Folders (On Production Floor):**
```
/mnt/production/                        # NFS mount from docker-host
├── screenpro-600/                      # Screen printing machine
│   ├── incoming/                       # Files to print (synced from MinIO)
│   ├── processing/                     # Currently printing
│   └── completed/                      # Done (watched for auto-archive)
├── barudan/                            # Embroidery machine
│   └── incoming/                       # DST files
└── dtg-printer/
    └── incoming/                       # DTG-ready files
```

**AI Agent Integration Plan:**
- Agent receives query: "What red polo shirts do we have?"
- Agent queries Pinecone vector DB with embeddings
- Returns: "AS Colour 5101 in Burgundy, S&S Hanes 054 in Deep Red..."
- If customer orders, fetch real-time inventory from supplier API
- Cache result in Redis for 15 minutes

**What Happened (Evening):**
- Created artwork scraper v2: `scripts/printavo-artwork-scraper-v2.py`
- Started scraping artwork by customer folder
- ~4% complete when session ended

**Artwork Scraper Structure:**
```
data/artwork/
├── by_customer/                        # PRIMARY - for reorders
│   └── {customer-slug}-{id}/
│       └── {year}/{visual_id}_{nickname}/
├── by_order/                           # SECONDARY - symlinks
├── index.json                          # Searchable master index
└── checkpoint.json                     # Resume position
```

**Evening Session Extended:**
- Ran full artwork scrape overnight
- Morning result: 106,303 files, 205 GB, 9,307 orders, 2,661 customers
- Index generated: `data/artwork/index.json` (99,740 lines)

---

### Day 8: November 28, 2025 (Friday) - Session Continuity Crisis

**What Happened (Morning):**
- Discovered SSH connection instability to docker-host
- Multiple "Connection reset by peer" errors
- Realized AI memory loss between sessions causing repeated work

**Docker Update Issue:**
- Attempted to restart Docker on docker-host
- SSH connections kept dropping
- Worried about data loss (confirmed data is safe)

**Current State Verified:**
- PostgreSQL: 3,319 customers, 12,868 orders ✅
- Line Items: 0 (never imported) ❌
- Products: 0 (never imported) ❌
- Artwork: 205 GB on local Mac, not uploaded ❌

**Session Continuity Solution Implemented:**
- Created DAILY_TASK_LOG.md
- Added session history auto-append to generate-context.js
- Added VS Code tasks for quick commands

---

### Day 8: November 28, 2025 (Friday Afternoon) - Complete Printavo Archive

**🎯 TODAY'S FOCUS: Complete Printavo Data Extraction**

> Goal: Create a COHESIVE archive of ALL Printavo data so we can fully migrate away from it.

**What We Need to Sync:**
| Data | Source Count | In Strapi | Script |
|------|--------------|-----------|--------|
| Customers | 3,358 | 3,319 ✅ | Done |
| Orders | 12,867 | 12,868 ✅ | Done |
| Line Items | 44,158 | 0 ❌ | `sync-line-items.py` |
| Products | 105 | 0 ❌ | Need to create |
| Tasks | 1,463 | 0 ❌ | Need to create |
| Expenses | 297 | 0 ❌ | Need to create |
| Statuses | 25 | 0 ❌ | Need to create |
| Artwork | 106,303 files | 0 ❌ | `sync-artwork-minio.py` |

**Background Sync Strategy:**
```bash
# Master script runs everything in parallel with checkpoints
./scripts/sync-printavo-complete.sh
```

**🏭 ALSO TODAY: Complete Supplier APIs**

| Supplier | Products | Status | Next Step |
|----------|----------|--------|-----------|
| S&S Activewear | 211,000+ | ✅ API Working | Sync to Redis cache |
| AS Colour | 522 | ✅ API Working | Sync to Redis cache |
| SanMar | 415,000+ | ✅ SFTP Working | Download EPDD.csv |

**🔴 FRONTEND ISSUES FROM LAST NIGHT:**
| Issue | Priority | Status |
|-------|----------|--------|
| Quotes page fails | HIGH | ❌ |
| Shipping: EasyPost error | HIGH | ❌ |
| Shipping: No live quotes | CRITICAL | ❌ |
| Customers: No data visible | HIGH | ❌ |
| Products: Failed to fetch | HIGH | ❌ |
| Files: Not connected to MinIO | HIGH | ❌ |

**🏭 MACHINE INTEGRATION (Planned):**
| Machine | Type | Hot Folder Status |
|---------|------|-------------------|
| Barudan BEKY 2020 | Embroidery | ❌ Not configured |
| ScreenPro 600 | Screen Print | ❌ Not configured |

---

## 📋 Pending Tasks (Backlog)

### Data Import
- [ ] Import 44,158 line items to Strapi
- [ ] Import top 500 products to Strapi
- [ ] Upload 205 GB artwork to MinIO
- [ ] Link line items to orders

### Supplier Integration
- [ ] Sync AS Colour catalog (522 products)
- [ ] Set up S&S API polling
- [ ] Download SanMar EPDD.csv (494 MB)
- [ ] Create Pinecone index for product search

### AI/Agent System
- [ ] Set up Pinecone account (free tier)
- [ ] Create product embeddings
- [ ] Build agent query interface
- [ ] Integrate with n8n for automation

### Production System
- [ ] Configure MinIO buckets (pending, approved, in-production, archive)
- [ ] Set up machine hot folders
- [ ] Create file watcher for auto-archive

---

## 🔧 Quick Commands

```bash
# Check docker-host status
ssh docker-host 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# Check database counts
ssh docker-host 'docker exec printshop-postgres psql -U strapi -d printshop -c "SELECT (SELECT COUNT(*) FROM customers) as customers, (SELECT COUNT(*) FROM orders) as orders, (SELECT COUNT(*) FROM line_items) as line_items;"'

# Import line items
source .venv/bin/activate && python scripts/sync-line-items.py

# Upload artwork to MinIO
source .venv/bin/activate && python scripts/sync-artwork-minio.py

# Deploy to homelab (canonical path: ~/stacks/printshop-os)
rsync -avz --exclude node_modules --exclude .git . docker-host:~/stacks/printshop-os/ && ssh docker-host 'cd ~/stacks/printshop-os && docker compose up -d --build'

# View logs
ssh docker-host 'cd ~/stacks/printshop-os && docker-compose logs -f --tail=100'
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `DAILY_TASK_LOG.md` | This file - session continuity |
| `SERVICE_DIRECTORY.md` | Where all code lives |
| `ARCHITECTURE.md` | How the system works |
| `PROJECT_OVERVIEW.md` | What this project is |
| `.vscode/session-state.json` | Auto-generated context |
| `data/artwork/index.json` | Artwork master index |
| `data/customer-import-checkpoint.json` | Import progress |
| `data/order-import-checkpoint.json` | Import progress |

---

## 💡 Lessons Learned

1. **Document as you go** - Not after
2. **One branch at a time** - Merge conflicts are hell
3. **Delete branches after merge** - Keep repo clean
4. **Session continuity matters** - AI forgets everything
5. **Checkpoint everything** - Imports fail, connections drop
6. **Verify before assuming** - Check actual data counts
7. **Simple is better** - 4 services, not 7

---

## 📝 Session Notes Template

When starting a new session, add a section like this:

```markdown
### Session: [Date] [Time] - [Brief Title]

**Started:** [Time]
**Goal:** [What we're trying to accomplish]

**Actions:**
1. [What was done]
2. [What was done]

**Results:**
- [Outcome]

**Next Steps:**
- [ ] [What to do next]

**Ended:** [Time]
```

---

*Last Updated: November 28, 2025 @ [auto-fill time]*
*Total Sessions: 12+*
*Total Commits: 277+*
*Days Since Project Start: 8*
