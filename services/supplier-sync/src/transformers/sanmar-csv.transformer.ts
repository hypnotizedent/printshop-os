import { UnifiedProduct, ProductVariant, ProductCategory, SupplierName } from '../types/product';
import { logger } from '../utils/logger';

/**
 * SanMar SDL_N CSV Record
 * Main product data file
 */
export interface SanMarSDLRecord {
  StyleID: string;
  StyleName: string;
  BrandName: string;
  CategoryName?: string;
  Description?: string;
  Fabrication?: string;
  FabricWeight?: string;
  ColorCode: string;
  ColorName: string;
  Size: string;
  WholesalePrice?: string;
  RetailPrice?: string;
  CaseQuantity?: string;
  WeightLBS?: string;
  CountryOfOrigin?: string;
  Availability?: string;
}

/**
 * SanMar EPDD CSV Record
 * Enhanced product data with inventory and detailed categories
 */
export interface SanMarEPDDRecord {
  StyleID: string;
  StyleName: string;
  BrandID: string;
  BrandName: string;
  MainCategory: string;
  SubCategory?: string;
  Description?: string;
  ColorCode: string;
  ColorName: string;
  Size: string;
  Inventory?: string;
  WholesalePrice?: string;
  RetailPrice?: string;
  CaseQty?: string;
  Weight?: string;
  ImageURL?: string;
}

/**
 * SanMar DIP Inventory Record
 * Hourly inventory updates (sanmar_dip.txt)
 */
export interface SanMarDIPRecord {
  StyleID: string;
  ColorCode: string;
  Size: string;
  Quantity: string;
  LastUpdated?: string;
}

/**
 * SanMar CSV Transformer
 * 
 * Transforms SanMar CSV data files into UnifiedProduct format.
 * Handles three file types:
 * 1. SDL_N - Main product data
 * 2. EPDD - Enhanced data with inventory
 * 3. DIP - Hourly inventory updates
 */
export class SanMarCSVTransformer {
  /**
   * Transform SDL_N records (main product file) to UnifiedProduct
   */
  transformSDLRecords(records: SanMarSDLRecord[]): UnifiedProduct[] {
    logger.info('Transforming SanMar SDL_N records', { count: records.length });

    // Group records by StyleID
    const productMap = new Map<string, SanMarSDLRecord[]>();
    
    for (const record of records) {
      const existing = productMap.get(record.StyleID) || [];
      existing.push(record);
      productMap.set(record.StyleID, existing);
    }

    const products: UnifiedProduct[] = [];

    for (const [styleId, variants] of productMap.entries()) {
      try {
        const baseRecord = variants[0];
        
        const product: UnifiedProduct = {
          sku: `SM-${styleId}`,
          name: baseRecord.StyleName,
          brand: baseRecord.BrandName,
          category: this.mapCategory(baseRecord.CategoryName),
          supplier: SupplierName.SANMAR,
          description: baseRecord.Description || '',
          variants: this.transformSDLVariants(variants),
          pricing: this.extractPricing(baseRecord),
          images: [],
          availability: {
            inStock: variants.some(v => v.Availability?.toLowerCase() === 'in stock'),
            totalQuantity: 0, // SDL_N doesn't have quantity info
          },
          specifications: {
            weight: baseRecord.FabricWeight,
            fabric: baseRecord.Fabrication ? {
              type: baseRecord.Fabrication,
              content: baseRecord.Fabrication,
            } : undefined,
          },
          metadata: {
            supplierProductId: styleId,
            lastUpdated: new Date(),
          },
        };

        products.push(product);
      } catch (error) {
        logger.error('Failed to transform SDL record', { styleId, error });
      }
    }

    logger.info('SDL transformation complete', {
      inputRecords: records.length,
      outputProducts: products.length,
    });

    return products;
  }

  /**
   * Transform EPDD records (enhanced file) to UnifiedProduct
   * Preferred over SDL_N as it includes inventory data
   */
  transformEPDDRecords(records: SanMarEPDDRecord[]): UnifiedProduct[] {
    logger.info('Transforming SanMar EPDD records', { count: records.length });

    // Group records by StyleID
    const productMap = new Map<string, SanMarEPDDRecord[]>();
    
    for (const record of records) {
      const existing = productMap.get(record.StyleID) || [];
      existing.push(record);
      productMap.set(record.StyleID, existing);
    }

    const products: UnifiedProduct[] = [];

    for (const [styleId, variants] of productMap.entries()) {
      try {
        const baseRecord = variants[0];
        
        const product: UnifiedProduct = {
          sku: `SM-${styleId}`,
          name: baseRecord.StyleName,
          brand: baseRecord.BrandName,
          category: this.mapCategory(baseRecord.MainCategory, baseRecord.SubCategory),
          supplier: SupplierName.SANMAR,
          description: baseRecord.Description || '',
          variants: this.transformEPDDVariants(variants),
          pricing: this.extractEPDDPricing(baseRecord),
          images: baseRecord.ImageURL ? [baseRecord.ImageURL] : [],
          availability: {
            inStock: variants.some(v => parseInt(v.Inventory || '0') > 0),
            totalQuantity: this.calculateTotalQuantity(variants),
          },
          metadata: {
            supplierProductId: styleId,
            supplierBrandId: baseRecord.BrandID,
            lastUpdated: new Date(),
          },
        };

        products.push(product);
      } catch (error) {
        logger.error('Failed to transform EPDD record', { styleId, error });
      }
    }

    logger.info('EPDD transformation complete', {
      inputRecords: records.length,
      outputProducts: products.length,
    });

    return products;
  }

  /**
   * Transform DIP records (inventory file) to variant updates
   * Used to update inventory on existing products
   */
  transformDIPRecords(records: SanMarDIPRecord[]): Map<string, Map<string, number>> {
    logger.info('Transforming SanMar DIP inventory records', { count: records.length });

    // Map: StyleID -> (VariantSKU -> Quantity)
    const inventoryMap = new Map<string, Map<string, number>>();

    for (const record of records) {
      const quantity = parseInt(record.Quantity || '0', 10);
      const variantSku = `${record.StyleID}-${record.ColorCode}-${record.Size}`;

      let styleInventory = inventoryMap.get(record.StyleID);
      if (!styleInventory) {
        styleInventory = new Map<string, number>();
        inventoryMap.set(record.StyleID, styleInventory);
      }

      styleInventory.set(variantSku, quantity);
    }

    logger.info('DIP transformation complete', {
      inputRecords: records.length,
      products: inventoryMap.size,
    });

    return inventoryMap;
  }

  /**
   * Update product inventory from DIP data
   */
  applyInventoryUpdates(
    products: UnifiedProduct[],
    inventoryMap: Map<string, Map<string, number>>
  ): UnifiedProduct[] {
    logger.info('Applying inventory updates to products', { count: products.length });

    let updatedCount = 0;

    for (const product of products) {
      // Extract styleId from SKU (SM-STYLEID)
      const styleId = product.sku.replace('SM-', '');
      const styleInventory = inventoryMap.get(styleId);

      if (!styleInventory) continue;

      for (const variant of product.variants) {
        const quantity = styleInventory.get(variant.sku);
        if (quantity !== undefined) {
          variant.quantity = quantity;
          variant.inStock = quantity > 0;
          updatedCount++;
        }
      }

      // Update product availability
      product.availability = {
        inStock: product.variants.some(v => v.inStock),
        totalQuantity: product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0),
      };
    }

    logger.info('Inventory updates applied', {
      products: products.length,
      variantsUpdated: updatedCount,
    });

    return products;
  }

  /**
   * Transform SDL_N variants
   */
  private transformSDLVariants(records: SanMarSDLRecord[]): ProductVariant[] {
    return records.map((record) => ({
      sku: `${record.StyleID}-${record.ColorCode}-${record.Size}`,
      color: {
        name: record.ColorName,
        code: record.ColorCode,
      },
      size: record.Size,
      inStock: record.Availability?.toLowerCase() === 'in stock',
      quantity: 0, // SDL_N doesn't provide quantity
      weight: this.parseWeight(record.WeightLBS),
      pricing: {
        wholesale: this.parsePrice(record.WholesalePrice),
        retail: this.parsePrice(record.RetailPrice),
        caseQuantity: this.parseNumber(record.CaseQuantity),
      },
    }));
  }

  /**
   * Transform EPDD variants
   */
  private transformEPDDVariants(records: SanMarEPDDRecord[]): ProductVariant[] {
    return records.map((record) => ({
      sku: `${record.StyleID}-${record.ColorCode}-${record.Size}`,
      color: {
        name: record.ColorName,
        code: record.ColorCode,
      },
      size: record.Size,
      inStock: parseInt(record.Inventory || '0') > 0,
      quantity: parseInt(record.Inventory || '0'),
      weight: this.parseWeight(record.Weight),
      pricing: {
        wholesale: this.parsePrice(record.WholesalePrice),
        retail: this.parsePrice(record.RetailPrice),
        caseQuantity: this.parseNumber(record.CaseQty),
      },
    }));
  }

  /**
   * Extract pricing from SDL record
   */
  private extractPricing(record: SanMarSDLRecord) {
    const wholesale = this.parsePrice(record.WholesalePrice);
    const retail = this.parsePrice(record.RetailPrice);

    return {
      basePrice: wholesale || retail || 0,
      currency: 'USD',
      breaks: wholesale
        ? [{ quantity: 1, price: wholesale }]
        : [],
    };
  }

  /**
   * Extract pricing from EPDD record
   */
  private extractEPDDPricing(record: SanMarEPDDRecord) {
    const wholesale = this.parsePrice(record.WholesalePrice);
    const retail = this.parsePrice(record.RetailPrice);

    return {
      basePrice: wholesale || retail || 0,
      currency: 'USD',
      breaks: wholesale
        ? [{ quantity: 1, price: wholesale }]
        : [],
    };
  }

  /**
   * Map SanMar category to ProductCategory enum
   */
  private mapCategory(mainCategory?: string, subCategory?: string): ProductCategory {
    const category = (mainCategory || subCategory || '').toLowerCase();

    if (category.includes('t-shirt') || category.includes('tee')) {
      return ProductCategory.T_SHIRTS;
    }
    if (category.includes('polo')) {
      return ProductCategory.POLOS;
    }
    if (category.includes('hoodie')) {
      return ProductCategory.HOODIES;
    }
    if (category.includes('sweatshirt')) {
      return ProductCategory.SWEATSHIRTS;
    }
    if (category.includes('jacket') || category.includes('outerwear')) {
      return ProductCategory.OUTERWEAR;
    }
    if (category.includes('hat') || category.includes('cap')) {
      return ProductCategory.HEADWEAR;
    }
    if (category.includes('bag')) {
      return ProductCategory.BAGS;
    }

    return ProductCategory.OTHER;
  }

  /**
   * Calculate total quantity across all variants
   */
  private calculateTotalQuantity(records: SanMarEPDDRecord[]): number {
    return records.reduce((sum, record) => {
      return sum + parseInt(record.Inventory || '0', 10);
    }, 0);
  }

  /**
   * Generate search tags from product data
   */
  private generateTags(record: SanMarEPDDRecord): string[] {
    const tags: string[] = [];

    if (record.BrandName) tags.push(record.BrandName.toLowerCase());
    if (record.MainCategory) tags.push(record.MainCategory.toLowerCase());
    if (record.SubCategory) tags.push(record.SubCategory.toLowerCase());

    return tags;
  }

  /**
   * Parse price string to number
   */
  private parsePrice(price?: string): number | undefined {
    if (!price) return undefined;
    const parsed = parseFloat(price.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Parse weight string to number (in lbs)
   */
  private parseWeight(weight?: string): number | undefined {
    if (!weight) return undefined;
    const parsed = parseFloat(weight.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Parse generic number string
   */
  private parseNumber(value?: string): number | undefined {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Calculate statistics for transformed data
   */
  calculateStats(products: UnifiedProduct[]) {
    return {
      totalProducts: products.length,
      totalVariants: products.reduce((sum, p) => sum + p.variants.length, 0),
      uniqueBrands: new Set(products.map((p) => p.brand)).size,
      uniqueCategories: new Set(products.map((p) => p.category)).size,
      inStock: products.filter((p) => p.availability?.inStock).length,
      outOfStock: products.filter((p) => !p.availability?.inStock).length,
      totalInventory: products.reduce(
        (sum, p) => sum + (p.availability?.totalQuantity || 0),
        0
      ),
    };
  }
}
