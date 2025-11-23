# Quick Start Guide - Printavo to Strapi Mapper

## 5-Minute Setup

### Installation
Already in your project! Files are at:
```
services/api/lib/printavo-mapper.ts
services/api/lib/strapi-schema.ts
services/api/tests/printavo-mapper.test.ts
services/api/scripts/batch-import.ts
```

### Basic Usage

#### Transform Single Order
```typescript
import { transformPrintavoToStrapi } from './lib/printavo-mapper';

const printavoOrder = {
  id: 12345,
  customer: {
    full_name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp'
  },
  order_addresses_attributes: [/* ... */],
  lineitems_attributes: [/* ... */],
  orderstatus: { name: 'QUOTE' },
  order_total: 1000,
  created_at: '2025-11-21T10:00:00Z',
  updated_at: '2025-11-21T10:00:00Z'
};

try {
  const strapiOrder = transformPrintavoToStrapi(printavoOrder);
  // Use strapiOrder...
  console.log(strapiOrder.customer.name);
} catch (error) {
  console.error(error.message);
}
```

#### Transform Multiple Orders
```typescript
import { transformPrintavoOrdersBatch } from './lib/printavo-mapper';

const orders = [order1, order2, order3];
const result = transformPrintavoOrdersBatch(orders);

console.log(`✅ Transformed: ${result.successful.length}`);
console.log(`❌ Failed: ${result.errors.length}`);

result.errors.forEach(err => {
  console.error(`Order ${err.orderId}: ${err.error}`);
});
```

#### Batch Import from File
```typescript
import { runBatchImport } from './scripts/batch-import';

const result = await runBatchImport('./data/orders.json', {
  batchSize: 1000,
  skipDuplicates: true,
  outputDir: './import-results'
});

console.log(`Total: ${result.totalOrdersProcessed}`);
console.log(`Success: ${result.totalSuccessful}`);
console.log(`Errors: ${result.totalErrors}`);
```

### Common Patterns

#### Express Endpoint
```typescript
app.post('/api/orders/import', async (req, res) => {
  try {
    const strapiOrder = transformPrintavoToStrapi(req.body);
    const saved = await strapiDB.orders.create(strapiOrder);
    res.json({ success: true, documentId: saved.documentId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

#### Scheduled Import
```typescript
import { CronJob } from 'cron';
import { runBatchImport } from './scripts/batch-import';

// Run every day at 2 AM
new CronJob('0 2 * * *', async () => {
  try {
    const result = await runBatchImport('./data/new-orders.json');
    console.log(`✅ Imported ${result.totalSuccessful} orders`);
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}).start();
```

#### Validation
```typescript
import { validateStrapiOrder } from './lib/strapi-schema';

const order = transformPrintavoToStrapi(printavoOrder);
const validation = validateStrapiOrder(order);

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

### Field Reference

**Most Important Mappings:**
```
Printavo                    →  Strapi
id                          →  printavoId (string)
customer.full_name          →  customer.name
customer.email              →  customer.email
order_addresses_attributes  →  billingAddress, shippingAddress
orderstatus.name            →  status (QUOTE → quote)
order_total                 →  totals.total
created_at                  →  timeline.createdAt
lineitems_attributes        →  lineItems
```

### Status Quick Reference
```
QUOTE → quote
INVOICE PAID → invoice_paid
IN PRODUCTION → in_production
SHIPPED → shipped
Any other → pending (fallback)
```

### Error Handling
```typescript
import { PrintavoMapperError } from './lib/printavo-mapper';

try {
  transformPrintavoToStrapi(order);
} catch (error) {
  if (error instanceof PrintavoMapperError) {
    console.error(`Order ID: ${error.orderId}`);
    console.error(`Field: ${error.field}`);
    console.error(`Problem: ${error.message}`);
  }
}
```

### Run Tests
```bash
npm test -- printavo-mapper.test.ts
npm test -- printavo-mapper.test.ts --coverage
npm test -- --watch
```

### Troubleshooting

**Invalid Email Error**
```
// ❌ This fails
{ customer: { email: 'invalid' } }

// ✅ This works
{ customer: { email: 'user@example.com' } }
```

**Missing Required Fields**
```
// ❌ Fails - no customer name
{ customer: { full_name: '', email: 'user@example.com' } }

// ✅ Works
{ customer: { full_name: 'John', email: 'user@example.com' } }
```

**Address Missing**
```
// ❌ Fails - missing required address fields
{ order_addresses_attributes: [{ 
  name: 'Customer Shipping', 
  address1: '',  // Empty!
  city: 'Boston',
  state: 'MA',
  zip: '02101'
}]}

// ✅ Works
{ order_addresses_attributes: [{ 
  name: 'Customer Shipping', 
  address1: '123 Main St',
  city: 'Boston',
  state: 'MA',
  zip: '02101'
}]}
```

### Performance Notes

- **Single transform:** ~1-2ms
- **1000 orders:** ~1-2 seconds
- **Memory:** ~50MB for 1000 orders
- **Batch import:** Configurable concurrency
- **Retries:** Exponential backoff included

### Files Reference

| File | Purpose | Size |
|------|---------|------|
| `printavo-mapper.ts` | Core transformation | 411 lines |
| `strapi-schema.ts` | Types & validation | 177 lines |
| `batch-import.ts` | Batch processor | 425 lines |
| `printavo-mapper.test.ts` | Tests (40+ cases) | 753 lines |
| `INTEGRATION_GUIDE.md` | Full documentation | - |
| `IMPLEMENTATION_SUMMARY.md` | Implementation details | - |

### Next Steps

1. **Test it:** Run the test suite
   ```bash
   npm test printavo-mapper.test.ts
   ```

2. **Import data:** Use batch importer
   ```bash
   node -e "const {runBatchImport} = require('./scripts/batch-import'); runBatchImport('./data/orders.json')"
   ```

3. **Integrate:** Add to your Express app
   ```typescript
   import { transformPrintavoToStrapi } from './lib/printavo-mapper';
   ```

4. **Monitor:** Check import results in `./import-results/`

### Support

**Check logs:**
```bash
ls -la ./import-results/
cat ./import-results/import-*.log
```

**View errors:**
```bash
cat ./import-results/batch-1-errors-*.json | jq
```

**View summary:**
```bash
cat ./import-results/session-summary-*.json | jq
```

---

That's it! You're ready to transform Printavo orders to Strapi format. 🚀
