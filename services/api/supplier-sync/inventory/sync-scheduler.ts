/**
 * Inventory Sync Scheduler
 * Manages scheduled inventory synchronization jobs
 */

import cron from 'node-cron';
import { InventorySyncService } from './inventory-sync.service';

export class SyncScheduler {
  private inventorySyncService: InventorySyncService;
  private fullSyncJob?: cron.ScheduledTask;
  private prioritySyncJob?: cron.ScheduledTask;

  constructor(inventorySyncService: InventorySyncService) {
    this.inventorySyncService = inventorySyncService;
  }

  /**
   * Start scheduled sync jobs
   */
  start(): void {
    // Sync all suppliers every 6 hours (at 0:00, 6:00, 12:00, 18:00)
    this.fullSyncJob = cron.schedule('0 */6 * * *', async () => {
      console.log('[Scheduler] Starting scheduled inventory sync...');
      
      try {
        const results = await this.inventorySyncService.syncAllSuppliers('scheduled');
        
        const successful = results.filter(r => r.status === 'completed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        
        console.log(
          `[Scheduler] Completed scheduled sync: ${successful} successful, ${failed} failed`
        );

        // Log failed syncs
        results
          .filter(r => r.status === 'failed')
          .forEach(r => {
            console.error(`[Scheduler] Sync failed for ${r.supplierId}:`, r.errors);
          });
      } catch (error) {
        console.error('[Scheduler] Scheduled sync error:', error);
      }
    });

    // Sync high-priority variants every hour
    this.prioritySyncJob = cron.schedule('0 * * * *', async () => {
      console.log('[Scheduler] Syncing high-priority variants...');
      
      try {
        await this.inventorySyncService.syncHighPriorityVariants();
        console.log('[Scheduler] High-priority variant sync completed');
      } catch (error) {
        console.error('[Scheduler] High-priority sync error:', error);
      }
    });

    console.log('[Scheduler] Inventory sync scheduler started');
    console.log('[Scheduler] Full sync: every 6 hours at 0:00, 6:00, 12:00, 18:00');
    console.log('[Scheduler] Priority sync: every hour on the hour');
  }

  /**
   * Stop scheduled sync jobs
   */
  stop(): void {
    if (this.fullSyncJob) {
      this.fullSyncJob.stop();
      this.fullSyncJob = undefined;
    }

    if (this.prioritySyncJob) {
      this.prioritySyncJob.stop();
      this.prioritySyncJob = undefined;
    }

    console.log('[Scheduler] Inventory sync scheduler stopped');
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return !!(this.fullSyncJob && this.prioritySyncJob);
  }
}
