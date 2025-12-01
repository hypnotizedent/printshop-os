# 🤖 AI & Automation Epic - Consolidated

**Status:** Phase 3-4 - Advanced Intelligence  
**Priority:** MEDIUM  
**Effort:** 5-6 weeks  
**Dependencies:** Strapi (Phase 1), Core Systems operational

---

## 📋 Epic Overview

**Goal:** Build AI-powered automation that enables:
- ✅ Intelligent workflow automation (n8n orchestration)
- ✅ Design metadata extraction (AI vision)
- ✅ Customer intelligence assistant (GenAI chatbot)
- ✅ Smart pricing recommendations (ML models)
- ✅ Order forecasting & demand planning
- ✅ Quality control automation (image analysis)
- ✅ Document processing (invoice/PO extraction)
- ✅ Supplier data enrichment

**Why This Matters:**
- Automation = 40% faster processing (no manual data entry)
- AI insights = 25% better pricing decisions
- Predictive = Inventory optimization
- Chatbot = 70% support request deflection
- Quality AI = Fewer reprints ($$$)

---

## 🎯 Consolidated Sub-Tasks

### Phase 1: Foundation & Infrastructure (Week 1-2)

#### Sub-Task 1: AI/ML Stack Decision & Setup (Issue #69)
**What:** Select and deploy AI infrastructure

**Stack Options:**

**Option A: LLM-First Approach (Recommended)**
```
Frontend
   ↓
OpenAI API (GPT-4 Turbo)
   ↓
Retrieval-Augmented Generation (RAG)
   ↓
Vector Database (Pinecone or Weaviate)
   ↓
Knowledge Base (PDFs, SOPs, pricing rules)
```

**Option B: Self-Hosted ML**
```
Ollama (local LLM running)
   ↓
Hugging Face models
   ↓
Sentence transformers (embeddings)
```

**Recommended Stack:**
- **LLM:** OpenAI GPT-4 Turbo ($0.01/1K tokens)
- **Vector DB:** Pinecone (free tier + $0.10/1M vectors)
- **Embeddings:** OpenAI embeddings API
- **Orchestration:** n8n (workflows)
- **Backend:** Express.js
- **Knowledge Base:** PDF uploads + markdown docs

**Setup Tasks:**
- ✅ OpenAI API account & keys
- ✅ Pinecone setup & index creation
- ✅ n8n instance deployment
- ✅ Vector embedding pipeline
- ✅ Initial knowledge base ingestion

**Cost Model:**
- OpenAI: $50-200/month (depending on usage)
- Pinecone: Free tier (1GB free)
- n8n: Free tier or $10/month
- Hosting: $20-50/month

**Effort:** 3-4 days  
**Priority:** CRITICAL  
**Blockers:** None

---

#### Sub-Task 2: Retrieval-Augmented Generation (RAG) System (Issue #70)
**What:** Create knowledge base for AI to reference

**Knowledge Base Content:**
```
1. Company SOPs
   ├─ Screen Printing Guide (12 sections)
   ├─ DTG Process Guide (8 sections)
   ├─ Embroidery Guide (10 sections)
   └─ Shipping & Packaging (6 sections)

2. Pricing Rules
   ├─ Base pricing by service
   ├─ Modifier rules (color count, stitch count)
   ├─ Volume discounts
   ├─ Rush charges
   └─ Special pricing scenarios

3. Customer FAQs
   ├─ Design requirements
   ├─ Turnaround times
   ├─ Troubleshooting common issues
   └─ Account management

4. Supplier Data
   ├─ SanMar product specs
   ├─ S&S Activewear specs
   ├─ Pricing history
   └─ Availability info

5. Historical Context
   ├─ Past quotes (anonymized)
   ├─ Decision patterns
   ├─ Quality lessons learned
   └─ Cost analysis data
```

**Implementation:**
```javascript
// Example: Load PDFs into vector database
const documents = [
  {id: 'sop-screen-1', content: '...', source: 'SOPs'},
  {id: 'pricing-rules', content: '...', source: 'Rules'},
  // ... more documents
];

// Convert to embeddings
const embeddings = await openai.createEmbeddings({
  input: documents.map(d => d.content),
  model: "text-embedding-3-small"
});

// Store in Pinecone
await pinecone.upsert(
  documents.map((doc, i) => ({
    id: doc.id,
    values: embeddings.data[i].embedding,
    metadata: {content: doc.content, source: doc.source}
  }))
);

// Later: Retrieve relevant docs for AI query
const query = "What's the setup fee for screen printing?";
const queryEmbedding = await openai.createEmbedding({
  input: query,
  model: "text-embedding-3-small"
});
const relevant = await pinecone.query(queryEmbedding, topK: 3);
```

**Features:**
- ✅ Auto-index new SOPs
- ✅ Semantic search (find relevant docs, not keyword matching)
- ✅ Source tracking (AI cites where it learned something)
- ✅ Version control (rollback bad information)
- ✅ Admin panel to manage knowledge base

**Effort:** 3-4 days  
**Priority:** HIGH  
**Blockers:** Sub-task 1

---

### Phase 2: AI Assistants (Week 2-3)

#### Sub-Task 3: Customer Inquiry Chatbot (Issue #71)
**What:** GenAI assistant for customer questions

**Capabilities:**
```
Customer: "What's the turnaround time for 100 DTG shirts?"

AI Response:
"Our standard DTG turnaround is 5-7 business days.
For 100 shirts, that's typically 6 days. We can do
2-day rush for an additional $0.50/shirt (+$50 total).

Your next available start date is November 25.
Expected delivery: December 1st.

Would you like me to create a quick quote?"

Customer: "Yes, but what if we need them by Nov 28?"

AI Response:
"That's unfortunately too soon for standard DTG.
Your options:
1. Rush DTG (Nov 28-30) - $50 rush fee
2. Screen printing (Nov 25-26) - Better for bulk,
   requires 2-color max design, $150 setup fee

Which would you prefer?"
```

**Integration Points:**
- ✅ Website contact form
- ✅ Customer portal chat
- ✅ Slack channel (auto-respond to #customer-questions)
- ✅ Email (forward@customer-assistant.ai)

**Features:**
- ✅ Answer FAQs without human intervention
- ✅ Generate quotes on the fly
- ✅ Escalate to humans for complex issues
- ✅ Learn from feedback (thumbs up/down)
- ✅ Maintain conversation context
- ✅ Multi-language support (Spanish, French)

**Training Data:**
- ✅ Historical customer emails
- ✅ FAQ documents
- ✅ SOP guides
- ✅ Pricing rules
- ✅ Feedback from support team

**Effort:** 3-4 days  
**Priority:** HIGH  
**Blockers:** Sub-task 2

---

#### Sub-Task 4: Design Analysis AI (Computer Vision)
**What:** Analyze uploaded design files for feasibility

**Capabilities:**
```
User uploads: design.png (300x300px, 12-color gradient)

AI Analysis:
⚠️ Image too small for screen printing
   Recommendation: Resize to at least 800x800px

⚠️ Too many colors (12)
   Screen printing limit: 6 colors maximum
   Recommendations:
   1. Reduce to 6 colors (better quality)
   2. Use DTG instead (unlimited colors, $4/shirt)

⚠️ Gradient detected
   Screen printing doesn't support gradients
   Options:
   1. Posterize to 4 solid colors
   2. Use DTG printing (smooth gradient support)

✅ Recommended service: DTG Printing
   Est. price: $4.50/shirt + $50 setup
   Quality: Excellent
```

**Computer Vision Tasks:**
- ✅ Color count detection (how many colors?)
- ✅ Gradient detection (warning: can't screen print)
- ✅ Text detection & clarity check
- ✅ Resolution analysis (DPI check)
- ✅ Bleed area detection
- ✅ Service recommendation (screen print vs DTG vs embroidery)

**Implementation:**
```python
# Example: Design analysis
from PIL import Image
import numpy as np

def analyze_design(image_path):
    img = Image.open(image_path)
    
    # Color count
    colors = img.quantize().getcolors()
    color_count = len(colors)
    
    # Resolution check
    dpi = 300  # assumed
    width_inches = img.width / dpi
    height_inches = img.height / dpi
    
    # Gradient detection (std dev of adjacent pixels)
    gradient_score = detect_gradients(img)
    
    # Recommendations
    recommendations = []
    if color_count > 6:
        recommendations.append("TOO_MANY_COLORS_USE_DTG")
    if gradient_score > 0.7:
        recommendations.append("HAS_GRADIENT_USE_DTG")
    if width_inches < 2:
        recommendations.append("TOO_SMALL_INCREASE_SIZE")
    
    return {
        'color_count': color_count,
        'dimensions': f"{width_inches:.1f} x {height_inches:.1f} inches",
        'gradient_score': gradient_score,
        'recommendations': recommendations
    }
```

**Effort:** 3-4 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 1

---

#### Sub-Task 5: Smart Pricing AI (Issue #72)
**What:** ML model for dynamic pricing recommendations

**Model Inputs:**
- Demand (based on historical patterns)
- Inventory levels (bulk stock availability)
- Time of year (seasonality)
- Order size (volume discounts)
- Rush premium (turnaround time)
- Supplier costs (real-time)
- Competitor pricing (market research)
- Profit margins (desired)

**Example:**
```
Standard pricing: $500 for 100 T-shirts

Dynamic price based on:
- High demand today (+$20 rush buffer)
- DTG ink running low (+$10 margin adjustment)
- Bulk supplier has sale (-$15 pass-through)
- Weekend order (-$5 scheduling benefit)

Recommended price: $510 (vs standard $500)

Expected profit: $150 (30% margin)
Historical margin: 28%
Optimization: +2% margin improvement
```

**ML Implementation:**
- ✅ Train on historical pricing & order data
- ✅ A/B test new pricing (random sample gets new price)
- ✅ Measure impact on conversion & margin
- ✅ Auto-optimize based on feedback
- ✅ Manual override capability (sales team)

**Effort:** 4-5 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 1, Pricing System

---

### Phase 3: Workflow Automation (Week 3-4)

#### Sub-Task 6: n8n Workflow Orchestration (Issue #73)
**What:** Build automated workflows using n8n

**Key Workflows:**

**Workflow 1: Quote → Order → Production**
```
1. Quote approved in portal
   ↓
2. n8n triggers
   ├─ Create order in Strapi
   ├─ Send notification email
   ├─ Add to production queue
   ├─ Notify supplier (if needed)
   └─ Update inventory

3. Send to production dashboard
```

**Workflow 2: Order → Shipping**
```
1. Job marked "Ready to Ship" on prod dashboard
   ↓
2. n8n triggers
   ├─ Generate packing slip (PDF)
   ├─ Generate shipping label (EasyPost)
   ├─ Update tracking in Strapi
   ├─ Send tracking email to customer
   └─ Update QuickBooks (accounting)
```

**Workflow 3: Supplier Data Sync**
```
1. Runs daily at 2 AM
   ↓
2. n8n triggers
   ├─ Fetch SanMar catalog (REST API)
   ├─ Fetch S&S Activewear catalog
   ├─ Update Strapi product database
   ├─ Check for price changes
   ├─ Alert if item discontinued
   └─ Update supplier inventory cache
```

**Workflow 4: Customer Inquiry Triage**
```
1. New email arrives at support@printshop.com
   ↓
2. n8n intercepts
   ├─ Extract sender email & content
   ├─ Send to AI for classification
   ├─ If FAQ: auto-reply with answer
   ├─ If complex: create support ticket
   └─ Notify support team
```

**Workflow 5: Invoice & Payment Processing**
```
1. Quote approved & paid
   ↓
2. n8n triggers
   ├─ Generate invoice (PDF)
   ├─ Send to customer email
   ├─ Record in QuickBooks
   ├─ Update AR aging
   └─ Create weekly AR report
```

**n8n Configuration:**
```json
{
  "name": "Quote to Production Workflow",
  "nodes": [
    {
      "name": "Strapi Trigger - Quote Approved",
      "type": "webhook",
      "event": "quote.approved"
    },
    {
      "name": "Create Order",
      "type": "strapi",
      "action": "create",
      "resource": "orders"
    },
    {
      "name": "Send Email",
      "type": "sendgrid",
      "template": "order_confirmation"
    },
    {
      "name": "Add to Queue",
      "type": "redis",
      "action": "lpush",
      "key": "production_queue"
    }
  ],
  "connections": [
    {"from": 0, "to": 1},
    {"from": 1, "to": 2},
    {"from": 1, "to": 3}
  ]
}
```

**Effort:** 4-5 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 1

---

#### Sub-Task 7: Document Processing & Data Extraction (Issue #74)
**What:** Automate PO/invoice parsing and data entry

**Use Cases:**

**Case 1: Customer POs**
```
Incoming PDF: customer_po.pdf

AI extracts:
├─ Customer name: "Acme Corp"
├─ PO number: "PO-2025-5678"
├─ Items: 
│  ├─ 100x T-shirts (color: navy)
│  └─ 50x Polo (color: white)
├─ Delivery date: Dec 10, 2025
├─ Special instructions: "Rush - expedite"
├─ Contact: john@acme.com
└─ Cost: $2,500 (if specified)

Result: Auto-create order in Strapi
        Send quote to customer
        Add to production queue
```

**Case 2: Supplier Invoices**
```
Incoming PDF: sanmar_invoice.pdf

AI extracts:
├─ Supplier: SanMar
├─ Invoice #: INV-20251120
├─ Items: 500 blank T-shirts @ $3.50 = $1,750
├─ Subtotal: $1,750
├─ Tax: $140
├─ Shipping: $50
├─ Total: $1,940
└─ Due date: Dec 5, 2025

Result: Create bill in QuickBooks
        Update inventory count
        Alert if discrepancy
```

**Implementation:**
```python
from azure.ai.documentintelligence import DocumentIntelligenceClient

def extract_invoice_data(pdf_file):
    client = DocumentIntelligenceClient(
        endpoint="https://...",
        credential=AzureKeyCredential(api_key)
    )
    
    with open(pdf_file, "rb") as f:
        poller = client.begin_analyze_document(
            "prebuilt-invoice",
            f
        )
    
    result = poller.result()
    
    # Extracted fields
    invoice_data = {
        'vendor': result.documents[0].fields.get('VendorName').value,
        'invoice_number': result.documents[0].fields.get('InvoiceId').value,
        'due_date': result.documents[0].fields.get('DueDate').value,
        'items': [
            {
                'description': item.fields.get('Description').value,
                'quantity': item.fields.get('Quantity').value,
                'unit_price': item.fields.get('UnitPrice').value,
                'amount': item.fields.get('Amount').value
            }
            for item in result.documents[0].fields.get('Items').value
        ],
        'total': result.documents[0].fields.get('Total').value
    }
    
    return invoice_data
```

**Effort:** 3-4 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 1

---

### Phase 4: Monitoring & Optimization (Week 4-5)

#### Sub-Task 8: Demand Forecasting
**What:** Predict orders to optimize production planning

**Forecast Model:**
```
Historical data inputs:
├─ Past 2 years of orders
├─ Seasonal patterns (holiday rush, summer slowdown)
├─ Customer segments (corporate vs retail)
├─ Day of week (Mondays vs Fridays)
└─ Marketing campaigns (email blasts, social posts)

Output: 30-day rolling forecast
├─ Expected order volume
├─ By service type (screen print, DTG, embroidery)
├─ By customer segment
└─ Confidence intervals
```

**Use Cases:**
- Plan staff scheduling (hire temps for busy weeks)
- Order supplier inventory in advance
- Allocate equipment capacity
- Plan rush premium opportunities
- Forecast revenue/cash flow

**Effort:** 2-3 days  
**Priority:** LOW  
**Blockers:** Sub-task 1

---

#### Sub-Task 9: Quality Control AI (Computer Vision)
**What:** Automated quality checks on finished products

**Quality Checks:**
```
After production, before shipping:

1. Photo capture (phone or fixed camera)
2. AI analyzes for:
   ├─ Print quality (color accuracy, coverage)
   ├─ Defects (smudges, runs, thin spots)
   ├─ Alignment (design in right position)
   ├─ Crookedness (not straight)
   ├─ Damage (tears, holes)
   ├─ Stitch quality (embroidery)
   └─ Size verification

3. Confidence score:
   ├─ Pass (>95% confidence) → Ship
   ├─ Review (70-95%) → Human inspection
   └─ Fail (<70%) → Reject & reprint
```

**ROI:**
- Catch 85% of defects before shipping
- Avoid rework costs (~$200-500/incident)
- Improve customer satisfaction (fewer returns)
- Build quality reputation

**Effort:** 3-4 days  
**Priority:** LOW  
**Blockers:** Sub-task 1

---

#### Sub-Task 10: Analytics Dashboard & KPIs
**What:** Monitor AI system performance

**Metrics:**
```
AI Chatbot
├─ Questions handled: 1,200/month
├─ Human escalation rate: 15%
├─ User satisfaction: 4.3/5 stars
├─ Response time: <2 seconds
└─ Cost/query: $0.02

Design Analysis AI
├─ Designs analyzed: 450/month
├─ Accuracy: 92%
├─ Prevented errors: 23 ($4,600 saved)
└─ Processing time: <5 seconds

Pricing AI
├─ Quotes generated: 380/month
├─ Conversion rate: 42% (vs 38% baseline)
├─ Average margin improvement: +2.1%
└─ Monthly revenue impact: +$8,500

n8n Workflows
├─ Automations run: 2,400/month
├─ Success rate: 99.1%
├─ Manual data entry saved: 40 hrs/month
└─ Value: $1,600/month
```

**Effort:** 2-3 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 6

---

## 📊 Success Metrics

| Metric | Target | Current | Improvement |
|--------|--------|---------|------------|
| **Support Response Time** | <2 min | - | AI handles 70% instantly |
| **Quote Turnaround** | <4 hrs | 6 hrs | +40% faster |
| **Manual Data Entry** | -80% | 100% | Save 50 hrs/month |
| **Pricing Margin** | +3% | 28% | 31% average |
| **Production Defects** | <2% | 4% | 50% reduction |
| **Chatbot Satisfaction** | >4.2/5 | N/A | Launch metric |
| **Automation Success Rate** | 99%+ | N/A | Launch metric |

---

## 🚀 Execution Timeline

```
Week 1: AI Foundation
├─ Sub-task 1: AI stack setup (3-4 days)
├─ Sub-task 2: RAG system (3-4 days)

Week 2-3: Assistants
├─ Sub-task 3: Customer chatbot (3-4 days)
├─ Sub-task 4: Design analysis (3-4 days)
├─ Sub-task 5: Pricing AI (4-5 days)

Week 3-4: Automation
├─ Sub-task 6: n8n workflows (4-5 days)
├─ Sub-task 7: Document processing (3-4 days)

Week 5-6: Intelligence
├─ Sub-task 8: Demand forecasting (2-3 days)
├─ Sub-task 9: Quality AI (3-4 days)
├─ Sub-task 10: Analytics dashboard (2-3 days)

Total: 5-6 weeks
```

---

## 💼 Technology Stack

- **LLM:** OpenAI GPT-4 Turbo
- **Vector DB:** Pinecone
- **Embeddings:** OpenAI embeddings API
- **Orchestration:** n8n
- **Computer Vision:** Azure Document Intelligence + OpenAI Vision API
- **ML Forecasting:** scikit-learn or TensorFlow
- **Monitoring:** Datadog or New Relic

---

## 💰 Cost Estimate

```
Monthly Costs:
├─ OpenAI API: $100-200
├─ Pinecone: Free tier (or $10/month)
├─ n8n: Free tier (or $20/month)
├─ Azure Document Intelligence: $50-100
├─ Hosting: $50-100
└─ Total: $250-500/month

Expected ROI:
├─ Support time saved: $2,000/month
├─ Manual data entry saved: $1,600/month
├─ Margin improvement: $8,500/month
├─ Defect reduction: $2,000/month
└─ Net monthly benefit: $13,600/month
└─ Payback period: <1 month
```

---

**Status:** Ready for Phase 3 implementation  
**Created:** November 23, 2025  
**Reference:** Consolidated AI & Automation Epic
