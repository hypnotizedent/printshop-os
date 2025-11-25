import { SanMarProduct } from '../clients/sanmar.client';
import { UnifiedProduct, ProductVariant, SupplierName, ProductCategory } from '../types/product';
import { logger } from '../utils/logger';

/**
 * Transformer for SanMar products to unified format
 */
export class SanMarTransformer {
  /**
   * Transform a single SanMar product to unified format
   */
  transformProduct(product: SanMarProduct): UnifiedProduct {
    const totalQuantity = this.calculateTotalQuantity(product);
    
    return {
      // Core identification
      sku: this.generateSKU(product),
      name: product.styleName,
      brand: product.brandName,
      description: product.description || '',
      category: this.mapCategory(product.categoryName),
      supplier: SupplierName.SANMAR,
      
      // Variants (color/size combinations)
      variants: this.transformVariants(product),
      
      // Images
      images: this.transformImages(product),
      
      // Pricing
      pricing: {
        basePrice: product.wholesalePrice || 0,
        currency: 'USD',
        breaks: product.retailPrice ? [{
          quantity: 1,
          price: product.retailPrice,
        }] : undefined,
      },
      
      // Specifications
      specifications: {
        weight: product.fabricWeight,
        fabric: product.fabricContent ? {
          type: 'various',
          content: product.fabricContent,
        } : undefined,
      },
      
      // Availability
      availability: {
        inStock: product.availability === 'in-stock',
        totalQuantity,
      },
      
      // Metadata
      metadata: {
        supplierProductId: product.styleID,
        supplierCategoryId: product.categoryID,
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Transform multiple products
   */
  transformProducts(products: SanMarProduct[]): UnifiedProduct[] {
    const transformed: UnifiedProduct[] = [];
    const errors: Array<{ product: string; error: string }> = [];

    products.forEach((product) => {
      try {
        transformed.push(this.transformProduct(product));
      } catch (error) {
        const err = error as Error;
        errors.push({
          product: product.styleID,
          error: err.message,
        });
        logger.warn(`Failed to transform product ${product.styleID}: ${err.message}`);
      }
    });

    if (errors.length > 0) {
      logger.warn(`Transformation completed with ${errors.length} errors`, {
        errors: errors.slice(0, 10), // Log first 10 errors
      });
    }

    return transformed;
  }

  /**
   * Generate unique SKU
   */
  private generateSKU(product: SanMarProduct): string {
    const brand = product.brandName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
    const style = product.styleID.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `SM-${brand}-${style}`;
  }

  /**
   * Transform product variants (color/size combinations)
   */
  private transformVariants(product: SanMarProduct): ProductVariant[] {
    const variants: ProductVariant[] = [];

    if (!product.colors || !product.sizes) {
      return variants;
    }

    // Generate all color/size combinations
    product.colors.forEach((color) => {
      product.sizes.forEach((size) => {
        variants.push({
          sku: `${product.styleID}-${color.colorCode}-${size}`,
          color: {
            name: color.colorName,
            code: color.colorCode,
            hex: color.hexCode,
          },
          size: size,
          inStock: (color.inventory || 0) > 0,
          quantity: color.inventory || 0,
        });
      });
    });

    return variants;
  }

  /**
   * Map SanMar category to ProductCategory enum
   */
  private mapCategory(categoryName?: string): ProductCategory {
    if (!categoryName) return ProductCategory.OTHER;
    
    const lower = categoryName.toLowerCase();
    if (lower.includes('t-shirt') || lower.includes('tee')) return ProductCategory.T_SHIRTS;
    if (lower.includes('polo')) return ProductCategory.POLOS;
    if (lower.includes('hoodie')) return ProductCategory.HOODIES;
    if (lower.includes('sweatshirt')) return ProductCategory.SWEATSHIRTS;
    if (lower.includes('hat') || lower.includes('cap')) return ProductCategory.HEADWEAR;
    if (lower.includes('bag')) return ProductCategory.BAGS;
    if (lower.includes('jacket') || lower.includes('coat')) return ProductCategory.OUTERWEAR;
    if (lower.includes('athletic') || lower.includes('sport')) return ProductCategory.ATHLETIC;
    if (lower.includes('work')) return ProductCategory.WORKWEAR;
    if (lower.includes('youth') || lower.includes('kid')) return ProductCategory.YOUTH;
    
    return ProductCategory.OTHER;
  }

  /**
   * Calculate total inventory quantity
   */
  private calculateTotalQuantity(product: SanMarProduct): number {
    if (!product.colors) return 0;
    return product.colors.reduce((sum, color) => sum + (color.inventory || 0), 0);
  }

  /**
   * Transform product images
   */
  private transformImages(product: SanMarProduct): string[] {
    if (!product.images || product.images.length === 0) {
      return [];
    }

    // Return image URLs in priority order: front, side, back, detail
    const priorityOrder = ['front', 'side', 'back', 'detail'];
    return product.images
      .sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.type);
        const bIndex = priorityOrder.indexOf(b.type);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      })
      .map((img) => img.url);
  }

  /**
   * Generate searchable tags from product data
   */
  private generateTags(product: SanMarProduct): string[] {
    const tags: string[] = [];

    // Add brand
    if (product.brandName) {
      tags.push(product.brandName.toLowerCase());
    }

    // Add category
    if (product.categoryName) {
      tags.push(product.categoryName.toLowerCase());
    }

    // Add fabric weight if available
    if (product.fabricWeight) {
      tags.push(`${product.fabricWeight}-oz`);
    }

    // Add colors
    if (product.colors) {
      product.colors.forEach((color) => {
        tags.push(color.colorName.toLowerCase());
      });
    }

    // Add availability status
    if (product.availability) {
      tags.push(product.availability);
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Calculate statistics for transformed products
   */
  calculateStats(products: UnifiedProduct[]): {
    totalProducts: number;
    totalVariants: number;
    uniqueBrands: number;
    uniqueCategories: number;
    inStock: number;
    outOfStock: number;
    avgVariantsPerProduct: number;
  } {
    const brands = new Set<string>();
    const categories = new Set<string>();
    let totalVariants = 0;
    let inStock = 0;
    let outOfStock = 0;

    products.forEach((product) => {
      brands.add(product.brand);
      categories.add(product.category);
      totalVariants += product.variants.length;

      product.variants.forEach((variant) => {
        if (variant.inStock && variant.quantity > 0) {
          inStock++;
        } else {
          outOfStock++;
        }
      });
    });

    return {
      totalProducts: products.length,
      totalVariants,
      uniqueBrands: brands.size,
      uniqueCategories: categories.size,
      inStock,
      outOfStock,
      avgVariantsPerProduct: products.length > 0 ? totalVariants / products.length : 0,
    };
  }
}
