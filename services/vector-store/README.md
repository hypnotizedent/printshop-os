# Vector Store Service

Milvus-based vector database service for PrintShop OS AI-powered features.

## Overview

This service provides:
- **Semantic Search**: Find similar designs, customers, and orders using natural language
- **RAG Support**: Retrieve relevant context for LLM-powered features
- **Design Similarity**: Match uploaded designs with historical mockups
- **Customer Intelligence**: Find similar customer profiles for insights

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│   OpenAI    │────▶│ Vector Store │────▶│  Milvus  │
│ Embeddings  │     │   Service    │     │    DB    │
└─────────────┘     └──────────────┘     └──────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Collections  │
                    │ - designs    │
                    │ - customers  │
                    │ - orders     │
                    │ - knowledge  │
                    └──────────────┘
```

## Quick Start

### 1. Start Milvus Stack

```bash
# From project root
docker-compose -f docker-compose.ai.yml up -d etcd milvus-minio milvus attu
```

### 2. Install Dependencies

```bash
cd services/vector-store
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

### 4. Initialize Collections

```bash
npm run init:collections
```

### 5. Access Attu UI

Open http://localhost:8001 to manage collections visually.

## Collections

### designs
Store and search design/mockup embeddings.

```typescript
import { indexDesign, findSimilarDesigns } from '@mintprints/vector-store';

// Index a design
await indexDesign('Blue company logo on black t-shirt', {
  designId: 'D123',
  name: 'ACME Logo Print',
  type: 'screen-print',
  colorCount: 2,
});

// Find similar designs
const similar = await findSimilarDesigns('Logo on dark shirt', 5);
```

### customers
Store customer profile embeddings for segmentation and insights.

```typescript
import { indexCustomer, findSimilarCustomers } from '@mintprints/vector-store';

// Index a customer
await indexCustomer({
  customerId: 'C456',
  name: 'ACME Corp',
  company: 'ACME Corporation',
  segment: 'vip',
  preferredProducts: ['screen-print', 'embroidery'],
});

// Find similar customers
const similar = await findSimilarCustomers('Corporate clients needing uniforms');
```

### orders
Store order embeddings for pattern matching and pricing intelligence.

```typescript
import { indexOrder, findSimilarOrders } from '@mintprints/vector-store';

// Index an order
await indexOrder({
  orderId: 'O789',
  customerId: 'C456',
  totalAmount: 1500,
  quantity: 200,
  productType: 'screen-print',
  colorCount: 3,
});

// Find similar orders for pricing
const similar = await findSimilarOrders('200 shirts 3 colors', 10, 'screen-print');
```

### knowledge_base
Store document embeddings for RAG (chatbot context retrieval).

```typescript
import { indexDocument, searchKnowledgeBase } from '@mintprints/vector-store';

// Index a document
await indexDocument(
  'Rush orders incur a 25% surcharge and require 48-hour minimum lead time.',
  {
    documentId: 'DOC001',
    title: 'Rush Order Policy',
    category: 'policy',
  }
);

// Search for context
const results = await searchKnowledgeBase('What are rush order fees?');
```

## RAG Integration

Use the RAG functions to power your LLM applications:

```typescript
import { retrieveRAGContext, buildRAGPrompt } from '@mintprints/vector-store';

// Get context for a query
const context = await retrieveRAGContext('What are your embroidery options?', {
  maxChunks: 5,
  maxTokens: 2000,
  includeOrders: true,
});

console.log(context.context);
console.log(`Estimated tokens: ${context.tokenEstimate}`);

// Build a complete prompt
const { prompt, context: ctx } = await buildRAGPrompt(
  'What are your embroidery options?',
  'You are a helpful customer service agent for a print shop.',
);
```

## API Reference

### Client Functions

| Function | Description |
|----------|-------------|
| `ensureCollection(name, dim)` | Create collection if not exists |
| `insertVectors(collection, records)` | Insert vectors with metadata |
| `searchSimilar(collection, vector, topK)` | Vector similarity search |
| `deleteVectors(collection, ids)` | Delete vectors by ID |
| `getCollectionStats(collection)` | Get collection statistics |
| `healthCheck()` | Check Milvus connection |

### Embedding Functions

| Function | Description |
|----------|-------------|
| `generateEmbedding(text)` | Generate single embedding |
| `generateBatchEmbeddings(texts)` | Generate batch embeddings |

### Search Functions

| Function | Description |
|----------|-------------|
| `semanticSearch(query, options)` | Search across collections |
| `findSimilar(text, target, limit)` | Find similar in collection |
| `multiQueryFusionSearch(queries, target)` | Multi-query search |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MILVUS_ADDRESS` | `localhost:19530` | Milvus server address |
| `OPENAI_API_KEY` | (required) | OpenAI API key for embeddings |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-ada-002` | Embedding model to use |
| `LOG_LEVEL` | `info` | Logging level |

## Development

```bash
# Run tests
npm test

# Build
npm run build

# Lint
npm run lint

# Format
npm run format
```

## Ports

| Service | Port | Purpose |
|---------|------|---------|
| Milvus | 19530 | gRPC API |
| Milvus Metrics | 9091 | Health/metrics |
| Attu | 8001 | Web UI |
| etcd | 2379 | Milvus metadata |
| MinIO | 9010/9011 | Milvus storage |

## Troubleshooting

### Connection Failed
```
❌ Could not connect to Milvus
```
Ensure Milvus stack is running:
```bash
docker-compose -f docker-compose.ai.yml ps
```

### Embedding Error
```
Error generating embedding: 401 Unauthorized
```
Check your `OPENAI_API_KEY` environment variable.

### Collection Already Exists
Collections are created idempotently - this is expected behavior.

## Related Documentation

- [Vector Database Guide](../../docs/VECTOR_DATABASE.md)
- [AI & Automation Epic](../../AI_AUTOMATION_EPIC.md)
- [Milvus Documentation](https://milvus.io/docs)
