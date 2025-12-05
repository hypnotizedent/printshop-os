#!/usr/bin/env node
/**
 * Strapi Data Import Script
 * 
 * Imports extracted Printavo data into Strapi CMS with:
 * - Upsert logic (update if exists by printavoId, create if new)
 * - Proper relationship handling (customers -> orders)
 * - Progress tracking and error logging
 * - Summary report generation
 * 
 * Usage:
 *   node strapi-import.js /app/data/printavo-final/full-2025-12-04T00-00-00
 *   node strapi-import.js                  # Uses most recent extraction
 * 
 * Environment Variables:
 *   STRAPI_URL - Strapi base URL (default: http://localhost:1337)
 *   STRAPI_API_TOKEN - Strapi API token for authentication
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
  strapiToken: process.env.STRAPI_API_TOKEN,
  batchSize: 10, // Process in batches to avoid overwhelming Strapi
  retryAttempts: 3
};

// ============================================================================
// HTTP Client Setup
// ============================================================================

function createStrapiClient() {
  if (!CONFIG.strapiToken) {
    throw new Error('STRAPI_API_TOKEN environment variable is required');
  }
  
  return axios.create({
    baseURL: `${CONFIG.strapiUrl}/api`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.strapiToken}`
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

// ============================================================================
// Data Transformation Functions
// ============================================================================

function transformCustomer(printavoCustomer) {
  const name = printavoCustomer.company || 
               `${printavoCustomer.firstName || ''} ${printavoCustomer.lastName || ''}`.trim() ||
               'Unknown Customer';
  
  // Generate placeholder email only if missing, using a safe format
  const email = printavoCustomer.email || 
                `noreply+printavo-${printavoCustomer.id}@printshop-migration.local`;
  
  return {
    printavoId: printavoCustomer.id,
    name: name,
    email: email,
    phone: printavoCustomer.phone || null,
    company: printavoCustomer.company || null,
    notes: printavoCustomer.internalNote || null,
    
    // Address fields (flattened from nested objects)
    address: printavoCustomer.billingAddress?.address1 || printavoCustomer.shippingAddress?.address1 || null,
    city: printavoCustomer.billingAddress?.city || printavoCustomer.shippingAddress?.city || null,
    state: printavoCustomer.billingAddress?.stateIso || printavoCustomer.shippingAddress?.stateIso || null,
    zipCode: printavoCustomer.billingAddress?.zipCode || printavoCustomer.shippingAddress?.zipCode || null,
    country: printavoCustomer.billingAddress?.country || printavoCustomer.shippingAddress?.country || null
  };
}

function transformOrder(printavoOrder, customerIdMap) {
  // Determine order type
  const isQuote = !printavoOrder.amountPaid && !printavoOrder.amountOutstanding;
  
  // Map Printavo status to Strapi status
  const statusMap = {
    'Quote': 'QUOTE',
    'Quote Sent': 'QUOTE_SENT',
    'Approved': 'QUOTE_APPROVED',
    'In Production': 'IN_PRODUCTION',
    'Complete': 'COMPLETE',
    'Ready for Pickup': 'READY_FOR_PICKUP',
    'Shipped': 'SHIPPED',
    'Payment Needed': 'PAYMENT_NEEDED',
    'Paid': 'INVOICE_PAID',
    'Cancelled': 'CANCELLED'
  };
  
  const printavoStatus = printavoOrder.status?.name || 'Quote';
  const strapiStatus = statusMap[printavoStatus] || 'QUOTE';
  
  // Get customer relationship
  const printavoCustomerId = printavoOrder.customer?.id;
  const strapiCustomerId = printavoCustomerId ? customerIdMap[printavoCustomerId] : null;
  
  return {
    printavoId: printavoOrder.id,
    visualId: printavoOrder.visualId,
    orderNumber: printavoOrder.visualId || printavoOrder.id,
    orderNickname: printavoOrder.nickname || null,
    status: strapiStatus,
    
    // Financial data
    totalAmount: parseFloat(printavoOrder.total || 0),
    amountPaid: parseFloat(printavoOrder.amountPaid || 0),
    amountOutstanding: parseFloat(printavoOrder.amountOutstanding || 0),
    salesTax: parseFloat(printavoOrder.salesTaxAmount || printavoOrder.taxTotal || 0),
    discount: parseFloat(printavoOrder.discountTotal || 0),
    
    // Dates
    dueDate: printavoOrder.customerDueAt,
    customerDueDate: printavoOrder.customerDueAt,
    paymentDueDate: printavoOrder.paymentDueAt,
    
    // Notes
    notes: printavoOrder.customerNote || null,
    productionNotes: printavoOrder.productionNote || null,
    
    // Addresses (stored as JSON)
    billingAddress: printavoOrder.billingAddress || null,
    shippingAddress: printavoOrder.shippingAddress || null,
    
    // Line items (stored as JSON for now)
    items: printavoOrder.lineItemGroups || null,
    
    // Relationships
    customer: strapiCustomerId || null,
    
    // Printavo metadata
    printavoCustomerId: printavoCustomerId,
    publicHash: printavoOrder.publicUrl ? printavoOrder.publicUrl.split('/').pop() : null
  };
}

// ============================================================================
// Strapi API Functions
// ============================================================================

async function findByPrintavoId(client, contentType, printavoId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.get(`/${contentType}`, {
        params: {
          filters: {
            printavoId: {
              $eq: printavoId
            }
          }
        }
      });
      
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      if (attempt === retries) {
        log('error', `Failed to find ${contentType} with printavoId ${printavoId}:`, error.message);
        return null;
      }
      await sleep(1000 * attempt);
    }
  }
}

async function createOrUpdate(client, contentType, data, printavoId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Check if exists
      const existing = await findByPrintavoId(client, contentType, printavoId);
      
      if (existing) {
        // Update
        const response = await client.put(`/${contentType}/${existing.id}`, {
          data: data
        });
        return { id: response.data.data.id, created: false };
      } else {
        // Create
        const response = await client.post(`/${contentType}`, {
          data: data
        });
        return { id: response.data.data.id, created: true };
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      log('warn', `Attempt ${attempt}/${retries} failed, retrying...`);
      await sleep(1000 * attempt);
    }
  }
}

// ============================================================================
// Import Functions
// ============================================================================

async function importCustomers(client, customers) {
  log('info', `Importing ${customers.length} customers...`);
  
  const stats = {
    total: customers.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: []
  };
  
  // Map of Printavo ID -> Strapi ID for relationship building
  const customerIdMap = {};
  
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    
    try {
      const transformed = transformCustomer(customer);
      const result = await createOrUpdate(client, 'customers', transformed, customer.id);
      
      if (result.created) {
        stats.created++;
      } else {
        stats.updated++;
      }
      
      customerIdMap[customer.id] = result.id;
      
      if ((i + 1) % 10 === 0) {
        log('info', `Progress: ${i + 1}/${customers.length} customers (${stats.created} created, ${stats.updated} updated)`);
      }
      
      // Rate limiting
      await sleep(100);
      
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        printavoId: customer.id,
        error: error.message
      });
      log('error', `Failed to import customer ${customer.id}:`, error.message);
    }
  }
  
  log('info', `✅ Customer import complete: ${stats.created} created, ${stats.updated} updated, ${stats.failed} failed`);
  
  return { stats, customerIdMap };
}

async function importOrders(client, orders, customerIdMap) {
  log('info', `Importing ${orders.length} orders...`);
  
  const stats = {
    total: orders.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    
    try {
      const transformed = transformOrder(order, customerIdMap);
      const result = await createOrUpdate(client, 'orders', transformed, order.id);
      
      if (result.created) {
        stats.created++;
      } else {
        stats.updated++;
      }
      
      if ((i + 1) % 10 === 0) {
        log('info', `Progress: ${i + 1}/${orders.length} orders (${stats.created} created, ${stats.updated} updated)`);
      }
      
      // Rate limiting
      await sleep(100);
      
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        printavoId: order.id,
        error: error.message
      });
      log('error', `Failed to import order ${order.id}:`, error.message);
    }
  }
  
  log('info', `✅ Order import complete: ${stats.created} created, ${stats.updated} updated, ${stats.failed} failed`);
  
  return stats;
}

// ============================================================================
// Main Import Logic
// ============================================================================

async function main() {
  const startTime = Date.now();
  
  log('info', '='.repeat(80));
  log('info', 'Strapi Data Import');
  log('info', '='.repeat(80));
  
  // Find source directory
  let sourceDir = process.argv[2];
  
  if (!sourceDir) {
    // Find most recent extraction
    const baseDir = '/app/data/printavo-final';
    if (!fs.existsSync(baseDir)) {
      log('error', `Base directory not found: ${baseDir}`);
      log('error', 'Please run printavo-extract.js first or provide a source directory');
      process.exit(1);
    }
    
    const dirs = fs.readdirSync(baseDir)
      .filter(name => fs.statSync(path.join(baseDir, name)).isDirectory())
      .sort()
      .reverse();
    
    if (dirs.length === 0) {
      log('error', 'No extraction directories found. Please run printavo-extract.js first');
      process.exit(1);
    }
    
    sourceDir = path.join(baseDir, dirs[0]);
    log('info', `Using most recent extraction: ${sourceDir}`);
  }
  
  if (!fs.existsSync(sourceDir)) {
    log('error', `Source directory not found: ${sourceDir}`);
    process.exit(1);
  }
  
  log('info', `Source: ${sourceDir}`);
  log('info', `Strapi URL: ${CONFIG.strapiUrl}`);
  log('info', '='.repeat(80));
  
  // Load data files
  const customersFile = path.join(sourceDir, 'customers.json');
  const ordersFile = path.join(sourceDir, 'orders.json');
  
  let customers = [];
  let orders = [];
  
  if (fs.existsSync(customersFile)) {
    customers = JSON.parse(fs.readFileSync(customersFile, 'utf8'));
    log('info', `Loaded ${customers.length} customers`);
  } else {
    log('warn', 'No customers.json found, skipping customer import');
  }
  
  if (fs.existsSync(ordersFile)) {
    orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
    log('info', `Loaded ${orders.length} orders`);
  } else {
    log('error', 'No orders.json found');
    process.exit(1);
  }
  
  // Create Strapi client
  const client = createStrapiClient();
  
  try {
    // Import in order: customers first (for relationships)
    let customerIdMap = {};
    
    if (customers.length > 0) {
      const customerResult = await importCustomers(client, customers);
      customerIdMap = customerResult.customerIdMap;
    }
    
    // Import orders
    const orderStats = await importOrders(client, orders, customerIdMap);
    
    // Generate summary
    const duration = (Date.now() - startTime) / 1000;
    const summary = {
      importedAt: new Date().toISOString(),
      duration: `${duration.toFixed(2)}s`,
      sourceDirectory: sourceDir,
      stats: {
        customers: customers.length > 0 ? {
          total: customers.length,
          // Stats already logged
        } : null,
        orders: orderStats
      }
    };
    
    const summaryFile = path.join(sourceDir, 'import-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    log('info', '='.repeat(80));
    log('info', '✅ Import Complete!');
    log('info', '='.repeat(80));
    log('info', `Duration: ${duration.toFixed(2)}s`);
    log('info', `Summary saved to: ${summaryFile}`);
    log('info', '='.repeat(80));
    
    process.exit(0);
    
  } catch (error) {
    log('error', 'Import failed:', error.message);
    log('error', 'Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main();
}

module.exports = { importCustomers, importOrders, transformCustomer, transformOrder };
