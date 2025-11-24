/**
 * SOP Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SOPService } from '../sop/sop.service';
import { SOPCategory, SOPDifficulty, SOPCreateInput } from '../sop/types';

describe('SOPService', () => {
  let service: SOPService;

  beforeEach(async () => {
    service = new SOPService();
    await service.clear();
  });

  describe('create', () => {
    it('should create a new SOP with required fields', async () => {
      const input: SOPCreateInput = {
        title: 'Screen Press Setup',
        category: 'Machines' as SOPCategory,
        summary: 'Complete setup procedure for screen printing press',
        content: 'Step-by-step guide for setting up the screen press...',
      };

      const sop = await service.create(input, 'user-123');

      expect(sop).toBeDefined();
      expect(sop.id).toBeDefined();
      expect(sop.title).toBe('Screen Press Setup');
      expect(sop.slug).toBe('screen-press-setup');
      expect(sop.category).toBe('Machines');
      expect(sop.version).toBe(1);
      expect(sop.viewCount).toBe(0);
      expect(sop.difficulty).toBe('Beginner');
      expect(sop.createdBy).toBe('user-123');
    });

    it('should create SOP with optional fields', async () => {
      const input: SOPCreateInput = {
        title: 'Advanced DTG Maintenance',
        category: 'Machines' as SOPCategory,
        subcategory: 'DTG Printers',
        summary: 'Advanced maintenance procedures',
        content: 'Detailed maintenance steps...',
        tags: ['dtg', 'maintenance', 'advanced'],
        difficulty: 'Advanced' as SOPDifficulty,
        estimatedTime: 45,
        machineId: 'machine-123',
      };

      const sop = await service.create(input);

      expect(sop.subcategory).toBe('DTG Printers');
      expect(sop.tags).toEqual(['dtg', 'maintenance', 'advanced']);
      expect(sop.difficulty).toBe('Advanced');
      expect(sop.estimatedTime).toBe(45);
      expect(sop.machineId).toBe('machine-123');
    });
  });

  describe('findById', () => {
    it('should find SOP by ID and increment view count', async () => {
      const input: SOPCreateInput = {
        title: 'Test SOP',
        category: 'Processes' as SOPCategory,
        summary: 'Test summary',
        content: 'Test content',
      };

      const created = await service.create(input);
      expect(created.viewCount).toBe(0);

      const found = await service.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.viewCount).toBe(1);

      // View again
      const foundAgain = await service.findById(created.id);
      expect(foundAgain?.viewCount).toBe(2);
    });

    it('should return null for non-existent ID', async () => {
      const found = await service.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update SOP fields', async () => {
      const input: SOPCreateInput = {
        title: 'Original Title',
        category: 'Machines' as SOPCategory,
        summary: 'Original summary',
        content: 'Original content',
      };

      const created = await service.create(input, 'user-123');
      const originalVersion = created.version;

      const updated = await service.update(created.id, {
        title: 'Updated Title',
        summary: 'Updated summary',
      }, 'user-456');

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.slug).toBe('updated-title');
      expect(updated?.summary).toBe('Updated summary');
      expect(updated?.content).toBe('Original content'); // Unchanged
      expect(updated?.version).toBeGreaterThan(originalVersion);
      expect(updated?.updatedBy).toBe('user-456');
      expect(updated?.createdBy).toBe('user-123'); // Unchanged
    });

    it('should return null for non-existent ID', async () => {
      const updated = await service.update('non-existent-id', {
        title: 'New Title',
      });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete SOP', async () => {
      const input: SOPCreateInput = {
        title: 'To Delete',
        category: 'Safety' as SOPCategory,
        summary: 'Will be deleted',
        content: 'Content',
      };

      const created = await service.create(input);
      const deleted = await service.delete(created.id);
      expect(deleted).toBe(true);

      const found = await service.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent ID', async () => {
      const deleted = await service.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test SOPs
      await service.create({
        title: 'Machine SOP 1',
        category: 'Machines' as SOPCategory,
        difficulty: 'Beginner' as SOPDifficulty,
        summary: 'Summary 1',
        content: 'Content 1',
        tags: ['machine', 'beginner'],
      });

      await service.create({
        title: 'Machine SOP 2',
        category: 'Machines' as SOPCategory,
        difficulty: 'Advanced' as SOPDifficulty,
        summary: 'Summary 2',
        content: 'Content 2',
        tags: ['machine', 'advanced'],
      });

      await service.create({
        title: 'Process SOP 1',
        category: 'Processes' as SOPCategory,
        difficulty: 'Intermediate' as SOPDifficulty,
        summary: 'Summary 3',
        content: 'Content 3',
        tags: ['process'],
      });
    });

    it('should return all SOPs without filters', async () => {
      const result = await service.findAll();
      expect(result.sops).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter by category', async () => {
      const result = await service.findAll({ category: 'Machines' as SOPCategory });
      expect(result.sops).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.sops.every(s => s.category === 'Machines')).toBe(true);
    });

    it('should filter by difficulty', async () => {
      const result = await service.findAll({ difficulty: 'Advanced' as SOPDifficulty });
      expect(result.sops).toHaveLength(1);
      expect(result.sops[0].title).toBe('Machine SOP 2');
    });

    it('should filter by tags', async () => {
      const result = await service.findAll({ tags: ['beginner'] });
      expect(result.sops).toHaveLength(1);
      expect(result.sops[0].title).toBe('Machine SOP 1');
    });

    it('should apply pagination', async () => {
      const result = await service.findAll({ limit: 2, offset: 1 });
      expect(result.sops).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.limit).toBe(2);
      expect(result.offset).toBe(1);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await service.create({
        title: 'Screen Press Registration',
        category: 'Troubleshooting' as SOPCategory,
        summary: 'Fix registration issues on screen press',
        content: 'Detailed troubleshooting steps for registration problems',
        tags: ['screen', 'registration', 'troubleshooting'],
      });

      await service.create({
        title: 'DTG Maintenance',
        category: 'Machines' as SOPCategory,
        summary: 'Daily maintenance for DTG printer',
        content: 'Clean printheads and check ink levels',
        tags: ['dtg', 'maintenance'],
      });
    });

    it('should search by text in title', async () => {
      const result = await service.search({ q: 'registration' });
      expect(result.sops).toHaveLength(1);
      expect(result.sops[0].title).toBe('Screen Press Registration');
    });

    it('should search by text in summary', async () => {
      const result = await service.search({ q: 'maintenance' });
      expect(result.sops).toHaveLength(1);
      expect(result.sops[0].title).toBe('DTG Maintenance');
    });

    it('should search by text in content', async () => {
      const result = await service.search({ q: 'troubleshooting' });
      expect(result.sops).toHaveLength(1);
      expect(result.sops[0].title).toBe('Screen Press Registration');
    });

    it('should search by text in tags', async () => {
      const result = await service.search({ q: 'screen' });
      expect(result.sops).toHaveLength(1);
      expect(result.sops[0].title).toBe('Screen Press Registration');
    });

    it('should return empty results for no matches', async () => {
      const result = await service.search({ q: 'nonexistent' });
      expect(result.sops).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should track search terms', async () => {
      await service.search({ q: 'registration' });
      await service.search({ q: 'registration' });
      await service.search({ q: 'maintenance' });

      const analytics = await service.getAnalytics();
      expect(analytics.searchTerms).toBeDefined();
      expect(analytics.searchTerms?.length).toBeGreaterThan(0);
      
      const registrationTerm = analytics.searchTerms?.find(t => t.term === 'registration');
      expect(registrationTerm?.count).toBe(2);
    });
  });

  describe('toggleFavorite', () => {
    it('should add user to favorites', async () => {
      const input: SOPCreateInput = {
        title: 'Test SOP',
        category: 'Processes' as SOPCategory,
        summary: 'Test',
        content: 'Test',
      };

      const sop = await service.create(input);
      const updated = await service.toggleFavorite(sop.id, 'user-123');

      expect(updated).toBeDefined();
      expect(updated?.favorites).toContain('user-123');
    });

    it('should remove user from favorites if already favorited', async () => {
      const input: SOPCreateInput = {
        title: 'Test SOP',
        category: 'Processes' as SOPCategory,
        summary: 'Test',
        content: 'Test',
      };

      const sop = await service.create(input);
      
      // Add favorite
      await service.toggleFavorite(sop.id, 'user-123');
      
      // Remove favorite
      const updated = await service.toggleFavorite(sop.id, 'user-123');
      
      expect(updated?.favorites).not.toContain('user-123');
      expect(updated?.favorites).toHaveLength(0);
    });

    it('should return null for non-existent SOP', async () => {
      const result = await service.toggleFavorite('non-existent', 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics with most and least viewed SOPs', async () => {
      // Create SOPs with different view counts
      const sop1 = await service.create({
        title: 'Popular SOP',
        category: 'Machines' as SOPCategory,
        summary: 'Very popular',
        content: 'Content',
      });

      const sop2 = await service.create({
        title: 'Unpopular SOP',
        category: 'Processes' as SOPCategory,
        summary: 'Not popular',
        content: 'Content',
      });

      // Simulate views
      await service.findById(sop1.id);
      await service.findById(sop1.id);
      await service.findById(sop1.id);
      await service.findById(sop2.id);

      const analytics = await service.getAnalytics();

      expect(analytics.totalSOPs).toBe(2);
      expect(analytics.mostViewed).toHaveLength(2);
      expect(analytics.mostViewed[0].sop.title).toBe('Popular SOP');
      expect(analytics.mostViewed[0].views).toBe(3);
      expect(analytics.leastViewed).toHaveLength(2);
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history for an SOP', async () => {
      const sop = await service.create({
        title: 'Test SOP',
        category: 'Processes' as SOPCategory,
        summary: 'Test',
        content: 'Test',
      }, 'user-123');

      const versions = await service.getVersionHistory(sop.id);

      expect(versions).toHaveLength(1);
      expect(versions[0].version).toBe(1);
      expect(versions[0].updatedBy).toBe('user-123');
    });

    it('should return empty array for non-existent SOP', async () => {
      const versions = await service.getVersionHistory('non-existent');
      expect(versions).toHaveLength(0);
    });
  });
});
