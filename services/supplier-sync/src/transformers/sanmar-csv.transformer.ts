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
 * SanMar EPDD CSV Record (Website Export Format)
 * Enhanced product data with inventory and detailed categories
 */
export interface SanMarEPDDRecord {
  UNIQUE_KEY: string;
  PRODUCT_TITLE: string;
  PRODUCT_DESCRIPTION?: string;
  'STYLE#': string; // Note: Contains # symbol
  AVAILABLE_SIZES?: string;
  BRAND_LOGO_IMAGE?: string;
  THUMBNAIL_IMAGE?: string;
  COLOR_SWATCH_IMAGE?: string;
  PRODUCT_IMAGE?: string;
  SPEC_SHEET?: string;
  PRICE_TEXT?: string;
  SUGGESTED_PRICE?: string;
  CATEGORY_NAME?: string;
  SUBCATEGORY_NAME?: string;
  COLOR_NAME?: string;
  COLOR_SQUARE_IMAGE?: string;
  COLOR_PRODUCT_IMAGE?: string;
  COLOR_PRODUCT_IMAGE_THUMBNAIL?: string;
  SIZE?: string;
  QTY?: string;
  PIECE_WEIGHT?: string;
  PIECE_PRICE?: string;
  DOZENS_PRICE?: string;
  CASE_PRICE?: string;
  PRICE_GROUP?: string;
  CASE_SIZE?: string;
  INVENTORY_KEY?: string;
  SIZE_INDEX?: string;
  SANMAR_MAINFRAME_COLOR?: string;
  MILL?: string;
  PRODUCT_STATUS?: string;
  COMPANION_STYLES?: string;
  MSRP?: string;
  MAP_PRICING?: string;
  FRONT_MODEL_IMAGE_URL?: string;
  BACK_MODEL_IMAGE?: string;
  FRONT_FLAT_IMAGE?: string;
  BACK_FLAT_IMAGE?: string;
  PRODUCT_MEASUREMENTS?: string;
  PMS_COLOR?: string;
  GTIN?: string;
  DECORATION_SPEC_SHEET?: string;
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

    // Group records by STYLE#
    const productMap = new Map<string, SanMarEPDDRecord[]>();
    
    for (const record of records) {
      const styleId = record['STYLE#'];
      const existing = productMap.get(styleId) || [];
      existing.push(record);
      productMap.set(styleId, existing);
    }

    const products: UnifiedProduct[] = [];

    for (const [styleId, variants] of productMap.entries()) {
      try {
        const baseRecord = variants[0];
        
        const product: UnifiedProduct = {
          sku: `SM-${styleId}`,
          name: baseRecord.PRODUCT_TITLE,
          brand: baseRecord.MILL || 'Unknown',
          category: this.mapCategory(baseRecord.CATEGORY_NAME, baseRecord.SUBCATEGORY_NAME),
          supplier: SupplierName.SANMAR,
          description: baseRecord.PRODUCT_DESCRIPTION || '',
          variants: this.transformEPDDVariants(variants),
          pricing: this.extractEPDDPricing(baseRecord),
          images: this.extractImages(baseRecord),
          availability: {
            inStock: variants.some(v => parseInt(v.QTY || '0') > 0),
            totalQuantity: this.calculateTotalQuantityEPDD(variants),
          },
          metadata: {
            supplierProductId: styleId,
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
   * Transform EPDD variants (website export format)
   */
  private transformEPDDVariants(records: SanMarEPDDRecord[]): ProductVariant[] {
    return records.map((record) => ({
      sku: `${record['STYLE#']}-${record.SANMAR_MAINFRAME_COLOR}-${record.SIZE}`,
      color: {
        name: record.COLOR_NAME || '',
        code: record.SANMAR_MAINFRAME_COLOR || '',
      },
      size: record.SIZE || '',
      inStock: parseInt(record.QTY || '0') > 0,
      quantity: parseInt(record.QTY || '0'),
      weight: this.parseWeight(record.PIECE_WEIGHT),
      pricing: {
        wholesale: this.parsePrice(record.PIECE_PRICE),
        retail: this.parsePrice(record.MSRP),
        caseQuantity: this.parseNumber(record.CASE_SIZE),
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
   * Extract pricing from EPDD record (website export format)
   */
  private extractEPDDPricing(record: SanMarEPDDRecord) {
    const piecePrice = this.parsePrice(record.PIECE_PRICE);
    const dozenPrice = this.parsePrice(record.DOZENS_PRICE);
    const casePrice = this.parsePrice(record.CASE_PRICE);
    const msrp = this.parsePrice(record.MSRP);

    return {
      basePrice: piecePrice || msrp || 0,
      currency: 'USD',
      breaks: [
        { quantity: 1, price: piecePrice || 0 },
        { quantity: 12, price: dozenPrice || 0 },
        { quantity: parseInt(record.CASE_SIZE || '0'), price: casePrice || 0 },
      ].filter(b => b.price > 0),
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
   * Calculate total quantity across all variants (website export format)
   */
  private calculateTotalQuantityEPDD(records: SanMarEPDDRecord[]): number {
    return records.reduce((sum, record) => {
      return sum + parseInt(record.QTY || '0', 10);
    }, 0);
  }

  /**
   * Extract image URLs from EPDD record
   */
  private extractImages(record: SanMarEPDDRecord): string[] {
    const images: string[] = [];
    
    if (record.FRONT_MODEL_IMAGE_URL) images.push(record.FRONT_MODEL_IMAGE_URL);
    if (record.BACK_MODEL_IMAGE) images.push(record.BACK_MODEL_IMAGE);
    if (record.FRONT_FLAT_IMAGE) images.push(record.FRONT_FLAT_IMAGE);
    if (record.BACK_FLAT_IMAGE) images.push(record.BACK_FLAT_IMAGE);
    if (record.PRODUCT_IMAGE) images.push(record.PRODUCT_IMAGE);
    if (record.COLOR_PRODUCT_IMAGE) images.push(record.COLOR_PRODUCT_IMAGE);
    
    return images;
  }

  /**
   * Generate search tags from product data (website export format)
   */
  private generateTags(record: SanMarEPDDRecord): string[] {
    const tags: string[] = [];

    if (record.MILL) tags.push(record.MILL.toLowerCase());
    if (record.CATEGORY_NAME) tags.push(record.CATEGORY_NAME.toLowerCase());
    if (record.SUBCATEGORY_NAME) tags.push(record.SUBCATEGORY_NAME.toLowerCase());

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
