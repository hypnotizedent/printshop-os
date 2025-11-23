# Data Directory Structure

This directory contains all operational data for PrintShop OS, organized into three layers of processing.

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
- `context/`: Text/JSONL files small enough to fit in LLM prompts (e.g., `financial_summary.md`, `top_customers.jsonl`)
- `vector_store/`: Embeddings for semantic search (future use)

## Usage Guidelines

- **Migration:** Read from `raw`, write to `processed`
- **Analytics:** Read from `raw` or `processed`, write to `intelligence`
- **AI Agents:** Read from `intelligence`
