/**
 * SOP Service - Business logic for SOP operations
 */

import {
  SOP,
  SOPCreateInput,
  SOPUpdateInput,
  SOPSearchQuery,
  SOPSearchResult,
  SOPAnalytics,
} from './types';

export class SOPService {
  private sops: Map<string, SOP> = new Map();
  private searchTerms: Map<string, number> = new Map();

  /**
   * Get all SOPs with optional filtering
   */
  async findAll(query?: SOPSearchQuery): Promise<SOPSearchResult> {
    let filtered = Array.from(this.sops.values());

    // Apply filters
    if (query?.category) {
      filtered = filtered.filter(sop => sop.category === query.category);
    }

    if (query?.difficulty) {
      filtered = filtered.filter(sop => sop.difficulty === query.difficulty);
    }

    if (query?.machineId) {
      filtered = filtered.filter(sop => sop.machineId === query.machineId);
    }

    if (query?.tags && query.tags.length > 0) {
      filtered = filtered.filter(sop =>
        query.tags!.some(tag => sop.tags.includes(tag))
      );
    }

    // Apply pagination
    const limit = query?.limit || 50;
    const offset = query?.offset || 0;
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      sops: paginated,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get a single SOP by ID
   */
  async findById(id: string): Promise<SOP | null> {
    const sop = this.sops.get(id);
    
    if (sop) {
      // Increment view count
      sop.viewCount++;
      sop.lastViewed = new Date();
      this.sops.set(id, sop);
    }

    return sop || null;
  }

  /**
   * Create a new SOP
   */
  async create(input: SOPCreateInput, userId?: string): Promise<SOP> {
    const id = this.generateId();
    const now = new Date();

    const sop: SOP = {
      id,
      title: input.title,
      slug: this.generateSlug(input.title),
      category: input.category,
      subcategory: input.subcategory,
      tags: input.tags || [],
      summary: input.summary,
      content: input.content,
      steps: input.steps || [],
      relatedSOPs: input.relatedSOPs || [],
      machineId: input.machineId,
      difficulty: input.difficulty || 'Beginner',
      estimatedTime: input.estimatedTime || 0,
      version: 1.0,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
      viewCount: 0,
      isPublished: input.isPublished || false,
      media: input.media || [],
      favorites: [],
    };

    this.sops.set(id, sop);
    return sop;
  }

  /**
   * Update an existing SOP
   */
  async update(id: string, input: SOPUpdateInput, userId?: string): Promise<SOP | null> {
    const existing = this.sops.get(id);
    
    if (!existing) {
      return null;
    }

    const updated: SOP = {
      ...existing,
      ...input,
      id: existing.id,
      slug: input.title ? this.generateSlug(input.title) : existing.slug,
      version: existing.version + 0.1,
      updatedAt: new Date(),
      updatedBy: userId,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      viewCount: existing.viewCount,
      favorites: existing.favorites,
    };

    this.sops.set(id, updated);
    return updated;
  }

  /**
   * Delete an SOP
   */
  async delete(id: string): Promise<boolean> {
    return this.sops.delete(id);
  }

  /**
   * Search SOPs
   */
  async search(query: SOPSearchQuery): Promise<SOPSearchResult> {
    let filtered = Array.from(this.sops.values());

    // Track search term
    if (query.q) {
      const term = query.q.toLowerCase();
      this.searchTerms.set(term, (this.searchTerms.get(term) || 0) + 1);

      // Full-text search across title, summary, and content
      filtered = filtered.filter(sop => {
        const searchableText = `${sop.title} ${sop.summary} ${sop.content} ${sop.tags.join(' ')}`.toLowerCase();
        return searchableText.includes(term);
      });
    }

    // Apply other filters
    if (query.category) {
      filtered = filtered.filter(sop => sop.category === query.category);
    }

    if (query.difficulty) {
      filtered = filtered.filter(sop => sop.difficulty === query.difficulty);
    }

    // Pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      sops: paginated,
      total,
      limit,
      offset,
    };
  }

  /**
   * Toggle favorite status for a user
   */
  async toggleFavorite(id: string, userId: string): Promise<SOP | null> {
    const sop = this.sops.get(id);
    
    if (!sop) {
      return null;
    }

    const favorites = sop.favorites || [];
    const index = favorites.indexOf(userId);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(userId);
    }

    sop.favorites = favorites;
    this.sops.set(id, sop);

    return sop;
  }

  /**
   * Get analytics data
   */
  async getAnalytics(): Promise<SOPAnalytics> {
    const sops = Array.from(this.sops.values());
    
    // Sort by view count
    const sortedByViews = [...sops].sort((a, b) => b.viewCount - a.viewCount);
    
    const mostViewed = sortedByViews.slice(0, 10).map(sop => ({
      sop,
      views: sop.viewCount,
    }));

    const leastViewed = sortedByViews.slice(-10).reverse().map(sop => ({
      sop,
      views: sop.viewCount,
    }));

    // Get top search terms
    const searchTerms = Array.from(this.searchTerms.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      mostViewed,
      leastViewed,
      totalSOPs: sops.length,
      searchTerms,
    };
  }

  /**
   * Get version history for an SOP
   */
  async getVersionHistory(id: string): Promise<Array<{ version: number; updatedAt: Date; updatedBy?: string }>> {
    const sop = this.sops.get(id);
    
    if (!sop) {
      return [];
    }

    // In a real implementation, this would query a version history table
    // For now, return current version only
    return [
      {
        version: sop.version,
        updatedAt: sop.updatedAt,
        updatedBy: sop.updatedBy,
      },
    ];
  }

  /**
   * Helper: Generate unique ID
   */
  private generateId(): string {
    return `sop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Clear all data (for testing)
   */
  async clear(): Promise<void> {
    this.sops.clear();
    this.searchTerms.clear();
  }
}

export const sopService = new SOPService();
