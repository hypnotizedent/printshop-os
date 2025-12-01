# Architecture Synchronization Checklist

**Created:** November 26, 2025  
**Purpose:** Ensure all documentation and code aligns with ARCHITECTURE_OVERVIEW.md  
**Status:** 🔄 Ready to Execute

---

## ✅ Quick Sync Checklist

Copy this checklist and check off items as you complete them.

### Phase 1: Critical Fixes (2-3 hours)

- [ ] **1. Resolve Port Conflicts** 🚨
  - [ ] List all services and their actual running ports
  - [ ] Create single source of truth port mapping table
  - [ ] Update `docker-compose.yml` with correct ports
  - [ ] Update `docs/ARCHITECTURE_OVERVIEW.md` port references
  - [ ] Update `ARCHITECTURE.md` port references
  - [ ] Verify no port conflicts remain

- [ ] **2. Document Missing Services** 🚨
  - [ ] Add `services/api/` to ARCHITECTURE_OVERVIEW.md
  - [ ] Document or deprecate `services/metadata-extraction/`
  - [ ] Clarify `services/pricing/` vs `services/job-estimator/`
  - [ ] Update SERVICE_DIRECTORY.md with all services

- [ ] **3. Verify Content Type Locations** 🚨
  - [ ] Check if customer/employee/time-clock-entry are Strapi types
  - [ ] If not in Strapi, document where they actually live
  - [ ] Update ARCHITECTURE_OVERVIEW.md data model section
  - [ ] Create missing Strapi content types if needed

### Phase 2: Documentation Updates (2-3 hours)

- [ ] **4. Add Cross-References**
  - [ ] Add "See Also" section to top of ARCHITECTURE.md
  - [ ] Add link to ARCHITECTURE_OVERVIEW.md in ARCHITECTURE.md
  - [ ] Add link to diagrams in docs/architecture/*.md files
  - [ ] Update docs/INDEX.md with new architecture section ✅ (Done)

- [ ] **5. Enhance ARCHITECTURE.md**
  - [ ] Add "Failure Modes & Resilience" section
  - [ ] Add "Information Requested" section
  - [ ] Add "Architectural Decision Records (ADRs)" section
  - [ ] Add "Performance Characteristics" section

- [ ] **6. Review docs/architecture/ Files**
  - [ ] Review system-overview.md - mark as outdated or update
  - [ ] Review component-architecture.md - add reference to new docs
  - [ ] Review data-flow.md - ensure alignment with new diagrams
  - [ ] Add deprecation notice if archiving

### Phase 3: Maintenance Setup (1-2 hours)

- [ ] **7. Create Documentation Workflow**
  - [ ] Create `.github/DOCUMENTATION_WORKFLOW.md`
  - [ ] Document when to update architecture docs
  - [ ] Define which files need sync
  - [ ] Share workflow with team

- [ ] **8. Add Validation Script**
  - [ ] Create `scripts/validate-docs.sh`
  - [ ] Check port consistency
  - [ ] Check service list consistency
  - [ ] Run manually to verify

---

## 🔍 Detailed Instructions

### 1. Port Conflict Resolution

**Problem:**
- ARCHITECTURE_OVERVIEW.md: Pricing Engine = Port 3002
- ARCHITECTURE.md: Analytics Service = Port 3002
- docker-compose.yml: pricing-engine = Port 3001

**Solution:**
```bash
# Step 1: Check what's actually running
lsof -i :3000-3005

# Step 2: Decide on standard port mapping
# Recommended:
# 3000 - Frontend
# 3001 - Production Dashboard
# 3002 - Pricing/Job Estimator
# 3003 - Customer Service AI
# 3004 - Analytics (if separate)
# 3005 - Botpress

# Step 3: Update docker-compose.yml
# Edit the pricing-engine service port
# Edit the frontend service port

# Step 4: Update ARCHITECTURE_OVERVIEW.md
# Find and replace port numbers in Component Architecture section

# Step 5: Update ARCHITECTURE.md
# Find and replace port numbers in Core Services section
```

### 2. Missing Services Documentation

**Check List:**
```bash
cd /Users/ronnyworks/Projects/printshop-os

# List actual services
echo "=== Actual Services ==="
ls -1 services/

# Check what's documented
echo "=== In ARCHITECTURE_OVERVIEW.md ==="
grep -o "services/[a-z-]*" docs/ARCHITECTURE_OVERVIEW.md | sort -u

# Find missing
comm -23 <(ls -1 services/ | sort) <(grep -o "services/[a-z-]*" docs/ARCHITECTURE_OVERVIEW.md | cut -d'/' -f2 | sort)
```

**For Each Missing Service:**
1. Read its README.md
2. Determine status (active/planned/deprecated)
3. Add section to ARCHITECTURE_OVERVIEW.md if active
4. Add to SERVICE_DIRECTORY.md
5. Update ARCHITECTURE.md

### 3. Content Type Verification

**Check Strapi Content Types:**
```bash
cd printshop-strapi/src/api
ls -1

# Should see:
# color/
# sop/
# price-calculation/
# pricing-rule/

# Missing from docs:
# customer
# employee
# time-clock-entry
```

**Investigation Steps:**
1. Search codebase for where customer/employee/time-clock are defined
2. Check if they're in production-dashboard service instead
3. Update ARCHITECTURE_OVERVIEW.md with correct location
4. If they should be in Strapi but aren't, create them

### 4. Cross-Reference Example

Add this to the top of `ARCHITECTURE.md`:

```markdown
# PrintShop OS - System Architecture

**Last Updated:** November 26, 2025

> **📚 Related Documentation:**
> - **[ARCHITECTURE_OVERVIEW.md](docs/ARCHITECTURE_OVERVIEW.md)** - High-level system design with Mermaid diagrams
> - **[Diagrams](docs/diagrams/)** - Standalone Mermaid diagram files
> - **[SERVICE_DIRECTORY.md](SERVICE_DIRECTORY.md)** - Service locations and responsibilities
> - **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Project status and goals

---

## System Overview
...
```

### 5. Validation Script

Create `scripts/validate-docs.sh`:

```bash
#!/bin/bash
# Architecture Documentation Validation Script

echo "🔍 Validating Architecture Documentation..."
echo ""

# Check 1: Port Consistency
echo "=== Port Assignments ==="
echo "docker-compose.yml:"
grep -A 1 "ports:" docker-compose.yml | grep -o "[0-9]*:[0-9]*" | cut -d':' -f1 | sort -u

echo ""
echo "ARCHITECTURE_OVERVIEW.md:"
grep "Port [0-9]*" docs/ARCHITECTURE_OVERVIEW.md | grep -o "Port [0-9]*" | sed 's/Port //' | sort -u

echo ""
echo "ARCHITECTURE.md:"
grep "Port [0-9]*" ARCHITECTURE.md | grep -o "Port [0-9]*" | sed 's/Port //' | sort -u

echo ""
echo "---"

# Check 2: Service List
echo ""
echo "=== Services ==="
echo "Actual (services/):"
ls -1 services/ | sort

echo ""
echo "Documented in ARCHITECTURE_OVERVIEW.md:"
grep "services/" docs/ARCHITECTURE_OVERVIEW.md | grep -o "services/[a-z-]*" | cut -d'/' -f2 | sort -u

echo ""
echo "Missing from docs:"
comm -23 <(ls -1 services/ | sort) <(grep -o "services/[a-z-]*" docs/ARCHITECTURE_OVERVIEW.md | cut -d'/' -f2 | sort -u)

echo ""
echo "---"

# Check 3: Content Types
echo ""
echo "=== Content Types ==="
echo "Actual in Strapi:"
ls -1 printshop-strapi/src/api/ 2>/dev/null | sort

echo ""
echo "Documented in ARCHITECTURE_OVERVIEW.md:"
grep -A 10 "Data Model" docs/ARCHITECTURE_OVERVIEW.md | grep "^[a-z-]*:" | sed 's/://' | sort

echo ""
echo "✅ Validation complete!"
```

Make it executable:
```bash
chmod +x scripts/validate-docs.sh
./scripts/validate-docs.sh
```

---

## 📊 Progress Tracking

### Current Status

| Item | Status | Priority | Time Est | Completed |
|------|--------|----------|----------|-----------|
| Port conflicts resolved | ❌ Not started | 🚨 Critical | 1h | |
| Missing services documented | ❌ Not started | 🚨 Critical | 1h | |
| Content types verified | ❌ Not started | 🚨 Critical | 1h | |
| Cross-references added | ❌ Not started | ⚠️ High | 30m | |
| ARCHITECTURE.md enhanced | ❌ Not started | ⚠️ High | 2h | |
| docs/architecture/ reviewed | ❌ Not started | ⚠️ Medium | 1h | |
| Workflow documented | ❌ Not started | ⚠️ Medium | 1h | |
| Validation script created | ❌ Not started | 📦 Low | 30m | |

**Total Estimated Time:** 8-9 hours

---

## 🎯 Quick Wins (Do These First)

### 1. Add Cross-Reference (5 minutes)
Just add the "Related Documentation" block to top of ARCHITECTURE.md

### 2. Run Service Audit (10 minutes)
```bash
ls -1 services/ > /tmp/actual-services.txt
grep "services/" docs/ARCHITECTURE_OVERVIEW.md | cut -d'/' -f2 | sort -u > /tmp/documented-services.txt
diff /tmp/actual-services.txt /tmp/documented-services.txt
```

### 3. Create Port Mapping Table (15 minutes)
Make a simple markdown table in a scratch file with what ports should be used

---

## 🔄 Weekly Sync Routine (15 minutes)

Run this every Monday:

```bash
# 1. Check for new services
git diff main --name-only | grep "services/"

# 2. Run validation script
./scripts/validate-docs.sh

# 3. Check for port changes
git diff main docker-compose.yml | grep "ports:"

# 4. Update docs if needed
# - If new service: add to ARCHITECTURE_OVERVIEW.md
# - If port changed: update all 3 docs
# - If content type changed: update data model section
```

---

## 📞 Quick Reference

**Main Architecture Docs:**
- `docs/ARCHITECTURE_OVERVIEW.md` - High-level (NEW) ⭐
- `ARCHITECTURE.md` - Technical details
- `SERVICE_DIRECTORY.md` - Service locations
- `docs/diagrams/` - Mermaid diagrams

**When to Update:**
- Adding service → All 3 main docs + diagrams
- Changing port → docker-compose.yml + all 3 docs
- New content type → ARCHITECTURE_OVERVIEW.md data model
- New data flow → Add Mermaid diagram

**Validation:**
```bash
./scripts/validate-docs.sh  # After setup
```

---

## ✅ Completion Criteria

Documentation is **fully synchronized** when:

1. ✅ All port numbers match across docker-compose.yml and all docs
2. ✅ All services in `services/` are documented in ARCHITECTURE_OVERVIEW.md
3. ✅ Content type locations are clearly specified
4. ✅ Cross-references exist between all architecture docs
5. ✅ Validation script runs with no discrepancies
6. ✅ Team knows the update workflow

---

**Last Updated:** November 26, 2025  
**Next Review:** After Phase 1 completion  
**Owner:** Technical Lead
