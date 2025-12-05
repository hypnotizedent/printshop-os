#!/usr/bin/env node
/**
 * Printavo Complete Data Extraction Script
 * 
 * This script extracts ALL data from Printavo V2 GraphQL API including:
 * - All orders (Invoices and Quotes) with full field data
 * - All customers with contacts and addresses
 * - Line items, imprints, files, and all nested relationships
 * 
 * Features:
 * - Handles Printavo's GraphQL complexity limit (25000) with small page sizes
 * - Rate limiting (600ms delay between requests)
 * - Progress logging
 * - Incremental extraction support (--since flag)
 * - Saves to timestamped directories for easy tracking
 * 
 * Usage:
 *   node printavo-extract.js                           # Full extraction
 *   node printavo-extract.js --since="2025-12-04"      # Incremental (orders since date)
 * 
 * Environment Variables:
 *   PRINTAVO_EMAIL - Your Printavo email
 *   PRINTAVO_TOKEN - Your Printavo API token
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { ORDER_QUERY, CUSTOMER_QUERY, INCREMENTAL_ORDER_QUERY } = require('./lib/printavo-queries');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  email: process.env.PRINTAVO_EMAIL,
  token: process.env.PRINTAVO_TOKEN,
  apiUrl: process.env.PRINTAVO_API_URL || 'https://www.printavo.com/api/v2',
  rateLimitMs: 600, // 600ms delay to respect rate limits
  orderPageSize: 5, // Small page size to stay under complexity limit
  customerPageSize: 25,
  timeout: 180000 // 3 minutes timeout
};

// Parse command line arguments
const args = process.argv.slice(2);
const sinceArg = args.find(arg => arg.startsWith('--since='));
const sinceDate = sinceArg ? sinceArg.split('=')[1] : null;

// ============================================================================
// HTTP Client Setup
// ============================================================================

function createClient() {
  return axios.create({
    baseURL: CONFIG.apiUrl,
    timeout: CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'email': CONFIG.email,
      'token': CONFIG.token
    }
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (level === 'error') {
    console.error(logMessage, data || '');
  } else {
    console.log(logMessage, data || '');
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log('info', `Created directory: ${dirPath}`);
  }
}

// ============================================================================
// GraphQL Query Execution
// ============================================================================

async function executeQuery(client, query, variables, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.post('', {
        query,
        variables
      });

      if (response.data.errors) {
        log('error', 'GraphQL errors:', response.data.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data;
    } catch (error) {
      log('error', `Query attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Exponential backoff
      const backoffMs = 1000 * Math.pow(2, attempt);
      log('info', `Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }
}

// ============================================================================
// Data Extraction Functions
// ============================================================================

async function extractOrders(client, outputDir, incremental = false) {
  log('info', incremental ? 'Extracting orders incrementally...' : 'Extracting all orders...');
  
  const allOrders = [];
  const invoices = [];
  const quotes = [];
  let cursor = null;
  let hasNextPage = true;
  let pageCount = 0;
  
  const query = incremental ? INCREMENTAL_ORDER_QUERY : ORDER_QUERY;
  const variables = {
    first: CONFIG.orderPageSize,
    after: null
  };
  
  if (incremental && sinceDate) {
    variables.since = new Date(sinceDate).toISOString();
    log('info', `Extracting orders updated since: ${variables.since}`);
  }

  while (hasNextPage) {
    try {
      variables.after = cursor;
      
      const data = await executeQuery(client, query, variables);
      const { pageInfo, nodes } = data.orders;
      
      pageCount++;
      log('info', `Fetched page ${pageCount} with ${nodes.length} orders`);
      
      // Separate invoices and quotes
      nodes.forEach(order => {
        if (order.__typename === 'Quote' || !order.amountPaid) {
          quotes.push(order);
        } else {
          invoices.push(order);
        }
        allOrders.push(order);
      });
      
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
      
      log('info', `Progress: ${allOrders.length} total orders (${invoices.length} invoices, ${quotes.length} quotes)`);
      
      // Rate limiting
      if (hasNextPage) {
        await sleep(CONFIG.rateLimitMs);
      }
      
    } catch (error) {
      log('error', `Failed to fetch orders page ${pageCount}:`, error.message);
      throw error;
    }
  }
  
  // Save results
  const ordersFile = path.join(outputDir, 'orders.json');
  const invoicesFile = path.join(outputDir, 'invoices.json');
  const quotesFile = path.join(outputDir, 'quotes.json');
  
  fs.writeFileSync(ordersFile, JSON.stringify(allOrders, null, 2));
  fs.writeFileSync(invoicesFile, JSON.stringify(invoices, null, 2));
  fs.writeFileSync(quotesFile, JSON.stringify(quotes, null, 2));
  
  log('info', `✅ Extracted ${allOrders.length} orders`);
  log('info', `   - ${invoices.length} invoices saved to: ${invoicesFile}`);
  log('info', `   - ${quotes.length} quotes saved to: ${quotesFile}`);
  
  return {
    total: allOrders.length,
    invoices: invoices.length,
    quotes: quotes.length
  };
}

async function extractCustomers(client, outputDir) {
  log('info', 'Extracting all customers...');
  
  const customers = [];
  let cursor = null;
  let hasNextPage = true;
  let pageCount = 0;
  
  while (hasNextPage) {
    try {
      const variables = {
        first: CONFIG.customerPageSize,
        after: cursor
      };
      
      const data = await executeQuery(client, CUSTOMER_QUERY, variables);
      const { pageInfo, nodes } = data.customers;
      
      pageCount++;
      log('info', `Fetched page ${pageCount} with ${nodes.length} customers`);
      
      customers.push(...nodes);
      
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
      
      log('info', `Progress: ${customers.length} total customers`);
      
      // Rate limiting
      if (hasNextPage) {
        await sleep(CONFIG.rateLimitMs);
      }
      
    } catch (error) {
      log('error', `Failed to fetch customers page ${pageCount}:`, error.message);
      throw error;
    }
  }
  
  // Save results
  const customersFile = path.join(outputDir, 'customers.json');
  fs.writeFileSync(customersFile, JSON.stringify(customers, null, 2));
  
  log('info', `✅ Extracted ${customers.length} customers to: ${customersFile}`);
  
  return {
    total: customers.length
  };
}

// ============================================================================
// Main Extraction Logic
// ============================================================================

async function main() {
  const startTime = Date.now();
  
  // Validate configuration
  if (!CONFIG.email || !CONFIG.token) {
    log('error', 'Missing required environment variables: PRINTAVO_EMAIL and PRINTAVO_TOKEN');
    process.exit(1);
  }
  
  log('info', '='.repeat(80));
  log('info', 'Printavo Data Extraction');
  log('info', '='.repeat(80));
  log('info', `API URL: ${CONFIG.apiUrl}`);
  log('info', `Email: ${CONFIG.email}`);
  log('info', `Mode: ${sinceDate ? `Incremental (since ${sinceDate})` : 'Full Extraction'}`);
  log('info', '='.repeat(80));
  
  // Setup output directory
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const outputDir = sinceDate 
    ? path.join('/app/data/printavo-final', `incremental-${timestamp}`)
    : path.join('/app/data/printavo-final', `full-${timestamp}`);
  
  ensureDirectory(outputDir);
  log('info', `Output directory: ${outputDir}`);
  
  // Create HTTP client
  const client = createClient();
  
  try {
    // Extract data
    const orderStats = await extractOrders(client, outputDir, !!sinceDate);
    
    let customerStats = { total: 0 };
    if (!sinceDate) {
      // Only extract customers on full migration (they don't change as often)
      customerStats = await extractCustomers(client, outputDir);
    } else {
      log('info', 'Skipping customer extraction in incremental mode');
    }
    
    // Create summary
    const duration = (Date.now() - startTime) / 1000;
    const summary = {
      extractedAt: new Date().toISOString(),
      mode: sinceDate ? 'incremental' : 'full',
      sinceDate: sinceDate || null,
      duration: `${duration.toFixed(2)}s`,
      stats: {
        orders: orderStats,
        customers: customerStats
      },
      outputDirectory: outputDir
    };
    
    const summaryFile = path.join(outputDir, 'summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    log('info', '='.repeat(80));
    log('info', '✅ Extraction Complete!');
    log('info', '='.repeat(80));
    log('info', `Duration: ${duration.toFixed(2)}s`);
    log('info', `Orders: ${orderStats.total} (${orderStats.invoices} invoices, ${orderStats.quotes} quotes)`);
    if (!sinceDate) {
      log('info', `Customers: ${customerStats.total}`);
    }
    log('info', `Output: ${outputDir}`);
    log('info', '='.repeat(80));
    
    process.exit(0);
    
  } catch (error) {
    log('error', 'Extraction failed:', error.message);
    log('error', 'Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the extraction
if (require.main === module) {
  main();
}

module.exports = { extractOrders, extractCustomers };
