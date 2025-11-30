/**
 * Milvus Vector Database Client
 *
 * A wrapper around the Milvus SDK providing convenient methods
 * for vector storage, retrieval, and similarity search.
 */

import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import { logger } from './utils/logger';
import { escapeFilterValue } from './utils/sanitize';

// Default to localhost:19530 for local development
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';

/**
 * Milvus client singleton instance (lazy initialization)
 */
let _milvusClient: MilvusClient | null = null;

/**
 * Get the Milvus client instance (lazy initialization)
 */
export function getMilvusClient(): MilvusClient {
  if (!_milvusClient) {
    _milvusClient = new MilvusClient({
      address: MILVUS_ADDRESS,
    });
  }
  return _milvusClient;
}

/**
 * Collection configuration
 */
export interface CollectionConfig {
  name: string;
  dimension: number;
  metricType?: 'COSINE' | 'L2' | 'IP';
  description?: string;
}

/**
 * Default embedding dimension for OpenAI ada-002
 */
export const OPENAI_ADA_002_DIMENSION = 1536;

/**
 * Default embedding dimension for OpenAI text-embedding-3-small
 */
export const OPENAI_EMBEDDING_3_SMALL_DIMENSION = 1536;

/**
 * Check if a collection exists
 */
export async function collectionExists(collectionName: string): Promise<boolean> {
  try {
    const response = await getMilvusClient().hasCollection({
      collection_name: collectionName,
    });
    return Boolean(response.value);
  } catch (error) {
    logger.error(`Error checking collection existence: ${error}`);
    throw error;
  }
}

/**
 * Create a collection with the specified configuration
 */
export async function createCollection(config: CollectionConfig): Promise<void> {
  const { name, dimension, metricType = 'COSINE', description = '' } = config;

  try {
    const exists = await collectionExists(name);
    if (exists) {
      logger.info(`Collection ${name} already exists`);
      return;
    }

    await getMilvusClient().createCollection({
      collection_name: name,
      description,
      fields: [
        {
          name: 'id',
          data_type: DataType.VarChar,
          is_primary_key: true,
          max_length: 128,
        },
        {
          name: 'vector',
          data_type: DataType.FloatVector,
          dim: dimension,
        },
        {
          name: 'metadata',
          data_type: DataType.JSON,
        },
        {
          name: 'text',
          data_type: DataType.VarChar,
          max_length: 65535,
        },
        {
          name: 'created_at',
          data_type: DataType.Int64,
        },
      ],
    });

    // Create index for efficient similarity search
    await getMilvusClient().createIndex({
      collection_name: name,
      field_name: 'vector',
      index_type: 'IVF_FLAT',
      metric_type: metricType,
      params: { nlist: 1024 },
    });

    // Load collection into memory
    await getMilvusClient().loadCollection({
      collection_name: name,
    });

    logger.info(`Collection ${name} created successfully`);
  } catch (error) {
    logger.error(`Error creating collection ${name}: ${error}`);
    throw error;
  }
}

/**
 * Ensure a collection exists with the specified configuration
 */
export async function ensureCollection(
  collectionName: string,
  dimension: number = OPENAI_ADA_002_DIMENSION
): Promise<string> {
  const exists = await collectionExists(collectionName);
  if (!exists) {
    await createCollection({
      name: collectionName,
      dimension,
      metricType: 'COSINE',
    });
  } else {
    // Ensure collection is loaded
    try {
      await getMilvusClient().loadCollection({
        collection_name: collectionName,
      });
    } catch {
      // Collection may already be loaded
    }
  }
  return collectionName;
}

/**
 * Insert vectors with associated metadata
 */
export interface VectorRecord {
  id: string;
  vector: number[];
  text: string;
  metadata: Record<string, unknown>;
}

export async function insertVectors(
  collectionName: string,
  records: VectorRecord[]
): Promise<{ insertCount: number }> {
  try {
    const data = records.map((record) => ({
      id: record.id,
      vector: record.vector,
      text: record.text,
      metadata: record.metadata,
      created_at: Date.now(),
    }));

    const result = await getMilvusClient().insert({
      collection_name: collectionName,
      data,
    });

    const insertCount = Number(result.insert_cnt) || 0;
    logger.info(`Inserted ${insertCount} vectors into ${collectionName}`);
    return { insertCount };
  } catch (error) {
    logger.error(`Error inserting vectors: ${error}`);
    throw error;
  }
}

/**
 * Search result interface
 */
export interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
}

/**
 * Search for similar vectors
 */
export async function searchSimilar(
  collectionName: string,
  queryVector: number[],
  topK: number = 10,
  filter?: string
): Promise<SearchResult[]> {
  try {
    const searchParams: {
      collection_name: string;
      data: number[][];
      limit: number;
      output_fields: string[];
      filter?: string;
    } = {
      collection_name: collectionName,
      data: [queryVector],
      limit: topK,
      output_fields: ['id', 'text', 'metadata', 'created_at'],
    };

    if (filter) {
      searchParams.filter = filter;
    }

    const result = await getMilvusClient().search(searchParams);

    return result.results.map((item) => ({
      id: String(item.id),
      score: item.score,
      text: String(item.text || ''),
      metadata: (item.metadata as Record<string, unknown>) || {},
    }));
  } catch (error) {
    logger.error(`Error searching vectors: ${error}`);
    throw error;
  }
}

/**
 * Delete vectors by IDs
 */
export async function deleteVectors(
  collectionName: string,
  ids: string[]
): Promise<void> {
  try {
    await getMilvusClient().delete({
      collection_name: collectionName,
      filter: `id in [${ids.map((id) => `"${escapeFilterValue(id)}"`).join(',')}]`,
    });
    logger.info(`Deleted ${ids.length} vectors from ${collectionName}`);
  } catch (error) {
    logger.error(`Error deleting vectors: ${error}`);
    throw error;
  }
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(collectionName: string): Promise<{
  rowCount: number;
}> {
  try {
    const stats = await getMilvusClient().getCollectionStatistics({
      collection_name: collectionName,
    });

    const rowCountStat = stats.stats.find((s) => s.key === 'row_count');
    const rowCount = parseInt(String(rowCountStat?.value || '0'), 10);

    return { rowCount };
  } catch (error) {
    logger.error(`Error getting collection stats: ${error}`);
    throw error;
  }
}

/**
 * Drop a collection
 */
export async function dropCollection(collectionName: string): Promise<void> {
  try {
    const exists = await collectionExists(collectionName);
    if (!exists) {
      logger.info(`Collection ${collectionName} does not exist`);
      return;
    }

    await getMilvusClient().dropCollection({
      collection_name: collectionName,
    });
    logger.info(`Collection ${collectionName} dropped successfully`);
  } catch (error) {
    logger.error(`Error dropping collection: ${error}`);
    throw error;
  }
}

/**
 * List all collections
 */
export async function listCollections(): Promise<string[]> {
  try {
    const result = await getMilvusClient().listCollections();
    return result.data.map((col) => col.name);
  } catch (error) {
    logger.error(`Error listing collections: ${error}`);
    throw error;
  }
}

/**
 * Health check for Milvus connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await getMilvusClient().listCollections();
    return true;
  } catch {
    return false;
  }
}
