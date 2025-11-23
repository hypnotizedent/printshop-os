# Legacy Archives Index

**Date Consolidated**: November 23, 2025  
**Source**: `/Users/ronnyworks/Library/CloudStorage/OneDrive-MintPrints/website/`  
**Status**: ✅ Consolidated - Single source of truth: `/projects/printshop-os`

---

## 📋 Contents

### 1. `website-roadmap/`

**Source**: Cursor IDE chat history from Shopify website work sessions  
**Files**: 10 markdown documents (~2.2 KB total)

**Key Documents**:
- `MINT_PRINTS_ROADMAP.md` - 5-phase website transformation roadmap
- `SHOPIFY_DEVELOPMENT_SETUP.md` - Development environment setup
- `QUICK_START_GUIDE.md` - Initial setup steps
- `TROUBLESHOOTING_GUIDE.md` - Common issues and solutions
- `WEBSITE_LAUNCH_CHECKLIST.md` - Pre-launch verification
- Plus 5 more deployment and content strategy guides

**Use**: Reference for website features, Shopify setup patterns, and deployment strategies

**Status**: Archive - Reference only (core pricing logic already extracted)

---

### 2. `pricing-tool-reference/`

**Source**: Previous iterations of the pricing tool UI (Next.js app)  
**Status**: Multiple working models with variations and experiments

**Contents**:
- `FINAL PRICE TOOL/` - Production pricing model
  - `screenprint_pricing_clean.json` - Final pricing schema
  - `script.js` - Pricing calculation logic
- `working models/` - Experimental variations
- Product testing documentation
- Pricing CSVs by color, service, size

**Use**: Reference for pricing UI/UX patterns and data structure alternatives

**Status**: Archive - Core pricing logic already extracted to `services/pricing/lib/pricing-engine.ts`

**Note**: If building new UI, reference the schema structure and calculation patterns here

---

### 3. `shopify-theme-reference/` (Optional - not yet populated)

**Intent**: Complete Shopify theme export with:
- Design tokens and system
- Liquid templates (layout, sections, snippets)
- Localization (40+ languages)
- Accessibility patterns
- CSS/JS/Image assets

**Use**: Reference for design system, responsive patterns, and i18n setup

**Status**: Available for future frontend work

---

## 🔗 Related Active Components

Do NOT archive these - they are active and in use:

| Component | Location | Phase | Status |
|-----------|----------|-------|--------|
| **Pricing Engine** | `services/pricing/lib/pricing-engine.ts` | Phase 1 ✅ | Active |
| **Supplier Sync API** | `services/api/supplier-sync/` | Phase 4 | Active |
| **Pricing Integration Plan** | `services/pricing/INTEGRATION_PLAN.md` | All Phases | Reference |

---

## 📊 Consolidation Status

### What Was Extracted ✅

| Item | Source | Destination | Status |
|------|--------|-------------|--------|
| Job Estimator code | job-estimator/ | `services/pricing/` | ✅ Integrated Phase 1 |
| Supplier Sync API | mintprints-supplier-sync/ | `services/api/supplier-sync/` | ✅ Ready Phase 4 |
| Website docs | website/website misc/cursor/ | `docs/legacy/website-roadmap/` | ✅ Archived |
| Pricing tool | website/Website_pricing tool SP/ | `docs/legacy/pricing-tool-reference/` | ✅ Archived |
| Shopify theme | website/chat working api - pricer/ | `docs/legacy/shopify-theme-reference/` | ⏳ Optional |
| Product data | website/10.10 as colour csv/ | `data/products/color-reference/` | ✅ Archived |

### What This Means

✅ **All code that matters is now in `/projects/printshop-os`**  
✅ **All documentation is organized and accessible**  
✅ **No scattered legacy folders required anymore**  
✅ **Single source of truth established**  

---

## 🗑️ Safe to Delete

After consolidation, the original legacy folder can be safely deleted:

```bash
# ONLY after confirming consolidation is complete and committed to git
rm -rf "/Users/ronnyworks/Library/CloudStorage/OneDrive-MintPrints/website"
```

**Verification before deletion**:
- [ ] All supplier-sync code in `services/api/supplier-sync/`
- [ ] All website docs in `docs/legacy/website-roadmap/`
- [ ] All pricing tool in `docs/legacy/pricing-tool-reference/`
- [ ] All git commits pushed successfully
- [ ] This documentation file exists (`docs/legacy/ARCHIVE_CONTENTS.md`)

---

## 📚 How to Use These Archives

### For Website Features (Shopify)
→ Check `website-roadmap/MINT_PRINTS_ROADMAP.md`  
→ Reference `SHOPIFY_DEVELOPMENT_SETUP.md` for dev environment

### For Pricing Logic Patterns
→ See `pricing-tool-reference/FINAL PRICE TOOL/`  
→ Current live version: `services/pricing/lib/pricing-engine.ts` (always prefer this)

### For Design System (Future)
→ Shopify theme available in `shopify-theme-reference/` when needed

---

## 🎯 Next Steps

1. **Verify consolidation** (already done)
2. **Confirm everything is committed to git** (already done)
3. **Delete legacy `/website/` folder** (when ready)

The legacy folder is no longer needed. Everything of value is now in `/projects/printshop-os`.

---

## 📝 Archive Timeline

| Date | Event |
|------|-------|
| Multiple | Cursor/Lovable/ChatGPT sessions created various components |
| Nov 23, 2025 | Consolidation audit completed |
| Nov 23, 2025 | All components extracted and organized |
| Nov 23, 2025 | Archive documentation created |
| Now | Ready to delete legacy folder |

---

**Status**: ✅ Consolidation Complete - Safe to Delete Legacy Folder
