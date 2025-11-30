# Customer Service AI

AI-powered customer service for PrintShop OS with RAG (Retrieval-Augmented Generation), sentiment analysis, and design file analysis.

## Features

- **Customer Inquiry Analysis**: AI-powered responses using RAG with knowledge base
- **FAQ Search**: Semantic search across the knowledge base
- **Sentiment Analysis**: Detect customer sentiment for prioritization
- **Design Analysis**: Analyze uploaded designs for print feasibility
- **Chat Sessions**: Maintain conversation context across messages

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key (or Ollama for local LLM)
- ChromaDB for vector storage
- Redis for session management (optional)

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | Yes (or `LLM_API_URL`) |
| `LLM_API_URL` | Ollama URL for local LLM | Yes (or `OPENAI_API_KEY`) |
| `VECTOR_DB_URL` | ChromaDB URL | Yes |
| `STRAPI_API_URL` | Strapi CMS API URL | Yes |
| `REDIS_URL` | Redis URL for sessions | No |
| `LLM_MODEL` | Model name (default: gpt-4o-mini) | No |
| `EMBEDDING_MODEL` | Embedding model (default: text-embedding-3-small) | No |

## API Endpoints

### Health Check
```
GET /health
```

### Analyze Inquiry
```
POST /analyze-inquiry
{
  "inquiry_text": "What's your turnaround time?",
  "customer_id": "cust_123",
  "channel": "chat"
}
```

### Search FAQ
```
POST /faq-search
{
  "query": "pricing for screen printing",
  "top_k": 5
}
```

### Analyze Sentiment
```
POST /sentiment
{
  "text": "I'm frustrated with my order"
}
```

### Analyze Design
```
POST /analyze-design
{
  "image_url": "https://example.com/design.png"
}
```

### Chat Sessions
```
POST /chat/sessions  # Create session
POST /chat/sessions/:id/messages  # Send message
GET /chat/sessions/:id  # Get history
```

## Architecture

```
┌─────────────────────────────────────┐
│         Customer Service AI          │
├─────────────────────────────────────┤
│  ┌─────────┐    ┌─────────────────┐ │
│  │ Express │────│ AI Routes       │ │
│  │ Server  │    └─────────────────┘ │
│  └─────────┘              │         │
│        │                  ▼         │
│  ┌─────┴────┐    ┌──────────────┐   │
│  │ Services │    │ RAG Service  │   │
│  ├──────────┤    │ ┌──────────┐ │   │
│  │ Sentiment│    │ │ ChromaDB │ │   │
│  │ Design   │    │ └──────────┘ │   │
│  │ Chat     │    └──────────────┘   │
│  └──────────┘           │           │
│        │                ▼           │
│  ┌─────┴────┐    ┌──────────────┐   │
│  │LLM Client│────│ OpenAI/      │   │
│  │          │    │ Ollama       │   │
│  └──────────┘    └──────────────┘   │
└─────────────────────────────────────┘
```

## Docker Deployment

```bash
# Build image
docker build -t printshop-cs-ai .

# Run with docker-compose
docker-compose -f docker-compose.ai.yml up -d
```

## Knowledge Base

The service uses a vector database to store and retrieve relevant context:

- `/data/intelligence/knowledge_base/general/` - FAQs
- `/data/intelligence/knowledge_base/operational/` - SOPs
- `/data/intelligence/knowledge_base/technical/` - Guidelines
- `/data/intelligence/knowledge_base/case_studies/` - Examples

### Indexing Documents

```typescript
const doc = {
  id: 'faq-001',
  title: 'Turnaround Times',
  content: 'Standard turnaround is 5-7 business days...',
  category: 'faq',
  tags: ['turnaround', 'shipping'],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date()
};

await ragService.indexDocument(doc);
```

## Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Response time | <2s | With caching |
| Cost per query | ~$0.01 | GPT-4o-mini |
| Accuracy | >90% | With good KB |
| Escalation rate | <20% | Human handoff |

## Development

```bash
# Run in development
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Related Documentation

- [AI Integration Guide](../../docs/architecture/ai-integration-guide.md)
- [AI Automation Epic](../../docs/ARCHIVE_2025_11_27/AI_AUTOMATION_EPIC.md)
- [Docker Compose AI](../../docker-compose.ai.yml)

---

**Last Updated:** November 29, 2025  
**Service:** customer-service-ai  
**Port:** 5000
