/**
 * Inventory Controller
 * Handles HTTP requests for inventory management
 */

import { Request, Response } from 'express';
import { InventorySyncService } from './inventory-sync.service';

export class InventoryController {
  private inventorySyncService: InventorySyncService;

  constructor(inventorySyncService: InventorySyncService) {
    this.inventorySyncService = inventorySyncService;
  }

  /**
   * GET /api/supplier/inventory/status
   * Get overall sync status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.inventorySyncService.getSyncStatus();
      res.json(status);
    } catch (error: any) {
      console.error('[Controller] Error getting sync status:', error);
      res.status(500).json({ 
        error: 'Failed to get sync status',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/supplier/inventory/sync
   * Trigger manual sync for all suppliers
   */
  async syncAll(req: Request, res: Response): Promise<void> {
    try {
      // Start sync asynchronously
      const results = await this.inventorySyncService.syncAllSuppliers('manual');
      
      res.json({
        success: true,
        message: 'Sync completed',
        results,
      });
    } catch (error: any) {
      console.error('[Controller] Error syncing all suppliers:', error);
      res.status(500).json({ 
        error: 'Failed to sync suppliers',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/supplier/inventory/sync/:supplierId
   * Trigger manual sync for a specific supplier
   */
  async syncSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      
      if (!supplierId) {
        res.status(400).json({ error: 'Supplier ID is required' });
        return;
      }

      const result = await this.inventorySyncService.syncSupplier(supplierId, 'manual');
      
      res.json({
        success: true,
        message: `Sync completed for ${supplierId}`,
        result,
      });
    } catch (error: any) {
      console.error('[Controller] Error syncing supplier:', error);
      res.status(500).json({ 
        error: 'Failed to sync supplier',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/supplier/inventory/history
   * Get sync history
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await this.inventorySyncService.getSyncHistory(limit);
      
      res.json(history);
    } catch (error: any) {
      console.error('[Controller] Error getting sync history:', error);
      res.status(500).json({ 
        error: 'Failed to get sync history',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/supplier/inventory/changes
   * Get recent inventory changes
   */
  async getChanges(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const changes = await this.inventorySyncService.getRecentChanges(limit);
      
      res.json(changes);
    } catch (error: any) {
      console.error('[Controller] Error getting changes:', error);
      res.status(500).json({ 
        error: 'Failed to get changes',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/supplier/inventory/:sku
   * Get inventory for a specific SKU
   */
  async getInventoryBySku(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.params;
      
      if (!sku) {
        res.status(400).json({ error: 'SKU is required' });
        return;
      }

      const inventory = await this.inventorySyncService.getInventory(sku);
      
      if (!inventory || inventory.length === 0) {
        res.status(404).json({ error: 'Inventory not found for SKU' });
        return;
      }

      res.json(inventory);
    } catch (error: any) {
      console.error('[Controller] Error getting inventory:', error);
      res.status(500).json({ 
        error: 'Failed to get inventory',
        message: error.message,
      });
    }
  }
}
