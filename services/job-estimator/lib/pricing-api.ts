/**
 * Pricing API Service
 * 
 * Provides API endpoints for pricing calculations with caching,
 * history tracking, and rule management.
 */

import {
  PricingRule,
  PricingInput,
  PricingOutput,
  calculatePricing,
  validatePricingRule,
} from './pricing-rules-engine';

/**
 * Cache for pricing calculations
 * In production, this would be Redis
 */
class PricingCache {
  private cache: Map<string, { result: PricingOutput; timestamp: number }>;
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000;
  }

  private generateKey(input: PricingInput): string {
    return JSON.stringify({
      garment_id: input.garment_id,
      quantity: input.quantity,
      service: input.service,
      print_locations: input.print_locations?.sort(),
      color_count: input.color_count,
      stitch_count: input.stitch_count,
      customer_type: input.customer_type,
      is_rush: input.is_rush,
    });
  }

  get(input: PricingInput): PricingOutput | null {
    const key = this.generateKey(input);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  set(input: PricingInput, result: PricingOutput): void {
    const key = this.generateKey(input);
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Rule storage interface (abstract)
 * In production, this would interface with Strapi
 */
export interface RuleStorage {
  getRules(): Promise<PricingRule[]>;
  getRule(id: string): Promise<PricingRule | null>;
  createRule(rule: PricingRule): Promise<PricingRule>;
  updateRule(id: string, rule: Partial<PricingRule>): Promise<PricingRule>;
  deleteRule(id: string): Promise<boolean>;
  getRuleVersions(ruleId: string): Promise<PricingRule[]>;
}

/**
 * In-memory rule storage (for testing)
 */
export class InMemoryRuleStorage implements RuleStorage {
  private rules: Map<string, PricingRule>;

  constructor(initialRules: PricingRule[] = []) {
    this.rules = new Map();
    initialRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  async getRules(): Promise<PricingRule[]> {
    return Array.from(this.rules.values());
  }

  async getRule(id: string): Promise<PricingRule | null> {
    return this.rules.get(id) || null;
  }

  async createRule(rule: PricingRule): Promise<PricingRule> {
    const validation = validatePricingRule(rule);
    if (!validation.valid) {
      throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
    }

    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with id ${rule.id} already exists`);
    }

    const timestamp = new Date().toISOString();
    const newRule = {
      ...rule,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.rules.set(rule.id, newRule);
    return newRule;
  }

  async updateRule(id: string, updates: Partial<PricingRule>): Promise<PricingRule> {
    const existing = this.rules.get(id);
    if (!existing) {
      throw new Error(`Rule with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
      updated_at: new Date().toISOString(),
    };

    const validation = validatePricingRule(updated);
    if (!validation.valid) {
      throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
    }

    this.rules.set(id, updated);
    return updated;
  }

  async deleteRule(id: string): Promise<boolean> {
    return this.rules.delete(id);
  }

  async getRuleVersions(ruleId: string): Promise<PricingRule[]> {
    // For in-memory storage, we don't track versions
    // In production, this would query Strapi for all versions
    const rules = Array.from(this.rules.values());
    return rules.filter(r => r.id.startsWith(ruleId));
  }
}

/**
 * Calculation history interface
 */
export interface CalculationHistory {
  saveCalculation(
    input: PricingInput,
    output: PricingOutput,
    metadata?: Record<string, any>
  ): Promise<void>;
  getCalculationHistory(filters?: Record<string, any>): Promise<any[]>;
}

/**
 * In-memory calculation history (for testing)
 */
export class InMemoryCalculationHistory implements CalculationHistory {
  private history: Array<{
    timestamp: string;
    input: PricingInput;
    output: PricingOutput;
    metadata?: Record<string, any>;
  }>;

  constructor() {
    this.history = [];
  }

  async saveCalculation(
    input: PricingInput,
    output: PricingOutput,
    metadata?: Record<string, any>
  ): Promise<void> {
    this.history.push({
      timestamp: new Date().toISOString(),
      input,
      output,
      metadata,
    });
  }

  async getCalculationHistory(filters?: Record<string, any>): Promise<any[]> {
    if (!filters) {
      return this.history;
    }

    // Simple filtering
    return this.history.filter(entry => {
      if (filters.garment_id && entry.input.garment_id !== filters.garment_id) {
        return false;
      }
      if (filters.customer_type && entry.input.customer_type !== filters.customer_type) {
        return false;
      }
      return true;
    });
  }

  size(): number {
    return this.history.length;
  }
}

/**
 * Main Pricing API Service
 */
export class PricingAPIService {
  private cache: PricingCache;
  private ruleStorage: RuleStorage;
  private calculationHistory: CalculationHistory;
  private garmentCosts: Map<string, number>;

  constructor(
    ruleStorage: RuleStorage,
    calculationHistory: CalculationHistory,
    cacheTTL: number = 300
  ) {
    this.cache = new PricingCache(cacheTTL);
    this.ruleStorage = ruleStorage;
    this.calculationHistory = calculationHistory;
    this.garmentCosts = new Map();
  }

  /**
   * Set garment base costs (from supplier data)
   */
  setGarmentCost(garmentId: string, cost: number): void {
    this.garmentCosts.set(garmentId, cost);
  }

  /**
   * Get garment base cost
   */
  getGarmentCost(garmentId: string): number {
    return this.garmentCosts.get(garmentId) || 4.5; // Default cost
  }

  /**
   * Calculate pricing with caching
   */
  async calculate(
    input: PricingInput,
    options: { useCache?: boolean; dryRun?: boolean } = {}
  ): Promise<PricingOutput> {
    const { useCache = true, dryRun = false } = options;

    // Check cache
    if (useCache) {
      const cached = this.cache.get(input);
      if (cached) {
        return cached;
      }
    }

    // Load rules
    const rules = await this.ruleStorage.getRules();

    // Get garment cost
    const garmentCost = input.garment_id
      ? this.getGarmentCost(input.garment_id)
      : 4.5;

    // Calculate pricing
    const result = calculatePricing(input, rules, garmentCost);

    // Cache result
    if (useCache) {
      this.cache.set(input, result);
    }

    // Save to history (unless dry run)
    if (!dryRun) {
      await this.calculationHistory.saveCalculation(input, result, {
        cached: false,
      });
    }

    return result;
  }

  /**
   * Get pricing history
   */
  async getHistory(filters?: Record<string, any>): Promise<any[]> {
    return this.calculationHistory.getCalculationHistory(filters);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size(),
      ttl: 300, // TTL in seconds
    };
  }

  /**
   * Admin API: Create pricing rule
   */
  async createRule(rule: PricingRule): Promise<PricingRule> {
    const created = await this.ruleStorage.createRule(rule);
    this.clearCache(); // Invalidate cache when rules change
    return created;
  }

  /**
   * Admin API: Update pricing rule
   */
  async updateRule(id: string, updates: Partial<PricingRule>): Promise<PricingRule> {
    const updated = await this.ruleStorage.updateRule(id, updates);
    this.clearCache(); // Invalidate cache when rules change
    return updated;
  }

  /**
   * Admin API: Delete pricing rule
   */
  async deleteRule(id: string): Promise<boolean> {
    const deleted = await this.ruleStorage.deleteRule(id);
    if (deleted) {
      this.clearCache(); // Invalidate cache when rules change
    }
    return deleted;
  }

  /**
   * Admin API: Get all rules
   */
  async getRules(): Promise<PricingRule[]> {
    return this.ruleStorage.getRules();
  }

  /**
   * Admin API: Get specific rule
   */
  async getRule(id: string): Promise<PricingRule | null> {
    return this.ruleStorage.getRule(id);
  }

  /**
   * Admin API: Get rule versions
   */
  async getRuleVersions(ruleId: string): Promise<PricingRule[]> {
    return this.ruleStorage.getRuleVersions(ruleId);
  }

  /**
   * Performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    avg_calculation_time_ms: number;
    total_calculations: number;
    cache_hit_rate: number;
  }> {
    const history = await this.calculationHistory.getCalculationHistory();
    
    if (history.length === 0) {
      return {
        avg_calculation_time_ms: 0,
        total_calculations: 0,
        cache_hit_rate: 0,
      };
    }

    const totalTime = history.reduce(
      (sum, entry) => sum + (entry.output.calculation_time_ms || 0),
      0
    );

    return {
      avg_calculation_time_ms: totalTime / history.length,
      total_calculations: history.length,
      cache_hit_rate: 0, // Would need to track cache hits
    };
  }
}
