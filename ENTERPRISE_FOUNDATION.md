# Enterprise Foundation - Reorganization Plan

## Current State
- `printshop-strapi/` - Strapi CMS (being set up locally, not yet in Git)
- `scripts/` - Utility scripts
- `printshop_os/` - Python module for shipping
- `services/` - AI customer service (Phase 4)

## Target State

### services/
- **api/** → Central Strapi API & Database
- **customer-service-ai/** → AI automation (already present)
- **metadata-extraction/** → Image scraper and data processors

### scripts/
- **utilities/** → Admin/CI scripts (stays at root)
- **transform/** → Data transformation (stays at root)

### packages/
- **shared/** → Common utilities

### docs/
- **architecture/** → System design
- **api/** → API documentation
- **deployment/** → Deployment guides

### tests/
- **unit/** → Unit tests
- **integration/** → Integration tests
- **e2e/** → End-to-end tests

## Implementation Strategy

### Phase 1: Foundation (Current)
- ✅ Generate `requirements.txt`
- Create directory structure
- Add `.README` files explaining each module

### Phase 2: Strapi Integration
- Move `printshop-strapi/` to `services/api/`
- Update environment configs
- Create Docker Compose for services

### Phase 3: Python Reorganization
- Move transform scripts to `services/metadata-extraction/`
- Create service entrypoints
- Update import paths

### Phase 4: Testing & Documentation
- Create test structure
- Update all docs to reflect new structure
- Ensure CI/CD still works

## Notes
- Keep backward compatibility during transition
- Tag major version when complete
- Document migration guide for Homelab deployments
