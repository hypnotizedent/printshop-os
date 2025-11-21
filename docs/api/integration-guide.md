# Integration Guide - PrintShop OS

## Overview

This guide explains how to integrate new components, services, and features into the PrintShop OS ecosystem. It covers API integration patterns, webhook setup, authentication, error handling, and best practices.

---

## Table of Contents

1. [Integration Patterns](#integration-patterns)
2. [Authentication Methods](#authentication-methods)
3. [API Versioning Strategy](#api-versioning-strategy)
4. [Webhook Setup](#webhook-setup)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Data Synchronization](#data-synchronization)
8. [Testing Integrations](#testing-integrations)
9. [Common Integration Scenarios](#common-integration-scenarios)

---

## Integration Patterns

### REST API Integration (Recommended)

**Advantages:**
- Standard HTTP methods
- Stateless
- Cacheable
- Well understood

**Use for:**
- CRUD operations
- Request-response patterns
- Public APIs

**Example:**
```javascript
// Node.js example
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:1337/api',
  headers: {
    'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Get jobs
const jobs = await api.get('/jobs?filters[Status][$eq]=In Production');

// Create job
const newJob = await api.post('/jobs', {
  data: {
    Status: 'Pending Artwork',
    Quantity: 100,
    customer: 1
  }
});

// Update job
await api.put(`/jobs/${jobId}`, {
  data: {
    Status: 'Complete'
  }
});
```

### Webhook Integration

**Advantages:**
- Real-time notifications
- Event-driven
- Reduces polling
- Efficient

**Use for:**
- Status change notifications
- Real-time updates
- Event-based workflows

**Example:**
```javascript
// Express.js webhook receiver
const express = require('express');
const app = express();

app.post('/webhooks/strapi', express.json(), (req, res) => {
  const { event, model, entry } = req.body;
  
  if (model === 'job' && event === 'entry.update') {
    // Handle job update
    console.log(`Job ${entry.JobID} status changed to ${entry.Status}`);
    
    // Trigger notifications, update external systems, etc.
    if (entry.Status === 'Complete') {
      sendCustomerNotification(entry);
    }
  }
  
  res.status(200).send('OK');
});

app.listen(3001, () => {
  console.log('Webhook server listening on port 3001');
});
```

### GraphQL Integration (Future)

**Advantages:**
- Single endpoint
- Request exactly what you need
- Type-safe
- Efficient

**Use for:**
- Complex queries
- Mobile applications
- Reducing over-fetching

---

## Authentication Methods

### API Token (Current)

**Implementation:**

```javascript
// Store token securely
const API_TOKEN = process.env.STRAPI_API_TOKEN;

// Include in all requests
const headers = {
  'Authorization': `Bearer ${API_TOKEN}`
};

// Make request
const response = await fetch('http://localhost:1337/api/jobs', {
  headers: headers
});
```

**Security Best Practices:**
- Store in environment variables, never in code
- Use different tokens for different services
- Rotate tokens regularly (every 90 days)
- Revoke immediately if compromised
- Use minimum required permissions

### JWT Authentication (Admin/User)

**For authenticated users:**

```javascript
// Login
const loginResponse = await axios.post('http://localhost:1337/api/auth/local', {
  identifier: 'user@example.com',
  password: 'password'
});

const jwt = loginResponse.data.jwt;

// Use JWT for subsequent requests
const userJobs = await axios.get('http://localhost:1337/api/jobs', {
  headers: {
    'Authorization': `Bearer ${jwt}`
  }
});
```

### OAuth 2.0 (Future)

For third-party integrations, OAuth 2.0 flow will be implemented.

---

## API Versioning Strategy

### Current: No Versioning

All endpoints use `/api/` prefix without version number.

### Future: URL Versioning

When breaking changes are introduced:

```
/api/v1/jobs  (current, to be deprecated)
/api/v2/jobs  (new version with breaking changes)
```

### Migration Period

When new version introduced:
1. Announce deprecation 90 days in advance
2. Support both versions for 6 months
3. Provide migration guide
4. Sunset old version with adequate notice

### Version Headers (Alternative)

```http
GET /api/jobs
Accept-Version: 2
```

---

## Webhook Setup

### Configuring Webhooks in Strapi

1. **Navigate to Settings:**
   - Strapi Admin → Settings → Webhooks

2. **Create Webhook:**
   - Name: `Job Status Notifications`
   - URL: `https://your-domain.com/webhooks/strapi`
   - Events: Select relevant events
     - `entry.create`
     - `entry.update`
     - `entry.delete`
   - Headers (optional):
     ```
     X-Webhook-Secret: your-secret-key
     ```

3. **Test Webhook:**
   - Click "Trigger" button
   - Verify payload received

### Webhook Payload Structure

```json
{
  "event": "entry.update",
  "createdAt": "2025-01-20T16:30:00.000Z",
  "model": "job",
  "entry": {
    "id": 1,
    "JobID": "JOB-2025-001",
    "Status": "Complete",
    "Quantity": 100,
    // ... all job fields
  }
}
```

### Webhook Security

**Verify webhook signature:**

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return hash === signature;
}

// In webhook handler
app.post('/webhooks/strapi', (req, res) => {
  const signature = req.headers['x-strapi-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!verifyWebhook(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  // ...
  
  res.status(200).send('OK');
});
```

### Webhook Retry Logic

**Strapi automatically retries failed webhooks:**
- 3 retry attempts
- Exponential backoff
- 1 minute, 5 minutes, 15 minutes

**Your endpoint should:**
- Respond quickly (< 5 seconds)
- Return 2xx status for success
- Be idempotent (handle duplicate events)

### Idempotent Webhook Handler

```javascript
const processedEvents = new Set();

app.post('/webhooks/strapi', async (req, res) => {
  const { event, entry } = req.body;
  const eventId = `${event}-${entry.id}-${entry.updatedAt}`;
  
  // Check if already processed
  if (processedEvents.has(eventId)) {
    console.log('Event already processed, skipping');
    return res.status(200).send('OK');
  }
  
  try {
    // Process event
    await processJobUpdate(entry);
    
    // Mark as processed
    processedEvents.add(eventId);
    
    // Cleanup old events (keep last 1000)
    if (processedEvents.size > 1000) {
      const arr = Array.from(processedEvents);
      processedEvents.clear();
      arr.slice(-500).forEach(id => processedEvents.add(id));
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).send('Error');
  }
});
```

---

## Error Handling

### Handling API Errors

```javascript
async function fetchJobs() {
  try {
    const response = await axios.get('http://localhost:1337/api/jobs');
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status);
      console.error('Message:', error.response.data.error.message);
      
      switch (error.response.status) {
        case 400:
          // Bad request - fix request parameters
          throw new Error('Invalid request parameters');
        case 401:
          // Unauthorized - check API token
          throw new Error('Authentication failed');
        case 403:
          // Forbidden - insufficient permissions
          throw new Error('Access denied');
        case 404:
          // Not found
          throw new Error('Resource not found');
        case 429:
          // Rate limit exceeded - retry with backoff
          await sleep(60000); // Wait 1 minute
          return fetchJobs(); // Retry
        case 500:
          // Server error - retry with exponential backoff
          throw new Error('Server error, please try again');
        default:
          throw new Error(`Unexpected error: ${error.response.status}`);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server');
      throw new Error('Network error');
    } else {
      // Error setting up request
      console.error('Request setup error:', error.message);
      throw error;
    }
  }
}
```

### Retry with Exponential Backoff

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error) {
      const shouldRetry = 
        error.response?.status >= 500 || 
        !error.response;
        
      if (!shouldRetry || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log('Circuit breaker opened');
    }
  }
}

// Usage
const breaker = new CircuitBreaker(5, 60000);

async function fetchJobs() {
  return breaker.execute(async () => {
    const response = await axios.get('http://localhost:1337/api/jobs');
    return response.data;
  });
}
```

---

## Rate Limiting

### Respecting Rate Limits

```javascript
class RateLimitedClient {
  constructor(maxRequests = 100, windowMs = 900000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs; // 15 minutes
    this.requests = [];
  }
  
  async makeRequest(fn) {
    // Clean old requests
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if at limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await sleep(waitTime);
      return this.makeRequest(fn);
    }
    
    // Make request
    this.requests.push(now);
    return fn();
  }
}

// Usage
const client = new RateLimitedClient(100, 900000);

async function fetchJobs() {
  return client.makeRequest(async () => {
    const response = await axios.get('http://localhost:1337/api/jobs');
    return response.data;
  });
}
```

---

## Data Synchronization

### Polling Strategy

```javascript
class DataPoller {
  constructor(interval = 5000) {
    this.interval = interval;
    this.isPolling = false;
    this.lastData = null;
  }
  
  start(fetchFunction, onUpdate) {
    this.isPolling = true;
    this.poll(fetchFunction, onUpdate);
  }
  
  stop() {
    this.isPolling = false;
  }
  
  async poll(fetchFunction, onUpdate) {
    while (this.isPolling) {
      try {
        const data = await fetchFunction();
        
        // Check if data changed
        if (JSON.stringify(data) !== JSON.stringify(this.lastData)) {
          this.lastData = data;
          onUpdate(data);
        }
        
        await sleep(this.interval);
      } catch (error) {
        console.error('Polling error:', error);
        await sleep(this.interval * 2); // Back off on error
      }
    }
  }
}

// Usage
const poller = new DataPoller(5000);

poller.start(
  async () => {
    const response = await axios.get('http://localhost:1337/api/jobs?filters[Status][$eq]=In Production');
    return response.data;
  },
  (data) => {
    console.log('Data updated:', data);
    updateUI(data);
  }
);

// Stop polling when done
// poller.stop();
```

### Real-Time Sync with Webhooks

```javascript
// Combine polling + webhooks for best results
class DataSync {
  constructor() {
    this.poller = new DataPoller(60000); // Poll every minute as backup
    this.data = null;
  }
  
  async start() {
    // Initial fetch
    await this.refresh();
    
    // Start periodic polling
    this.poller.start(
      () => this.fetchData(),
      (data) => this.updateData(data)
    );
    
    // Setup webhook listener
    this.setupWebhooks();
  }
  
  async fetchData() {
    const response = await axios.get('http://localhost:1337/api/jobs');
    return response.data;
  }
  
  updateData(data) {
    this.data = data;
    this.onDataChanged(data);
  }
  
  setupWebhooks() {
    // This would be your webhook receiver endpoint
    // When webhook received, call refresh()
  }
  
  async refresh() {
    const data = await this.fetchData();
    this.updateData(data);
  }
  
  onDataChanged(data) {
    // Override this method
    console.log('Data changed:', data);
  }
}
```

---

## Testing Integrations

### Unit Testing

```javascript
// Using Jest
const axios = require('axios');
jest.mock('axios');

test('fetchJobs returns jobs data', async () => {
  const mockJobs = {
    data: [
      { id: 1, attributes: { JobID: 'JOB-001' } }
    ]
  };
  
  axios.get.mockResolvedValue({ data: mockJobs });
  
  const jobs = await fetchJobs();
  
  expect(jobs).toEqual(mockJobs);
  expect(axios.get).toHaveBeenCalledWith(
    'http://localhost:1337/api/jobs',
    expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': expect.stringContaining('Bearer')
      })
    })
  );
});
```

### Integration Testing

```javascript
// Test against real API
describe('Strapi Integration', () => {
  let customerId;
  let jobId;
  
  beforeAll(async () => {
    // Create test customer
    const response = await axios.post('http://localhost:1337/api/customers', {
      data: {
        Name: 'Test Customer',
        Email: `test-${Date.now()}@example.com`
      }
    }, {
      headers: { 'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}` }
    });
    
    customerId = response.data.data.id;
  });
  
  afterAll(async () => {
    // Cleanup
    if (jobId) {
      await axios.delete(`http://localhost:1337/api/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}` }
      });
    }
    if (customerId) {
      await axios.delete(`http://localhost:1337/api/customers/${customerId}`, {
        headers: { 'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}` }
      });
    }
  });
  
  test('can create job for customer', async () => {
    const response = await axios.post('http://localhost:1337/api/jobs', {
      data: {
        Status: 'Pending Artwork',
        Quantity: 50,
        customer: customerId
      }
    }, {
      headers: { 'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}` }
    });
    
    jobId = response.data.data.id;
    
    expect(response.status).toBe(200);
    expect(response.data.data.attributes.Status).toBe('Pending Artwork');
  });
});
```

---

## Common Integration Scenarios

### Email Service Integration

```javascript
// SendGrid example
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Strapi lifecycle hook
module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    // Send email when job status changes to Complete
    if (result.Status === 'Complete') {
      const customer = await strapi.entityService.findOne(
        'api::customer.customer',
        result.customer.id
      );
      
      await sgMail.send({
        to: customer.Email,
        from: 'noreply@printshop.com',
        subject: `Job ${result.JobID} Complete`,
        text: `Your job ${result.JobID} is complete and ready for pickup!`
      });
    }
  }
};
```

### Payment Gateway Integration

```javascript
// Stripe example
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPayment(jobId, amount) {
  const job = await strapi.entityService.findOne('api::job.job', jobId);
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Amount in cents
    currency: 'usd',
    metadata: {
      jobId: job.JobID
    }
  });
  
  return paymentIntent.client_secret;
}
```

### SMS Notification Integration

```javascript
// Twilio example
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(phoneNumber, message) {
  await twilio.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });
}

// Usage in Strapi hook
module.exports = {
  async afterUpdate(event) {
    const { result } = event;
    
    if (result.Status === 'Complete') {
      await sendSMS(
        result.customer.phone,
        `Job ${result.JobID} is complete!`
      );
    }
  }
};
```

---

## Best Practices

1. **Always use HTTPS in production**
2. **Validate all input data**
3. **Implement proper error handling**
4. **Use environment variables for configuration**
5. **Log all integration activities**
6. **Monitor integration health**
7. **Implement retry logic with backoff**
8. **Respect rate limits**
9. **Test thoroughly before production**
10. **Document your integrations**

---

## Next Steps

- Review [Strapi API Endpoints](strapi-endpoints.md)
- Review [Phase Implementation Guides](../phases/)
- Setup monitoring and alerting

---

**Integration Guide Complete! ✅**
