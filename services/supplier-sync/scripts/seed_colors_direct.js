#!/usr/bin/env node
/**
 * Direct Strapi database seeder for colors
 * Run this from printshop-strapi directory: node ../services/supplier-sync/scripts/seed_colors_direct.js
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function main() {
  // Load Strapi
  const strapi = require('@strapi/strapi');
  const app = await strapi({ distDir: path.join(__dirname, '../../../printshop-strapi/dist') }).load();

  const filePath = process.argv[2] || path.join(__dirname, '../../../data/processed/colors/colors.jsonl');
  
  console.log(`Reading colors from: ${filePath}`);
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let processed = 0;
  let created = 0;
  let updated = 0;
  let failed = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const color = JSON.parse(line);
      processed++;

      // Check if exists by slug
      const existing = await strapi.documents('api::color.color').findMany({
        filters: { slug: color.slug },
        limit: 1
      });

      if (existing && existing.length > 0) {
        // Update
        await strapi.documents('api::color.color').update({
          documentId: existing[0].documentId,
          data: color
        });
        updated++;
        console.log(`Updated: ${color.slug}`);
      } else {
        // Create
        await strapi.documents('api::color.color').create({
          data: color
        });
        created++;
        console.log(`Created: ${color.slug}`);
      }
    } catch (err) {
      failed++;
      console.error(`Error processing line ${processed}:`, err.message);
    }
  }

  console.log('\n--- Seeding Complete ---');
  console.log(`Processed: ${processed}`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);

  await strapi.destroy();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
