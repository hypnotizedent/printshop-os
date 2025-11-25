/**
 * Tests for Webhook Handler
 */

import { Request, Response } from 'express';
import { InventorySyncService } from '../inventory-sync.service';
import { WebhookHandler } from '../webhook-handler';

describe('WebhookHandler', () => {
  let mockService: jest.Mocked<InventorySyncService>;
  let handler: WebhookHandler;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getInventory: jest.fn(),
      updateVariantInventory: jest.fn(),
    } as any;

    handler = new WebhookHandler(mockService);

    mockReq = {
      body: {},
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('handleWebhook', () => {
    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {};

      await handler.handleWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required fields: supplierId, sku',
      });
    });

    it('should return 404 if variant not found', async () => {
      mockReq.body = {
        supplierId: 'ss-activewear',
        sku: 'SKU-001',
        quantity: 100,
        price: 15.99,
      };

      mockService.getInventory.mockResolvedValue([]);

      await handler.handleWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Variant not found for SKU',
      });
    });

    it('should update inventory successfully', async () => {
      mockReq.body = {
        supplierId: 'ss-activewear',
        sku: 'SKU-001',
        quantity: 100,
        price: 15.99,
      };

      const mockInventory = [
        {
          id: 'inv-123',
          variantId: 'variant-123',
          supplierId: 'supplier-123',
          supplierSKU: 'SKU-001',
          quantity: 50,
          price: 14.99,
          leadTime: 7,
        },
      ];

      mockService.getInventory.mockResolvedValue(mockInventory as any);
      mockService.updateVariantInventory.mockResolvedValue([]);

      await handler.handleWebhook(mockReq as Request, mockRes as Response);

      expect(mockService.updateVariantInventory).toHaveBeenCalledWith(
        'variant-123',
        expect.objectContaining({
          supplierId: 'supplier-123',
          supplierSKU: 'SKU-001',
          quantity: 100,
          price: 15.99,
        }),
        'webhook'
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Inventory updated successfully',
        sku: 'SKU-001',
        quantity: 100,
        price: 15.99,
      });
    });

    it('should handle errors gracefully', async () => {
      mockReq.body = {
        supplierId: 'ss-activewear',
        sku: 'SKU-001',
        quantity: 100,
      };

      mockService.getInventory.mockRejectedValue(new Error('Database error'));

      await handler.handleWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to process webhook',
        message: 'Database error',
      });
    });

    it('should accept webhook without signature in development', async () => {
      mockReq.body = {
        supplierId: 'ss-activewear',
        sku: 'SKU-001',
        quantity: 100,
      };

      mockReq.headers = {};

      const mockInventory = [
        {
          variantId: 'variant-123',
          supplierId: 'supplier-123',
          supplierSKU: 'SKU-001',
          quantity: 50,
          price: 14.99,
          leadTime: 7,
        },
      ];

      mockService.getInventory.mockResolvedValue(mockInventory as any);
      mockService.updateVariantInventory.mockResolvedValue([]);

      await handler.handleWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });
});
