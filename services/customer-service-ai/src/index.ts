/**
 * Customer Service AI - Main Entry Point
 * Express server with AI-powered customer service endpoints
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createAIRoutes } from './routes/ai.routes';
import { LLMClient } from './utils/llm-client';
import { RAGService } from './services/rag.service';
import { SentimentService } from './services/sentiment.service';
import { DesignAnalysisService } from './services/design-analysis.service';
import { ChatService } from './services/chat.service';
import { HealthStatus, AIConfig } from './types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configuration
const config: AIConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  ollamaUrl: process.env.LLM_API_URL || 'http://localhost:11434',
  vectorDbUrl: process.env.VECTOR_DB_URL || 'http://localhost:8000',
  strapiUrl: process.env.STRAPI_API_URL || 'http://localhost:1337/api',
  redisUrl: process.env.REDIS_URL,
  model: process.env.LLM_MODEL || 'gpt-4o-mini',
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1024', 10),
};

// Service instances (lazy initialization)
let llmClient: LLMClient | null = null;
let ragService: RAGService | null = null;
let sentimentService: SentimentService | null = null;
let designAnalysisService: DesignAnalysisService | null = null;
let chatService: ChatService | null = null;
let servicesInitialized = false;
const startTime = Date.now();

// Initialize services
async function initializeServices(): Promise<void> {
  if (servicesInitialized) return;

  try {
    console.log('Initializing AI services...');

    // Initialize LLM client
    llmClient = new LLMClient(config);
    console.log(`LLM Client initialized (${llmClient.getModelInfo().provider})`);

    // Initialize RAG service
    ragService = new RAGService(config.vectorDbUrl, llmClient);
    await ragService.initialize();
    console.log('RAG Service initialized');

    // Initialize other services
    sentimentService = new SentimentService(llmClient);
    designAnalysisService = new DesignAnalysisService(llmClient);
    chatService = new ChatService(ragService, config.redisUrl);

    servicesInitialized = true;
    console.log('All AI services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    // Services will run in degraded mode
  }
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const status: HealthStatus = {
    status: servicesInitialized ? 'healthy' : 'degraded',
    services: {
      llm: !!llmClient?.isAvailable(),
      vectorDb: !!ragService,
      redis: !!chatService,
      strapi: true, // Assume Strapi is available
    },
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  // Check if all services are available
  const allHealthy = Object.values(status.services).every(Boolean);
  status.status = allHealthy ? 'healthy' : 'degraded';

  res.status(status.status === 'healthy' ? 200 : 503).json(status);
});

// Ready check endpoint
app.get('/ready', (_req: Request, res: Response) => {
  if (servicesInitialized) {
    res.json({ ready: true });
  } else {
    res.status(503).json({ ready: false, message: 'Services not initialized' });
  }
});

// API documentation endpoint
app.get('/docs', (_req: Request, res: Response) => {
  res.json({
    name: 'PrintShop OS Customer Service AI',
    version: '1.0.0',
    description: 'AI-powered customer service API with RAG, sentiment analysis, and design analysis',
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Service health check',
      },
      ready: {
        method: 'GET',
        path: '/ready',
        description: 'Service readiness check',
      },
      analyzeInquiry: {
        method: 'POST',
        path: '/analyze-inquiry',
        description: 'Analyze customer inquiry with RAG',
        body: {
          inquiry_text: 'string (required)',
          customer_id: 'string (optional)',
          channel: 'string (optional: chat|email|ticket|api)',
          ticket_id: 'string (optional)',
        },
      },
      faqSearch: {
        method: 'POST',
        path: '/faq-search',
        description: 'Search FAQ knowledge base',
        body: {
          query: 'string (required)',
          top_k: 'number (optional, default: 5)',
          category: 'string (optional)',
        },
      },
      sentiment: {
        method: 'POST',
        path: '/sentiment',
        description: 'Analyze text sentiment',
        body: {
          text: 'string (required)',
        },
      },
      analyzeDesign: {
        method: 'POST',
        path: '/analyze-design',
        description: 'Analyze design image for print feasibility',
        body: {
          image_url: 'string (required)',
          customer_id: 'string (optional)',
        },
      },
      chatSessions: {
        create: {
          method: 'POST',
          path: '/chat/sessions',
          description: 'Create a new chat session',
        },
        get: {
          method: 'GET',
          path: '/chat/sessions/:sessionId',
          description: 'Get chat session details and history',
        },
        message: {
          method: 'POST',
          path: '/chat/sessions/:sessionId/messages',
          description: 'Send a message in a chat session',
        },
        resolve: {
          method: 'POST',
          path: '/chat/sessions/:sessionId/resolve',
          description: 'Mark a chat session as resolved',
        },
      },
      knowledgeStats: {
        method: 'GET',
        path: '/knowledge/stats',
        description: 'Get knowledge base statistics',
      },
    },
  });
});

// Mount AI routes with lazy service initialization
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!servicesInitialized && req.path !== '/health' && req.path !== '/docs') {
    await initializeServices();
  }
  next();
});

// Mount routes when services are ready
app.use((req: Request, res: Response, next: NextFunction) => {
  if (ragService && sentimentService && designAnalysisService && chatService) {
    const aiRouter = createAIRoutes(ragService, sentimentService, designAnalysisService, chatService);
    aiRouter(req, res, next);
  } else if (req.path !== '/health' && req.path !== '/docs' && req.path !== '/ready') {
    res.status(503).json({ error: 'Services not available', message: 'AI services are still initializing' });
  } else {
    next();
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Customer Service AI running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/docs`);

  // Initialize services in the background
  initializeServices().catch((err) => {
    console.error('Background service initialization failed:', err);
  });
});

export { app };
