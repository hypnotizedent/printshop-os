#!/usr/bin/env ts-node
/**
 * AS Colour API Authentication Test
 * 
 * Tests the authentication flow to debug 401 errors.
 * 
 * Usage:
 *   cd services/supplier-sync
 *   npx ts-node test-scripts/test-ascolour-auth.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const BASE_URL = process.env.ASCOLOUR_BASE_URL || 'https://api.ascolour.com';
const SUBSCRIPTION_KEY = process.env.ASCOLOUR_SUBSCRIPTION_KEY || '';
const EMAIL = process.env.ASCOLOUR_EMAIL || '';
const PASSWORD = process.env.ASCOLOUR_PASSWORD || '';

async function testASColour() {
  console.log('========================================');
  console.log('AS Colour API Authentication Test');
  console.log('========================================\n');

  console.log('Configuration:');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Subscription Key: ${SUBSCRIPTION_KEY.substring(0, 8)}...`);
  console.log(`  Email: ${EMAIL}`);
  console.log(`  Password: ${'*'.repeat(PASSWORD.length)}\n`);

  // Test 1: Colours endpoint (no bearer token required)
  console.log('Test 1: GET /v1/catalog/colours (subscription-key only)');
  try {
    const res = await axios.get(`${BASE_URL}/v1/catalog/colours`, {
      headers: { 'Subscription-Key': SUBSCRIPTION_KEY },
      params: { pageNumber: 1, pageSize: 5 }
    });
    console.log(`  ✓ Success: ${res.data.data?.length || res.data?.length || 0} colours\n`);
  } catch (err: any) {
    console.log(`  ✗ Failed: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
    if (err.response?.status === 401) {
      console.log('  → Subscription key may be expired or invalid\n');
    }
  }

  // Test 2: Authentication endpoint
  console.log('Test 2: POST /v1/api/authentication (get bearer token)');
  let bearerToken: string | null = null;
  try {
    const res = await axios.post(`${BASE_URL}/v1/api/authentication`, 
      { email: EMAIL, password: PASSWORD },
      { headers: { 'Subscription-Key': SUBSCRIPTION_KEY } }
    );
    bearerToken = res.data.token || res.data.accessToken || res.data?.authorization;
    console.log(`  ✓ Success: Got bearer token (${bearerToken?.substring(0, 20)}...)\n`);
  } catch (err: any) {
    console.log(`  ✗ Failed: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
    console.log('  → Check email/password credentials');
    console.log('  → Response:', JSON.stringify(err.response?.data, null, 2), '\n');
  }

  // Test 3: Products endpoint (requires bearer token)
  console.log('Test 3: GET /v1/catalog/products (with bearer token)');
  if (bearerToken) {
    try {
      const res = await axios.get(`${BASE_URL}/v1/catalog/products`, {
        headers: { 
          'Subscription-Key': SUBSCRIPTION_KEY,
          'Authorization': `Bearer ${bearerToken}`
        },
        params: { pageNumber: 1, pageSize: 5 }
      });
      const products = res.data.data || res.data.products || res.data || [];
      console.log(`  ✓ Success: ${products.length} products`);
      if (products.length > 0) {
        console.log(`  Sample: ${products[0].styleCode} - ${products[0].styleName}\n`);
      }
    } catch (err: any) {
      console.log(`  ✗ Failed: ${err.response?.status} - ${err.response?.data?.message || err.message}\n`);
    }
  } else {
    console.log('  → Skipped (no bearer token)\n');
  }

  // Test 4: Products without bearer token (see what error we get)
  console.log('Test 4: GET /v1/catalog/products (subscription-key only, no bearer)');
  try {
    const res = await axios.get(`${BASE_URL}/v1/catalog/products`, {
      headers: { 'Subscription-Key': SUBSCRIPTION_KEY },
      params: { pageNumber: 1, pageSize: 5 }
    });
    const products = res.data.data || res.data.products || res.data || [];
    console.log(`  ✓ Success (no bearer needed): ${products.length} products\n`);
  } catch (err: any) {
    console.log(`  ✗ Failed: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
    if (err.response?.status === 401) {
      console.log('  → Products endpoint requires bearer token\n');
    }
  }

  // Test 5: Alternative header names
  console.log('Test 5: Testing alternative header names...');
  const altHeaders = ['Ocp-Apim-Subscription-Key', 'X-Api-Key', 'Api-Key'];
  for (const header of altHeaders) {
    try {
      const res = await axios.get(`${BASE_URL}/v1/catalog/colours`, {
        headers: { [header]: SUBSCRIPTION_KEY },
        params: { pageNumber: 1, pageSize: 1 }
      });
      console.log(`  ✓ ${header}: Works!`);
    } catch (err: any) {
      console.log(`  ✗ ${header}: ${err.response?.status || 'error'}`);
    }
  }

  console.log('\n========================================');
  console.log('Test Complete');
  console.log('========================================');
}

testASColour().catch(console.error);
