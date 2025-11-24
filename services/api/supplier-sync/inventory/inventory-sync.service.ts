/**
 * Inventory Sync Service
 * Handles real-time inventory synchronization with supplier APIs
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import {
  SupplierInventoryData,
  InventoryStatus,
  SyncSource,
  InventoryChange,
  SyncResult,
  BulkInventoryResult,
} from './types';

export class InventorySyncService {
  private prisma: PrismaClient;
  private redis: Redis;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Sync inventory for a specific supplier
   */
  async syncSupplier(supplierId: string, source: SyncSource = 'manual'): Promise<SyncResult> {
    const startTime = Date.now();
    
    // Get supplier info
    const supplier = await this.prisma.supplier.findUnique({
      where: { code: supplierId },
    });

    if (!supplier) {
      throw new Error(`Supplier not found: ${supplierId}`);
    }

    // Create sync log
    const log = await this.prisma.inventorySyncLog.create({
      data: {
        supplierId: supplier.id,
        supplierName: supplier.name,
        status: 'running',
        startedAt: new Date(),
      },
    });

    try {
      // Get all products for this supplier
      const products = await this.prisma.product.findMany({
        where: { supplierId: supplier.id },
        include: {
          inventories: {
            where: { supplierId: supplier.id },
          },
        },
      });

      let changesDetected = 0;

      // Process in batches of 100
      const batchSize = 100;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        // In a real implementation, this would call the supplier connector
        // For now, we'll simulate the sync
        for (const product of batch) {
          // Simulate supplier data
          const supplierData: SupplierInventoryData = {
            supplierId: supplier.id,
            supplierSKU: product.styleId,
            quantity: Math.floor(Math.random() * 1000),
            price: 10 + Math.random() * 20,
            leadTime: Math.floor(Math.random() * 14),
            isAvailable: true,
          };

          const changes = await this.updateVariantInventory(
            product.id,
            supplierData,
            source
          );
          
          changesDetected += changes.length;

          // Log significant changes
          if (changes.length > 0) {
            await this.logChanges(changes);
          }
        }
      }

      const duration = Date.now() - startTime;

      // Mark log as completed
      await this.prisma.inventorySyncLog.update({
        where: { id: log.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          variantsSynced: products.length,
          changesDetected,
          duration,
        },
      });

      return {
        logId: log.id,
        supplierId,
        variantsSynced: products.length,
        changesDetected,
        errors: [],
        duration,
        status: 'completed',
      };
    } catch (error: any) {
      // Mark log as failed
      await this.prisma.inventorySyncLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errors: [error.message],
          duration: Date.now() - startTime,
        },
      });

      throw error;
    }
  }

  /**
   * Sync all suppliers
   */
  async syncAllSuppliers(source: SyncSource = 'scheduled'): Promise<SyncResult[]> {
    const suppliers = await this.prisma.supplier.findMany({
      where: { isActive: true },
    });

    const results: SyncResult[] = [];
    
    for (const supplier of suppliers) {
      try {
        const result = await this.syncSupplier(supplier.code, source);
        results.push(result);
      } catch (error: any) {
        console.error(`Sync failed for ${supplier.code}:`, error);
        results.push({
          logId: '',
          supplierId: supplier.code,
          variantsSynced: 0,
          changesDetected: 0,
          errors: [error.message],
          duration: 0,
          status: 'failed',
        });
      }
    }

    return results;
  }

  /**
   * Sync high-priority variants (frequently ordered items)
   */
  async syncHighPriorityVariants(): Promise<void> {
    // Get recently used variants
    // In a real implementation, this would query order history
    // For now, we'll just sync a random subset
    const products = await this.prisma.product.findMany({
      take: 100,
      include: {
        inventories: true,
      },
    });

    for (const product of products) {
      // Simulate supplier data
      const supplierData: SupplierInventoryData = {
        supplierId: product.supplierId,
        supplierSKU: product.styleId,
        quantity: Math.floor(Math.random() * 1000),
        price: 10 + Math.random() * 20,
        leadTime: Math.floor(Math.random() * 14),
        isAvailable: true,
      };

      await this.updateVariantInventory(product.id, supplierData, 'scheduled');
    }
  }

  /**
   * Update variant inventory and detect changes
   */
  async updateVariantInventory(
    variantId: string,
    supplierData: SupplierInventoryData,
    source: SyncSource
  ): Promise<InventoryChange[]> {
    const changes: InventoryChange[] = [];

    // Get current inventory
    const current = await this.prisma.supplierInventory.findUnique({
      where: {
        variantId_supplierId: {
          variantId,
          supplierId: supplierData.supplierId,
        },
      },
    });

    // If no inventory record exists, create one
    if (!current) {
      await this.prisma.supplierInventory.create({
        data: {
          variantId,
          supplierId: supplierData.supplierId,
          supplierSKU: supplierData.supplierSKU,
          quantity: supplierData.quantity,
          price: supplierData.price,
          status: this.calculateStatus(supplierData.quantity),
          leadTime: supplierData.leadTime || 0,
          isAvailable: supplierData.isAvailable !== false,
          backorderDate: supplierData.backorderDate,
          lastSynced: new Date(),
          syncSource: source,
        },
      });

      // Invalidate cache
      await this.invalidateCache(supplierData.supplierSKU);
      
      return changes;
    }

    // Check quantity change
    if (current.quantity !== supplierData.quantity) {
      changes.push({
        variantId,
        sku: supplierData.supplierSKU,
        supplierId: supplierData.supplierId,
        changeType: 'quantity',
        oldValue: current.quantity,
        newValue: supplierData.quantity,
        detectedAt: new Date(),
        notified: false,
      });
    }

    // Check price change
    if (Math.abs(current.price - supplierData.price) > 0.01) {
      changes.push({
        variantId,
        sku: supplierData.supplierSKU,
        supplierId: supplierData.supplierId,
        changeType: 'price',
        oldValue: current.price,
        newValue: supplierData.price,
        detectedAt: new Date(),
        notified: false,
      });
    }

    // Check status change
    const newStatus = this.calculateStatus(supplierData.quantity);
    if (current.status !== newStatus) {
      changes.push({
        variantId,
        sku: supplierData.supplierSKU,
        supplierId: supplierData.supplierId,
        changeType: 'status',
        oldValue: current.status,
        newValue: newStatus,
        detectedAt: new Date(),
        notified: false,
      });
    }

    // Check lead time change
    if (supplierData.leadTime && current.leadTime !== supplierData.leadTime) {
      changes.push({
        variantId,
        sku: supplierData.supplierSKU,
        supplierId: supplierData.supplierId,
        changeType: 'leadtime',
        oldValue: current.leadTime,
        newValue: supplierData.leadTime,
        detectedAt: new Date(),
        notified: false,
      });
    }

    // Update inventory record
    await this.prisma.supplierInventory.update({
      where: {
        variantId_supplierId: {
          variantId,
          supplierId: supplierData.supplierId,
        },
      },
      data: {
        quantity: supplierData.quantity,
        price: supplierData.price,
        status: newStatus,
        leadTime: supplierData.leadTime || current.leadTime,
        isAvailable: supplierData.isAvailable !== false,
        backorderDate: supplierData.backorderDate,
        lastSynced: new Date(),
        syncSource: source,
        previousQuantity: current.quantity,
        previousPrice: current.price,
        priceLastChanged: changes.some(c => c.changeType === 'price')
          ? new Date()
          : current.priceLastChanged,
      },
    });

    // Invalidate cache
    await this.invalidateCache(supplierData.supplierSKU);

    return changes;
  }

  /**
   * Calculate inventory status based on quantity
   */
  calculateStatus(quantity: number): InventoryStatus {
    if (quantity === 0) return 'out_of_stock';
    if (quantity < 50) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Log inventory changes
   */
  private async logChanges(changes: InventoryChange[]): Promise<void> {
    for (const change of changes) {
      await this.prisma.inventoryChange.create({
        data: {
          variantId: change.variantId,
          sku: change.sku,
          supplierId: change.supplierId,
          changeType: change.changeType,
          oldValue: change.oldValue,
          newValue: change.newValue,
          detectedAt: change.detectedAt,
          notified: false,
        },
      });

      // Send notifications for critical changes
      await this.notifyChange(change);
    }
  }

  /**
   * Send notifications for critical inventory changes
   */
  private async notifyChange(change: InventoryChange): Promise<void> {
    // Out of stock alert
    if (change.changeType === 'status' && change.newValue === 'out_of_stock') {
      console.log(`⚠️ OUT OF STOCK: ${change.sku} at ${change.supplierId}`);
      // In real implementation, send email/webhook notification
    }

    // Price increase alert (>10%)
    if (change.changeType === 'price') {
      const priceChange = ((change.newValue - change.oldValue) / change.oldValue) * 100;
      
      if (priceChange > 10) {
        console.log(
          `💰 PRICE INCREASE: ${change.sku} increased by ${priceChange.toFixed(1)}% (${change.oldValue} → ${change.newValue})`
        );
        // In real implementation, send email/webhook notification
      }
    }

    // Low stock warning
    if (change.changeType === 'status' && change.newValue === 'low_stock') {
      console.log(`📊 LOW STOCK: ${change.sku} at ${change.supplierId}`);
      // In real implementation, send email/webhook notification
    }
  }

  /**
   * Get inventory for a specific SKU
   */
  async getInventory(sku: string): Promise<any> {
    const cacheKey = `inventory:${sku}`;

    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const inventory = await this.prisma.supplierInventory.findMany({
      where: { supplierSKU: sku },
      include: {
        supplier: true,
        product: true,
      },
    });

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(inventory));

    return inventory;
  }

  /**
   * Invalidate cache for a SKU
   */
  private async invalidateCache(sku: string): Promise<void> {
    const cacheKey = `inventory:${sku}`;
    await this.redis.del(cacheKey);
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<any> {
    const recentLogs = await this.prisma.inventorySyncLog.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      include: {
        supplier: true,
      },
    });

    const suppliers = await this.prisma.supplier.findMany({
      where: { isActive: true },
    });

    return {
      lastSync: recentLogs[0]?.startedAt,
      nextSync: this.calculateNextSync(),
      suppliers: suppliers.map(supplier => {
        const lastLog = recentLogs.find(log => log.supplierId === supplier.id);
        return {
          id: supplier.code,
          name: supplier.name,
          lastSync: lastLog?.startedAt,
          status: lastLog?.status || 'unknown',
          variantsSynced: lastLog?.variantsSynced || 0,
          changesDetected: lastLog?.changesDetected || 0,
          errors: lastLog?.errors || [],
        };
      }),
    };
  }

  /**
   * Get sync history
   */
  async getSyncHistory(limit = 50): Promise<any[]> {
    return this.prisma.inventorySyncLog.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        supplier: true,
      },
    });
  }

  /**
   * Get recent inventory changes
   */
  async getRecentChanges(limit = 100): Promise<any[]> {
    return this.prisma.inventoryChange.findMany({
      take: limit,
      orderBy: { detectedAt: 'desc' },
      include: {
        inventory: {
          include: {
            supplier: true,
            product: true,
          },
        },
      },
    });
  }

  /**
   * Calculate next scheduled sync time
   */
  private calculateNextSync(): Date {
    const now = new Date();
    const hours = now.getHours();
    const nextSyncHour = Math.ceil((hours + 1) / 6) * 6;
    const nextSync = new Date(now);
    nextSync.setHours(nextSyncHour, 0, 0, 0);
    
    if (nextSync <= now) {
      nextSync.setDate(nextSync.getDate() + 1);
    }
    
    return nextSync;
  }
}
