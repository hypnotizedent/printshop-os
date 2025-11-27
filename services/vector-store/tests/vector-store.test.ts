/**
 * Vector Store Service Tests
 *
 * Unit tests for the vector store constants and utilities.
 * Full integration tests require a running Milvus instance and OpenAI API key.
 */

import { describe, it, expect } from '@jest/globals';

describe('Vector Store Constants', () => {
  describe('OPENAI_ADA_002_DIMENSION', () => {
    it('should be 1536', async () => {
      const { OPENAI_ADA_002_DIMENSION } = await import('../src/client');
      expect(OPENAI_ADA_002_DIMENSION).toBe(1536);
    });
  });

  describe('OPENAI_EMBEDDING_3_SMALL_DIMENSION', () => {
    it('should be 1536', async () => {
      const { OPENAI_EMBEDDING_3_SMALL_DIMENSION } = await import('../src/client');
      expect(OPENAI_EMBEDDING_3_SMALL_DIMENSION).toBe(1536);
    });
  });
});

describe('Embedding Types', () => {
  it('should have correct model dimensions', async () => {
    const { getModelDimension } = await import('../src/embeddings/openai');
    expect(getModelDimension('text-embedding-ada-002')).toBe(1536);
    expect(getModelDimension('text-embedding-3-small')).toBe(1536);
    expect(getModelDimension('text-embedding-3-large')).toBe(3072);
  });
});

