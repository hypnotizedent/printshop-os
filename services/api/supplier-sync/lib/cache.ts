/**
 * Redis cache service with graceful fallback
 */

import Redis from 'ioredis';
import { CacheConfig, getCacheConfig } from './cache-config';

export interface CacheStats {
  hits: number;
  misses: number;
  apiCalls: number;
  cacheHitRate: number;
  costSavings: number;
}

export class CacheService {
  private client: Redis | null = null;
  private enabled: boolean;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    apiCalls: 0,
    cacheHitRate: 0,
    costSavings: 0,
  };
  
  // Estimated cost per API call in dollars
  private readonly COST_PER_API_CALL = 0.16; // $800/month ÷ 5000 calls/day ÷ 30 days

  constructor(private config: CacheConfig) {
    this.enabled = config.enabled !== false;
    
    if (this.enabled) {
      this.initializeClient();
    } else {
      this.log('warn', 'Cache is disabled via configuration');
    }
  }

  /**
   * Initialize Redis client with connection handling
   */
  private initializeClient(): void {
    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db || 0,
        connectTimeout: this.config.connectionTimeout || 5000,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest || 1,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.log('error', 'Redis connection failed after 3 retries, disabling cache');
            this.enabled = false;
            return null;
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('error', (error: Error) => {
        this.log('error', 'Redis connection error, falling back to direct API calls', error);
        this.enabled = false;
      });

      this.client.on('connect', () => {
        this.log('info', 'Successfully connected to Redis');
        this.enabled = true;
      });

      this.client.on('ready', () => {
        this.log('info', 'Redis client ready');
      });

      this.client.on('close', () => {
        this.log('warn', 'Redis connection closed');
      });
    } catch (error) {
      this.log('error', 'Failed to initialize Redis client', error);
      this.enabled = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.client) {
      this.stats.misses++;
      return null;
    }

    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        this.stats.misses++;
        this.updateStats();
        return null;
      }

      this.stats.hits++;
      this.updateStats();
      
      try {
        return JSON.parse(value) as T;
      } catch {
        // If parsing fails, return the raw value
        return value as unknown as T;
      }
    } catch (error) {
      this.log('warn', `Cache GET failed for key ${key}, falling back`, error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      
      if (ttl && ttl > 0) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      this.log('warn', `Cache SET failed for key ${key}`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.log('warn', `Cache DELETE failed for key ${key}`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.enabled || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      this.log('warn', `Cache DELETE pattern failed for ${pattern}`, error);
      return 0;
    }
  }

  /**
   * Increment API call counter
   */
  incrementApiCalls(): void {
    this.stats.apiCalls++;
    this.updateStats();
  }

  /**
   * Get current cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      apiCalls: 0,
      cacheHitRate: 0,
      costSavings: 0,
    };
  }

  /**
   * Update calculated stats
   */
  private updateStats(): void {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    if (totalRequests > 0) {
      this.stats.cacheHitRate = this.stats.hits / totalRequests;
      
      // Calculate cost savings: cached requests avoid API calls
      const savedApiCalls = this.stats.hits;
      this.stats.costSavings = savedApiCalls * this.COST_PER_API_CALL;
    }
  }

  /**
   * Log cache statistics summary
   */
  logStats(): void {
    const stats = this.getStats();
    const totalRequests = stats.hits + stats.misses;
    
    this.log('info', 'Cache Statistics:', {
      enabled: this.enabled,
      totalRequests,
      hits: stats.hits,
      misses: stats.misses,
      apiCalls: stats.apiCalls,
      cacheHitRate: `${(stats.cacheHitRate * 100).toFixed(2)}%`,
      costSavings: `$${stats.costSavings.toFixed(2)}`,
      projectedMonthlySavings: `$${(stats.costSavings * 30).toFixed(2)}`,
    });
  }

  /**
   * Check if cache is enabled and connected
   */
  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * Log message with consistent formatting
   */
  private log(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [CACHE] [${level.toUpperCase()}] ${message}`;
    
    if (meta) {
      console[level](logMessage, meta);
    } else {
      console[level](logMessage);
    }
  }
}

/**
 * Create cache service instance from environment configuration
 */
export function createCacheService(config?: CacheConfig): CacheService {
  return new CacheService(config || getCacheConfig());
}

// Export singleton instance
let cacheServiceInstance: CacheService | null = null;

/**
 * Get singleton cache service instance
 */
export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = createCacheService();
  }
  return cacheServiceInstance;
}
