/**
 * Tests for Sync Scheduler
 */

import { InventorySyncService } from '../inventory-sync.service';
import { SyncScheduler } from '../sync-scheduler';

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((pattern, callback) => ({
    stop: jest.fn(),
  })),
}));

describe('SyncScheduler', () => {
  let mockService: jest.Mocked<InventorySyncService>;
  let scheduler: SyncScheduler;

  beforeEach(() => {
    mockService = {
      syncAllSuppliers: jest.fn(),
      syncHighPriorityVariants: jest.fn(),
    } as any;

    scheduler = new SyncScheduler(mockService);
  });

  describe('start', () => {
    it('should start scheduler successfully', () => {
      const cron = require('node-cron');
      
      scheduler.start();

      // Should schedule both full sync and priority sync
      expect(cron.schedule).toHaveBeenCalledTimes(2);
      expect(cron.schedule).toHaveBeenCalledWith('0 */6 * * *', expect.any(Function));
      expect(cron.schedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
    });

    it('should indicate scheduler is running', () => {
      scheduler.start();
      expect(scheduler.isRunning()).toBe(true);
    });
  });

  describe('stop', () => {
    it('should stop scheduler successfully', () => {
      scheduler.start();
      scheduler.stop();
      
      expect(scheduler.isRunning()).toBe(false);
    });

    it('should handle stop when not running', () => {
      expect(() => scheduler.stop()).not.toThrow();
    });
  });

  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(scheduler.isRunning()).toBe(false);
    });

    it('should return true after start', () => {
      scheduler.start();
      expect(scheduler.isRunning()).toBe(true);
    });

    it('should return false after stop', () => {
      scheduler.start();
      scheduler.stop();
      expect(scheduler.isRunning()).toBe(false);
    });
  });
});
