# Custom Studio App → PrintShop OS: Quick Reference & Action Plan

**Status**: Ready to Archive After Extraction  
**Repository**: https://github.com/hypnotizedent/custom-studio-app  
**Integration Path**: services/customer-portal/ (new service)  

---

## 🎯 What We're Taking (The Valuable Parts)

### Core Reusable Code

| Component | Location | Size | Use Case | Priority |
|-----------|----------|------|----------|----------|
| **DesignCanvas.tsx** | `services/customer-portal/lib/canvas/` | ~500 LOC | Interactive garment mockup editing | ★★★ CRITICAL |
| **GarmentSelector.tsx** | `services/customer-portal/components/` | ~200 LOC | Product type selection | ★★★ CRITICAL |
| **DesignTools.tsx** | `services/customer-portal/components/` | ~300 LOC | Text, colors, shapes, drawing | ★★ HIGH |
| **shadcn-ui Library** | `services/customer-portal/components/ui/` | 30+ components | Consistent design system | ★★★ CRITICAL |
| **Type Definitions** | `services/customer-portal/types/` | ~200 LOC | Design object schemas | ★★ HIGH |
| **Configuration** | `tailwind.config.ts` merge | Pre-optimized | Styling framework | ★★ HIGH |

### What We're NOT Taking
- ❌ Supabase database integration (use Strapi instead)
- ❌ Shopify-specific OAuth (use Strapi JWT)
- ❌ Lovable.dev build references (it's a design tool UI)
- ❌ Build artifacts & node_modules

---

## 🗂️ File Structure After Migration

```
services/customer-portal/
├── components/
│   ├── ui/                          (30+ shadcn-ui components)
│   ├── DesignCanvas/
│   ├── GarmentSelector/
│   ├── DesignTools/
│   └── ...other UI components
├── lib/
│   ├── canvas-utils.ts
│   ├── garment-silhouettes.ts
│   └── design-helpers.ts
├── types/
│   ├── design.ts
│   ├── garment.ts
│   └── index.ts
├── pages/
│   ├── Quote.tsx                    (new - integrates with pricing)
│   └── Design.tsx                   (new - uses DesignCanvas)
├── hooks/
│   └── useDesignCanvas.ts
├── package.json                     (add: fabric, react-dropzone, sonner)
├── tailwind.config.ts               (merge existing)
├── tsconfig.json                    (standard)
├── README.md                        (documentation)
└── tests/                           (component tests)
```

---

## 📋 Extraction Checklist (2-3 Day Sprint)

### Day 1: Preparation & Setup
- [ ] Create branch: `feature/integrate-custom-studio-app`
- [ ] Create directory: `services/customer-portal/`
- [ ] Copy Tier 1 files:
  ```bash
  cp -r custom-studio-app/src/components/DesignCanvas \
        printshop-os/services/customer-portal/lib/canvas/
  cp -r custom-studio-app/src/components/GarmentSelector \
        printshop-os/services/customer-portal/components/
  cp -r custom-studio-app/src/types \
        printshop-os/services/customer-portal/types/
  ```
- [ ] Copy shadcn-ui library: `src/components/ui/` → `services/customer-portal/components/ui/`
- [ ] Add dependencies: `npm install fabric react-dropzone sonner`

### Day 2: Integration & Refactoring
- [ ] Remove Supabase imports, replace with Strapi API calls
- [ ] Update authentication to use Strapi JWT
- [ ] Connect DesignCanvas to Strapi job updates
- [ ] Connect GarmentSelector to supplier product data
- [ ] Connect pricing panel to `services/job-estimator/`
- [ ] Create Strapi integration layer: `lib/strapi-client.ts`

### Day 3: Testing & Documentation
- [ ] Write component tests (Jest + React Testing Library)
- [ ] Test mobile responsiveness
- [ ] Update ROADMAP.md and ISSUES_ROADMAP.md (✅ DONE)
- [ ] Create services/customer-portal/README.md
- [ ] Document Strapi integration points
- [ ] Create PR for review
- [ ] Merge to main

### Day 4: Cleanup
- [ ] Archive custom-studio-app repo on GitHub
- [ ] Update issues #40, #42, #54, #55 with new info
- [ ] Begin Phase 2 development with new architecture

---

## 🔗 Integration Points (How Components Talk to PrintShop OS)

### To Strapi (Data Hub)
```typescript
// services/customer-portal/lib/strapi-client.ts
export const updateJobMockup = async (jobId: string, imageUrl: string) => {
  const response = await fetch(`${STRAPI_URL}/api/jobs/${jobId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    body: JSON.stringify({ data: { MockupImageURL: imageUrl } })
  });
  return response.json();
};
```

### To Pricing Engine
```typescript
// services/customer-portal/lib/pricing-client.ts
import { getQuote } from '@/services/job-estimator';

export const calculatePrice = (config: QuoteConfig) => {
  return getQuote({
    service: 'screenprint',
    quantity: config.quantity,
    colors: config.colors,
    isNewDesign: true
  });
};
```

### To Supplier Data
```typescript
// services/customer-portal/lib/product-client.ts
export const getGarments = async () => {
  // Fetch from Strapi (populated by supplier-sync service)
  const response = await fetch(`${STRAPI_URL}/api/products`);
  return response.json();
};
```

---

## 📊 Issues Directly Solved

| Issue | Status | How custom-studio-app Helps |
|-------|--------|------------------------------|
| #40: Visual quote with mockups | 🚀 Ready | DesignCanvas + garment preview |
| #42: Mobile quote approval | 🚀 Ready | All components are mobile-responsive |
| #43: Quote templates | 🚀 Ready | Design tools + template framework |
| #54: Customer login portal | 🔄 Partial | Auth patterns ready, needs Strapi JWT |
| #55: Reorder past designs | 🔄 Partial | Design history tracking available |
| #56: Approval dashboard | 🚀 Ready | UI components pre-built |

---

## 💾 Dependencies to Add

```json
{
  "dependencies": {
    "fabric": "^6.3.0",
    "react-dropzone": "^14.2.0",
    "sonner": "^1.6.0",
    "react-router-dom": "^6.27.0"
  }
}
```

**Note**: shadcn-ui components have their own deps (already in custom-studio-app, compatible with printshop-os)

---

## 🚀 Why This Matters

### Before (Without custom-studio-app)
- Need to build design canvas from scratch: **1-2 weeks**
- Need to build UI component library: **2+ weeks**
- Need responsive design: **3-5 days**
- **Total**: ~3-4 weeks of work

### After (With custom-studio-app)
- Copy & integrate components: **2-3 days**
- Refactor for Strapi: **1-2 days**
- Write tests & docs: **1-2 days**
- **Total**: ~4-6 days of work
- **Savings**: ~2-3 weeks 🎉

---

## 📝 Documentation Updates (Already Done ✅)

- ✅ `docs/CUSTOM_STUDIO_APP_INTEGRATION_STRATEGY.md` - Full technical strategy
- ✅ `ROADMAP.md` - Updated Phase 2 architecture
- ✅ `ISSUES_ROADMAP.md` - Added Phase 2 customer portal section

**Still TODO**:
- [ ] `services/customer-portal/README.md` - Component API docs
- [ ] Integration guide for Phase 2 developers

---

## 🎓 What You'll Learn During Migration

1. **Fabric.js Canvas Library** - Professional canvas manipulation
2. **shadcn-ui** - Production-grade component architecture
3. **Tailwind CSS Optimization** - Mobile-first responsive design
4. **TypeScript Patterns** - Type-safe component interfaces

---

## ❓ FAQ

**Q: Why not just use custom-studio-app as-is?**  
A: It's tightly coupled to Supabase/Shopify. Need to refactor for Strapi integration.

**Q: Do we keep the git history?**  
A: No, we're extracting the code. Git history stays in custom-studio-app (which we're archiving).

**Q: Can we extend these components later?**  
A: Yes! They're modular and tested. Easy to add features in Phase 3 (design templates, bulk operations, etc.)

**Q: What if we need the Shopify integration later?**  
A: ShopifyApp.tsx will be documented as a reference pattern. Easy to rebuild if needed.

**Q: Is this production-ready code?**  
A: Yes! It was built by Lovable.dev (AI code generation) and is currently used by Mint Prints customers.

---

## 🔄 Next Steps After Merger

### Week 1: Phase 2 Development
- Integrate customer portal into quote flow
- Connect to pricing engine
- Start mobile-first design work

### Week 2: Phase 3 Planning
- Begin supplier data integration (#58-63)
- Plan design template system (#43)
- Design reorder workflow (#55)

### Week 3: Demo & Testing
- Full end-to-end flow: Product → Design → Quote → Approval
- Mobile testing on real devices
- Performance optimization

---

## 📞 Contact & Questions

For questions during migration:
- See: `docs/CUSTOM_STUDIO_APP_INTEGRATION_STRATEGY.md` (full technical guide)
- Reference: `services/customer-portal/README.md` (component APIs)
- Check: `docs/architecture/component-architecture.md` (system design)

---

**Status**: 🟢 Ready to begin extraction  
**Estimated Timeline**: 4-6 days (design → code → tests → review → merge)  
**Blocked By**: None  
**Next Milestone**: Archive custom-studio-app, begin Phase 2 development

