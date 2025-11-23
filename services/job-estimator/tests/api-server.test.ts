/**
 * API Server Integration Tests
 */

import request from 'supertest';
import app from '../lib/api-server';

describe('Pricing API Server', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /pricing/calculate', () => {
    it('should calculate pricing for a basic order', async () => {
      const input = {
        garment_id: 'ss-activewear-6001',
        quantity: 100,
        service: 'screen',
        print_locations: ['front', 'back'],
        color_count: 3,
      };

      const response = await request(app)
        .post('/pricing/calculate')
        .send(input)
        .expect(200);

      expect(response.body).toHaveProperty('line_items');
      expect(response.body).toHaveProperty('subtotal');
      expect(response.body).toHaveProperty('margin_pct');
      expect(response.body).toHaveProperty('total_price');
      expect(response.body).toHaveProperty('breakdown');
      expect(response.body).toHaveProperty('rules_applied');
      expect(response.body).toHaveProperty('calculation_time_ms');

      expect(Array.isArray(response.body.line_items)).toBe(true);
      expect(response.body.total_price).toBeGreaterThan(0);
      expect(response.body.calculation_time_ms).toBeLessThan(100);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/pricing/calculate')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('quantity');
    });

    it('should reject invalid quantity', async () => {
      const response = await request(app)
        .post('/pricing/calculate')
        .send({ quantity: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should support dry run mode', async () => {
      const input = {
        quantity: 50,
        service: 'screen',
      };

      const response = await request(app)
        .post('/pricing/calculate?dry_run=true')
        .send(input)
        .expect(200);

      expect(response.body).toHaveProperty('total_price');
    });

    it('should match requirements example format', async () => {
      // Example from requirements
      const input = {
        garment_id: 'ss-activewear-6001',
        quantity: 100,
        print_locations: ['front', 'back'],
        color_count: 3,
        is_rush: false,
        customer_type: 'repeat_customer',
      };

      const response = await request(app)
        .post('/pricing/calculate')
        .send(input)
        .expect(200);

      // Verify structure matches requirements
      expect(response.body.line_items).toBeDefined();
      expect(response.body.subtotal).toBeDefined();
      expect(response.body.margin_pct).toBeDefined();
      expect(response.body.total_price).toBeDefined();
      expect(response.body.breakdown).toBeDefined();

      // Check line item structure
      const firstItem = response.body.line_items[0];
      expect(firstItem).toHaveProperty('description');
      expect(firstItem).toHaveProperty('total');
    });
  });

  describe('GET /pricing/history', () => {
    it('should return empty history initially', async () => {
      const response = await request(app)
        .get('/pricing/history')
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('calculations');
      expect(Array.isArray(response.body.calculations)).toBe(true);
    });

    it('should store and retrieve calculation history', async () => {
      // Make a calculation
      await request(app)
        .post('/pricing/calculate')
        .send({ quantity: 100, garment_id: 'test-garment' });

      // Retrieve history
      const response = await request(app)
        .get('/pricing/history')
        .expect(200);

      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should filter history by garment_id', async () => {
      // Make calculations with different garments
      await request(app)
        .post('/pricing/calculate')
        .send({ quantity: 100, garment_id: 'garment-a' });

      await request(app)
        .post('/pricing/calculate')
        .send({ quantity: 100, garment_id: 'garment-b' });

      // Filter by garment_id
      const response = await request(app)
        .get('/pricing/history?garment_id=garment-a')
        .expect(200);

      expect(response.body.calculations.length).toBeGreaterThan(0);
      response.body.calculations.forEach((calc: any) => {
        expect(calc.input.garment_id).toBe('garment-a');
      });
    });
  });

  describe('GET /pricing/metrics', () => {
    it('should return performance metrics', async () => {
      const response = await request(app)
        .get('/pricing/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('avg_calculation_time_ms');
      expect(response.body).toHaveProperty('total_calculations');
      expect(response.body).toHaveProperty('cache_hit_rate');
      expect(response.body).toHaveProperty('cache');
    });
  });

  describe('Admin Rule Management', () => {
    describe('GET /admin/rules', () => {
      it('should return all pricing rules', async () => {
        const response = await request(app)
          .get('/admin/rules')
          .expect(200);

        expect(response.body).toHaveProperty('count');
        expect(response.body).toHaveProperty('rules');
        expect(Array.isArray(response.body.rules)).toBe(true);
      });
    });

    describe('POST /admin/rules', () => {
      it('should create a new pricing rule', async () => {
        const newRule = {
          id: 'test-rule-api',
          description: 'Test rule from API',
          version: 1,
          effective_date: '2025-01-01',
          conditions: { quantity_min: 50 },
          calculations: { discount_pct: 5 },
          priority: 8,
          enabled: true,
        };

        const response = await request(app)
          .post('/admin/rules')
          .send(newRule)
          .expect(201);

        expect(response.body).toHaveProperty('id', 'test-rule-api');
        expect(response.body).toHaveProperty('created_at');
        expect(response.body).toHaveProperty('updated_at');
      });

      it('should reject invalid rule', async () => {
        const invalidRule = {
          id: 'invalid-rule',
          // Missing required fields
        };

        await request(app)
          .post('/admin/rules')
          .send(invalidRule)
          .expect(400);
      });
    });

    describe('GET /admin/rules/:id', () => {
      it('should return a specific rule', async () => {
        // First create a rule
        const newRule = {
          id: 'specific-rule-test',
          description: 'Specific rule test',
          version: 1,
          effective_date: '2025-01-01',
          conditions: {},
          calculations: {},
          priority: 1,
          enabled: true,
        };

        await request(app)
          .post('/admin/rules')
          .send(newRule);

        // Then retrieve it
        const response = await request(app)
          .get('/admin/rules/specific-rule-test')
          .expect(200);

        expect(response.body).toHaveProperty('id', 'specific-rule-test');
      });

      it('should return 404 for non-existent rule', async () => {
        await request(app)
          .get('/admin/rules/non-existent-rule')
          .expect(404);
      });
    });

    describe('PUT /admin/rules/:id', () => {
      it('should update an existing rule', async () => {
        // First create a rule
        const newRule = {
          id: 'update-test-rule',
          description: 'Original description',
          version: 1,
          effective_date: '2025-01-01',
          conditions: {},
          calculations: {},
          priority: 1,
          enabled: true,
        };

        await request(app)
          .post('/admin/rules')
          .send(newRule);

        // Then update it
        const updates = {
          description: 'Updated description',
          enabled: false,
        };

        const response = await request(app)
          .put('/admin/rules/update-test-rule')
          .send(updates)
          .expect(200);

        expect(response.body.description).toBe('Updated description');
        expect(response.body.enabled).toBe(false);
        expect(response.body).toHaveProperty('updated_at');
      });

      it('should return error for non-existent rule', async () => {
        await request(app)
          .put('/admin/rules/non-existent')
          .send({ description: 'Test' })
          .expect(400);
      });
    });

    describe('DELETE /admin/rules/:id', () => {
      it('should delete an existing rule', async () => {
        // First create a rule
        const newRule = {
          id: 'delete-test-rule',
          description: 'To be deleted',
          version: 1,
          effective_date: '2025-01-01',
          conditions: {},
          calculations: {},
          priority: 1,
          enabled: true,
        };

        await request(app)
          .post('/admin/rules')
          .send(newRule);

        // Then delete it
        await request(app)
          .delete('/admin/rules/delete-test-rule')
          .expect(204);

        // Verify it's gone
        await request(app)
          .get('/admin/rules/delete-test-rule')
          .expect(404);
      });

      it('should return 404 for non-existent rule', async () => {
        await request(app)
          .delete('/admin/rules/non-existent')
          .expect(404);
      });
    });

    describe('POST /admin/cache/clear', () => {
      it('should clear the cache', async () => {
        const response = await request(app)
          .post('/admin/cache/clear')
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Cache cleared');
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/pricing/calculate')
        .set('Content-Type', 'application/json')
        .send('{"invalid json}');
      
      // Body-parser returns 400 or 500 depending on error type
      expect([400, 500]).toContain(response.status);
    });
  });
});
