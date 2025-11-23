# Strapi Database Migrations

This directory contains database migration scripts for PrintShop OS Strapi collections.

## Migration 001: Create Collections

The `001_create_collections.ts` migration creates the core collections required for the PrintShop OS:

### Collections Created

1. **Order Collection** (`api::order.order`)
   - Complete order information from Printavo and customer portal
   - Includes customer data, addresses, line items, totals, and timeline
   - Relationships: Links to Quote and Customer records
   - Indexes: `printavoId`, `publicHash`, `status`

2. **Quote Collection** (`api::quote.quote`)
   - Price quotes and estimates for customer orders
   - Includes pricing breakdown, customer info, and status tracking
   - Relationships: Links to Order, Customer, and Products
   - Indexes: `quoteNumber`, `status`, `customerEmail`

3. **Customer Collection** (`api::customer.customer`)
   - Customer account and contact information
   - Extends/updates existing customer collection with additional fields
   - Relationships: Links to Orders and Quotes
   - Indexes: `email`, `printavoCustomerId`, `status`

4. **Product Collection** (`api::product.product`)
   - Supplier catalog products and inventory
   - Includes pricing, variants, availability, and specifications
   - Relationships: Links to Quotes
   - Indexes: `sku`, `supplier`, `category`, `brand`, `inStock`, `status`

## Running Migrations

This migration creates Strapi collection schemas by generating the proper file structure in the `src/api` directory. It's a TypeScript script that can be run directly.

### Method 1: Using npm Scripts (Recommended)

```bash
cd printshop-strapi

# Run the migration (creates collections)
npm run migrate:up

# Force update existing schemas
npm run migrate:force

# Rollback (removes collections)
npm run migrate:down
```

### Method 2: Run as Standalone Script

```bash
cd printshop-strapi

# First, compile TypeScript to JavaScript
npx tsc database/migrations/001_create_collections.ts --outDir database/migrations --module commonjs --esModuleInterop --skipLibCheck

# Run the migration
node database/migrations/001_create_collections.js up

# To force update existing schemas
node database/migrations/001_create_collections.js up --force

# To rollback
node database/migrations/001_create_collections.js down
```

### Method 3: Import and Execute

You can also import the migration in your own scripts:

```typescript
import { up, down } from './database/migrations/001_create_collections';

// Run migration
await up();

// Force update existing schemas
await up({ force: true });

// Rollback
await down();
```

### Method 4: Manual Execution via Node REPL

```bash
cd printshop-strapi

# First compile the TypeScript file
npm run migrate:compile

# Then use Node REPL
node

# In Node REPL:
const { up, down } = require('./database/migrations/001_create_collections.js');
up().then(() => console.log('Done'));
```

### After Running Migration

After running the migration, you must **restart Strapi** for the new content types to be loaded:

```bash
# Stop Strapi if running, then:
npm run develop
# or
npm run start
```

The collections will then be available in the Strapi Admin UI under Content Manager.

## Migration Features

### Idempotency

The migration is **idempotent** - it can be safely run multiple times:
- Checks if collections already exist before creating them
- Skips creation if collection exists
- Updates Customer collection if it pre-exists with new fields

### Rollback Support

The migration includes a `down()` function for rollback:
- Removes Order, Quote, and Product collections
- Preserves Customer collection (as it may have been pre-existing)
- **WARNING**: Rollback will delete all data in the removed collections

## Schema Details

### Order Schema

Key fields:
- `printavoId` (string, unique, indexed) - External reference
- `customer` (JSON) - Embedded customer information
- `billingAddress`, `shippingAddress` (JSON) - Address data
- `status` (enum) - Order status tracking
- `lineItems` (JSON) - Order line items array
- `totals` (JSON) - Financial totals
- `timeline` (JSON) - Important dates

### Quote Schema

Key fields:
- `quoteNumber` (string, unique, indexed) - Quote identifier
- `status` (enum) - Quote lifecycle status
- `service`, `quantity`, `colors` - Quote parameters
- `pricing` (JSON) - Complete pricing breakdown
- `customerEmail` (email, indexed) - Customer contact

### Customer Schema

Key fields:
- `email` (email, unique, indexed) - Primary contact
- `name`, `firstName`, `lastName`, `company` - Identity
- `status` (enum) - Account status
- `accountType` (enum) - Customer categorization
- `printavoCustomerId` (string, unique, indexed) - External reference

### Product Schema

Key fields:
- `sku` (string, unique, indexed) - Product identifier
- `supplier` (string, indexed) - Supplier name
- `category`, `brand` (indexed) - Product categorization
- `basePrice`, `wholesalePrice`, `retailPrice` - Pricing info
- `variants` (JSON) - Size/color variations
- `inStock`, `status` (indexed) - Availability tracking

## Relationships

The collections are interconnected:

```
Customer (1) ──< Orders (many)
Customer (1) ──< Quotes (many)
Order (1) ──── Quote (1)
Quote (many) ──< Products (many)
```

## Indexes

Indexes are automatically created on:
- Unique fields (`printavoId`, `email`, `sku`, etc.)
- Frequently queried fields (`status`, `supplier`, `category`, etc.)
- Foreign key relationships

## Notes

- All collections use `draftAndPublish: false` for immediate availability
- JSON fields are used for complex embedded data (addresses, line items, pricing)
- Enum fields define valid values for status tracking
- Relations use Strapi's relation syntax with proper inversedBy/mappedBy

## Troubleshooting

### Migration Fails to Create Collection

If the migration fails:
1. Check Strapi logs for detailed error messages
2. Ensure database connection is working
3. Verify no conflicting collection names exist
4. Check that all required Strapi plugins are installed

### Collection Already Exists

The migration will skip creation if a collection already exists. To force recreation:
1. Run the rollback (`down()`) function first
2. Then run the migration (`up()`) again

### Relationship Errors

If relationships fail to create:
1. Ensure both collections in the relationship exist
2. Check that the target UIDs are correct (`api::collection.collection`)
3. Verify the relation type (oneToOne, oneToMany, manyToMany) is appropriate

## Next Steps

After running this migration:
1. Verify collections appear in Strapi Admin UI
2. Test creating sample records via API or Admin UI
3. Verify relationships work correctly
4. Run Task 1.3: Historical Orders Import to populate with data
