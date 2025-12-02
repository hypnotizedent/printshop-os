/**
 * Designs API Routes
 * Handles design CRUD operations and quote calculations
 */

import { Router, Request, Response } from 'express';

const router = Router();

// Types
interface DesignSession {
  id?: string;
  documentId?: string;
  customerEmail?: string;
  customerId?: string;
  garmentType: string;
  garmentColor?: string;
  garmentSize?: string;
  printMethod?: string;
  quantity?: number;
  designs: unknown;
  canvasData?: unknown;
  pricing: PricingBreakdown;
  status: string;
  mockupUrl?: string;
  notes?: string;
}

interface PricingBreakdown {
  basePrice: number;
  garmentCost: number;
  printCost: number;
  setupFee: number;
  colorFees: number;
  rushFee: number;
  discount: number;
  subtotal: number;
  total: number;
  perUnitPrice: number;
}

interface QuoteRequest {
  garmentType: string;
  printMethod: string;
  quantity: number;
  numColors: number;
  rushOrder?: boolean;
}

interface StrapiError {
  error?: {
    message?: string;
  };
}

// Base garment prices
const BASE_GARMENT_PRICES: Record<string, number> = {
  't-shirt': 19.99,
  'hoodie': 39.99,
  'tank-top': 16.99,
  'long-sleeve': 24.99,
  'polo': 29.99,
  'sweatshirt': 34.99,
  'hat': 24.99,
  'jacket': 49.99,
};

// Print method pricing
const PRINT_METHOD_PRICES: Record<string, { setup: number; perColor: number }> = {
  'screen-print': { setup: 25, perColor: 15 },
  'dtg': { setup: 0, perColor: 0 },
  'embroidery': { setup: 35, perColor: 10 },
  'heat-transfer': { setup: 15, perColor: 5 },
  'sublimation': { setup: 10, perColor: 0 },
};

// Quantity discount tiers
const getQuantityDiscount = (quantity: number): number => {
  if (quantity >= 72) return -6;
  if (quantity >= 36) return -4;
  if (quantity >= 12) return -2;
  return 0;
};

// Calculate pricing
const calculatePricing = (request: QuoteRequest): PricingBreakdown => {
  const basePrice = BASE_GARMENT_PRICES[request.garmentType] || 19.99;
  const printPricing = PRINT_METHOD_PRICES[request.printMethod] || { setup: 0, perColor: 0 };
  
  const garmentCost = basePrice;
  const printCost = request.printMethod === 'dtg' || request.printMethod === 'sublimation'
    ? 8
    : printPricing.perColor * Math.max(request.numColors, 1);
  
  const setupFee = printPricing.setup;
  const discount = getQuantityDiscount(request.quantity);
  const rushFee = request.rushOrder ? (garmentCost + printCost) * 0.25 : 0;
  
  const perUnitBeforeDiscount = garmentCost + printCost + rushFee;
  const perUnitPrice = perUnitBeforeDiscount + discount;
  const subtotal = perUnitPrice * request.quantity + setupFee;
  
  return {
    basePrice,
    garmentCost,
    printCost,
    setupFee,
    colorFees: printPricing.perColor * Math.max(request.numColors, 1),
    rushFee: rushFee * request.quantity,
    discount: Math.abs(discount) * request.quantity,
    subtotal,
    total: subtotal,
    perUnitPrice: perUnitPrice + (setupFee / request.quantity),
  };
};

// Strapi URL from environment
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

/**
 * POST /api/designs
 * Create a new design session
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const designData = req.body as Partial<DesignSession>;
    
    // Call Strapi to create design session
    const response = await fetch(`${STRAPI_URL}/api/design-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: designData }),
    });
    
    if (!response.ok) {
      const errorData = await response.json() as StrapiError;
      res.status(response.status).json({ error: errorData.error?.message || 'Failed to create design' });
      return;
    }
    
    const result = await response.json();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating design:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/designs/:id
 * Get a design session by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const response = await fetch(`${STRAPI_URL}/api/design-sessions/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        res.status(404).json({ error: 'Design not found' });
        return;
      }
      res.status(response.status).json({ error: 'Failed to fetch design' });
      return;
    }
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error fetching design:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/designs/:id
 * Update a design session
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<DesignSession>;
    
    const response = await fetch(`${STRAPI_URL}/api/design-sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: updates }),
    });
    
    if (!response.ok) {
      const errorData = await response.json() as StrapiError;
      res.status(response.status).json({ error: errorData.error?.message || 'Failed to update design' });
      return;
    }
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/designs/:id
 * Delete a design session
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const response = await fetch(`${STRAPI_URL}/api/design-sessions/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to delete design' });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/designs/customer/:email
 * Get all designs for a customer
 */
router.get('/customer/:email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    
    const response = await fetch(
      `${STRAPI_URL}/api/design-sessions?filters[customerEmail][$eq]=${encodeURIComponent(email)}&sort=createdAt:desc`
    );
    
    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch designs' });
      return;
    }
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error fetching customer designs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

/**
 * Quotes API Router
 * Calculate pricing for designs
 */
export const quotesRouter = Router();

/**
 * POST /api/quotes
 * Calculate a quote for a design
 */
quotesRouter.post('/', (req: Request, res: Response): void => {
  try {
    const quoteRequest = req.body as QuoteRequest;
    
    // Validate required fields
    if (!quoteRequest.garmentType) {
      res.status(400).json({ error: 'garmentType is required' });
      return;
    }
    if (!quoteRequest.printMethod) {
      res.status(400).json({ error: 'printMethod is required' });
      return;
    }
    if (!quoteRequest.quantity || quoteRequest.quantity < 1) {
      res.status(400).json({ error: 'quantity must be at least 1' });
      return;
    }
    
    const pricing = calculatePricing({
      garmentType: quoteRequest.garmentType,
      printMethod: quoteRequest.printMethod,
      quantity: quoteRequest.quantity,
      numColors: quoteRequest.numColors || 1,
      rushOrder: quoteRequest.rushOrder || false,
    });
    
    res.json({
      success: true,
      quote: pricing,
      request: quoteRequest,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating quote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/quotes/pricing-rules
 * Get available pricing rules and options
 */
quotesRouter.get('/pricing-rules', (_req: Request, res: Response): void => {
  res.json({
    garmentPrices: BASE_GARMENT_PRICES,
    printMethods: PRINT_METHOD_PRICES,
    quantityTiers: [
      { minQty: 1, maxQty: 11, discount: 0, label: 'Sample' },
      { minQty: 12, maxQty: 35, discount: 2, label: 'Team' },
      { minQty: 36, maxQty: 71, discount: 4, label: 'Bulk' },
      { minQty: 72, maxQty: null, discount: 6, label: 'Wholesale' },
    ],
    rushOrderMultiplier: 1.25,
  });
});
