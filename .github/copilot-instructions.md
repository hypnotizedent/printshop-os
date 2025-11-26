# GitHub Copilot Instructions for PrintShop OS

## Project Context
PrintShop OS is an enterprise print shop management system replacing Printavo. This is a **monorepo** containing all services, frontend, and backend.

## Critical Rules

### 1. Single Source of Truth
Before creating ANYTHING, consult these files IN ORDER:
1. `SERVICE_DIRECTORY.md` - Where is everything?
2. `ARCHITECTURE.md` - How does it work?
3. `PROJECT_OVERVIEW.md` - What is this project?

**Never create files that duplicate information in these three documents.**

### 2. Service Structure (ONLY 4 ALLOWED)
```
services/
  ├── api/                    # Printavo sync, data import, order management
  ├── job-estimator/          # Pricing engine (JSON rules)
  ├── production-dashboard/   # WebSocket + REST for production floor
  └── supplier-sync/          # AS Colour, S&S, SanMar integrations
```

**If you're asked to create a 5th service, STOP and ask:**
- "Does this belong in an existing service?"
- "Is this actually needed, or is it already implemented?"

### 3. Documentation Rules
- **Root docs only:** Maximum 10 markdown files in project root
- **Everything else:** Goes in `docs/` with clear subdirectories
- **No duplicates:** Search before creating
- **No session reports:** Delete any "Session Summary" or "Implementation Report" files
- **Archive old stuff:** Anything older than 30 days → `docs/ARCHIVE_YYYY_MM_DD/`

### 4. Data Flow (Enterprise Pattern)
```
Printavo → services/api → Strapi CMS → Frontend
                    ↓
            services/job-estimator (pricing)
                    ↓
         services/production-dashboard (tracking)
```

**Never create alternate data flows without explicit approval.**

### 5. Technology Stack (NO EXCEPTIONS)
- **Backend:** Node.js + TypeScript
- **CMS:** Strapi 4.x (SQLite dev, PostgreSQL prod)
- **Frontend:** React 19 + Vite + TailwindCSS
- **API:** REST (Strapi auto-generated)
- **Real-time:** Socket.io (production-dashboard only)
- **Testing:** Jest + Vitest

**Do not introduce:** Python services, GraphQL, additional frameworks

### 6. File Naming Conventions
- Services: `kebab-case` (job-estimator, not JobEstimator)
- Components: `PascalCase.tsx` (CustomerForm.tsx)
- Utils: `camelCase.ts` (formatDate.ts)
- Tests: `*.test.ts` or `*.spec.ts`
- Types: `*.types.ts` or `types.ts`

### 7. Import/Export Patterns
```typescript
// Good - Absolute imports
import { Customer } from '@/types/customer';
import { formatCurrency } from '@/lib/utils';

// Bad - Relative imports across directories
import { Customer } from '../../../types/customer';
```

### 8. Code Before Documentation
When implementing features:
1. Write the code
2. Write tests
3. Update SERVICE_DIRECTORY.md (one line)
4. Done

**Do not create:** Epic documents, implementation plans, session summaries, roadmaps

### 9. Strapi Content Types
Current content types (DO NOT add without approval):
- `customer` - Customer records
- `order` - Orders and quotes
- `job` - Production jobs
- `color` - Ink and thread colors
- `sop` - Standard operating procedures
- `price-calculation` - Pricing results
- `pricing-rule` - Pricing rules (JSON)

**If you need a new content type, ask first.**

### 10. Environment Variables
All secrets go in `.env` files (gitignored):
- `printshop-strapi/.env` - Strapi secrets
- `services/*/env` - Service-specific secrets
- `.env.example` - Template (no actual values)

**Never commit actual API keys or secrets.**

## Common Pitfalls to Avoid

### ❌ DON'T DO THIS:
```bash
# Creating duplicate services
mkdir services/pricing  # Already have job-estimator

# Creating session reports
touch "Implementation_Session_Nov_26.md"

# Relative imports
import { thing } from '../../../../lib/thing'

# Adding frameworks
npm install graphql apollo-server

# Creating epic documents
touch "Epic_Customer_Portal_Phase_3.md"
```

### ✅ DO THIS INSTEAD:
```bash
# Use existing services
cd services/job-estimator

# Update single source of truth
echo "- Added pricing feature" >> SERVICE_DIRECTORY.md

# Absolute imports
import { thing } from '@/lib/thing'

# Use existing stack
# (no additional frameworks)

# Update existing docs
# Edit ARCHITECTURE.md inline
```

## When to Create New Files

### Always Ask First:
- New service
- New content type
- New database
- New framework/library

### Just Do It:
- Component in existing service
- Test file
- Utility function
- Bug fix
- One-line doc update

## Git Workflow

### Commit Messages:
```
feat(service-name): add feature
fix(service-name): fix bug
docs: update architecture
chore: cleanup old files
refactor(service-name): improve code
test(service-name): add tests
```

### Branch Names:
```
feature/short-description
fix/bug-name
chore/cleanup-task
```

**Never create:** `copilot/*` branches (those are automated)

## Verification Checklist

Before committing ANY code, verify:
- [ ] Does this duplicate existing functionality?
- [ ] Is this in the right service?
- [ ] Are imports using absolute paths?
- [ ] Are tests included?
- [ ] Is SERVICE_DIRECTORY.md updated (if structure changed)?
- [ ] Are there any new markdown files (should there be)?
- [ ] Does this follow the tech stack?

## Emergency Contacts

If you're confused about:
- **Where to put code** → Check `SERVICE_DIRECTORY.md`
- **How it works** → Check `ARCHITECTURE.md`
- **What this project is** → Check `PROJECT_OVERVIEW.md`

**If those docs don't answer your question, something is wrong with the docs, not you.**

## Model-Specific Notes

### For Claude/GPT:
- You tend to create implementation summaries → Don't do that
- You tend to ask permission → For small changes, just do it
- You tend to suggest alternatives → Stick to the tech stack above
- You tend to create epic docs → Update inline docs instead

### Remember:
This is an **enterprise platform**. That means:
- Stability over novelty
- Documentation over discussions
- Working code over perfect code
- Incremental progress over big rewrites

---

**Last Updated:** November 26, 2025  
**Maintainer:** @ronnyworks  
**Repo:** github.com/hypnotizedent/printshop-os
