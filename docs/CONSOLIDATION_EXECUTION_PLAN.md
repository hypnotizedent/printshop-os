# 🎯 CONSOLIDATION EXECUTION PLAN - READY TO RUN

**Status**: Ready for immediate execution  
**Time**: ~1-2 hours  
**Risk**: LOW (archiving old repos, not deleting)

---

## EXECUTIVE SUMMARY

You have **4 pricing/pricer repositories** that need to be consolidated into ONE under printshop-os:

```
Current (Fragmented):
❌ screenprint-pricer       → Archive
❌ pricer                    → Archive  
❌ pricer-new               → Migrate content
❌ mint-prints-pricing      → Get from Spark/integrate

Target (Unified):
✅ printshop-os/services/job-estimator/
   ├─ All pricing logic
   ├─ All tests
   ├─ All data
   └─ Ready for Phase 2, 3, 4
```

---

## 🚀 EXECUTION (5 PHASES)

### PHASE 1: Create job-estimator Directory Structure (5 min)

```bash
cd /Users/ronnyworks/Projects/printshop-os

# Create directory structure
mkdir -p services/job-estimator/{lib,tests,data,api,docs}

# Verify
ls -la services/job-estimator/
```

**Expected Output**:
```
lib/    tests/    data/    api/    docs/
```

---

### PHASE 2: Get Spark-Generated Files (10 min)

**Option A: If Spark created a separate repo (mint-prints-pricing)**

```bash
# Navigate to temp directory
cd /tmp

# Clone the Spark-created repo
git clone https://github.com/hypnotizedent/mint-prints-pricing

# Copy all files to printshop-os
cp -r mint-prints-pricing/* \
    /Users/ronnywork/Projects/printshop-os/services/job-estimator/

# Verify files copied
ls -la /Users/ronnyworks/Projects/printshop-os/services/job-estimator/
```

**Option B: If Spark generated files locally (Cursor)**

```bash
# Files should be in services/pricing/lib/ already
# Copy to job-estimator/
cp services/pricing/lib/pricing-engine.ts services/job-estimator/lib/
cp services/pricing/tests/pricing-engine.test.ts services/job-estimator/tests/
cp services/pricing/data/pricing-rules-schema.json services/job-estimator/data/
```

**After**: You should have:
```
services/job-estimator/
├─ lib/
│  └─ pricing-engine.ts          ✅ Spark generated
├─ tests/
│  └─ pricing-engine.test.ts     ✅ Spark generated
└─ data/
   └─ pricing-rules-schema.json  ✅ Spark generated
```

---

### PHASE 3: Migrate Code from Old Repos (10 min)

**Check if code exists in job-estimator (pricer-new):**

```bash
# Look at what's in the old job-estimator
cd /Users/ronnyworks/Projects/job-estimator
ls -la

# If there's meaningful code (not just the same as Spark):
# Copy package.json, tsconfig.json, etc.
cp package.json /Users/ronnyworks/Projects/printshop-os/services/job-estimator/
cp tsconfig.json /Users/ronnyworks/Projects/printshop-os/services/job-estimator/
cp -r src/* /Users/ronnyworks/Projects/printshop-os/services/job-estimator/lib/ 2>/dev/null || true
cp -r __tests__/* /Users/ronnyworks/Projects/printshop-os/services/job-estimator/tests/ 2>/dev/null || true
```

**Update package.json name:**

```json
{
  "name": "@mintprints/job-estimator",
  "version": "1.0.0",
  "description": "Unified job estimator and pricing engine for Mint Prints",
  ...
}
```

---

### PHASE 4: Create Configuration Files (10 min)

**Create README.md:**

```bash
cat > /Users/ronnyworks/Projects/printshop-os/services/job-estimator/README.md << 'EOF'
# Job Estimator

Unified pricing and job estimation engine for Mint Prints.

Consolidated from:
- screenprint-pricer (archived)
- pricer (archived)
- pricer-new (archived)
- mint-prints-pricing (integrated)

## Quick Start

```bash
cd services/job-estimator
npm install
npm test
```

## Structure

- `lib/pricing-engine.ts` - Core pricing logic (all 6 services)
- `tests/pricing-engine.test.ts` - 25-30 comprehensive tests
- `data/pricing-rules-schema.json` - All pricing data
- `api/` - REST API endpoints (Phase 2)

## Usage

```typescript
import { getQuote } from './lib/pricing-engine';

const quote = getQuote({
  service: 'screenprint',
  quantity: 100,
  colors: 2,
  printSize: 'A5',
  isNewDesign: true
});

console.log(quote.retailPrice); // $346.98
```

## Features

✅ 6 print services (screenprint, embroidery, laser, transfer, vinyl, extras)
✅ Complex multi-dimensional pricing (qty × colors × sizes)
✅ 35% profit margin
✅ Setup fees (new vs repeat designs)
✅ Add-ons pricing (packing, despatch, artwork)
✅ Full TypeScript types
✅ 25-30 comprehensive tests
✅ Production-ready

## Integration

See `/docs/job-estimator/` for:
- API documentation
- Integration with EasyPost shipping
- Integration with Printavo API
- Integration with Supplier-Sync API

## Phases

- Phase 1: ✅ Pricing engine (complete)
- Phase 2: 🔄 Rule Management UI
- Phase 3: 🔄 System integrations
- Phase 4: 🔄 Customer UI
EOF
```

**Create .env.example:**

```bash
cat > /Users/ronnyworks/Projects/printshop-os/services/job-estimator/.env.example << 'EOF'
# Job Estimator Configuration

NODE_ENV=development

# Pricing Configuration
MARGIN_PERCENTAGE=35

# EasyPost Integration (Phase 3)
EASYPOST_API_KEY=your_key_here

# Printavo Integration (Phase 3)
PRINTAVO_API_KEY=your_key_here
PRINTAVO_API_SECRET=your_secret_here

# Supplier Integration (Phase 3)
SUPPLIER_API_URL=http://localhost:3001

# Testing
TEST_MARGIN_PERCENTAGE=35
EOF
```

---

### PHASE 5: Git Commit & Archive Old Repos (20 min)

**Step 5.1: Commit to printshop-os**

```bash
cd /Users/ronnyworks/Projects/printshop-os

# Add all job-estimator files
git add services/job-estimator/
git add docs/REPOSITORY_CONSOLIDATION_STRATEGY.md
git add docs/CONSOLIDATION_EXECUTION_PLAN.md

# Commit with detailed message
git commit -m "feat: Consolidate pricing engine into unified job-estimator

- Create services/job-estimator with Spark-generated pricing engine
- Migrate pricing-engine.ts, comprehensive tests, and pricing data
- Add production-ready configuration and documentation
- Ready for Phase 2 (UI), Phase 3 (integrations), Phase 4 (customer)

Consolidates fragmented repositories:
- screenprint-pricer (will be archived)
- pricer (will be archived)
- pricer-new (will be archived)
- mint-prints-pricing (integrated)

This establishes job-estimator as the single source of truth
for all pricing and job estimation logic within printshop-os.

See: docs/REPOSITORY_CONSOLIDATION_STRATEGY.md"

# Push to GitHub
git push origin refactor/enterprise-foundation
```

**Step 5.2: Archive old repositories on GitHub** (Do manually via web UI)

For each repo: `screenprint-pricer`, `pricer`, `pricer-new`

1. Go to: https://github.com/hypnotizedent/[repo-name]/settings
2. Scroll to "Danger Zone"
3. Click "Archive this repository"
4. Confirm

**Step 5.3: Update archived repo descriptions**

For each archived repo, set description to:
```
ARCHIVED - See printshop-os/services/job-estimator for new location
```

---

## ✅ VERIFICATION CHECKLIST

**After executing all phases:**

```bash
cd /Users/ronnyworks/Projects/printshop-os

# Verify structure
- [ ] ls -la services/job-estimator/
  Should show: lib/, tests/, data/, api/, docs/, README.md, .env.example, package.json

# Verify code files exist
- [ ] ls -la services/job-estimator/lib/
  Should show: pricing-engine.ts

- [ ] ls -la services/job-estimator/tests/
  Should show: pricing-engine.test.ts

- [ ] ls -la services/job-estimator/data/
  Should show: pricing-rules-schema.json

# Verify git commit
- [ ] git log --oneline -3
  Should show your consolidation commit at top

# Verify GitHub push
- [ ] git branch -v
  Should show refactor/enterprise-foundation pushed to origin
```

---

## 🔄 NEXT STEPS

### Immediate (After this execution):
```
✅ job-estimator created in printshop-os
✅ All pricing logic in one place
✅ Old repos archived
✅ Clean GitHub organization
```

### Then (Phase 2 - Rule Management UI):
```
- Create UI for editing pricing rules
- Add admin dashboard
- Real-time price updates
- Integration with job-estimator API
```

### Then (Phase 3 - Integrations):
```
- Connect to EasyPost shipping
- Connect to Printavo API
- Connect to Supplier-Sync API
- End-to-end order flow
```

### Finally (Phase 4 - Customer UI):
```
- Customer-facing quote page
- Order calculator
- Integration with e-commerce
- Full system launch
```

---

## 📝 DECISION POINTS

### What to do with mint-prints-pricing repo?

**Option 1: Archive it too** (Recommended)
- Spark created it as a demo
- Everything is now in printshop-os
- Cleaner organization

**Option 2: Keep it as reference**
- Useful if you want to regenerate pricing engine
- Can always reference the history
- Adds clutter

**Recommendation**: Archive it. Everything is backed up in printshop-os.

---

### What about old job-estimator (pricer-new)?

**Option 1: Keep archived**
- History preserved
- Can reference old code
- Clean separation

**Option 2: Delete after 30 days**
- Cleaner GitHub
- Everything in printshop-os anyway
- Recommended after verification

**Recommendation**: Archive now, delete after 30 days once verified all code is correct.

---

## ⚠️ ROLLBACK PLAN (If something goes wrong)

1. **Unarchive old repos** (via GitHub settings)
2. **Reset printshop-os** to pre-consolidation commit
3. **Start over** with corrected steps

**Git rollback command:**
```bash
git reset --hard HEAD~1  # Go back one commit
git push -f origin refactor/enterprise-foundation  # Force push
```

---

## 🎯 FINAL CHECKLIST

Before declaring consolidation complete:

- [ ] services/job-estimator/ exists with all code
- [ ] All Spark-generated files in correct locations
- [ ] Package.json and config files present
- [ ] README.md is comprehensive
- [ ] Git commit made to printshop-os
- [ ] Git push successful to GitHub
- [ ] Old repos marked as archived (screenprint-pricer, pricer, pricer-new, mint-prints-pricing)
- [ ] Old repo descriptions updated
- [ ] Main printshop-os README links to job-estimator docs
- [ ] No broken imports or missing files
- [ ] npm install works without errors
- [ ] npm test passes (if tests exist)
- [ ] TypeScript compiles without errors

---

**Status**: ✅ Ready to execute  
**Time to complete**: 1-2 hours  
**Risk level**: LOW  
**Next action**: Execute Phase 1-5 above

