#!/usr/bin/env node
/**
 * Discover Top 500 Products from Printavo Line Items
 *
 * Analyzes the raw Printavo orders export to find the most frequently
 * used products, which can then be imported via supplier-sync.
 *
 * Usage: node scripts/discover-top-products.js
 * Output: data/intelligence/top-500-products.json
 */

const fs = require('fs');
const path = require('path');

async function discoverTopProducts() {
  // Look for raw Printavo exports first
  const rawExportPath = path.join(
    __dirname,
    '../data/raw/printavo-exports'
  );

  let ordersPath = null;

  // Find the most recent export directory
  if (fs.existsSync(rawExportPath)) {
    const exportDirs = fs
      .readdirSync(rawExportPath)
      .filter((d) => d.startsWith('printavo_'))
      .sort()
      .reverse();

    if (exportDirs.length > 0) {
      const latestExport = path.join(rawExportPath, exportDirs[0], 'orders.json');
      if (fs.existsSync(latestExport)) {
        ordersPath = latestExport;
      }
    }
  }

  if (!ordersPath) {
    console.error('❌ Printavo orders export not found');
    console.log('   Expected location: data/raw/printavo-exports/printavo_*/orders.json');
    process.exit(1);
  }

  console.log('📊 Loading orders from Printavo export...');
  console.log(`   Source: ${ordersPath}`);

  const rawData = fs.readFileSync(ordersPath, 'utf-8');
  const orders = JSON.parse(rawData);

  console.log(`   Found ${orders.length} orders`);

  // Count product usage
  const productMap = new Map();
  let totalLineItems = 0;

  for (const order of orders) {
    const lineItems = order.lineitems_attributes || [];

    for (const item of lineItems) {
      totalLineItems++;

      const styleNumber = (item.style_number || '').toUpperCase().trim();
      const styleName = item.style_description || 'Unknown Product';
      const quantity = item.total_quantities || 1;
      const category = item.category || 'Unknown';
      const color = item.color || '';

      // Skip items with no style number
      if (!styleNumber) {
        continue;
      }

      const key = styleNumber;

      if (productMap.has(key)) {
        const existing = productMap.get(key);
        existing.orderCount++;
        existing.totalQuantity += quantity;
        existing.categories.add(category);
        if (color) existing.sampleColors.add(color);
        // Update lastUsed if this order is more recent
        if (order.created_at && (!existing.lastUsed || order.created_at > existing.lastUsed)) {
          existing.lastUsed = order.created_at;
        }
      } else {
        productMap.set(key, {
          styleNumber: key,
          styleName: styleName,
          orderCount: 1,
          totalQuantity: quantity,
          lastUsed: order.created_at,
          categories: new Set([category]),
          sampleColors: color ? new Set([color]) : new Set(),
        });
      }
    }
  }

  console.log(`   Processed ${totalLineItems} line items`);

  // Sort by order count (frequency of use)
  const sorted = Array.from(productMap.values())
    .sort((a, b) => b.orderCount - a.orderCount);

  const top500 = sorted.slice(0, 500);

  // Convert Sets to arrays for JSON output
  const outputProducts = top500.map((p) => ({
    styleNumber: p.styleNumber,
    styleName: p.styleName,
    orderCount: p.orderCount,
    totalQuantity: p.totalQuantity,
    lastUsed: p.lastUsed,
    categories: Array.from(p.categories),
    sampleColors: Array.from(p.sampleColors).slice(0, 5), // Limit to 5 sample colors
  }));

  // Output results
  const outputDir = path.join(__dirname, '../data/intelligence');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'top-500-products.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceFile: ordersPath,
        totalOrders: orders.length,
        totalLineItems: totalLineItems,
        totalUniqueProducts: productMap.size,
        top500Count: top500.length,
        products: outputProducts,
      },
      null,
      2
    )
  );

  console.log('\n✅ Top 500 Products Discovery Complete!');
  console.log(`   Total unique products: ${productMap.size}`);
  console.log(`   Output: ${outputPath}`);
  console.log('\n📋 Top 20 Most Used Products:');
  console.log('─'.repeat(80));

  top500.slice(0, 20).forEach((p, i) => {
    const rank = String(i + 1).padStart(2);
    const style = p.styleNumber.padEnd(15);
    const orders = String(p.orderCount).padStart(4);
    const qty = String(p.totalQuantity).padStart(6);
    const name = p.styleName.replace(/\r?\n/g, ' ').slice(0, 35);
    console.log(`${rank}. ${style} | ${orders} orders | ${qty} units | ${name}`);
  });

  console.log('\n💡 Next Steps:');
  console.log('   1. Review data/intelligence/top-500-products.json');
  console.log('   2. Use supplier-sync to import these products to Strapi');
  console.log('   3. Run: npm run curate:import (in services/supplier-sync)');
}

discoverTopProducts().catch(console.error);
