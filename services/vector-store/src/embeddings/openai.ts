/**
 * OpenAI Embedding Generator
 *
 * Generate embeddings using OpenAI's embedding models.
 * Default model: text-embedding-ada-002 (1536 dimensions)
 */

import OpenAI from 'openai';
import { logger } from '../utils/logger';
import type { EmbeddingModel, EmbeddingProvider } from './types';

// Lazy initialization of OpenAI client
let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required for embedding generation'
      );
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

/**
 * Model dimension mapping
 */
const MODEL_DIMENSIONS: Record<EmbeddingModel, number> = {
  'text-embedding-ada-002': 1536,
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
};

/**
 * Default embedding model
 */
const DEFAULT_MODEL: EmbeddingModel =
  (process.env.OPENAI_EMBEDDING_MODEL as EmbeddingModel) ||
  'text-embedding-ada-002';

/**
 * Generate a single embedding
 */
export async function generateEmbedding(
  text: string,
  model: EmbeddingModel = DEFAULT_MODEL
): Promise<number[]> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error(`Error generating embedding: ${error}`);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in a single API call
 */
export async function generateBatchEmbeddings(
  texts: string[],
  model: EmbeddingModel = DEFAULT_MODEL
): Promise<number[][]> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model,
      input: texts,
    });

    // Sort by index to ensure correct order
    const sorted = response.data.sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
  } catch (error) {
    logger.error(`Error generating batch embeddings: ${error}`);
    throw error;
  }
}

/**
 * Get the dimension for a model
 */
export function getModelDimension(model: EmbeddingModel = DEFAULT_MODEL): number {
  return MODEL_DIMENSIONS[model];
}

/**
 * OpenAI Embedding Provider class
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private model: EmbeddingModel;

  constructor(model: EmbeddingModel = DEFAULT_MODEL) {
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return generateEmbedding(text, this.model);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return generateBatchEmbeddings(texts, this.model);
  }

  getDimension(): number {
    return MODEL_DIMENSIONS[this.model];
  }

  getModel(): EmbeddingModel {
    return this.model;
  }
}

/**
 * Default provider instance (lazy initialization)
 */
let _defaultProvider: OpenAIEmbeddingProvider | null = null;

export function getDefaultEmbeddingProvider(): OpenAIEmbeddingProvider {
  if (!_defaultProvider) {
    _defaultProvider = new OpenAIEmbeddingProvider();
  }
  return _defaultProvider;
}
