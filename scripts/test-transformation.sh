#!/bin/bash
# Test transformation with sample data

set -e

echo "🧪 Testing Printavo → Strapi transformation with sample data..."
echo ""

# Transform first 100 records
python3 scripts/transform_printavo_data.py 100

echo ""
echo "📁 Check the output files:"
echo "   data/strapi-imports/customers.json"
echo "   data/strapi-imports/jobs.json"
echo ""
echo "🔍 To view sample output:"
echo "   head -100 data/strapi-imports/customers.json"
echo "   head -100 data/strapi-imports/jobs.json"
