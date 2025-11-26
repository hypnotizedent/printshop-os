#!/usr/bin/env ts-node

/**
 * Upload transformed orders to Strapi
 * Reads from import-results/ and POSTs to Strapi API
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN; // Optional - for authentication
const BATCH_SIZE = 50; // Upload 50 orders at a time
const DELAY_MS = 100; // Delay between batches to avoid overwhelming Strapi

interface TransformedOrder {
  orderNumber: string;
  status: string;
  customer: any;
  items: any[];
  totalAmount: number;
  // ... other fields
}

async function uploadBatch(orders: TransformedOrder[], batchNum: number) {
  console.log(`📤 Uploading batch ${batchNum} (${orders.length} orders)...`);
  
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const order of orders) {
    try {
      await axios.post(`${STRAPI_URL}/api/orders`, {
        data: order
      }, { headers });
      successCount++;
    } catch (error: any) {
      errorCount++;
      console.error(`   ❌ Failed to upload order ${order.orderNumber}:`, error.response?.data?.error?.message || error.message);
    }
  }

  console.log(`   ✅ ${successCount} uploaded, ❌ ${errorCount} failed`);
  return { successCount, errorCount };
}

async function main() {
  const resultsDir = path.join(__dirname, '../import-results');
  
  if (!fs.existsSync(resultsDir)) {
    console.error(`❌ Import results directory not found: ${resultsDir}`);
    console.error('Run the import script first: npm run import:batch <file>');
    process.exit(1);
  }

  // Find all successful batch files
  const files = fs.readdirSync(resultsDir)
    .filter(f => f.startsWith('batch-') && f.includes('-successful-'))
    .sort();

  if (files.length === 0) {
    console.error('❌ No successful batch files found');
    process.exit(1);
  }

  console.log(`🚀 Starting Strapi upload...`);
  console.log(`📁 Found ${files.length} batch files`);
  console.log(`🎯 Strapi URL: ${STRAPI_URL}`);
  console.log('');

  let totalSuccess = 0;
  let totalErrors = 0;
  const startTime = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(resultsDir, file);
    const ordersData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Split into smaller batches
    for (let j = 0; j < ordersData.length; j += BATCH_SIZE) {
      const batch = ordersData.slice(j, j + BATCH_SIZE);
      const batchNum = Math.floor(j / BATCH_SIZE) + 1;
      const result = await uploadBatch(batch, i * 100 + batchNum);
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;
      
      // Small delay to avoid overwhelming Strapi
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log('\n✅ Upload Complete!');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Successfully uploaded: ${totalSuccess.toLocaleString()}`);
  console.log(`❌ Failed: ${totalErrors.toLocaleString()}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('');
  console.log('🎉 View your data at: http://localhost:1337/admin');
}

main().catch(console.error);
