import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["service"] == "customer-service-ai"

def test_analyze_inquiry_turnaround():
    """Test inquiry analysis for turnaround time question"""
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
    assert data["category"] in ["shipping", "general"]
    assert isinstance(data["confidence"], float)

def test_analyze_inquiry_pricing():
    """Test inquiry analysis for pricing question"""
    response = client.post(
        "/analyze-inquiry",
        json={
            "inquiry_text": "How much does a custom t-shirt cost?",
            "channel": "chat",
            "customer_id": "cust_123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "pricing"
    assert len(data["suggested_responses"]) == 3

def test_faq_search():
    """Test FAQ search functionality"""
    response = client.post(
        "/faq-search",
        json={
            "query": "turnaround time",
            "top_k": 3
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert isinstance(data["results"], list)

def test_sentiment_analysis_positive():
    """Test sentiment analysis for positive text"""
    response = client.post(
        "/sentiment",
        json={"text": "I love your service! Great quality prints!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"] in ["positive", "neutral"]

def test_sentiment_analysis_negative():
    """Test sentiment analysis for negative text"""
    response = client.post(
        "/sentiment",
        json={"text": "I am very unhappy with my order!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"] in ["negative", "very_negative"]

def test_escalation_on_negative_sentiment():
    """Test that negative sentiment triggers escalation"""
    response = client.post(
        "/analyze-inquiry",
        json={
            "inquiry_text": "This is terrible! I want a refund immediately!",
            "channel": "email"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["should_escalate"] == True
    assert data["escalation_reason"] is not None

def test_inquiry_missing_text():
    """Test error handling for missing inquiry text"""
    response = client.post(
        "/analyze-inquiry",
        json={"channel": "email"}
    )
    assert response.status_code == 422  # Validation error

def test_faq_search_empty_query():
    """Test FAQ search with empty query"""
    response = client.post(
        "/faq-search",
        json={"query": ""}
    )
    # Should return results even with empty query
    assert response.status_code in [200, 422]

def test_multiple_inquiries():
    """Test processing multiple inquiries"""
    inquiries = [
        "What are your hours?",
        "Do you offer embroidery?",
        "How do I track my order?"
    ]
    
    for inquiry in inquiries:
        response = client.post(
            "/analyze-inquiry",
            json={"inquiry_text": inquiry}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["confidence"] > 0
