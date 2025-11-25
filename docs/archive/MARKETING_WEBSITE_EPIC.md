# 🎨 Marketing Website Epic - Consolidated

**Status:** Phase 2 - Marketing Presence  
**Priority:** High  
**Effort:** 3-4 weeks  
**Dependencies:** Brand strategy, domain setup

---

## 📋 Epic Overview

**Goal:** Build professional marketing website (mintprints.com) that:
- ✅ Converts visitors to quote requests
- ✅ Educates customers on capabilities
- ✅ Showcases portfolio & past work
- ✅ Optimized for SEO
- ✅ Mobile-responsive & fast
- ✅ Integrates with quote system

**Why This Matters:**
- Website = First impression (90% form opinions in 3 seconds)
- SEO = Free organic traffic ($10K+/month in paid ads equivalent)
- Conversions = Lead quality (good leads close 40% vs. cold 5%)
- Speed = Conversion improvement (1s delay = 7% fewer conversions)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Marketing Site (mintprints.com)
│  ├─ Next.js/React (Frontend)
│  ├─ Headless CMS (Strapi content)
│  └─ Analytics (Google Analytics 4)
└─────────────────────────────────────────────────────────┘
          ↓
┌──────────────────┬──────────────────┬──────────────────┐
│  Home Page       │  Services Pages  │  Portfolio       │
│  • Hero section  │  • Screen print  │  • Case studies  │
│  • CTA           │  • DTG           │  • Before/after  │
│  • USP           │  • Embroidery    │  • Client quotes │
└──────────────────┴──────────────────┴──────────────────┘
          ↓
┌──────────────────┬──────────────────┬──────────────────┐
│  Pricing Page    │  Blog/Resources  │  Contact/CTA     │
│  • Transparent   │  • SEO articles  │  • Get Quote btn │
│  • Volume pricing│  • Guides        │  • Lead form     │
│  • FAQ           │  • Case studies  │  • Live chat     │
└──────────────────┴──────────────────┴──────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│  Quote Engine Integration
│  • "Get Quote" button → Quote portal
│  • Lead capture → CRM
│  • Analytics → Conversion tracking
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Consolidated Sub-Tasks

### Phase 1: Foundation (Week 1-2)

#### Sub-Task 1: Information Architecture (Issue #15) & Brand Strategy
**What:** Define site structure, content hierarchy, user flows

**Deliverables:**
- ✅ Wireframes for all main pages
- ✅ Navigation structure defined
- ✅ Content outline per page
- ✅ User journey mapping (visitor → lead → customer)
- ✅ SEO structure planning (keywords, metadata)
- ✅ Mobile layout planning

**Site Structure:**
```
mintprints.com/
├── /                               (Home)
├── /about                          (Brand story)
├── /services/                      (Service category pages)
│   ├── /services/screen-print     (Process guide + CTAs)
│   ├── /services/dtg              (Direct-to-garment)
│   ├── /services/embroidery       (Embroidery guide)
│   └── /services/finishing        (Finishing options)
├── /portfolio                      (Portfolio/case studies)
├── /pricing                        (Transparent pricing)
├── /blog                           (Articles, SEO content)
├── /faq                            (Common questions)
├── /contact                        (Contact form, CTA)
└── /quote                          (Quote portal integration)
```

**Effort:** 3-4 days  
**Priority:** High  
**Blockers:** None

---

#### Sub-Task 2: Brand Storytelling Pages (Issue #16)
**What:** Pages that establish brand authority and differentiation

**Pages:**
- **About Us:** Ronny's story, vision, values
- **Why Mint Prints:** USP, differentiators, competitive advantages
- **Team:** Key people, expertise, testimonials
- **Values:** Quality, speed, customer focus

**Content Examples:**
```
"We don't just print shirts. We print confidence.
Since 2020, we've helped 500+ businesses create apparel
that represents their brand perfectly.

Real expertise. Real speed. Real results."
```

**Effort:** 2-3 days (copywriting + design)  
**Priority:** Medium  
**Blockers:** None

---

#### Sub-Task 3: Service/Process Education Pages (Issue #17)
**What:** Pages educating customers on printing methods

**Pages:**
- **Screen Printing 101**
  - What is it? (video)
  - When to use it (vs alternatives)
  - Our process (visual workflow)
  - Pricing factors
  - FAQ

- **DTG (Direct-to-Garment)**
  - What is it? (video)
  - Capabilities (color accuracy, detail)
  - Cost vs screen print
  - Design requirements
  - FAQ

- **Embroidery**
  - What is it? (video)
  - Stitch count & cost
  - Design conversion process
  - Customization options
  - FAQ

- **Finishing & Packaging**
  - Labeling & packaging options
  - Tagging & hangers
  - Custom boxes
  - Shipping preparation

**Content Style:** Educational, visual, video-heavy

**Effort:** 4-5 days (per page, with video/graphics)  
**Priority:** High  
**Blockers:** Video production

---

### Phase 2: Content & Features (Week 2-3)

#### Sub-Task 4: Portfolio/Case Studies (Issue #19)
**What:** Showcase successful projects and client wins

**Content Per Case Study:**
- Client name & industry
- Challenge (what they needed)
- Solution (what we delivered)
- Results (quantified impact)
- Before/after images
- Client testimonial
- CTAs ("Get your project started")

**Example Structure:**
```
Case Study: TechStartup Co.

Challenge:
"100 new team members needed branded merch for company
retreat. 2-week deadline. High quality required."

Solution:
"We delivered 100 embroidered hoodies with logo,
custom packaging with branded labels, 10 days early."

Results:
✓ 100% satisfaction
✓ 5-star Google review
✓ Became repeat customer
✓ Referred 3 new clients

[Before/After Images]
[Testimonial Video]
[CTA: "Let's create your story"]
```

**Effort:** 3-4 days (with client interviews & photography)  
**Priority:** High  
**Blockers:** Existing projects to feature

---

#### Sub-Task 5: Blog/Content Management System (Issue #22)
**What:** SEO-optimized blog for organic traffic

**Content Pillars:**
1. **How-to Guides** (Screen print design tips, care instructions, etc.)
2. **Industry News** (Trends, new products, capabilities)
3. **Company Updates** (New services, client spotlights)
4. **Local Content** (Community involvement, partnerships)

**Blog Strategy:**
- 2 posts/week (500-1000 words each)
- SEO-optimized (keywords, meta descriptions, internal links)
- CMS integration (easy content management)
- Author bios & credibility signals
- Internal linking to service pages

**Example Posts:**
- "5 Design Tips for Screen Printing Success"
- "DTG vs Screen Print: Which is Right for You?"
- "How to Care for Your Custom Apparel"
- "The Ultimate Guide to Bulk Order Discounts"

**Effort:** 2-3 days (setup) + ongoing content  
**Priority:** High  
**Blockers:** Content calendar, writers

---

#### Sub-Task 6: Pricing Transparency Page (Issue #45)
**What:** Clear, transparent pricing that builds trust

**Content:**
- Simple pricing table (shirt, hoodie, hat, etc.)
- Factors that affect price (quantity, colors, location)
- Volume discount breakdown
- Add-on pricing (logos, special finishes)
- Bulk order calculator (interactive)
- FAQ ("Why are prices X?", etc.)

**Design:**
```
┌─────────────────────────────────────────┐
│ Basic Tee Screen Print Pricing          │
├─────────────────────────────────────────┤
│ Qty    | Price/Unit | Total             │
├────────┼────────────┼──────────────────┤
│ 1-10   | $15        | $15-150          │
│ 11-50  | $12        | $132-600         │
│ 51-100 | $10        | $510-1000        │
│ 100+   | $8         | $800+            │
└─────────────────────────────────────────┘

Add-Ons:
+ Logo embroidery: +$3/item
+ Premium finishing: +$1/item
+ Rush processing (3 days): +15%
```

**Effort:** 2 days  
**Priority:** High  
**Blockers:** Pricing from Sub-task (Pricing System Epic)

---

#### Sub-Task 7: Portfolio/Case Studies Section (Issue #19, continued)
**What:** Visual showcase of best work

**Features:**
- Image gallery (before/after)
- Filter by service type (screen print, DTG, embroidery)
- Client testimonials with photos
- Results metrics (turnaround time, quality, satisfaction)
- Social proof (# of projects, years in business)

**Effort:** 2-3 days (design + content curation)  
**Priority:** Medium  
**Blockers:** Project assets

---

### Phase 3: Optimization & Integration (Week 3-4)

#### Sub-Task 8: SEO Optimization (Issue #21)
**What:** Technical SEO for organic search visibility

**On-Page SEO:**
- ✅ Meta titles & descriptions (all pages)
- ✅ Header structure (H1, H2, H3 hierarchy)
- ✅ Keyword optimization (screen print, embroidery, DTG, etc.)
- ✅ Internal linking strategy
- ✅ Schema markup (Organization, Product, LocalBusiness)

**Technical SEO:**
- ✅ Sitemap.xml
- ✅ robots.txt
- ✅ Mobile responsiveness
- ✅ Page speed optimization (<3s load)
- ✅ SSL certificate

**Off-Page SEO:**
- ✅ Google Business Profile optimization
- ✅ Local citations
- ✅ Backlink strategy (industry directories, partnerships)

**Effort:** 3-4 days  
**Priority:** High  
**Blockers:** All content pages complete

---

#### Sub-Task 9: Analytics & Conversion Tracking (Issue #23, #61)
**What:** Measure traffic, conversions, ROI

**Setup:**
- ✅ Google Analytics 4 implementation
- ✅ Conversion tracking (quote requests)
- ✅ Traffic source attribution
- ✅ Device/location breakdown
- ✅ Page performance metrics
- ✅ User journey mapping

**Dashboard Metrics:**
```
│ Daily Visitors      │ 150-300 (target)
│ Quote Request Rate  │ 5-10% of visitors
│ Avg Session Time    │ 2-4 minutes
│ Bounce Rate         │ <40%
│ Conversion Value    │ $XXX/month
│ ROI                 │ 300%+ (organic)
```

**Effort:** 1-2 days  
**Priority:** Medium  
**Blockers:** Site launch

---

#### Sub-Task 10: Bundles/Packages Pages (Issue #18)
**What:** Showcase popular package deals

**Packages:**
- **Startup Bundle** (50 basic tees + minimal branding)
- **Team Bundle** (100 shirts/hoodies mixed + embroidery)
- **Event Bundle** (1000 commemorative items + packaging)
- **Holiday Bundle** (200 items + custom packaging)

**For Each Package:**
- What's included
- Pricing (transparent)
- Customization options
- Turnaround time
- CTA ("Get Quote")

**Effort:** 1-2 days  
**Priority:** Medium  
**Blockers:** Sub-task 6 (pricing)

---

#### Sub-Task 11: Contact & Lead Capture (Part of Infrastructure)
**What:** Forms, CTAs, lead routing

**Forms:**
- Quick quote request (name, email, details)
- Contact form (general inquiry)
- Demo request (for new services)
- Partnership inquiry

**Lead Routing:**
```
Lead Capture
      ↓
Email notification to sales
      ↓
CRM entry (Strapi)
      ↓
Sales follow-up
      ↓
Quote generation
      ↓
Order
```

**Effort:** 1-2 days  
**Priority:** High  
**Blockers:** Email/CRM integration

---

## 📊 Content Requirements

**Home Page:**
- Hero section (headline, CTA, imagery)
- Value props (why Mint Prints)
- Services overview (screen print, DTG, embroidery)
- Portfolio samples (3-4 best projects)
- Testimonials (3-4 customers)
- Call-to-action ("Get Quote")

**Service Pages:**
- Detailed description
- Process breakdown (visual timeline)
- Pricing factors
- FAQ
- Case study examples
- CTA

**Portfolio Page:**
- 15-20 best projects
- Filter by service type
- Click-through for case study
- Testimonials
- CTA

**Blog:**
- 20+ articles (staggered content calendar)
- SEO keywords integrated
- Call-to-action in each post
- Related posts linking

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| **Monthly Visitors** | 1,000+ (Month 1), 5,000+ (Month 3) |
| **Quote Request Rate** | 5-10% of visitors |
| **Page Load Time** | <3 seconds |
| **Mobile Traffic** | 50%+ of total |
| **SEO Rankings** | Top 3 for "screen print [city]" |
| **Organic Traffic** | 40%+ of total traffic |
| **Bounce Rate** | <40% |
| **Average Session** | 2-4 minutes |

---

## 🚀 Execution Timeline

```
Week 1: Foundation
├─ Sub-task 1: IA & wireframes (3-4 days)
├─ Sub-task 2: Brand storytelling (2-3 days)
└─ Sub-task 3: Service pages (4-5 days)

Week 2: Content
├─ Sub-task 4: Case studies (3-4 days)
├─ Sub-task 5: Blog setup + content (2-3 days)
└─ Sub-task 6: Pricing transparency (2 days)

Week 3: Optimization
├─ Sub-task 7: Portfolio section (2-3 days)
├─ Sub-task 8: SEO optimization (3-4 days)
└─ Sub-task 9: Analytics setup (1-2 days)

Week 4: Launch
├─ Sub-task 10: Bundles/packages (1-2 days)
├─ Sub-task 11: Contact integration (1-2 days)
└─ Testing & QA (2-3 days)

Total: 3-4 weeks
```

---

## 💼 Technology Stack

- **Frontend:** Next.js 14 (React, TypeScript)
- **CMS:** Strapi (blog content, case studies)
- **Hosting:** Vercel (Next.js optimized)
- **Analytics:** Google Analytics 4
- **Forms:** Formspree or similar
- **Email:** SendGrid integration
- **SEO Tools:** Yoast SEO plugin for CMS

---

## 📁 File Structure

```
mintprints-web/
├── pages/
│   ├── index.tsx                  (Home)
│   ├── about.tsx                  (About/brand story)
│   ├── services/
│   │   ├── screen-print.tsx
│   │   ├── dtg.tsx
│   │   ├── embroidery.tsx
│   │   └── finishing.tsx
│   ├── portfolio.tsx              (Case studies)
│   ├── pricing.tsx                (Pricing transparency)
│   ├── blog/
│   │   ├── [slug].tsx            (Blog post)
│   │   └── index.tsx             (Blog listing)
│   ├── contact.tsx
│   └── quote.tsx                  (Portal integration)
├── components/
│   ├── Hero.tsx
│   ├── CaseStudy.tsx
│   ├── PricingTable.tsx
│   ├── ContactForm.tsx
│   └── ...
├── styles/
│   └── globals.css
├── public/
│   └── images/
└── README.md
```

---

## 🎯 Next Steps

1. ✅ Review this epic documentation
2. → Create design mockups (Figma)
3. → Start copywriting & content collection
4. → Launch Next.js project
5. → Develop pages (Week 1-3)
6. → SEO optimization (Week 4)
7. → Deploy to mintprints.com

---

**Status:** Ready for design & development  
**Created:** November 23, 2025  
**Reference:** Consolidated Marketing Website Epic
