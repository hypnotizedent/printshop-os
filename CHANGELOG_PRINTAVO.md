# Printavo Extraction Changelog

## 2025-12-04 - Major Cleanup and Authentication Fix

### CLEANUP: Removed All Python v1 Extraction Scripts
**Problem**: Multiple conflicting extraction scripts caused confusion and wasted time.

**Removed Files**:
- ❌ `scripts/printavo-complete-extraction.py` (v1 REST API, incomplete data)
- ❌ `scripts/printavo-full-extraction.py` (v1 REST API, incomplete data)
- ❌ `scripts/printavo-extract-all.py` (v1 REST API, incomplete data)
- ❌ `scripts/printavo-artwork-scraper-v2.py` (web scraping, unreliable)
- ❌ `scripts/lib/printavo_api.py`
- ❌ `scripts/lib/printavo_scraper.py`
- ❌ `scripts/lib/minio_uploader.py`
- ❌ `scripts/lib/file_detector.py`
- ❌ `lib/ptavo/` (empty directory)

**Reason**: These scripts used the deprecated v1 REST API and provided incomplete data extraction. They are superseded by the TypeScript v2 GraphQL extraction.

### FIX: Authentication Changed from /auth Endpoint to Header-Based Token

**Problem**: The extraction script tried to authenticate via `POST /auth` endpoint, which doesn't exist in Printavo V2 API, resulting in 404 errors.

**Old (Broken) Method**:
```typescript
const response = await axios.post(`${this.config.apiUrl}/auth`, {
  email: this.config.email,
  password: this.config.password,
});
// Then use bearer token from response
```

**New (Working) Method**:
```typescript
// Printavo V2 uses header auth on every request
this.client = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'email': config.email,
    'token': config.token,  // API token, not password
  },
});
```

**Changes Made**:
- `services/api/scripts/extract-printavo-v2-complete.ts`:
  - Removed `authenticate()` method entirely
  - Added headers to axios client constructor
  - Removed `bearerToken` property
- `services/api/lib/printavo-v2-types.ts`:
  - Changed `password: string` to `token: string`
  - Added comment about getting token from Printavo

### FIX: Dockerfile Now Includes scripts/ Directory

**Problem**: Scripts directory was not copied to Docker container, causing "file not found" errors when running extraction commands.

**Changes Made**:
- `services/api/Dockerfile`:
  - Added `COPY scripts/ ./scripts/` to build stage
  - Scripts are now available in production container

### FIX: ts-node and typescript Moved to Production Dependencies

**Problem**: The extraction scripts require `ts-node` to run TypeScript files directly, but it was in devDependencies, so it wasn't available in the production Docker container.

**Changes Made**:
- `services/api/package.json`:
  - Moved `ts-node` from devDependencies to dependencies
  - Moved `typescript` from devDependencies to dependencies
  - This ensures scripts can be executed with `npm run` commands in Docker

### DOC: Created Single Source of Truth Guide

**New Documentation**:
- `docs/PRINTAVO_EXTRACTION_GUIDE.md` - Complete guide with:
  - Quick start commands
  - Authentication explanation
  - Troubleshooting section
  - Technical details
  - Output structure

**Updated Documentation**:
- `docs/PRINTAVO_EXTRACTION.md` - Now redirects to new guide
- `docs/SERVICE_DIRECTORY.md` - Added clear Printavo extraction section
- `services/api/.env.example` - Updated with TOKEN instead of PASSWORD

**Archived Documentation**:
- `docs/implementation/PRINTAVO_EXTRACTION_IMPLEMENTATION.md` → archived
- `docs/implementation/PRINTAVO_V2_SCHEMA_REFERENCE.md` → archived
- Location: `docs/archive/2025-12-04-printavo-cleanup/`

### Updated Environment Variables

**Old (Broken)**:
```bash
PRINTAVO_EMAIL=your_email@example.com
PRINTAVO_PASSWORD=your_password_here
```

**New (Working)**:
```bash
# Printavo V2 GraphQL API
# Get your API token from: Printavo → My Account → API Key
PRINTAVO_EMAIL=your_email@example.com
PRINTAVO_TOKEN=your_api_token_here
PRINTAVO_API_URL=https://www.printavo.com/api/v2
PRINTAVO_RATE_LIMIT_MS=500
```

---

## Previous Issues (Resolved)

### 404 Error on Authentication (FIXED 2025-12-04)
- **Issue**: Script tried to POST to `/auth` endpoint which doesn't exist
- **Solution**: Use header-based authentication (email + token headers)

### Scripts Not Found in Docker Container (FIXED 2025-12-04)
- **Issue**: Dockerfile didn't copy scripts/ directory
- **Solution**: Added `COPY scripts/ ./scripts/` to Dockerfile

### Confusion Between v1 and v2 APIs (FIXED 2025-12-04)
- **Issue**: Multiple Python scripts using different API versions
- **Solution**: Removed all Python scripts, use only TypeScript v2

### Multiple Conflicting Extraction Scripts (FIXED 2025-12-04)
- **Issue**: 8+ different extraction scripts with overlapping functionality
- **Solution**: Single source of truth: `services/api/scripts/extract-printavo-v2-complete.ts`

---

## Verification Checklist

After this cleanup:
- ✅ Only ONE extraction system exists (TypeScript v2 GraphQL)
- ✅ `docker compose exec api npm run printavo:extract-complete` works
- ✅ Documentation points to single guide
- ✅ No Python Printavo scripts remain
- ✅ Credentials use TOKEN not PASSWORD
- ✅ Dockerfile includes scripts/
- ✅ ts-node available in production container

---

<small>Generated by PrintShop OS | December 2025</small>
