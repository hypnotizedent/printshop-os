#!/usr/bin/env node
/**
 * Sync supplier products from JSONL files to Strapi CMS.
 * 
 * Usage:
 *   node sync-products-to-strapi.js [--supplier sanmar|ascolour|ssactivewear] [--limit N]
 *   
 * Example:
 *   node sync-products-to-strapi.js --supplier sanmar --limit 100
 *   node sync-products-to-strapi.js  # Sync all suppliers
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

// Supplier data paths
const SUPPLIER_DATA_PATHS = {
  sanmar: 'services/supplier-sync/data/ascolour/products.jsonl',
  ascolour: 'services/supplier-sync/data/ascolour/products.jsonl',
  ssactivewear: 'services/supplier-sync/data/ssactivewear/products.jsonl',
};

// Category mapping from supplier categories to Strapi enum
const CATEGORY_MAP = {
  't-shirts': 't-shirts',
  'tees': 't-shirts',
  'polo shirts': 'polos',
  'polos': 'polos',
  'sweatshirts': 'sweatshirts',
  'hoodies': 'sweatshirts',
  'fleece': 'sweatshirts',
  'jackets': 'jackets',
  'outerwear': 'jackets',
  'pants': 'pants',
  'shorts': 'shorts',
  'hats': 'hats',
  'caps': 'hats',
  'headwear': 'hats',
  'bags': 'bags',
  'accessories': 'accessories',
  'other': 'other',
};

/**
 * Read products from a JSONL file
 */
async function* readJsonlProducts(filepath) {
  const fileStream = fs.createReadStream(filepath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    if (line.trim()) {
      yield JSON.parse(line);
    }
  }
}

/**
 * Normalize supplier category to Strapi enum value
 */
function normalizeCategory(category) {
  if (!category) return 'other';
  const normalized = category.toLowerCase().trim();
  return CATEGORY_MAP[normalized] || 'other';
}

/**
 * Normalize supplier name to Strapi enum value
 */
function normalizeSupplier(supplier) {
  const supplierLower = (supplier || '').toLowerCase();
  if (supplierLower.includes('sanmar')) return 'sanmar';
  if (supplierLower.includes('ascolour') || supplierLower.includes('as colour')) return 'ascolour';
  if (supplierLower.includes('ssactivewear') || supplierLower.includes('s&s')) return 'ssactivewear';
  return 'sanmar'; // default
}

/**
 * Transform supplier product format to Strapi format
 */
function transformProduct(product) {
  // Clean HTML entities from name
  let name = product.name || '';
  name = name.replace(/&#174;/g, '®')
    .replace(/&#169;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'");
  
  return {
    sku: product.sku || '',
    name: name,
    brand: product.brand || '',
    category: normalizeCategory(product.category),
    supplier: normalizeSupplier(product.supplier),
    description: product.description || '',
    variants: product.variants || [],
    pricing: product.pricing || {},
    images: product.images || [],
    availability: product.availability || {},
    supplierProductId: (product.metadata && product.metadata.supplierProductId) || '',
    lastSyncedAt: new Date().toISOString(),
    isActive: product.availability ? product.availability.inStock : true,
  };
}

/**
 * Check if product already exists in Strapi by SKU
 */
async function checkProductExists(sku) {
  try {
    const url = `${STRAPI_URL}/api/products?filters[sku][$eq]=${encodeURIComponent(sku)}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }
    return null;
  } catch (error) {
    console.error(`  ⚠️  Error checking product ${sku}: ${error.message}`);
    return null;
  }
}

/**
 * Create a new product in Strapi
 */
async function createProduct(productData) {
  try {
    const response = await fetch(`${STRAPI_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: productData }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Failed to create ${productData.sku}: ${errorText.substring(0, 200)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`  ❌ Error creating ${productData.sku}: ${error.message}`);
    return false;
  }
}

/**
 * Update an existing product in Strapi
 */
async function updateProduct(productId, productData) {
  try {
    const response = await fetch(`${STRAPI_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: productData }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Failed to update ${productData.sku}: ${errorText.substring(0, 200)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`  ❌ Error updating ${productData.sku}: ${error.message}`);
    return false;
  }
}

/**
 * Main sync function
 */
async function syncProducts(supplier = null, limit = null) {
  console.log('🔄 Starting product sync to Strapi...');
  console.log(`   Strapi URL: ${STRAPI_URL}`);
  
  // Determine which files to process
  let paths;
  if (supplier) {
    if (!SUPPLIER_DATA_PATHS[supplier]) {
      console.error(`❌ Unknown supplier: ${supplier}`);
      return;
    }
    paths = { [supplier]: SUPPLIER_DATA_PATHS[supplier] };
  } else {
    paths = SUPPLIER_DATA_PATHS;
  }
  
  // Get project root
  const scriptDir = __dirname;
  const projectRoot = path.dirname(scriptDir);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };
  
  for (const [supplierName, relPath] of Object.entries(paths)) {
    const filepath = path.join(projectRoot, relPath);
    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  File not found: ${filepath}`);
      continue;
    }
    
    console.log(`\n📦 Processing ${supplierName} from ${relPath}...`);
    
    let count = 0;
    for await (const product of readJsonlProducts(filepath)) {
      if (limit && count >= limit) {
        console.log(`   Reached limit of ${limit} products`);
        break;
      }
      
      count++;
      const strapiProduct = transformProduct(product);
      
      // Check if product exists
      const existingId = await checkProductExists(strapiProduct.sku);
      
      if (existingId) {
        // Update existing product
        if (await updateProduct(existingId, strapiProduct)) {
          stats.updated++;
          if (count % 50 === 0) {
            console.log(`   ⬆️  Updated ${count} products...`);
          }
        } else {
          stats.errors++;
        }
      } else {
        // Create new product
        if (await createProduct(strapiProduct)) {
          stats.created++;
          if (count % 50 === 0) {
            console.log(`   ➕ Created ${count} products...`);
          }
        } else {
          stats.errors++;
        }
      }
    }
    
    console.log(`   ✅ Processed ${count} products from ${supplierName}`);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Sync Summary');
  console.log('='.repeat(50));
  console.log(`   Created: ${stats.created}`);
  console.log(`   Updated: ${stats.updated}`);
  console.log(`   Errors:  ${stats.errors}`);
  console.log(`   Total:   ${stats.created + stats.updated + stats.errors}`);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let supplier = null;
  let limit = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--supplier' && args[i + 1]) {
      supplier = args[i + 1];
      i++;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }
  
  return { supplier, limit };
}

// Run the sync
const { supplier, limit } = parseArgs();
syncProducts(supplier, limit).catch(console.error);
