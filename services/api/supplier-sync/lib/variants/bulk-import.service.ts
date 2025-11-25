/**
 * Bulk Import Service - Import variants from supplier catalogs
 */

import { PrismaClient } from '@prisma/client';
import { BulkImportRequest } from '../types';
import { generateInternalSKU } from './sku-mapper';
import { normalizeSize, normalizeColor, calculateMarkup, determineInventoryStatus, getColorHex } from './variant-mapper';
import { SupplierConnector } from '../types';

const prisma = new PrismaClient();

/**
 * Import variants from supplier catalog
 */
export async function bulkImportVariants(
  request: BulkImportRequest,
  supplierConnector: SupplierConnector
): Promise<{
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;
  
  try {
    // Get product to map to
    let product;
    if (request.mapToExistingProduct) {
      product = await prisma.product.findUnique({
        where: { id: request.mapToExistingProduct },
      });
      
      if (!product) {
        throw new Error(`Product with ID ${request.mapToExistingProduct} not found`);
      }
    } else {
      // If no product specified, try to find by identifier
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { styleId: request.productIdentifier },
            { name: { contains: request.productIdentifier, mode: 'insensitive' } },
          ],
        },
      });
      
      if (!product) {
        throw new Error(`Product matching "${request.productIdentifier}" not found`);
      }
    }
    
    // Fetch product variants from supplier
    const supplierProduct = await supplierConnector.fetchProduct(request.productIdentifier);
    
    if (!supplierProduct) {
      throw new Error(`Product "${request.productIdentifier}" not found in supplier catalog`);
    }
    
    // Get or create base SKU for the product
    const baseSKU = product.styleId || `${product.brand.substring(0, 3).toUpperCase()}-${product.id.substring(0, 8)}`;
    
    // Get default markup percentage
    const markupPercentage = request.markupPercentage ?? 80;
    
    // Process each color/size combination
    const colors = supplierProduct.colors || [];
    const sizes = supplierProduct.sizes || [];
    
    if (colors.length === 0 || sizes.length === 0) {
      errors.push('No colors or sizes found in supplier product');
      return { success: false, imported, skipped, errors };
    }
    
    for (const colorVariant of colors) {
      const normalizedColor = normalizeColor(colorVariant.name);
      const colorHex = getColorHex(normalizedColor) || colorVariant.hex || null;
      
      for (const size of sizes) {
        const normalizedSize = normalizeSize(size);
        
        try {
          // Generate internal SKU
          const sku = generateInternalSKU({
            baseSKU,
            color: normalizedColor,
            size: normalizedSize,
          });
          
          // Check if variant already exists
          const existing = await prisma.productVariant.findUnique({
            where: { sku },
          });
          
          if (existing) {
            skipped++;
            continue;
          }
          
          // Calculate pricing
          const supplierPrice = colorVariant.price || supplierProduct.baseCost || 0;
          const retailPrice = calculateMarkup(supplierPrice, markupPercentage);
          
          // Determine inventory
          const inventoryQty = colorVariant.stock || 0;
          const inventoryStatus = determineInventoryStatus(inventoryQty);
          
          // Create variant
          const variant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku,
              size: normalizedSize,
              color: normalizedColor,
              colorCode: colorHex,
              price: retailPrice,
              wholesaleCost: supplierPrice,
              inventoryQty,
              inventoryStatus,
              images: supplierProduct.imageUrls || [],
              isActive: true,
            },
          });
          
          // Add supplier mapping
          await prisma.supplierSKU.create({
            data: {
              variantId: variant.id,
              supplierId: request.supplierId,
              supplierName: supplierProduct.supplier,
              supplierSKU: colorVariant.sku || `${request.productIdentifier}-${colorVariant.name}-${size}`,
              supplierPrice,
              isPrimary: true,
              leadTimeDays: 3,
              moq: 1,
              inStock: inventoryQty > 0,
            },
          });
          
          imported++;
        } catch (error: any) {
          errors.push(`Failed to import ${normalizedColor}/${normalizedSize}: ${error.message}`);
          skipped++;
        }
      }
    }
    
    return {
      success: errors.length === 0,
      imported,
      skipped,
      errors,
    };
  } catch (error: any) {
    errors.push(error.message);
    return {
      success: false,
      imported,
      skipped,
      errors,
    };
  }
}

/**
 * Bulk update variant pricing
 */
export async function bulkUpdatePricing(
  filters: {
    productId?: string;
    brand?: string;
    variantIds?: string[];
  },
  update: {
    markupPercentage?: number;
    fixedPrice?: number;
  }
): Promise<{
  success: boolean;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let updated = 0;
  
  try {
    const where: any = {};
    
    if (filters.variantIds && filters.variantIds.length > 0) {
      where.id = { in: filters.variantIds };
    }
    
    if (filters.productId) {
      where.productId = filters.productId;
    }
    
    if (filters.brand) {
      where.product = {
        brand: filters.brand,
      };
    }
    
    // Get variants to update
    const variants = await prisma.productVariant.findMany({
      where,
    });
    
    // Update each variant
    for (const variant of variants) {
      try {
        let newPrice: number;
        
        if (update.fixedPrice !== undefined) {
          newPrice = update.fixedPrice;
        } else if (update.markupPercentage !== undefined) {
          newPrice = calculateMarkup(variant.wholesaleCost, update.markupPercentage);
        } else {
          throw new Error('Either markupPercentage or fixedPrice must be provided');
        }
        
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { price: newPrice },
        });
        
        updated++;
      } catch (error: any) {
        errors.push(`Failed to update variant ${variant.sku}: ${error.message}`);
      }
    }
    
    return {
      success: errors.length === 0,
      updated,
      errors,
    };
  } catch (error: any) {
    errors.push(error.message);
    return {
      success: false,
      updated,
      errors,
    };
  }
}

/**
 * Bulk sync inventory from suppliers
 */
export async function bulkSyncInventory(
  variantIds: string[]
): Promise<{
  success: boolean;
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;
  
  try {
    for (const variantId of variantIds) {
      try {
        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
          include: {
            supplierMappings: true,
          },
        });
        
        if (!variant) {
          errors.push(`Variant ${variantId} not found`);
          continue;
        }
        
        // Get primary supplier or first supplier
        const primaryMapping = variant.supplierMappings.find(m => m.isPrimary) || variant.supplierMappings[0];
        
        if (!primaryMapping) {
          errors.push(`No supplier mapping found for variant ${variant.sku}`);
          continue;
        }
        
        // Here you would call the supplier API to get current inventory
        // For now, we'll just update the lastSync timestamp
        await prisma.productVariant.update({
          where: { id: variantId },
          data: {
            lastSync: new Date(),
          },
        });
        
        synced++;
      } catch (error: any) {
        errors.push(`Failed to sync variant ${variantId}: ${error.message}`);
      }
    }
    
    return {
      success: errors.length === 0,
      synced,
      errors,
    };
  } catch (error: any) {
    errors.push(error.message);
    return {
      success: false,
      synced,
      errors,
    };
  }
}
