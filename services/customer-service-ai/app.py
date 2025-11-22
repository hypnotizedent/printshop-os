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
