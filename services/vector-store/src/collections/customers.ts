/**
 * Customers Collection
 *
 * Store and search customer profile embeddings for intelligent insights.
 * Use cases:
 * - Find customers with similar profiles/needs
 * - Customer segmentation
 * - Upsell/cross-sell recommendations
 * - At-risk customer identification
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
import { generateEmbedding, generateBatchEmbeddings } from '../embeddings/openai';
import { logger } from '../utils/logger';
import { escapeFilterValue } from '../utils/sanitize';

export const CUSTOMERS_COLLECTION = 'customers';

/**
 * Customer metadata structure
 */
export interface CustomerMetadata {
  customerId: string;
  name: string;
  email?: string;
  company?: string;
  totalOrders?: number;
  lifetimeValue?: number;
  lastOrderDate?: string;
  preferredProducts?: string[];
  tags?: string[];
  segment?: 'vip' | 'regular' | 'new' | 'at-risk' | 'churned';
}

/**
 * Initialize the customers collection
 */
export async function initCustomersCollection(): Promise<void> {
  await ensureCollection(CUSTOMERS_COLLECTION, OPENAI_ADA_002_DIMENSION);
  logger.info('Customers collection initialized');
}

/**
 * Generate a unique ID for a customer record
 */
function generateRecordId(): string {
  return `cust_${randomUUID().replace(/-/g, '')}`;
}

/**
 * Build a text profile from customer metadata for embedding
 */
function buildCustomerProfile(metadata: CustomerMetadata): string {
  const parts = [
    `Customer: ${metadata.name}`,
    metadata.company && `Company: ${metadata.company}`,
    metadata.segment && `Segment: ${metadata.segment}`,
    metadata.preferredProducts?.length &&
      `Preferred products: ${metadata.preferredProducts.join(', ')}`,
    metadata.tags?.length && `Tags: ${metadata.tags.join(', ')}`,
    metadata.totalOrders && `Total orders: ${metadata.totalOrders}`,
    metadata.lifetimeValue &&
      `Lifetime value: $${metadata.lifetimeValue.toFixed(2)}`,
  ];

  return parts.filter(Boolean).join('. ');
}

/**
 * Index a customer profile
 */
export async function indexCustomer(
  metadata: CustomerMetadata,
  additionalContext?: string
): Promise<string> {
  const profile = buildCustomerProfile(metadata);
  const text = additionalContext ? `${profile}. ${additionalContext}` : profile;
  const embedding = await generateEmbedding(text);
  const id = generateRecordId();

  const record: VectorRecord = {
    id,
    vector: embedding,
    text,
    metadata: metadata as unknown as Record<string, unknown>,
  };

  await insertVectors(CUSTOMERS_COLLECTION, [record]);
  logger.info(`Indexed customer: ${id} (${metadata.customerId})`);
  return id;
}

/**
 * Batch index multiple customers
 */
export async function batchIndexCustomers(
  customers: Array<{
    metadata: CustomerMetadata;
    additionalContext?: string;
  }>
): Promise<string[]> {
  const texts = customers.map(({ metadata, additionalContext }) => {
    const profile = buildCustomerProfile(metadata);
    return additionalContext ? `${profile}. ${additionalContext}` : profile;
  });

  const embeddings = await generateBatchEmbeddings(texts);

  const records: VectorRecord[] = customers.map(({ metadata }, index) => ({
    id: generateRecordId(),
    vector: embeddings[index],
    text: texts[index],
    metadata: metadata as unknown as Record<string, unknown>,
  }));

  await insertVectors(CUSTOMERS_COLLECTION, records);
  logger.info(`Batch indexed ${records.length} customers`);
  return records.map((r) => r.id);
}

/**
 * Find similar customers by description or query
 */
export async function findSimilarCustomers(
  query: string,
  limit: number = 10,
  segment?: string
): Promise<SearchResult[]> {
  const queryVector = await generateEmbedding(query);

  const filter = segment
    ? `metadata["segment"] == "${escapeFilterValue(segment)}"`
    : undefined;

  return searchSimilar(CUSTOMERS_COLLECTION, queryVector, limit, filter);
}

/**
 * Find customers similar to a given customer profile
 */
export async function findCustomersLike(
  metadata: CustomerMetadata,
  limit: number = 10
): Promise<SearchResult[]> {
  const profile = buildCustomerProfile(metadata);
  return findSimilarCustomers(profile, limit);
}

/**
 * Remove a customer from the index
 */
export async function removeCustomer(customerRecordId: string): Promise<void> {
  await deleteVectors(CUSTOMERS_COLLECTION, [customerRecordId]);
  logger.info(`Removed customer: ${customerRecordId}`);
}

/**
 * Get customer collection statistics
 */
export async function getCustomersStats(): Promise<{ count: number }> {
  const stats = await getCollectionStats(CUSTOMERS_COLLECTION);
  return { count: stats.rowCount };
}
