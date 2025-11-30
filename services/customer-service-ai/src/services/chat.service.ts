/**
 * Chat Service
 * Manages chat sessions and conversation history
 */

import { v4 as uuidv4 } from 'uuid';
import { createClient, RedisClientType } from 'redis';
import { RAGService } from './rag.service';
import { ChatMessage, ChatSession, InquiryRequest, InquiryResponse } from '../types';

export class ChatService {
  private ragService: RAGService;
  private redis: RedisClientType | null = null;
  private sessions: Map<string, ChatSession> = new Map();
  private sessionTTL = 3600; // 1 hour

  constructor(ragService: RAGService, redisUrl?: string) {
    this.ragService = ragService;

    if (redisUrl) {
      this.initRedis(redisUrl);
    }
  }

  private async initRedis(redisUrl: string): Promise<void> {
    try {
      this.redis = createClient({ url: redisUrl });
      this.redis.on('error', (err) => console.error('Redis error:', err));
      await this.redis.connect();
      console.log('Chat service connected to Redis');
    } catch (error) {
      console.warn('Redis not available, using in-memory sessions:', error);
      this.redis = null;
    }
  }

  async createSession(customerId?: string): Promise<ChatSession> {
    const session: ChatSession = {
      id: uuidv4(),
      customerId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    await this.saveSession(session);
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    if (this.redis) {
      const data = await this.redis.get(`chat:session:${sessionId}`);
      if (data) {
        return JSON.parse(data);
      }
    }

    return this.sessions.get(sessionId) || null;
  }

  private async saveSession(session: ChatSession): Promise<void> {
    session.updatedAt = new Date();

    if (this.redis) {
      await this.redis.setEx(`chat:session:${session.id}`, this.sessionTTL, JSON.stringify(session));
    } else {
      this.sessions.set(session.id, session);
    }
  }

  async chat(sessionId: string, message: string): Promise<InquiryResponse> {
    let session = await this.getSession(sessionId);

    if (!session) {
      session = await this.createSession();
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    session.messages.push(userMessage);

    // Build context from previous messages
    const conversationContext = session.messages
      .slice(-10) // Last 10 messages for context
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    // Get AI response
    const request: InquiryRequest = {
      inquiryText: `Previous conversation:\n${conversationContext}\n\nCurrent question: ${message}`,
      customerId: session.customerId,
      channel: 'chat',
      sessionId: session.id,
    };

    const response = await this.ragService.analyzeInquiry(request);

    // Add assistant message
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response.responseText,
      timestamp: new Date(),
    };
    session.messages.push(assistantMessage);

    // Check if should escalate
    if (response.shouldEscalate) {
      session.status = 'escalated';
    }

    await this.saveSession(session);

    return response;
  }

  async resolveSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.status = 'resolved';
      await this.saveSession(session);
    }
  }

  async getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
    const session = await this.getSession(sessionId);
    return session?.messages || [];
  }

  async getActiveSessions(): Promise<ChatSession[]> {
    if (this.redis) {
      const keys = await this.redis.keys('chat:session:*');
      const sessions: ChatSession[] = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const session: ChatSession = JSON.parse(data);
          if (session.status === 'active') {
            sessions.push(session);
          }
        }
      }

      return sessions;
    }

    return Array.from(this.sessions.values()).filter((s) => s.status === 'active');
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}
