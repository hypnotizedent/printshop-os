# PrintShop OS - Dependency Mapping

**Understanding issue relationships and critical paths.**

---

## 🔗 Core Dependencies

### Critical Path (Must Complete in Order)

```
Phase 0 Foundation (Required for everything else):
├─ #1: Botpress order intake
├─ #2: Strapi setup
├─ #3: Basic portal
├─ #22-24: SOP library

↓ Enables:

Phase 1 Quoting (Required for revenue):
├─ #41: Pricing engine
├─ #42: Bundle pricing
├─ #43: Deposit collection
├─ #44: Quote → Job mapping
├─ #45: Email delivery

↓ Enables:

Phase 2 Portal & Marketing:
├─ #32-40: Marketing site
├─ #54-58: Product gallery
└─ #18-20: Portal features

↓ Enables:

Phase 3 Supplier Integration:
├─ #46-48: Supplier APIs
├─ #49-52: Data normalization & caching
└─ #53: Fallback handling

↓ Enables:

Phase 4 Automation & AI:
├─ #59-66: AI layer
└─ #67-70: n8n workflows
```

---

## 📊 Dependency Matrix

| Issue | Blocks | Depends On | Phase |
|-------|--------|-----------|-------|
| #1: Botpress | #44, #18, #28 | None | 0 |
| #2: Strapi | All issues | None | 0 |
| #22-24: SOP | #7, #8, #9 | #2 | 0 |
| #41: Pricing | #14-17, #42 | #2 | 1 |
| #42: Bundles | #14-17 | #41 | 1 |
| #43: Deposits | #44, #15 | #41 | 1 |
| #44: Quote→Job | #7, #8, #9 | #43, #41 | 1 |
| #45: Email | #14 | #44 | 1 |
| #46-48: Supplier APIs | #54-58 | None | 3 |
| #49-52: Normalization | #54-58 | #46-48 | 3 |
| #54-58: Gallery | #19 | #49-52 | 2 |
| #18: Portal login | #19, #20, #21 | #2 | 0 |
| #19: Job history | None | #18, #44 | 2 |
| #59-66: AI | None | #2 | 4 |
| #67-70: n8n | #28-29 | None | 4 |
| #28-29: Automation | None | #67-70 | 4 |

---

## 🎯 Parallel Work Opportunities

### Can Work in Parallel:

**Phase 0:**
- #1 (Botpress) and #2 (Strapi) in parallel
- #3 (Portal) and #22-24 (SOP) in parallel

**Phase 1:**
- #14-17 (quote features) in parallel
- #7-9 (team features) in parallel with #41-45 (pricing)

**Phase 2:**
- #32-40 (marketing site) independent
- #18-20 (portal features) independent
- #30-31 (mobile) can start once #22-24 done

**Phase 3:**
- #46 (S&S), #47 (AS Colour), #48 (SanMar) can develop in parallel
- #49-52 can develop with API stubs

**Phase 4:**
- #59-66 (AI) independent
- #67-70 (n8n) independent
- #37-40 (marketing) independent

---

## ⚠️ Blocking Relationships

### These MUST be done first:

1. **#2 (Strapi)** blocks 95% of other issues
   - All data models needed
   - Auth system needed
   - API endpoints needed

2. **#41-45 (Pricing & Quoting)** blocks customer-facing sales
   - Revenue depends on this
   - Portal depends on quote data

3. **#46-48 (Supplier APIs)** blocks #54-58 (product gallery)
   - Gallery needs data source
   - Pricing needs supplier data

### These CAN be done in parallel:

- Marketing site (#32-40) doesn't block anything
- AI (#59-66) doesn't block anything
- Mobile views (#30-31) can start early

---

## 🔗 Cross-Milestone Dependencies

### Sales & Quoting → Production & Operations
- #44 (Quote→Job mapping) creates jobs for #22-24 (checklists)
- #8-9 (team roles, time tracking) needed for quoting accuracy

### Sales & Quoting → Finance & Invoicing
- #43 (deposits) feeds to #4 (invoicing)
- #42 (bundle pricing) affects financial reporting

### Supplier & Product Data → Sales & Quoting
- #46-48 (supplier APIs) feeds #41 (pricing engine)
- #54-58 (gallery) shows products from #49-52 (normalization)

### Automation & Integration → All Others
- #67-70 (n8n workflows) automates #28-29 (follow-ups)
- #67-69 integrate all systems together

### AI & Intelligence → All Others
- #64 (marketing AI) enhances #37 (email campaigns)
- #65 (financial AI) enhances #40 (analytics)
- #66 (customer service AI) enhances #68 (communication workflows)

---

## 📈 Risk & Complexity

### High Risk (Need Early Attention):
- #41-45 (Quoting): Core revenue, complex pricing logic
- #46-48 (Supplier APIs): External dependency risk
- #2 (Strapi): Foundational, impacts everything

### Medium Risk:
- #44 (Quote→Job mapping): Critical integration point
- #49-52 (Data normalization): Complex schema mapping
- #67-70 (n8n workflows): New technology stack

### Low Risk:
- #32-40 (Marketing): Standalone, can iterate quickly
- #59-66 (AI): Can start with simple implementations
- #30-31 (Mobile): Can leverage existing dashboards

---

## ✅ Prerequisite Checklist

### Before Phase 0 Starts:
- [ ] GitHub repo set up
- [ ] Team assigned
- [ ] Development environment ready
- [ ] Strapi starter template chosen

### Before Phase 1 Starts:
- [ ] Phase 0 complete
- [ ] Product database schema designed
- [ ] Stripe account ready
- [ ] Pricing rules documented

### Before Phase 2 Starts:
- [ ] Phase 1 complete
- [ ] Domain registered (mintprints.com)
- [ ] Brand guidelines finalized
- [ ] Content written

### Before Phase 3 Starts:
- [ ] Phase 2 complete
- [ ] S&S API access confirmed
- [ ] AS Colour API access confirmed
- [ ] SanMar API roadmap defined

### Before Phase 4 Starts:
- [ ] Phase 3 complete
- [ ] AI model selected (Ollama/Mistral/LLaMA)
- [ ] n8n server ready
- [ ] Microsoft 365 integration planned

---

## 🔄 Dependency Visualization

```
                        #2: Strapi (Foundation)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            #41-45: Quoting    #18-21: CRM Portal
                    │                   │
                    ├─────────┬─────────┤
                    ▼         ▼         ▼
            #44: Quote→Job  #22-24: SOP  #19: Job History
                    │         │         │
                    └────┬────┴────┬────┘
                         ▼        ▼
                    #7-9: Team   #30-31: Mobile
                         │
                    ┌────┴────┐
                    ▼         ▼
            #46-48: APIs  #25-27: Inventory
                    │
                    ▼
            #49-52: Normalization
                    │
                    ▼
            #54-58: Gallery
                    │
            ┌───────┼───────┐
            ▼       ▼       ▼
        #32-40:  #59-66:  #67-70:
        Marketing  AI      n8n
```

---

## 🎯 Suggested Implementation Order

**If starting fresh today:**

1. **Week 1-2:** Set up #2 (Strapi) - everything depends on this
2. **Week 1-2 (parallel):** Start #1 (Botpress), #3 (Portal), #22 (SOP)
3. **Week 3-4:** Complete #41 (Pricing engine)
4. **Week 5-6:** Complete #42-45 (Quoting features), #44 (Quote→Job)
5. **Week 7-8:** Complete #14-17 (Visual quotes)
6. **Week 9-10 (parallel):** #32-40 (Marketing), #46-47 (S&S, AS Colour)
7. **Week 11-12:** Complete #54-58 (Product gallery)
8. **Week 13-16:** Complete #46-53 (Full supplier integration)
9. **Week 17-24:** #59-70 (AI & automation)

---

This dependency map ensures team coordination and prevents blocked work.

