# Customer Journey & UX Roadmap for PrintShop OS

**Created:** November 26, 2025  
**Goal:** Deliver a seamless end-to-end customer experience

---

## Customer Journey Phases

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE CUSTOMER JOURNEY                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. DISCOVER     2. QUOTE      3. APPROVE     4. PRODUCE    5. DELIVER         │
│  ─────────────   ──────────    ──────────     ──────────    ──────────         │
│  Website         Request       Review         Track         Receive            │
│  Portfolio       Upload Art    Approve        Updates       Pickup/Ship        │
│  Pricing         Get Price     Pay Deposit    See Progress  Leave Review       │
│                                                                                 │
│  6. RETAIN       7. REORDER                                                     │
│  ──────────      ──────────                                                     │
│  Follow-up       Quick Repeat                                                   │
│  Support         Edit & Submit                                                  │
│  Loyalty         Save Designs                                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: DISCOVER (Marketing Website)

### Current Status: ⏳ Planned

### Features Needed

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Portfolio gallery | HIGH | ⏳ | Showcase past work |
| Service pages | HIGH | ⏳ | Screen print, embroidery, DTG |
| Instant price estimator | HIGH | ⏳ | Quick ballpark quotes |
| Contact form | HIGH | ⏳ | Lead capture |
| Live chat widget | MEDIUM | ⏳ | Botpress integration |
| Customer testimonials | MEDIUM | ⏳ | Social proof |
| FAQ section | MEDIUM | ⏳ | Self-service answers |
| Blog/Education | LOW | ⏳ | SEO content |

### Technical Implementation

```
mintprints.com/
├── Home page (hero, services, CTA)
├── Services/
│   ├── screen-printing
│   ├── embroidery
│   ├── dtg-printing
│   └── finishing
├── Portfolio/
│   └── [category]/[project]
├── Pricing/
│   └── instant-estimator (React widget)
├── About/
├── Contact/
└── Blog/
```

### Integration Points
- **Strapi CMS:** Portfolio items, blog posts
- **Pricing Engine:** Instant estimator widget
- **Botpress:** Live chat for inquiries
- **Analytics:** Track conversion funnel

---

## Phase 2: QUOTE (Request & Price)

### Current Status: ✅ Partially Complete

### Features Needed

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Quote request form | HIGH | ✅ | `QuoteForm.tsx` exists |
| Design file upload | HIGH | ⏳ | Need file storage |
| AI design analysis | MEDIUM | ⏳ | Color count, complexity |
| Smart pricing | HIGH | ✅ | Job estimator works |
| Quote PDF generation | MEDIUM | ⏳ | Professional quote docs |
| Email quote delivery | MEDIUM | ⏳ | SendGrid integration |
| Quote link (shareable) | HIGH | ⏳ | Customer can view online |

### Customer UX Flow

```
Customer Flow:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Fill Form   │───▶│ Upload Art   │───▶│ Get Instant  │───▶│ Receive      │
│  (details)   │    │ (design)     │    │ Quote        │    │ Quote Email  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘

Backend Flow:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Strapi saves │───▶│ S3/Storage   │───▶│ AI analyzes  │───▶│ Price calc   │
│ quote data   │    │ saves files  │    │ design       │    │ generates $  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### Technical TODO
- [ ] File upload to S3/MinIO
- [ ] AI design analysis service
- [ ] PDF quote generator
- [ ] SendGrid email integration
- [ ] Shareable quote links

---

## Phase 3: APPROVE (Review & Pay)

### Current Status: ⏳ Partially Built

### Features Needed

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Quote approval page | HIGH | ⏳ | Public link, no login |
| Digital proof approval | HIGH | ⏳ | Mockup viewer |
| eSignature | MEDIUM | ⏳ | Legal approval |
| Deposit payment | HIGH | ⏳ | Stripe integration |
| Full payment option | HIGH | ⏳ | Stripe integration |
| Split payment | MEDIUM | ⏳ | Pay deposit + balance |
| Invoice download | MEDIUM | ⏳ | PDF invoice |

### Customer UX Flow

```
Customer receives email:
"Your quote is ready! Click to review"
           │
           ▼
┌─────────────────────────────────────────┐
│         QUOTE APPROVAL PAGE             │
├─────────────────────────────────────────┤
│  Order #13657                           │
│  ─────────────────────────────          │
│  50x Custom T-Shirts                    │
│  - Gildan 5000 (Navy)                   │
│  - 2-color front print                  │
│  - Size breakdown: S(5), M(15)...       │
│                                         │
│  [View Mockup Preview]                  │
│                                         │
│  Subtotal:        $487.50               │
│  Tax (6%):         $29.25               │
│  ─────────────────────────────          │
│  TOTAL:           $516.75               │
│                                         │
│  ☐ I approve this design and order      │
│                                         │
│  [Pay 50% Deposit - $258.38]            │
│  [Pay in Full - $516.75]                │
│                                         │
└─────────────────────────────────────────┘
```

### Technical TODO
- [ ] Public quote approval page
- [ ] Stripe checkout integration
- [ ] Mockup generator (product + design)
- [ ] eSignature component
- [ ] Payment webhook handler
- [ ] Auto-update order status on payment

---

## Phase 4: PRODUCE (Track Progress)

### Current Status: ✅ Backend Ready, Frontend WIP

### Features Needed

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Order status page | HIGH | ⏳ | Customer-facing tracker |
| Real-time updates | MEDIUM | ⏳ | WebSocket notifications |
| Production photos | LOW | ⏳ | Share progress pics |
| Estimated completion | MEDIUM | ⏳ | Based on queue |
| SMS notifications | MEDIUM | ⏳ | Twilio integration |
| Email notifications | HIGH | ⏳ | Status change emails |

### Customer Status Tracker

```
┌─────────────────────────────────────────────────────────────┐
│                    ORDER STATUS                             │
│                    #13657                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Quote Approved ─────────────────── Nov 25              │
│     │                                                       │
│  ✅ Payment Received ───────────────── Nov 25              │
│     │                                                       │
│  ✅ In Production ──────────────────── Nov 26              │
│     │    └─ Screens burned, printing today                 │
│     │                                                       │
│  ○  Quality Check ──────────────────── Pending             │
│     │                                                       │
│  ○  Ready for Pickup ───────────────── Est. Nov 27         │
│                                                             │
│  ─────────────────────────────────────                     │
│  Questions? Contact us: (555) 123-4567                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technical TODO
- [ ] Customer order status page
- [ ] WebSocket status updates
- [ ] Twilio SMS notifications
- [ ] SendGrid status emails
- [ ] Production photo uploads

---

## Phase 5: DELIVER (Receive Order)

### Current Status: ✅ Shipping Labels Built

### Features Needed

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Shipping label creation | HIGH | ✅ | `ShippingLabelForm.tsx` |
| EasyPost integration | HIGH | ⏳ | Rate shopping |
| Tracking number | HIGH | ⏳ | Auto-email tracking |
| Pickup scheduling | MEDIUM | ⏳ | Calendar integration |
| Delivery confirmation | MEDIUM | ⏳ | Webhook from carrier |
| Review request | MEDIUM | ⏳ | Post-delivery email |

### Customer UX

```
Shipping Flow:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Order marked │───▶│ Customer     │───▶│ Package      │
│ "Complete"   │    │ notified     │    │ delivered    │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Tracking     │
                    │ email sent   │
                    └──────────────┘

Pickup Flow:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Order marked │───▶│ Customer     │───▶│ Customer     │
│ "Ready"      │    │ notified     │    │ picks up     │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Technical TODO
- [ ] EasyPost API integration (real)
- [ ] Tracking number auto-email
- [ ] Delivery webhook handler
- [ ] Pickup notification email
- [ ] Review request automation

---

## Phase 6: RETAIN (Support & Loyalty)

### Current Status: ⏳ Planned

### Features Needed

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Customer portal login | HIGH | ✅ | Auth exists |
| Order history | HIGH | ✅ | `OrderHistory.tsx` |
| Support tickets | MEDIUM | ⏳ | Built, needs UI |
| Saved designs vault | MEDIUM | ⏳ | Reuse artwork |
| Loyalty/rewards | LOW | ⏳ | Points system |
| Referral program | LOW | ⏳ | Refer friends |
| Email campaigns | MEDIUM | ⏳ | Re-engagement |

### Customer Portal Features

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER PORTAL                          │
├─────────────────────────────────────────────────────────────┤
│  Welcome back, Randy!                                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 12 Orders    │  │ 3 Saved      │  │ 0 Open       │      │
│  │ This Year    │  │ Designs      │  │ Tickets      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  Recent Orders:                                             │
│  ─────────────────────────────────────                     │
│  #13657  50x Custom Tees      Complete    Nov 26           │
│  #13601  100x Hoodies         Delivered   Nov 15           │
│  #13589  25x Hats             Delivered   Nov 10           │
│                                                             │
│  [View All Orders]  [Start New Order]  [Get Support]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technical TODO
- [ ] Design vault (file storage per customer)
- [ ] Support ticket UI
- [ ] Loyalty points system
- [ ] Email campaign automation
- [ ] Customer analytics dashboard

---

## Phase 7: REORDER (Quick Repeat)

### Current Status: ⏳ Planned

### Features Needed

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| One-click reorder | HIGH | ⏳ | Copy previous order |
| Edit quantities/sizes | HIGH | ⏳ | Modify before submit |
| Saved favorites | MEDIUM | ⏳ | Mark products |
| Bulk reorder | LOW | ⏳ | Multiple items |
| Subscription orders | LOW | ⏳ | Recurring orders |

### Reorder UX

```
Past Order View:
┌─────────────────────────────────────────────────────────────┐
│  Order #13601 - Delivered Nov 15                           │
├─────────────────────────────────────────────────────────────┤
│  100x Gildan 18500 Hoodies (Navy)                          │
│  - 3-color front print                                     │
│  - Left chest logo                                         │
│                                                             │
│  Total: $2,450.00                                          │
│                                                             │
│  [Reorder Same]  [Reorder with Changes]  [Download Invoice] │
│                                                             │
└─────────────────────────────────────────────────────────────┘

"Reorder with Changes" opens:
┌─────────────────────────────────────────────────────────────┐
│  Edit Reorder                                               │
├─────────────────────────────────────────────────────────────┤
│  Quantity: [100] → [150]                                   │
│                                                             │
│  Size Breakdown:                                            │
│  S: [10]  M: [25]  L: [40]  XL: [50]  2XL: [25]            │
│                                                             │
│  Same Design: ✅ Yes  ○ Upload New                         │
│                                                             │
│  [Get Updated Quote]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Requirements

### Third-Party Services Needed

| Service | Purpose | Priority | Notes |
|---------|---------|----------|-------|
| **Stripe** | Payments | HIGH | Deposits, full payment |
| **SendGrid** | Transactional email | HIGH | Quotes, status, receipts |
| **Twilio** | SMS notifications | MEDIUM | Status updates |
| **EasyPost** | Shipping | HIGH | Rate shopping, labels |
| **S3/MinIO** | File storage | HIGH | Design files, proofs |
| **Botpress** | Live chat | MEDIUM | Customer inquiries |
| **Google Analytics** | Tracking | MEDIUM | Conversion funnel |
| **Calendly** | Scheduling | LOW | Pickup appointments |

### Integration Architecture

```
                    ┌─────────────────┐
                    │   PrintShop OS  │
                    │   (Strapi CMS)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Stripe     │   │   SendGrid    │   │   EasyPost    │
│   Payments    │   │    Emails     │   │   Shipping    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                    │                    │
        │                    ▼                    │
        │           ┌───────────────┐             │
        └──────────▶│    Twilio     │◀────────────┘
                    │     SMS       │
                    └───────────────┘
```

---

## Strapi Content Types Needed

### New Content Types

| Content Type | Purpose | Fields |
|--------------|---------|--------|
| `quote` | Quote requests | customer, items, status, totals, expiresAt |
| `proof` | Design proofs | quote, imageUrl, version, approvedAt |
| `payment` | Payment records | order, amount, type, stripeId, status |
| `notification` | Notification log | customer, type, channel, sentAt |
| `design-vault` | Saved designs | customer, name, fileUrl, tags |
| `review` | Customer reviews | customer, order, rating, comment |

### Updated Content Types

| Content Type | New Fields Needed |
|--------------|-------------------|
| `order` | proofApprovedAt, trackingNumber, deliveredAt |
| `customer` | loyaltyPoints, referralCode, emailPreferences |

---

## Implementation Priority

### Phase A: Core Transaction Flow (Week 1-2)
1. ✅ Quote form (exists)
2. ⏳ Stripe payment integration
3. ⏳ Quote approval page
4. ⏳ SendGrid transactional emails

### Phase B: Customer Communication (Week 3)
1. ⏳ Order status tracker page
2. ⏳ Email notifications on status change
3. ⏳ Twilio SMS notifications

### Phase C: Delivery & Fulfillment (Week 4)
1. ⏳ EasyPost real integration
2. ⏳ Tracking number automation
3. ⏳ Delivery confirmation

### Phase D: Customer Retention (Week 5-6)
1. ⏳ Design vault
2. ⏳ Reorder functionality
3. ⏳ Customer portal enhancements
4. ⏳ Review collection

### Phase E: Marketing & Growth (Future)
1. ⏳ Marketing website
2. ⏳ SEO optimization
3. ⏳ Botpress chat
4. ⏳ Loyalty program

---

## Success Metrics

### Customer Experience KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Quote response time | < 2 hours | Time from submit to quote sent |
| Quote-to-order rate | > 40% | Quotes approved / quotes sent |
| Order completion time | < 5 days | Approved to delivered |
| Customer satisfaction | > 4.5/5 | Post-delivery reviews |
| Repeat order rate | > 50% | Customers who reorder |
| Support ticket resolution | < 24 hours | Ticket open to closed |

### Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time | < 2 seconds | Customer-facing pages |
| API response time | < 200ms | Strapi endpoints |
| Uptime | > 99.5% | System availability |
| Email delivery rate | > 98% | SendGrid metrics |
| Payment success rate | > 95% | Stripe metrics |

---

## Summary

**What you have:**
- ✅ Core order management (Strapi)
- ✅ Customer authentication
- ✅ Quote form UI
- ✅ Shipping label form
- ✅ Pricing engine

**What you need for seamless journey:**
1. **Stripe integration** - Accept payments
2. **SendGrid integration** - Email notifications
3. **Quote approval page** - Public link, pay online
4. **Order status tracker** - Customer visibility
5. **Design file storage** - S3/MinIO
6. **Reorder functionality** - Quick repeats

**Effort estimate:** 4-6 weeks for complete journey

