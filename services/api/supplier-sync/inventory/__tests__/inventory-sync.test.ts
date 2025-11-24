/**
 * Tests for Inventory Sync Service
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { InventorySyncService } from '../inventory-sync.service';
import { SupplierInventoryData } from '../types';

// Mock Redis
jest.mock('ioredis');

describe('InventorySyncService', () => {
  let prisma: PrismaClient;
  let redis: jest.Mocked<Redis>;
  let service: InventorySyncService;

  beforeEach(() => {
    prisma = new PrismaClient();
    redis = new Redis() as jest.Mocked<Redis>;
    
    // Mock Redis methods
    redis.get = jest.fn().mockResolvedValue(null);
    redis.setex = jest.fn().mockResolvedValue('OK');
    redis.del = jest.fn().mockResolvedValue(1);

    service = new InventorySyncService(prisma, redis);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('calculateStatus', () => {
    it('should return out_of_stock for zero quantity', () => {
      expect(service.calculateStatus(0)).toBe('out_of_stock');
    });

    it('should return low_stock for quantity less than 50', () => {
      expect(service.calculateStatus(49)).toBe('low_stock');
      expect(service.calculateStatus(1)).toBe('low_stock');
      expect(service.calculateStatus(25)).toBe('low_stock');
    });

    it('should return in_stock for quantity 50 or more', () => {
      expect(service.calculateStatus(50)).toBe('in_stock');
      expect(service.calculateStatus(100)).toBe('in_stock');
      expect(service.calculateStatus(1000)).toBe('in_stock');
    });
  });

  describe('updateVariantInventory', () => {
    const mockVariantId = 'variant-123';
    const mockSupplierId = 'supplier-123';
    const mockSupplierData: SupplierInventoryData = {
      supplierId: mockSupplierId,
      supplierSKU: 'SKU-001',
      quantity: 100,
      price: 15.99,
      leadTime: 7,
      isAvailable: true,
    };

    it('should create new inventory record if none exists', async () => {
      // Mock findUnique to return null (no existing inventory)
      jest.spyOn(prisma.supplierInventory, 'findUnique').mockResolvedValue(null);
      
      const createSpy = jest.spyOn(prisma.supplierInventory, 'create').mockResolvedValue({
        id: 'inv-123',
        variantId: mockVariantId,
        supplierId: mockSupplierId,
        supplierSKU: 'SKU-001',
        quantity: 100,
        status: 'in_stock',
        threshold: 50,
        price: 15.99,
        priceLastChanged: null,
        isAvailable: true,
        leadTime: 7,
        backorderDate: null,
        lastSynced: new Date(),
        syncSource: 'manual',
        syncError: null,
        previousQuantity: null,
        previousPrice: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const changes = await service.updateVariantInventory(
        mockVariantId,
        mockSupplierData,
        'manual'
      );

      expect(changes).toEqual([]);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            variantId: mockVariantId,
            supplierId: mockSupplierId,
            quantity: 100,
            price: 15.99,
            status: 'in_stock',
          }),
        })
      );
    });

    it('should detect quantity changes', async () => {
      // Mock existing inventory
      jest.spyOn(prisma.supplierInventory, 'findUnique').mockResolvedValue({
        id: 'inv-123',
        variantId: mockVariantId,
        supplierId: mockSupplierId,
        supplierSKU: 'SKU-001',
        quantity: 50,
        status: 'in_stock',
        threshold: 50,
        price: 15.99,
        priceLastChanged: null,
        isAvailable: true,
        leadTime: 7,
        backorderDate: null,
        lastSynced: new Date(),
        syncSource: 'manual',
        syncError: null,
        previousQuantity: null,
        previousPrice: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.supplierInventory, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.inventoryChange, 'create').mockResolvedValue({} as any);

      const changes = await service.updateVariantInventory(
        mockVariantId,
        mockSupplierData,
        'manual'
      );

      expect(changes.length).toBe(1);
      expect(changes[0]).toMatchObject({
        variantId: mockVariantId,
        changeType: 'quantity',
        oldValue: 50,
        newValue: 100,
      });
    });

    it('should detect price changes', async () => {
      // Mock existing inventory with different price
      jest.spyOn(prisma.supplierInventory, 'findUnique').mockResolvedValue({
        id: 'inv-123',
        variantId: mockVariantId,
        supplierId: mockSupplierId,
        supplierSKU: 'SKU-001',
        quantity: 100,
        status: 'in_stock',
        threshold: 50,
        price: 12.99,
        priceLastChanged: null,
        isAvailable: true,
        leadTime: 7,
        backorderDate: null,
        lastSynced: new Date(),
        syncSource: 'manual',
        syncError: null,
        previousQuantity: null,
        previousPrice: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.supplierInventory, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.inventoryChange, 'create').mockResolvedValue({} as any);

      const changes = await service.updateVariantInventory(
        mockVariantId,
        mockSupplierData,
        'manual'
      );

      expect(changes.length).toBe(1);
      expect(changes[0]).toMatchObject({
        variantId: mockVariantId,
        changeType: 'price',
        oldValue: 12.99,
        newValue: 15.99,
      });
    });

    it('should detect status changes', async () => {
      // Mock existing inventory with high quantity
      jest.spyOn(prisma.supplierInventory, 'findUnique').mockResolvedValue({
        id: 'inv-123',
        variantId: mockVariantId,
        supplierId: mockSupplierId,
        supplierSKU: 'SKU-001',
        quantity: 100,
        status: 'in_stock',
        threshold: 50,
        price: 15.99,
        priceLastChanged: null,
        isAvailable: true,
        leadTime: 7,
        backorderDate: null,
        lastSynced: new Date(),
        syncSource: 'manual',
        syncError: null,
        previousQuantity: null,
        previousPrice: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.supplierInventory, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.inventoryChange, 'create').mockResolvedValue({} as any);

      // Update with zero quantity (out of stock)
      const outOfStockData: SupplierInventoryData = {
        ...mockSupplierData,
        quantity: 0,
      };

      const changes = await service.updateVariantInventory(
        mockVariantId,
        outOfStockData,
        'manual'
      );

      expect(changes.some(c => c.changeType === 'status')).toBe(true);
      const statusChange = changes.find(c => c.changeType === 'status');
      expect(statusChange?.oldValue).toBe('in_stock');
      expect(statusChange?.newValue).toBe('out_of_stock');
    });

    it('should detect lead time changes', async () => {
      // Mock existing inventory
      jest.spyOn(prisma.supplierInventory, 'findUnique').mockResolvedValue({
        id: 'inv-123',
        variantId: mockVariantId,
        supplierId: mockSupplierId,
        supplierSKU: 'SKU-001',
        quantity: 100,
        status: 'in_stock',
        threshold: 50,
        price: 15.99,
        priceLastChanged: null,
        isAvailable: true,
        leadTime: 5,
        backorderDate: null,
        lastSynced: new Date(),
        syncSource: 'manual',
        syncError: null,
        previousQuantity: null,
        previousPrice: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.supplierInventory, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.inventoryChange, 'create').mockResolvedValue({} as any);

      const changes = await service.updateVariantInventory(
        mockVariantId,
        mockSupplierData,
        'manual'
      );

      expect(changes.some(c => c.changeType === 'leadtime')).toBe(true);
      const leadTimeChange = changes.find(c => c.changeType === 'leadtime');
      expect(leadTimeChange?.oldValue).toBe(5);
      expect(leadTimeChange?.newValue).toBe(7);
    });

    it('should invalidate cache after update', async () => {
      jest.spyOn(prisma.supplierInventory, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.supplierInventory, 'create').mockResolvedValue({} as any);

      await service.updateVariantInventory(
        mockVariantId,
        mockSupplierData,
        'manual'
      );

      expect(redis.del).toHaveBeenCalledWith(`inventory:${mockSupplierData.supplierSKU}`);
    });
  });

  describe('getInventory', () => {
    const mockSku = 'SKU-001';

    it('should return cached inventory if available', async () => {
      const cachedData = [{ id: 'inv-123', sku: mockSku }];
      redis.get = jest.fn().mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getInventory(mockSku);

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith(`inventory:${mockSku}`);
      expect(prisma.supplierInventory.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      redis.get = jest.fn().mockResolvedValue(null);
      
      const dbData = [
        {
          id: 'inv-123',
          variantId: 'variant-123',
          supplierId: 'supplier-123',
          supplierSKU: mockSku,
          quantity: 100,
          status: 'in_stock',
          threshold: 50,
          price: 15.99,
          priceLastChanged: null,
          isAvailable: true,
          leadTime: 7,
          backorderDate: null,
          lastSynced: new Date(),
          syncSource: 'manual',
          syncError: null,
          previousQuantity: null,
          previousPrice: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.supplierInventory, 'findMany').mockResolvedValue(dbData as any);

      const result = await service.getInventory(mockSku);

      expect(result).toEqual(dbData);
      expect(redis.setex).toHaveBeenCalledWith(
        `inventory:${mockSku}`,
        300,
        JSON.stringify(dbData)
      );
    });
  });

  describe('syncSupplier', () => {
    const mockSupplierId = 'ss-activewear';

    it('should create sync log with running status', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue({
        id: 'supplier-123',
        name: 'SS Activewear',
        code: mockSupplierId,
        apiUrl: 'https://api.test.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);

      const createLogSpy = jest.spyOn(prisma.inventorySyncLog, 'create').mockResolvedValue({
        id: 'log-123',
        supplierId: 'supplier-123',
        supplierName: 'SS Activewear',
        startedAt: new Date(),
        completedAt: null,
        status: 'running',
        variantsSynced: 0,
        changesDetected: 0,
        errors: [],
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.inventorySyncLog, 'update').mockResolvedValue({} as any);

      await service.syncSupplier(mockSupplierId, 'manual');

      expect(createLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'running',
          }),
        })
      );
    });

    it('should update sync log on completion', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue({
        id: 'supplier-123',
        name: 'SS Activewear',
        code: mockSupplierId,
        apiUrl: 'https://api.test.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.inventorySyncLog, 'create').mockResolvedValue({
        id: 'log-123',
      } as any);

      const updateLogSpy = jest.spyOn(prisma.inventorySyncLog, 'update').mockResolvedValue({} as any);

      const result = await service.syncSupplier(mockSupplierId, 'manual');

      expect(updateLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'completed',
          }),
        })
      );

      expect(result.status).toBe('completed');
    });

    it('should handle sync errors', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue({
        id: 'supplier-123',
        name: 'SS Activewear',
        code: mockSupplierId,
        apiUrl: 'https://api.test.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.inventorySyncLog, 'create').mockResolvedValue({
        id: 'log-123',
      } as any);

      jest.spyOn(prisma.product, 'findMany').mockRejectedValue(new Error('Database error'));

      const updateLogSpy = jest.spyOn(prisma.inventorySyncLog, 'update').mockResolvedValue({} as any);

      await expect(service.syncSupplier(mockSupplierId, 'manual')).rejects.toThrow('Database error');

      expect(updateLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'failed',
            errors: ['Database error'],
          }),
        })
      );
    });

    it('should throw error if supplier not found', async () => {
      jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValue(null);

      await expect(service.syncSupplier(mockSupplierId, 'manual')).rejects.toThrow(
        `Supplier not found: ${mockSupplierId}`
      );
    });
  });

  describe('syncAllSuppliers', () => {
    it('should sync all active suppliers', async () => {
      const mockSuppliers = [
        {
          id: 'supplier-1',
          name: 'Supplier 1',
          code: 'supplier-1',
          apiUrl: 'https://api.test1.com',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'supplier-2',
          name: 'Supplier 2',
          code: 'supplier-2',
          apiUrl: 'https://api.test2.com',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.supplier, 'findMany').mockResolvedValue(mockSuppliers);
      jest.spyOn(prisma.supplier, 'findUnique')
        .mockResolvedValueOnce(mockSuppliers[0])
        .mockResolvedValueOnce(mockSuppliers[1]);
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.inventorySyncLog, 'create').mockResolvedValue({ id: 'log-123' } as any);
      jest.spyOn(prisma.inventorySyncLog, 'update').mockResolvedValue({} as any);

      const results = await service.syncAllSuppliers('scheduled');

      expect(results.length).toBe(2);
      expect(results.every(r => r.status === 'completed')).toBe(true);
    });

    it('should handle individual supplier failures', async () => {
      const mockSuppliers = [
        {
          id: 'supplier-1',
          name: 'Supplier 1',
          code: 'supplier-1',
          apiUrl: 'https://api.test1.com',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'supplier-2',
          name: 'Supplier 2',
          code: 'supplier-2',
          apiUrl: 'https://api.test2.com',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.supplier, 'findMany').mockResolvedValue(mockSuppliers);
      jest.spyOn(prisma.supplier, 'findUnique')
        .mockResolvedValueOnce(mockSuppliers[0])
        .mockResolvedValueOnce(null); // Fail second supplier

      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.inventorySyncLog, 'create').mockResolvedValue({ id: 'log-123' } as any);
      jest.spyOn(prisma.inventorySyncLog, 'update').mockResolvedValue({} as any);

      const results = await service.syncAllSuppliers('scheduled');

      expect(results.length).toBe(2);
      expect(results[0].status).toBe('completed');
      expect(results[1].status).toBe('failed');
    });
  });
});
