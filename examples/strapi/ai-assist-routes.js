/**
 * AI Assist Routes for Strapi
 * 
 * Installation:
 * Copy to: /src/api/customer-service/routes/ai-assist.js
 */

module.exports = {
  routes: [
    // Analyze customer inquiry
    {
      method: 'POST',
      path: '/customer-service/ai-assist',
      handler: 'ai-assist.analyzeInquiry',
      config: {
        auth: false, // Set to true if authentication required
        policies: [],
        middlewares: [],
      },
    },
    
    // Search FAQ
    {
      method: 'GET',
      path: '/customer-service/faq-search',
      handler: 'ai-assist.searchFAQ',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    
    // Analyze sentiment
    {
      method: 'POST',
      path: '/customer-service/sentiment',
      handler: 'ai-assist.analyzeSentiment',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    
    // Get interaction by ID
    {
      method: 'GET',
      path: '/customer-service/interaction/:id',
      handler: 'ai-assist.getInteraction',
      config: {
        auth: true, // Require authentication
        policies: [],
        middlewares: [],
      },
    },
    
    // Update interaction
    {
      method: 'PUT',
      path: '/customer-service/interaction/:id',
      handler: 'ai-assist.updateInteraction',
      config: {
        auth: true,
        policies: [],
        middlewares: [],
      },
    },
    
    // Get metrics
    {
      method: 'GET',
      path: '/customer-service/metrics',
      handler: 'ai-assist.getMetrics',
      config: {
        auth: true,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
