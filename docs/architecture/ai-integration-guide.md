# AI Integration Guide

**Integration points for AI assistants across PrintShop OS**

---

## Overview

This guide explains how to integrate AI assistants with existing PrintShop OS components:
- Strapi (API & Database)
- Botpress (Conversational AI)
- Appsmith (Internal Dashboard)

---

## Strapi Integration

### Custom API Route

Add AI assistance to Strapi for support ticket processing.

**File:** `/api/customer-service/routes/ai-assist.js`

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

**File:** `/api/customer-service/controllers/ai-assist.js`

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

### Data Model

**Support Interaction Model** (`/api/support-interaction/schema.json`):

```json
{
  "kind": "collectionType",
  "collectionName": "support_interactions",
  "info": {
    "singularName": "support-interaction",
    "pluralName": "support-interactions",
    "displayName": "Support Interaction"
  },
  "attributes": {
    "customer_id": {
      "type": "string"
    },
    "inquiry": {
      "type": "text"
    },
    "ai_response": {
      "type": "text"
    },
    "sentiment": {
      "type": "enumeration",
      "enum": ["positive", "neutral", "negative", "very_negative"]
    },
    "category": {
      "type": "string"
    },
    "escalated": {
      "type": "boolean",
      "default": false
    },
    "confidence": {
      "type": "float"
    },
    "agent_id": {
      "type": "string"
    },
    "resolved": {
      "type": "boolean",
      "default": false
    }
  }
}
```

---

## Botpress Integration

### Custom Action: AI Response

**File:** `actions/ai-customer-response.js` in Botpress

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

### Conversation Flow

Add to Botpress flow:

```yaml
# FAQ Handler Node
- id: faq_handler
  type: execute
  action: ai-customer-response
  transitions:
    - condition: temp.shouldEscalate === true
      node: escalate_to_human
    - condition: temp.aiConfidence > 0.7
      node: send_ai_response
    - condition: default
      node: ask_for_clarification

# Send AI Response
- id: send_ai_response
  type: say
  text: "{{temp.aiResponse}}"
  transitions:
    - node: ask_if_helpful

# Escalate to Human
- id: escalate_to_human
  type: say
  text: "Let me connect you with a team member who can better assist you."
  transitions:
    - node: create_ticket
```

---

## Appsmith Integration

### Support Agent Dashboard

#### 1. Data Sources

**Query: Get Pending Tickets**
```sql
SELECT 
  id,
  customer_id,
  inquiry,
  sentiment,
  category,
  confidence,
  escalated,
  created_at
FROM support_interactions
WHERE resolved = false
ORDER BY 
  CASE sentiment
    WHEN 'very_negative' THEN 1
    WHEN 'negative' THEN 2
    ELSE 3
  END,
  created_at DESC
LIMIT 50
```

**Query: Get AI Suggestions**
```javascript
// API call to AI service
{
  url: 'http://strapi:1337/api/customer-service/ai-assist',
  method: 'POST',
  body: {
    inquiry_text: TicketsTable.selectedRow.inquiry,
    customer_id: TicketsTable.selectedRow.customer_id,
    channel: 'dashboard'
  }
}
```

#### 2. UI Components

**Tickets Table:**
```javascript
// Column configuration
{
  columns: [
    { key: 'id', label: 'Ticket #' },
    { key: 'customer_id', label: 'Customer' },
    { key: 'inquiry', label: 'Question', width: 300 },
    { 
      key: 'sentiment', 
      label: 'Mood',
      cellStyle: (cell) => ({
        backgroundColor: 
          cell.value === 'very_negative' ? '#ffebee' :
          cell.value === 'negative' ? '#fff3e0' :
          cell.value === 'positive' ? '#e8f5e9' : '#f5f5f5'
      })
    },
    { key: 'category', label: 'Category' },
    { key: 'confidence', label: 'Confidence', format: 'percent' }
  ],
  onRowSelect: () => {
    // Trigger AI suggestions query
    GetAISuggestionsAPI.run();
  }
}
```

**AI Response Panel:**
```javascript
{
  title: 'AI Suggested Responses',
  data: GetAISuggestionsAPI.data,
  widgets: [
    {
      type: 'text',
      text: GetAISuggestionsAPI.data.response_text,
      actions: [
        {
          label: 'Use This Response',
          onClick: () => {
            ResponseTextarea.setValue(GetAISuggestionsAPI.data.response_text);
          }
        }
      ]
    },
    {
      type: 'list',
      title: 'Alternative Suggestions',
      items: GetAISuggestionsAPI.data.suggested_responses,
      itemActions: [
        {
          label: 'Use',
          onClick: (item) => {
            ResponseTextarea.setValue(item);
          }
        }
      ]
    }
  ]
}
```

**Sentiment Trend Chart:**
```javascript
{
  chartType: 'line',
  xAxis: 'date',
  yAxis: 'sentiment_score',
  dataSource: {
    query: `
      SELECT 
        DATE(created_at) as date,
        AVG(
          CASE sentiment
            WHEN 'very_negative' THEN 1
            WHEN 'negative' THEN 2
            WHEN 'neutral' THEN 3
            WHEN 'positive' THEN 4
          END
        ) as sentiment_score
      FROM support_interactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `
  }
}
```

---

## API Client Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class CustomerServiceAI {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  async analyzeInquiry(inquiryText, customerId = null) {
    try {
      const response = await axios.post(`${this.baseUrl}/analyze-inquiry`, {
        inquiry_text: inquiryText,
        customer_id: customerId,
        channel: 'api'
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing inquiry:', error);
      throw error;
    }
  }

  async searchFAQ(query, topK = 3) {
    try {
      const response = await axios.post(`${this.baseUrl}/faq-search`, {
        query,
        top_k: topK
      });
      return response.data;
    } catch (error) {
      console.error('Error searching FAQ:', error);
      throw error;
    }
  }

  async analyzeSentiment(text) {
    try {
      const response = await axios.post(`${this.baseUrl}/sentiment`, {
        text
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }
}

// Usage
const csAI = new CustomerServiceAI();

const result = await csAI.analyzeInquiry(
  "What's your turnaround time for bulk orders?",
  "cust_12345"
);

console.log('AI Response:', result.response_text);
console.log('Sentiment:', result.sentiment);
console.log('Should Escalate:', result.should_escalate);
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class CustomerServiceAI:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
    
    def analyze_inquiry(
        self, 
        inquiry_text: str, 
        customer_id: Optional[str] = None,
        channel: str = "api"
    ) -> Dict[str, Any]:
        """Analyze customer inquiry and get AI response"""
        response = requests.post(
            f"{self.base_url}/analyze-inquiry",
            json={
                "inquiry_text": inquiry_text,
                "customer_id": customer_id,
                "channel": channel
            }
        )
        response.raise_for_status()
        return response.json()
    
    def search_faq(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """Search FAQ knowledge base"""
        response = requests.post(
            f"{self.base_url}/faq-search",
            json={"query": query, "top_k": top_k}
        )
        response.raise_for_status()
        return response.json()
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze text sentiment"""
        response = requests.post(
            f"{self.base_url}/sentiment",
            json={"text": text}
        )
        response.raise_for_status()
        return response.json()

# Usage
cs_ai = CustomerServiceAI()

result = cs_ai.analyze_inquiry(
    inquiry_text="What's your turnaround time for bulk orders?",
    customer_id="cust_12345"
)

print(f"AI Response: {result['response_text']}")
print(f"Sentiment: {result['sentiment']}")
print(f"Should Escalate: {result['should_escalate']}")
```

---

## Webhooks

### Support Ticket Created Webhook

Automatically analyze new support tickets:

```javascript
// Strapi lifecycle hook
// File: /api/support-ticket/lifecycles.js

const axios = require('axios');

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    // Call AI service
    try {
      const aiResponse = await axios.post(
        'http://cs-ai-api:5000/analyze-inquiry',
        {
          inquiry_text: result.message,
          customer_id: result.customer_id,
          channel: 'ticket',
          ticket_id: result.id
        }
      );
      
      // Update ticket with AI analysis
      await strapi.entityService.update(
        'api::support-ticket.support-ticket',
        result.id,
        {
          data: {
            ai_category: aiResponse.data.category,
            ai_sentiment: aiResponse.data.sentiment,
            ai_suggested_response: aiResponse.data.response_text,
            should_escalate: aiResponse.data.should_escalate
          }
        }
      );
      
      // If escalation needed, notify team
      if (aiResponse.data.should_escalate) {
        // Send notification (email, Slack, etc.)
        await strapi.service('api::notification.notification').send({
          type: 'escalation',
          ticket_id: result.id,
          reason: aiResponse.data.escalation_reason
        });
      }
    } catch (error) {
      strapi.log.error('Failed to analyze ticket:', error);
    }
  }
};
```

---

## Monitoring Integration

### Custom Metrics

Track AI performance in your application:

```javascript
// Track metrics when using AI service
async function handleCustomerInquiry(inquiry, customerId) {
  const startTime = Date.now();
  
  try {
    const result = await csAI.analyzeInquiry(inquiry, customerId);
    
    // Log metrics
    await logMetric({
      metric: 'cs_ai_inquiry_processed',
      value: 1,
      tags: {
        category: result.category,
        sentiment: result.sentiment,
        escalated: result.should_escalate
      }
    });
    
    // Log response time
    await logMetric({
      metric: 'cs_ai_response_time_ms',
      value: Date.now() - startTime
    });
    
    return result;
  } catch (error) {
    await logMetric({
      metric: 'cs_ai_error',
      value: 1,
      tags: { error: error.message }
    });
    throw error;
  }
}
```

---

## Testing Integration

### End-to-End Test

```javascript
const request = require('supertest');

describe('Customer Service AI Integration', () => {
  it('should process inquiry through full stack', async () => {
    // 1. Customer submits inquiry via Botpress
    const botResponse = await request('http://localhost:3000')
      .post('/api/v1/bots/support-bot/converse/user-123')
      .send({ text: "What's your turnaround time?" });
    
    expect(botResponse.status).toBe(200);
    
    // 2. Verify AI analysis in Strapi
    const strapiResponse = await request('http://localhost:1337')
      .get('/api/support-interactions')
      .query({ 'filters[customer_id]': 'user-123' });
    
    expect(strapiResponse.body.data).toHaveLength(1);
    expect(strapiResponse.body.data[0].attributes.category).toBe('shipping');
    
    // 3. Verify in Appsmith (via API)
    const appsmithData = await request('http://localhost:8080')
      .get('/api/v1/queries/get-pending-tickets')
      .set('Authorization', 'Bearer <token>');
    
    expect(appsmithData.body.data.some(
      ticket => ticket.customer_id === 'user-123'
    )).toBe(true);
  });
});
```

---

## Best Practices

1. **Error Handling:** Always handle AI service errors gracefully with fallbacks
2. **Timeouts:** Set reasonable timeouts (30s for LLM calls)
3. **Caching:** Cache FAQ responses for common queries
4. **Rate Limiting:** Implement rate limits to prevent abuse
5. **Logging:** Log all AI interactions for quality monitoring
6. **Feedback Loop:** Collect agent feedback on AI suggestions
7. **Security:** Validate and sanitize all inputs before sending to AI
8. **Privacy:** Mask PII before sending to AI services

---

## Troubleshooting

### Common Integration Issues

**Issue: Strapi can't reach AI service**
```bash
# Verify network connectivity
docker exec -it printshop-strapi ping cs-ai-api

# Check DNS resolution
docker exec -it printshop-strapi nslookup cs-ai-api
```

**Issue: Botpress action fails silently**
```bash
# Enable debug logging in Botpress
# Check logs for error details
docker logs printshop-botpress | grep "ai-customer-response"
```

**Issue: Appsmith query timeout**
```javascript
// Increase timeout in query settings
{
  timeout: 30000, // 30 seconds
  retry: 1
}
```

---

## Additional Resources

- [Phase 4 Overview](../phases/phase-4-ai-assistants.md)
- [Customer Service Assistant Guide](../phases/phase-4-customer-service-assistant.md)
- [API Documentation](http://localhost:5000/docs)
- [Strapi Documentation](https://docs.strapi.io/)
- [Botpress Documentation](https://botpress.com/docs)
- [Appsmith Documentation](https://docs.appsmith.com/)

---

**Last Updated:** November 2024  
**Maintainer:** PrintShop OS Team
