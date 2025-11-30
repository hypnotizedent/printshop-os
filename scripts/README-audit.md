# PrintShop OS - Audit Script Documentation

## Overview

The `audit.sh` script generates comprehensive repository health reports, helping identify issues like stale branches, missing tests, orphaned documentation, and more.

## Quick Start

```bash
# Run full audit
./scripts/audit.sh

# Run with JSON output
./scripts/audit.sh --format json

# Run specific checks
./scripts/audit.sh --check branches --check tests

# Save to file
./scripts/audit.sh --output audit-report.md
```

## Installation

The script is already included in the repository. Ensure it's executable:

```bash
chmod +x scripts/audit.sh
chmod +x scripts/audit/*.sh
```

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Bash 4.0+** | macOS ships with Bash 3.2 - install via `brew install bash` |
| **Git** | Required for branch analysis |
| **bc** | Standard on macOS/Linux, used for size calculations |
| **jq** | Optional, improves package.json parsing accuracy |

#### macOS Users

macOS ships with Bash 3.2, which doesn't support associative arrays used by this script. Install a newer version:

```bash
# Install Bash 4+
brew install bash

# Run the audit with the new Bash
/usr/local/bin/bash scripts/audit.sh

# Or add to your PATH and use directly
# Add to ~/.zshrc or ~/.bashrc: export PATH="/usr/local/bin:$PATH"
```

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--format <format>` | Output format: `markdown` (default), `json`, `csv` | `--format json` |
| `--check <check>` | Run specific check (can repeat) | `--check branches` |
| `--output <file>` | Write to file instead of stdout | `--output report.md` |
| `--verbose` | Enable detailed logging | `--verbose` |
| `--no-color` | Disable terminal colors | `--no-color` |
| `--help` | Show help message | `--help` |

## Available Checks

### 1. Branches (`--check branches`)

Analyzes git branches for:
- **Local vs Remote branches**: Count of each type
- **Merged vs Unmerged**: Identifies branches not yet merged to main
- **Stale branches**: Branches with no commits in 30+ days
- **Ahead/Behind status**: Commits ahead/behind main for each branch

**Status Levels:**
- ✅ Good: No stale branches, few unmerged
- ⚠️ Warning: Some stale branches or many unmerged
- 🔴 Critical: 10+ stale branches

### 2. Tests (`--check tests`)

Inventories test files across the codebase:
- **Patterns scanned**: `*.test.ts`, `*.spec.ts`, `*_test.py`, `*.test.go`, etc.
- **Coverage matrix**: Test count by service/component
- **Missing tests**: Services without any test files

**Status Levels:**
- ✅ Good: All services have tests
- ⚠️ Warning: 1-3 services missing tests
- 🔴 Critical: 4+ services missing tests

### 3. Documentation (`--check docs`)

Checks documentation completeness:
- **README inventory**: Finds all README.md files
- **Missing READMEs**: Directories that should have documentation
- **Orphaned docs**: Files in docs/ not referenced elsewhere
- **SERVICE_DIRECTORY.md**: Verifies all services are documented

**Status Levels:**
- ✅ Good: All directories documented, no orphans
- ⚠️ Warning: Some missing READMEs or orphaned docs
- 🔴 Critical: SERVICE_DIRECTORY.md missing or many issues

### 4. TODOs (`--check todos`)

Scans for comment markers:
- **Patterns**: `TODO`, `FIXME`, `BUG`, `HACK`, `XXX`, `WARN`, `NOTE`
- **Priority**: `FIXME`, `BUG`, `HACK` are high priority
- **Grouping**: By file and category

**Status Levels:**
- ✅ Good: Few TODOs, no high-priority items
- ⚠️ Warning: Many TODOs or some high-priority
- 🔴 Critical: 10+ high-priority items

### 5. Dependencies (`--check deps`)

Analyzes dependency files:
- **Python**: `requirements.txt`, `requirements-*.txt`
- **Node.js**: `package.json` files
- **Lockfiles**: Checks for missing/stale lockfiles
- **Version pins**: Identifies unpinned dependencies

**Status Levels:**
- ✅ Good: All locked and pinned
- ⚠️ Warning: Some missing lockfiles or unpinned deps
- 🔴 Critical: Many missing lockfiles

### 6. Files (`--check files`)

Detects problematic files:
- **Large files**: Files over 1MB (warning) or 10MB (critical)
- **Committed artifacts**: node_modules, .venv, dist, etc.
- **Binary files**: Potentially problematic binaries

**Status Levels:**
- ✅ Good: No large files or artifacts
- ⚠️ Warning: Some large files
- 🔴 Critical: Committed node_modules or very large files

## Output Formats

### Markdown (default)

Human-readable report suitable for GitHub:

```markdown
# PrintShop OS - Repository Audit Report

**Generated:** 2025-11-29 10:30:00 UTC
**Commit:** abc1234

## Summary
| Category | Status | Issues |
|----------|--------|--------|
| Branches | ⚠️ Warning | 8 unmerged |
| Tests | 🔴 Critical | 3 services missing |
...
```

### JSON

Machine-parseable for CI integration:

```json
{
  "report": {
    "title": "PrintShop OS - Repository Audit Report",
    "generated": "2025-11-29 10:30:00 UTC",
    "commit": "abc1234"
  },
  "checks": [
    {
      "category": "branches",
      "status": "warning",
      "summary": {...}
    }
  ]
}
```

### CSV

For spreadsheet analysis:

```csv
# PrintShop OS - Repository Audit Report
# Generated: 2025-11-29 10:30:00 UTC
# --- branches ---
Branch,Last Commit,Days Stale,Ahead,Behind,Merged,Stale
feature/xyz,2025-11-01,28,5,2,false,false
```

## CI Integration

### GitHub Actions

```yaml
name: Repository Audit

on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for branch analysis
      
      - name: Run Audit
        run: |
          chmod +x scripts/audit.sh scripts/audit/*.sh
          ./scripts/audit.sh --format markdown --output audit-report.md
      
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: audit-report
          path: audit-report.md
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run quick audit checks
./scripts/audit.sh --check todos --check deps --no-color > /dev/null 2>&1
```

## Customization

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STALE_THRESHOLD_DAYS` | Days before branch is stale | 30 |
| `MAIN_BRANCH` | Main branch name | main |
| `LARGE_FILE_THRESHOLD` | Size in bytes for large file | 1048576 (1MB) |

### Example with Custom Settings

```bash
STALE_THRESHOLD_DAYS=60 MAIN_BRANCH=master ./scripts/audit.sh --check branches
```

## Architecture

```
scripts/
├── audit.sh              # Main entry point
└── audit/
    ├── utils.sh          # Shared utilities (colors, formatting)
    ├── branches.sh       # Branch analysis
    ├── tests.sh          # Test file inventory
    ├── docs.sh           # Documentation checks
    ├── todos.sh          # TODO/FIXME scanning
    ├── deps.sh           # Dependency analysis
    └── files.sh          # Large file detection
```

Each module in `audit/` can be run independently:

```bash
# Run just the branch check
source scripts/audit/utils.sh
source scripts/audit/branches.sh
run_branches_audit markdown
```

## Troubleshooting

### Script not executable

```bash
chmod +x scripts/audit.sh scripts/audit/*.sh
```

### "Not a git repository" error

Ensure you're running from within the git repository:

```bash
cd /path/to/printshop-os
./scripts/audit.sh
```

### Slow execution

For large repositories, run specific checks:

```bash
./scripts/audit.sh --check branches --check tests
```

### Missing colors

Colors are disabled when:
- Output is piped to a file
- `--no-color` flag is used
- `NO_COLOR` environment variable is set

## Performance

Typical execution times for a medium-sized repository:
- Full audit: 5-15 seconds
- Single check: 1-3 seconds

The script is designed to complete in under 30 seconds for typical repositories.

## Contributing

When adding new checks:

1. Create a new file in `scripts/audit/`
2. Follow the existing pattern:
   - Source `utils.sh`
   - Implement `output_<check>_markdown`, `output_<check>_json`, `output_<check>_csv`
   - Implement `run_<check>_audit` entry point
   - Include `__STATUS__:category:status:message` line for summary
3. Add the check name to `ALL_CHECKS` array in `audit.sh`
4. Update this README

## Related Documentation

- [REPOSITORY_AUDIT.md](../REPOSITORY_AUDIT.md) - Previous manual audit
- [SERVICE_DIRECTORY.md](../SERVICE_DIRECTORY.md) - Service locations
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design

---

**Last Updated:** November 29, 2025
