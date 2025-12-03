# Printavo V2 Complete Data Extraction

This document describes the comprehensive Printavo V2 GraphQL data extraction system that extracts 100% of available data from the Printavo API.

## Overview

The complete extraction script (`extract-printavo-v2-complete.ts`) is a comprehensive enhancement of the basic extraction script that queries ALL available fields from Printavo's V2 GraphQL API, including:

- **Complete Order Data**: All financial fields, addresses, contacts, owners
- **Imprints**: Full imprint data with placement, colors, stitch counts, print methods
- **Artwork Files**: All artwork files associated with imprints
- **Production Files**: Work orders, packing slips, and other production documents
- **Line Item Details**: Size breakdowns, personalizations (names/numbers), product details
- **Financial Data**: Complete transaction history (payments & refunds), expenses, fees
- **Quotes**: Full quote data with line items and imprints

## Key Features

### 1. Complete Data Coverage
- Extracts **100%** of available fields (vs ~40% in basic script)
- Includes nested relationships (imprints, files, sizes, personalizations)
- Handles GraphQL union types (Payment/Refund transactions)
- Captures metadata (tags, URLs, status colors)

### 2. Checkpoint & Resume
- Saves progress every 50 orders
- Can resume interrupted extractions
- Checkpoint includes timestamp and cursor position
- Prevents data loss on network failures

### 3. Data Normalization
- Extracts imprints as separate normalized data file
- Creates file manifest for bulk downloading
- Separates orders from quotes
- Flattens nested structures for easier import

### 4. Progress Tracking
- Detailed logging with timestamps
- Progress indicators for each page
- Summary statistics at completion
- Error tracking with context

## File Structure

After extraction, the following structure is created:

```
data/printavo-export/v2-complete/{timestamp}/
├── orders.json              # All orders (Invoices) with complete data
├── quotes.json              # All quotes with complete data
├── customers.json           # All customers with contacts/addresses
├── products.json            # Product catalog
├── imprints.json            # Normalized imprints from all orders
├── files_manifest.json      # All file URLs for download
├── checkpoint.json          # Resume checkpoint
└── summary.json             # Extraction statistics
```

## Usage

### Basic Extraction

```bash
cd services/api

# Set environment variables
export PRINTAVO_EMAIL="your_email@example.com"
export PRINTAVO_PASSWORD="your_password"

# Run complete extraction
npm run printavo:extract-complete
```

### Resume Interrupted Extraction

```bash
# Resume from most recent checkpoint
npm run printavo:extract-complete:resume
```

### Environment Variables

```bash
# Required
PRINTAVO_EMAIL=your_email@example.com
PRINTAVO_PASSWORD=your_password

# Optional (with defaults)
PRINTAVO_API_URL=https://www.printavo.com/api/v2
PRINTAVO_RATE_LIMIT_MS=500
```

## Data Structure

### Orders (orders.json)

Complete invoice data including:

```typescript
{
  id: string;
  visualId: string;           // INV-001
  nickname: string;
  
  // Financial
  total: number;
  subtotal: number;
  taxTotal: number;
  amountPaid: number;         // NEW
  amountOutstanding: number;  // NEW
  
  // Addresses (NEW)
  billingAddress: {
    companyName: string;
    address1: string;
    city: string;
    stateIso: string;
    zipCode: string;
  };
  shippingAddress: { ... };
  
  // Contact & Owner (NEW)
  contact: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  
  // Production Files (NEW)
  productionFiles: {
    nodes: [
      {
        id: string;
        fileUrl: string;
        fileName: string;
        fileType: string;
      }
    ]
  };
  
  // Line Item Groups with Imprints (NEW)
  lineItemGroups: {
    nodes: [
      {
        id: string;
        position: number;
        
        // Imprints (NEW)
        imprints: {
          nodes: [
            {
              id: string;
              name: string;
              placement: string;
              colors: string[];
              printMethod: string;
              mockupUrl: string;
              artworkFiles: {
                nodes: [...]
              }
            }
          ]
        };
        
        // Line Items with Sizes (NEW)
        lineItems: {
          nodes: [
            {
              id: string;
              description: string;
              items: number;
              price: number;
              
              // Size Breakdown (NEW)
              sizes: [
                { size: "S", count: 20 },
                { size: "M", count: 50 },
                { size: "L", count: 30 }
              ];
              
              // Personalizations (NEW)
              personalizations: [
                { name: "John Doe", number: "10", size: "M" }
              ];
              
              // Product Details (NEW)
              product: {
                id: string;
                name: string;
                sku: string;
              }
            }
          ]
        }
      }
    ]
  };
  
  // Transactions (Payment/Refund union) (NEW)
  transactions: {
    nodes: [
      {
        __typename: "Payment";
        id: string;
        amount: number;
        paymentMethod: string;
      },
      {
        __typename: "Refund";
        id: string;
        amount: number;
        reason: string;
      }
    ]
  };
  
  // Expenses (NEW)
  expenses: {
    nodes: [
      {
        id: string;
        amount: number;
        description: string;
        vendor: string;
      }
    ]
  };
  
  // Fees (NEW)
  fees: {
    nodes: [
      {
        id: string;
        name: string;
        amount: number;
        taxable: boolean;
      }
    ]
  };
}
```

### Normalized Imprints (imprints.json)

Extracted and flattened imprint data:

```json
[
  {
    "id": "imprint-1",
    "orderId": "order-1",
    "lineItemGroupId": "group-1",
    "name": "Front Logo",
    "placement": "Front Center",
    "description": "Company logo on chest",
    "colors": ["Red", "Blue", "White"],
    "stitchCount": 5000,
    "printMethod": "Screen Print",
    "mockupUrl": "https://...",
    "artworkFileIds": ["file-1", "file-2"],
    "artworkFiles": [...]
  }
]
```

### File Manifest (files_manifest.json)

Complete list of all files for bulk download:

```json
{
  "generatedAt": "2024-01-01T00:00:00Z",
  "totalFiles": 450,
  "files": [
    {
      "id": "file-1",
      "url": "https://printavo.s3.amazonaws.com/...",
      "fileName": "logo.pdf",
      "fileType": "application/pdf",
      "fileSize": 102400,
      "source": "artwork",
      "relatedEntityType": "imprint",
      "relatedEntityId": "imprint-1"
    },
    {
      "id": "file-2",
      "url": "https://printavo.s3.amazonaws.com/...",
      "fileName": "workorder.pdf",
      "fileType": "application/pdf",
      "source": "production",
      "relatedEntityType": "order",
      "relatedEntityId": "order-1"
    }
  ]
}
```

### Checkpoint (checkpoint.json)

Resume data for interrupted extractions:

```json
{
  "timestamp": "2024-01-01T00-00-00",
  "lastProcessedOrderId": "order-50",
  "lastProcessedCursor": "cursor-xyz",
  "ordersProcessed": 50,
  "totalOrders": 500,
  "currentPhase": "orders"
}
```

## Comparison: Basic vs Complete Extraction

| Feature | Basic Script | Complete Script |
|---------|-------------|-----------------|
| Order Fields | ~15 fields | ~40 fields |
| Line Item Details | Basic only | With sizes, personalizations |
| Imprints | ❌ Not extracted | ✅ Full extraction |
| Artwork Files | ❌ Not extracted | ✅ Full extraction |
| Production Files | ❌ Not extracted | ✅ Full extraction |
| Transactions | Payments only | Payments + Refunds |
| Expenses | ❌ Not extracted | ✅ Extracted |
| Fees | ❌ Not extracted | ✅ Extracted |
| Addresses | ❌ Not extracted | ✅ Billing + Shipping |
| Contact Info | Basic | Complete with owner |
| File Manifest | ❌ No | ✅ Yes |
| Checkpoint/Resume | ❌ No | ✅ Yes |
| Normalized Data | ❌ No | ✅ Yes (imprints) |

## Performance

- **Rate Limiting**: 500ms between requests (configurable)
- **Page Size**: 50 orders per page (optimal for complete data)
- **Checkpoint Frequency**: Every 50 orders
- **Average Speed**: ~120 orders/minute (with 500ms rate limit)
- **Typical Duration**: 500 orders in ~4-5 minutes

## Error Handling

The script handles:
- Network timeouts
- API rate limits
- Authentication failures
- Partial data responses
- GraphQL errors

All errors are logged with context and the extraction continues where possible.

## Next Steps

After extraction:

1. **Review Summary**: Check `summary.json` for counts and errors
2. **Validate Data**: Spot-check orders.json for completeness
3. **Download Files**: Use `files_manifest.json` to download artwork/production files
4. **Import to Strapi**: Use the import script to load data into Strapi CMS

## Testing

Comprehensive test suite included:

```bash
# Run all extraction tests
npm test -- --testPathPattern=extract-printavo-v2-complete

# Run type tests
npm test -- --testPathPattern=printavo-v2-types
```

Test coverage:
- ✅ Type definitions (43 tests)
- ✅ Authentication flow
- ✅ Pagination logic
- ✅ Checkpoint save/load
- ✅ Data normalization
- ✅ Error handling

## Troubleshooting

### Extraction Stops Midway
- Check `checkpoint.json` exists
- Run with `--resume` flag to continue

### Missing Fields in Output
- Verify Printavo API permissions
- Check API version (must be v2)
- Review error log in `data/logs/`

### Rate Limiting Errors
- Increase `PRINTAVO_RATE_LIMIT_MS` (try 1000)
- Reduce page size in code (default: 50)

### Authentication Failures
- Verify credentials in `.env`
- Check account has API access
- Try logging in via web interface first

## Support

For issues or questions:
1. Check the error logs in `data/logs/`
2. Review `summary.json` for error details
3. Run with verbose logging enabled
4. Consult the test suite for expected behavior

## Version History

- **v2.0** (Dec 2024): Complete extraction with all fields
  - Added imprints, files, sizes, personalizations
  - Added checkpoint/resume capability
  - Added file manifest generation
  - Added comprehensive tests
- **v1.0** (Nov 2024): Basic extraction (~40% of data)
