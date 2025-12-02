/**
 * Designs API Routes
 * Handles design CRUD operations and quote calculations
 */

import { Router, Request, Response } from 'express';
import { PricingService } from '../services/pricing.service';

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
    
    // Use centralized validation from PricingService
    const validation = PricingService.validateRequest(quoteRequest);
    if (!validation.valid) {
      res.status(400).json({ error: validation.errors.join(', ') });
      return;
    }
    
    // Use centralized pricing calculation
    const quoteResult = PricingService.generateQuote({
      garmentType: quoteRequest.garmentType,
      printMethod: quoteRequest.printMethod,
      quantity: quoteRequest.quantity,
      numColors: quoteRequest.numColors || 1,
      rushOrder: quoteRequest.rushOrder || false,
    });
    
    res.json(quoteResult);
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
  res.json(PricingService.getPricingOptions());
});
