# Color Taxonomy & Integration Guide

Last Updated: 2025-11-25
Status: Draft (Initial Implementation)

## Purpose
Establish a unified, canonical representation for all production color assets (inks, threads, and future substrates) to support quoting, production scheduling, supplier normalization, and AI guidance.

## Scope
- Ingestion of external catalogs: ink-colors, thread-colors.
- Normalization to internal `ColorSpecification` format.
- Deduplication, slug generation, brand/vendor mapping.
- Future: cross-reference (Pantone, supplier SKU), usage constraints, similarity search.

## Canonical Schema (TypeScript Interface)
See `lib/ptavo/colors/types.ts` for source of truth.

Key fields:
- `id`: Stable UUID (generated once; persisted in Strapi).
- `slug`: Deterministic, lowercase slug (`{medium}-{vendor}-{normalized-name}`).
- `name`: Display name (original casing trimmed).
- `medium`: `"ink" | "thread"` (extendable: `"vinyl"`, `"dye"`).
- `vendor`: External provider or catalog origin (e.g. `"acme"`, `"manufacturerX"`).
- `hex`: Hex color code (#RRGGBB) canonicalized.
- `lab`: CIE LAB triplet (computed downstream; optional at ingestion phase).
- `finish`: Optional (e.g. `"plastisol"`, `"water-based"`, `"polyester"`).
- `tags`: Free-form classification (e.g. `["neon", "metallic"]`).
- `pantone`: Optional cross-reference string.
- `usageConstraints`: Structured limits (fabric types, min line weight).
- `similar`: Array of slugs for nearest neighbors (populated after similarity job).
- `meta`: Source-specific raw fragments (key-value).
- `createdAt` / `updatedAt`: Timestamps.

## Normalization Rules
1. Trim + collapse internal whitespace in names.
2. Strip trademark symbols (™, ®) for normalization (retain original in `meta.originalName`).
3. Lowercase vendor id and normalize spaces → hyphens.
4. Validate hex with regex `^#?[0-9A-Fa-f]{6}$`; prepend `#` if missing.
5. Generate slug before persistence; ensure uniqueness (append numeric suffix if collision).
6. Deduplicate: If same medium + normalized name + identical hex → merge tags and meta sources.
7. Disallow unknown mediums (strict enumeration). Future mediums require explicit decision + doc update.

## File & Directory Layout
```
data/raw/colors/
  ink-catalog.json      ← external raw (copy from attachments)
  thread-catalog.json   ← external raw (copy from attachments)
lib/ptavo/colors/
  types.ts              ← interfaces + helpers
services/supplier-sync/scripts/
  import_colors.ts      ← ingestion + normalization script
```
Processed output:
```
data/processed/colors/colors.jsonl           ← canonical list (one JSON object per line)
data/processed/colors/catalog-manifest.json  ← hash + counts + version metadata
```

## Ingestion Pipeline (import_colors.ts)
Steps:
1. Load raw JSON catalogs (ink + thread).
2. Map vendor-specific fields to canonical schema.
3. Normalize + deduplicate into in-memory map.
4. Emit JSONL + manifest (counts, SHA256 hash per source, timestamp).
5. (Optional) Seed Strapi via REST or GraphQL batch (later phase).

CLI usage (planned):
```
node services/supplier-sync/scripts/import_colors.ts \
  --ink data/raw/colors/ink-catalog.json \
  --thread data/raw/colors/thread-catalog.json \
  --out data/processed/colors/colors.jsonl \
  --manifest data/processed/colors/catalog-manifest.json \
  --dry-run
```

Flags:
- `--dry-run`: Perform all transformations, print summary, skip writing files.
- `--limit <n>`: Process only first N records (debugging).
- `--recompute-lab`: Force LAB conversion (if cached values exist).

## Similarity (Deferred)
After baseline ingestion, a batch job computes LAB values + DeltaE 2000 between colors for nearest-neighbor suggestions. Deferred until base set stable. Will populate `similar` field with top K (e.g. 5) nearest distinct colors.

## Strapi Integration (Phase 2)
- Create/extend content types: `ink-color`, `thread-color` OR unify under a generic `color` with `medium` enumeration.
- Add uniqueness constraint on `slug`.
- Add index on `(medium, vendor, hex)` for fast lookup.
- Use bulk create/update with conflict resolution (slug key).

## Error Handling Strategy
- Validation failures accumulate; abort if >0 blocking errors (invalid hex, unknown medium).
- Non-blocking warnings (duplicate merges, trimmed names) logged to console + summary.
- Exit codes: 0 success, 2 validation errors, 3 I/O failures.

## Logging & Metrics (Phase 2)
Expose counters (Prometheus style) from the supplier-sync service:
- `colors_ingested_total`
- `colors_duplicates_merged_total`
- `colors_strapi_upserts_total`
- `colors_ingest_duration_seconds`

## Deployment & Operations
- Ingestion scheduled weekly or when upstream catalogs change.
- Manifest diff used to detect additions/removals; raise warning if removal rate >5% (possible upstream restructuring).
- All operations logged in `DEVELOPMENT_LOG.md` (foundation guideline).

## Future Extensions
| Feature | Description | Priority |
|---------|-------------|----------|
| LAB computation | Convert hex → LAB for similarity | Medium |
| Pantone mapping | External cross-ref dataset | Low |
| Fabric constraints | Filter colors per garment type | High |
| Version API | Expose catalog version & manifest | Medium |
| AI suggestions | Recommend nearest brand-compliant colors | Medium |

## Change Management
Any schema or process change must:
1. Update this doc (field definitions, rules).
2. Modify `types.ts` interfaces.
3. Append note to `CHANGELOG.md` under "Color Catalog" section.
4. Log implementation detail in `DEVELOPMENT_LOG.md`.

## Security & Integrity
- No executable content; JSON only.
- Validate hex to prevent injection in dynamic UI styling.
- Avoid storing arbitrary untrusted text without sanitization (Pantone notes, vendor descriptions).

---
Maintainer: Engineering Team
Next Review: 2026-Q1
