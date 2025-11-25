#!/usr/bin/env ts-node
import { ASColourClient } from '../../src/clients/as-colour.client';
import { logger } from '../../src/utils/logger';

async function testAuth() {
  const subscriptionKey = process.env.ASCOLOUR_SUBSCRIPTION_KEY || process.env.ASCOLOUR_API_KEY || '';
  const email = process.env.ASCOLOUR_EMAIL || '';
  const password = process.env.ASCOLOUR_PASSWORD || '';

  if (!subscriptionKey || !email || !password) {
    console.error('Missing credentials. Set ASCOLOUR_SUBSCRIPTION_KEY, ASCOLOUR_EMAIL, ASCOLOUR_PASSWORD in .env');
    process.exit(1);
  }

  const client = new ASColourClient({
    apiKey: subscriptionKey,
    baseURL: process.env.ASCOLOUR_BASE_URL,
  });

  console.log('Testing AS Colour API authentication and endpoints...\n');

  // Test 1: Try catalog without bearer token
  console.log('1. Testing catalog/colours without bearer token...');
  try {
    const colours = await client.listColours();
    console.log(`✓ Colours endpoint works without bearer! Fetched ${colours.length} colours.`);
    console.log('Sample:', colours.slice(0, 2));
  } catch (e: any) {
    console.log(`✗ Colours endpoint failed: ${e.response?.status} ${e.message}`);
  }

  // Test 2: Authenticate and get bearer token
  console.log('\n2. Authenticating with email/password...');
  try {
    const token = await client.authenticate(email, password);
    if (token) {
      console.log(`✓ Authentication successful! Bearer token obtained.`);
    } else {
      console.log('✗ Authentication failed (no token returned).');
      return;
    }
  } catch (e: any) {
    console.log(`✗ Authentication failed: ${e.response?.status} ${e.message}`);
    return;
  }

  // Test 3: Try catalog/products with bearer token
  console.log('\n3. Testing catalog/products with bearer token...');
  try {
    const products = await client.listProducts(1, 5);
    console.log(`✓ Products endpoint works! Fetched ${products.length} products (page 1, size 5).`);
    if (products.length > 0) {
      console.log('Sample product:', JSON.stringify(products[0], null, 2));
    }
  } catch (e: any) {
    console.log(`✗ Products endpoint failed: ${e.response?.status} ${e.message}`);
  }

  // Test 4: Try inventory
  console.log('\n4. Testing inventory/items...');
  try {
    const inventory = await client.listInventoryItems({ pageNumber: 1, pageSize: 3 });
    console.log(`✓ Inventory endpoint works! Fetched ${inventory.length} items.`);
    if (inventory.length > 0) {
      console.log('Sample inventory:', JSON.stringify(inventory[0], null, 2));
    }
  } catch (e: any) {
    console.log(`✗ Inventory endpoint failed: ${e.response?.status} ${e.message}`);
  }

  // Test 5: Health check
  console.log('\n5. Testing health check...');
  const healthy = await client.healthCheck();
  console.log(healthy ? '✓ Health check passed.' : '✗ Health check failed.');

  console.log('\n✓ All tests completed.');
}

testAuth().catch(err => {
  logger.error('Test auth script failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
