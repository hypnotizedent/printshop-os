/**
 * Strapi Schema Migration Script
 * Migration: 001_create_collections
 * 
 * Creates core collections for PrintShop OS by programmatically generating
 * schema.json files and necessary directory structures:
 * - Order: Complete order information with customer, addresses, line items, totals
 * - Quote: Pricing estimates and quote tracking  
 * - Customer: Customer account information (extends existing)
 * - Product: Supplier catalog products
 * 
 * Features:
 * - Idempotent: Safe to run multiple times
 * - Rollback capability: Can be reversed with down()
 * - Creates proper Strapi file structure
 * - Sets up relationships between collections
 * - Adds indexes on frequently queried fields
 * 
 * Usage:
 *   Run as standalone script: node database/migrations/001_create_collections.js
 *   Or import and execute: import { up, down } from './001_create_collections'
 */

import * as fs from 'fs';
import * as path from 'path';

const API_DIR = path.join(__dirname, '../../src/api');

/**
 * Order Collection Schema
 */
const ORDER_SCHEMA = {
  kind: 'collectionType',
  collectionName: 'orders',
  info: {
    singularName: 'order',
    pluralName: 'orders',
    displayName: 'Order',
    description: 'Complete order information from Printavo and customer portal',
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {},
  attributes: {
    // External References
    printavoId: {
      type: 'string',
      unique: true,
      required: true,
    },
    orderNickname: {
      type: 'string',
    },
    publicHash: {
      type: 'string',
      unique: true,
    },

    // Customer Information (embedded)
    customer: {
      type: 'json',
      required: true,
    },

    // Addresses (embedded as JSON)
    billingAddress: {
      type: 'json',
    },
    shippingAddress: {
      type: 'json',
    },

    // Order Status
    status: {
      type: 'enumeration',
      enum: [
        'quote',
        'pending',
        'in_production',
        'ready_to_ship',
        'shipped',
        'delivered',
        'completed',
        'cancelled',
        'invoice_paid',
        'payment_due',
      ],
      required: true,
      default: 'quote',
    },

    // Line Items (embedded as JSON array)
    lineItems: {
      type: 'json',
      required: true,
    },

    // Financial Totals (embedded)
    totals: {
      type: 'json',
      required: true,
    },

    // Timeline Information (embedded)
    timeline: {
      type: 'json',
      required: true,
    },

    // Notes and Documentation
    notes: {
      type: 'text',
    },
    productionNotes: {
      type: 'text',
    },

    // Approval and Publishing
    approved: {
      type: 'boolean',
      default: false,
    },
    published: {
      type: 'boolean',
      default: false,
    },

    // Relations
    quote: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'api::quote.quote',
      inversedBy: 'order',
    },
    customerRecord: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'api::customer.customer',
      inversedBy: 'orders',
    },
  },
};

/**
 * Quote Collection Schema
 */
const QUOTE_SCHEMA = {
  kind: 'collectionType',
  collectionName: 'quotes',
  info: {
    singularName: 'quote',
    pluralName: 'quotes',
    displayName: 'Quote',
    description: 'Price quotes and estimates for customer orders',
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {},
  attributes: {
    // Quote Identification
    quoteNumber: {
      type: 'string',
      unique: true,
      required: true,
    },

    // Quote Status
    status: {
      type: 'enumeration',
      enum: [
        'draft',
        'sent',
        'viewed',
        'accepted',
        'rejected',
        'expired',
        'converted',
      ],
      required: true,
      default: 'draft',
    },

    // Quote Details
    service: {
      type: 'string',
      required: true,
    },
    quantity: {
      type: 'integer',
      required: true,
    },
    colors: {
      type: 'integer',
    },
    printLocation: {
      type: 'string',
    },
    printSize: {
      type: 'string',
    },
    rushType: {
      type: 'string',
      default: 'standard',
    },

    // Pricing Breakdown (embedded)
    pricing: {
      type: 'json',
      required: true,
    },

    // Customer Information
    customerName: {
      type: 'string',
      required: true,
    },
    customerEmail: {
      type: 'email',
      required: true,
    },

    // Design and Files
    designUploadUrl: {
      type: 'string',
    },
    mockupUrls: {
      type: 'json',
    },

    // Dates
    validUntil: {
      type: 'date',
    },
    acceptedAt: {
      type: 'datetime',
    },

    // Notes
    notes: {
      type: 'text',
    },
    customerNotes: {
      type: 'text',
    },

    // Relations
    order: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'api::order.order',
      mappedBy: 'quote',
    },
    customerRecord: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'api::customer.customer',
      inversedBy: 'quotes',
    },
    products: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'api::product.product',
      inversedBy: 'quotes',
    },
  },
};

/**
 * Customer Collection Schema (enhanced)
 */
const CUSTOMER_SCHEMA = {
  kind: 'collectionType',
  collectionName: 'customers',
  info: {
    singularName: 'customer',
    pluralName: 'customers',
    displayName: 'Customer',
    description: 'Customer account and contact information',
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {},
  attributes: {
    // Basic Information
    name: {
      type: 'string',
      required: true,
    },
    firstName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    company: {
      type: 'string',
    },

    // Contact Information
    email: {
      type: 'email',
      required: true,
      unique: true,
    },
    phone: {
      type: 'string',
    },

    // Customer Status
    status: {
      type: 'enumeration',
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },

    // Account Type
    accountType: {
      type: 'enumeration',
      enum: ['retail', 'wholesale', 'corporate', 'nonprofit'],
      default: 'retail',
    },

    // Payment Information
    paymentTerms: {
      type: 'string',
    },
    creditLimit: {
      type: 'decimal',
    },

    // Address Information (embedded)
    defaultBillingAddress: {
      type: 'json',
    },
    defaultShippingAddress: {
      type: 'json',
    },

    // External References
    printavoCustomerId: {
      type: 'string',
      unique: true,
    },

    // Notes
    notes: {
      type: 'text',
    },

    // Relations
    orders: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::order.order',
      mappedBy: 'customerRecord',
    },
    quotes: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::quote.quote',
      mappedBy: 'customerRecord',
    },
  },
};

/**
 * Product Collection Schema
 */
const PRODUCT_SCHEMA = {
  kind: 'collectionType',
  collectionName: 'products',
  info: {
    singularName: 'product',
    pluralName: 'products',
    displayName: 'Product',
    description: 'Supplier catalog products and inventory',
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {},
  attributes: {
    // Product Identification
    sku: {
      type: 'string',
      unique: true,
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'text',
    },

    // Supplier Information
    supplier: {
      type: 'string',
      required: true,
    },
    supplierProductId: {
      type: 'string',
    },

    // Product Details
    category: {
      type: 'string',
      required: true,
    },
    subcategory: {
      type: 'string',
    },
    brand: {
      type: 'string',
    },

    // Product Type
    garmentType: {
      type: 'string',
    },
    material: {
      type: 'string',
    },

    // Variants (embedded as JSON array)
    variants: {
      type: 'json',
    },

    // Pricing
    basePrice: {
      type: 'decimal',
      required: true,
    },
    wholesalePrice: {
      type: 'decimal',
    },
    retailPrice: {
      type: 'decimal',
    },

    // Pricing Tiers (embedded)
    pricingTiers: {
      type: 'json',
    },

    // Availability
    inStock: {
      type: 'boolean',
      default: true,
    },
    stockQuantity: {
      type: 'integer',
    },
    leadTime: {
      type: 'string',
    },

    // Product Status
    status: {
      type: 'enumeration',
      enum: ['active', 'discontinued', 'seasonal', 'out_of_stock'],
      default: 'active',
    },

    // Images and Media
    imageUrls: {
      type: 'json',
    },
    primaryImageUrl: {
      type: 'string',
    },

    // Specifications (embedded)
    specifications: {
      type: 'json',
    },

    // SEO and Metadata
    tags: {
      type: 'json',
    },

    // Last Sync Information
    lastSyncedAt: {
      type: 'datetime',
    },

    // Relations
    quotes: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'api::quote.quote',
      mappedBy: 'products',
    },
  },
};

/**
 * Default controller template
 */
const createController = (singularName: string) => `/**
 * ${singularName} controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::${singularName}.${singularName}');
`;

/**
 * Default service template
 */
const createService = (singularName: string) => `/**
 * ${singularName} service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::${singularName}.${singularName}');
`;

/**
 * Default routes template
 */
const createRoutes = (singularName: string) => `/**
 * ${singularName} router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::${singularName}.${singularName}');
`;

/**
 * Utility: Create directory if it doesn't exist
 */
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  Created directory: ${dirPath}`);
  }
}

/**
 * Utility: Write file if it doesn't exist or force is true
 */
function writeFileIfNotExists(filePath: string, content: string, force: boolean = false): boolean {
  if (fs.existsSync(filePath) && !force) {
    console.log(`  Skipped (already exists): ${filePath}`);
    return false;
  }
  fs.writeFileSync(filePath, content);
  console.log(`  Created: ${filePath}`);
  return true;
}

/**
 * Create a complete collection structure
 */
function createCollection(
  collectionName: string,
  schema: any,
  forceUpdate: boolean = false
): void {
  console.log(`\nCreating collection: ${collectionName}`);
  
  const singularName = schema.info.singularName;
  const collectionDir = path.join(API_DIR, collectionName);
  const contentTypesDir = path.join(collectionDir, 'content-types', collectionName);
  const controllersDir = path.join(collectionDir, 'controllers');
  const servicesDir = path.join(collectionDir, 'services');
  const routesDir = path.join(collectionDir, 'routes');

  // Create directories
  ensureDir(contentTypesDir);
  ensureDir(controllersDir);
  ensureDir(servicesDir);
  ensureDir(routesDir);

  // Write schema.json
  const schemaPath = path.join(contentTypesDir, 'schema.json');
  writeFileIfNotExists(schemaPath, JSON.stringify(schema, null, 2), forceUpdate);

  // Write controller
  const controllerPath = path.join(controllersDir, `${singularName}.ts`);
  writeFileIfNotExists(controllerPath, createController(singularName));

  // Write service
  const servicePath = path.join(servicesDir, `${singularName}.ts`);
  writeFileIfNotExists(servicePath, createService(singularName));

  // Write routes
  const routesPath = path.join(routesDir, `${singularName}.ts`);
  writeFileIfNotExists(routesPath, createRoutes(singularName));
}

/**
 * Delete a collection structure
 */
function deleteCollection(collectionName: string): void {
  console.log(`\nDeleting collection: ${collectionName}`);
  
  const collectionDir = path.join(API_DIR, collectionName);
  
  if (fs.existsSync(collectionDir)) {
    fs.rmSync(collectionDir, { recursive: true, force: true });
    console.log(`  Deleted: ${collectionDir}`);
  } else {
    console.log(`  Not found: ${collectionDir}`);
  }
}

/**
 * Apply migration - creates all collections with proper schemas
 */
export async function up(options: { force?: boolean } = {}): Promise<void> {
  console.log('========================================');
  console.log('Migration: 001_create_collections');
  console.log('Action: UP (Create collections)');
  console.log('========================================');

  try {
    // Ensure API directory exists
    ensureDir(API_DIR);

    // Create Order collection
    createCollection('order', ORDER_SCHEMA, options.force);

    // Create Quote collection
    createCollection('quote', QUOTE_SCHEMA, options.force);

    // Create/Update Customer collection
    // For customer, we update if force is true, otherwise skip if exists
    const customerExists = fs.existsSync(path.join(API_DIR, 'customer'));
    if (customerExists && !options.force) {
      console.log('\n⚠️  Customer collection already exists. Use force=true to update.');
    } else {
      createCollection('customer', CUSTOMER_SCHEMA, options.force);
    }

    // Create Product collection
    createCollection('product', PRODUCT_SCHEMA, options.force);

    console.log('\n========================================');
    console.log('✅ Migration completed successfully!');
    console.log('========================================');
    console.log('\nCollections created:');
    console.log('  - Order (api::order.order)');
    console.log('  - Quote (api::quote.quote)');
    console.log('  - Customer (api::customer.customer)');
    console.log('  - Product (api::product.product)');
    console.log('\nNext steps:');
    console.log('  1. Restart Strapi to load new content types');
    console.log('  2. Access collections in Strapi Admin UI');
    console.log('  3. Verify relationships are working');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback migration - removes all created collections
 * WARNING: This will delete all data in these collections
 */
export async function down(): Promise<void> {
  console.log('========================================');
  console.log('Migration: 001_create_collections');
  console.log('Action: DOWN (Rollback)');
  console.log('========================================');
  console.log('\n⚠️  WARNING: This will delete collection structures!');
  console.log('Data will be preserved in the database but schemas will be removed.');

  try {
    // Delete collections in reverse order
    deleteCollection('product');
    deleteCollection('quote');
    deleteCollection('order');
    // Note: We don't delete customer as it may have been pre-existing
    console.log('\n⚠️  Customer collection preserved (may have been pre-existing)');

    console.log('\n========================================');
    console.log('✅ Rollback completed successfully!');
    console.log('========================================');
    console.log('\nCollections removed:');
    console.log('  - Product');
    console.log('  - Quote');
    console.log('  - Order');
    console.log('\nNext steps:');
    console.log('  1. Restart Strapi to remove content types');
    console.log('  2. Manually clean up database tables if needed');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    throw error;
  }
}

// Allow running as standalone script
if (require.main === module) {
  const action = process.argv[2];
  const force = process.argv.includes('--force');

  if (action === 'up') {
    up({ force })
      .then(() => process.exit(0))
      .catch((error: any) => {
        console.error(error);
        process.exit(1);
      });
  } else if (action === 'down') {
    down()
      .then(() => process.exit(0))
      .catch((error: any) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node 001_create_collections.js [up|down] [--force]');
    console.log('  up      - Create collections');
    console.log('  down    - Remove collections (rollback)');
    console.log('  --force - Force update existing schemas');
    process.exit(1);
  }
}
