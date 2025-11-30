/**
 * RAG (Retrieval-Augmented Generation) Service
 * Provides context-aware AI responses using vector search
 */

import { ChromaClient, Collection } from 'chromadb';
import { LLMClient } from '../utils/llm-client';
import {
  InquiryRequest,
  InquiryResponse,
  DocumentSource,
  FAQSearchRequest,
  FAQSearchResponse,
  KnowledgeDocument,
} from '../types';

export class RAGService {
  private chromaClient: ChromaClient;
  private llmClient: LLMClient;
  private collection: Collection | null = null;
  private collectionName = 'printshop_knowledge';
  private initialized = false;

  constructor(vectorDbUrl: string, llmClient: LLMClient) {
    this.chromaClient = new ChromaClient({
      path: vectorDbUrl,
    });
    this.llmClient = llmClient;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get or create the collection
      this.collection = await this.chromaClient.getOrCreateCollection({
        name: this.collectionName,
        metadata: { description: 'PrintShop OS Knowledge Base' },
      });
      this.initialized = true;
      console.log(`RAG Service initialized with collection: ${this.collectionName}`);
    } catch (error) {
      console.error('Failed to initialize RAG service:', error);
      throw error;
    }
  }

  async indexDocument(doc: KnowledgeDocument): Promise<void> {
    if (!this.collection) {
      throw new Error('RAG service not initialized');
    }

    const embedding = await this.llmClient.embed(doc.content);

    await this.collection.add({
      ids: [doc.id],
      embeddings: [embedding],
      documents: [doc.content],
      metadatas: [
        {
          title: doc.title,
          category: doc.category,
          tags: doc.tags.join(','),
          ...doc.metadata,
        },
      ],
    });
  }

  async indexDocuments(docs: KnowledgeDocument[]): Promise<void> {
    if (!this.collection) {
      throw new Error('RAG service not initialized');
    }

    const contents = docs.map((d) => d.content);
    const embeddings = await this.llmClient.embedBatch(contents);

    await this.collection.add({
      ids: docs.map((d) => d.id),
      embeddings,
      documents: contents,
      metadatas: docs.map((d) => ({
        title: d.title,
        category: d.category,
        tags: d.tags.join(','),
        ...d.metadata,
      })),
    });
  }

  async searchSimilar(query: string, topK = 5, filter?: Record<string, string>): Promise<DocumentSource[]> {
    if (!this.collection) {
      throw new Error('RAG service not initialized');
    }

    const queryEmbedding = await this.llmClient.embed(query);

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: filter,
    });

    if (!results.documents?.[0] || !results.ids?.[0]) {
      return [];
    }

    return results.documents[0].map((content, i) => ({
      id: results.ids[0][i],
      title: (results.metadatas?.[0]?.[i] as Record<string, string>)?.title || '',
      content: content || '',
      score: results.distances?.[0]?.[i] ? 1 - (results.distances[0][i] ?? 0) : 0,
      type: ((results.metadatas?.[0]?.[i] as Record<string, string>)?.category || 'faq') as DocumentSource['type'],
    }));
  }

  async analyzeInquiry(request: InquiryRequest): Promise<InquiryResponse> {
    // Search for relevant context
    const relevantDocs = await this.searchSimilar(request.inquiryText, 5);

    // Build context from retrieved documents
    const context = relevantDocs
      .map((doc) => `[${doc.type.toUpperCase()}] ${doc.title}:\n${doc.content}`)
      .join('\n\n---\n\n');

    // Build the prompt for the LLM
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(request.inquiryText, context);

    // Get AI response
    const aiResponse = await this.llmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Parse the structured response
    return this.parseAIResponse(aiResponse, relevantDocs);
  }

  private buildSystemPrompt(): string {
    return `You are a helpful customer service assistant for PrintShop OS, a print shop management system. 
You help customers with:
- Pricing inquiries (screen printing, DTG, embroidery, sublimation)
- Turnaround times and rush orders
- Design requirements and artwork guidelines
- Order status and tracking
- Product availability
- Technical specifications

Guidelines:
1. Be friendly, professional, and concise
2. Use the provided context to give accurate answers
3. If unsure, acknowledge and offer to escalate
4. Always provide specific pricing when available
5. Mention relevant options (e.g., rush pricing, alternative methods)

Respond in JSON format:
{
  "responseText": "Your helpful response",
  "sentiment": "positive|neutral|negative|very_negative",
  "category": "pricing|turnaround|design|order|product|technical|general",
  "confidence": 0.0-1.0,
  "shouldEscalate": true|false,
  "escalationReason": "optional reason if escalating",
  "suggestedResponses": ["alternative 1", "alternative 2"]
}`;
  }

  private buildUserPrompt(inquiry: string, context: string): string {
    return `Customer Inquiry: "${inquiry}"

Relevant Knowledge Base Context:
${context || 'No specific context found for this inquiry.'}

Please provide a helpful response based on the context above. If the context doesn't contain relevant information, provide a general helpful response and note that the customer may need to speak with a team member for specifics.`;
  }

  private parseAIResponse(aiResponse: string, sources: DocumentSource[]): InquiryResponse {
    try {
      // Try to parse JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          responseText: parsed.responseText || aiResponse,
          sentiment: parsed.sentiment || 'neutral',
          category: parsed.category || 'general',
          confidence: parsed.confidence || 0.7,
          shouldEscalate: parsed.shouldEscalate || false,
          escalationReason: parsed.escalationReason,
          suggestedResponses: parsed.suggestedResponses || [],
          sources: sources.slice(0, 3), // Include top 3 sources
        };
      }
    } catch {
      // If parsing fails, return a basic response
    }

    // Fallback for non-JSON responses
    return {
      responseText: aiResponse,
      sentiment: 'neutral',
      category: 'general',
      confidence: 0.5,
      shouldEscalate: false,
      sources: sources.slice(0, 3),
    };
  }

  async searchFAQ(request: FAQSearchRequest): Promise<FAQSearchResponse> {
    const filter = request.category ? { category: request.category } : undefined;
    const results = await this.searchSimilar(request.query, request.topK || 5, filter);

    return {
      results,
      totalCount: results.length,
    };
  }

  async getCollectionStats(): Promise<{ count: number; metadata: Record<string, unknown> }> {
    if (!this.collection) {
      throw new Error('RAG service not initialized');
    }

    const count = await this.collection.count();
    return {
      count,
      metadata: { name: this.collectionName },
    };
  }
}
