#!/usr/bin/env npx ts-node
/**
 * Initialize Milvus Vector Collections
 *
 * This script initializes all Milvus collections for PrintShop OS.
 * Run after starting the Milvus stack with docker-compose.
 *
 * Usage:
 *   npx ts-node scripts/init-vector-collections.ts
 *
 * Prerequisites:
 *   1. Milvus stack running: docker-compose -f docker-compose.ai.yml up -d
 *   2. OpenAI API key set in environment: OPENAI_API_KEY
 */

import { config } from 'dotenv';
config();

// Change to vector-store service directory for proper module resolution
process.chdir(__dirname + '/../services/vector-store');

async function main() {
  console.log('🚀 PrintShop OS - Milvus Vector Collection Initializer\n');

  // Dynamic import after changing directory
  const { initAllCollections, checkHealth, listCollections } = await import(
    '../services/vector-store/src/index'
  );

  // Check health
  const health = await checkHealth();
  if (!health.healthy) {
    console.error('❌ Milvus connection failed.');
    console.error('   Make sure Milvus is running:');
    console.error('   docker-compose -f docker-compose.ai.yml up -d etcd milvus-minio milvus attu');
    process.exit(1);
  }
  console.log('✅ Milvus connection successful\n');

  // Initialize all collections
  console.log('Initializing collections...\n');
  await initAllCollections();

  // List collections
  console.log('\n📋 Available collections:');
  const collections = await listCollections();
  collections.forEach((col) => console.log(`   - ${col}`));

  console.log('\n✨ Initialization complete!\n');
  console.log('Next steps:');
  console.log('  1. Access Attu UI: http://localhost:8001');
  console.log('  2. Ingest data: npm run --prefix services/vector-store start');
  console.log('  3. See docs/VECTOR_DATABASE.md for usage examples\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
