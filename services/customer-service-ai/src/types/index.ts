/**
 * Customer Service AI Types
 * Type definitions for the AI service
 */

export interface InquiryRequest {
  inquiryText: string;
  customerId?: string;
  channel: 'chat' | 'email' | 'ticket' | 'api';
  ticketId?: string;
  sessionId?: string;
}

export interface InquiryResponse {
  responseText: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative';
  category: string;
  confidence: number;
  shouldEscalate: boolean;
  escalationReason?: string;
  suggestedResponses?: string[];
  sources?: DocumentSource[];
}

export interface DocumentSource {
  id: string;
  title: string;
  content: string;
  score: number;
  type: 'faq' | 'sop' | 'pricing' | 'supplier' | 'case_study';
}

export interface FAQSearchRequest {
  query: string;
  topK?: number;
  category?: string;
}

export interface FAQSearchResponse {
  results: DocumentSource[];
  totalCount: number;
}

export interface SentimentRequest {
  text: string;
}

export interface SentimentResponse {
  sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative';
  confidence: number;
  analysis: string;
}

export interface DesignAnalysisRequest {
  imageUrl: string;
  customerId?: string;
}

export interface DesignAnalysisResponse {
  colorCount: number;
  hasGradient: boolean;
  resolution: {
    width: number;
    height: number;
    dpi: number;
  };
  textDetected: boolean;
  recommendedService: 'screen_print' | 'dtg' | 'embroidery' | 'sublimation';
  issues: DesignIssue[];
  estimatedPrice: {
    basePrice: number;
    setupFee: number;
    perUnit: number;
  };
  confidence: number;
}

export interface DesignIssue {
  type: 'resolution' | 'colors' | 'gradient' | 'bleed' | 'text_clarity' | 'format';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  customerId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'resolved' | 'escalated';
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: 'faq' | 'sop' | 'pricing' | 'supplier' | 'case_study' | 'email_history';
  tags: string[];
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConfig {
  openaiApiKey?: string;
  ollamaUrl?: string;
  vectorDbUrl: string;
  strapiUrl: string;
  redisUrl?: string;
  model: string;
  embeddingModel: string;
  visionModel?: string;
  ollamaVisionModel?: string;
  temperature: number;
  maxTokens: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    llm: boolean;
    vectorDb: boolean;
    redis: boolean;
    strapi: boolean;
  };
  version: string;
  uptime: number;
}
