/**
 * Appsmith Queries for Customer Service AI Dashboard
 * 
 * Installation:
 * 1. Create a new Appsmith page "Support Dashboard"
 * 2. Add these queries in the Query Editor
 * 3. Configure Strapi datasource
 * 4. Bind queries to UI widgets
 */

// =============================================================================
// Query 1: Get Pending Support Tickets
// =============================================================================
// Name: GetPendingTickets
// Type: REST API / Strapi Connection
// Method: GET
// URL: {{strapiUrl}}/api/support-interactions

{
  filters: {
    resolved: { $eq: false }
  },
  sort: ['created_at:desc'],
  pagination: {
    page: 1,
    pageSize: 50
  },
  populate: ['customer']
}

// Response will include sentiment, category, escalated status
// Use in Table widget to display pending tickets

// =============================================================================
// Query 2: Get AI Suggestions for Selected Ticket
// =============================================================================
// Name: GetAISuggestions
// Type: REST API
// Method: POST
// URL: {{strapiUrl}}/api/customer-service/ai-assist

{
  inquiry_text: {{TicketsTable.selectedRow.inquiry}},
  customer_id: {{TicketsTable.selectedRow.customer_id}},
  channel: 'dashboard'
}

// Triggered when a row is selected in TicketsTable
// Returns suggested responses for agent

// =============================================================================
// Query 3: Search FAQ
// =============================================================================
// Name: SearchFAQ
// Type: REST API
// Method: GET
// URL: {{strapiUrl}}/api/customer-service/faq-search

{
  params: {
    query: {{SearchInput.text}},
    top_k: 5
  }
}

// Triggered by search input
// Display results in List widget

// =============================================================================
// Query 4: Update Ticket Status
// =============================================================================
// Name: ResolveTicket
// Type: REST API
// Method: PUT
// URL: {{strapiUrl}}/api/customer-service/interaction/{{TicketsTable.selectedRow.id}}

{
  resolved: true,
  agent_id: {{appsmith.user.email}},
  agent_response: {{ResponseTextarea.text}}
}

// Triggered by "Resolve" button
// Updates ticket status

// =============================================================================
// Query 5: Get Support Metrics
// =============================================================================
// Name: GetSupportMetrics
// Type: REST API
// Method: GET
// URL: {{strapiUrl}}/api/customer-service/metrics

{
  params: {
    start_date: {{moment().subtract(30, 'days').format('YYYY-MM-DD')}},
    end_date: {{moment().format('YYYY-MM-DD')}}
  }
}

// Display in Chart and Stat Box widgets
// Refresh every 5 minutes

// =============================================================================
// Query 6: Get Sentiment Trend
// =============================================================================
// Name: GetSentimentTrend
// Type: SQL / Strapi API
// For direct database access:

SELECT 
  DATE(created_at) as date,
  sentiment,
  COUNT(*) as count
FROM support_interactions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at), sentiment
ORDER BY date DESC

// Use in Line Chart widget to show sentiment over time

// =============================================================================
// Query 7: Get Category Distribution
// =============================================================================
// Name: GetCategoryDistribution
// Type: SQL / Strapi API

SELECT 
  category,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence
FROM support_interactions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY category
ORDER BY count DESC

// Use in Pie Chart widget

// =============================================================================
// Query 8: Get Escalated Tickets
// =============================================================================
// Name: GetEscalatedTickets
// Type: REST API
// Method: GET
// URL: {{strapiUrl}}/api/support-interactions

{
  filters: {
    escalated: { $eq: true },
    resolved: { $eq: false }
  },
  sort: ['created_at:desc']
}

// Display in separate "Escalation Queue" table
// Highlight urgent items

// =============================================================================
// Query 9: Analyze Sentiment (Real-time)
// =============================================================================
// Name: AnalyzeSentiment
// Type: REST API
// Method: POST
// URL: {{strapiUrl}}/api/customer-service/sentiment

{
  text: {{ResponseTextarea.text}}
}

// Triggered on ResponseTextarea change
// Show sentiment indicator as agent types

// =============================================================================
// Query 10: Get Recent Interactions by Customer
// =============================================================================
// Name: GetCustomerHistory
// Type: REST API
// Method: GET
// URL: {{strapiUrl}}/api/support-interactions

{
  filters: {
    customer_id: { $eq: {{TicketsTable.selectedRow.customer_id}} }
  },
  sort: ['created_at:desc'],
  pagination: {
    pageSize: 10
  }
}

// Display customer interaction history
// Shows previous inquiries and sentiment trends

// =============================================================================
// Example Widget Bindings
// =============================================================================

/*
1. Tickets Table Widget:
   - Data: {{GetPendingTickets.data}}
   - Columns: 
     * ID, Customer, Inquiry, Sentiment, Category, Confidence, Created At
   - Row selection: Triggers GetAISuggestions and GetCustomerHistory
   - Cell styling: Conditional formatting based on sentiment
   
2. AI Suggestions Panel:
   - Title: "AI-Generated Response Suggestions"
   - Primary Response: {{GetAISuggestions.data.data.response_text}}
   - Confidence: {{GetAISuggestions.data.data.confidence}}
   - Alternative suggestions: List widget with suggested_responses array
   - "Use This" buttons: Copy to ResponseTextarea
   
3. Response Composer:
   - Textarea widget: ResponseTextarea
   - On change: Trigger AnalyzeSentiment (debounced 1s)
   - Sentiment indicator: Icon based on AnalyzeSentiment.data.sentiment
   - Submit button: Trigger ResolveTicket
   
4. Metrics Dashboard:
   - Total Interactions: Stat Box with GetSupportMetrics.data.total_interactions
   - Escalation Rate: Stat Box with GetSupportMetrics.data.escalation_rate
   - Resolution Rate: Stat Box with GetSupportMetrics.data.resolution_rate
   - Sentiment Chart: Line Chart with GetSentimentTrend.data
   - Category Chart: Pie Chart with GetCategoryDistribution.data
   
5. FAQ Search:
   - Search Input: SearchInput
   - Results List: SearchFAQ.data.results
   - Click result: Insert into ResponseTextarea
   
6. Escalation Queue:
   - Table widget: GetEscalatedTickets.data
   - Auto-refresh: Every 30 seconds
   - Alert badge: Count of escalated items
*/

// =============================================================================
// Color Scheme for Sentiment
// =============================================================================

const sentimentColors = {
  'very_negative': '#d32f2f',  // Red
  'negative': '#f57c00',        // Orange
  'neutral': '#757575',          // Gray
  'positive': '#388e3c'          // Green
};

// Apply in table cell styling:
// backgroundColor: sentimentColors[currentRow.sentiment]

// =============================================================================
// Auto-refresh Configuration
// =============================================================================

// Configure these queries to auto-refresh:
// - GetPendingTickets: Every 60 seconds
// - GetEscalatedTickets: Every 30 seconds
// - GetSupportMetrics: Every 300 seconds (5 minutes)

// In query settings:
// Run query on page load: true
// Request confirmation before running: false
// Query timeout (ms): 30000
