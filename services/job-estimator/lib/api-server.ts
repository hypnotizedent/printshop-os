/**
 * Pricing API Server
 * 
 * REST API for pricing calculations with full audit trail
 * Supports both in-memory (testing) and Strapi (production) storage
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PricingAPIService, InMemoryRuleStorage, InMemoryCalculationHistory } from './pricing-api';
import { StrapiRuleStorage, StrapiCalculationHistory, StrapiConfig } from './strapi-storage';
import { PricingInput, PricingRule } from './pricing-rules-engine';
import fs from 'fs';
import path from 'path';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize services
let apiService: PricingAPIService;

function initializeServices() {
  const useStrapi = process.env.USE_STRAPI === 'true' || process.env.STRAPI_URL;
  
  if (useStrapi) {
    // Production: Use Strapi for storage
    const strapiConfig: StrapiConfig = {
      baseUrl: process.env.STRAPI_URL || 'http://localhost:1337',
      apiToken: process.env.STRAPI_API_TOKEN,
    };
    
    console.log(`🔌 Connecting to Strapi at ${strapiConfig.baseUrl}`);
    
    const ruleStorage = new StrapiRuleStorage(strapiConfig);
    const calculationHistory = new StrapiCalculationHistory(strapiConfig);
    apiService = new PricingAPIService(ruleStorage, calculationHistory);
    
    console.log('✅ Using Strapi storage (rules + calculation history)');
  } else {
    // Development: Use in-memory storage with sample rules
    const rulesPath = path.join(__dirname, '../data/sample-pricing-rules.json');
    let rules: PricingRule[] = [];
    
    if (fs.existsSync(rulesPath)) {
      const rulesData = fs.readFileSync(rulesPath, 'utf8');
      rules = JSON.parse(rulesData);
      console.log(`📦 Loaded ${rules.length} pricing rules from ${rulesPath}`);
    } else {
      console.log('⚠️  No rules file found, starting with empty rules');
    }

    const ruleStorage = new InMemoryRuleStorage(rules);
    const calculationHistory = new InMemoryCalculationHistory();
    apiService = new PricingAPIService(ruleStorage, calculationHistory);
    
    console.log('✅ Using in-memory storage (for development/testing)');
  }

  // Set some default garment costs (these would come from supplier data in production)
  apiService.setGarmentCost('ss-activewear-6001', 4.5);
  apiService.setGarmentCost('bella-canvas-3001', 5.0);
  apiService.setGarmentCost('next-level-3600', 4.8);
}

initializeServices();

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * POST /pricing/calculate
 * 
 * Calculate pricing for an order
 * 
 * Request body:
 * {
 *   garment_id: string,
 *   quantity: number,
 *   print_locations?: string[],
 *   color_count?: number,
 *   stitch_count?: number,
 *   service?: string,
 *   customer_type?: string,
 *   is_rush?: boolean
 * }
 * 
 * Response:
 * {
 *   line_items: [...],
 *   subtotal: number,
 *   margin_pct: number,
 *   total_price: number,
 *   breakdown: {...},
 *   rules_applied: string[],
 *   calculation_time_ms: number
 * }
 */
app.post('/pricing/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const input: PricingInput = req.body;

    // Validate required fields
    if (!input.quantity || input.quantity <= 0) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'quantity is required and must be greater than 0',
      });
      return;
    }

    // Check for dry run flag
    const dryRun = req.query.dry_run === 'true';

    // Calculate pricing
    const result = await apiService.calculate(input, { dryRun });

    res.json(result);
  } catch (error) {
    console.error('Error calculating pricing:', error);
    res.status(500).json({
      error: 'Calculation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /pricing/history
 * 
 * Get pricing calculation history
 * Query params: garment_id, customer_type
 */
app.get('/pricing/history', async (req: Request, res: Response) => {
  try {
    const filters: Record<string, any> = {};
    
    if (req.query.garment_id) {
      filters.garment_id = req.query.garment_id;
    }
    if (req.query.customer_type) {
      filters.customer_type = req.query.customer_type;
    }

    const history = await apiService.getHistory(filters);
    res.json({
      count: history.length,
      calculations: history,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /pricing/metrics
 * 
 * Get performance metrics
 */
app.get('/pricing/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await apiService.getPerformanceMetrics();
    const cacheStats = apiService.getCacheStats();

    res.json({
      ...metrics,
      cache: cacheStats,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Admin endpoints for rule management
 */

/**
 * GET /admin/rules
 * 
 * Get all pricing rules
 */
app.get('/admin/rules', async (_req: Request, res: Response) => {
  try {
    const rules = await apiService.getRules();
    res.json({
      count: rules.length,
      rules,
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({
      error: 'Failed to fetch rules',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /admin/rules/:id
 * 
 * Get a specific pricing rule
 */
app.get('/admin/rules/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await apiService.getRule(req.params.id);
    
    if (!rule) {
      res.status(404).json({
        error: 'Not found',
        message: `Rule ${req.params.id} not found`,
      });
      return;
    }

    res.json(rule);
  } catch (error) {
    console.error('Error fetching rule:', error);
    res.status(500).json({
      error: 'Failed to fetch rule',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /admin/rules
 * 
 * Create a new pricing rule
 */
app.post('/admin/rules', async (req: Request, res: Response) => {
  try {
    const rule: PricingRule = req.body;
    const created = await apiService.createRule(rule);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(400).json({
      error: 'Failed to create rule',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /admin/rules/:id
 * 
 * Update a pricing rule
 */
app.put('/admin/rules/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const updated = await apiService.updateRule(req.params.id, updates);
    res.json(updated);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(400).json({
      error: 'Failed to update rule',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /admin/rules/:id
 * 
 * Delete a pricing rule
 */
app.delete('/admin/rules/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await apiService.deleteRule(req.params.id);
    
    if (!deleted) {
      res.status(404).json({
        error: 'Not found',
        message: `Rule ${req.params.id} not found`,
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({
      error: 'Failed to delete rule',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /admin/cache/clear
 * 
 * Clear pricing cache
 */
app.post('/admin/cache/clear', (_req: Request, res: Response) => {
  try {
    apiService.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Pricing API Server listening on port ${PORT}`);
    console.log(`POST http://localhost:${PORT}/pricing/calculate`);
    console.log(`GET  http://localhost:${PORT}/admin/rules`);
  });
}

export default app;
export { apiService };
