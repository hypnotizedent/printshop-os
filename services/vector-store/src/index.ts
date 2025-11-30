/**
 * PrintShop OS Vector Store Service
 *
 * Milvus-based vector database service for AI-powered features:
 * - Semantic search across designs, customers, orders
 * - RAG (Retrieval-Augmented Generation) for chatbot context
 * - Design similarity matching
 * - Customer intelligence
 *
 * @example
 * ```typescript
 * import { initAllCollections, findSimilarDesigns, retrieveRAGContext } from '@mintprints/vector-store';
 *
 * // Initialize collections
 * await initAllCollections();
 *
 * // Find similar designs
 * const similar = await findSimilarDesigns('Blue t-shirt with company logo');
 *
 * // Get RAG context for chatbot
 * const context = await retrieveRAGContext('What are your rush order fees?');
 * ```
 */

import { logger } from './utils/logger';
import {
  initDesignsCollection,
  initCustomersCollection,
  initOrdersCollection,
  initKnowledgeBaseCollection,
} from './collections';
import { healthCheck } from './client';

// Re-export client functions
export * from './client';

// Re-export collection functions
export * from './collections';

// Re-export embedding functions
export * from './embeddings';

// Re-export search functions
export * from './search';

/**
 * Initialize all collections
 */
export async function initAllCollections(): Promise<void> {
  logger.info('Initializing all Milvus collections...');

  await initDesignsCollection();
  await initCustomersCollection();
  await initOrdersCollection();
  await initKnowledgeBaseCollection();

  logger.info('All collections initialized successfully');
}

/**
 * Check if Milvus is healthy
 */
export async function checkHealth(): Promise<{
  healthy: boolean;
  message: string;
}> {
  const isHealthy = await healthCheck();
  return {
    healthy: isHealthy,
    message: isHealthy ? 'Milvus is connected and healthy' : 'Milvus connection failed',
  };
}

// Export logger for external use
export { logger };
