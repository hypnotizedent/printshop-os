# PrintShop OS - Frontend v1.1 Roadmap

> **Created:** November 28, 2025  
> **Updated:** November 27, 2025  
> **Status:** In Progress  
> **Priority:** HIGH - User-reported issues and feature requests

---

## ✅ Completed (November 27, 2025)

### 1. Dark Mode - DONE ✅
- Added dark mode CSS variables to `index.css`
- Created `ThemeContext.tsx` for state management
- Created `ThemeToggle.tsx` component
- Added theme toggle to sidebar
- Persists to localStorage

### 2. Production Schedule View - DONE ✅
- Replaced "Machines" page with "Production Schedule" 
- Shows daily job queue per machine
- Displays job priorities, artwork status, garment pull status
- Admin can see hot folder paths
- Card-based layout with progress indicators

### 3. Hot Folder + Auto-Archive Architecture - DONE ✅
- Created `docs/HOT_FOLDER_ARCHITECTURE.md`
- Designed MinIO folder structure
- Extended `machine` content type with hot folder paths
- Created `file-event` content type for audit logging
- Defined file naming conventions

---

## 🐛 Bug Fixes (Priority 1)

### 1. Dark Mode Not Working - COMPLETED ✅
- **Issue:** Dark mode toggle doesn't apply consistently
- **Solution:** Added CSS variables, ThemeContext, ThemeToggle component
- **Status:** ✅ DONE

### 2. Left Nav: Quotes Page Fails
- **Issue:** Navigation to quotes page throws error
- **Location:** `src/pages/QuotesPage.tsx` or router config
- **Effort:** 1-2 hours
- **Agent-Automatable:** ✅ Yes (need to see error first)

### 3. Products: Failed to Fetch
- **Issue:** Products page shows error, no images, only 3 visible
- **Location:** `src/pages/ProductsPage.tsx`, Strapi connection
- **Possible Cause:** API endpoint not configured or CORS
- **Effort:** 2-3 hours
- **Agent-Automatable:** ✅ Yes

### 4. Customer Page: No Printavo Data Visible
- **Issue:** Customer form doesn't populate with migrated Printavo data
- **Location:** `src/pages/CustomerPage.tsx`, Strapi query
- **Effort:** 2-3 hours
- **Agent-Automatable:** ✅ Yes

---

## 📦 Shipping Features (Priority 2)

### 5. Multi-Box Shipments
- **Feature:** Add ability to add second box for multi-box shipments
- **Location:** `src/pages/ShippingPage.tsx`
- **Effort:** 4-6 hours
- **Agent-Automatable:** ✅ Yes

### 6. EasyPost Error Display
- **Issue:** Shipping page shows EasyPost error note
- **Location:** Check EasyPost API integration
- **Effort:** 2-3 hours
- **Agent-Automatable:** ⚠️ Partial (need API key check)

### 7. Order/Customer Lookup
- **Feature:** Lookup field to find order ID or customer name
- **Location:** `src/pages/ShippingPage.tsx`
- **Effort:** 3-4 hours
- **Agent-Automatable:** ✅ Yes

### 8. Address Sync to EasyPost
- **Feature:** Sync customer addresses from Strapi to EasyPost for autofill
- **Location:** New integration service
- **Effort:** 6-8 hours
- **Agent-Automatable:** ⚠️ Partial (needs EasyPost API)

### 9. Live Shipping Quotes ⭐ HIGH VALUE
- **Feature:** Get live shipping quotes based on:
  - Client location
  - Garment weights from supplier API
  - Estimate freight costs BEFORE production
- **Business Value:** Stop chasing money on backend for shipping costs
- **Location:** New service integration
- **Dependencies:** Supplier API weights, EasyPost API
- **Effort:** 16-24 hours (complex integration)
- **Agent-Automatable:** ⚠️ Partial (needs architecture first)

---

## 🔗 Integration Features (Priority 3)

### 10. Files → MinIO Connection
- **Feature:** Connect Files page to MinIO object storage
- **Current State:** MinIO running but not connected to frontend
- **Location:** `src/pages/FilesPage.tsx`, new MinIO service
- **Effort:** 8-12 hours
- **Agent-Automatable:** ✅ Yes

### 11. Settings → Integrations Page
- **Feature:** What integrations are possible?
- **Current Integrations:**
  - ✅ S&S Activewear (inventory)
  - ✅ SanMar (inventory)
  - ✅ AS Colour (inventory)
  - ⏳ EasyPost (shipping)
  - ⏳ Stripe (payments)
  - ⏳ QuickBooks (accounting)
- **Effort:** Settings page: 4 hours, Each integration: varies
- **Agent-Automatable:** ✅ Yes (UI only)

---

## 🏭 Machine Integration (Priority 4 - Research Required)

### 12. Equipment Network Integration
- **Question:** What's possible if machines have ethernet ports connected to server?
- **Answer:** See section below

### 13. Barudan BEKY 2020 Embroidery Machine
- **Model:** 6-head Barudan BEKY 2020
- **Goal:** Send/receive digitized artwork to/from machine
- **Research Needed:**
  - Does Barudan have an API?
  - What file formats does it accept? (DST, PES, etc.)
  - Network protocol (FTP, SMB, proprietary?)
- **Effort:** 40+ hours (significant R&D)
- **Agent-Automatable:** ❌ No (hardware integration)

### 14. Advanced Image Tech Screenpro 600
- **Current:** Connected to Lenovo Mini PC (5th gen)
- **Goal:** Integrate with PrintShop OS
- **Research Needed:**
  - What software runs on the Mini PC?
  - Can it be replaced or supplemented?
- **Effort:** 40+ hours (significant R&D)
- **Agent-Automatable:** ❌ No (hardware integration)

---

## 🔧 Infrastructure Fixes (Priority 1)

### 15. Strapi CMS Link Doesn't Load
- **Expected URL:** http://100.92.156.118:1337 or https://mintprints.ronny.works
- **Check:** Container running? Port accessible?
- **Fix:** Verify DNS/Tailscale, check container logs

### 16. Inventory API Link Doesn't Load
- **Expected URL:** http://100.92.156.118:3002
- **Check:** Container running? Health endpoint?
- **Fix:** Check `docker ps`, verify port mapping

### 17. MinIO Data Not Visible
- **Issue:** "printshop" folder exists but Printavo data not visible
- **Cause:** Artwork scrape stored locally, not in MinIO yet
- **Fix:** Deploy recommended folder structure, sync artwork

---

## 📊 Effort Summary

| Category | Items | Total Hours | Agent-Automatable |
|----------|-------|-------------|-------------------|
| Bug Fixes | 4 | 8-12 hrs | ✅ Yes |
| Shipping Features | 5 | 32-45 hrs | ⚠️ Partial |
| Integrations | 2 | 12-16 hrs | ✅ Mostly |
| Machine Integration | 2 | 80+ hrs | ❌ No |
| Infrastructure | 3 | 2-4 hrs | ✅ Yes |

**Total Estimated:** 134-157 hours for ALL features

---

## 🤖 Agent Task Breakdown

### Can Be Done By Agents Now:
1. ✅ Dark mode fix
2. ✅ Quotes page navigation fix
3. ✅ Products page API connection
4. ✅ Customer page data display
5. ✅ Multi-box shipping UI
6. ✅ Order lookup field
7. ✅ Files page MinIO connection
8. ✅ Settings/Integrations UI

### Need Human Input First:
1. ⚠️ EasyPost API key verification
2. ⚠️ Live shipping quotes architecture
3. ⚠️ Address sync design decisions

### Cannot Be Automated:
1. ❌ Barudan machine integration (hardware)
2. ❌ Screenpro 600 integration (hardware)

---

## 🚀 Recommended Sprint Plan

### Sprint 1 (This Week) - Bug Fixes
1. Dark mode
2. Quotes page fix
3. Products page fix
4. Customer page data

### Sprint 2 (Next Week) - Shipping Core
1. Multi-box shipments
2. Order lookup field
3. EasyPost error handling

### Sprint 3 - Integrations
1. MinIO file connection
2. Settings/Integrations page
3. Address sync to EasyPost

### Sprint 4+ - Advanced Features
1. Live shipping quotes
2. Machine integration research
3. Stripe/payments connection

---

## Next Steps

1. **Fix infrastructure issues** (Strapi/API links)
2. **Assign Sprint 1 tasks** to agents
3. **Research machine integration** (Barudan protocols)
4. **Design shipping quotes architecture**

---

*Document maintained by: @ronnyworks*  
*Last Updated: November 28, 2025*
