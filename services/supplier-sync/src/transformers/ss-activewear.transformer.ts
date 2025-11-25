import { SSProduct, SSColor, SSPricing, SSInventory } from '../clients/ss-activewear.client';
import {
  UnifiedProduct,
  ProductVariant,
  SupplierName,
  ProductCategory,
} from '../types/product';

/**
 * S&S Activewear Data Transformer
 * Converts S&S API responses to UnifiedProduct schema
 */
export class SSActivewearTransformer {
  /**
   * Transform S&S product to unified format
   */
  static transformProduct(ssProduct: SSProduct): UnifiedProduct {
    const variants = this.transformVariants(ssProduct);
    const images = ssProduct.images.map((img) => img.url);

    return {
      sku: ssProduct.styleID,
      name: ssProduct.styleName,
      brand: ssProduct.brandName,
      description: ssProduct.description,
      category: this.mapCategory(ssProduct.categoryName),
      supplier: SupplierName.SS_ACTIVEWEAR,
      
      variants,
      images,
      
      pricing: this.transformPricing(ssProduct.pricing),
      
      specifications: {
        weight: ssProduct.pieceWeight,
        fabric: {
          type: ssProduct.fabricType,
          content: ssProduct.fabricContent,
        },
        fit: ssProduct.specifications?.fit,
        features: ssProduct.specifications?.features || [],
        printMethods: ssProduct.specifications?.printMethods || [],
      },
      
      availability: {
        inStock: this.calculateInStock(ssProduct.inventory),
        totalQuantity: this.calculateTotalQuantity(ssProduct.inventory),
      },
      
      metadata: {
        supplierProductId: ssProduct.styleID,
        supplierBrandId: ssProduct.brandID.toString(),
        supplierCategoryId: ssProduct.categoryID.toString(),
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Transform S&S product variants (color/size combinations)
   */
  private static transformVariants(ssProduct: SSProduct): ProductVariant[] {
    const variants: ProductVariant[] = [];

    // Create a variant for each color/size combination
    ssProduct.colors.forEach((color) => {
      ssProduct.sizes.forEach((size) => {
        // Find inventory for this color/size combo
        const inventory = ssProduct.inventory.find(
          (inv) => inv.colorName === color.colorName && inv.size === size
        );

        // Find image for this color
        const colorImage = ssProduct.images.find(
          (img) => img.color === color.colorName || img.type === 'front'
        );

        variants.push({
          sku: `${ssProduct.styleID}-${this.sanitizeSku(color.colorName)}-${this.sanitizeSku(size)}`,
          color: {
            name: color.colorName,
            code: color.colorCode,
            hex: color.hexCode,
            family: color.colorFamilyName,
          },
          size: size,
          inStock: inventory ? inventory.qty > 0 : false,
          quantity: inventory?.qty || 0,
          imageUrl: colorImage?.url,
          warehouseLocation: inventory?.warehouseLocation,
        });
      });
    });

    return variants;
  }

  /**
   * Transform S&S pricing breaks
   */
  private static transformPricing(ssPricing: SSPricing[]): UnifiedProduct['pricing'] {
    const breaks = ssPricing.map((priceBreak) => ({
      quantity: priceBreak.quantity,
      price: priceBreak.price,
      casePrice: priceBreak.casePrice,
    }));

    // Sort by quantity ascending
    breaks.sort((a, b) => a.quantity - b.quantity);

    return {
      basePrice: breaks[0]?.price || 0,
      breaks,
      currency: 'USD',
    };
  }

  /**
   * Map S&S category to unified category
   */
  private static mapCategory(ssCategory: string): ProductCategory {
    const categoryMap: Record<string, ProductCategory> = {
      't-shirts': ProductCategory.T_SHIRTS,
      'tshirts': ProductCategory.T_SHIRTS,
      'polo shirts': ProductCategory.POLOS,
      'polos': ProductCategory.POLOS,
      'hoodies': ProductCategory.HOODIES,
      'sweatshirts': ProductCategory.HOODIES,
      'jackets': ProductCategory.OUTERWEAR,
      'outerwear': ProductCategory.OUTERWEAR,
      'hats': ProductCategory.HEADWEAR,
      'caps': ProductCategory.HEADWEAR,
      'headwear': ProductCategory.HEADWEAR,
      'bags': ProductCategory.BAGS,
      'totes': ProductCategory.BAGS,
      'youth': ProductCategory.YOUTH,
      'kids': ProductCategory.YOUTH,
      'ladies': ProductCategory.OTHER,
      'womens': ProductCategory.OTHER,
    };

    const normalized = ssCategory.toLowerCase();
    return categoryMap[normalized] || ProductCategory.OTHER;
  }

  /**
   * Calculate if product is in stock (any variant has quantity)
   */
  private static calculateInStock(inventory: SSInventory[]): boolean {
    return inventory.some((item) => item.qty > 0);
  }

  /**
   * Calculate total quantity across all variants
   */
  private static calculateTotalQuantity(inventory: SSInventory[]): number {
    return inventory.reduce((total, item) => total + item.qty, 0);
  }

  /**
   * Sanitize string for SKU usage (remove special chars, spaces)
   */
  private static sanitizeSku(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toUpperCase();
  }

  /**
   * Transform batch of S&S products
   */
  static transformProducts(ssProducts: SSProduct[]): UnifiedProduct[] {
    return ssProducts.map((product) => this.transformProduct(product));
  }
}
