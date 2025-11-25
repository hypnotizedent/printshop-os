/**
 * SOP Routes
 */

import { Router } from 'express';
import { sopController } from './sop.controller';

const router = Router();

// List SOPs
router.get('/sops', (req, res) => sopController.list(req, res));

// Search SOPs (must be before /:id to avoid conflict)
router.get('/sops/search', (req, res) => sopController.search(req, res));

// Analytics
router.get('/sops/analytics', (req, res) => sopController.analytics(req, res));

// Get single SOP
router.get('/sops/:id', (req, res) => sopController.getById(req, res));

// Create SOP
router.post('/sops', (req, res) => sopController.create(req, res));

// Update SOP
router.patch('/sops/:id', (req, res) => sopController.update(req, res));

// Delete SOP
router.delete('/sops/:id', (req, res) => sopController.delete(req, res));

// Version history
router.get('/sops/:id/versions', (req, res) => sopController.versions(req, res));

// Toggle favorite
router.post('/sops/:id/favorite', (req, res) => sopController.toggleFavorite(req, res));

export default router;
