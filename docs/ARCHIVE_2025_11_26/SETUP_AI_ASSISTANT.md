# Customer Service AI Assistant - Setup Guide

**Complete setup instructions for deploying the Customer Service Automation Assistant**

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Docker and Docker Compose installed
- ✅ Minimum 16GB RAM (8GB for LLM, 8GB for other services)
- ✅ 50GB+ free disk space
- ✅ Main PrintShop OS services running (Strapi, Appsmith, Botpress)
- ✅ Network: printshop_network created

---

## 🚀 Quick Start (5 Steps)

### Step 1: Start Main Services

```bash
cd /path/to/printshop-os

# Start core services first
docker-compose up -d

# Verify they're running
docker-compose ps
```

### Step 2: Start AI Services

```bash
# Start AI infrastructure
docker-compose -f docker-compose.ai.yml up -d

# Check status
docker-compose -f docker-compose.ai.yml ps
```

Expected output:
```
NAME                   STATUS    PORTS
printshop-llm          Up        0.0.0.0:11434->11434/tcp
printshop-vector-db    Up        0.0.0.0:8000->8000/tcp
printshop-cs-ai        Up        0.0.0.0:5000->5000/tcp
printshop-prometheus   Up        0.0.0.0:9090->9090/tcp
printshop-grafana      Up        0.0.0.0:3001->3000/tcp
```

### Step 3: Download LLM Models

```bash
# Download Mistral 7B (main LLM)
docker exec -it printshop-llm ollama pull mistral:7b

# Download embedding model
docker exec -it printshop-llm ollama pull all-minilm:l6-v2

# Verify models
docker exec -it printshop-llm ollama list
```

Expected output:
```
NAME              SIZE    MODIFIED
mistral:7b        4.1GB   X minutes ago
all-minilm:l6-v2  46MB    X minutes ago
```

### Step 4: Initialize Knowledge Base

```bash
# Run initialization script
docker exec -it printshop-cs-ai python scripts/init_knowledge_base.py
```

Expected output:
```
✅ Initialized knowledge base with 13 documents
   - FAQs: 10
   - Technical Docs: 3
```

### Step 5: Verify Installation

```bash
# Test AI API health
curl http://localhost:5000/health

# Test FAQ search
curl -X POST http://localhost:5000/faq-search \
  -H "Content-Type: application/json" \
  -d '{"query": "turnaround time", "top_k": 3}'

# Test inquiry analysis
curl -X POST http://localhost:5000/analyze-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "inquiry_text": "What is your turnaround time?",
    "channel": "email"
  }'
```

---

## 🔧 Detailed Configuration

### Environment Variables

Create or update `.env` file:

```bash
# AI Service Configuration
AI_SERVICE_URL=http://cs-ai-api:5000
LLM_API_URL=http://llm-service:11434
VECTOR_DB_URL=http://vector-db:8000

# Strapi Configuration
STRAPI_API_URL=http://strapi:1337/api
STRAPI_API_TOKEN=your-api-token-here

# Redis Configuration
REDIS_URL=redis://redis:6379

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure-password-here
```

### Network Configuration

Ensure all services are on the same network:

```bash
# Check network exists
docker network ls | grep printshop_network

# If not exists, create it
docker network create printshop_network

# Connect existing services if needed
docker network connect printshop_network printshop-strapi
docker network connect printshop_network printshop-botpress
docker network connect printshop_network printshop-appsmith
```

---

## 🔌 Integration Setup

### Strapi Integration

1. **Copy Controller and Routes:**

```bash
# Create directory structure in your Strapi project
mkdir -p src/api/customer-service/controllers
mkdir -p src/api/customer-service/routes

# Copy files from examples
cp examples/strapi/ai-assist-controller.js \
   <your-strapi-project>/src/api/customer-service/controllers/ai-assist.js

cp examples/strapi/ai-assist-routes.js \
   <your-strapi-project>/src/api/customer-service/routes/ai-assist.js
```

2. **Create Content Type:**

In Strapi Admin (http://localhost:1337/admin):
- Go to Content-Type Builder
- Create new Collection Type: "Support Interaction"
- Add fields:
  - `customer_id` (Text)
  - `inquiry` (Long Text)
  - `ai_response` (Long Text)
  - `sentiment` (Enumeration: positive, neutral, negative, very_negative)
  - `category` (Text)
  - `confidence` (Number, Float)
  - `escalated` (Boolean, default: false)
  - `resolved` (Boolean, default: false)
  - `agent_id` (Text)
  - `agent_response` (Long Text)

3. **Test Endpoints:**

```bash
# Test AI assist endpoint
curl -X POST http://localhost:1337/api/customer-service/ai-assist \
  -H "Content-Type: application/json" \
  -d '{
    "inquiry_text": "What are your payment terms?",
    "customer_id": "cust_123",
    "channel": "email"
  }'
```

### Botpress Integration

1. **Add Custom Action:**

In Botpress Studio (http://localhost:3000):
- Go to Code Editor
- Create new file: `actions/ai-customer-response.js`
- Copy content from `examples/botpress/ai-customer-response.js`
- Save

2. **Import Flow:**

- Go to Flows
- Import `examples/botpress/example-flow.json`
- Or create new flow and add "Execute Code" nodes
- Select `ai-customer-response` action

3. **Test in Emulator:**

- Open Emulator
- Type: "What's your turnaround time?"
- Verify AI response appears
- Check logs for debugging

### Appsmith Integration

1. **Create Datasource:**

In Appsmith (http://localhost:8080):
- Go to Datasources
- Add New Datasource → REST API
- Name: "Strapi API"
- URL: `http://strapi:1337/api`

2. **Create Queries:**

Use queries from `examples/appsmith/support-dashboard-queries.js`:
- GetPendingTickets
- GetAISuggestions
- ResolveTicket
- GetSupportMetrics

3. **Build Dashboard:**

Create page with:
- **Tickets Table:** Shows pending tickets
- **AI Suggestions Panel:** Shows suggested responses
- **Response Composer:** Textarea for agent response
- **Metrics Cards:** Display KPIs

---

## 📊 Monitoring Setup

### Access Monitoring Tools

- **Grafana:** http://localhost:3001 (admin/admin)
- **Prometheus:** http://localhost:9090
- **API Docs:** http://localhost:5000/docs

### Configure Grafana Dashboard

1. Login to Grafana
2. Add Prometheus datasource:
   - URL: `http://prometheus:9090`
   - Access: Server
3. Import dashboard:
   - Dashboard ID: Create custom or use template
   - Panels: Response time, Escalation rate, Sentiment distribution

---

## 🧪 Testing

### Manual Testing

```bash
# Test various inquiries
curl -X POST http://localhost:5000/analyze-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "inquiry_text": "I am very unhappy with my order!",
    "channel": "email"
  }'

# Should return:
# - sentiment: "negative" or "very_negative"
# - should_escalate: true
# - escalation_reason: "Negative customer sentiment detected"
```

### Automated Testing

```bash
# Run unit tests
cd services/customer-service-ai
pip install pytest pytest-asyncio
pytest tests/ -v

# Expected output:
# tests/test_api.py::test_health_check PASSED
# tests/test_api.py::test_analyze_inquiry_turnaround PASSED
# ... (more tests)
```

### Load Testing (Optional)

```bash
# Using Apache Bench
ab -n 1000 -c 10 -p inquiry.json -T application/json \
   http://localhost:5000/analyze-inquiry

# inquiry.json:
# {"inquiry_text": "Test inquiry", "channel": "test"}
```

---

## 🛠️ Customization

### Add New FAQs

Edit `services/customer-service-ai/scripts/init_knowledge_base.py`:

```python
FAQ_DATA.append({
    "question": "Do you offer bulk discounts?",
    "answer": "Yes! We offer tiered pricing for bulk orders...",
    "category": "pricing",
    "keywords": ["bulk", "discount", "wholesale", "volume"]
})
```

Reinitialize:
```bash
docker exec -it printshop-cs-ai python scripts/init_knowledge_base.py
```

### Adjust LLM Temperature

Edit `services/customer-service-ai/app.py`:

```python
# In generate_response function
"options": {
    "temperature": 0.5,  # Lower = more focused, Higher = more creative
    "top_p": 0.9,
    "max_tokens": 200
}
```

Restart service:
```bash
docker-compose -f docker-compose.ai.yml restart cs-ai-api
```

### Customize Escalation Rules

Edit `services/customer-service-ai/app.py`:

```python
def should_escalate_inquiry(sentiment, confidence, category):
    # Add custom rules
    if sentiment == "very_negative" or confidence < 0.3:
        return True, "Requires human attention"
    
    # Escalate specific categories
    if category in ["returns", "complaint", "technical_issue"]:
        return True, f"Category '{category}' requires specialist"
    
    return False, None
```

---

## 🚨 Troubleshooting

### Issue: LLM Service Not Starting

```bash
# Check logs
docker logs printshop-llm

# Common fixes:
# 1. Not enough memory - increase Docker memory limit
# 2. GPU not available - run in CPU mode (slower)
# 3. Model download failed - manually download

# Manual model download:
docker exec -it printshop-llm bash
ollama pull mistral:7b
```

### Issue: Vector DB Connection Failed

```bash
# Check ChromaDB health
curl http://localhost:8000/api/v1/heartbeat

# If failed, restart
docker-compose -f docker-compose.ai.yml restart vector-db

# Clear and reinitialize
docker volume rm printshop_chroma_data
docker-compose -f docker-compose.ai.yml up -d vector-db
docker exec -it printshop-cs-ai python scripts/init_knowledge_base.py
```

### Issue: Poor Response Quality

Possible solutions:

1. **Add more context to knowledge base:**
   - Add more FAQs
   - Add technical documentation
   - Include customer service guidelines

2. **Adjust prompt engineering:**
   - Edit prompts in `app.py`
   - Add more specific instructions
   - Include examples

3. **Use different LLM model:**
   ```bash
   # Try larger model (requires more RAM)
   docker exec -it printshop-llm ollama pull mistral:13b
   
   # Update app.py to use new model
   # "model": "mistral:13b"
   ```

### Issue: High Response Time

Solutions:

1. **Enable GPU acceleration:**
   - Add GPU support to docker-compose.ai.yml
   - Requires NVIDIA GPU and nvidia-docker

2. **Use smaller model:**
   ```bash
   docker exec -it printshop-llm ollama pull mistral:3b
   ```

3. **Implement response caching:**
   - Cache common queries in Redis
   - Add cache middleware

---

## 📚 Additional Resources

- [Phase 4 AI Assistants Overview](docs/phases/phase-4-ai-assistants.md)
- [Customer Service Assistant Details](docs/phases/phase-4-customer-service-assistant.md)
- [Integration Guide](docs/architecture/ai-integration-guide.md)
- [API Documentation](http://localhost:5000/docs)

---

## 🎯 Next Steps

After setup:

1. ✅ Monitor metrics in Grafana
2. ✅ Review AI responses for accuracy
3. ✅ Add domain-specific FAQs
4. ✅ Train team on new tools
5. ✅ Iterate on prompts based on feedback
6. ✅ Scale infrastructure as needed

---

## 💬 Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.ai.yml logs -f`
- Review documentation in `/docs/phases/`
- Open GitHub issue with `[AI Assistant]` tag

---

**Last Updated:** November 2024  
**Version:** 1.0.0  
**Maintainer:** PrintShop OS Team
