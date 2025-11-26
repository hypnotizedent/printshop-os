# Data Directory Structure

This directory contains all operational data for PrintShop OS, organized into processing layers and asset storage.

## Directory Overview

```
data/
├── raw/              # Original exports (never modify)
├── processed/        # Cleaned data for Strapi import
├── intelligence/     # AI/analytics ready data
├── assets/           # File storage (images, artwork, labels)
├── products/         # Supplier product catalogs & images
└── strapi-imports/   # Direct Strapi import files
```

---

## 1. Raw Data (Bronze Layer)
`data/raw/`
- Contains original, immutable exports from source systems (Printavo, etc.)
- **NEVER** edit these files manually
- Used as the source of truth for all transformations
- Structure: `data/raw/{source}/{timestamp}/`

## 2. Processed Data (Silver Layer)
`data/processed/`
- Contains cleaned, normalized data ready for import into Strapi
- Transformed to match the destination schema
- Used by migration scripts
- Structure: `data/processed/{destination}/`

## 3. Intelligence Data (Gold Layer)
`data/intelligence/`
- Contains aggregated, summarized, and enriched data
- Optimized for LLM context windows and analytics
- Used by AI agents for financial guidance, CRM, and reporting

### Subdirectories:
- `context/`: Text/JSONL files small enough to fit in LLM prompts
- `vector_store/`: Embeddings for semantic search (future use)

---

## 4. Assets (File Storage)
`data/assets/`

File storage for production operations:

| Folder | Purpose | Status |
|--------|---------|--------|
| `printavo/` | Historical images from Printavo | ⏳ Pending |
| `artwork/` | Customer artwork uploads | ✅ Ready |
| `jobs/` | Production job files | ✅ Ready |
| `labels/` | Shipping labels (EasyPost) | ✅ Ready |

## 5. Products (Supplier Data)
`data/products/`

Product catalog and images from suppliers:

| Folder | Purpose | Status |
|--------|---------|--------|
| `images/sanmar/` | SanMar product photos | ⏳ Pending |
| `images/ss-activewear/` | S&S photos | ⏳ Pending |
| `images/as-colour/` | AS Colour photos | ⏳ Pending |
| `color-reference/` | Color matching data | ✅ Ready |

---

## Usage Guidelines

- **Migration:** Read from `raw`, write to `processed`
- **Analytics:** Read from `raw` or `processed`, write to `intelligence`
- **AI Agents:** Read from `intelligence`
- **File Storage:** Write to `assets/` (will sync to server)
- **Product Images:** Cache in `products/images/`

## Server Storage (Future)

When your server is ready:
1. Mount `/data/assets/` to server storage
2. Configure `UPLOAD_PATH` in Strapi
3. Run sync scripts to copy local → server

## Current Data Counts

| Content Type | Count | Source |
|-------------|-------|--------|
| Customers | 336 | Printavo 2025 |
| Orders | 831 | Printavo 2025 |
| Products | 18 | SanMar |
| Jobs | 0 | Pending |
| Employees | 2 | Test data |

