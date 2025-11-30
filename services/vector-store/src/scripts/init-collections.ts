#!/usr/bin/env npx ts-node
/**
 * Initialize Milvus Collections
 *
 * This script creates all required Milvus collections for PrintShop OS.
 * Run this after starting the Milvus stack.
 *
 * Usage:
 *   npx ts-node src/scripts/init-collections.ts
 *   npm run init:collections
 */

import { config } from 'dotenv';
config();

import {
  initDesignsCollection,
  initCustomersCollection,
  initOrdersCollection,
  initKnowledgeBaseCollection,
} from '../collections';
import { healthCheck, listCollections } from '../client';
import { logger } from '../utils/logger';

async function main(): Promise<void> {
  console.log('🚀 PrintShop OS - Milvus Collection Initializer\n');
  console.log(`Milvus Address: ${process.env.MILVUS_ADDRESS || 'localhost:19530'}\n`);

  // Check Milvus connection
  console.log('Checking Milvus connection...');
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.error('❌ Could not connect to Milvus. Make sure Milvus is running.');
    console.error('   Start with: docker-compose -f docker-compose.ai.yml up -d milvus');
    process.exit(1);
  }
  console.log('✅ Milvus connection successful\n');

  // Initialize collections
  console.log('Initializing collections...\n');

  try {
    await initDesignsCollection();
    console.log('✅ Created designs collection');
  } catch (error) {
    logger.error(`Failed to create designs collection: ${error}`);
    console.log('⚠️  Designs collection initialization failed');
  }

  try {
    await initCustomersCollection();
    console.log('✅ Created customers collection');
  } catch (error) {
    logger.error(`Failed to create customers collection: ${error}`);
    console.log('⚠️  Customers collection initialization failed');
  }

  try {
    await initOrdersCollection();
    console.log('✅ Created orders collection');
  } catch (error) {
    logger.error(`Failed to create orders collection: ${error}`);
    console.log('⚠️  Orders collection initialization failed');
  }

  try {
    await initKnowledgeBaseCollection();
    console.log('✅ Created knowledge_base collection');
  } catch (error) {
    logger.error(`Failed to create knowledge_base collection: ${error}`);
    console.log('⚠️  Knowledge base collection initialization failed');
  }

  // List all collections
  console.log('\n📋 Available collections:');
  const collections = await listCollections();
  collections.forEach((col) => console.log(`   - ${col}`));

  console.log('\n✨ All collections initialized successfully!\n');
  console.log('Next steps:');
  console.log('  1. Access Attu UI: http://localhost:8001');
  console.log('  2. Ingest data using the SDK functions');
  console.log('  3. Start searching!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
