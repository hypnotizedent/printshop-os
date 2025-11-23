# Issue Roadmap: Connected to Repository

## Phase 1: Foundation (Currently Working) ✅ Starting

### Issue #44: Pricing Engine Architecture (CRITICAL)
- **Status:** In Planning
- **Branch:** `feature/pricing-engine`
- **Files:** `services/pricing/`
- **Related:** #42, #43, #45, #46
- **Action:** Awaiting pricing model details from user
- **Plan:** `/services/pricing/IMPLEMENTATION_PLAN.md`

---

## Phase 2: Customer Portal + Quote System (Parallel with Phase 1)

### ★ NEW: Architecture Update
**From**: custom-studio-app repository consolidation  
**Service**: services/customer-portal/ (new)  
**Details**: See docs/CUSTOM_STUDIO_APP_INTEGRATION_STRATEGY.md  

Key integrated issues:
- #40: Visual quote format with mockups ← DesignCanvas component
- #42: Mobile-friendly quote approval ← Responsive UI components
- #54: Customer login portal ← Auth integration
- #55: Client job history + reorder ← Design history tracking

---

## Phase 3: Supplier Integration (Parallel with Phase 2)

### Issue #64: Supplier Data Normalization Layer (HIGH)
- **Status:** Not Started
- **Branch:** `feature/supplier-normalization`
- **Blocked By:** #44
- **Files:** `services/supplier-sync/`
- **Description:** Normalize data from multiple supplier APIs into unified schema

### Issue #58: S&S Activewear API Integration (HIGH)
- **Status:** Not Started
- **Files:** `services/supplier-sync/clients/sandm.ts`

### Issue #62: AS Colour API Integration (HIGH)
- **Status:** Not Started
- **Files:** `services/supplier-sync/clients/as-colour.ts`

### Issue #63: SanMar API Integration (HIGH)
- **Status:** Not Started
- **Files:** `services/supplier-sync/clients/sanmar.ts`

---

## Phase 3: Quote System (Depends on Phase 1 + 2)

### Issue #14: Quote System (Assumed CRITICAL - not shown but referenced)
- **Status:** Not Started
- **Branch:** `feature/quote-system`
- **Blocked By:** #44 (pricing), #64 (supplier data)
- **Files:** `services/quoting/`

### Issue #42: Mobile-Friendly Quote Approval (HIGH)
- **Status:** Not Started
- **Blocked By:** #14

### Issue #40: Visual Quote Format with Mockups (HIGH)
- **Status:** Not Started
- **Blocked By:** #14

---

## Quick Links
- **Current Branch:** `refactor/enterprise-foundation`
- **Main Branch:** `main`
- **Total Issues:** 76
- **Critical Path:** #44 → #64 → #14 → #42/40 → #46/47 (Revenue Pipeline)

---

## How to Contribute to an Issue

1. **Create a feature branch**: `git checkout -b feature/issue-#XX-description`
2. **Work on the issue** using the implementation plan
3. **Create a PR** linking the issue: `Closes #XX`
4. **Update this file** when status changes
5. **Merge to main** after review

---

## Next Actions
- [ ] User provides pricing model details
- [ ] Create pricing engine scaffold
- [ ] Begin Issue #44 implementation
- [ ] Connect to GitHub PR workflow
