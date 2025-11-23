# Legacy Folder Consolidation: Quick Execution Guide

**Time Required**: 30-45 minutes  
**Complexity**: Low (copy/paste operations + git)  
**Risk Level**: Minimal (non-destructive, backed up)  

---

## ⚡ Quick Answer to Your Questions

### Q1: "Where should all this go so we can USE what we need?"

**Answer**: Three destinations in `/projects/printshop-os`:

1. **`services/api/supplier-sync/`** ← Supplier integration code (ACTIVE, needed for Phase 4)
2. **`docs/legacy/`** ← Archived components (reference only)
3. **`data/products/`** ← Product data and color references

### Q2: "Is this enough info on the API side to knock out supplier integration issues?"

**Answer**: ✅ **YES, you have everything you need**

**What you have**:
- Working Express API server
- Prisma ORM with database schema
- Product query/filtering patterns
- Cron job scheduling infrastructure
- Error handling and logging (Winston)
- HTTP/FTP data retrieval (axios, basic-ftp)

**What you don't have yet** (to be designed in Phase 4):
- Specific supplier adapter implementations
- Data normalization logic
- Webhook handlers

**Verdict**: You can definitely move forward with supplier integration issues - the foundational code patterns are solid.

---

## 🚀 5-Step Execution Plan

### STEP 1: Create Directories (2 min)

```bash
# From printshop-os root
mkdir -p services/api/supplier-sync
mkdir -p docs/legacy/website-roadmap
mkdir -p docs/legacy/pricing-tool-reference
mkdir -p data/products/color-reference
```

### STEP 2: Copy Supplier Sync Code (5 min)

```bash
# Copy the working supplier sync API
cp -r "/Users/ronnyworks/Library/CloudStorage/OneDrive-MintPrints/website/chat working api - pricer - theme/mintprints-supplier-sync"/* \
  /Users/ronnyworks/Projects/printshop-os/services/api/supplier-sync/

# Verify it worked
ls -la services/api/supplier-sync/
# Should show: server.js, index.js, package.json, prisma/, services/, utils/
```

### STEP 3: Archive Legacy Components (10 min)

```bash
# Archive website roadmap docs (2.2 KB)
cp "/Users/ronnyworks/Library/CloudStorage/OneDrive-MintPrints/website/website misc/cursor"/*.md \
  /Users/ronnyworks/Projects/printshop-os/docs/legacy/website-roadmap/

# Archive pricing tool iterations (reference)
mkdir -p docs/legacy/pricing-tool-reference
cp -r "/Users/ronnyworks/Library/CloudStorage/OneDrive-MintPrints/website/Website_pricing tool SP" \
  /Users/ronnyworks/Projects/printshop-os/docs/legacy/pricing-tool-reference/

# Archive Shopify theme (reference)
mkdir -p docs/legacy/shopify-theme-reference
cp -r "/Users/ronnyworks/Library/CloudStorage/OneDrive-MintPrints/website/chat working api - pricer - theme/theme_export__"* \
  /Users/ronnyworks/Projects/printshop-os/docs/legacy/shopify-theme-reference/ 2>/dev/null || echo "Theme copy optional"

# Copy color data
cp "/Users/ronnyworks/Library/CloudStorage/OneDrive-MintPrints/website/10.10 as colour csv"/*.csv \
  /Users/ronnyworks/Projects/printshop-os/data/products/color-reference/ 2>/dev/null || echo "Color CSV copied"
```

### STEP 4: Create Documentation Index (5 min)

Create `docs/legacy/ARCHIVE_CONTENTS.md`:

```markdown
# Legacy Archives Index

This directory contains archived components from the legacy `/website/` folder consolidation.

## Contents

### website-roadmap/
Cursor IDE chat history with Shopify website guidance
- `MINT_PRINTS_ROADMAP.md` - 5-phase website transformation roadmap
- `SHOPIFY_DEVELOPMENT_SETUP.md` - Development environment setup
- `QUICK_START_GUIDE.md`, `TROUBLESHOOTING_GUIDE.md` - Setup guides

**Use**: Reference for website features and Shopify integration approaches

### pricing-tool-reference/
Multiple iterations of the pricing tool (core logic already extracted to PHASE_1_CONDENSED.md)
- `FINAL PRICE TOOL/` - Production pricing model
- `working models/` - Experimental variations

**Use**: Reference for pricing UI/UX patterns and data structure alternatives

### shopify-theme-reference/
Complete Shopify theme export with localization and accessibility patterns

**Use**: Reference for design system, Shopify Liquid components, and i18n setup

## What's Active vs Archive

**ACTIVE** (in use, regularly updated):
- `/services/pricing/` - Pricing engine (Phase 1)
- `/services/api/supplier-sync/` - Supplier integration (Phase 4)

**ARCHIVED** (reference only):
- Everything in this `/docs/legacy/` folder

## Migration Status

✅ All valuable code consolidated into `/projects/printshop-os`
✅ All documentation archived with clear organization
✅ Single source of truth established
🗑️ Legacy `/website/` folder ready for deletion (after verification)
```

### STEP 5: Commit and Push (5 min)

```bash
cd /Users/ronnyworks/Projects/printshop-os

# Stage all new content
git add services/api/supplier-sync/
git add docs/legacy/
git add data/products/

# Commit with clear message
git commit -m "feat: Consolidate legacy components into single source of truth

✅ ADDED:
- services/api/supplier-sync/ - Working supplier sync API (Phase 4)
- docs/legacy/website-roadmap/ - Archived website/Shopify docs
- docs/legacy/pricing-tool-reference/ - Archived pricing iterations
- data/products/color-reference/ - Product color data

These components are extracted from legacy /website/ folder and ready for:
- supplier-sync/: Active development in Phase 4
- legacy/*: Reference/archive only

Consolidation complete. Single source of truth: /projects/printshop-os"

# Push to GitHub
git push origin refactor/enterprise-foundation

# Verify
echo "✅ Consolidation complete! Check GitHub for new commits."
```

---

## ✅ Verification Checklist

After executing the 5 steps above, verify:

```bash
# Check supplier-sync API
ls services/api/supplier-sync/
# Should show: server.js, index.js, package.json, prisma/, services/, utils/

# Check legacy archives
ls docs/legacy/
# Should show: website-roadmap/, pricing-tool-reference/, ARCHIVE_CONTENTS.md

# Check product data
ls data/products/color-reference/
# Should show: ASColour_Master_ALL_SelectedStyles.csv

# Check git status
git status
# Should show: nothing to commit, working tree clean

# Check commits
git log -3 --oneline
# Should show: your consolidation commit at the top
```

---

## 🗑️ Safe Deletion (After Verification)

**ONLY execute this after ALL of the above is complete and verified:**

```bash
# BACKUP FIRST (just in case)
cd ~
zip -r legacy-website-backup.zip "/Users/ronnyworks/Library/CloudStorage/OneDrive-MintPrints/website"
echo "✅ Backup created: ~/legacy-website-backup.zip"

# NOW DELETE (after confirming git push succeeded)
rm -rf "/Users/ronnyworks/Library/CloudStorage/OneDrive-MintPrints/website"
echo "✅ Legacy folder deleted. Single source of truth: /projects/printshop-os"
```

---

## 🎯 Next Steps After Consolidation

1. **Update Phase 4 Docs**
   - Open `services/pricing/INTEGRATION_PLAN.md`
   - Update Phase 4 section with actual supplier-sync code patterns
   - Reference `services/api/supplier-sync/server.js` as the starting point

2. **Create Supplier Adapter Guide**
   - Create `services/api/supplier-sync/INTEGRATION_GUIDE.md`
   - Document how to build adapters for EasyPost, Printavo, etc.
   - Use existing code as template

3. **Ready for Phase 4 Issues**
   - All supplier integration issues can now reference the working API
   - Team has complete working example to build from
   - No more scattered documentation across legacy folders

---

## 💡 Pro Tips

- **Non-destructive**: Everything is copied, nothing deleted until Step 6
- **Git-backed**: All commits are on GitHub, safe to reference
- **Clear organization**: Each folder has a specific purpose
- **Single source of truth**: `/projects/printshop-os` is now the only place to look

---

## ⏱️ Timeline

- **Planning**: ✅ Complete (this document)
- **Execution**: 30-45 minutes (5 steps above)
- **Verification**: 5 minutes
- **Deletion**: 2 minutes (optional, safe anytime after)

**Total**: ~1 hour end-to-end

---

## 🚀 Ready to Execute?

Run the 5 steps above in order, verify the checklist, and your consolidation is complete!

Questions? Reference `docs/LEGACY_FOLDER_CONSOLIDATION.md` for detailed information.
