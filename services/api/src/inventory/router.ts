/**
 * Inventory Check Router
 * Real-time inventory queries with Redis caching
 * 
 * Routes requests by SKU prefix:
 * - AC-* → AS Colour
 * - SS-* → S&S Activewear  
 * - SM-* or default → SanMar
 */

import { Router, Request, Response } from 'express';
import { createClient, RedisClientType } from 'redis';
import {
  InventoryCheckResponse,
  InventoryCheckError,
  SupplierType,
  SupplierInventoryResult,
} from './types';
import {
  ASColourInventoryClient,
  SSActivewearInventoryClient,
  SanMarInventoryClient,
} from './clients';

const router = Router();

// Redis client (lazy initialized)
let redisClient: RedisClientType | null = null;
let redisConnected = false;

// Supplier clients (lazy initialized)
let asColourClient: ASColourInventoryClient | null = null;
let ssActivewearClient: SSActivewearInventoryClient | null = null;
let sanmarClient: SanMarInventoryClient | null = null;

// Cache TTL in seconds (15 minutes)
const CACHE_TTL = 15 * 60;

/**
 * Initialize Redis connection
 */
async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient && redisConnected) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://100.92.156.118:6379';
  
  try {
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis connected for inventory cache');
      redisConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

/**
 * Determine supplier from SKU prefix
 */
function detectSupplier(sku: string): SupplierType {
  const upperSku = sku.toUpperCase();
  
  if (upperSku.startsWith('AC-') || upperSku.startsWith('AC')) {
    // AS Colour style codes often start with numbers like 5001
    return 'as-colour';
  }
  
  if (upperSku.startsWith('SS-')) {
    return 's&s-activewear';
  }
  
  if (upperSku.startsWith('SM-')) {
    return 'sanmar';
  }
  
  // Default heuristics for unprefix SKUs
  // AS Colour: typically 4-5 digit numbers (5001, 5051, etc.)
  if (/^\d{4,5}$/.test(sku)) {
    return 'as-colour';
  }
  
  // SanMar: alphanumeric codes like K110P, PC54, etc.
  if (/^[A-Z]{1,3}\d+[A-Z]?$/i.test(sku)) {
    return 'sanmar';
  }
  
  // S&S: typically numeric style IDs
  if (/^\d+$/.test(sku)) {
    return 's&s-activewear';
  }
  
  // Default to SanMar
  return 'sanmar';
}

/**
 * Get or initialize supplier client
 */
function getSupplierClient(supplier: SupplierType): ASColourInventoryClient | SSActivewearInventoryClient | SanMarInventoryClient | null {
  switch (supplier) {
    case 'as-colour':
      if (!asColourClient) {
        const apiKey = process.env.ASCOLOUR_API_KEY || process.env.ASCOLOUR_SUBSCRIPTION_KEY;
        const email = process.env.ASCOLOUR_EMAIL;
        const password = process.env.ASCOLOUR_PASSWORD;
        if (!apiKey) {
          console.error('AS Colour API key not configured');
          return null;
        }
        if (!email || !password) {
          console.warn('AS Colour email/password not configured - some features may not work');
        }
        asColourClient = new ASColourInventoryClient(apiKey, email, password);
      }
      return asColourClient;

    case 's&s-activewear':
      if (!ssActivewearClient) {
        const apiKey = process.env.SS_ACTIVEWEAR_API_KEY;
        const accountNumber = process.env.SS_ACTIVEWEAR_ACCOUNT_NUMBER;
        if (!apiKey || !accountNumber) {
          console.error('S&S Activewear API credentials not configured');
          return null;
        }
        ssActivewearClient = new SSActivewearInventoryClient(apiKey, accountNumber);
      }
      return ssActivewearClient;

    case 'sanmar':
      if (!sanmarClient) {
        sanmarClient = new SanMarInventoryClient();
      }
      return sanmarClient;

    default:
      return null;
  }
}

/**
 * Query supplier for inventory
 */
async function querySupplier(sku: string, supplier: SupplierType): Promise<SupplierInventoryResult> {
  const client = getSupplierClient(supplier);
  
  if (!client) {
    return { found: false, error: `${supplier} client not configured` };
  }

  return client.getInventory(sku);
}

/**
 * Generate cache key
 */
function getCacheKey(sku: string, supplier: SupplierType): string {
  return `inventory:${supplier}:${sku.toUpperCase()}`;
}

/**
 * GET /api/inventory/check/:sku
 * Check inventory for a specific SKU
 */
router.get('/check/:sku', async (req: Request, res: Response) => {
  const { sku } = req.params;
  const forceRefresh = req.query.refresh === 'true';
  
  if (!sku || sku.length < 2) {
    const error: InventoryCheckError = {
      error: 'Invalid SKU format',
      sku: sku || '',
      code: 'INVALID_SKU',
    };
    return res.status(400).json(error);
  }

  // Detect supplier from SKU
  const supplier = detectSupplier(sku);
  const cacheKey = getCacheKey(sku, supplier);

  // Try cache first (unless force refresh)
  if (!forceRefresh) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const response: InventoryCheckResponse = JSON.parse(cached);
          response.cached = true;
          return res.json(response);
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
  }

  // Query supplier
  const result = await querySupplier(sku, supplier);

  if (!result.found) {
    const error: InventoryCheckError = {
      error: result.error || 'Product not found',
      sku,
      supplier,
      code: result.error?.includes('not configured') ? 'SUPPLIER_ERROR' : 'NOT_FOUND',
    };
    return res.status(404).json(error);
  }

  // Build response
  const totalQty = (result.inventory || []).reduce((sum, item) => sum + item.qty, 0);
  const now = new Date();
  const expires = new Date(now.getTime() + CACHE_TTL * 1000);

  const response: InventoryCheckResponse = {
    sku: sku.toUpperCase(),
    name: result.name || sku,
    supplier,
    price: result.price || null,
    currency: result.currency || 'USD',
    inventory: result.inventory || [],
    totalQty,
    lastChecked: now.toISOString(),
    cached: false,
    cacheExpires: expires.toISOString(),
  };

  // Cache the response
  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
    }
  } catch (error) {
    console.error('Cache write error:', error);
  }

  return res.json(response);
});

/**
 * GET /api/inventory/check/:sku/color/:color
 * Check inventory for a specific SKU and color
 */
router.get('/check/:sku/color/:color', async (req: Request, res: Response) => {
  const { sku, color } = req.params;
  const forceRefresh = req.query.refresh === 'true';

  if (!sku || !color) {
    const error: InventoryCheckError = {
      error: 'SKU and color are required',
      sku: sku || '',
      code: 'INVALID_SKU',
    };
    return res.status(400).json(error);
  }

  // Detect supplier from SKU
  const supplier = detectSupplier(sku);
  const cacheKey = getCacheKey(sku, supplier);

  // Try cache first
  let inventoryData: InventoryCheckResponse | null = null;
  
  if (!forceRefresh) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          inventoryData = JSON.parse(cached);
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
  }

  // If not cached, fetch from supplier
  if (!inventoryData) {
    const result = await querySupplier(sku, supplier);

    if (!result.found) {
      const error: InventoryCheckError = {
        error: result.error || 'Product not found',
        sku,
        supplier,
        code: 'NOT_FOUND',
      };
      return res.status(404).json(error);
    }

    const now = new Date();
    const expires = new Date(now.getTime() + CACHE_TTL * 1000);

    inventoryData = {
      sku: sku.toUpperCase(),
      name: result.name || sku,
      supplier,
      price: result.price || null,
      currency: result.currency || 'USD',
      inventory: result.inventory || [],
      totalQty: (result.inventory || []).reduce((sum, item) => sum + item.qty, 0),
      lastChecked: now.toISOString(),
      cached: false,
      cacheExpires: expires.toISOString(),
    };

    // Cache the full response
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(inventoryData));
      }
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Filter by color
  const colorLower = color.toLowerCase();
  const filteredInventory = inventoryData.inventory.filter(
    item => item.color.toLowerCase().includes(colorLower)
  );

  const response: InventoryCheckResponse = {
    ...inventoryData,
    inventory: filteredInventory,
    totalQty: filteredInventory.reduce((sum, item) => sum + item.qty, 0),
    cached: true,
  };

  return res.json(response);
});

/**
 * GET /api/inventory/health
 * Health check for inventory service and suppliers
 */
router.get('/health', async (_req: Request, res: Response) => {
  const health: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: { connected: false },
    suppliers: {},
  };

  // Check Redis
  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.ping();
      health.redis.connected = true;
    }
  } catch {
    health.redis.connected = false;
  }

  // Check supplier configurations
  health.suppliers['as-colour'] = {
    configured: !!(process.env.ASCOLOUR_API_KEY || process.env.ASCOLOUR_SUBSCRIPTION_KEY),
  };
  health.suppliers['s&s-activewear'] = {
    configured: !!(process.env.SS_ACTIVEWEAR_API_KEY && process.env.SS_ACTIVEWEAR_ACCOUNT_NUMBER),
  };
  health.suppliers['sanmar'] = {
    configured: true, // SanMar uses cached CSV data
    cacheStats: sanmarClient?.getCacheStats() || { products: 0, lastLoaded: false },
  };

  return res.json(health);
});

/**
 * POST /api/inventory/batch
 * Batch check inventory for multiple SKUs
 */
router.post('/batch', async (req: Request, res: Response) => {
  const { skus } = req.body;

  if (!Array.isArray(skus) || skus.length === 0) {
    return res.status(400).json({ error: 'skus array is required' });
  }

  if (skus.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 SKUs per batch request' });
  }

  const results: Record<string, InventoryCheckResponse | InventoryCheckError> = {};

  // Process in parallel with concurrency limit
  const concurrency = 5;
  for (let i = 0; i < skus.length; i += concurrency) {
    const batch = skus.slice(i, i + concurrency);
    
    await Promise.all(
      batch.map(async (sku: string) => {
        const supplier = detectSupplier(sku);
        const cacheKey = getCacheKey(sku, supplier);

        // Try cache
        try {
          const redis = await getRedisClient();
          if (redis) {
            const cached = await redis.get(cacheKey);
            if (cached) {
              const response = JSON.parse(cached);
              response.cached = true;
              results[sku] = response;
              return;
            }
          }
        } catch {
          // Continue to supplier query
        }

        // Query supplier
        const result = await querySupplier(sku, supplier);

        if (!result.found) {
          results[sku] = {
            error: result.error || 'Not found',
            sku,
            supplier,
            code: 'NOT_FOUND',
          };
          return;
        }

        const now = new Date();
        const expires = new Date(now.getTime() + CACHE_TTL * 1000);

        const response: InventoryCheckResponse = {
          sku: sku.toUpperCase(),
          name: result.name || sku,
          supplier,
          price: result.price || null,
          currency: result.currency || 'USD',
          inventory: result.inventory || [],
          totalQty: (result.inventory || []).reduce((sum, item) => sum + item.qty, 0),
          lastChecked: now.toISOString(),
          cached: false,
          cacheExpires: expires.toISOString(),
        };

        // Cache
        try {
          const redis = await getRedisClient();
          if (redis) {
            await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
          }
        } catch {
          // Continue
        }

        results[sku] = response;
      })
    );
  }

  return res.json({
    count: Object.keys(results).length,
    results,
  });
});

export default router;
