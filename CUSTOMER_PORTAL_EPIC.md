# 💳 Customer Portal Epic - Consolidated

**Status:** Phase 2 - Customer Experience  
**Priority:** CRITICAL  
**Effort:** 3-4 weeks  
**Dependencies:** Strapi (Phase 1), Authentication, Quote System

---

## 📋 Epic Overview

**Goal:** Build customer self-service portal that enables:
- ✅ Secure account login (email/password + 2FA)
- ✅ Order history & reorder functionality
- ✅ Quote approval workflow
- ✅ Real-time job tracking
- ✅ Invoice & payment history
- ✅ Account management (addresses, billing info)
- ✅ Support ticketing

**Why This Matters:**
- Reduces support tickets by 60% (customers self-serve)
- Increases retention (convenience = loyalty)
- Enables repeat orders (1-click reorder)
- Improves payment velocity (online payment portal)
- Offloads admin work (don't manually track orders)

---

## 🎯 Consolidated Sub-Tasks

### Phase 1: Authentication & Core (Week 1-2)

#### Sub-Task 1: User Authentication & Registration (Issue #54)
**What:** Secure account creation and login

**Features:**
- ✅ Email-based registration
- ✅ Password validation (8+ chars, numbers, symbols)
- ✅ Email verification (send link)
- ✅ Password reset (secure reset token)
- ✅ 2-Factor Authentication (SMS or authenticator app)
- ✅ Session management (logout, timeout)
- ✅ "Remember me" option (30-day cookie)

**Registration Flow:**
```
[Enter Email]
   ↓
[Verify Email] (click link in inbox)
   ↓
[Create Password] (8+ chars with number & symbol)
   ↓
[Set Up 2FA] (SMS or authenticator)
   ↓
[Profile Complete] (welcome email)
   ↓
[Redirect to Portal]
```

**Security:**
- ✅ HTTPS only
- ✅ Passwords hashed (bcrypt)
- ✅ Rate limiting (5 failed logins = 15 min timeout)
- ✅ Session encryption
- ✅ CSRF protection

**Effort:** 4-5 days  
**Priority:** CRITICAL  
**Blockers:** None

---

#### Sub-Task 2: Dashboard & Navigation (Issue #55)
**What:** Portal homepage and main navigation

**Dashboard Sections:**
```
┌──────────────────────────────────┐
│ Welcome, John Smith              │ [Logout] [Settings]
├──────────────────────────────────┤
│ Quick Stats                       │
│ ┌────────┬────────┬────────┐    │
│ │ Pending│ Orders │ Invoices│   │
│ │  1     │  12    │  $2,450 │   │
│ └────────┴────────┴────────┘    │
│                                   │
│ Recent Orders                     │
│ ▌ Order #1234 - Completed      │
│  [View] [Reorder] [Track]      │
│                                   │
│ ▌ Quote #5678 - Pending Review  │
│  [View] [Approve] [Decline]    │
│                                   │
│ Navigation Menu                  │
│ ▾ Orders & Quotes                │
│ ▾ Reorder & Browse               │
│ ▾ Tracking                        │
│ ▾ Billing & Payments             │
│ ▾ Account Settings               │
└──────────────────────────────────┘
```

**Features:**
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode support
- ✅ Notification badge (pending approvals)
- ✅ Quick action buttons
- ✅ Search functionality

**Effort:** 3-4 days  
**Priority:** HIGH  
**Blockers:** Sub-task 1

---

#### Sub-Task 3: Order History & Details
**What:** View past orders with complete information

**Features:**
- ✅ List all past orders (paginated, 20 per page)
- ✅ Filter by: date range, status, amount
- ✅ Sort by: newest, oldest, total amount
- ✅ Click to view detailed order information
- ✅ Show mockup images, colors, quantities
- ✅ Display what was actually printed vs. quote
- ✅ Track job through production

**Order Detail View:**
```
Order #1234 - Completed (Nov 18, 2025)

Customer: Your Company Name
Status: Delivered Nov 20, 2025

Items:
─────────────────────────────
T-Shirts (Screen Print)
Qty: 100
Colors: Black, Red (2-color front)
Price: $1,200

Shipping:
Address: 123 Main St, Boston MA
Cost: $45
Carrier: FedEx
Tracking: 1234567890

Totals:
Subtotal: $1,200
Shipping: $45
Tax: $100
Total: $1,345

Actions:
[Download Invoice] [Reorder] [Contact Support]
```

**Effort:** 3-4 days  
**Priority:** HIGH  
**Blockers:** Sub-task 2

---

### Phase 2: Business Functions (Week 2-3)

#### Sub-Task 4: Quote Approval Workflow (Issue #56)
**What:** Review and approve quotes before production

**Workflow:**
```
Quote Generated (by sales)
    ↓
Email notification sent to customer
    ↓
Customer logs in & reviews quote
    ↓
Shows: mockup, colors, quantity, pricing, timeline
    ↓
[Approve] or [Request Changes] or [Decline]
    ↓
If Approve → Auto-creates order + sends to production
If Changes → Notification to sales + renegotiation
If Decline → Archived, can request new quote
```

**UI:**
```
Pending Quotes

Quote #5678 (Expires: Nov 28, 2025)

Item: Custom T-Shirts
Mockup: [Image Preview]
Colors: Navy, Gold (2-color front)
Quantity: 250

Pricing Breakdown:
- Base cost: $1,875
- Setup fee: $50
- Ink surcharge: $25
- Total: $1,950
- Per unit: $7.80

Timeline:
- Approval: by Nov 28
- Production: 5 business days
- Delivery: Dec 5

[✓ Approve Quote] [Request Changes] [Decline]
```

**Features:**
- ✅ 3D mockup preview (mockup library)
- ✅ Approval history/audit trail
- ✅ Auto-expiration (14 days default)
- ✅ Comments/notes section
- ✅ Email notifications
- ✅ Batch approval (multiple quotes)

**Effort:** 4-5 days  
**Priority:** CRITICAL  
**Blockers:** Sub-task 2, Pricing System

---

#### Sub-Task 5: Reorder & Quick Repeat
**What:** One-click reordering of past designs

**Features:**
- ✅ "Reorder" button on past orders
- ✅ Pre-fill with previous details (colors, quantities, addresses)
- ✅ Allow quantity adjustments
- ✅ Show updated pricing (may have changed)
- ✅ Fast checkout (3-step process)
- ✅ Save as template for future reorders

**Reorder Flow:**
```
Past Order: T-Shirts (100 qty)
    ↓
[Reorder Button]
    ↓
Review Details (pre-filled)
- Product: T-Shirt
- Colors: Black, Red
- Qty: 100
- Price: $1,200
[Adjust Qty] [Change Options]
    ↓
[Add to Cart]
    ↓
[Checkout] → Request Quote or Pay
```

**Templates:**
- ✅ Save designs as reusable templates
- ✅ Quick reorder from template list
- ✅ Share template with team (e.g., corporate accounts)

**Effort:** 2-3 days  
**Priority:** HIGH  
**Blockers:** Sub-task 3

---

#### Sub-Task 6: Real-Time Job Tracking (Issue #57)
**What:** Customers see exactly where their order is

**Tracking Status:**
```
Order #1234 - Status: In Production

Timeline:
✓ Received (Nov 15, 2025)
✓ Approved (Nov 16, 2025)
◐ In Production (Nov 18 - Nov 22)
    Current step: Color separation (80% complete)
    Estimated completion: Nov 22
○ Quality Check (Nov 23)
○ Packing & Labeling (Nov 24)
○ Shipped (Nov 25)
○ Delivered

Estimated Delivery: Nov 28

What's happening now:
We're separating your 2-color design into
printing layers. About 20% of jobs remain.

Next step: Color separation → Printing
Timeline: 2 hours

Questions? [Contact Support]
```

**Features:**
- ✅ Real-time status from production dashboard
- ✅ Email/SMS notifications at key milestones
- ✅ Estimated completion date
- ✅ Current phase progress bar
- ✅ Photos from production (optional upload)
- ✅ Contact support for questions

**Notifications:**
- ✅ Order approved → Production starting
- ✅ Quality check passed → Packing
- ✅ Shipped → Tracking link
- ✅ Delivered → Thank you message

**Effort:** 3-4 days  
**Priority:** HIGH  
**Blockers:** Production Dashboard integration

---

### Phase 3: Billing & Account (Week 3-4)

#### Sub-Task 7: Billing & Invoice Management
**What:** Payment history, invoices, and billing information

**Features:**
- ✅ View all invoices (PDF download)
- ✅ Payment history (date, amount, method)
- ✅ Outstanding invoices with payment links
- ✅ Auto-generated receipts
- ✅ Tax documents (if applicable)
- ✅ Billing address management
- ✅ Payment method management (credit cards)

**Invoices View:**
```
Billing & Payments

Outstanding Invoices:
┌──────────────────────────────┐
│ Invoice #INV-2025-1234       │
│ Order #1234 - T-Shirts       │
│ Amount Due: $1,345           │
│ Due Date: Dec 5, 2025        │
│ [Pay Now] [Download PDF]     │
└──────────────────────────────┘

Payment History:
─────────────────────────────
Date      | Order   | Amount | Method
Nov 20    | #1233   | $950   | Credit Card
Nov 10    | #1232   | $1,200 | ACH Transfer
Oct 28    | #1231   | $450   | Credit Card
```

**Payment Methods:**
- ✅ Credit/debit card (Stripe)
- ✅ ACH transfer (bank account)
- ✅ PayPal
- ✅ Save payment methods for future orders

**Effort:** 3-4 days  
**Priority:** HIGH  
**Blockers:** Sub-task 2

---

#### Sub-Task 8: Account Settings & Profile
**What:** Manage personal and company information

**Settings Sections:**
- ✅ Profile info (name, email, phone)
- ✅ Billing address
- ✅ Shipping addresses (multiple)
- ✅ Password change
- ✅ 2FA settings
- ✅ Communication preferences (email frequency)
- ✅ Team members (for corporate accounts)
- ✅ API tokens (for integrations)

**Corporate Accounts:**
- ✅ Invite team members
- ✅ Role-based permissions (viewer, approver, admin)
- ✅ Shared order history
- ✅ Consolidated billing

**Effort:** 2-3 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 1

---

#### Sub-Task 9: Support Ticketing System
**What:** Integrated support for customer issues

**Features:**
- ✅ Create support tickets (issue type selector)
- ✅ View ticket history
- ✅ Real-time replies from support team
- ✅ File attachments (photos of issues)
- ✅ SLA tracking (response time)
- ✅ Searchable knowledge base

**Support Ticket:**
```
Ticket #SUP-5678
Status: Open (Response time: <24hr)

Subject: Color mismatch on order #1234

Description: The red color appears darker than
expected in the mockup. Can we adjust?

Created: Nov 20, 2025 10:30 AM
Last Reply: Nov 20, 2025 2:15 PM

Messages:
[Your message]
Hi! The red looks too dark. Can we
reprint with a brighter red?
Nov 20, 2025 10:30 AM

[Support reply]
Hi Sarah! Thanks for reaching out.
We can absolutely adjust the color.
Can you confirm the Pantone code you'd prefer?
Nov 20, 2025 2:15 PM

[Your reply]
Let me check our brand guide...
[Uploading image]
```

**Ticket Types:**
- ✅ Quality issue
- ✅ Billing question
- ✅ Shipping/tracking
- ✅ Design help
- ✅ Account issue
- ✅ Feature request

**Effort:** 3-4 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 2

---

#### Sub-Task 10: Advanced Analytics (Optional)
**What:** Usage analytics for large/corporate accounts

**Features:**
- ✅ Order trends (spending over time)
- ✅ Team member usage (who orders most)
- ✅ Product popularity (which items most ordered)
- ✅ Cost analysis (per unit pricing trends)
- ✅ Budget tracking (stay within allocated budget)

**Effort:** 2-3 days  
**Priority:** LOW  
**Blockers:** Sub-task 7

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| **Login Success Rate** | 99.9% uptime |
| **Quote Approval Time** | <48 hours average |
| **Reorder Adoption** | 40% of customers |
| **Support Ticket Reduction** | 60% fewer inquiries |
| **Payment Success** | 98% on first attempt |
| **Session Duration** | 8+ min average |
| **Mobile Adoption** | 60% of traffic |

---

## 🚀 Execution Timeline

```
Week 1: Authentication & Core
├─ Sub-task 1: Auth (4-5 days)
├─ Sub-task 2: Dashboard (3-4 days)

Week 2: Order Management
├─ Sub-task 3: Order history (3-4 days)
├─ Sub-task 4: Quote approvals (4-5 days)
└─ Sub-task 5: Reorder (2-3 days)

Week 3: Tracking & Billing
├─ Sub-task 6: Job tracking (3-4 days)
├─ Sub-task 7: Billing (3-4 days)
├─ Sub-task 8: Account settings (2-3 days)

Week 4: Support & Refinement
├─ Sub-task 9: Support tickets (3-4 days)
├─ Sub-task 10: Analytics (2-3 days)
└─ Testing & deployment (2-3 days)

Total: 3-4 weeks
```

---

## 💼 Technology Stack

- **Frontend:** React with TypeScript
- **UI Framework:** Material-UI or Tailwind CSS
- **State Management:** Redux or Context API
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL (Strapi)
- **Authentication:** JWT + 2FA (TOTP)
- **Payments:** Stripe API
- **Real-time Updates:** WebSockets
- **Hosting:** Docker + AWS/Azure

---

## 🔐 Security Requirements

- ✅ HTTPS only
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting on login (5 failures = 15 min timeout)
- ✅ CSRF protection
- ✅ Input validation/sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ PCI DSS compliance (for payment info)
- ✅ Regular security audits
- ✅ GDPR compliance (data privacy)

---

**Status:** Ready for implementation  
**Created:** November 23, 2025  
**Reference:** Consolidated Customer Portal Epic
