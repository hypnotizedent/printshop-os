# Supplier Product Images

Cached product images from supplier CDNs.

## Purpose

- Faster loading in frontend
- Backup if supplier CDN is slow/down
- Consistent image processing

## Folder Structure

Each supplier gets a subfolder:

```
images/
├── sanmar/
│   └── {styleNumber}/
│       ├── {colorCode}_front.jpg
│       ├── {colorCode}_back.jpg
│       └── {colorCode}_model.jpg
├── ss-activewear/
│   └── ...
└── as-colour/
    └── ...
```

## Image Specs

| Type | Size | Format |
|------|------|--------|
| Thumbnail | 150x150 | JPEG |
| Product | 500x500 | JPEG |
| High-res | 1200x1200 | PNG |

## Sync Script

Run `scripts/sync-product-images.js` to:
1. Read products from Strapi
2. Download missing images from CDN
3. Resize to standard dimensions
4. Cache locally

## CDN Fallback

If local image not found, frontend falls back to CDN:
```javascript
const imageUrl = localPath || `https://cdn.sanmarcloud.com/...`;
```

## Status

⏳ **Pending** - Waiting for server storage
