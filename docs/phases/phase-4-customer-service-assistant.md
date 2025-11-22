# Customer Service Automation Assistant

**Issue:** #66  
**Type:** AI Assistant  
**Phase:** 4 (Week 12)  
**Status:** Implementation Guide

---

## 📋 Overview

The Customer Service Automation Assistant is an AI-powered system designed to handle 80% of basic customer inquiries, route complex issues to the appropriate team, and provide intelligent response suggestions to support agents.

### Key Benefits

- **Reduced Support Load:** Automates FAQ responses and routine inquiries
- **Faster Response Times:** Instant AI responses vs. minutes/hours wait
- **Improved Routing:** Intelligent classification ensures right team handles each issue
- **Agent Productivity:** Pre-generated response suggestions save time
- **Better Customer Experience:** 24/7 availability and sentiment-aware interactions

---

## 🎯 Acceptance Criteria

✅ **FAQ Automation**
- Answer common questions using context-aware LLM
- 80%+ accuracy on FAQ dataset
- Sub-2-second response time
- Handle follow-up questions in context

✅ **Inquiry Routing**
- Classify inquiries into categories: Order Status, Pricing, Technical, Custom Design, Returns
- Route to correct team/department automatically
- Confidence scoring for routing decisions
- Fallback to general support queue if uncertain

✅ **Response Suggestions**
- Generate 3 suggested responses per inquiry
- Context includes: customer history, order data, previous tickets
- Editable suggestions with one-click insertion
- Learn from agent edits and feedback

✅ **Escalation Management**
- Automatic escalation triggers: negative sentiment, high complexity, repeated issues
- Priority levels: Low, Medium, High, Urgent
- Escalation path configuration per inquiry type
- Manager notification on urgent escalations

✅ **Sentiment Analysis**
- Real-time sentiment scoring: Positive, Neutral, Negative, Very Negative
- Track sentiment trends over conversation
- Alert agents on sentiment drops
- Dashboard visualization of customer satisfaction

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│              Customer Service AI Architecture                │
└─────────────────────────────────────────────────────────────┘

Customer Input (Email, Chat, Ticket)
    ↓
┌──────────────────────┐
│  Intent Classifier   │ ← Lightweight classification model
│  (DistilBERT)        │   Categories: FAQ, Order, Pricing, etc.
└──────────┬───────────┘
           ↓
    ┌──────────────┐
    │ Confidence?  │
    └──────┬───────┘
           ↓
    High   │   Low
    ↓      │    ↓
┌─────────────────┐   ┌──────────────────┐
│  FAQ Engine     │   │  Human Routing   │
│  (RAG + LLM)    │   │  (Manual Review) │
└────────┬────────┘   └──────────────────┘
         ↓
┌─────────────────────┐
│  Vector Search      │ ← Retrieve relevant docs from knowledge base
│  (Chroma DB)        │   
└────────┬────────────┘
         ↓
┌─────────────────────┐
│  LLM Generation     │ ← Generate response with context
│  (Mistral/LLaMA)    │   
└────────┬────────────┘
         ↓
┌─────────────────────┐
│  Sentiment Analysis │ ← Analyze customer + AI response tone
│  (RoBERTa)          │   
└────────┬────────────┘
         ↓
    ┌──────────────┐
    │ Sentiment?   │
    └──────┬───────┘
           ↓
    Positive/Neutral │  Negative/Very Negative
         ↓           │           ↓
    Auto-Send        │      ┌────────────────┐
    Response         └─────→│  Escalate to   │
                            │  Human Agent   │
                            └────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **LLM Engine** | Ollama + Mistral 7B | Response generation |
| **Vector Database** | ChromaDB | Knowledge base retrieval (RAG) |
| **Intent Classifier** | DistilBERT fine-tuned | Query categorization |
| **Sentiment Model** | RoBERTa-base | Emotion detection |
| **API Framework** | FastAPI (Python) | REST API endpoints |
| **Queue System** | Redis | Job queue for async processing |
| **Monitoring** | Prometheus + Grafana | Performance metrics |

---

## 🚀 Implementation Guide

### 1. Infrastructure Setup

#### Docker Compose Configuration

Create `/docker-compose.ai.yml`:

```yaml
version: '3.8'

services:
  # LLM Service (Ollama)
  llm-service:
    image: ollama/ollama:latest
    container_name: printshop-llm
    restart: unless-stopped
    volumes:
      - ollama_models:/root/.ollama
    ports:
      - "11434:11434"
    networks:
      - printshop_network
    deploy:
      resources:
        reservations:
          memory: 8G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Vector Database (ChromaDB)
  vector-db:
    image: chromadb/chroma:latest
    container_name: printshop-vector-db
    restart: unless-stopped
    volumes:
      - chroma_data:/chroma/chroma
    ports:
      - "8000:8000"
    networks:
      - printshop_network
    environment:
      - CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER=chromadb.auth.token.TokenConfigServerAuthCredentialsProvider
      - CHROMA_SERVER_AUTH_TOKEN_TRANSPORT_HEADER=Authorization
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Customer Service AI API
  cs-ai-api:
    build: ./services/customer-service-ai
    container_name: printshop-cs-ai
    restart: unless-stopped
    ports:
      - "5000:5000"
    networks:
      - printshop_network
    environment:
      - LLM_API_URL=http://llm-service:11434
      - VECTOR_DB_URL=http://vector-db:8000
      - STRAPI_API_URL=http://strapi:1337/api
      - REDIS_URL=redis://redis:6379
    depends_on:
      - llm-service
      - vector-db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  printshop_network:
    external: true

volumes:
  ollama_models:
    name: printshop_ollama_models
  chroma_data:
    name: printshop_chroma_data
```

#### Initialize LLM Models

```bash
# Pull required models
docker exec -it printshop-llm ollama pull mistral:7b
docker exec -it printshop-llm ollama pull all-minilm:l6-v2  # For embeddings
```

---

### 2. Knowledge Base Setup

#### Vector Database Initialization

Create `/services/customer-service-ai/scripts/init_knowledge_base.py`:

```python
#!/usr/bin/env python3
"""
Initialize vector database with PrintShop OS knowledge base
"""
import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict
import json

# FAQ Data Structure
FAQ_DATA = [
    {
        "question": "What is your turnaround time for orders?",
        "answer": "Our standard turnaround time is 7-10 business days. Rush orders (3-5 days) are available for an additional fee. Custom designs may require additional time for approval.",
        "category": "shipping",
        "keywords": ["turnaround", "delivery", "shipping", "time", "how long"]
    },
    {
        "question": "Do you offer embroidery services?",
        "answer": "Yes! We offer professional embroidery on a variety of garments. Pricing is based on stitch count. Request a quote through our system with your design for accurate pricing.",
        "category": "services",
        "keywords": ["embroidery", "stitching", "embroidered", "patches"]
    },
    {
        "question": "What file formats do you accept for artwork?",
        "answer": "We accept vector formats (AI, EPS, PDF, SVG) and high-resolution raster files (PNG, PSD at 300+ DPI). Vector files ensure the best print quality.",
        "category": "technical",
        "keywords": ["file format", "artwork", "design file", "ai", "eps", "pdf", "png"]
    },
    {
        "question": "How do I track my order?",
        "answer": "Log into your customer portal at printshop-os.com/portal to view real-time order status. You'll receive email notifications at key milestones: Order Received, In Production, Quality Check, and Shipped.",
        "category": "order_status",
        "keywords": ["track", "order status", "where is my order", "tracking"]
    },
    {
        "question": "What is your minimum order quantity?",
        "answer": "We have no minimum order quantity! Whether you need 1 shirt or 1000, we're happy to help. Note that per-unit pricing decreases with volume.",
        "category": "pricing",
        "keywords": ["minimum", "moq", "how many", "quantity", "order size"]
    },
    {
        "question": "Can I get a sample before placing a full order?",
        "answer": "Yes! We offer sample production for a small fee. Order through our quote system and select 'Sample Order'. Samples typically ship within 3-5 business days.",
        "category": "samples",
        "keywords": ["sample", "test", "proof", "prototype"]
    },
    {
        "question": "What are your payment terms?",
        "answer": "We require 50% deposit on quote approval, with the remaining 50% due before shipping. We accept credit cards, ACH transfers, and can set up net-30 terms for established customers.",
        "category": "payment",
        "keywords": ["payment", "deposit", "pay", "invoice", "billing"]
    },
    {
        "question": "What if I'm not satisfied with my order?",
        "answer": "Your satisfaction is our priority! If there's a quality issue, contact us within 7 days of delivery. We'll review your concern and offer a reprint or refund as appropriate. See our quality guarantee policy for details.",
        "category": "returns",
        "keywords": ["refund", "return", "not happy", "quality issue", "complaint"]
    },
    {
        "question": "Do you ship internationally?",
        "answer": "Currently, we ship within the continental United States and Canada. International shipping may be arranged on a case-by-case basis. Contact us for international quotes.",
        "category": "shipping",
        "keywords": ["international", "ship to", "canada", "overseas", "export"]
    },
    {
        "question": "How do I request a bulk order quote?",
        "answer": "For bulk orders (100+ units), visit our quote tool and provide: quantity, garment type, colors, print locations. Our team will respond within 24 hours with competitive pricing.",
        "category": "pricing",
        "keywords": ["bulk", "wholesale", "large order", "quote", "pricing"]
    }
]

# Technical Knowledge Base
TECHNICAL_DOCS = [
    {
        "title": "Garment Care Instructions",
        "content": "All garments should be washed inside-out in cold water. Tumble dry low or hang dry. Do not iron directly on prints. For embroidered items, avoid bleach and harsh detergents.",
        "category": "care"
    },
    {
        "title": "Print Methods Comparison",
        "content": "Screen Printing: Best for large orders, vibrant colors, durable. DTG (Direct-to-Garment): Ideal for complex designs, small batches, photo-quality. Heat Transfer: Quick turnaround, works on various materials. Embroidery: Premium look, very durable, best for logos.",
        "category": "technical"
    },
    {
        "title": "Color Matching Guidelines",
        "content": "We use Pantone color matching for accuracy. Monitor colors may vary from printed results. Request a color swatch for critical color matches. CMYK converts to closest Pantone equivalent.",
        "category": "technical"
    }
]

def initialize_vector_db():
    """Initialize ChromaDB with knowledge base"""
    
    # Connect to ChromaDB
    client = chromadb.HttpClient(host="vector-db", port=8000)
    
    # Create embedding function
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Create or get collection
    collection = client.get_or_create_collection(
        name="customer_service_kb",
        embedding_function=embedding_fn,
        metadata={"description": "PrintShop OS Customer Service Knowledge Base"}
    )
    
    # Prepare documents for ingestion
    documents = []
    metadatas = []
    ids = []
    
    # Add FAQs
    for idx, faq in enumerate(FAQ_DATA):
        doc_text = f"Question: {faq['question']}\nAnswer: {faq['answer']}"
        documents.append(doc_text)
        metadatas.append({
            "type": "faq",
            "category": faq["category"],
            "keywords": ",".join(faq["keywords"])
        })
        ids.append(f"faq_{idx}")
    
    # Add technical docs
    for idx, doc in enumerate(TECHNICAL_DOCS):
        doc_text = f"Title: {doc['title']}\nContent: {doc['content']}"
        documents.append(doc_text)
        metadatas.append({
            "type": "technical_doc",
            "category": doc["category"],
            "title": doc["title"]
        })
        ids.append(f"tech_{idx}")
    
    # Ingest into vector database
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"✅ Initialized knowledge base with {len(documents)} documents")
    print(f"   - FAQs: {len(FAQ_DATA)}")
    print(f"   - Technical Docs: {len(TECHNICAL_DOCS)}")
    
    return collection

if __name__ == "__main__":
    initialize_vector_db()
```

---

### 3. AI Service Implementation

#### Core API Service

Create `/services/customer-service-ai/app.py`:

```python
"""
Customer Service AI API
Handles FAQ automation, inquiry routing, response generation
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import httpx
import chromadb
from transformers import pipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Customer Service AI API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
chroma_client = chromadb.HttpClient(host="vector-db", port=8000)
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

# Request/Response Models
class InquiryRequest(BaseModel):
    customer_id: Optional[str] = None
    inquiry_text: str
    channel: str = "email"  # email, chat, ticket
    ticket_id: Optional[str] = None

class InquiryResponse(BaseModel):
    response_text: str
    confidence: float
    category: str
    sentiment: str
    suggested_responses: List[str]
    should_escalate: bool
    escalation_reason: Optional[str] = None
    metadata: Dict

class FAQQueryRequest(BaseModel):
    query: str
    top_k: int = 3

class SentimentRequest(BaseModel):
    text: str

# API Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "customer-service-ai"}

@app.post("/analyze-inquiry", response_model=InquiryResponse)
async def analyze_inquiry(request: InquiryRequest):
    """
    Main endpoint: Analyze customer inquiry and generate response
    """
    try:
        # 1. Classify intent
        category, confidence = await classify_intent(request.inquiry_text)
        
        # 2. Perform sentiment analysis
        sentiment = await analyze_sentiment(request.inquiry_text)
        
        # 3. Retrieve relevant knowledge
        context = await retrieve_context(request.inquiry_text, category)
        
        # 4. Generate response
        response_text = await generate_response(
            inquiry=request.inquiry_text,
            context=context,
            category=category,
            customer_id=request.customer_id
        )
        
        # 5. Generate alternative suggestions
        suggested_responses = await generate_suggestions(
            inquiry=request.inquiry_text,
            context=context
        )
        
        # 6. Determine if escalation needed
        should_escalate, escalation_reason = should_escalate_inquiry(
            sentiment=sentiment,
            confidence=confidence,
            category=category
        )
        
        return InquiryResponse(
            response_text=response_text,
            confidence=confidence,
            category=category,
            sentiment=sentiment,
            suggested_responses=suggested_responses,
            should_escalate=should_escalate,
            escalation_reason=escalation_reason,
            metadata={
                "context_docs": len(context),
                "processing_time_ms": 0  # Add timing
            }
        )
        
    except Exception as e:
        logger.error(f"Error analyzing inquiry: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/faq-search")
async def faq_search(request: FAQQueryRequest):
    """Search FAQ knowledge base"""
    try:
        collection = chroma_client.get_collection("customer_service_kb")
        results = collection.query(
            query_texts=[request.query],
            n_results=request.top_k,
            where={"type": "faq"}
        )
        
        return {
            "results": [
                {
                    "text": doc,
                    "metadata": meta,
                    "distance": dist
                }
                for doc, meta, dist in zip(
                    results['documents'][0],
                    results['metadatas'][0],
                    results['distances'][0]
                )
            ]
        }
    except Exception as e:
        logger.error(f"Error searching FAQs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sentiment")
async def sentiment_endpoint(request: SentimentRequest):
    """Standalone sentiment analysis"""
    sentiment = await analyze_sentiment(request.text)
    return {"text": request.text, "sentiment": sentiment}

# Helper Functions

async def classify_intent(text: str) -> tuple:
    """
    Classify inquiry intent/category
    Returns: (category, confidence)
    """
    # Simplified classification - in production, use fine-tuned model
    categories = {
        "order_status": ["track", "where", "status", "delivery"],
        "pricing": ["cost", "price", "quote", "how much", "payment"],
        "technical": ["file", "format", "design", "artwork", "resolution"],
        "shipping": ["ship", "delivery", "turnaround", "when"],
        "returns": ["refund", "return", "unhappy", "complaint"],
        "services": ["do you", "can you", "offer", "available"]
    }
    
    text_lower = text.lower()
    scores = {}
    
    for category, keywords in categories.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        scores[category] = score
    
    if max(scores.values()) == 0:
        return "general", 0.5
    
    best_category = max(scores, key=scores.get)
    confidence = min(scores[best_category] / 3.0, 1.0)  # Normalize
    
    return best_category, confidence

async def analyze_sentiment(text: str) -> str:
    """
    Analyze text sentiment
    Returns: positive, neutral, negative, very_negative
    """
    result = sentiment_analyzer(text[:512])[0]  # Limit to model's max length
    
    label = result['label'].lower()
    score = result['score']
    
    if label == 'negative' and score > 0.9:
        return "very_negative"
    elif label == 'negative':
        return "negative"
    elif label == 'positive' and score > 0.8:
        return "positive"
    else:
        return "neutral"

async def retrieve_context(query: str, category: str, top_k: int = 3) -> List[str]:
    """Retrieve relevant context from knowledge base"""
    try:
        collection = chroma_client.get_collection("customer_service_kb")
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where={"category": category} if category != "general" else None
        )
        
        return results['documents'][0] if results['documents'] else []
    except Exception as e:
        logger.error(f"Error retrieving context: {str(e)}")
        return []

async def generate_response(
    inquiry: str,
    context: List[str],
    category: str,
    customer_id: Optional[str] = None
) -> str:
    """Generate AI response using LLM"""
    
    # Build prompt
    context_text = "\n\n".join(context) if context else "No specific context available."
    
    prompt = f"""You are a helpful customer service assistant for PrintShop OS, an apparel printing company.

Customer Inquiry: {inquiry}

Relevant Information:
{context_text}

Generate a helpful, professional response that:
1. Directly addresses the customer's question
2. Uses information from the provided context
3. Is friendly and concise (2-3 sentences)
4. Includes a call-to-action if appropriate

Response:"""

    # Call LLM API
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "http://llm-service:11434/api/generate",
                json={
                    "model": "mistral:7b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 200
                    }
                }
            )
            result = response.json()
            return result.get('response', '').strip()
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return "I apologize, but I'm having trouble generating a response right now. A human agent will assist you shortly."

async def generate_suggestions(inquiry: str, context: List[str]) -> List[str]:
    """Generate 3 alternative response suggestions"""
    # Simplified version - in production, generate variations
    base_response = await generate_response(inquiry, context, "general")
    
    return [
        base_response,
        f"Thank you for reaching out! {base_response}",
        f"Great question! {base_response} Let me know if you need any clarification."
    ]

def should_escalate_inquiry(
    sentiment: str,
    confidence: float,
    category: str
) -> tuple:
    """
    Determine if inquiry should be escalated to human
    Returns: (should_escalate, reason)
    """
    # Escalate on very negative sentiment
    if sentiment == "very_negative":
        return True, "Negative customer sentiment detected"
    
    # Escalate on low confidence
    if confidence < 0.4:
        return True, "Low confidence in automated response"
    
    # Escalate certain categories
    if category in ["returns", "complaint"]:
        return True, f"Category '{category}' requires human review"
    
    return False, None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
```

#### Requirements File

Create `/services/customer-service-ai/requirements.txt`:

```txt
fastapi==0.104.1
uvicorn==0.24.0
httpx==0.25.1
chromadb==0.4.18
transformers==4.35.2
torch==2.1.1
pydantic==2.5.0
python-multipart==0.0.6
redis==5.0.1
prometheus-client==0.19.0
```

#### Dockerfile

Create `/services/customer-service-ai/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download models
RUN python -c "from transformers import pipeline; pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')"

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
```

---

### 4. Integration with Strapi

#### Custom API Endpoint

Add to Strapi `/api/customer-service/routes/ai-assist.js`:

```javascript
module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/customer-service/ai-assist',
      handler: 'ai-assist.analyzeInquiry',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/customer-service/faq-search',
      handler: 'ai-assist.searchFAQ',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
```

#### Controller

Create `/api/customer-service/controllers/ai-assist.js`:

```javascript
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://cs-ai-api:5000';

module.exports = {
  async analyzeInquiry(ctx) {
    try {
      const { inquiry_text, customer_id, channel, ticket_id } = ctx.request.body;

      // Call AI service
      const response = await axios.post(`${AI_SERVICE_URL}/analyze-inquiry`, {
        inquiry_text,
        customer_id,
        channel,
        ticket_id,
      });

      // Log interaction
      await strapi.entityService.create('api::support-interaction.support-interaction', {
        data: {
          customer_id,
          inquiry: inquiry_text,
          ai_response: response.data.response_text,
          sentiment: response.data.sentiment,
          category: response.data.category,
          escalated: response.data.should_escalate,
          confidence: response.data.confidence,
        },
      });

      ctx.body = response.data;
    } catch (error) {
      strapi.log.error('AI assist error:', error);
      ctx.throw(500, 'Failed to process inquiry');
    }
  },

  async searchFAQ(ctx) {
    try {
      const { query, top_k = 3 } = ctx.query;

      const response = await axios.post(`${AI_SERVICE_URL}/faq-search`, {
        query,
        top_k: parseInt(top_k),
      });

      ctx.body = response.data;
    } catch (error) {
      strapi.log.error('FAQ search error:', error);
      ctx.throw(500, 'Failed to search FAQ');
    }
  },
};
```

---

### 5. Botpress Integration

#### Custom Action: AI Response

In Botpress, create custom action `ai-customer-response.js`:

```javascript
/**
 * @title AI Customer Service Response
 * @category Customer Service
 * @description Gets AI-powered response for customer inquiry
 */

const axios = require('axios');

const aiAssist = async () => {
  const inquiryText = event.payload.text;
  const userId = event.target;

  try {
    // Call AI service via Strapi
    const response = await axios.post(
      'http://strapi:1337/api/customer-service/ai-assist',
      {
        inquiry_text: inquiryText,
        customer_id: userId,
        channel: 'chat',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const aiResponse = response.data;

    // Store in bot memory
    temp.aiResponse = aiResponse.response_text;
    temp.aiSentiment = aiResponse.sentiment;
    temp.aiConfidence = aiResponse.confidence;
    temp.shouldEscalate = aiResponse.should_escalate;

    // Log for analytics
    await bp.events.saveUserEvent({
      botId: event.botId,
      channel: event.channel,
      target: event.target,
      type: 'ai_response_generated',
      payload: {
        category: aiResponse.category,
        sentiment: aiResponse.sentiment,
        escalated: aiResponse.should_escalate,
      },
    });
  } catch (error) {
    bp.logger.error('AI assist error:', error);
    temp.aiResponse = 'I apologize, but I need to connect you with a human agent for assistance.';
    temp.shouldEscalate = true;
  }
};

return aiAssist();
```

---

### 6. Appsmith Dashboard Integration

#### Support Agent Dashboard

Create Appsmith page with:

1. **Incoming Tickets Table**
   - Columns: ID, Customer, Subject, Sentiment, Category, Priority
   - Color coding: Red (very negative), Yellow (negative), Green (positive)

2. **AI Response Panel**
   - Query: `{{IncomingTickets.selectedRow}}`
   - API: GET `/api/customer-service/ai-assist`
   - Display suggested responses with "Use This" buttons

3. **Sentiment Trend Chart**
   - Query: Aggregate sentiment by day/week
   - Visualization: Line chart showing sentiment trends

4. **Escalation Queue**
   - Filter: `escalated == true`
   - Auto-refresh every 30 seconds

---

## 📊 Monitoring & Metrics

### Key Performance Indicators

Create `/services/customer-service-ai/metrics.py`:

```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Metrics
inquiries_total = Counter('cs_inquiries_total', 'Total inquiries processed', ['category', 'channel'])
response_time = Histogram('cs_response_time_seconds', 'Response generation time')
escalations_total = Counter('cs_escalations_total', 'Total escalations', ['reason'])
sentiment_distribution = Gauge('cs_sentiment_distribution', 'Sentiment distribution', ['sentiment'])
confidence_scores = Histogram('cs_confidence_scores', 'Confidence score distribution')

def track_inquiry(category: str, channel: str, sentiment: str, confidence: float, escalated: bool, processing_time: float):
    """Track inquiry metrics"""
    inquiries_total.labels(category=category, channel=channel).inc()
    response_time.observe(processing_time)
    sentiment_distribution.labels(sentiment=sentiment).set(1)
    confidence_scores.observe(confidence)
    
    if escalated:
        escalations_total.labels(reason='automated').inc()
```

### Grafana Dashboard

Create dashboard with panels for:
- Inquiries per hour (line chart)
- Response time distribution (histogram)
- Sentiment breakdown (pie chart)
- Escalation rate (gauge)
- Top categories (bar chart)

---

## 🧪 Testing

### Unit Tests

Create `/services/customer-service-ai/tests/test_api.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_analyze_inquiry():
    response = client.post(
        "/analyze-inquiry",
        json={
            "inquiry_text": "What is your turnaround time?",
            "channel": "email"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "response_text" in data
    assert "sentiment" in data
    assert "category" in data

def test_faq_search():
    response = client.post(
        "/faq-search",
        json={
            "query": "turnaround time",
            "top_k": 3
        }
    )
    assert response.status_code == 200
    assert "results" in response.json()

def test_sentiment_analysis():
    response = client.post(
        "/sentiment",
        json={"text": "I am very unhappy with my order!"}
    )
    assert response.status_code == 200
    assert response.json()["sentiment"] in ["negative", "very_negative"]
```

### Integration Tests

Test end-to-end flow:
1. Customer submits inquiry via Botpress
2. AI service analyzes and generates response
3. Response logged in Strapi
4. Agent views in Appsmith dashboard

---

## 📈 Success Metrics & KPIs

### Target Metrics (90 Days Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **FAQ Automation Rate** | 80% | % inquiries resolved without human intervention |
| **Average Response Time** | < 2s | Time from inquiry to AI response |
| **Response Accuracy** | > 85% | % of AI responses marked helpful by customers |
| **Escalation Rate** | < 15% | % of inquiries requiring human takeover |
| **Customer Satisfaction** | +20% | Delta in CSAT scores |
| **Agent Productivity** | +40% | Increase in tickets handled per agent/hour |
| **Cost per Ticket** | -60% | Reduction in average cost per inquiry |

### Monitoring Dashboard

Access at: `http://localhost:3001/dashboards/customer-service-ai`

---

## 🔧 Operations Guide

### Starting the Service

```bash
# Start AI infrastructure
docker-compose -f docker-compose.ai.yml up -d

# Initialize knowledge base
docker exec -it printshop-cs-ai python scripts/init_knowledge_base.py

# Verify services
curl http://localhost:5000/health
curl http://localhost:8000/api/v1/heartbeat
curl http://localhost:11434/api/tags
```

### Updating Knowledge Base

```bash
# Add new FAQs
docker exec -it printshop-cs-ai python scripts/update_knowledge_base.py \
  --add-faq "What are your hours?" "We're open Monday-Friday 9am-5pm EST."

# Rebuild embeddings
docker exec -it printshop-cs-ai python scripts/rebuild_embeddings.py
```

### Monitoring & Alerts

Configure alerts in Grafana:
- Response time > 5s (Warning)
- Escalation rate > 30% (Critical)
- Service down (Critical)
- Sentiment trending negative (Warning)

---

## 🚨 Troubleshooting

### Common Issues

**Issue: Slow Response Times**
```bash
# Check LLM service
docker logs printshop-llm

# Verify GPU utilization (if available)
nvidia-smi

# Solution: Reduce max_tokens or use smaller model
```

**Issue: Poor Response Quality**
```bash
# Update prompts
vim services/customer-service-ai/prompts/response_generation.txt

# Retrain with more examples
python scripts/fine_tune_classifier.py --data new_training_data.json
```

**Issue: Vector DB Connection Errors**
```bash
# Check ChromaDB health
curl http://localhost:8000/api/v1/heartbeat

# Restart if needed
docker-compose restart vector-db
```

---

## 📚 Additional Resources

- [LLM Prompt Engineering Guide](../architecture/ai-prompt-engineering.md)
- [Vector Database Optimization](../deployment/vector-db-optimization.md)
- [AI Service Scaling Guide](../deployment/ai-scaling.md)
- [Sentiment Analysis Best Practices](../architecture/sentiment-analysis.md)

---

## 🎯 Next Steps

1. **Week 12:** Deploy infrastructure and core AI service
2. **Week 13:** Integrate with Strapi/Botpress/Appsmith
3. **Week 14:** Load testing and optimization
4. **Week 15:** Monitor metrics and iterate on prompts

For questions or issues, see the [AI Assistants Overview](./phase-4-ai-assistants.md) or open a GitHub issue.

---

**Status:** ✅ Implementation Guide Complete  
**Last Updated:** November 2024  
**Maintainer:** PrintShop OS Team
