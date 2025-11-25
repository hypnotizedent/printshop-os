#!/usr/bin/env ts-node
import { ASColourClient, ASColourVariant, ASColourInventoryItem, ASColourPriceListItem } from '../clients/as-colour.client';
import { ASColourTransformer } from '../transformers/as-colour.transformer';
import { logger } from '../utils/logger';
import { persistProducts } from '../persistence/productPersistence';

interface Args {
  limit?: number;
  dryRun?: boolean;
  enrichVariants?: boolean;
  enrichPrices?: boolean;
  updatedSince?: string;
}

function parseArgs(): Args {
  const args: Args = {};
  process.argv.slice(2).forEach(a => {
    if (a.startsWith('--limit=')) args.limit = parseInt(a.split('=')[1],10);
    if (a === '--dry-run') args.dryRun = true;
    if (a === '--enrich-variants') args.enrichVariants = true;
    if (a === '--enrich-prices') args.enrichPrices = true;
    if (a.startsWith('--updated-since=')) args.updatedSince = a.split('=')[1];
  });
  return args;
}

async function main() {
  const { limit, dryRun, enrichVariants, enrichPrices, updatedSince } = parseArgs();
  const client = new ASColourClient({
    apiKey: process.env.ASCOLOUR_SUBSCRIPTION_KEY || process.env.ASCOLOUR_API_KEY || '',
    baseURL: process.env.ASCOLOUR_BASE_URL,
    pageSize: process.env.ASCOLOUR_PAGE_SIZE ? parseInt(process.env.ASCOLOUR_PAGE_SIZE,10) : undefined,
    maxPages: process.env.ASCOLOUR_MAX_PAGES ? parseInt(process.env.ASCOLOUR_MAX_PAGES,10) : undefined,
    maxRetries: 3,
    retryDelayMs: 1000,
  });
  const transformer = new ASColourTransformer();

  logger.info('Starting AS Colour sync', { limit, dryRun, enrichVariants, enrichPrices, updatedSince });

  const email = process.env.ASCOLOUR_EMAIL;
  const password = process.env.ASCOLOUR_PASSWORD;
  if (email && password) {
    const token = await client.authenticate(email, password);
    if (!token) logger.error('Authentication failed');
  }

  let rawProducts = await client.getAllProducts();
  if (updatedSince) {
    rawProducts = rawProducts.filter(p => new Date(p.updatedAt) >= new Date(updatedSince));
  }
  const sliced = typeof limit === 'number' ? rawProducts.slice(0, limit) : rawProducts;

  let variantsMap: Map<string, ASColourVariant[]> | undefined;
  let inventoryMap: Map<string, ASColourInventoryItem[]> | undefined;
  let pricesMap: Map<string, ASColourPriceListItem[]> | undefined;

  if (enrichVariants) {
    variantsMap = new Map();
    inventoryMap = new Map();
    for (const product of sliced) {
      const variants = await client.listVariants(product.styleCode);
      variantsMap.set(product.styleCode, variants);
      const invItems: ASColourInventoryItem[] = [];
      for (const variant of variants) {
        const inv = await client.getVariantInventory(product.styleCode, variant.sku);
        if (inv) invItems.push(inv);
      }
      inventoryMap.set(product.styleCode, invItems);
    }
  }

  if (enrichPrices) {
    const allPrices = await client.listPriceList();
    pricesMap = new Map();
    sliced.forEach(p => {
      const skuPrices = allPrices.filter(price => price.sku.startsWith(p.styleCode));
      if (skuPrices.length > 0) pricesMap!.set(p.styleCode, skuPrices);
    });
  }

  const unified = transformer.transformProducts(sliced, variantsMap, inventoryMap, pricesMap);

  if (dryRun) {
    logger.info('Dry run completed', { transformedCount: unified.length });
    console.log(JSON.stringify(unified.slice(0,2), null, 2));
    return;
  }

  persistProducts(unified);
}

main().catch(err => {
  logger.error('AS Colour sync failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
