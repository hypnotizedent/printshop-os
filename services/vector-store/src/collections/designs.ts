/**
 * Designs Collection
 *
 * Store and search design/mockup embeddings for similarity matching.
 * Use cases:
 * - Find similar past mockups when uploading a new design
 * - Design recommendation based on customer history
 * - Duplicate detection
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

export const DESIGNS_COLLECTION = 'designs';

/**
 * Design metadata structure
 */
export interface DesignMetadata {
  designId: string;
  customerId?: string;
  orderId?: string;
  name: string;
  type: 'screen-print' | 'embroidery' | 'dtg' | 'dtf' | 'vinyl' | 'other';
  colorCount?: number;
  locations?: string[];
  imageUrl?: string;
  createdAt: string;
  tags?: string[];
}

/**
 * Initialize the designs collection
 */
export async function initDesignsCollection(): Promise<void> {
  await ensureCollection(DESIGNS_COLLECTION, OPENAI_ADA_002_DIMENSION);
  logger.info('Designs collection initialized');
}

/**
 * Generate a unique ID for a design record
 */
function generateDesignId(): string {
  return `design_${randomUUID().replace(/-/g, '')}`;
}

/**
 * Index a new design with its embedding
 */
export async function indexDesign(
  description: string,
  metadata: DesignMetadata
): Promise<string> {
  const embedding = await generateEmbedding(description);
  const id = generateDesignId();

  const record: VectorRecord = {
    id,
    vector: embedding,
    text: description,
    metadata: metadata as unknown as Record<string, unknown>,
  };

  await insertVectors(DESIGNS_COLLECTION, [record]);
  logger.info(`Indexed design: ${id}`);
  return id;
}

/**
 * Batch index multiple designs
 */
export async function batchIndexDesigns(
  designs: Array<{ description: string; metadata: DesignMetadata }>
): Promise<string[]> {
  const records: VectorRecord[] = await Promise.all(
    designs.map(async ({ description, metadata }) => {
      const embedding = await generateEmbedding(description);
      return {
        id: generateDesignId(),
        vector: embedding,
        text: description,
        metadata: metadata as unknown as Record<string, unknown>,
      };
    })
  );

  await insertVectors(DESIGNS_COLLECTION, records);
  logger.info(`Batch indexed ${records.length} designs`);
  return records.map((r) => r.id);
}

/**
 * Find similar designs by text description
 */
export async function findSimilarDesigns(
  description: string,
  limit: number = 10,
  customerId?: string
): Promise<SearchResult[]> {
  const queryVector = await generateEmbedding(description);

  // Optional filter by customer
  const filter = customerId
    ? `metadata["customerId"] == "${customerId}"`
    : undefined;

  return searchSimilar(DESIGNS_COLLECTION, queryVector, limit, filter);
}

/**
 * Find similar designs by image embedding (pre-computed)
 */
export async function findSimilarDesignsByVector(
  vector: number[],
  limit: number = 10,
  filter?: string
): Promise<SearchResult[]> {
  return searchSimilar(DESIGNS_COLLECTION, vector, limit, filter);
}

/**
 * Remove a design from the index
 */
export async function removeDesign(designRecordId: string): Promise<void> {
  await deleteVectors(DESIGNS_COLLECTION, [designRecordId]);
  logger.info(`Removed design: ${designRecordId}`);
}

/**
 * Get design collection statistics
 */
export async function getDesignsStats(): Promise<{ count: number }> {
  const stats = await getCollectionStats(DESIGNS_COLLECTION);
  return { count: stats.rowCount };
}
