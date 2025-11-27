/**
 * Knowledge Base Collection
 *
 * Store and search document embeddings for RAG (Retrieval-Augmented Generation).
 * Use cases:
 * - Customer service chatbot context retrieval
 * - FAQ and policy lookups
 * - SOP search and retrieval
 * - Email history context
 */

import { randomUUID } from 'crypto';
import {
  ensureCollection,
  insertVectors,
  searchSimilar,
  deleteVectors,
  getCollectionStats,
  OPENAI_ADA_002_DIMENSION,
  type VectorRecord,
  type SearchResult,
} from '../client';
import { generateEmbedding } from '../embeddings/openai';
import { logger } from '../utils/logger';

export const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';

/**
 * Knowledge base document categories
 */
export type DocumentCategory =
  | 'general'
  | 'operational'
  | 'technical'
  | 'case_studies'
  | 'email_history'
  | 'sop'
  | 'faq'
  | 'policy';

/**
 * Knowledge base document metadata
 */
export interface DocumentMetadata {
  documentId: string;
  title: string;
  category: DocumentCategory;
  source?: string;
  filePath?: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  version?: string;
}

/**
 * Initialize the knowledge base collection
 */
export async function initKnowledgeBaseCollection(): Promise<void> {
  await ensureCollection(KNOWLEDGE_BASE_COLLECTION, OPENAI_ADA_002_DIMENSION);
  logger.info('Knowledge base collection initialized');
}

/**
 * Generate a unique ID for a document chunk
 */
function generateChunkId(): string {
  return `kb_${randomUUID().replace(/-/g, '')}`;
}

/**
 * Split text into chunks for embedding
 */
function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Index a document (automatically chunks long documents)
 */
export async function indexDocument(
  content: string,
  metadata: DocumentMetadata,
  chunkSize: number = 1000
): Promise<string[]> {
  const chunks = chunkText(content, chunkSize);
  const ids: string[] = [];

  const records: VectorRecord[] = await Promise.all(
    chunks.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk);
      const id = generateChunkId();
      ids.push(id);

      return {
        id,
        vector: embedding,
        text: chunk,
        metadata: {
          ...metadata,
          chunkIndex: index,
          totalChunks: chunks.length,
        } as unknown as Record<string, unknown>,
      };
    })
  );

  await insertVectors(KNOWLEDGE_BASE_COLLECTION, records);
  logger.info(
    `Indexed document: ${metadata.documentId} (${chunks.length} chunks)`
  );
  return ids;
}

/**
 * Batch index multiple documents
 */
export async function batchIndexDocuments(
  documents: Array<{
    content: string;
    metadata: DocumentMetadata;
  }>,
  chunkSize: number = 1000
): Promise<string[][]> {
  const allIds: string[][] = [];

  for (const { content, metadata } of documents) {
    const ids = await indexDocument(content, metadata, chunkSize);
    allIds.push(ids);
  }

  return allIds;
}

/**
 * Search the knowledge base
 */
export async function searchKnowledgeBase(
  query: string,
  limit: number = 5,
  category?: DocumentCategory
): Promise<SearchResult[]> {
  const queryVector = await generateEmbedding(query);

  const filter = category
    ? `metadata["category"] == "${category}"`
    : undefined;

  return searchSimilar(KNOWLEDGE_BASE_COLLECTION, queryVector, limit, filter);
}

/**
 * Search with multiple queries and deduplicate results
 */
export async function multiQuerySearch(
  queries: string[],
  limit: number = 5,
  category?: DocumentCategory
): Promise<SearchResult[]> {
  const allResults: SearchResult[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    const results = await searchKnowledgeBase(query, limit, category);
    for (const result of results) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id);
        allResults.push(result);
      }
    }
  }

  // Sort by score and return top results
  return allResults
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get context for RAG
 */
export async function getRAGContext(
  query: string,
  limit: number = 3,
  category?: DocumentCategory
): Promise<string> {
  const results = await searchKnowledgeBase(query, limit, category);

  if (results.length === 0) {
    return '';
  }

  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.text}\n(Source: ${(r.metadata as unknown as DocumentMetadata).title || 'Unknown'})`
    )
    .join('\n\n');
}

/**
 * Remove a document and all its chunks
 */
export async function removeDocument(documentId: string): Promise<void> {
  // Note: This requires querying for all chunks with this documentId
  // In production, you might want to store chunk IDs separately
  logger.warn(
    `Remove document ${documentId}: Full implementation requires chunk tracking`
  );
}

/**
 * Remove specific chunks by IDs
 */
export async function removeChunks(chunkIds: string[]): Promise<void> {
  await deleteVectors(KNOWLEDGE_BASE_COLLECTION, chunkIds);
  logger.info(`Removed ${chunkIds.length} chunks from knowledge base`);
}

/**
 * Get knowledge base statistics
 */
export async function getKnowledgeBaseStats(): Promise<{ count: number }> {
  const stats = await getCollectionStats(KNOWLEDGE_BASE_COLLECTION);
  return { count: stats.rowCount };
}
