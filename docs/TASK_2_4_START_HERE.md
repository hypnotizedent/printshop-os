# Task 2.4 Setup - READY TO BUILD 🚀

**Date:** November 23, 2025  
**Status:** ✅ All systems ready  
**Estimated Time:** 3-4 hours  

---

## 📍 Where You Are

You're about to build **Task 2.4: Production Dashboard** while 3 Copilot agents work on Tasks 2.1-2.3.

This is the operational UI where your production team will manage jobs every single day.

---

## 🎯 What You're Building

A real-time dashboard for production operators:

```
Table View:
- See all jobs in "In Production" status
- Click a job to see details
- Sortable, searchable, filterable

Job Details Modal:
- Full job info (customer, quantity, colors)
- Mockup image (shows the design)
- Special notes/instructions

Action Buttons:
- ✓ Mark Complete
- ⏸ On Hold
- ❓ Need Help (escalate)
- ✖ Close
```

---

## 📚 3 Comprehensive Guides Created

### 1. **TASK_2_4_ACTION_PLAN.md** ← START HERE
- Visual checklist format
- Time estimates for each section
- Keep visible while building
- Easy to track progress

### 2. **TASK_2_4_QUICKSTART.md** ← DETAILED REFERENCE
- 10-step implementation guide
- Copy-paste code for every step
- Troubleshooting section
- Full technical details

### 3. **TASK_2_4_DASHBOARD_SETUP.md** ← DEEP DIVE
- Architecture details
- All advanced topics
- Reference only (very detailed)

---

## ✅ Services Running

All backends are up and ready:

- **Appsmith:** http://localhost:8080 (UI builder)
- **Strapi:** http://localhost:1337 (API + data)
- **PostgreSQL:** localhost:5432 (database)
- **Redis:** localhost:6379 (cache)

---

## 🚀 Quick Start (Right Now)

### Phase 1: Get API Token (5 minutes)

```
1. Open: http://localhost:1337/admin
2. Click Settings (bottom left)
3. Click API Tokens (under ADMINISTRATION)
4. Create new token:
   - Name: Appsmith Dashboard
   - Permissions: 
     ✓ jobs (read, create, update)
     ✓ orders (read)
     ✓ customers (read)
     ✓ products (read)
     ✓ quotes (read)
5. Save and COPY token
```

### Phase 2: Connect Appsmith (5 minutes)

```
1. Open: http://localhost:8080
2. Create New App → Production Dashboard
3. Click "+" next to QUERIES
4. Create REST API connector:
   - Name: StrapiAPI
   - URL: http://localhost:1337
   - Header: Authorization: Bearer [YOUR_TOKEN]
   - Header: Content-Type: application/json
5. Click Test → Verify connection ✅
```

### Phase 3: Build Dashboard (3 hours)

```
1. Open: docs/TASK_2_4_ACTION_PLAN.md
2. Follow Step 1 → Step 10
3. Check off each section
4. ~30 min per major section
```

---

## ⏱️ Time Breakdown

```
Setup:              15 min (get token + connect)
Queries:            10 min (3 data source queries)
Table UI:           15 min (display jobs)
Modal UI:           20 min (job details)
Buttons:            10 min (actions)
Mobile/Polish:      15 min (responsive design)
Testing:            15 min (verify everything works)
Deploy:              5 min (save + publish)
Buffer:             30 min (for troubleshooting)
────────────────────────────
TOTAL:              3-4 hours
```

---

## 🔄 Parallel Progress

While you build Task 2.4:

```
Timeline (Nov 23-26):
├─ You: Build dashboard (3-4 hours today) → DONE
├─ Agent 1: Email delivery (48 hours) → DONE Nov 25
├─ Agent 2: Workflow automation (48 hours) → DONE Nov 25
└─ Agent 3: Pricing engine (72 hours) → DONE Nov 26

By Nov 26:
✅ Dashboard working
✅ Email delivery working
✅ Workflow automation working
✅ Pricing engine working
✅ FULL REVENUE PIPELINE READY!
```

---

## 📋 Checklist

### Pre-Build
- [ ] Read this file
- [ ] Services running (docker-compose ps)
- [ ] API token created
- [ ] Appsmith connected to Strapi

### During Build
- [ ] Follow docs/TASK_2_4_ACTION_PLAN.md
- [ ] Test each query before moving on
- [ ] Build table first (before modal)
- [ ] Test buttons as you add them
- [ ] Test on mobile (Dev Tools)

### Post-Build
- [ ] Save Appsmith application
- [ ] Publish application
- [ ] Access at http://localhost:8080/app/production-dashboard
- [ ] Share link with team
- [ ] Document any customizations

---

## 🆘 Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Services not running | `docker-compose ps` then `docker-compose up -d strapi postgres` |
| API token invalid | Check Strapi settings → API Tokens → Verify permissions |
| Query returns 403 | Token doesn't have read permissions → Add jobs read permission |
| Table shows no data | Check database has jobs + Run GetJobsInProduction manually |
| Modal won't open | Check showDetailModal variable + Button click handler |
| Image not loading | Verify mockup_url is valid or use placeholder |

**Full troubleshooting:** See docs/TASK_2_4_QUICKSTART.md

---

## 🎯 Success Criteria

Task 2.4 is complete when ALL of these work:

- [ ] Can see jobs in table
- [ ] Can click job → modal opens
- [ ] Modal shows job details
- [ ] Mockup image displays
- [ ] Mark Complete button works
- [ ] Status updates in Strapi
- [ ] Job disappears from list
- [ ] Works on mobile
- [ ] No console errors

---

## 🚀 Next Steps

### Immediate (Now)
1. Get Strapi API token (5 min)
2. Connect Appsmith (5 min)
3. Start building (3 hours)

### By Tomorrow (Nov 24)
- Task 2.4 dashboard complete
- Agents 50% through tasks 2.1-2.3
- Verify dashboard with test jobs

### By Nov 25
- Agents finish tasks 2.1 and 2.2
- You start testing workflow
- Quote → Order → Job automation working

### By Nov 26
- All agents finish
- Full revenue pipeline tested
- Ready for staging deployment

### Nov 27+
- Deploy to production
- Production team using dashboard
- Start Phase 2.2 (additional features)

---

## 📞 Getting Help

1. **First:** Check docs/TASK_2_4_QUICKSTART.md → Troubleshooting
2. **Then:** Check docs/TASK_2_4_DASHBOARD_SETUP.md for deep details
3. **Finally:** Check GitHub issues #95, #96, #97 for agent progress

---

## 💡 Pro Tips

1. **Save Frequently** - Appsmith auto-saves, but Cmd+S is safe
2. **Test Early** - Don't wait until the end to test things
3. **Use DevTools** - F12 is your friend (Network tab for API calls)
4. **Start Simple** - Get table working first, then add complexity
5. **Create Test Data** - Make 3+ sample jobs in Strapi first
6. **Build Mobile-First** - Operators might use phones on the floor

---

## 📊 Files in This Task

Created today:
- `docs/TASK_2_4_ACTION_PLAN.md` - Visual checklist (start here)
- `docs/TASK_2_4_QUICKSTART.md` - Step-by-step guide (reference)
- `docs/TASK_2_4_SETUP.md` - Setup file (this file)

Previous:
- `docs/TASK_2_4_DASHBOARD_SETUP.md` - Full technical reference

---

## 🎓 Learning Outcomes

After this task, you'll know:

✅ How to connect Appsmith to REST APIs  
✅ How to query Strapi data  
✅ How to build tables and modals  
✅ How to add real-time updates  
✅ How to make responsive UIs  
✅ How to update backend data from UI  

---

## 🏁 Let's Ship This!

You're building the operational heart of PrintShop OS.

Your production team will use this dashboard every single day to manage jobs.

**Make it count!** 💪

---

**Start with:** docs/TASK_2_4_ACTION_PLAN.md

**Questions?** Check docs/TASK_2_4_QUICKSTART.md

**You've got this!** 🚀
