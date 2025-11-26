# Product Data

Product catalog data from suppliers and internal sources.

## Structure

```
products/
├── images/             # Product images from suppliers
│   ├── sanmar/         # SanMar product images
│   ├── ss-activewear/  # S&S Activewear images
│   └── as-colour/      # AS Colour images
├── catalogs/           # Supplier catalog exports
│   └── {supplier}/     # JSON/CSV product data
├── color-reference/    # Color matching reference
│   ├── pantone/        # Pantone swatches
│   └── thread/         # Thread color charts
└── templates/          # Mockup templates
    ├── tshirt/         # T-shirt templates
    ├── hoodie/         # Hoodie templates
    └── hat/            # Hat templates
```

## Supplier Image Sources

| Supplier | CDN URL | Local Cache |
|----------|---------|-------------|
| SanMar | `cdn.sanmarcloud.com` | `images/sanmar/` |
| S&S | `cdnm.sanmar.com` | `images/ss-activewear/` |
| AS Colour | `ascolour.com` | `images/as-colour/` |

## Image Naming

```
{styleNumber}_{colorCode}_{view}.jpg
```

Examples:
- `PC54_Black_Front.jpg`
- `G500_SportGrey_Back.jpg`
- `5000_AthleticHeather_Model.jpg`

## Product Data Format

Each product in `catalogs/{supplier}/products.json`:

```json
{
  "styleNumber": "PC54",
  "name": "Port & Company Core Cotton Tee",
  "brand": "Port & Company",
  "category": "T-Shirts",
  "colors": ["Black", "White", "Navy"],
  "sizes": ["S", "M", "L", "XL", "2XL"],
  "pricing": {
    "basePrice": 3.50,
    "bulkPrice": 2.85,
    "bulkMinQty": 72
  },
  "images": {
    "front": "PC54_Black_Front.jpg",
    "back": "PC54_Black_Back.jpg"
  }
}
```

## Sync Status

| Supplier | Products | Last Sync | Status |
|----------|----------|-----------|--------|
| SanMar | 18 | 2025-11-26 | ✅ In Strapi |
| S&S | - | - | ⏳ Pending |
| AS Colour | - | - | ⏳ Pending |

## Status

✅ **Partial** - SanMar products synced, others pending
