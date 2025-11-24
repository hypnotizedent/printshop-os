/**
 * SOP Controller - HTTP request handlers
 */

import { Request, Response } from 'express';
import { sopService } from './sop.service';
import { SOPCreateInput, SOPUpdateInput, SOPSearchQuery } from './types';

// Extend Express Request to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Helper to get user ID from request
 */
function getUserId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).user?.id;
}

export class SOPController {
  /**
   * GET /api/production/sops
   * List all SOPs with optional filtering
   */
  async list(req: Request, res: Response): Promise<Response> {
    try {
      const query: SOPSearchQuery = {
        category: req.query.category as any,
        difficulty: req.query.difficulty as any,
        machineId: req.query.machineId as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await sopService.findAll(query);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch SOPs' });
    }
  }

  /**
   * GET /api/production/sops/:id
   * Get a single SOP by ID
   */
  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const sop = await sopService.findById(id);

      if (!sop) {
        return res.status(404).json({ error: 'SOP not found' });
      }

      return res.status(200).json(sop);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch SOP' });
    }
  }

  /**
   * POST /api/production/sops
   * Create a new SOP
   */
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const input: SOPCreateInput = req.body;
      
      // Basic validation
      if (!input.title || !input.category || !input.summary || !input.content) {
        return res.status(400).json({ 
          error: 'Missing required fields: title, category, summary, content' 
        });
      }

      const userId = getUserId(req);
      const sop = await sopService.create(input, userId);

      return res.status(201).json(sop);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create SOP' });
    }
  }

  /**
   * PATCH /api/production/sops/:id
   * Update an existing SOP
   */
  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const input: SOPUpdateInput = req.body;
      const userId = getUserId(req);

      const sop = await sopService.update(id, input, userId);

      if (!sop) {
        return res.status(404).json({ error: 'SOP not found' });
      }

      return res.status(200).json(sop);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update SOP' });
    }
  }

  /**
   * DELETE /api/production/sops/:id
   * Delete an SOP
   */
  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deleted = await sopService.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'SOP not found' });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete SOP' });
    }
  }

  /**
   * GET /api/production/sops/search
   * Search SOPs
   */
  async search(req: Request, res: Response): Promise<Response> {
    try {
      const query: SOPSearchQuery = {
        q: req.query.q as string,
        category: req.query.category as any,
        difficulty: req.query.difficulty as any,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await sopService.search(query);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to search SOPs' });
    }
  }

  /**
   * POST /api/production/sops/:id/favorite
   * Toggle favorite status for a user
   */
  async toggleFavorite(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = getUserId(req) || req.body.userId;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const sop = await sopService.toggleFavorite(id, userId);

      if (!sop) {
        return res.status(404).json({ error: 'SOP not found' });
      }

      return res.status(200).json(sop);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to toggle favorite' });
    }
  }

  /**
   * GET /api/production/sops/analytics
   * Get usage analytics
   */
  async analytics(req: Request, res: Response): Promise<Response> {
    try {
      const analytics = await sopService.getAnalytics();
      return res.status(200).json(analytics);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  /**
   * GET /api/production/sops/:id/versions
   * Get version history for an SOP
   */
  async versions(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const versions = await sopService.getVersionHistory(id);

      return res.status(200).json(versions);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch version history' });
    }
  }
}

export const sopController = new SOPController();
