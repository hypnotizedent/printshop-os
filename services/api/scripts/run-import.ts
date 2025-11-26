#!/usr/bin/env ts-node

/**
 * CLI wrapper for batch-import.ts
 * Usage: npm run import:historical <path-to-orders-json>
 */

import { runBatchImport } from './batch-import';
import * as path from 'path';

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('❌ Error: Please provide path to orders JSON file');
    console.error('Usage: npm run import:historical <path-to-orders-json>');
    console.error('Example: npm run import:historical /Users/ronnyworks/Projects/printshop-os/data/processed/orders_with_images.json');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  console.log(`🚀 Starting Printavo data import...`);
  console.log(`📁 Input file: ${absolutePath}`);
  console.log(`📊 Strapi URL: http://localhost:1337`);
  console.log('');

  try {
    const result = await runBatchImport(absolutePath, {
      batchSize: 1000,
      skipDuplicates: true,
      maxRetries: 3,
      logToFile: true,
    });

    console.log('\n✅ Import Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total Orders Processed: ${result.totalOrdersProcessed.toLocaleString()}`);
    console.log(`✅ Successful: ${result.totalSuccessful.toLocaleString()}`);
    console.log(`❌ Errors: ${result.totalErrors.toLocaleString()}`);
    console.log(`⚠️  Duplicates Skipped: ${result.totalDuplicates.toLocaleString()}`);
    console.log(`⏱️  Duration: ${Math.round((result.endTime!.getTime() - result.startTime.getTime()) / 1000)}s`);
    console.log(`📂 Results saved to: ${result.outputDirectory}`);
    console.log('');
    console.log('🎉 You can now view your data at: http://localhost:1337/admin');
    
  } catch (error) {
    console.error('\n❌ Import Failed!');
    console.error('═══════════════════════════════════════');
    console.error(error);
    process.exit(1);
  }
}

main();
