/**
 * Webhook Handler for Supplier Inventory Updates
 * Processes real-time inventory updates from suppliers
 */

import { Request, Response } from 'express';
import { InventorySyncService } from './inventory-sync.service';
import { SupplierInventoryData } from './types';
import crypto from 'crypto';

export class WebhookHandler {
  private inventorySyncService: InventorySyncService;

  constructor(inventorySyncService: InventorySyncService) {
    this.inventorySyncService = inventorySyncService;
  }

  /**
   * Handle webhook request
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId, sku, quantity, price, leadTime } = req.body;

      // Validate required fields
      if (!supplierId || !sku) {
        res.status(400).json({ error: 'Missing required fields: supplierId, sku' });
        return;
      }

      // Verify webhook signature (supplier-specific)
      const isValid = await this.verifyWebhookSignature(req, supplierId);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      // Find variant by supplier SKU
      const inventory = await this.inventorySyncService.getInventory(sku);
      
      if (!inventory || inventory.length === 0) {
        res.status(404).json({ error: 'Variant not found for SKU' });
        return;
      }

      const variant = inventory[0];

      // Update inventory
      const supplierData: SupplierInventoryData = {
        supplierId: variant.supplierId,
        supplierSKU: sku,
        quantity: quantity ?? variant.quantity,
        price: price ?? variant.price,
        leadTime: leadTime ?? variant.leadTime,
        isAvailable: true,
      };

      await this.inventorySyncService.updateVariantInventory(
        variant.variantId,
        supplierData,
        'webhook'
      );

      // Log webhook receipt
      console.log(`[Webhook] Inventory updated for SKU ${sku} from ${supplierId}`);

      res.json({ 
        success: true,
        message: 'Inventory updated successfully',
        sku,
        quantity: supplierData.quantity,
        price: supplierData.price,
      });
    } catch (error: any) {
      console.error('[Webhook] Error processing webhook:', error);
      res.status(500).json({ 
        error: 'Failed to process webhook',
        message: error.message,
      });
    }
  }

  /**
   * Verify webhook signature
   * Different suppliers use different signature methods
   */
  private async verifyWebhookSignature(req: Request, supplierId: string): Promise<boolean> {
    const signature = req.headers['x-signature'] as string;
    
    // If no signature header, check if it's from a trusted source
    // In development, we can be more lenient
    if (!signature) {
      console.warn('[Webhook] No signature provided, accepting in development mode');
      return true;
    }

    // Get supplier-specific secret
    const secret = this.getSupplierWebhookSecret(supplierId);
    if (!secret) {
      console.warn(`[Webhook] No webhook secret configured for ${supplierId}`);
      return true; // Accept if no secret is configured
    }

    // Calculate expected signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get webhook secret for a supplier
   */
  private getSupplierWebhookSecret(supplierId: string): string | undefined {
    // In a real implementation, this would fetch from environment variables or database
    const secrets: Record<string, string> = {
      'ss-activewear': process.env.SS_WEBHOOK_SECRET || '',
      'sanmar': process.env.SANMAR_WEBHOOK_SECRET || '',
      'as-colour': process.env.AS_COLOUR_WEBHOOK_SECRET || '',
    };

    return secrets[supplierId];
  }
}
