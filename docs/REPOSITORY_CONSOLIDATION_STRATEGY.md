# 🎯 GITHUB REPOSITORY CONSOLIDATION STRATEGY

**Objective**: Consolidate 4 pricing repos into ONE unified "job-estimator" under printshop-os  
**Timeline**: 1-2 hours  
**Risk Level**: Low (we'll archive old repos, not delete)

---

## 📊 CURRENT STATE

### Fragmented Repositories (TO BE CONSOLIDATED)

```
❌ https://github.com/hypnotizedent/screenprint-pricer      [Old/Duplicate]
❌ https://github.com/hypnotizedent/pricer                   [Old/Duplicate]
❌ https://github.com/hypnotizedent/pricer-new               [Active - job-estimator]
❌ https://github.com/hypnotizedent/mint-prints-pricing      [Spark Generated?]
```

### Primary Repository (WHERE EVERYTHING GOES)

```
✅ https://github.com/hypnotizedent/printshop-os
   └─ Will contain: job-estimator (unified pricing engine)
   └─ Location: /services/job-estimator/  [NEW]
```

---

## 🎯 TARGET STATE (After Consolidation)

```
printshop-os/
├─ services/
│  ├─ api/
│  │  └─ supplier-sync/
│  │     ├─ server.js
│  │     ├─ services/
│  │     ├─ utils/
│  │     └─ ... [Supplier integration]
│  │
│  └─ job-estimator/  ✅ [NEW - UNIFIED]
│     ├─ lib/
│     │  ├─ pricing-engine.ts           [Spark generated code]
│     │  ├─ estimator.ts                [Entry point]
│     │  └─ helpers.ts                  [Utilities]
│     │
│     ├─ tests/
│     │  ├─ pricing-engine.test.ts       [Spark tests]
│     │  └─ estimator.test.ts           [Integration tests]
│     │
│     ├─ data/
│     │  ├─ pricing-rules-schema.json    [Spark generated]
│     │  └─ service-config.json          [Services config]
│     │
│     ├─ api/
│     │  ├─ routes.ts                    [REST API endpoints]
│     │  ├─ middleware/
│     │  └─ controllers/
│     │
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ README.md
│     └─ .env.example
│
├─ docs/
│  ├─ job-estimator/                     [Documentation]
│  │  ├─ API.md
│  │  ├─ USAGE.md
│  │  └─ INTEGRATION.md
│  └─ ... [Other docs]
│
└─ ... [Rest of printshop-os]
```

---

## 📋 CONSOLIDATION PLAN (Step-by-Step)

### PHASE 1: Prepare (15 minutes)

**Step 1.1**: Create job-estimator directory structure
```bash
mkdir -p services/job-estimator/{lib,tests,data,api,docs}
```

**Step 1.2**: Create initial package.json and config files
```json
{
  "name": "@mintprints/job-estimator",
  "version": "1.0.0",
  "description": "Unified pricing and job estimation engine",
  "main": "lib/estimator.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "dev": "ts-node",
    "start": "node build/estimator.js"
  }
}
```

---

### PHASE 2: Migrate Code (30 minutes)

**Step 2.1**: Get the generated files from Spark
- `pricing-engine.ts` → `services/job-estimator/lib/pricing-engine.ts`
- `pricing-engine.test.ts` → `services/job-estimator/tests/pricing-engine.test.ts`
- `pricing-rules-schema.json` → `services/job-estimator/data/pricing-rules-schema.json`

**Step 2.2**: Create wrapper/entry point
```typescript
// services/job-estimator/lib/estimator.ts
export { getQuote, PricingRequest, PricingResponse } from './pricing-engine';
export { JobEstimator } from './job-estimator-api';
```

**Step 2.3**: Migrate any code from old repos
```bash
# If code exists in pricer-new:
cp -r /Users/ronnyworks/Projects/job-estimator/* \
    services/job-estimator/
```

---

### PHASE 3: Archive Old Repos (20 minutes)

**Step 3.1**: Archive in GitHub (for each old repo)
1. Go to repository Settings
2. Scroll to "Danger Zone"
3. Click "Change repository visibility"
4. Archive (don't delete - keep history)

**Step 3.2**: Add README to archived repos
```markdown
# ⚠️ ARCHIVED - Use printshop-os instead

This repository has been archived and consolidated.

**New Location**: https://github.com/hypnotizedent/printshop-os
**New Path**: `/services/job-estimator/`

All pricing engine code is now unified under printshop-os.
```

**Step 3.3**: Update old repo descriptions
- Set to: "ARCHIVED - See printshop-os/services/job-estimator"

---

### PHASE 4: Set Up in printshop-os (20 minutes)

**Step 4.1**: Create comprehensive README
```markdown
# Job Estimator

Unified pricing and job estimation engine for Mint Prints.

## Quick Start

```bash
cd services/job-estimator
npm install
npm test
npm start
```

## Structure

- `lib/pricing-engine.ts` - Core pricing logic
- `lib/estimator.ts` - API wrapper
- `data/pricing-rules-schema.json` - All pricing data
- `api/routes.ts` - REST endpoints

## Usage

```typescript
import { getQuote } from './lib/estimator';

const quote = getQuote({
  service: 'screenprint',
  quantity: 100,
  colors: 2,
  printSize: 'A5',
  isNewDesign: true
});
```

## Integration

- **EasyPost Shipping**: See `docs/INTEGRATION.md`
- **Printavo API**: See `docs/INTEGRATION.md`
- **Supplier-Sync API**: See `docs/INTEGRATION.md`
```

**Step 4.2**: Create documentation
- `docs/job-estimator/API.md` - REST API documentation
- `docs/job-estimator/USAGE.md` - Usage examples
- `docs/job-estimator/INTEGRATION.md` - Integration guides

**Step 4.3**: Update main printshop-os README
```markdown
## Services

### Job Estimator
Unified pricing engine for all print services.
- **Location**: `services/job-estimator/`
- **Status**: ✅ Phase 1 Complete
- **See**: [Job Estimator Docs](docs/job-estimator/README.md)
```

---

### PHASE 5: Git & Deploy (15 minutes)

**Step 5.1**: Create new branch
```bash
git checkout -b feat/consolidate-job-estimator
```

**Step 5.2**: Add all files
```bash
git add services/job-estimator/
git add docs/job-estimator/
git add docs/REPOSITORY_CONSOLIDATION_STRATEGY.md
```

**Step 5.3**: Commit
```bash
git commit -m "feat: Consolidate pricing engine into unified job-estimator

- Create services/job-estimator with Spark-generated code
- Migrate pricing-engine.ts, tests, and pricing data
- Add comprehensive documentation and integration guides
- Ready for EasyPost, Printavo, and Supplier-Sync integration

Consolidates:
- screenprint-pricer (archived)
- pricer (archived)
- pricer-new (archived)
- mint-prints-pricing (integrated)

Closes #[issue-number] (consolidation)"
```

**Step 5.4**: Push
```bash
git push origin feat/consolidate-job-estimator
```

**Step 5.5**: Create Pull Request
```
Title: Consolidate pricing engine into unified job-estimator

Description:
This PR consolidates 4 separate pricing repositories into a single,
unified "job-estimator" service within printshop-os.

Changes:
- Create services/job-estimator/ with all pricing logic
- Integrate Spark-generated pricing-engine.ts
- Add comprehensive documentation
- Set up for Phase 2 (UI) and Phase 3 (integrations)

Old repos archived:
- screenprint-pricer
- pricer
- pricer-new
- mint-prints-pricing

See: docs/REPOSITORY_CONSOLIDATION_STRATEGY.md
```

---

## 🔗 INTEGRATION WITH OTHER SYSTEMS

### How job-estimator connects to rest of printshop-os:

```
┌─────────────────────────────────────────────────────┐
│              printshop-os (Main)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐      ┌──────────────────┐    │
│  │ Job Estimator    │◄────►│  EasyPost API    │    │
│  │ (pricing engine) │      │  (shipping)      │    │
│  └──────────────────┘      └──────────────────┘    │
│         │                                           │
│         ├────►  Printavo API Client                │
│         │       (order data)                       │
│         │                                           │
│         └────►  Supplier-Sync API                  │
│                 (cost data)                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Data Flow:

1. **Order comes in** → Printavo API
2. **Extract specs** → Send to Job Estimator
3. **Get quote** → Job Estimator calculates price
4. **Add shipping** → EasyPost API for cost
5. **Check supplier** → Supplier-Sync for costs
6. **Final price** → Return to user

---

## ⚠️ WHAT TO DO WITH SPARK-GENERATED FILES

**If Spark created a repo** (mint-prints-pricing):

Option A: **Fork into printshop-os** (Recommended)
```bash
# Clone the mint-prints-pricing repo
git clone https://github.com/hypnotizedent/mint-prints-pricing temp-pricing

# Copy contents to services/job-estimator/
cp -r temp-pricing/* services/job-estimator/

# Remove temp directory
rm -rf temp-pricing

# Commit and push
git add services/job-estimator/
git commit -m "feat: Import Spark-generated pricing engine"
```

Option B: **Delete and regenerate**
```bash
# If you want to re-run Spark and generate directly in printshop-os
# Delete mint-prints-pricing on GitHub
# Re-run Spark with proper output path
```

---

## 🔄 MIGRATION PATH FOR EXISTING CODE

**If code exists in job-estimator (pricer-new) folder**:

```bash
# Navigate to job-estimator
cd /Users/ronnyworks/Projects/job-estimator

# List current files
ls -la

# If has src/, lib/, or other code:
# Copy to printshop-os location
cp -r src/* /Users/ronnyworks/Projects/printshop-os/services/job-estimator/lib/

# Copy tests
cp -r __tests__/* /Users/ronnyworks/Projects/printshop-os/services/job-estimator/tests/

# Copy data files
cp -r data/* /Users/ronnyworks/Projects/printshop-os/services/job-estimator/data/
```

---

## ✅ CONSOLIDATION CHECKLIST

**After completing all phases**:

- [ ] Create services/job-estimator/ directory
- [ ] Copy Spark-generated files to job-estimator/
- [ ] Create/update package.json
- [ ] Create/update tsconfig.json
- [ ] Update README with unified documentation
- [ ] Create docs/job-estimator/ subdirectory
- [ ] Add integration documentation
- [ ] Commit all changes
- [ ] Create and merge pull request

**GitHub Cleanup**:

- [ ] Archive screenprint-pricer
- [ ] Archive pricer
- [ ] Archive pricer-new
- [ ] Archive mint-prints-pricing (if Spark created it)
- [ ] Add README to archived repos pointing to new location
- [ ] Update descriptions of archived repos

**Final Verification**:

- [ ] All code in services/job-estimator/
- [ ] Tests pass: `npm test`
- [ ] TypeScript compiles: `npm run build`
- [ ] Documentation complete and accurate
- [ ] Main README links to job-estimator docs
- [ ] Old repos properly archived

---

## 📈 NEXT STEPS (AFTER CONSOLIDATION)

### Immediate (After PR merges):
1. ✅ Job-estimator consolidated in printshop-os
2. ✅ All pricing logic in one place
3. ✅ Ready for Phase 2 (Rule Management UI)

### Phase 2 (Rule Management):
- Build UI for managing pricing rules
- Connect to job-estimator API
- Real-time price updates

### Phase 3 (Integrations):
- Connect to EasyPost shipping
- Connect to Printavo API
- Connect to Supplier-Sync

### Phase 4 (Full System):
- Customer-facing pricing UI
- Order management system
- Analytics and reporting

---

## 🚀 BENEFITS OF CONSOLIDATION

| Benefit | Before | After |
|---------|--------|-------|
| **Repositories** | 4 fragmented | 1 unified |
| **Documentation** | Scattered | Centralized |
| **Integration** | Difficult | Easy |
| **Maintenance** | Complex | Simple |
| **Onboarding** | Confusing | Clear |
| **Version Control** | Messy | Clean |
| **Deployment** | Multiple | Single |

---

## 💡 QUESTIONS?

**Q: What if I still need access to old code?**
A: Everything is archived (not deleted). History is preserved in archived repos.

**Q: Can I undo this?**
A: Yes. Unarchive old repos and clone again. But not recommended once integrated.

**Q: What about git history?**
A: Will be preserved in separate archive repos. New consolidated repo starts fresh.

**Q: Will this break anything?**
A: No. Old repos are archived, new code is in printshop-os. Low risk.

---

**Status**: ✅ Ready to execute consolidation
**Next Action**: Follow phases 1-5 above
**Estimated Time**: 1-2 hours total

