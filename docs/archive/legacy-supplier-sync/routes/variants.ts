/**
 * Variant API Routes
 */

import { Router } from 'express';
import * as variantController from '../lib/variants/variant.controller';

const router = Router();

// Variant CRUD operations
router.post('/variants', variantController.createVariant);
router.get('/variants', variantController.listVariants);
router.get('/variants/search', variantController.searchVariants);
router.get('/variants/:id', variantController.getVariant);
router.patch('/variants/:id', variantController.updateVariant);
router.delete('/variants/:id', variantController.deleteVariant);

// Product-specific variants
router.get('/products/:productId/variants', variantController.getVariantsByProduct);

// Supplier SKU mappings
router.post('/variants/:variantId/supplier-mappings', variantController.addSupplierMapping);
router.patch('/supplier-mappings/:mappingId', variantController.updateSupplierMapping);
router.delete('/supplier-mappings/:mappingId', variantController.removeSupplierMapping);

// Inventory sync
router.post('/variants/:variantId/sync-inventory', variantController.syncInventory);

// Bulk operations
router.post('/variants/bulk-import', variantController.bulkImport);
router.post('/variants/bulk-update-pricing', variantController.bulkUpdatePricing);
router.post('/variants/bulk-sync-inventory', variantController.bulkSyncInventory);

export default router;
