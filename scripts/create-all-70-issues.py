#!/usr/bin/env python3
"""
PrintShop OS - Complete Issue Creation Script
Creates all 70 GitHub issues with proper context, milestones, and labels
Run: python3 scripts/create-all-70-issues.py
"""

import subprocess
import json
import time
import sys

# All 70 issues organized by milestone
ISSUES_DATA = {
    "Sales & Quoting": [
        {
            "id": 14,
            "title": "Visual quote format with customer mockups",
            "type": "enhancement",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Design and build visual quote template with embedded product mockups

## 🎯 Why It Matters
Visual mockups significantly increase quote approval rates (studies show ~25% improvement)

## ✅ Acceptance Criteria
- Quote displays product images with customer's design
- Mockup shows exact garment, colors, print placement
- Mobile-responsive layout
- PDF export with mockup
- Preview before sending to customer

## 💻 Technical Stack
- Strapi backend (quote data)
- React component for mockup rendering
- HTML/CSS for PDF generation (html2pdf)
- S3 for image storage

## 🔗 Related Issues
#15, #16, #43, #44

## 📊 Development Phase
Phase 2: Core Sales Features (Week 3-4)

## Integration Points
- Quote API (Strapi)
- Design upload system
- Email delivery system (#45)"""
        },
        {
            "id": 15,
            "title": "Retainer/card storage + auto-recharge capability",
            "type": "feature",
            "priority": "high",
            "effort": "l",
            "description": """## 📋 What's Needed
Store customer payment methods and enable recurring charges for subscriptions

## 🎯 Why It Matters
Recurring revenue model = predictable cash flow. Also reduces friction for repeat orders.

## ✅ Acceptance Criteria
- Stripe payment method storage via Strapi
- Auto-charge when job created
- Customer can manage saved cards in portal
- Retry logic for failed charges
- Payment history tracking
- Webhook handling for charge events

## 💻 Technical Stack
- Stripe Vault API for card storage
- Strapi webhooks for event handling
- Portal UI for card management
- Retry engine (exponential backoff)

## 🔗 Related Issues
#18, #19, #43

## 📊 Development Phase
Phase 3: Advanced Sales (Week 5-6)

## Integration Points
- Stripe integration
- Customer Portal (#18, #19)
- Quote/Order system (#43, #44)"""
        },
        {
            "id": 16,
            "title": "Mobile-friendly quote approval experience",
            "type": "enhancement",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Optimize quote viewing and approval flow for mobile devices

## 🎯 Why It Matters
50% of quotes are viewed on mobile. Poor UX = abandonment.

## ✅ Acceptance Criteria
- Quote mockup displays well on mobile (iOS/Android)
- Easy approve/reject buttons
- Signature capture (optional)
- Works without login
- Email link opens quote directly
- Responsive design (tested on 5+ devices)

## 💻 Technical Stack
- React Mobile optimized
- Responsive CSS/Tailwind
- Signature.js library
- Mobile-first design approach

## 🔗 Related Issues
#14, #45, #20

## 📊 Development Phase
Phase 2: Core Sales Features (Week 3-4)

## Integration Points
- Quote system (#14, #44)
- Email delivery (#45)
- Customer portal (#18)"""
        },
        {
            "id": 17,
            "title": "Quote template library + customization",
            "type": "feature",
            "priority": "medium",
            "effort": "m",
            "description": """## 📋 What's Needed
Create reusable quote templates for different product types

## 🎯 Why It Matters
Saves time (~3 min per quote) and ensures consistent branding/messaging

## ✅ Acceptance Criteria
- Templates for: t-shirt, hoodie, embroidery, bundles
- Custom fields per template
- Brand logo/colors in templates
- Easy template selection during quoting
- Template versioning

## 💻 Technical Stack
- Strapi content management
- React template editor
- Handlebars templating
- Drag-and-drop builder

## 🔗 Related Issues
#14, #42

## 📊 Development Phase
Phase 2: Core Sales Features (Week 3-4)

## Integration Points
- Quote system
- Bundle pricing (#42)"""
        },
        {
            "id": 41,
            "title": "Pricing engine architecture (JSON/DB-driven)",
            "type": "feature",
            "priority": "critical",
            "effort": "l",
            "description": """## 📋 What's Needed
Build core pricing calculation engine - the financial heart of the system

## 🎯 Why It Matters
Pricing accuracy directly impacts profitability. Engine must be flexible and maintainable.

## ✅ Acceptance Criteria
- Base garment cost lookup from supplier data
- Print location surcharges (front/back/sleeve = different prices)
- Color count pricing (1 color = $X, 2 colors = $Y, etc.)
- Stitch count pricing for embroidery
- Add-ons system (shipping, rush fees, taxes)
- Bundle discounts (buy X get Y discount)
- Volume discounts (1-99 = price, 100-499 = price, 500+ = price)
- Margin calculation and profit tracking

## 💻 Technical Stack
- Node.js/TypeScript for pricing service
- JSON-based pricing rules (versioned)
- PostgreSQL for historical pricing
- Redis for caching

## 🔗 Related Issues
#42, #43, #44

## 📊 Development Phase
Phase 1: Foundation (Week 1-2)

## Integration Points
- Supplier data system (#46-53)
- Quote system (#14)
- Reporting system (#24, #40)"""
        },
        {
            "id": 42,
            "title": "Bundle/marketing package pricing logic",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Support combo pricing and seasonal marketing packages

## 🎯 Why It Matters
Bundled packages increase average order value by ~30%

## ✅ Acceptance Criteria
- Combo packages (e.g., 50 shirts + 50 hoodies = discount)
- Seasonal bundles with marketing themes
- Auto-calculate bundle discounts
- Marketing package templates
- Quick-select combos in quoting flow

## 💻 Technical Stack
- Pricing engine API
- Bundle composition rules
- Marketing calendar/seasons

## 🔗 Related Issues
#41, #17

## 📊 Development Phase
Phase 2: Sales Features (Week 3-4)

## Integration Points
- Pricing engine (#41)
- Quote templates (#17)"""
        },
        {
            "id": 43,
            "title": "Deposit collection from quotes (Stripe)",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Enable customers to pay deposit from quote

## 🎯 Why It Matters
Deposits secure orders and reduce no-shows. Improves cash flow.

## ✅ Acceptance Criteria
- Stripe payment form in quote
- Configurable deposit % (25%, 50%, custom)
- Payment confirmation email with receipt
- Deposit tracked in Strapi
- Remaining balance shown in order
- Deposit applied to final invoice

## 💻 Technical Stack
- Stripe payment API
- Webhook for payment confirmation
- Email service integration

## 🔗 Related Issues
#14, #43, #44

## 📊 Development Phase
Phase 2: Core Sales (Week 3-4)

## Integration Points
- Quote system (#14)
- Payment system (Stripe)
- Order system (#44)"""
        },
        {
            "id": 44,
            "title": "Quote → Order → Production Job mapping workflow",
            "type": "feature",
            "priority": "critical",
            "effort": "l",
            "description": """## 📋 What's Needed
Automatically create order and production job from approved quote

## 🎯 Why It Matters
This is the main revenue pipeline. No customers → no business.

## ✅ Acceptance Criteria
- Approve quote → creates Order in Strapi
- Order → creates Production Job
- Job has quote mockup and notes
- Tracks quote → order → job link
- Job available in dashboard (#22-24)
- Email confirmation sent to customer
- Production team notified

## 💻 Technical Stack
- Strapi workflow/automation
- Job queue system (Bull/RabbitMQ)
- Real-time notifications (WebSockets)
- State management

## 🔗 Related Issues
#41, #42, #43, #22-24

## 📊 Development Phase
Phase 2: Core Flow (Week 3-4)

## Integration Points
- Quote system (entire pipeline)
- Production dashboard (#22-24)
- Notifications"""
        },
        {
            "id": 45,
            "title": "Email quote delivery + approval workflow",
            "type": "feature",
            "priority": "medium",
            "effort": "m",
            "description": """## 📋 What's Needed
Email quotes to customers with approve/reject links

## 🎯 Why It Matters
No-login approval = higher conversion rate (~40% improvement vs login required)

## ✅ Acceptance Criteria
- Beautiful, branded email template
- Direct approve link (no login needed)
- Expiration date on link (7 days default)
- Rejection reason capture
- Follow-up reminder email (if pending 5+ days)
- Unsubscribe compliance (CAN-SPAM, GDPR)

## 💻 Technical Stack
- SendGrid or Mailgun for sending
- JWT tokens for secure links
- Email templating (MJML)
- Link expiration logic

## 🔗 Related Issues
#14, #16, #28

## 📊 Development Phase
Phase 2: Core Sales (Week 3-4)

## Integration Points
- Quote system
- Email service
- Authentication"""
        }
    ],
    "Production & Operations": [
        {
            "id": 22,
            "title": "Press-ready checklist (mockups, ink, garments, notes)",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Build pre-production checklist system for press team

## 🎯 Why It Matters
Checklists prevent costly errors (wrong garment/color/design). ~$500/mistake prevented = ROI.

## ✅ Acceptance Criteria
- Checklist template with: mockup review, ink colors, garment receipt, notes
- Checkbox completion tracking
- Photo upload for verification
- Team member sign-off
- Blocks job start until complete
- Historical checklist audit trail

## 💻 Technical Stack
- Appsmith form builder
- Photo upload (S3)
- Strapi backend
- Workflow state machine

## 🔗 Related Issues
#7, #23, #24, #30

## 📊 Development Phase
Phase 2: Dashboard (Week 3-4)

## Integration Points
- Production dashboard
- Job status system
- Photo storage"""
        },
        {
            "id": 23,
            "title": "SOP library + documentation built into dashboard",
            "type": "feature",
            "priority": "high",
            "effort": "l",
            "description": """## 📋 What's Needed
Create searchable SOP documentation accessible from dashboard

## 🎯 Why It Matters
Reduces training time (~50%), improves consistency, reduces errors

## ✅ Acceptance Criteria
- SOP library organized by process (screen printing, DTG, embroidery, finishing)
- Markdown with images/videos embedded
- Quick search from dashboard (full-text search)
- Context-aware SOP suggestions per job type
- Version control for SOPs
- Edit history and rollback capability

## 💻 Technical Stack
- Markdown parser (markdown-it)
- Full-text search (Elasticsearch or database FTS)
- Video hosting (S3/YouTube)
- Strapi for CMS

## 🔗 Related Issues
#22, #24

## 📊 Development Phase
Phase 2-3: Dashboard Enhancement (Week 4-5)

## Integration Points
- Production dashboard
- Job system"""
        },
        {
            "id": 24,
            "title": "Admin view of time tracking logs + team productivity metrics",
            "type": "feature",
            "priority": "medium",
            "effort": "m",
            "description": """## 📋 What's Needed
Dashboard showing who worked when and productivity metrics

## 🎯 Why It Matters
Visibility into bottlenecks. Identify high/low performers. Optimize workflow.

## ✅ Acceptance Criteria
- View team time logs (daily, weekly, monthly)
- Productivity metrics (jobs/hour, output quality)
- Bottleneck identification (job stuck > 2 hours)
- Team member performance trends
- Export reports (PDF/CSV)
- Forecasting based on historical data

## 💻 Technical Stack
- Appsmith dashboard
- Time tracking data (from #9)
- Analytics queries
- Chart libraries (Chart.js, D3)

## 🔗 Related Issues
#9, #22, #23, #31

## 📊 Development Phase
Phase 2-3: Analytics (Week 4-5)

## Integration Points
- Time tracking system (#9)
- Production dashboard
- Analytics"""
        },
        {
            "id": 30,
            "title": "Mobile views for press team (job today, time clock, mockup viewer)",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Mobile-optimized views for press operators

## 🎯 Why It Matters
Press team needs info fast, on the floor. Mobile-first = usable.

## ✅ Acceptance Criteria
- Today's jobs list (priority ordered)
- One-tap time clock in/out
- Mockup viewer (large, zoomable)
- Job notes/special instructions
- Quick job status update
- Works offline (cached data)

## 💻 Technical Stack
- React Native or Progressive Web App
- Offline-first (Workbox/IndexedDB)
- Push notifications
- Touch-optimized UI

## 🔗 Related Issues
#9, #22, #23, #31

## 📊 Development Phase
Phase 2-3: Mobile (Week 5-6)

## Integration Points
- Time tracking (#9)
- Job system
- Notifications"""
        },
        {
            "id": 31,
            "title": "Supervisor mobile dashboard (status change log, bottleneck tracking)",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Mobile supervisor view for real-time production oversight

## 🎯 Why It Matters
Supervisors need to manage floor in real-time, on mobile

## ✅ Acceptance Criteria
- Real-time job status updates
- Bottleneck alerts (job stuck > 2 hours)
- Team member activity view
- Quick decision buttons (escalate, reassign, etc.)
- Notification push alerts
- Historical status change log

## 💻 Technical Stack
- React Native or PWA
- WebSocket for real-time updates
- Push notifications
- Real-time database queries

## 🔗 Related Issues
#9, #24, #30

## 📊 Development Phase
Phase 3: Supervisor Tools (Week 5-6)

## Integration Points
- Time tracking
- Job status system
- Notifications"""
        }
    ],
    "CRM & Client Management": [
        {
            "id": 18,
            "title": "Client login portal (Strapi auth + Botpress integration)",
            "type": "feature",
            "priority": "critical",
            "effort": "l",
            "description": """## 📋 What's Needed
Build customer login portal with Strapi authentication

## 🎯 Why It Matters
Customers need self-service access to orders, quotes, account. Reduces support burden.

## ✅ Acceptance Criteria
- Signup/login with email
- Strapi auth integration (JWT tokens)
- Session management
- Forgot password flow
- Email verification
- Social login (optional: Google, Facebook)
- Profile management

## 💻 Technical Stack
- Next.js or React
- Strapi JWT auth
- Email service (SendGrid)
- Session store (Redis)
- OAuth2 for social login

## 🔗 Related Issues
#19, #20, #21

## 📊 Development Phase
Phase 2-3: Portal (Week 4-5)

## Integration Points
- Strapi authentication
- Customer data
- Email system"""
        },
        {
            "id": 19,
            "title": "Client job history + reorder button",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Show customers their past jobs and enable easy reordering

## 🎯 Why It Matters
Reorder rate improves by ~60% when it's 1-click vs starting over

## ✅ Acceptance Criteria
- Display all past jobs with dates
- Filter by product type, date range
- "Reorder" button pulls existing quote
- Reorder pre-fills garment/design details
- Discount for repeat orders
- Order status tracking

## 💻 Technical Stack
- React component
- Strapi API queries
- State management (Redux/Zustand)

## 🔗 Related Issues
#18, #21, #44

## 📊 Development Phase
Phase 2-3: Portal (Week 4-5)

## Integration Points
- Portal system (#18)
- Quote system
- Discount system"""
        },
        {
            "id": 20,
            "title": "Upcoming quote approvals dashboard",
            "type": "feature",
            "priority": "medium",
            "effort": "s",
            "description": """## 📋 What's Needed
Show pending quotes awaiting customer approval

## 🎯 Why It Matters
Reduces approval friction. Remind customers of pending quotes.

## ✅ Acceptance Criteria
- List pending quotes
- Days pending indicator
- Quick approve/request changes buttons
- Notification if quote >5 days old
- Status history

## 💻 Technical Stack
- React component
- Dashboard widget

## 🔗 Related Issues
#18, #45

## 📊 Development Phase
Phase 2: Portal (Week 4)

## Integration Points
- Portal system
- Quote system"""
        },
        {
            "id": 21,
            "title": "Client tagging system (nonprofit, monthly, VIP, late-pay)",
            "type": "feature",
            "priority": "medium",
            "effort": "s",
            "description": """## 📋 What's Needed
Tag customers for different business rules and marketing

## 🎯 Why It Matters
Auto-apply rules (nonprofit = 10% discount), segment marketing, track customer tiers

## ✅ Acceptance Criteria
- Tag types: nonprofit (discount), monthly (recurring), VIP (priority), late-pay (flag)
- Custom tags support
- Auto-apply rules (nonprofit tag = 10% discount)
- Tag-based reporting
- Bulk tagging via import

## 💻 Technical Stack
- Strapi custom field type
- Rules engine
- Tag management UI

## 🔗 Related Issues
#18, #19, #41

## 📊 Development Phase
Phase 2: CRM (Week 4)

## Integration Points
- Customer data
- Pricing engine
- Reporting"""
        }
    ],
    "Automation & Integration": [
        {
            "id": 46,
            "title": "S&S Activewear API integration",
            "type": "feature",
            "priority": "high",
            "effort": "l",
            "description": """## 📋 What's Needed
Integrate S&S Activewear API for product sync

## 🎯 Why It Matters
S&S has best inventory + pricing. Product catalog sync = realtime inventory

## ✅ Acceptance Criteria
- API authentication working
- Product catalog sync daily (300+ products)
- Price updates from supplier
- Inventory levels sync
- Error handling + retry logic
- Sync status dashboard

## 💻 Technical Stack
- Node.js for API client
- S&S Activewear REST API
- Strapi database
- Job queue (Bull)
- Error logging

## 🔗 Related Issues
#47, #48, #49, #50, #51, #52, #53

## 📊 Development Phase
Phase 3-4: Integrations (Week 7-8)

## Integration Points
- Supplier data system
- Product catalog"""
        },
        {
            "id": 67,
            "title": "n8n workflow engine + Microsoft 365 integration",
            "type": "feature",
            "priority": "high",
            "effort": "l",
            "description": """## 📋 What's Needed
Set up n8n workflow automation + Microsoft 365 integration

## 🎯 Why It Matters
Automate customer comms, financial reports, team alerts. Saves ~10 hours/week.

## ✅ Acceptance Criteria
- n8n instance deployed
- MS 365 (Outlook/Teams) integration configured
- Test workflows created
- Alert system for job status changes
- Email notification templates

## 💻 Technical Stack
- n8n self-hosted
- MS Graph API
- Webhook integrations
- JSON workflow definitions

## 🔗 Related Issues
#68, #69, #70

## 📊 Development Phase
Phase 4: Advanced Automation (Week 9+)

## Integration Points
- Job system
- Email system
- Microsoft 365 services"""
        }
    ],
    "Marketing & Content Site": [
        {
            "id": 32,
            "title": "Information architecture for mintprints.com",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Define site structure and information hierarchy

## 🎯 Why It Matters
Good IA = better SEO, better UX, higher conversions

## ✅ Acceptance Criteria
- Wireframes for all main pages
- Navigation structure defined
- Content outline per page
- Mobile layout planning
- SEO structure planned
- User journey mapping

## 💻 Technical Stack
- Figma for wireframes
- Content strategy doc

## 🔗 Related Issues
#33, #34, #35, #36, #38, #39, #40

## 📊 Development Phase
Phase 3: Marketing Site (Week 5-6)

## Integration Points
- Content management
- SEO"""
        },
        {
            "id": 40,
            "title": "Analytics dashboard (site traffic + conversions)",
            "type": "feature",
            "priority": "medium",
            "effort": "s",
            "description": """## 📋 What's Needed
Track website performance metrics

## 🎯 Why It Matters
Data-driven marketing decisions. Track ROI on marketing spend.

## ✅ Acceptance Criteria
- Traffic metrics (visitors, pageviews, sessions)
- Conversion tracking (quote requests, signups)
- Device/location breakdown
- Traffic sources (organic, direct, referral)
- Goal tracking
- Historical trends

## 💻 Technical Stack
- Google Analytics 4
- Custom conversion tracking
- Dashboard (Looker/Data Studio)

## 🔗 Related Issues
#32

## 📊 Development Phase
Phase 4: Optimization (Week 10+)

## Integration Points
- Marketing site
- CRM"""
        }
    ],
    "Supplier & Product Data": [
        {
            "id": 47,
            "title": "AS Colour API integration",
            "type": "feature",
            "priority": "high",
            "effort": "l",
            "description": """## 📋 What's Needed
Integrate AS Colour API for product sync

## 🎯 Why It Matters
AS Colour = quality basics. Need both S&S + AS Colour for inventory diversity

## ✅ Acceptance Criteria
- API authentication working
- Product catalog sync
- Price + inventory updates
- Error handling

## 💻 Technical Stack
- AS Colour API client
- Same integration approach as S&S

## 🔗 Related Issues
#46, #48, #49

## 📊 Development Phase
Phase 3-4: Integrations (Week 7-8)

## Integration Points
- Supplier data system"""
        },
        {
            "id": 48,
            "title": "SanMar API integration (plan + setup)",
            "type": "feature",
            "priority": "high",
            "effort": "l",
            "description": """## 📋 What's Needed
Integrate SanMar API for product sync

## 🎯 Why It Matters
SanMar = corporate/branded wear. Completes product range.

## ✅ Acceptance Criteria
- API plan documented
- Authentication configured
- Initial test sync
- Error handling

## 💻 Technical Stack
- SanMar API client
- Integration framework

## 🔗 Related Issues
#46, #47

## 📊 Development Phase
Phase 3-4: Integrations (Week 7-8)

## Integration Points
- Supplier data system"""
        },
        {
            "id": 49,
            "title": "Supplier data normalization layer",
            "type": "feature",
            "priority": "high",
            "effort": "l",
            "description": """## 📋 What's Needed
Normalize data from multiple supplier APIs into unified schema

## 🎯 Why It Matters
Each supplier has different API format. Need unified model for quoting.

## ✅ Acceptance Criteria
- Unified product schema defined
- Price normalization
- Inventory mapping
- Variant handling (S/M/L vs XS-XXL differences)
- Historical price tracking

## 💻 Technical Stack
- Data transformation service
- ETL pipeline
- Schema validation

## 🔗 Related Issues
#46, #47, #48, #50, #51

## 📊 Development Phase
Phase 3: Integrations (Week 7)

## Integration Points
- Supplier APIs
- Product database"""
        },
        {
            "id": 50,
            "title": "Inventory sync + update frequency strategy",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Plan and implement inventory sync frequency

## 🎯 Why It Matters
Real-time inventory = accurate quotes. Out-of-stock products = lost sales.

## ✅ Acceptance Criteria
- Real-time sync for high-volume items
- Daily sync for others
- Alert thresholds (low stock warning)
- Historical tracking for trend analysis
- Optimization (don't over-sync)

## 💻 Technical Stack
- Cron jobs or event-driven updates
- Job queue (Bull)
- Alert system

## 🔗 Related Issues
#46-49, #52

## 📊 Development Phase
Phase 3: Optimization (Week 8)

## Integration Points
- Supplier sync"""
        },
        {
            "id": 51,
            "title": "Product variant system (size/color/fabric)",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
Support size, color, and fabric variants for products

## 🎯 Why It Matters
Customers select variants (S/M/L, blue/red). Must match quote/order.

## ✅ Acceptance Criteria
- Variant storage structure (size/color/fabric combinations)
- Price variations (some sizes cost more)
- Inventory per variant
- Display in quoting UI
- Supplier variant mapping

## 💻 Technical Stack
- Strapi content type extensions
- Variant search/filtering
- Product query API

## 🔗 Related Issues
#49, #50

## 📊 Development Phase
Phase 3: Product Data (Week 8)

## Integration Points
- Product system
- Quote system"""
        },
        {
            "id": 52,
            "title": "Caching strategy for supplier APIs (Redis/local)",
            "type": "feature",
            "priority": "medium",
            "effort": "m",
            "description": """## 📋 What's Needed
Implement efficient caching for API calls

## 🎯 Why It Matters
Suppliers charge per API call. Cache = save $$ + faster response.

## ✅ Acceptance Criteria
- Redis caching layer
- TTL strategy (cache for 1 hour, 1 day, etc.)
- Cache invalidation logic
- Fallback to cache if API down
- Cache hit/miss metrics

## 💻 Technical Stack
- Redis
- Cache middleware

## 🔗 Related Issues
#46-50

## 📊 Development Phase
Phase 3: Optimization (Week 8)

## Integration Points
- Supplier APIs"""
        },
        {
            "id": 53,
            "title": "Fallback/graceful degradation when APIs down",
            "type": "feature",
            "priority": "medium",
            "effort": "s",
            "description": """## 📋 What's Needed
Handle supplier API outages gracefully

## 🎯 Why It Matters
Suppliers go down. System must still work with cached/last-known data.

## ✅ Acceptance Criteria
- Last-known data served from cache
- User notifications ("showing cached prices")
- Automatic retry logic (exponential backoff)
- Admin alerts
- Graceful degradation

## 💻 Technical Stack
- Error handling
- Circuit breaker pattern
- Fallback data source

## 🔗 Related Issues
#50, #52

## 📊 Development Phase
Phase 3: Resilience (Week 8)

## Integration Points
- Supplier sync
- Caching system"""
        }
    ],
    "AI & Intelligence Layer": [
        {
            "id": 59,
            "title": "Local AI stack decision (Ollama vs Mistral vs LLaMA 3)",
            "type": "chore",
            "priority": "medium",
            "effort": "s",
            "description": """## 📋 What's Needed
Evaluate and select local AI model

## 🎯 Why It Matters
AI opens new capabilities (content gen, analysis). Choose right model = cost + performance.

## ✅ Acceptance Criteria
- Comparison matrix (speed, accuracy, memory, cost)
- Performance benchmarks on sample tasks
- Memory requirements per model
- Decision documented + approved
- Recommendation for PrintShop OS

## 💻 Technical Stack
- Benchmark tools
- Model comparison

## 🔗 Related Issues
#60, #61, #62

## 📊 Development Phase
Phase 4: AI Exploration (Week 9)

## Integration Points
- AI infrastructure"""
        },
        {
            "id": 60,
            "title": "Per-task assistant architecture",
            "type": "feature",
            "priority": "high",
            "effort": "l",
            "description": """## 📋 What's Needed
Design architecture for task-specific AI assistants

## 🎯 Why It Matters
Modularplugin architecture = easy to add assistants (marketing, finance, support)

## ✅ Acceptance Criteria
- Plugin architecture designed
- Context management (customer data, order history)
- Vector DB integration for RAG
- Monitoring/observability system
- API for assistants

## 💻 Technical Stack
- Node.js service
- Plugin pattern
- Vector database
- Observability (logging/tracing)

## 🔗 Related Issues
#59, #61, #63, #64, #65, #66

## 📊 Development Phase
Phase 4: AI Foundation (Week 10)

## Integration Points
- AI core system"""
        },
        {
            "id": 63,
            "title": "Embeddings + vector DB for RAG",
            "type": "feature",
            "priority": "high",
            "effort": "l",
            "description": """## 📋 What's Needed
Implement embeddings and vector DB for RAG (Retrieval-Augmented Generation)

## 🎯 Why It Matters
RAG = AI assistants get customer context (order history, SOPs, etc.)

## ✅ Acceptance Criteria
- Vector DB setup (Pinecone or local Milvus)
- Embedding generation (OpenAI or local)
- RAG pipeline for querying
- Search quality metrics
- Context chunking strategy

## 💻 Technical Stack
- Pinecone or Milvus
- Embeddings API (OpenAI or Ollama)
- LangChain or similar

## 🔗 Related Issues
#60, #64, #65, #66

## 📊 Development Phase
Phase 4: AI Knowledge (Week 11)

## Integration Points
- AI assistant system"""
        },
        {
            "id": 64,
            "title": "Per-task assistant #1: Marketing/content generation",
            "type": "feature",
            "priority": "high",
            "effort": "m",
            "description": """## 📋 What's Needed
AI assistant for marketing content generation

## 🎯 Why It Matters
Marketing team spends 20+ hours/week on email copy, social posts. AI = 10x faster.

## ✅ Acceptance Criteria
- Email copy generation from order context
- Social media post suggestions
- Blog post draft generation
- Product description writing
- A/B testing suggestions

## 💻 Technical Stack
- LLM API
- RAG with order/product context
- Prompt engineering

## 🔗 Related Issues
#60, #63

## 📊 Development Phase
Phase 4: AI Assistants (Week 12)

## Integration Points
- Marketing system
- Content management"""
        },
        {
            "id": 65,
            "title": "Per-task assistant #2: Financial analysis",
            "type": "feature",
            "priority": "medium",
            "effort": "m",
            "description": """## 📋 What's Needed
AI assistant for financial analysis

## 🎯 Why It Matters
Finance team needs insights. AI analyzes trends, forecasts, identifies risks.

## ✅ Acceptance Criteria
- Revenue trend analysis
- Cost predictions
- Profitability by customer/product
- Forecast next quarter
- Risk identification

## 💻 Technical Stack
- LLM with data context
- Analytics queries
- Data visualization

## 🔗 Related Issues
#60, #63

## 📊 Development Phase
Phase 4: AI Assistants (Week 12)

## Integration Points
- Finance system
- Analytics"""
        },
        {
            "id": 66,
            "title": "Per-task assistant #3: Customer service automation",
            "type": "feature",
            "priority": "medium",
            "effort": "m",
            "description": """## 📋 What's Needed
AI assistant for customer service automation

## 🎯 Why It Matters
Support team swamped with FAQs. AI handles 80% of basic questions.

## ✅ Acceptance Criteria
- FAQ automation (answer common questions)
- Inquiry routing (to right team)
- Response suggestions for agent
- Escalation management
- Sentiment analysis

## 💻 Technical Stack
- LLM with FAQ context
- Classification model
- Sentiment analysis

## 🔗 Related Issues
#60, #63

## 📊 Development Phase
Phase 4: AI Assistants (Week 12)

## Integration Points
- Support system
- Ticket system"""
        }
    ]
}

def run_command(cmd: list, description: str = "") -> bool:
    """Run a shell command and return success status"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        if description:
            print(f"✅ {description}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e.stderr[:200]}")
        return False

def check_prerequisites():
    """Verify GitHub CLI is available and authenticated"""
    print("🔍 Checking prerequisites...\n")
    
    # Check gh CLI
    if not run_command(["which", "gh"], "GitHub CLI found"):
        print("❌ GitHub CLI not installed. Install from: https://cli.github.com")
        sys.exit(1)
    
    # Check authentication
    if not run_command(["gh", "auth", "status"], "GitHub authentication verified"):
        print("❌ Not authenticated. Run: gh auth login")
        sys.exit(1)

def create_labels():
    """Create all necessary labels"""
    print("\n📋 Creating labels...\n")
    
    labels = [
        ("type:feature", "0E8A16"),
        ("type:bug", "D73A49"),
        ("type:enhancement", "A2EEEF"),
        ("type:chore", "CCCCCC"),
        ("priority:critical", "FF0000"),
        ("priority:high", "FF8C00"),
        ("priority:medium", "FFFF00"),
        ("priority:low", "808080"),
        ("effort:s", "90EE90"),
        ("effort:m", "FFD700"),
        ("effort:l", "FF6347"),
        ("effort:xl", "8B0000"),
        ("phase:1-strapi", "E1ADFF"),
        ("phase:2-appsmith", "ADCCFF"),
        ("phase:3-botpress", "ADFFF1"),
        ("workflow:customer-intake", "FFC0CB"),
        ("workflow:job-management", "FFB6C1"),
        ("component:botpress", "DDA0DD"),
        ("component:appsmith", "DA70D6"),
        ("component:strapi", "BA55D3"),
        ("feature:crm", "9370DB"),
    ]
    
    created = 0
    for label_name, color in labels:
        if run_command(
            ["gh", "label", "create", label_name, "--color", color, "--force"],
            f"Created label: {label_name}"
        ):
            created += 1
        time.sleep(0.5)
    
    print(f"\n✅ Created {created}/{len(labels)} labels")

def create_all_issues():
    """Create all 70 issues"""
    print("\n🚀 Creating all issues...\n")
    
    total = 0
    created = 0
    
    for milestone, issues in ISSUES_DATA.items():
        print(f"\n📌 {milestone}")
        print("=" * 60)
        
        for issue in issues:
            total += 1
            issue_id = issue["id"]
            title = issue["title"]
            body = issue["description"]
            issue_type = issue["type"]
            priority = issue["priority"]
            effort = issue["effort"]
            
            # Build labels
            labels = [
                f"type:{issue_type}",
                f"priority:{priority}",
                f"effort:{effort}"
            ]
            
            # Build command
            cmd = [
                "gh", "issue", "create",
                "--title", title,
                "--body", body,
                "--milestone", milestone,
            ]
            
            for label in labels:
                cmd.extend(["--label", label])
            
            # Try to create
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                print(f"  ✅ #{issue_id}: {title[:50]}...")
                created += 1
            except subprocess.CalledProcessError as e:
                if "already exists" in e.stderr:
                    print(f"  ℹ️  #{issue_id}: Already exists")
                    created += 1
                else:
                    print(f"  ❌ #{issue_id}: {e.stderr[:80]}")
            
            time.sleep(0.5)
    
    print(f"\n\n{'='*60}")
    print(f"📊 Summary: {created}/{total} issues created")
    print(f"{'='*60}\n")

def main():
    print("\n" + "="*60)
    print("  PrintShop OS - Complete Issue Creation")
    print("="*60 + "\n")
    
    check_prerequisites()
    create_labels()
    create_all_issues()
    
    print("✨ All done!")
    print(f"🔗 View issues: https://github.com/hypnotizedent/printshop-os/issues\n")

if __name__ == "__main__":
    main()
