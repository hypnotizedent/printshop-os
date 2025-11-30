# Vector Database Guide

**Last Updated:** November 27, 2025

PrintShop OS uses [Milvus](https://milvus.io/) as its vector database for AI-powered features including semantic search, design similarity matching, and RAG (Retrieval-Augmented Generation).

## Why Milvus?

| Feature | Milvus (Self-Hosted) | Cloud Alternatives |
|---------|----------------------|-------------------|
| **Cost** | $0/month | $70-500+/month |
| **Performance** | Millisecond latency | Similar |
| **Scale** | Billions of vectors | Similar |
| **Multi-modal** | Text, image, audio | Varies |
| **Data Privacy** | Stays on-premises | Cloud-hosted |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       PrintShop OS AI Stack                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   OpenAI    │───▶│  Vector Store   │───▶│     Milvus      │  │
│  │  Embedding  │    │    Service      │    │  (standalone)   │  │
│  │    API      │    │ (TypeScript)    │    │                 │  │
│  └─────────────┘    └─────────────────┘    └─────────────────┘  │
│                            │                        │            │
│                            │                        ▼            │
│                            │              ┌─────────────────┐   │
│                            │              │      etcd       │   │
│                            │              │   (metadata)    │   │
│                            │              └─────────────────┘   │
│                            │                        │            │
│                            │              ┌─────────────────┐   │
│                            │              │     MinIO       │   │
│                            │              │  (object store) │   │
│                            ▼              └─────────────────┘   │
│                    ┌───────────────┐                            │
│                    │  Collections  │                            │
│                    ├───────────────┤                            │
│                    │ • designs     │ ─▶ Design similarity       │
│                    │ • customers   │ ─▶ Customer intelligence   │
│                    │ • orders      │ ─▶ Order pattern matching  │
│                    │ • knowledge   │ ─▶ RAG retrieval           │
│                    └───────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Infrastructure Components

| Component | Container | Port | Purpose |
|-----------|-----------|------|---------|
| **Milvus** | printshop-milvus | 19530, 9091 | Vector database |
| **etcd** | printshop-etcd | 2379 | Metadata storage |
| **MinIO** | printshop-milvus-minio | 9010, 9011 | Object storage |
| **Attu** | printshop-attu | 8001 | Web UI |

## Getting Started

### 1. Start the Milvus Stack

```bash
# From project root
docker-compose -f docker-compose.ai.yml up -d etcd milvus-minio milvus attu
```

### 2. Verify Services

```bash
# Check all containers are running
docker ps | grep printshop

# Check Milvus health
curl http://localhost:9091/healthz
```

### 3. Access Attu Web UI

Open http://localhost:8001 in your browser to:
- Browse collections
- View vector statistics
- Run test queries
- Monitor performance

### 4. Initialize Collections

```bash
cd services/vector-store
npm install
npm run init:collections
```

## Collection Schemas

### designs

Store and search design/mockup embeddings for similarity matching.

| Field | Type | Description |
|-------|------|-------------|
| id | VarChar | Unique record ID |
| vector | FloatVector(1536) | OpenAI embedding |
| text | VarChar | Design description |
| metadata.designId | String | Original design ID |
| metadata.customerId | String | Customer association |
| metadata.type | String | screen-print, embroidery, etc. |
| metadata.colorCount | Number | Number of colors |
| metadata.imageUrl | String | Design image URL |

**Use Cases:**
- "Show me designs similar to this uploaded logo"
- Find duplicate/near-duplicate designs
- Recommend past designs to returning customers

### customers

Store customer profile embeddings for segmentation and insights.

| Field | Type | Description |
|-------|------|-------------|
| id | VarChar | Unique record ID |
| vector | FloatVector(1536) | OpenAI embedding |
| text | VarChar | Customer profile text |
| metadata.customerId | String | Original customer ID |
| metadata.company | String | Company name |
| metadata.segment | String | vip, regular, at-risk, etc. |
| metadata.lifetimeValue | Number | Total spend |

**Use Cases:**
- Find customers similar to VIPs for upselling
- Identify at-risk customers based on patterns
- Segment customers for marketing

### orders

Store order embeddings for pattern matching and pricing intelligence.

| Field | Type | Description |
|-------|------|-------------|
| id | VarChar | Unique record ID |
| vector | FloatVector(1536) | OpenAI embedding |
| text | VarChar | Order description |
| metadata.orderId | String | Original order ID |
| metadata.customerId | String | Customer ID |
| metadata.totalAmount | Number | Order total |
| metadata.quantity | Number | Item count |
| metadata.productType | String | screen-print, embroidery, etc. |

**Use Cases:**
- Find similar historical orders for accurate pricing
- Estimate production time based on past orders
- Analyze order patterns for forecasting

### knowledge_base

Store document embeddings for RAG (chatbot context retrieval).

| Field | Type | Description |
|-------|------|-------------|
| id | VarChar | Unique chunk ID |
| vector | FloatVector(1536) | OpenAI embedding |
| text | VarChar | Document chunk text |
| metadata.documentId | String | Parent document ID |
| metadata.title | String | Document title |
| metadata.category | String | general, operational, technical, etc. |
| metadata.chunkIndex | Number | Chunk position |

**Use Cases:**
- Power customer service chatbot with relevant context
- Search policies and procedures semantically
- Find relevant case studies for quotes

## Generating Embeddings

The vector store service uses OpenAI's embedding models:

```typescript
import { generateEmbedding } from '@mintprints/vector-store';

// Single text
const embedding = await generateEmbedding('Blue logo on black t-shirt');
// Returns: number[] with 1536 dimensions

// Batch (more efficient)
import { generateBatchEmbeddings } from '@mintprints/vector-store';
const embeddings = await generateBatchEmbeddings([
  'Red logo on white hoodie',
  'Green text on gray polo',
]);
```

### Supported Models

| Model | Dimensions | Cost | Best For |
|-------|-----------|------|----------|
| text-embedding-ada-002 | 1536 | $0.0001/1K tokens | General use |
| text-embedding-3-small | 1536 | $0.00002/1K tokens | Cost-sensitive |
| text-embedding-3-large | 3072 | $0.00013/1K tokens | Higher accuracy |

## Search Examples

### Semantic Search

```typescript
import { semanticSearch } from '@mintprints/vector-store';

// Search across all collections
const results = await semanticSearch('team uniforms with embroidered logos', {
  targets: ['designs', 'orders'],
  limit: 10,
  minScore: 0.7,
});
```

### Find Similar

```typescript
import { findSimilarDesigns, findSimilarOrders } from '@mintprints/vector-store';

// Find similar designs
const designs = await findSimilarDesigns('Vintage-style brewery logo');

// Find similar orders for pricing
const orders = await findSimilarOrders('100 polos with embroidered logo', 10);
```

### RAG Context Retrieval

```typescript
import { retrieveRAGContext, buildRAGPrompt } from '@mintprints/vector-store';

// Get context for a question
const context = await retrieveRAGContext('What are your rush order fees?', {
  maxChunks: 5,
  includeOrders: true,
});

// Build a complete prompt for the LLM
const { prompt } = await buildRAGPrompt(
  'How long does embroidery take?',
  'You are a helpful print shop assistant.',
);
```

## Integration with Services

### Customer Service AI

The chatbot uses RAG to provide accurate, context-aware responses:

```typescript
// In customer-service-ai service
import { getRAGContext } from '@mintprints/vector-store';

async function handleCustomerQuery(query: string) {
  const context = await getRAGContext(query, 3);
  
  // Include context in LLM prompt
  const response = await llm.complete({
    prompt: `Context: ${context}\n\nQuestion: ${query}`,
  });
  
  return response;
}
```

### Quote Optimizer

Find similar historical orders for accurate pricing:

```typescript
// In job-estimator service
import { findSimilarOrders } from '@mintprints/vector-store';

async function suggestPricing(quoteRequest: QuoteRequest) {
  const similar = await findSimilarOrders(
    `${quoteRequest.quantity} ${quoteRequest.product} ${quoteRequest.colors} colors`,
    5,
    quoteRequest.type
  );
  
  // Analyze similar order pricing
  const avgPrice = similar.reduce((sum, o) => 
    sum + (o.metadata.totalAmount / o.metadata.quantity), 0
  ) / similar.length;
  
  return { suggestedPricePerItem: avgPrice };
}
```

## Data Ingestion

### Ingest Knowledge Base

```bash
# Run knowledge base ingestion script
cd services/vector-store
npx ts-node scripts/ingest-knowledge-base.ts
```

### Ingest Historical Orders

```typescript
import { batchIndexOrders } from '@mintprints/vector-store';

// Load orders from Strapi
const orders = await strapi.query('order').findMany();

// Transform and index
await batchIndexOrders(
  orders.map(order => ({
    metadata: {
      orderId: order.id,
      customerId: order.customer.id,
      totalAmount: order.totalPrice,
      quantity: order.quantity,
      productType: order.printType,
      createdAt: order.createdAt,
    },
    additionalNotes: order.productionNotes,
  }))
);
```

## Backup and Maintenance

### Backup Data

```bash
# Backup Milvus data volumes
docker run --rm -v printshop_milvus_data:/data -v $(pwd):/backup \
  alpine tar cvf /backup/milvus-backup.tar /data
```

### Monitor Performance

```bash
# Check Milvus metrics
curl http://localhost:9091/metrics

# View Milvus logs
docker-compose -f docker-compose.ai.yml logs -f milvus
```

### Maintenance Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Compact collections | Weekly | `milvusClient.compact()` |
| Rebuild indexes | Monthly | Drop and recreate indexes |
| Backup data | Daily | Volume backup script |

## Troubleshooting

### Connection Failed

```
Error: Could not connect to Milvus at localhost:19530
```

1. Check if containers are running: `docker ps | grep milvus`
2. Check logs: `docker-compose -f docker-compose.ai.yml logs milvus`
3. Ensure etcd and MinIO are healthy first

### Slow Searches

1. Check if collection is loaded: Collections must be in memory
2. Verify index exists: `await milvusClient.describeIndex({ collection_name: 'designs' })`
3. Consider reducing `topK` parameter

### Out of Memory

Milvus loads collections into memory for fast search:

1. Reduce number of collections loaded simultaneously
2. Use `releaseCollection()` for inactive collections
3. Increase Docker memory limits

## References

- [Milvus Documentation](https://milvus.io/docs)
- [Milvus Node.js SDK](https://github.com/milvus-io/milvus-sdk-node)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Vector Store Service README](../services/vector-store/README.md)
