import { UnifiedProduct, SupplierName, ProductCategory, ProductVariant } from '../types/product';
import { ASColourRawProduct, ASColourVariant, ASColourInventoryItem, ASColourPriceListItem } from '../clients/as-colour.client';
import { logger } from '../utils/logger';

export class ASColourTransformer {
  transformProduct(
    raw: ASColourRawProduct,
    variants?: ASColourVariant[],
    inventory?: ASColourInventoryItem[],
    prices?: ASColourPriceListItem[]
  ): UnifiedProduct {
    const unifiedVariants = variants && inventory 
      ? this.buildEnrichedVariants(raw, variants, inventory, prices)
      : [];

    const product: UnifiedProduct = {
      sku: `AC-${raw.styleCode}`,
      name: raw.styleName,
      brand: 'AS Colour',
      description: raw.description || raw.shortDescription || '',
      category: this.mapCategory(raw.productType),
      supplier: SupplierName.AS_COLOUR,
      variants: unifiedVariants,
      images: this.extractImages(raw),
      pricing: this.buildPricing(raw, prices),
      specifications: {
        weight: raw.fabricWeight || raw.productWeight || undefined,
        fabric: this.parseFabric(raw.composition),
      },
      availability: {
        inStock: unifiedVariants.some(v => v.inStock),
        totalQuantity: unifiedVariants.reduce((s,v) => s + v.quantity, 0),
      },
      metadata: {
        supplierProductId: raw.styleCode,
        lastUpdated: new Date(raw.updatedAt),
      }
    };

    return product;
  }

  transformProducts(
    raws: ASColourRawProduct[],
    variantsMap?: Map<string, ASColourVariant[]>,
    inventoryMap?: Map<string, ASColourInventoryItem[]>,
    pricesMap?: Map<string, ASColourPriceListItem[]>
  ): UnifiedProduct[] {
    logger.info('Transforming AS Colour products', { count: raws.length });
    return raws.map(r => this.transformProduct(
      r,
      variantsMap?.get(r.styleCode),
      inventoryMap?.get(r.styleCode),
      pricesMap?.get(r.styleCode)
    ));
  }

  private buildEnrichedVariants(
    raw: ASColourRawProduct,
    variants: ASColourVariant[],
    inventory: ASColourInventoryItem[],
    prices?: ASColourPriceListItem[]
  ): ProductVariant[] {
    const invMap = new Map(inventory.map(i => [i.sku, i]));
    const priceMap = prices ? new Map(prices.map(p => [p.sku, p])) : new Map();

    return variants.map(v => {
      const inv = invMap.get(v.sku);
      const price = priceMap.get(v.sku);
      return {
        sku: v.sku,
        color: {
          name: v.colour,
          code: v.colour.toLowerCase().replace(/\s+/g, '-'),
          hex: v.colourHex || undefined,
        },
        size: v.size,
        inStock: (inv?.quantity || 0) > 0,
        quantity: inv?.quantity || 0,
        pricing: price ? {
          basePrice: price.price,
          currency: price.currency,
          breaks: [{ quantity: 1, price: price.price }],
        } : undefined,
        metadata: {
          barcode: v.barcode,
          coreColour: v.coreColour,
          nextDeliveryETA: inv?.nextDeliveryETA,
        }
      };
    });
  }

  private buildPricing(raw: ASColourRawProduct, prices?: ASColourPriceListItem[]) {
    if (prices && prices.length > 0) {
      const avgPrice = prices.reduce((s, p) => s + p.price, 0) / prices.length;
      return {
        basePrice: avgPrice,
        currency: prices[0].currency,
        breaks: [{ quantity: 1, price: avgPrice }],
      };
    }
    // Fallback if no price list available
    return {
      basePrice: 0,
      currency: 'USD',
      breaks: [],
    };
  }

  private extractImages(raw: ASColourRawProduct): string[] {
    const urls: string[] = [];
    if (raw.websiteURL) urls.push(raw.websiteURL);
    if (raw.productSpecURL) urls.push(raw.productSpecURL);
    return urls.slice(0, 5);
  }

  private parseFabric(composition: string): { type: string; content: string } | undefined {
    if (!composition) return undefined;
    return { type: 'fabric', content: composition };
  }

  private mapCategory(productType: string): ProductCategory {
    const c = (productType || '').toLowerCase();
    if (c.includes('tee') || c.includes('t-shirt')) return ProductCategory.T_SHIRTS;
    if (c.includes('hoodie')) return ProductCategory.HOODIES;
    if (c.includes('sweat')) return ProductCategory.SWEATSHIRTS;
    if (c.includes('polo')) return ProductCategory.POLOS;
    if (c.includes('headwear') || c.includes('hat') || c.includes('cap')) return ProductCategory.HEADWEAR;
    if (c.includes('bag')) return ProductCategory.BAGS;
    if (c.includes('outerwear') || c.includes('jacket')) return ProductCategory.OUTERWEAR;
    if (c.includes('youth')) return ProductCategory.YOUTH;
    if (c.includes('athletic') || c.includes('sport')) return ProductCategory.ATHLETIC;
    return ProductCategory.OTHER;
  }
}
