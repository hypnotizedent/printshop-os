#!/bin/bash
# Export Printavo Data for Analysis
# This script exports a sample of orders and customers for schema analysis

set -e

echo "=== Printavo Data Export ==="
echo ""
echo "This script will export sample data from Printavo for analysis."
echo ""

# Prompt for credentials
read -p "Enter your Printavo email: " PRINTAVO_EMAIL
read -s -p "Enter your Printavo API token: " PRINTAVO_TOKEN
echo ""
echo ""

# Export credentials
export PRINTAVO_EMAIL
export PRINTAVO_TOKEN

# Create data directory
mkdir -p data/printavo-exports

echo "Exporting full backup (this may take a few minutes)..."
echo ""

# Run the backup script
cd "$(dirname "$0")/../lib/ptavo/examples"
node backup_printavo.js

# Move backups to our data directory
if [ -d "./backups" ]; then
    mv ./backups/* "$(dirname "$0")/../data/printavo-exports/"
    rmdir ./backups
    echo ""
    echo "✓ Data exported to: data/printavo-exports/"
fi

# Unset credentials
unset PRINTAVO_EMAIL
unset PRINTAVO_TOKEN

echo ""
echo "Export complete. Credentials cleared from memory."
echo ""
echo "Next steps:"
echo "  1. Review exported JSON files in data/printavo-exports/"
echo "  2. Analyze the schema structure"
echo "  3. Map fields to Strapi models"
