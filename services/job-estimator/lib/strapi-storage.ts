/**
 * Strapi Rule Storage & Calculation History
 * 
 * Provides integration between job-estimator and Strapi CMS for:
 * - Pricing rules management
 * - Price calculation snapshots (audit trail)
 */

import { RuleStorage, CalculationHistory } from './pricing-api';
import { PricingRule, PricingInput, PricingOutput } from './pricing-rules-engine';



/**
 * Configuration for Strapi connection
 */
export interface StrapiConfig {
  baseUrl: string;
  apiToken?: string;
}

/**
 * Strapi API response wrapper
 */
interface StrapiResponse<T> {
  data: T | T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiRuleData {
  id: number;
  documentId: string;
  rule_id: string;
  description: string;
  version: number;
  effective_date: string;
  expiry_date?: string;
  conditions: Record<string, any>;
  calculations: Record<string, any>;
  priority: number;
  enabled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface StrapiCalculationData {
  id: number;
  documentId: string;
  input: Record<string, any>;
  output: Record<string, any>;
  rules_applied: string[];
  garment_id?: string;
  quantity: number;
  service?: string;
  total_price: number;
  margin_pct: number;
  calculation_time_ms?: number;
  customer_type?: string;
  quote_id?: string;
  order_id?: string;
  notes?: string;
  createdAt: string;
}

/**
 * Transform Strapi rule data to engine PricingRule format
 */
function strapiToPricingRule(data: StrapiRuleData): PricingRule {
  return {
    id: data.rule_id,
    description: data.description,
    version: data.version,
    effective_date: data.effective_date,
    expiry_date: data.expiry_date,
    conditions: data.conditions,
    calculations: data.calculations,
    priority: data.priority,
    enabled: data.enabled,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

/**
 * Transform engine PricingRule to Strapi format
 */
function pricingRuleToStrapi(rule: PricingRule): Partial<StrapiRuleData> {
  return {
    rule_id: rule.id,
    description: rule.description,
    version: rule.version,
    effective_date: rule.effective_date,
    expiry_date: rule.expiry_date,
    conditions: rule.conditions,
    calculations: rule.calculations,
    priority: rule.priority,
    enabled: rule.enabled,
  };
}

/**
 * Strapi Rule Storage Implementation
 * 
 * Connects to Strapi's pricing-rule content type
 */
export class StrapiRuleStorage implements RuleStorage {
  private config: StrapiConfig;
  private cache: Map<string, { rule: PricingRule; timestamp: number }>;
  private cacheTTL: number = 60000; // 1 minute cache

  constructor(config: StrapiConfig) {
    this.config = config;
    this.cache = new Map();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiToken) {
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    }
    return headers;
  }

  private async fetchStrapi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<StrapiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Strapi API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<StrapiResponse<T>>;
  }

  /**
   * Get all active pricing rules from Strapi
   */
  async getRules(): Promise<PricingRule[]> {
    try {
      // Fetch enabled rules, sorted by priority (desc)
      const response = await this.fetchStrapi<StrapiRuleData[]>(
        '/api/pricing-rules?filters[enabled][$eq]=true&sort=priority:desc&pagination[limit]=100'
      );

      const dataArray = Array.isArray(response.data) ? response.data : [response.data];
      
      return dataArray
        .filter((item): item is StrapiRuleData => item !== null)
        .map(strapiToPricingRule);
    } catch (error) {
      console.error('Failed to fetch rules from Strapi:', error);
      throw error;
    }
  }

  /**
   * Get a specific rule by ID
   */
  async getRule(id: string): Promise<PricingRule | null> {
    // Check cache first
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.rule;
    }

    try {
      const response = await this.fetchStrapi<StrapiRuleData[]>(
        `/api/pricing-rules?filters[rule_id][$eq]=${encodeURIComponent(id)}`
      );

      const dataArray = Array.isArray(response.data) ? response.data : [response.data];
      const first = dataArray[0] as StrapiRuleData | undefined;
      
      if (!first) {
        return null;
      }

      const rule = strapiToPricingRule(first);
      
      // Update cache
      this.cache.set(id, { rule, timestamp: Date.now() });
      
      return rule;
    } catch (error) {
      console.error(`Failed to fetch rule ${id} from Strapi:`, error);
      throw error;
    }
  }

  /**
   * Create a new pricing rule in Strapi
   */
  async createRule(rule: PricingRule): Promise<PricingRule> {
    try {
      const strapiData = pricingRuleToStrapi(rule);
      
      const response = await this.fetchStrapi<StrapiRuleData>(
        '/api/pricing-rules',
        {
          method: 'POST',
          body: JSON.stringify({ data: strapiData }),
        }
      );

      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      if (!data) {
        throw new Error('No data returned from Strapi');
      }
      
      const created = strapiToPricingRule(data);
      
      // Update cache
      this.cache.set(rule.id, { rule: created, timestamp: Date.now() });
      
      return created;
    } catch (error) {
      console.error('Failed to create rule in Strapi:', error);
      throw error;
    }
  }

  /**
   * Update an existing pricing rule
   */
  async updateRule(id: string, updates: Partial<PricingRule>): Promise<PricingRule> {
    try {
      // First, find the rule's documentId
      const existingResponse = await this.fetchStrapi<StrapiRuleData[]>(
        `/api/pricing-rules?filters[rule_id][$eq]=${encodeURIComponent(id)}`
      );

      const dataArray = Array.isArray(existingResponse.data) 
        ? existingResponse.data 
        : [existingResponse.data];
      const existing = dataArray[0] as StrapiRuleData | undefined;
      
      if (!existing) {
        throw new Error(`Rule with id ${id} not found`);
      }

      // Prepare update data
      const updateData: Partial<StrapiRuleData> = {};
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.version !== undefined) updateData.version = updates.version;
      if (updates.effective_date !== undefined) updateData.effective_date = updates.effective_date;
      if (updates.expiry_date !== undefined) updateData.expiry_date = updates.expiry_date;
      if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
      if (updates.calculations !== undefined) updateData.calculations = updates.calculations;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.enabled !== undefined) updateData.enabled = updates.enabled;

      // Update using documentId
      const response = await this.fetchStrapi<StrapiRuleData>(
        `/api/pricing-rules/${existing.documentId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ data: updateData }),
        }
      );

      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      if (!data) {
        throw new Error('No data returned from Strapi');
      }
      
      const updated = strapiToPricingRule(data);
      
      // Update cache
      this.cache.set(id, { rule: updated, timestamp: Date.now() });
      
      return updated;
    } catch (error) {
      console.error(`Failed to update rule ${id} in Strapi:`, error);
      throw error;
    }
  }

  /**
   * Delete a pricing rule (soft delete by disabling)
   */
  async deleteRule(id: string): Promise<boolean> {
    try {
      // Find the rule first
      const existingResponse = await this.fetchStrapi<StrapiRuleData[]>(
        `/api/pricing-rules?filters[rule_id][$eq]=${encodeURIComponent(id)}`
      );

      const dataArray = Array.isArray(existingResponse.data) 
        ? existingResponse.data 
        : [existingResponse.data];
      const existing = dataArray[0] as StrapiRuleData | undefined;
      
      if (!existing) {
        return false;
      }

      // Soft delete by disabling
      await this.fetchStrapi<StrapiRuleData>(
        `/api/pricing-rules/${existing.documentId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ data: { enabled: false } }),
        }
      );

      // Remove from cache
      this.cache.delete(id);
      
      return true;
    } catch (error) {
      console.error(`Failed to delete rule ${id} in Strapi:`, error);
      throw error;
    }
  }

  /**
   * Get all versions of a rule (by rule_id prefix)
   */
  async getRuleVersions(ruleId: string): Promise<PricingRule[]> {
    try {
      // Get all rules that start with the base ID
      const baseId = ruleId.replace(/-v\d+$/, '');
      
      const response = await this.fetchStrapi<StrapiRuleData[]>(
        `/api/pricing-rules?filters[rule_id][$startsWith]=${encodeURIComponent(baseId)}&sort=version:desc`
      );

      const dataArray = Array.isArray(response.data) ? response.data : [response.data];
      
      return dataArray
        .filter((item): item is StrapiRuleData => item !== null)
        .map(strapiToPricingRule);
    } catch (error) {
      console.error(`Failed to fetch rule versions for ${ruleId}:`, error);
      throw error;
    }
  }

  /**
   * Clear the local cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Strapi Calculation History Implementation
 * 
 * Persists price calculations to Strapi for audit trail
 */
export class StrapiCalculationHistory implements CalculationHistory {
  private config: StrapiConfig;

  constructor(config: StrapiConfig) {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiToken) {
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    }
    return headers;
  }

  private async fetchStrapi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<StrapiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Strapi API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<StrapiResponse<T>>;
  }

  /**
   * Save a pricing calculation to Strapi
   */
  async saveCalculation(
    input: PricingInput,
    output: PricingOutput,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const data = {
        input: input,
        output: output,
        rules_applied: output.rules_applied,
        garment_id: input.garment_id || null,
        quantity: input.quantity,
        service: input.service || null,
        total_price: output.total_price,
        margin_pct: output.margin_pct,
        calculation_time_ms: output.calculation_time_ms,
        customer_type: input.customer_type || null,
        quote_id: metadata?.quote_id || null,
        order_id: metadata?.order_id || null,
        notes: metadata?.notes || null,
      };

      await this.fetchStrapi<StrapiCalculationData>(
        '/api/price-calculations',
        {
          method: 'POST',
          body: JSON.stringify({ data }),
        }
      );
    } catch (error) {
      console.error('Failed to save calculation to Strapi:', error);
      // Don't throw - we don't want to fail the calculation if history fails
    }
  }

  /**
   * Get calculation history with filters
   */
  async getCalculationHistory(filters?: Record<string, any>): Promise<any[]> {
    try {
      let queryParams = 'sort=createdAt:desc&pagination[limit]=100';
      
      if (filters) {
        if (filters.garment_id) {
          queryParams += `&filters[garment_id][$eq]=${encodeURIComponent(filters.garment_id)}`;
        }
        if (filters.customer_type) {
          queryParams += `&filters[customer_type][$eq]=${encodeURIComponent(filters.customer_type)}`;
        }
        if (filters.quote_id) {
          queryParams += `&filters[quote_id][$eq]=${encodeURIComponent(filters.quote_id)}`;
        }
        if (filters.order_id) {
          queryParams += `&filters[order_id][$eq]=${encodeURIComponent(filters.order_id)}`;
        }
        if (filters.from_date) {
          queryParams += `&filters[createdAt][$gte]=${encodeURIComponent(filters.from_date)}`;
        }
        if (filters.to_date) {
          queryParams += `&filters[createdAt][$lte]=${encodeURIComponent(filters.to_date)}`;
        }
      }

      const response = await this.fetchStrapi<StrapiCalculationData[]>(
        `/api/price-calculations?${queryParams}`
      );

      const dataArray = Array.isArray(response.data) ? response.data : [response.data];
      
      return dataArray
        .filter((item): item is StrapiCalculationData => item !== null)
        .map(item => ({
          timestamp: item.createdAt,
          input: item.input,
          output: item.output,
          metadata: {
            quote_id: item.quote_id,
            order_id: item.order_id,
            notes: item.notes,
          },
        }));
    } catch (error) {
      console.error('Failed to fetch calculation history from Strapi:', error);
      return [];
    }
  }

  /**
   * Get calculation by quote or order ID
   */
  async getCalculationByReference(
    referenceType: 'quote' | 'order',
    referenceId: string
  ): Promise<any | null> {
    try {
      const filterField = referenceType === 'quote' ? 'quote_id' : 'order_id';
      
      const response = await this.fetchStrapi<StrapiCalculationData[]>(
        `/api/price-calculations?filters[${filterField}][$eq]=${encodeURIComponent(referenceId)}&sort=createdAt:desc&pagination[limit]=1`
      );

      const dataArray = Array.isArray(response.data) ? response.data : [response.data];
      const first = dataArray[0] as StrapiCalculationData | undefined;
      
      if (!first) {
        return null;
      }

      return {
        timestamp: first.createdAt,
        input: first.input,
        output: first.output,
        metadata: {
          quote_id: first.quote_id,
          order_id: first.order_id,
          notes: first.notes,
        },
      };
    } catch (error) {
      console.error(`Failed to fetch calculation for ${referenceType} ${referenceId}:`, error);
      return null;
    }
  }

  /**
   * Get pricing analytics
   */
  async getAnalytics(fromDate?: string, toDate?: string): Promise<{
    total_calculations: number;
    avg_margin_pct: number;
    avg_calculation_time_ms: number;
    total_revenue: number;
    calculations_by_service: Record<string, number>;
  }> {
    try {
      let queryParams = 'pagination[limit]=1000';
      
      if (fromDate) {
        queryParams += `&filters[createdAt][$gte]=${encodeURIComponent(fromDate)}`;
      }
      if (toDate) {
        queryParams += `&filters[createdAt][$lte]=${encodeURIComponent(toDate)}`;
      }

      const response = await this.fetchStrapi<StrapiCalculationData[]>(
        `/api/price-calculations?${queryParams}`
      );

      const dataArray = Array.isArray(response.data) ? response.data : [response.data];
      const calculations = dataArray.filter((item): item is StrapiCalculationData => item !== null);

      if (calculations.length === 0) {
        return {
          total_calculations: 0,
          avg_margin_pct: 0,
          avg_calculation_time_ms: 0,
          total_revenue: 0,
          calculations_by_service: {},
        };
      }

      const total_calculations = calculations.length;
      const avg_margin_pct = calculations.reduce((sum, c) => sum + c.margin_pct, 0) / total_calculations;
      const avg_calculation_time_ms = calculations.reduce((sum, c) => sum + (c.calculation_time_ms || 0), 0) / total_calculations;
      const total_revenue = calculations.reduce((sum, c) => sum + c.total_price, 0);

      const calculations_by_service: Record<string, number> = {};
      for (const calc of calculations) {
        const service = calc.service || 'unknown';
        calculations_by_service[service] = (calculations_by_service[service] || 0) + 1;
      }

      return {
        total_calculations,
        avg_margin_pct: Number(avg_margin_pct.toFixed(2)),
        avg_calculation_time_ms: Number(avg_calculation_time_ms.toFixed(2)),
        total_revenue: Number(total_revenue.toFixed(2)),
        calculations_by_service,
      };
    } catch (error) {
      console.error('Failed to fetch analytics from Strapi:', error);
      return {
        total_calculations: 0,
        avg_margin_pct: 0,
        avg_calculation_time_ms: 0,
        total_revenue: 0,
        calculations_by_service: {},
      };
    }
  }
}

/**
 * Factory function to create Strapi-connected storage
 */
export function createStrapiStorage(config?: StrapiConfig): {
  ruleStorage: StrapiRuleStorage;
  calculationHistory: StrapiCalculationHistory;
} {
  const defaultConfig: StrapiConfig = {
    baseUrl: process.env.STRAPI_URL || 'http://localhost:1337',
    apiToken: process.env.STRAPI_API_TOKEN,
  };

  const finalConfig = { ...defaultConfig, ...config };

  return {
    ruleStorage: new StrapiRuleStorage(finalConfig),
    calculationHistory: new StrapiCalculationHistory(finalConfig),
  };
}

export default createStrapiStorage;
