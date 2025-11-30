/**
 * Similarity Search Functions
 *
 * High-level functions for semantic similarity search across collections.
 */

import { searchSimilar, type SearchResult } from '../client';
import { generateEmbedding } from '../embeddings/openai';
import { logger } from '../utils/logger';
import {
  DESIGNS_COLLECTION,
  CUSTOMERS_COLLECTION,
  ORDERS_COLLECTION,
  KNOWLEDGE_BASE_COLLECTION,
} from '../collections';

/**
 * Search target options
 */
export type SearchTarget =
  | 'all'
  | 'designs'
  | 'customers'
  | 'orders'
  | 'knowledge_base';

/**
 * Unified search result with source
 */
export interface UnifiedSearchResult extends SearchResult {
  source: SearchTarget;
}

/**
 * Search options
 */
export interface SearchOptions {
  targets?: SearchTarget[];
  limit?: number;
  filter?: string;
  minScore?: number;
}

/**
 * Get collection name for search target
 */
function getCollectionName(target: SearchTarget): string | null {
  switch (target) {
    case 'designs':
      return DESIGNS_COLLECTION;
    case 'customers':
      return CUSTOMERS_COLLECTION;
    case 'orders':
      return ORDERS_COLLECTION;
    case 'knowledge_base':
      return KNOWLEDGE_BASE_COLLECTION;
    default:
      return null;
  }
}

/**
 * Unified semantic search across multiple collections
 */
export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<UnifiedSearchResult[]> {
  const {
    targets = ['all'],
    limit = 10,
    minScore = 0.0,
  } = options;

  // Determine which collections to search
  const collectionsToSearch: SearchTarget[] =
    targets.includes('all')
      ? ['designs', 'customers', 'orders', 'knowledge_base']
      : targets;

  // Generate embedding for query
  const queryVector = await generateEmbedding(query);

  // Search all target collections in parallel
  const searchPromises = collectionsToSearch.map(async (target) => {
    const collectionName = getCollectionName(target);
    if (!collectionName) return [];

    try {
      const results = await searchSimilar(
        collectionName,
        queryVector,
        limit,
        options.filter
      );

      return results.map((result) => ({
        ...result,
        source: target,
      }));
    } catch (error) {
      logger.warn(`Error searching ${target}: ${error}`);
      return [];
    }
  });

  const allResults = await Promise.all(searchPromises);
  const flatResults = allResults.flat();

  // Filter by minimum score
  const filtered = flatResults.filter((r) => r.score >= minScore);

  // Sort by score and limit
  return filtered.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Find similar items to a given text
 */
export async function findSimilar(
  text: string,
  target: SearchTarget,
  limit: number = 10
): Promise<SearchResult[]> {
  const collectionName = getCollectionName(target);
  if (!collectionName) {
    throw new Error(`Invalid search target: ${target}`);
  }

  const queryVector = await generateEmbedding(text);
  return searchSimilar(collectionName, queryVector, limit);
}

/**
 * Hybrid search combining semantic and keyword matching
 * Note: Milvus supports hybrid search, but this is a simplified version
 */
export async function hybridSearch(
  query: string,
  target: SearchTarget,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 10 } = options;

  // For now, just do semantic search
  // In production, you could combine with a keyword filter
  return findSimilar(query, target, limit);
}

/**
 * Search with reranking (useful for RAG)
 */
export async function searchWithRerank(
  query: string,
  target: SearchTarget,
  options: { limit?: number; candidateMultiplier?: number } = {}
): Promise<SearchResult[]> {
  const { limit = 5, candidateMultiplier = 3 } = options;

  // Get more candidates than needed
  const candidates = await findSimilar(
    query,
    target,
    limit * candidateMultiplier
  );

  // In production, you would rerank using a cross-encoder model
  // For now, just return top results
  return candidates.slice(0, limit);
}

/**
 * Multi-query search with result fusion
 */
export async function multiQueryFusionSearch(
  queries: string[],
  target: SearchTarget,
  limit: number = 10
): Promise<SearchResult[]> {
  const collectionName = getCollectionName(target);
  if (!collectionName) {
    throw new Error(`Invalid search target: ${target}`);
  }

  // Search with each query
  const allResults: SearchResult[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    const queryVector = await generateEmbedding(query);
    const results = await searchSimilar(collectionName, queryVector, limit);

    for (const result of results) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id);
        allResults.push(result);
      }
    }
  }

  // Sort by highest score and limit
  return allResults.sort((a, b) => b.score - a.score).slice(0, limit);
}
