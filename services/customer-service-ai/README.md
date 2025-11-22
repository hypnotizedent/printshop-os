# Customer Service AI Assistant

AI-powered customer service automation for PrintShop OS.

## Overview

This service provides:
- **FAQ Automation:** Answer common questions using LLM and knowledge base
- **Inquiry Routing:** Classify and route inquiries to appropriate teams
- **Response Suggestions:** Generate AI-powered response options for agents
- **Escalation Management:** Automatically escalate complex/negative inquiries
- **Sentiment Analysis:** Real-time customer sentiment tracking

## Quick Start

### Prerequisites

- Docker and Docker Compose
- 8GB+ RAM (16GB recommended for LLM)
- Main PrintShop OS services running

### Installation

1. Start AI services:
```bash
cd /home/runner/work/printshop-os/printshop-os
docker-compose -f docker-compose.ai.yml up -d
```

2. Pull LLM models:
```bash
docker exec -it printshop-llm ollama pull mistral:7b
docker exec -it printshop-llm ollama pull all-minilm:l6-v2
```

3. Initialize knowledge base:
```bash
docker exec -it printshop-cs-ai python scripts/init_knowledge_base.py
```

4. Verify services:
```bash
curl http://localhost:5000/health
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Analyze Inquiry
```bash
POST /analyze-inquiry
Content-Type: application/json

{
  "inquiry_text": "What is your turnaround time?",
  "customer_id": "cust_123",
  "channel": "email"
}
```

Response:
```json
{
  "response_text": "Our standard turnaround time is 7-10 business days...",
  "confidence": 0.85,
  "category": "shipping",
  "sentiment": "neutral",
  "suggested_responses": [...],
  "should_escalate": false,
  "escalation_reason": null,
  "metadata": {...}
}
```

### Search FAQs
```bash
POST /faq-search
Content-Type: application/json

{
  "query": "turnaround time",
  "top_k": 3
}
```

### Sentiment Analysis
```bash
POST /sentiment
Content-Type: application/json

{
  "text": "I love your service!"
}
```

## Architecture

```
Customer Inquiry
    ↓
[Intent Classifier] → Category + Confidence
    ↓
[Vector Search] → Retrieve relevant docs from KB
    ↓
[LLM Generation] → Generate response with context
    ↓
[Sentiment Analysis] → Analyze tone
    ↓
[Escalation Logic] → Determine if human needed
    ↓
Response + Suggestions
```

## Development

### Running Tests

```bash
cd services/customer-service-ai
pip install pytest pytest-asyncio
pytest tests/ -v
```

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app:app --reload --host 0.0.0.0 --port 5000
```

### Adding Knowledge Base Content

Edit `scripts/init_knowledge_base.py` and add to `FAQ_DATA` or `TECHNICAL_DOCS`:

```python
FAQ_DATA.append({
    "question": "Your new question?",
    "answer": "The answer...",
    "category": "general",
    "keywords": ["key", "words"]
})
```

Then reinitialize:
```bash
docker exec -it printshop-cs-ai python scripts/init_knowledge_base.py
```

## Monitoring

Access monitoring dashboards:
- **API Documentation:** http://localhost:5000/docs
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (admin/admin)

## Configuration

Environment variables (set in `docker-compose.ai.yml`):

```env
LLM_API_URL=http://llm-service:11434
VECTOR_DB_URL=http://vector-db:8000
STRAPI_API_URL=http://strapi:1337/api
REDIS_URL=redis://redis:6379
LOG_LEVEL=INFO
```

## Troubleshooting

### LLM Service Not Responding

```bash
# Check logs
docker logs printshop-llm

# Verify model is downloaded
docker exec -it printshop-llm ollama list

# Restart service
docker-compose -f docker-compose.ai.yml restart llm-service
```

### Poor Response Quality

1. Update prompts in `app.py` (`generate_response` function)
2. Add more examples to knowledge base
3. Adjust LLM temperature (currently 0.7)

### Vector Database Errors

```bash
# Check ChromaDB health
curl http://localhost:8000/api/v1/heartbeat

# Restart and reinitialize
docker-compose -f docker-compose.ai.yml restart vector-db
docker exec -it printshop-cs-ai python scripts/init_knowledge_base.py
```

## Documentation

- [Phase 4 Overview](../../docs/phases/phase-4-ai-assistants.md)
- [Customer Service Assistant Guide](../../docs/phases/phase-4-customer-service-assistant.md)
- [API Documentation](http://localhost:5000/docs)

## License

MIT License - Part of PrintShop OS
