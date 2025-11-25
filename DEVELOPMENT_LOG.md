# Development Log

## 2025-11-25

### Supplier Integrations – SanMar & AS Colour

#### SanMar Integration ✅ (SFTP-Based)
- Discovered actual integration method uses SFTP + large CSV/TXT files (not REST).
- Credentials verified (Account/Username: 180164). Successful SFTP connection to `ftp.sanmar.com:2200`.
- Listed 16 files in `/SanMarPDD` including:
  - `SanMar_EPDD.csv` (≈495MB) – Enhanced product & inventory data (daily)
  - `sanmar_dip.txt` (≈170MB) – Hourly inventory updates
  - `SanMar_SDL_N.csv` (≈181MB) – Alternate product data
- Implemented:
  - `sanmar-sftp.client.ts` (download, list, parse CSV)
  - `sanmar-csv.transformer.ts` (EPDD, SDL_N, DIP transformers + inventory merge)
  - Documentation: `SANMAR_INTEGRATION.md`, `SANMAR_IMPLEMENTATION_SUMMARY.md` updated with best practices, file schedule, performance profile.
- Added resilient file detection (prefers `.csv` over zipped archives).
- Confirmed partial download of `SanMar_EPDD.csv` (large file strategy: stream + batch transform planned).
- Next for SanMar: implement streaming parser & incremental persistence; optional SOAP/WSDL client is low priority.

#### AS Colour Integration 🚧 STARTED
- Received API key: `1c27d1d97d234616923e7f8f275c66d1` (to be stored in `.env`).
- Created task plan to implement:
  - Environment variables (`ASCOLOUR_API_KEY`, `ASCOLOUR_BASE_URL`).
  - API client (`as-colour.client.ts`) – fetch all products, single product, search, derived categories, health check.
  - Transformer (`as-colour.transformer.ts`) mapping `ASColourProduct` → `UnifiedProduct` (variant generation from `stock`, color enrichment from `colours.swatch`).
  - CLI sync script (`sync-as-colour.ts`).
  - Documentation (`ASCOLOUR_INTEGRATION.md`).
- Pending: Implementation & build verification.

#### Rationale / Decisions
- Chose SFTP ingestion for SanMar due to scale (hundreds MB) & completeness vs API cost/perf.
- Deferred SOAP client until a specific real-time product endpoint need arises.
- Will treat large SanMar CSV parsing as streaming to avoid memory pressure once full file downloaded.
- AS Colour integration will follow lightweight REST approach (assuming standard JSON endpoints per provided guide; placeholders documented until endpoint confirmation).

#### Risks / Mitigations
- Large file (≈495MB) parsing: plan to implement line-stream & periodic flush to storage/Redis.
- Inventory freshness: DIP hourly file strategy logged; cron scheduling needed.
- Unknown AS Colour endpoint specifics: will abstract base URL + endpoints, refine after documentation review.

#### Next Actions
1. Finish AS Colour client + transformer.
2. Add CLI + package.json scripts, run build.
3. Implement SanMar streaming parser (optional after AS Colour).
4. Add cron/job scheduling for DIP hourly updates.

---

## 2025-11-22

### Phase 1 - Strapi Backend Setup ✅ COMPLETED

#### Environment Verification ✅
- ✅ Node.js v24.10.0 (meets requirement: 18+)
- ✅ npm 11.6.2
- ✅ GitHub CLI authenticated
- ✅ Docker Desktop v29.0.1 (installed via Homebrew)

#### Strapi Installation ✅
- Completed: Strapi v5.31.2 installation
- Method: `npx create-strapi-app@latest printshop-strapi --quickstart`
- Status: **Running successfully!** 🎉
- URL: http://localhost:1337/admin
- Location: `/Users/ronnyworks/Projects/printshop-os/printshop-strapi`
- Database: SQLite (`.tmp/data.db`)
- Edition: Enterprise (30-day trial included)
- Admin Account: Created and configured

#### Collection Types ✅
- ✅ **Customer** (name: string, email: email)
- ✅ **Job** (title: string, description: richtext)
- ✅ **Employee** (name: string, position: string, hireDate: date)
- ✅ **TimeClockEntry** (employee: relation, clockIn: datetime, clockOut: datetime)

#### API Configuration ✅
- ✅ API permissions configured (Public role access enabled)
- ✅ Endpoints verified:
  - GET/POST http://localhost:1337/api/customers
  - GET/POST http://localhost:1337/api/jobs
  - GET/POST http://localhost:1337/api/employees
  - GET/POST http://localhost:1337/api/time-clock-entries

#### Test Data ✅
- ✅ Test customers created: "Acme Printing Co", "Best Print Shop", "ron"
- ✅ API responses validated with curl
- ✅ 9 total customer records in database

---

### Phase 2 - Appsmith Dashboard 🚧 IN PROGRESS

#### Docker Environment Setup ✅
- ✅ Docker Desktop installed (v29.0.1)
- ✅ `docker-compose.local.yml` created
- ✅ MongoDB v6 with replica set (rs0) configured
- ✅ Redis v7-alpine for caching
- ✅ MongoDB keyFile authentication configured
- ✅ All containers running: `printshop-appsmith`, `printshop-mongo`, `printshop-redis`

#### Appsmith Installation ✅
- ✅ Appsmith CE v1.92 running at http://localhost:8080
- ✅ Account created and logged in
- ✅ Workspace configured

#### Strapi API Connection ✅
- ✅ Connected via `host.docker.internal:1337`
- ✅ Bypassed APPSMITH_ALLOWED_FRAME_ANCESTORS restriction using direct API queries
- ✅ Test query `getCustomers` working successfully

#### Customer Management UI ✅
- ✅ Page created: `Customer_Management`
- ✅ Table widget displaying customer data
- ✅ Query `getCustomers`: GET http://host.docker.internal:1337/api/customers
- ✅ Query `POST_customers`: POST http://host.docker.internal:1337/api/customers
- ✅ Modal with form inputs: `nameInput`, `emailInput`
- ✅ Create customer functionality **WORKING**
- ✅ Successfully tested: Created customer "ron" / "hon@aol.com"
- 🚧 Edit customer functionality (pending)
- 🚧 Delete customer functionality (pending)

### Progress Summary
- **Phase 1**: ✅ **COMPLETE** - Strapi backend fully operational with 4 collection types and working APIs
- **Phase 2**: 🚧 **IN PROGRESS** - Appsmith installed, connected to Strapi, basic customer CRUD (Create + Read) working
- **Phase 3**: ⏳ Not started

### Technical Stack Confirmed
```
Backend:     Strapi v5.31.2 (localhost:1337) → SQLite
Dashboard:   Appsmith CE v1.92 (localhost:8080) → MongoDB + Redis
Connection:  host.docker.internal for container-to-host communication
Data Flow:   Appsmith → Strapi API → SQLite → Response → Appsmith UI
```

### Blockers/Issues Resolved
- ✅ Strapi v5 API permissions (fixed: use Content-Type Builder UI)
- ✅ Docker not installed (fixed: installed via Homebrew)
- ✅ MongoDB replica set initialization (fixed: manual `rs.initiate()`)
- ✅ Appsmith host.docker.internal blocked (fixed: direct API queries)
- ✅ Widget naming mismatch (fixed: renamed `nameIInput` → `nameInput`)

### Next Steps
1. ✅ Customer Create functionality working
2. 🚧 Add Edit customer feature (UPDATE endpoint)
3. 🚧 Add Delete customer feature (DELETE endpoint)
4. ⏳ Create Job management page
5. ⏳ Create Employee management page
6. ⏳ Create Time Clock Entry management page
7. ⏳ Connect Git to Appsmith workspace for version control

### Notes
- Using SQLite for Strapi (easy development, will migrate to PostgreSQL in production)
- Appsmith data stored in Docker volumes (consider export/backup strategy)
- MongoDB replica set required for Appsmith (rs0 initialized)
- Phase 1 & 2 integration validated: Data flows successfully between systems
- Customer management proves the pattern - can replicate for Job, Employee, Time Clock Entry
