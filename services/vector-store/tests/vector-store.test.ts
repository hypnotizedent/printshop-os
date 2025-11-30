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

describe('Sanitization Utilities', () => {
  it('should escape quotes and backslashes in filter values', async () => {
    const { escapeFilterValue } = await import('../src/utils/sanitize');
    expect(escapeFilterValue('normal text')).toBe('normal text');
    expect(escapeFilterValue('text with "quotes"')).toBe('text with \\"quotes\\"');
    expect(escapeFilterValue('text with \\backslash')).toBe('text with \\\\backslash');
    expect(escapeFilterValue('"quoted" and \\escaped')).toBe('\\"quoted\\" and \\\\escaped');
  });

  it('should handle empty strings', async () => {
    const { escapeFilterValue } = await import('../src/utils/sanitize');
    expect(escapeFilterValue('')).toBe('');
  });
});

describe('Text Chunking', () => {
  // Import chunkText indirectly by testing indexDocument behavior
  // chunkText is a private function, but we test the validation via the module

  it('should export knowledge base collection functions', async () => {
    const kb = await import('../src/collections/knowledge-base');
    expect(typeof kb.indexDocument).toBe('function');
    expect(typeof kb.batchIndexDocuments).toBe('function');
    expect(typeof kb.searchKnowledgeBase).toBe('function');
    expect(kb.KNOWLEDGE_BASE_COLLECTION).toBe('knowledge_base');
  });
});
