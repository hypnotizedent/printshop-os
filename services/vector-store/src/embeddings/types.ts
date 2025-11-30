/**
 * Embedding Types
 */

/**
 * Supported embedding models
 */
export type EmbeddingModel =
  | 'text-embedding-ada-002'
  | 'text-embedding-3-small'
  | 'text-embedding-3-large';

/**
 * Embedding result
 */
export interface EmbeddingResult {
  embedding: number[];
  model: EmbeddingModel;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  embeddings: number[][];
  model: EmbeddingModel;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Embedding provider interface
 */
export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  getDimension(): number;
  getModel(): EmbeddingModel;
}
