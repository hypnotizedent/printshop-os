/**
 * Tests for Inventory Controller
 */

import { Request, Response } from 'express';
import { InventorySyncService } from '../inventory-sync.service';
import { InventoryController } from '../inventory.controller';

describe('InventoryController', () => {
  let mockService: jest.Mocked<InventorySyncService>;
  let controller: InventoryController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getSyncStatus: jest.fn(),
      syncAllSuppliers: jest.fn(),
      syncSupplier: jest.fn(),
      getSyncHistory: jest.fn(),
      getRecentChanges: jest.fn(),
      getInventory: jest.fn(),
    } as any;

    controller = new InventoryController(mockService);

    mockReq = {
      params: {},
      query: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getStatus', () => {
    it('should return sync status', async () => {
      const mockStatus = {
        lastSync: new Date(),
        nextSync: new Date(),
        suppliers: [],
      };

      mockService.getSyncStatus.mockResolvedValue(mockStatus);

      await controller.getStatus(mockReq as Request, mockRes as Response);

      expect(mockService.getSyncStatus).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockStatus);
    });

    it('should handle errors', async () => {
      mockService.getSyncStatus.mockRejectedValue(new Error('Database error'));

      await controller.getStatus(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get sync status',
        message: 'Database error',
      });
    });
  });

  describe('syncAll', () => {
    it('should trigger sync for all suppliers', async () => {
      const mockResults = [
        { supplierId: 'ss-activewear', status: 'completed' as const },
        { supplierId: 'sanmar', status: 'completed' as const },
      ];

      mockService.syncAllSuppliers.mockResolvedValue(mockResults as any);

      await controller.syncAll(mockReq as Request, mockRes as Response);

      expect(mockService.syncAllSuppliers).toHaveBeenCalledWith('manual');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sync completed',
        results: mockResults,
      });
    });

    it('should handle errors', async () => {
      mockService.syncAllSuppliers.mockRejectedValue(new Error('Sync failed'));

      await controller.syncAll(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to sync suppliers',
        message: 'Sync failed',
      });
    });
  });

  describe('syncSupplier', () => {
    it('should trigger sync for specific supplier', async () => {
      mockReq.params = { supplierId: 'ss-activewear' };

      const mockResult = {
        supplierId: 'ss-activewear',
        status: 'completed' as const,
        variantsSynced: 100,
      };

      mockService.syncSupplier.mockResolvedValue(mockResult as any);

      await controller.syncSupplier(mockReq as Request, mockRes as Response);

      expect(mockService.syncSupplier).toHaveBeenCalledWith('ss-activewear', 'manual');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sync completed for ss-activewear',
        result: mockResult,
      });
    });

    it('should return 400 if supplier ID is missing', async () => {
      mockReq.params = {};

      await controller.syncSupplier(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Supplier ID is required',
      });
    });

    it('should handle errors', async () => {
      mockReq.params = { supplierId: 'ss-activewear' };
      mockService.syncSupplier.mockRejectedValue(new Error('Sync failed'));

      await controller.syncSupplier(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to sync supplier',
        message: 'Sync failed',
      });
    });
  });

  describe('getHistory', () => {
    it('should return sync history with default limit', async () => {
      const mockHistory = [{ id: 'log-1' }, { id: 'log-2' }];
      mockService.getSyncHistory.mockResolvedValue(mockHistory as any);

      await controller.getHistory(mockReq as Request, mockRes as Response);

      expect(mockService.getSyncHistory).toHaveBeenCalledWith(50);
      expect(mockRes.json).toHaveBeenCalledWith(mockHistory);
    });

    it('should return sync history with custom limit', async () => {
      mockReq.query = { limit: '100' };
      const mockHistory = [{ id: 'log-1' }];
      mockService.getSyncHistory.mockResolvedValue(mockHistory as any);

      await controller.getHistory(mockReq as Request, mockRes as Response);

      expect(mockService.getSyncHistory).toHaveBeenCalledWith(100);
      expect(mockRes.json).toHaveBeenCalledWith(mockHistory);
    });

    it('should handle errors', async () => {
      mockService.getSyncHistory.mockRejectedValue(new Error('Database error'));

      await controller.getHistory(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getChanges', () => {
    it('should return recent changes with default limit', async () => {
      const mockChanges = [{ id: 'change-1' }, { id: 'change-2' }];
      mockService.getRecentChanges.mockResolvedValue(mockChanges as any);

      await controller.getChanges(mockReq as Request, mockRes as Response);

      expect(mockService.getRecentChanges).toHaveBeenCalledWith(100);
      expect(mockRes.json).toHaveBeenCalledWith(mockChanges);
    });

    it('should return recent changes with custom limit', async () => {
      mockReq.query = { limit: '50' };
      const mockChanges = [{ id: 'change-1' }];
      mockService.getRecentChanges.mockResolvedValue(mockChanges as any);

      await controller.getChanges(mockReq as Request, mockRes as Response);

      expect(mockService.getRecentChanges).toHaveBeenCalledWith(50);
      expect(mockRes.json).toHaveBeenCalledWith(mockChanges);
    });

    it('should handle errors', async () => {
      mockService.getRecentChanges.mockRejectedValue(new Error('Database error'));

      await controller.getChanges(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getInventoryBySku', () => {
    it('should return inventory for SKU', async () => {
      mockReq.params = { sku: 'SKU-001' };
      const mockInventory = [{ id: 'inv-1', sku: 'SKU-001' }];
      mockService.getInventory.mockResolvedValue(mockInventory as any);

      await controller.getInventoryBySku(mockReq as Request, mockRes as Response);

      expect(mockService.getInventory).toHaveBeenCalledWith('SKU-001');
      expect(mockRes.json).toHaveBeenCalledWith(mockInventory);
    });

    it('should return 400 if SKU is missing', async () => {
      mockReq.params = {};

      await controller.getInventoryBySku(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'SKU is required',
      });
    });

    it('should return 404 if inventory not found', async () => {
      mockReq.params = { sku: 'SKU-001' };
      mockService.getInventory.mockResolvedValue([]);

      await controller.getInventoryBySku(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Inventory not found for SKU',
      });
    });

    it('should handle errors', async () => {
      mockReq.params = { sku: 'SKU-001' };
      mockService.getInventory.mockRejectedValue(new Error('Database error'));

      await controller.getInventoryBySku(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get inventory',
        message: 'Database error',
      });
    });
  });
});
