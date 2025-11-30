/**
 * RAG (Retrieval-Augmented Generation) Functions
 *
 * Functions for retrieving relevant context for LLM prompts.
 */

import { searchKnowledgeBase, getRAGContext } from '../collections/knowledge-base';
import { findSimilarOrders } from '../collections/orders';
import { findSimilarCustomers } from '../collections/customers';
import { findSimilarDesigns } from '../collections/designs';
import { logger } from '../utils/logger';
import type { SearchResult } from '../client';

/**
 * RAG context result
 */
export interface RAGContextResult {
  context: string;
  sources: Array<{
    id: string;
    title?: string;
    score: number;
    type: string;
  }>;
  tokenEstimate: number;
}

/**
 * RAG retrieval options
 */
export interface RAGOptions {
  maxChunks?: number;
  maxTokens?: number;
  includeOrders?: boolean;
  includeCustomers?: boolean;
  includeDesigns?: boolean;
  customerId?: string;
}

/**
 * Estimate token count (rough approximation)
 *
 * Note: This is a simple character-based estimation (1 token ≈ 4 chars).
 * For production use with strict token limits, consider using a proper
 * tokenizer library like tiktoken for accurate OpenAI token counting.
 * This approximation works well for English text but may be less accurate
 * for other languages or specialized content.
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Format search results as context
 */
function formatResults(
  results: SearchResult[],
  type: string,
  maxTokens: number
): { text: string; tokens: number; sources: RAGContextResult['sources'] } {
  let text = '';
  let tokens = 0;
  const sources: RAGContextResult['sources'] = [];

  for (const result of results) {
    const chunk = `[${type}] ${result.text}\n\n`;
    const chunkTokens = estimateTokens(chunk);

    if (tokens + chunkTokens > maxTokens) break;

    text += chunk;
    tokens += chunkTokens;
    sources.push({
      id: result.id,
      title: (result.metadata as { title?: string }).title,
      score: result.score,
      type,
    });
  }

  return { text, tokens, sources };
}

/**
 * Retrieve context for a RAG query
 */
export async function retrieveRAGContext(
  query: string,
  options: RAGOptions = {}
): Promise<RAGContextResult> {
  const {
    maxChunks = 5,
    maxTokens = 2000,
    includeOrders = false,
    includeCustomers = false,
    includeDesigns = false,
    customerId,
  } = options;

  // Execute all searches in parallel for better performance
  const [kbResults, orderResults, customerResults, designResults] = await Promise.all([
    searchKnowledgeBase(query, maxChunks).catch((error) => {
      logger.warn(`Error retrieving knowledge base: ${error}`);
      return [] as SearchResult[];
    }),
    includeOrders
      ? findSimilarOrders(query, maxChunks).catch((error) => {
          logger.warn(`Error retrieving orders: ${error}`);
          return [] as SearchResult[];
        })
      : Promise.resolve([] as SearchResult[]),
    includeCustomers
      ? findSimilarCustomers(query, maxChunks).catch((error) => {
          logger.warn(`Error retrieving customers: ${error}`);
          return [] as SearchResult[];
        })
      : Promise.resolve([] as SearchResult[]),
    includeDesigns
      ? findSimilarDesigns(query, maxChunks, customerId).catch((error) => {
          logger.warn(`Error retrieving designs: ${error}`);
          return [] as SearchResult[];
        })
      : Promise.resolve([] as SearchResult[]),
  ]);

  let context = '';
  let totalTokens = 0;
  const allSources: RAGContextResult['sources'] = [];
  const remainingTokens = () => maxTokens - totalTokens;

  // Format knowledge base results
  if (kbResults.length > 0) {
    const { text, tokens, sources } = formatResults(kbResults, 'Knowledge Base', remainingTokens());
    context += text;
    totalTokens += tokens;
    allSources.push(...sources);
  }

  // Format order results
  if (orderResults.length > 0 && remainingTokens() > 0) {
    const { text, tokens, sources } = formatResults(orderResults, 'Order History', remainingTokens());
    context += text;
    totalTokens += tokens;
    allSources.push(...sources);
  }

  // Format customer results
  if (customerResults.length > 0 && remainingTokens() > 0) {
    const { text, tokens, sources } = formatResults(customerResults, 'Customer Info', remainingTokens());
    context += text;
    totalTokens += tokens;
    allSources.push(...sources);
  }

  // Format design results
  if (designResults.length > 0 && remainingTokens() > 0) {
    const { text, tokens, sources } = formatResults(designResults, 'Design', remainingTokens());
    context += text;
    totalTokens += tokens;
    allSources.push(...sources);
  }

  return {
    context: context.trim(),
    sources: allSources,
    tokenEstimate: totalTokens,
  };
}

/**
 * Build a RAG prompt with context
 */
export async function buildRAGPrompt(
  userQuery: string,
  systemPrompt: string,
  options: RAGOptions = {}
): Promise<{
  prompt: string;
  context: RAGContextResult;
}> {
  const context = await retrieveRAGContext(userQuery, options);

  const prompt = `${systemPrompt}

## Relevant Context

${context.context}

## User Query

${userQuery}

Please answer the user's query based on the context provided above. If the context doesn't contain relevant information, say so.`;

  return { prompt, context };
}

/**
 * Simple RAG query using just knowledge base
 */
export async function simpleRAGQuery(
  query: string,
  maxChunks: number = 3
): Promise<string> {
  return getRAGContext(query, maxChunks);
}

/**
 * Customer-specific RAG context
 */
export async function getCustomerRAGContext(
  query: string,
  customerId: string,
  options: RAGOptions = {}
): Promise<RAGContextResult> {
  return retrieveRAGContext(query, {
    ...options,
    includeOrders: true,
    includeCustomers: true,
    customerId,
  });
}

/**
 * Quote generation RAG context
 */
export async function getQuoteRAGContext(
  query: string,
  options: RAGOptions = {}
): Promise<RAGContextResult> {
  return retrieveRAGContext(query, {
    ...options,
    includeOrders: true,
    includeDesigns: true,
  });
}
