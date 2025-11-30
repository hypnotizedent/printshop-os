/**
 * AI API Routes
 * RESTful endpoints for the Customer Service AI
 */

import { Router, Request, Response } from 'express';
import { RAGService } from '../services/rag.service';
import { SentimentService } from '../services/sentiment.service';
import { DesignAnalysisService } from '../services/design-analysis.service';
import { ChatService } from '../services/chat.service';

export function createAIRoutes(
  ragService: RAGService,
  sentimentService: SentimentService,
  designAnalysisService: DesignAnalysisService,
  chatService: ChatService
): Router {
  const router = Router();

  /**
   * Analyze a customer inquiry
   * POST /analyze-inquiry
   */
  router.post('/analyze-inquiry', async (req: Request, res: Response) => {
    try {
      const { inquiry_text, customer_id, channel, ticket_id } = req.body;

      if (!inquiry_text) {
        return res.status(400).json({
          error: 'inquiry_text is required',
        });
      }

      const response = await ragService.analyzeInquiry({
        inquiryText: inquiry_text,
        customerId: customer_id,
        channel: channel || 'api',
        ticketId: ticket_id,
      });

      res.json({
        response_text: response.responseText,
        sentiment: response.sentiment,
        category: response.category,
        confidence: response.confidence,
        should_escalate: response.shouldEscalate,
        escalation_reason: response.escalationReason,
        suggested_responses: response.suggestedResponses,
        sources: response.sources,
      });
    } catch (error) {
      console.error('Error analyzing inquiry:', error);
      res.status(500).json({ error: 'Failed to analyze inquiry' });
    }
  });

  /**
   * Search FAQ knowledge base
   * POST /faq-search
   */
  router.post('/faq-search', async (req: Request, res: Response) => {
    try {
      const { query, top_k, category } = req.body;

      if (!query) {
        return res.status(400).json({
          error: 'query is required',
        });
      }

      const response = await ragService.searchFAQ({
        query,
        topK: top_k,
        category,
      });

      res.json(response);
    } catch (error) {
      console.error('Error searching FAQ:', error);
      res.status(500).json({ error: 'Failed to search FAQ' });
    }
  });

  /**
   * Analyze sentiment of text
   * POST /sentiment
   */
  router.post('/sentiment', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          error: 'text is required',
        });
      }

      const response = await sentimentService.analyzeSentiment({ text });

      res.json(response);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
  });

  /**
   * Analyze design image
   * POST /analyze-design
   */
  router.post('/analyze-design', async (req: Request, res: Response) => {
    try {
      const { image_url, customer_id } = req.body;

      if (!image_url) {
        return res.status(400).json({
          error: 'image_url is required',
        });
      }

      const response = await designAnalysisService.analyzeDesign({
        imageUrl: image_url,
        customerId: customer_id,
      });

      res.json({
        color_count: response.colorCount,
        has_gradient: response.hasGradient,
        resolution: response.resolution,
        text_detected: response.textDetected,
        recommended_service: response.recommendedService,
        issues: response.issues,
        estimated_price: response.estimatedPrice,
        confidence: response.confidence,
      });
    } catch (error) {
      console.error('Error analyzing design:', error);
      res.status(500).json({ error: 'Failed to analyze design' });
    }
  });

  /**
   * Create a new chat session
   * POST /chat/sessions
   */
  router.post('/chat/sessions', async (req: Request, res: Response) => {
    try {
      const { customer_id } = req.body;

      const session = await chatService.createSession(customer_id);

      res.status(201).json({
        session_id: session.id,
        customer_id: session.customerId,
        created_at: session.createdAt,
        status: session.status,
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({ error: 'Failed to create chat session' });
    }
  });

  /**
   * Send a message in a chat session
   * POST /chat/sessions/:session_id/messages
   */
  router.post('/chat/sessions/:session_id/messages', async (req: Request, res: Response) => {
    try {
      const { session_id } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          error: 'message is required',
        });
      }

      const response = await chatService.chat(session_id, message);

      res.json({
        response_text: response.responseText,
        sentiment: response.sentiment,
        category: response.category,
        confidence: response.confidence,
        should_escalate: response.shouldEscalate,
        sources: response.sources,
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  /**
   * Get chat session history
   * GET /chat/sessions/:session_id
   */
  router.get('/chat/sessions/:session_id', async (req: Request, res: Response) => {
    try {
      const { session_id } = req.params;

      const session = await chatService.getSession(session_id);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({
        session_id: session.id,
        customer_id: session.customerId,
        messages: session.messages,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        status: session.status,
      });
    } catch (error) {
      console.error('Error getting chat session:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  });

  /**
   * Resolve a chat session
   * POST /chat/sessions/:session_id/resolve
   */
  router.post('/chat/sessions/:session_id/resolve', async (req: Request, res: Response) => {
    try {
      const { session_id } = req.params;

      await chatService.resolveSession(session_id);

      res.json({ success: true, message: 'Session resolved' });
    } catch (error) {
      console.error('Error resolving session:', error);
      res.status(500).json({ error: 'Failed to resolve session' });
    }
  });

  /**
   * Get knowledge base statistics
   * GET /knowledge/stats
   */
  router.get('/knowledge/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await ragService.getCollectionStats();

      res.json({
        document_count: stats.count,
        metadata: stats.metadata,
      });
    } catch (error) {
      console.error('Error getting knowledge stats:', error);
      res.status(500).json({ error: 'Failed to get knowledge stats' });
    }
  });

  return router;
}
