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
    const images = (ssProduct.images || []).map((img) => img.url);
    const pricing = ssProduct.pricing || [];
    const inventory = ssProduct.inventory || [];

    return {
      sku: ssProduct.styleID || 'UNKNOWN',
      name: ssProduct.styleName || 'Unnamed Product',
      brand: ssProduct.brandName || 'Unknown Brand',
      description: ssProduct.description || '',
      category: this.mapCategory(ssProduct.categoryName),
      supplier: SupplierName.SS_ACTIVEWEAR,
      
      variants,
      images,
      
      pricing: this.transformPricing(pricing),
      
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
        inStock: this.calculateInStock(inventory),
        totalQuantity: this.calculateTotalQuantity(inventory),
      },
      
      metadata: {
        supplierProductId: ssProduct.styleID || '',
        supplierBrandId: ssProduct.brandID?.toString() || '',
        supplierCategoryId: ssProduct.categoryID?.toString() || '',
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Transform S&S product variants (color/size combinations)
   */
  private static transformVariants(ssProduct: SSProduct): ProductVariant[] {
    const variants: ProductVariant[] = [];

    // Handle missing colors or sizes arrays
    const colors = ssProduct.colors || [];
    const sizes = ssProduct.sizes || [];
    const inventory = ssProduct.inventory || [];
    const images = ssProduct.images || [];

    // If no colors/sizes, create a single variant with just the style ID
    if (colors.length === 0 || sizes.length === 0) {
      variants.push({
        sku: ssProduct.styleID,
        color: { name: 'Default', hex: '#000000' },
        size: sizes[0] || 'OS',
        inStock: inventory.length > 0 ? inventory.some(inv => inv.qty > 0) : false,
        quantity: inventory.reduce((sum, inv) => sum + (inv.qty || 0), 0),
      });
      return variants;
    }

    // Create a variant for each color/size combination
    colors.forEach((color) => {
      sizes.forEach((size) => {
        // Find inventory for this color/size combo
        const inv = inventory.find(
          (i) => i.colorName === color.colorName && i.size === size
        );

        // Find image for this color
        const colorImage = images.find(
          (img) => img.color === color.colorName || img.type === 'front'
        );

        variants.push({
          sku: `${ssProduct.styleID}-${this.sanitizeSku(color.colorName)}-${this.sanitizeSku(size)}`,
          color: {
            name: color.colorName,
            code: color.colorCode,
            hex: color.hexCode || '#000000',
            family: color.colorFamilyName,
          },
          size: size,
          inStock: inv ? inv.qty > 0 : false,
          quantity: inv?.qty || 0,
          imageUrl: colorImage?.url,
          warehouseLocation: inv?.warehouseLocation,
        });
      });
    });

    return variants;
  }

  /**
   * Transform S&S pricing breaks
   */
  private static transformPricing(ssPricing: SSPricing[]): UnifiedProduct['pricing'] {
    if (!ssPricing || ssPricing.length === 0) {
      return { basePrice: 0, breaks: [], currency: 'USD' };
    }

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
  private static mapCategory(ssCategory: string | undefined): ProductCategory {
    if (!ssCategory) return ProductCategory.OTHER;

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
    if (!inventory || inventory.length === 0) return false;
    return inventory.some((item) => item.qty > 0);
  }

  /**
   * Calculate total quantity across all variants
   */
  private static calculateTotalQuantity(inventory: SSInventory[]): number {
    if (!inventory || inventory.length === 0) return 0;
    return inventory.reduce((total, item) => total + (item.qty || 0), 0);
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
