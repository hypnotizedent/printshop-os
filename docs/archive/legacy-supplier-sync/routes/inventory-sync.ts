/**
 * Inventory Sync Routes
 * API routes for inventory synchronization
 */

import { Router } from 'express';
import { InventoryController } from '../inventory/inventory.controller';
import { WebhookHandler } from '../inventory/webhook-handler';

export function createInventoryRoutes(
  inventoryController: InventoryController,
  webhookHandler: WebhookHandler
): Router {
  const router = Router();

  // Get overall sync status
  router.get('/status', (req, res) => inventoryController.getStatus(req, res));

  // Trigger manual sync for all suppliers
  router.post('/sync', (req, res) => inventoryController.syncAll(req, res));

  // Trigger manual sync for specific supplier
  router.post('/sync/:supplierId', (req, res) => 
    inventoryController.syncSupplier(req, res)
  );

  // Get sync history
  router.get('/history', (req, res) => inventoryController.getHistory(req, res));

  // Get recent changes
  router.get('/changes', (req, res) => inventoryController.getChanges(req, res));

  // Webhook endpoint for supplier updates
  router.post('/webhook', (req, res) => webhookHandler.handleWebhook(req, res));

  // Get inventory by SKU
  router.get('/:sku', (req, res) => inventoryController.getInventoryBySku(req, res));

  return router;
}
