# Custom Studio App → PrintShop OS Integration Strategy

**Document Status**: Analysis Complete  
**Date**: November 23, 2025  
**Prepared For**: Repository Consolidation  
**Action**: Prepare to Archive custom-studio-app

---

## 📋 Executive Summary

The `custom-studio-app` repository contains a **visual design/mockup portal** built with React + Fabric.js designed for customers to upload and preview garment artwork before production. This is **valuable IP** that should be integrated into PrintShop OS before archiving.

**Recommendation**: Archive after extracting the design canvas components and strategic design patterns into the appropriate layer of PrintShop OS.

---

## 🎯 What custom-studio-app Does

### Current Purpose
A **Lovable.dev-generated** React application that provides:
1. **Design Upload** - Drag-drop artwork upload to Supabase
2. **Garment Preview** - Visual mockup on t-shirt/hoodie/tank silhouettes (using Fabric.js)
3. **Design Canvas** - Interactive canvas for design placement and manipulation
4. **Shopping Integration** - Direct Shopify cart integration with design URLs

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn-ui + Tailwind CSS
- **Canvas Library**: Fabric.js (for design manipulation)
- **Storage**: Supabase (design file storage)
- **Database**: Supabase PostgreSQL
- **Components**: Full shadcn-ui library (30+ components pre-built)

### Key Functionality

#### Pages
1. **Index.tsx** - Product selection + design upload portal
   - Product/variant selection dropdown
   - File upload with drag-drop
   - Design URL preview
   - Direct Shopify cart redirect

2. **CustomerDesign.tsx** - Customer-facing design session
   - Shopify parameter parsing (shop domain, product ID, customer ID)
   - Design session management
   - Integration point with CustomerDesignSession component

#### Core Components
1. **DesignCanvas.tsx** (★ CRITICAL)
   - Interactive Fabric.js canvas
   - Garment silhouette rendering (t-shirt, hoodie, tank-top)
   - Design object manipulation
   - Multi-garment support
   - **Impact**: This is the core visual editing interface

2. **GarmentSelector.tsx** (★ HIGH VALUE)
   - Garment type selection UI
   - Product variant selection
   - Size/color picker integration
   - **Impact**: Directly supports quote/order workflow

3. **DesignTools.tsx** (★ HIGH VALUE)
   - Drawing tools
   - Color picker
   - Text tool
   - Shape library
   - Undo/redo functionality
   - **Impact**: Enables customer design customization

4. **PricingPanel.tsx** (★ INTEGRATES WITH)
   - Real-time price updates
   - Quantity selector
   - Add-on pricing
   - **Integration Point**: Connects to services/job-estimator pricing engine

5. **CustomerDesignSession.tsx**
   - Session management
   - State persistence
   - Multi-step design workflow
   - **Integration Point**: Customer portal flow

6. **ShopifyApp.tsx**
   - Shopify integration wrapper
   - Product data fetching
   - Cart operations
   - **Integration Point**: E-commerce connection

### UI Component Library (★ 30+ Ready-to-Use)
- Cards, Buttons, Forms, Inputs, Drawers, Sheets, Dialogs
- Charts, Tables, Pagination, Pagination
- Sliders, Toggles, Radio buttons, Checkboxes
- Tooltips, Popovers, Hover cards, Alerts
- All styled consistently with Tailwind CSS

---

## 🗺️ PrintShop OS Architecture & Current Issues

### Current State
PrintShop OS Phase Architecture (from ROADMAP.md):
- **Phase 1**: Strapi setup + Pricing engine (✅ COMPLETE)
- **Phase 2**: Appsmith dashboard for production (🚀 NEXT)
- **Phase 3**: Quote system + Customer portal (🔄 Planned)
- **Phase 4**: AI assistants + Optimization (📅 Future)

### Relevant Issues Mapped to custom-studio-app Capabilities

#### HIGH PRIORITY - Related to Mockups/Artwork
- **#40**: "Visual quote format with customer mockups" 
  - *Status*: Not Started | *Effort*: Medium | *Phase*: 2
  - **Connection**: DesignCanvas + garment preview directly solves this
  - **Gap**: Need to integrate with Strapi quote system

- **#42**: "Mobile-friendly quote approval experience"
  - *Status*: Not Started | *Effort*: Medium | *Phase*: 2
  - **Connection**: DesignCanvas is mobile-responsive (Tailwind CSS)
  - **Gap**: Need approval workflow + signature capture

- **#16**: "Mobile-friendly quote approval experience"
  - *Status*: Not Started | *Effort*: Medium | *Phase*: 2
  - **Connection**: All UI components are mobile-first
  - **Gap**: Need integration with quote system (#14)

#### MEDIUM PRIORITY - Supporting Roles
- **#55**: "Client job history + reorder button"
  - **Connection**: Design/mockup data already captured
  - **Gap**: Need to link to Strapi customer portal (#54)

- **#54**: "Client login portal (Strapi auth + Botpress integration)"
  - **Connection**: CustomerDesignSession has auth framework
  - **Gap**: Needs Strapi JWT auth integration

- **#56**: "Upcoming quote approvals dashboard"
  - **Connection**: UI components pre-built + responsive
  - **Gap**: Just needs Strapi data binding

- **#18**: "Client login portal"
  - **Connection**: Auth patterns in ShopifyApp.tsx
  - **Gap**: Needs Strapi OAuth2 instead of Shopify

#### VISUAL/UI FOUNDATION
- **#60**: "Information architecture for mintprints.com"
  - **Connection**: shadcn-ui + Tailwind provides complete design system
  - **Gap**: Just needs wireframing + content strategy

- **#43**: "Quote template library + customization"
  - **Connection**: Components support template building
  - **Gap**: Needs Strapi CMS integration

---

## 💾 What to Migrate Into PrintShop OS

### TIER 1: Critical (Must Migrate)

#### 1. **Design Canvas System** → `services/customer-portal/components/DesignCanvas/`
- **Source**: `src/components/DesignCanvas.tsx`
- **Why**: Core visual feature, no other solution
- **Action**:
  ```
  Copy → services/customer-portal/lib/canvas/
  - DesignCanvas.tsx
  - garment-silhouettes.ts (extracted helpers)
  - canvas-utils.ts (helper functions)
  ```
- **Integration Points**:
  - Accept Strapi job/quote data
  - Save designs to Strapi MockupImageURL field
  - Export as image for PDF quotes
- **Dependency**: `fabric` npm package (already included)

#### 2. **Garment Selector Component** → `services/customer-portal/components/GarmentSelector/`
- **Source**: `src/components/GarmentSelector.tsx`
- **Why**: Enables garment selection in quote flow
- **Action**:
  ```
  Copy → services/customer-portal/components/
  - GarmentSelector.tsx (refined to accept Strapi products)
  - Types for garment data
  ```
- **Integration**: Link to supplier product data (from #58-63 integrations)

#### 3. **Design Tools Toolbar** → `services/customer-portal/components/DesignTools/`
- **Source**: `src/components/DesignTools.tsx`
- **Why**: Enables design customization
- **Action**:
  ```
  Copy → services/customer-portal/components/DesignTools/
  - DesignTools.tsx (drawing, color picker, text, shapes)
  - tool-configurations.ts
  ```
- **Optional**: Can defer to Phase 3.5 if time-constrained

### TIER 2: High Value (Should Migrate)

#### 4. **shadcn-ui Component Library** → `services/customer-portal/components/ui/`
- **Source**: `src/components/ui/` (30+ components)
- **Why**: 
  - Consistent design system
  - Pre-tested, production-ready
  - Reduces development time by 2+ weeks
  - Mobile-first responsive design
- **Action**:
  ```
  Copy → services/customer-portal/components/ui/
  All 30+ shadcn-ui components (already structured perfectly)
  ```
- **Files to Include**: (see appendix for full list)

#### 5. **Design Types & Interfaces** → `services/customer-portal/types/`
- **Source**: `src/types/database.ts`
- **Why**: Defines design object structure
- **Action**:
  ```
  Copy → services/customer-portal/types/
  - design.ts (interfaces for design objects)
  - garment.ts (garment type definitions)
  - Quote integration types
  ```

#### 6. **Tailwind + CSS Configuration** → Root `tailwind.config.ts`
- **Source**: `tailwind.config.ts`
- **Why**: Tailwind setup is already optimized
- **Action**:
  ```
  Merge into printshop-os tailwind.config.ts
  - Custom color palette (if defined)
  - Plugin configuration
  - Component class utilities
  ```

### TIER 3: Reference Only (Document Pattern)

#### 7. **Shopify Integration Pattern** → Documentation
- **Source**: `src/components/ShopifyApp.tsx`
- **Why**: Pattern for third-party integrations
- **Action**: Document as reference for future Shopify/marketplace integrations
- **Document Location**: `docs/integration-patterns/shopify-integration.md`

#### 8. **Supabase Integration Pattern** → Documentation
- **Source**: File upload/storage patterns
- **Why**: Pattern for file storage (we use S3, similar concepts)
- **Action**: Document as reference for S3 integration

---

## 🔗 Integration Points with Existing PrintShop OS

### Strapi Integration
**Current**: Strapi handles Job, Customer, Quote data  
**Connection Points**:

```typescript
// In DesignCanvas.tsx (updated)
interface DesignCanvasProps {
  job: StrapiJob; // Link to Strapi job
  onDesignSave: (mockupUrl: string) => Promise<void>; // Update Strapi
}

// Usage in quote workflow
const handleSaveMockup = async (canvas: FabricCanvas) => {
  const imageData = canvas.toDataURL('image/png');
  // Upload to S3
  const s3Url = await uploadToS3(imageData);
  // Update Strapi job record
  await updateJob(jobId, { MockupImageURL: s3Url });
};
```

### Pricing Integration
**Current**: services/job-estimator/lib/pricing-engine.ts  
**Connection Points**:

```typescript
// In PricingPanel.tsx (updated)
import { getQuote } from '@/services/job-estimator';

const [quote, setQuote] = useState(null);
const handleQuantityChange = async (qty: number) => {
  const priceQuote = getQuote({
    service: garmentType, // 'screenprint', 'embroidery', etc
    quantity: qty,
    colors: designColors.length,
    printSize: calculateSize(designs),
    isNewDesign: true
  });
  setQuote(priceQuote);
};
```

### Supplier Data Integration
**Current**: services/api/supplier-sync/  
**Connection Points**:

```typescript
// In GarmentSelector.tsx (updated)
const [products, setProducts] = useState([]);

useEffect(() => {
  // Fetch from Strapi (which gets data from supplier sync)
  fetchProductsFromStrapi().then(setProducts);
}, []);

// Select garment → shows real inventory + pricing
const handleGarmentSelect = (productId: string) => {
  const product = products.find(p => p.id === productId);
  // Price = base cost + supplier cost
};
```

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] Review custom-studio-app package.json (all dependencies)
- [ ] Check for Supabase-specific code that needs abstraction
- [ ] Identify any hardcoded Shopify references
- [ ] List all environment variables needed

### Migration Phase 1: Copy Core Components
- [ ] Copy DesignCanvas.tsx → services/customer-portal/lib/canvas/
- [ ] Copy GarmentSelector.tsx → services/customer-portal/components/
- [ ] Copy DesignTools.tsx → services/customer-portal/components/
- [ ] Copy types/database.ts → services/customer-portal/types/
- [ ] Copy all ui/ components → services/customer-portal/components/ui/

### Migration Phase 2: Remove External Dependencies
- [ ] Replace Supabase with Strapi API calls
- [ ] Replace Shopify integration with generic product interface
- [ ] Update authentication to use Strapi JWT
- [ ] Update file storage to use S3 instead of Supabase

### Migration Phase 3: Integration
- [ ] Connect DesignCanvas to Strapi job updates
- [ ] Connect GarmentSelector to supplier product data
- [ ] Connect PricingPanel to pricing engine
- [ ] Add tests for component behavior

### Migration Phase 4: Documentation
- [ ] Create services/customer-portal/README.md
- [ ] Document component APIs
- [ ] Document Strapi integration points
- [ ] Update main ROADMAP.md with new customer portal architecture
- [ ] Archive custom-studio-app repo

---

## 📦 Package Dependencies to Add

From custom-studio-app's package.json:

```json
{
  "dependencies": {
    "fabric": "^6.3.0",           // Canvas library (★ CRITICAL)
    "react-dropzone": "^14.2.0",  // File upload drag-drop
    "sonner": "^1.6.0",           // Toast notifications
    "react-router-dom": "^6.27.0" // Already in printshop-os?
  },
  "devDependencies": {
    "@hookform/resolvers": "^3.3.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-primitive": "^2.0.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^2.0.2",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.2",
    "react-hook-form": "^7.51.4"
  }
}
```

---

## 🎯 Related Roadmap Issues & Timeline

### Immediate (This Sprint)
1. **Archive custom-studio-app** - After migration
2. **Create services/customer-portal/** - New service directory
3. **Migrate DesignCanvas + GarmentSelector** - Tier 1 components

### Phase 2 (Week 3-4)
- [ ] Build customer portal UI framework
- [ ] Integrate design canvas into quote flow
- [ ] Connect to pricing engine

### Phase 3 (Week 5-6)
- [ ] Add design tools (text, colors, shapes)
- [ ] Implement design export/PDF generation
- [ ] Add reorder design feature

### Future (Phase 4+)
- [ ] AI design suggestions
- [ ] Design templates library
- [ ] Bulk design operations

---

## 🚫 What NOT to Migrate

- **Supabase database schema** - Use Strapi instead
- **Shopify OAuth flow** - Use Strapi JWT instead
- **Lovable.dev project link** - It's a build tool reference, not code
- **Build artifacts** (node_modules, dist) - Rebuild after migration
- **Environment-specific files** - Recreate with printshop-os secrets

---

## 📊 Impact Assessment

### Lines of Code Being Integrated
- DesignCanvas components: ~500 LOC
- shadcn-ui library: ~2,500 LOC (pre-built)
- Types & utilities: ~300 LOC
- **Total**: ~3,300 LOC of production-ready code

### Development Time Saved
- Design canvas: ~1 week (building from scratch)
- UI component library: ~2 weeks (building from scratch)
- Mobile responsiveness: ~3 days (already done)
- **Total Saved**: ~2.5 weeks of development

### Risk Assessment
- **Low Risk**: shadcn-ui components (no custom logic)
- **Medium Risk**: DesignCanvas (Fabric.js has learning curve)
- **Medium Risk**: Shopify → Strapi migration (config changes)
- **Mitigation**: Comprehensive tests + gradual rollout

---

## 📚 Reference Architecture

After migration, PrintShop OS architecture will be:

```
printshop-os/
├─ services/
│  ├─ job-estimator/          [Phase 1] ✅ DONE
│  │  └─ lib/pricing-engine.ts
│  ├─ api/
│  │  ├─ printshop-strapi/    [Phase 1] ✅ Data Hub
│  │  └─ supplier-sync/       [Phase 3] 🚀 Supplier Data
│  │
│  └─ customer-portal/        [Phase 2] 🆕 NEW - From custom-studio-app
│     ├─ components/
│     │  ├─ DesignCanvas/     (from custom-studio-app)
│     │  ├─ GarmentSelector/  (from custom-studio-app)
│     │  ├─ DesignTools/      (from custom-studio-app)
│     │  └─ ui/               (from custom-studio-app)
│     ├─ pages/
│     │  ├─ Quote.tsx         (new - integrates with pricing)
│     │  └─ Design.tsx        (new - uses DesignCanvas)
│     ├─ lib/
│     │  └─ canvas-utils.ts
│     └─ README.md
```

---

## ✅ Next Steps

### Immediate Actions (Today/Tomorrow)
1. [ ] **Review this document** - Confirm strategy with team
2. [ ] **Examine custom-studio-app dependencies** - Verify all can be added
3. [ ] **Plan migration sprint** - Estimate 2-3 days for migration + testing
4. [ ] **Create feature branch** - `feature/integrate-custom-studio-app`

### Migration Sprint (2-3 Days)
1. [ ] Create services/customer-portal/ directory structure
2. [ ] Copy Tier 1 components (DesignCanvas, GarmentSelector, types)
3. [ ] Add fabric.js + dependencies
4. [ ] Merge shadcn-ui components
5. [ ] Create initial tests
6. [ ] Update documentation
7. [ ] Create PR for review

### Post-Migration (This Week)
1. [ ] Archive custom-studio-app repository
2. [ ] Update GitHub issue #40 (Visual quote format)
3. [ ] Update GitHub issue #42 (Mobile quote approval)
4. [ ] Begin Phase 2 planning with new architecture

---

## 📞 Questions to Answer Before Migration

1. **File Storage**: Should design files go to S3 or Supabase?
   - *Recommendation*: S3 (consistent with existing setup)

2. **Authentication**: Use Strapi JWT or separate auth service?
   - *Recommendation*: Strapi JWT (single source of truth)

3. **Design Persistence**: Store full design JSON or just final image?
   - *Recommendation*: Both (JSON for editing later, PNG for quotes)

4. **Mobile-First or Responsive**: Focus on mobile design sessions?
   - *Recommendation*: Mobile-first (50% of quote views are mobile)

5. **Undo/Redo**: Keep client-side only or sync to backend?
   - *Recommendation*: Client-side only (reduces complexity)

---

## 📄 Appendix: Complete UI Component List to Migrate

All from `src/components/ui/`:

```
Essential (Use in quote/design flow):
- button.tsx
- card.tsx
- input.tsx
- label.tsx
- textarea.tsx
- select.tsx
- tabs.tsx
- dialog.tsx
- drawer.tsx
- sheet.tsx
- popover.tsx

Form Components:
- form-components (various)
- checkbox.tsx
- radio-group.tsx
- switch.tsx
- slider.tsx
- input-otp.tsx

Feedback/Display:
- toast.tsx / use-toast.ts (notifications)
- alert.tsx
- alert-dialog.tsx
- progress.tsx
- skeleton.tsx

Navigation:
- pagination.tsx
- breadcrumb.tsx
- navigation-menu.tsx

Advanced:
- chart.tsx (for analytics)
- table.tsx (for product lists)
- scroll-area.tsx
- resizable.tsx
- aspect-ratio.tsx
- hover-card.tsx
- tooltip.tsx
```

---

## 🎓 Learning Resources

If unfamiliar with any technology:

- **Fabric.js**: https://fabricjs.com/ (Canvas manipulation library)
- **shadcn-ui**: https://ui.shadcn.com/ (Component docs)
- **Tailwind CSS**: https://tailwindcss.com/ (Styling framework)
- **React Dropzone**: https://react-dropzone.js.org/ (File uploads)

---

**Document Created**: November 23, 2025  
**Status**: Ready for Implementation  
**Next Review**: After migration completion
