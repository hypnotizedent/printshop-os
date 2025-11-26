# 🚀 Quick Start: Synchronization Action Plan

**Created:** November 26, 2025  
**Purpose:** Immediate actions to resolve documentation conflicts  
**Time Required:** 2-3 hours

---

## ⚡ Critical Issues (Do These First)

### Issue #1: Port Assignment Conflicts 🚨

**Problem:**
- docker-compose.yml defines ports 1337, 3000, 3001, 5432, 6379, 8080, 27017
- ARCHITECTURE_OVERVIEW.md mentions ports 1337, 3000, 3001, 3002, 3003
- Port 3002 and 3003 not defined in docker-compose.yml
- ARCHITECTURE.md has no port references at all

**Impact:** Developers can't connect to services, confusion about what runs where

**Fix (30 minutes):**

1. **Check actual running services:**
   ```bash
   lsof -i :3000-3005
   docker-compose ps
   ```

2. **Define standard port mapping** (copy this table to a file):
   ```
   Port | Service                  | Status
   -----|--------------------------|--------
   1337 | Strapi CMS              | ✅ Defined
   3000 | Frontend                | ✅ Defined  
   3001 | Production Dashboard    | ✅ Defined (as pricing-engine)
   3002 | Pricing/Job Estimator   | ❓ Missing in docker-compose
   3003 | Customer Service AI     | ❓ Missing in docker-compose
   5432 | PostgreSQL              | ✅ Defined
   6379 | Redis                   | ✅ Defined
   8080 | Appsmith                | ✅ Defined
   27017| MongoDB                 | ✅ Defined
   ```

3. **Update docker-compose.yml:**
   - Add missing services (ports 3002, 3003) OR
   - Update ARCHITECTURE_OVERVIEW.md to reflect actual ports

4. **Update all documentation:**
   - ARCHITECTURE_OVERVIEW.md Component Architecture section
   - ARCHITECTURE.md Core Services section (add port table)

**Verification:**
```bash
./scripts/validate-docs.sh
```

---

### Issue #2: Missing Service Documentation 🚨

**Problem:**
Services exist but aren't documented:
- `services/api/` ❌ Not in ARCHITECTURE_OVERVIEW.md
- `services/metadata-extraction/` ❌ Not in ARCHITECTURE_OVERVIEW.md  
- `services/pricing/` ❌ Not in ARCHITECTURE_OVERVIEW.md

**Impact:** New developers don't know these services exist, may duplicate functionality

**Fix (1 hour):**

1. **Investigate each service:**
   ```bash
   # Check what each service does
   cat services/api/README.md
   cat services/metadata-extraction/README.md
   cat services/pricing/README.md
   
   # Check if they're active
   ls -la services/api/
   ls -la services/metadata-extraction/
   ls -la services/pricing/
   ```

2. **For each active service, add to ARCHITECTURE_OVERVIEW.md:**
   
   Find the "Component Architecture" section and add entries like:
   
   ```markdown
   ### 7. API Gateway Service
   
   **Location:** `services/api/`  
   **Port:** TBD  
   **Purpose:** [Describe purpose]
   
   **Key Interfaces:**
   - REST endpoints: [List main endpoints]
   - Dependencies: [What it depends on]
   
   **Responsibilities:**
   - [Main responsibility 1]
   - [Main responsibility 2]
   ```

3. **Update SERVICE_DIRECTORY.md** with complete service list

**Verification:**
```bash
./scripts/validate-docs.sh
```

---

### Issue #3: Content Type Location Mystery 🚨

**Problem:**
- ARCHITECTURE_OVERVIEW.md documents: customer, employee, time-clock-entry
- Strapi only has: color, sop, price-calculation, pricing-rule
- Where are customer/employee/time-clock-entry?

**Impact:** Developers don't know where user data lives

**Fix (1 hour):**

1. **Search for content type definitions:**
   ```bash
   cd /Users/ronnyworks/Projects/printshop-os
   
   # Search for customer model
   grep -r "customer" services/ --include="*.js" --include="*.ts" -A 5 | head -50
   
   # Search for employee model
   grep -r "employee" services/ --include="*.js" --include="*.ts" -A 5 | head -50
   
   # Search for time-clock-entry
   grep -r "time-clock" services/ --include="*.js" --include="*.ts" -A 5 | head -50
   ```

2. **Check Production Dashboard (likely location):**
   ```bash
   ls -la services/production-dashboard/
   find services/production-dashboard -name "*customer*" -o -name "*employee*" -o -name "*time*"
   ```

3. **Update ARCHITECTURE_OVERVIEW.md Data Model section:**
   
   Either:
   - **Option A:** If they're in Production Dashboard, change from:
     ```markdown
     - customer: Customer information (Strapi)
     ```
     to:
     ```markdown
     - customer: Customer information (Production Dashboard Service)
     ```
   
   - **Option B:** If they should be in Strapi but aren't, create them:
     ```bash
     cd printshop-strapi
     npm run strapi generate
     # Select: content-type
     # Name: customer, employee, time-clock-entry
     ```

**Verification:**
```bash
ls -1 printshop-strapi/src/api/
# Should now show all 7 content types if Option B
```

---

## ✅ Quick Wins (5-10 minutes each)

### 1. Add Cross-Reference ✅ (Already Done!)
ARCHITECTURE.md now has links to related documentation at the top.

### 2. Run Validation Script
```bash
./scripts/validate-docs.sh
```
This shows you exactly what's out of sync.

### 3. Create Port Mapping Cheat Sheet
Create `docs/PORT_MAPPING.md`:
```markdown
# Port Mapping Reference

| Port  | Service                | Environment |
|-------|------------------------|-------------|
| 1337  | Strapi CMS            | All         |
| 3000  | Frontend              | All         |
| 3001  | Production Dashboard  | All         |
| 3002  | Pricing Engine        | All         |
| 3003  | Customer Service AI   | All         |
| 5432  | PostgreSQL            | All         |
| 6379  | Redis                 | All         |
| 8080  | Appsmith              | Dev         |
| 27017 | MongoDB               | All         |
```

---

## 📋 Verification Commands

After fixing each issue, run these:

```bash
# Check all issues at once
./scripts/validate-docs.sh

# Or check individually:

# 1. Port consistency
echo "=== PORTS ===" && \
grep -A 1 "ports:" docker-compose.yml | grep -o "[0-9]*:[0-9]*" | cut -d':' -f1 | sort -u

# 2. Service list
echo "=== SERVICES ===" && \
ls -1 services/ && \
echo "---" && \
grep "services/" docs/ARCHITECTURE_OVERVIEW.md | cut -d'/' -f2 | sort -u

# 3. Content types
echo "=== CONTENT TYPES ===" && \
ls -1 printshop-strapi/src/api/
```

---

## 🎯 Success Criteria

You're done when:
- [ ] `./scripts/validate-docs.sh` shows **0 issues**
- [ ] All ports in docker-compose.yml match docs
- [ ] All services in `services/` are documented
- [ ] Content type locations are clearly specified
- [ ] ARCHITECTURE.md links to ARCHITECTURE_OVERVIEW.md ✅

---

## 📞 Need Help?

**If stuck on ports:**
- Run: `docker-compose ps` to see what's actually running
- Check logs: `docker-compose logs [service-name]`

**If stuck on services:**
- Read: `services/[name]/README.md`
- Check: Is there a `package.json` or `requirements.txt`? (Active service)
- Ask: Team lead about service status

**If stuck on content types:**
- Most likely location: Production Dashboard for user/employee/time data
- Alternative: Create in Strapi if they should be centralized

---

## ⏱️ Time Estimate

- Issue #1 (Ports): 30 minutes
- Issue #2 (Services): 1 hour
- Issue #3 (Content Types): 1 hour
- Verification: 15 minutes

**Total: 2 hours 45 minutes**

---

## 🔄 Next Steps After Sync

1. **Read** `ARCHITECTURE_SYNC_CHECKLIST.md` for weekly maintenance routine
2. **Share** validation script with team
3. **Add** to CI/CD: Run validation script on PRs
4. **Update** docs whenever adding services/ports/content types

---

**Status:** 🔄 Ready to Execute  
**Priority:** 🚨 Critical - Blocks Development  
**Owner:** Technical Lead
