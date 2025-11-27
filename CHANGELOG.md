# Changelog

All notable changes to PrintShop OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Strapi Production Deployment** (Nov 27): Full deployment to docker-host R730XD via Tailscale
  - PostgreSQL 15, Redis 7, Strapi 5.31.2 Enterprise running
  - Removed AI SDK packages (ai, @ai-sdk/*) due to zod/v4 compatibility issues
  
- **S&S Activewear Integration** (Nov 27): Full API integration tested
  - 211K+ products accessible via REST API
  - Fixed transformer null handling for colors, sizes, inventory, images
  
- **SanMar SFTP Integration** (Nov 27): SFTP client ready for production
  - 494MB EPDD.csv available (full product catalog)
  - Fixed dotenv loading and file type preferences in sync CLI
  
- **Printavo Image URL Scrape** (Complete): 12,854 orders scraped
  - Resume-capable scraper with 20-order checkpoints
  - 66MB `orders_with_images.json` output file
  
- **Redis Caching Layer** (PR #104): Decorator pattern for supplier API caching, $500/month cost savings, 117 tests
- **Production Dashboard Config** (PR #102): Appsmith dashboard configuration, Strapi integration, sample data generators
- Initial repository structure and documentation
- Comprehensive README with project overview and architecture
- Full documentation suite in `/docs` folder
- GitHub issue templates (bug report, feature request, question)
- Pull request template
- Docker Compose reference configuration
- Environment variable templates
- MIT License
- Security policy
- Contributing guidelines

### Performance
- Reduced supplier API response times from 2.5s to <100ms (cached)
- Monthly API costs reduced from $800 to $300
- Cache hit rate target: 80%+
- Added graceful fallback if Redis unavailable

### Documentation
- Architecture documentation (system overview, data flow, component architecture)
- Phase-by-phase implementation guides (Strapi, Appsmith, Botpress)
- Deployment guides (Docker setup, environment configuration, disaster recovery)
- API documentation (Strapi endpoints, integration guide)

## [0.1.0-alpha] - 2025-11-21

### Added
- Project initialization
- Basic roadmap document
- Repository structure planning

### Notes
- This is the initial alpha release
- Project is in active development
- 60-day timeline to Level 1 MVP

---

## Version History Format

Each version entry should include:

### Added
- New features or capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fixes and error corrections

### Security
- Security vulnerability fixes and improvements

---

## Upcoming Milestones

### Level 1 MVP (Target: 60 days)
- [ ] Phase 1: Strapi (Central Database/API)
- [ ] Phase 2: Appsmith (Production Dashboard)
- [ ] Phase 3: Botpress (Customer Order Intake)

### Future Roadmap
- Finance module integration
- Marketing automation system
- Sales CRM component
- Advanced reporting and analytics
- Mobile application development
