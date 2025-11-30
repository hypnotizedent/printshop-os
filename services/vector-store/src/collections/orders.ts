/**
 * Orders Collection
 *
 * Store and search order embeddings for pattern matching and insights.
 * Use cases:
 * - Find similar historical orders for accurate pricing
 * - Order pattern analysis
 * - Smart reorder suggestions
 * - Production time estimation
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

export const ORDERS_COLLECTION = 'orders';

/**
 * Order metadata structure
 */
export interface OrderMetadata {
  orderId: string;
  customerId: string;
  orderNumber?: string;
  totalAmount: number;
  quantity: number;
  productType: 'screen-print' | 'embroidery' | 'dtg' | 'dtf' | 'vinyl' | 'mixed';
  products?: string[];
  colorCount?: number;
  locations?: string[];
  rushOrder?: boolean;
  completedAt?: string;
  createdAt: string;
  productionTimeHours?: number;
  margin?: number;
}

/**
 * Initialize the orders collection
 */
export async function initOrdersCollection(): Promise<void> {
  await ensureCollection(ORDERS_COLLECTION, OPENAI_ADA_002_DIMENSION);
  logger.info('Orders collection initialized');
}

/**
 * Generate a unique ID for an order record
 */
function generateRecordId(): string {
  return `order_${randomUUID().replace(/-/g, '')}`;
}

/**
 * Build a text description from order metadata for embedding
 */
function buildOrderDescription(metadata: OrderMetadata): string {
  const parts = [
    `Order: ${metadata.orderNumber || metadata.orderId}`,
    `Type: ${metadata.productType}`,
    `Quantity: ${metadata.quantity}`,
    `Total: $${metadata.totalAmount.toFixed(2)}`,
    metadata.products?.length && `Products: ${metadata.products.join(', ')}`,
    metadata.colorCount && `Colors: ${metadata.colorCount}`,
    metadata.locations?.length && `Locations: ${metadata.locations.join(', ')}`,
    metadata.rushOrder && 'Rush order',
    metadata.productionTimeHours &&
      `Production time: ${metadata.productionTimeHours} hours`,
  ];

  return parts.filter(Boolean).join('. ');
}

/**
 * Index an order
 */
export async function indexOrder(
  metadata: OrderMetadata,
  additionalNotes?: string
): Promise<string> {
  const description = buildOrderDescription(metadata);
  const text = additionalNotes
    ? `${description}. Notes: ${additionalNotes}`
    : description;
  const embedding = await generateEmbedding(text);
  const id = generateRecordId();

  const record: VectorRecord = {
    id,
    vector: embedding,
    text,
    metadata: metadata as unknown as Record<string, unknown>,
  };

  await insertVectors(ORDERS_COLLECTION, [record]);
  logger.info(`Indexed order: ${id} (${metadata.orderId})`);
  return id;
}

/**
 * Batch index multiple orders
 */
export async function batchIndexOrders(
  orders: Array<{
    metadata: OrderMetadata;
    additionalNotes?: string;
  }>
): Promise<string[]> {
  const texts = orders.map(({ metadata, additionalNotes }) => {
    const description = buildOrderDescription(metadata);
    return additionalNotes ? `${description}. Notes: ${additionalNotes}` : description;
  });

  const embeddings = await generateBatchEmbeddings(texts);

  const records: VectorRecord[] = orders.map(({ metadata }, index) => ({
    id: generateRecordId(),
    vector: embeddings[index],
    text: texts[index],
    metadata: metadata as unknown as Record<string, unknown>,
  }));

  await insertVectors(ORDERS_COLLECTION, records);
  logger.info(`Batch indexed ${records.length} orders`);
  return records.map((r) => r.id);
}

/**
 * Find similar orders by description
 */
export async function findSimilarOrders(
  query: string,
  limit: number = 10,
  productType?: string
): Promise<SearchResult[]> {
  const queryVector = await generateEmbedding(query);

  const filter = productType
    ? `metadata["productType"] == "${escapeFilterValue(productType)}"`
    : undefined;

  return searchSimilar(ORDERS_COLLECTION, queryVector, limit, filter);
}

/**
 * Find orders similar to given order metadata
 */
export async function findOrdersLike(
  metadata: Partial<OrderMetadata>,
  limit: number = 10
): Promise<SearchResult[]> {
  const description = buildOrderDescription(metadata as OrderMetadata);
  return findSimilarOrders(description, limit, metadata.productType);
}

/**
 * Find orders by customer
 */
export async function findCustomerOrders(
  customerId: string,
  query?: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const filter = `metadata["customerId"] == "${escapeFilterValue(customerId)}"`;

  if (query) {
    const queryVector = await generateEmbedding(query);
    return searchSimilar(ORDERS_COLLECTION, queryVector, limit, filter);
  }

  // Without a specific query, search with a generic order query
  const genericQuery = 'order history';
  const queryVector = await generateEmbedding(genericQuery);
  return searchSimilar(ORDERS_COLLECTION, queryVector, limit, filter);
}

/**
 * Remove an order from the index
 */
export async function removeOrder(orderRecordId: string): Promise<void> {
  await deleteVectors(ORDERS_COLLECTION, [orderRecordId]);
  logger.info(`Removed order: ${orderRecordId}`);
}

/**
 * Get order collection statistics
 */
export async function getOrdersStats(): Promise<{ count: number }> {
  const stats = await getCollectionStats(ORDERS_COLLECTION);
  return { count: stats.rowCount };
}
