/**
 * Variant Controller - HTTP request handlers for variant endpoints
 */

import { Request, Response } from 'express';
import * as variantService from './variant.service';
import { VariantFilters } from '../types';

/**
 * Create a new variant
 */
export async function createVariant(req: Request, res: Response): Promise<void> {
  try {
    const variant = await variantService.createVariant(req.body);
    res.status(201).json(variant);
  } catch (error: any) {
    console.error('Error creating variant:', error);
    res.status(400).json({ error: error.message || 'Failed to create variant' });
  }
}

/**
 * Get variant by ID
 */
export async function getVariant(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const variant = await variantService.getVariantById(id);
    
    if (!variant) {
      res.status(404).json({ error: 'Variant not found' });
      return;
    }
    
    res.json(variant);
  } catch (error: any) {
    console.error('Error getting variant:', error);
    res.status(500).json({ error: 'Failed to get variant' });
  }
}

/**
 * List variants with filters
 */
export async function listVariants(req: Request, res: Response): Promise<void> {
  try {
    const filters: VariantFilters = {
      productId: req.query.productId as string,
      brand: req.query.brand as string,
      size: req.query.size as string,
      color: req.query.color as string,
      status: req.query.status as any,
      supplierId: req.query.supplierId as string,
      search: req.query.search as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    };
    
    const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
    const take = req.query.take ? parseInt(req.query.take as string) : 100;
    const orderBy = req.query.orderBy as string;
    
    let orderByObj: any = { createdAt: 'desc' };
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      orderByObj = { [field]: direction || 'asc' };
    }
    
    const result = await variantService.listVariants(filters, {
      skip,
      take,
      orderBy: orderByObj,
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Error listing variants:', error);
    res.status(500).json({ error: 'Failed to list variants' });
  }
}

/**
 * Update variant
 */
export async function updateVariant(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const variant = await variantService.updateVariant(id, req.body);
    res.json(variant);
  } catch (error: any) {
    console.error('Error updating variant:', error);
    res.status(400).json({ error: error.message || 'Failed to update variant' });
  }
}

/**
 * Delete variant
 */
export async function deleteVariant(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await variantService.deleteVariant(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
}

/**
 * Add supplier mapping to variant
 */
export async function addSupplierMapping(req: Request, res: Response): Promise<void> {
  try {
    const { variantId } = req.params;
    const mapping = await variantService.addSupplierMapping(variantId, req.body);
    res.status(201).json(mapping);
  } catch (error: any) {
    console.error('Error adding supplier mapping:', error);
    res.status(400).json({ error: error.message || 'Failed to add supplier mapping' });
  }
}

/**
 * Update supplier mapping
 */
export async function updateSupplierMapping(req: Request, res: Response): Promise<void> {
  try {
    const { mappingId } = req.params;
    const mapping = await variantService.updateSupplierMapping(mappingId, req.body);
    res.json(mapping);
  } catch (error: any) {
    console.error('Error updating supplier mapping:', error);
    res.status(400).json({ error: error.message || 'Failed to update supplier mapping' });
  }
}

/**
 * Remove supplier mapping
 */
export async function removeSupplierMapping(req: Request, res: Response): Promise<void> {
  try {
    const { mappingId } = req.params;
    await variantService.removeSupplierMapping(mappingId);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error removing supplier mapping:', error);
    res.status(500).json({ error: 'Failed to remove supplier mapping' });
  }
}

/**
 * Search variants
 */
export async function searchVariants(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }
    
    const take = req.query.take ? parseInt(req.query.take as string) : 50;
    const variants = await variantService.searchVariants(query, { take });
    
    res.json({ variants, total: variants.length });
  } catch (error: any) {
    console.error('Error searching variants:', error);
    res.status(500).json({ error: 'Failed to search variants' });
  }
}

/**
 * Get variants by product
 */
export async function getVariantsByProduct(req: Request, res: Response): Promise<void> {
  try {
    const { productId } = req.params;
    const variants = await variantService.getVariantsByProduct(productId);
    res.json({ variants, total: variants.length });
  } catch (error: any) {
    console.error('Error getting variants by product:', error);
    res.status(500).json({ error: 'Failed to get variants by product' });
  }
}

/**
 * Sync inventory for variant
 */
export async function syncInventory(req: Request, res: Response): Promise<void> {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || typeof quantity !== 'number') {
      res.status(400).json({ error: 'Quantity is required and must be a number' });
      return;
    }
    
    const variant = await variantService.syncInventory(variantId, quantity);
    res.json(variant);
  } catch (error: any) {
    console.error('Error syncing inventory:', error);
    res.status(500).json({ error: 'Failed to sync inventory' });
  }
}

/**
 * Bulk import variants from supplier
 */
export async function bulkImport(req: Request, res: Response): Promise<void> {
  try {
    const { bulkImportVariants } = await import('./bulk-import.service');
    
    // This would need the actual supplier connector instance
    // For now, we'll return an error indicating the connector is needed
    res.status(501).json({ 
      error: 'Bulk import requires supplier connector integration',
      message: 'This endpoint needs to be integrated with the supplier connector service'
    });
  } catch (error: any) {
    console.error('Error bulk importing variants:', error);
    res.status(500).json({ error: 'Failed to bulk import variants' });
  }
}

/**
 * Bulk update pricing
 */
export async function bulkUpdatePricing(req: Request, res: Response): Promise<void> {
  try {
    const { bulkUpdatePricing } = await import('./bulk-import.service');
    const { filters, update } = req.body;
    
    if (!update || (!update.markupPercentage && !update.fixedPrice)) {
      res.status(400).json({ error: 'Update must include markupPercentage or fixedPrice' });
      return;
    }
    
    const result = await bulkUpdatePricing(filters || {}, update);
    res.json(result);
  } catch (error: any) {
    console.error('Error bulk updating pricing:', error);
    res.status(500).json({ error: 'Failed to bulk update pricing' });
  }
}

/**
 * Bulk sync inventory
 */
export async function bulkSyncInventory(req: Request, res: Response): Promise<void> {
  try {
    const { bulkSyncInventory } = await import('./bulk-import.service');
    const { variantIds } = req.body;
    
    if (!variantIds || !Array.isArray(variantIds)) {
      res.status(400).json({ error: 'variantIds must be an array' });
      return;
    }
    
    const result = await bulkSyncInventory(variantIds);
    res.json(result);
  } catch (error: any) {
    console.error('Error bulk syncing inventory:', error);
    res.status(500).json({ error: 'Failed to bulk sync inventory' });
  }
}
