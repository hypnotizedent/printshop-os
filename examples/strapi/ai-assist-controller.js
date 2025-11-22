/**
 * AI Assist Controller for Strapi
 * 
 * Example implementation for integrating Customer Service AI
 * with Strapi backend
 * 
 * Installation:
 * 1. Copy to your Strapi project: 
 *    /src/api/customer-service/controllers/ai-assist.js
 * 2. Create corresponding route file
 * 3. Add AI_SERVICE_URL to .env
 */

const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://cs-ai-api:5000';
const REQUEST_TIMEOUT = 30000; // 30 seconds

module.exports = {
  /**
   * Analyze customer inquiry and get AI response
   * POST /api/customer-service/ai-assist
   */
  async analyzeInquiry(ctx) {
    try {
      const { inquiry_text, customer_id, channel, ticket_id } = ctx.request.body;

      // Validate input
      if (!inquiry_text || inquiry_text.trim().length === 0) {
        return ctx.badRequest('inquiry_text is required');
      }

      // Call AI service
      const response = await axios.post(
        `${AI_SERVICE_URL}/analyze-inquiry`,
        {
          inquiry_text,
          customer_id,
          channel: channel || 'email',
          ticket_id,
        },
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data;

      // Log interaction to database
      const interaction = await strapi.entityService.create(
        'api::support-interaction.support-interaction',
        {
          data: {
            customer_id,
            inquiry: inquiry_text,
            ai_response: aiResponse.response_text,
            sentiment: aiResponse.sentiment,
            category: aiResponse.category,
            confidence: aiResponse.confidence,
            escalated: aiResponse.should_escalate,
            escalation_reason: aiResponse.escalation_reason,
            channel: channel || 'email',
            ticket_id,
          },
        }
      );

      // If escalation is needed, trigger notification
      if (aiResponse.should_escalate) {
        await strapi
          .service('api::notification.notification')
          .sendEscalationAlert({
            interaction_id: interaction.id,
            customer_id,
            reason: aiResponse.escalation_reason,
            sentiment: aiResponse.sentiment,
          });
      }

      // Return AI response
      ctx.body = {
        success: true,
        data: aiResponse,
        interaction_id: interaction.id,
      };
    } catch (error) {
      strapi.log.error('AI assist error:', error);

      if (error.code === 'ECONNREFUSED') {
        return ctx.serviceUnavailable('AI service is unavailable');
      }

      if (error.code === 'ETIMEDOUT') {
        return ctx.requestTimeout('AI service request timed out');
      }

      ctx.throw(500, 'Failed to process inquiry');
    }
  },

  /**
   * Search FAQ knowledge base
   * GET /api/customer-service/faq-search?query=...&top_k=3
   */
  async searchFAQ(ctx) {
    try {
      const { query, top_k = 3 } = ctx.query;

      if (!query || query.trim().length === 0) {
        return ctx.badRequest('query parameter is required');
      }

      const response = await axios.post(
        `${AI_SERVICE_URL}/faq-search`,
        {
          query,
          top_k: parseInt(top_k, 10),
        },
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      ctx.body = {
        success: true,
        data: response.data,
      };
    } catch (error) {
      strapi.log.error('FAQ search error:', error);

      if (error.code === 'ECONNREFUSED') {
        return ctx.serviceUnavailable('AI service is unavailable');
      }

      ctx.throw(500, 'Failed to search FAQ');
    }
  },

  /**
   * Analyze sentiment of text
   * POST /api/customer-service/sentiment
   */
  async analyzeSentiment(ctx) {
    try {
      const { text } = ctx.request.body;

      if (!text || text.trim().length === 0) {
        return ctx.badRequest('text is required');
      }

      const response = await axios.post(
        `${AI_SERVICE_URL}/sentiment`,
        { text },
        {
          timeout: 10000, // Sentiment is faster, 10s timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      ctx.body = {
        success: true,
        data: response.data,
      };
    } catch (error) {
      strapi.log.error('Sentiment analysis error:', error);
      ctx.throw(500, 'Failed to analyze sentiment');
    }
  },

  /**
   * Get support interaction by ID
   * GET /api/customer-service/interaction/:id
   */
  async getInteraction(ctx) {
    try {
      const { id } = ctx.params;

      const interaction = await strapi.entityService.findOne(
        'api::support-interaction.support-interaction',
        id
      );

      if (!interaction) {
        return ctx.notFound('Interaction not found');
      }

      ctx.body = {
        success: true,
        data: interaction,
      };
    } catch (error) {
      strapi.log.error('Get interaction error:', error);
      ctx.throw(500, 'Failed to retrieve interaction');
    }
  },

  /**
   * Update interaction (e.g., mark as resolved)
   * PUT /api/customer-service/interaction/:id
   */
  async updateInteraction(ctx) {
    try {
      const { id } = ctx.params;
      const { resolved, agent_id, agent_response } = ctx.request.body;

      const interaction = await strapi.entityService.update(
        'api::support-interaction.support-interaction',
        id,
        {
          data: {
            resolved,
            agent_id,
            agent_response,
            resolved_at: resolved ? new Date() : null,
          },
        }
      );

      ctx.body = {
        success: true,
        data: interaction,
      };
    } catch (error) {
      strapi.log.error('Update interaction error:', error);
      ctx.throw(500, 'Failed to update interaction');
    }
  },

  /**
   * Get support metrics/statistics
   * GET /api/customer-service/metrics
   */
  async getMetrics(ctx) {
    try {
      const { start_date, end_date } = ctx.query;

      // Build date filter
      const dateFilter = {};
      if (start_date) {
        dateFilter.$gte = new Date(start_date);
      }
      if (end_date) {
        dateFilter.$lte = new Date(end_date);
      }

      const where = dateFilter.$gte || dateFilter.$lte ? { created_at: dateFilter } : {};

      // Get all interactions in date range
      const interactions = await strapi.entityService.findMany(
        'api::support-interaction.support-interaction',
        {
          filters: where,
        }
      );

      // Calculate metrics
      const total = interactions.length;
      const escalated = interactions.filter((i) => i.escalated).length;
      const resolved = interactions.filter((i) => i.resolved).length;

      const sentimentCounts = interactions.reduce(
        (acc, i) => {
          acc[i.sentiment] = (acc[i.sentiment] || 0) + 1;
          return acc;
        },
        {}
      );

      const categoryCounts = interactions.reduce(
        (acc, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1;
          return acc;
        },
        {}
      );

      const avgConfidence =
        interactions.reduce((sum, i) => sum + (i.confidence || 0), 0) / total || 0;

      ctx.body = {
        success: true,
        data: {
          total_interactions: total,
          escalated_count: escalated,
          escalation_rate: total > 0 ? (escalated / total) * 100 : 0,
          resolved_count: resolved,
          resolution_rate: total > 0 ? (resolved / total) * 100 : 0,
          average_confidence: avgConfidence,
          sentiment_breakdown: sentimentCounts,
          category_breakdown: categoryCounts,
        },
      };
    } catch (error) {
      strapi.log.error('Get metrics error:', error);
      ctx.throw(500, 'Failed to retrieve metrics');
    }
  },
};
