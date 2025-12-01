# 📋 Architecture Sync - Quick Reference Card

**Print this or keep it handy** 📌

---

## 🚨 When Something Seems Wrong

```bash
cd /Users/ronnyworks/Projects/printshop-os
./scripts/validate-docs.sh
```

This tells you **exactly** what's out of sync.

---

## 📚 Which Document Do I Need?

| Need | Document | Time |
|------|----------|------|
| **Understanding the system** | `docs/ARCHITECTURE_OVERVIEW.md` | 30-45 min |
| **Technical implementation** | `ARCHITECTURE.md` | 1 hour |
| **Quick visual overview** | `docs/diagrams/*.mmd` | 5 min |
| **Fix documentation conflicts** | `SYNC_ACTION_PLAN.md` | 2-3 hours |
| **Complete sync checklist** | `ARCHITECTURE_SYNC_CHECKLIST.md` | 8-9 hours |
| **Check if docs are synced** | `./scripts/validate-docs.sh` | 30 sec |

---

## ⚡ Common Tasks

### Adding a New Service
1. Create service in `services/[name]/`
2. Add to `docs/ARCHITECTURE_OVERVIEW.md` Component Architecture
3. Add to `SERVICE_DIRECTORY.md`
4. Update `ARCHITECTURE.md` Core Services
5. Run `./scripts/validate-docs.sh`

### Changing a Port
1. Update `docker-compose.yml`
2. Update `docs/ARCHITECTURE_OVERVIEW.md` (search "Port")
3. Update `ARCHITECTURE.md` (search "Port")
4. Update service README
5. Run `./scripts/validate-docs.sh`

### Adding a Content Type
1. Create in Strapi OR in service
2. Update `docs/ARCHITECTURE_OVERVIEW.md` Data Model section
3. Update `ARCHITECTURE.md` Database Schema
4. Run `./scripts/validate-docs.sh`

---

## 🔍 Quick Checks

```bash
# Check ports
lsof -i :3000-3005

# List services
ls -1 services/

# List content types
ls -1 printshop-strapi/src/api/

# Full validation
./scripts/validate-docs.sh
```

---

## ✅ Weekly Routine (15 minutes)

**Every Monday:**
```bash
cd /Users/ronnyworks/Projects/printshop-os

# 1. Run validation
./scripts/validate-docs.sh

# 2. If issues found, check what changed
git diff main docker-compose.yml
ls -1 services/ | diff - <(git ls-tree -r --name-only main services/ | cut -d'/' -f2 | sort -u)

# 3. Update docs for any changes
# - New service? Add to ARCHITECTURE_OVERVIEW.md
# - Port change? Update all 3 docs
# - New content type? Update data model section

# 4. Verify
./scripts/validate-docs.sh
```

---

## 🚨 Current Critical Issues

As of November 26, 2025:

1. **Port Conflicts** ❌
   - Ports 3002, 3003 in docs but not in docker-compose.yml
   - **Fix:** See `SYNC_ACTION_PLAN.md` Issue #1

2. **Missing Services** ❌
   - `api`, `metadata-extraction`, `pricing` not documented
   - **Fix:** See `SYNC_ACTION_PLAN.md` Issue #2

---

## 📞 Help

**Stuck?** Read the detailed guides:
- Quick fixes: `SYNC_ACTION_PLAN.md`
- Full process: `ARCHITECTURE_SYNC_CHECKLIST.md`
- Status check: `./scripts/validate-docs.sh`

**All clear?** When validation shows 0 issues, you're synced! ✅

---

## 🎯 Success = Zero Issues

```bash
./scripts/validate-docs.sh
# Output should say:
# ✅ All checks passed! Documentation is synchronized.
```

---

**Keep this file handy for quick reference!**

Last updated: November 26, 2025
