# Task 2.4: Production Dashboard Test Plan

**Test Date:** _______________  
**Tester:** _______________  
**Environment:** ☐ Development ☐ Staging ☐ Production  
**Version:** 1.0.0

---

## 📋 Pre-Test Setup

Before beginning tests, ensure:

- [ ] All services running: `docker-compose ps`
- [ ] Strapi accessible: http://localhost:1337/admin
- [ ] Appsmith accessible: http://localhost:8080
- [ ] API token created and configured
- [ ] Sample jobs created (run seed script)
- [ ] Browser DevTools available (F12)

---

## 🧪 Test Suite 1: Connection & Setup

### Test 1.1: Strapi API Connection

**Objective:** Verify Appsmith can connect to Strapi API

**Steps:**
1. Open Appsmith dashboard
2. Navigate to Datasources → StrapiAPI
3. Click "Test" button

**Expected Result:**
- ✅ "Connection successful" message appears
- ✅ No error messages
- ✅ Response time < 2 seconds

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 1.2: API Token Permissions

**Objective:** Verify API token has required permissions

**Steps:**
1. Run GetJobsInProduction query manually
2. Observe response in DevTools Network tab
3. Check response status code

**Expected Result:**
- ✅ Status code: 200 OK
- ✅ Response contains jobs array (or empty array)
- ✅ No 403 Forbidden errors

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

## 🧪 Test Suite 2: Data Display

### Test 2.1: Jobs Table Loads

**Objective:** Verify jobs table displays data correctly

**Steps:**
1. Open Production Dashboard
2. Wait for table to load
3. Observe table contents

**Expected Result:**
- ✅ Table appears on page
- ✅ Jobs with status "InProduction" are displayed
- ✅ Columns show: Job Number, Title, Customer, Due Date, Status, Actions
- ✅ All data is readable
- ✅ No "undefined" or "null" values

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

**Jobs Displayed:** _____ (count)

---

### Test 2.2: Table Column Formatting

**Objective:** Verify column data is formatted correctly

**Steps:**
1. Review each column in the table
2. Check date formatting
3. Check status colors

**Expected Result:**
- ✅ Job numbers formatted: JOB-2025-XXX
- ✅ Dates formatted: MMM DD, YYYY (e.g., Nov 24, 2025)
- ✅ Status has background color (blue for InProduction)
- ✅ Customer names display correctly (not "N/A" unless truly empty)

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 2.3: Table Search

**Objective:** Verify search functionality works

**Steps:**
1. Type job number in search box (e.g., "JOB-2025-001")
2. Observe table updates
3. Clear search
4. Type customer name
5. Observe table updates

**Expected Result:**
- ✅ Table filters to matching jobs
- ✅ Non-matching jobs are hidden
- ✅ Clear search shows all jobs again
- ✅ Search works on multiple columns

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 2.4: Table Sorting

**Objective:** Verify column sorting works

**Steps:**
1. Click "Due Date" column header
2. Observe sort order
3. Click again
4. Observe reverse sort

**Expected Result:**
- ✅ First click: Ascending order (earliest first)
- ✅ Second click: Descending order (latest first)
- ✅ Sort indicator appears on column header
- ✅ Data sorts correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

## 🧪 Test Suite 3: Job Details Modal

### Test 3.1: Modal Opens

**Objective:** Verify job details modal opens on click

**Steps:**
1. Click "View Details" button on any job
2. Wait for modal to appear

**Expected Result:**
- ✅ Modal appears over the page
- ✅ Modal has backdrop (dimmed background)
- ✅ Modal title shows job number
- ✅ Modal can be closed with X button or Close button

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 3.2: Job Details Display

**Objective:** Verify all job details appear in modal

**Steps:**
1. Open job details modal
2. Review all displayed information

**Expected Result:**
- ✅ Job number displayed in header
- ✅ Mockup image displayed (or placeholder)
- ✅ Customer name displayed
- ✅ Job title displayed
- ✅ Due date displayed and formatted
- ✅ Production notes displayed
- ✅ Status displayed

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

**Missing Fields:** _______________

---

### Test 3.3: Mockup Image Display

**Objective:** Verify mockup images load correctly

**Steps:**
1. Open job details for job with mockup
2. Observe image loading
3. Open job details for job without mockup
4. Observe placeholder

**Expected Result:**
- ✅ Valid mockup URLs display images
- ✅ Images scale to fit container
- ✅ Jobs without mockups show placeholder
- ✅ Placeholder text is readable
- ✅ No broken image icons

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

## 🧪 Test Suite 4: Status Updates

### Test 4.1: Mark Complete

**Objective:** Verify job can be marked as complete

**Steps:**
1. Note the current number of jobs in table
2. Open job details modal
3. Click "Mark Complete" button
4. Wait for modal to close
5. Observe table

**Expected Result:**
- ✅ Success message appears: "Job marked as complete!"
- ✅ Modal closes automatically
- ✅ Job disappears from table (filtered out)
- ✅ Job count decreases by 1
- ✅ No errors in console

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 4.2: Verify Status in Strapi

**Objective:** Verify status update persisted in database

**Steps:**
1. Mark a job complete in Appsmith
2. Open Strapi admin: http://localhost:1337/admin
3. Navigate to Jobs collection
4. Find the job you marked complete
5. Check its status field

**Expected Result:**
- ✅ Job status in Strapi is "Complete"
- ✅ Updated_at timestamp is recent
- ✅ Other job fields unchanged

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 4.3: Mark Ready

**Objective:** Verify job can be marked as ready

**Steps:**
1. Open job details modal
2. Click "Mark Ready" button
3. Observe results

**Expected Result:**
- ✅ Success message: "Job marked as ready!"
- ✅ Modal closes
- ✅ Job disappears from InProduction table
- ✅ Job appears when filter changed to "Ready"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 4.4: Put On Hold

**Objective:** Verify job can be put on hold

**Steps:**
1. Open job details modal
2. Click "Put On Hold" button
3. Observe results

**Expected Result:**
- ✅ Info message: "Job put on hold!"
- ✅ Modal closes
- ✅ Job disappears from InProduction table
- ✅ Job appears when filter changed to "Pending"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

## 🧪 Test Suite 5: Filtering

### Test 5.1: Status Filter

**Objective:** Verify status filter works correctly

**Steps:**
1. Select "Ready" from status filter dropdown
2. Observe table updates
3. Select "Pending"
4. Observe table updates
5. Select "Complete"
6. Observe table updates
7. Select "In Production"
8. Observe table updates

**Expected Result:**
- ✅ Table updates when filter changes
- ✅ Only jobs with selected status appear
- ✅ Filter change is instant (< 1 second)
- ✅ No errors during filter changes

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

**Filter Results:**
- Ready: _____ jobs
- Pending: _____ jobs
- Complete: _____ jobs
- In Production: _____ jobs

---

## 🧪 Test Suite 6: Refresh & Real-time

### Test 6.1: Manual Refresh

**Objective:** Verify refresh button updates data

**Steps:**
1. Note current jobs in table
2. Create a new job in Strapi admin with status "InProduction"
3. Return to Appsmith
4. Click Refresh button
5. Observe table

**Expected Result:**
- ✅ Refresh button triggers query
- ✅ New job appears in table
- ✅ Success message: "Jobs refreshed!"
- ✅ Table data is current

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 6.2: Auto-refresh (if configured)

**Objective:** Verify auto-refresh works (if enabled)

**Steps:**
1. Note current jobs in table
2. Create a new job in Strapi
3. Wait 30-60 seconds
4. Observe if table updates automatically

**Expected Result:**
- ✅ Table updates automatically
- ✅ New jobs appear without manual refresh
- ✅ No noticeable performance impact

**Actual Result:**
- [ ] Pass
- [ ] Fail
- [ ] N/A - Auto-refresh not configured

---

## 🧪 Test Suite 7: Mobile Responsiveness

### Test 7.1: Mobile Layout (iPhone)

**Objective:** Verify dashboard works on mobile devices

**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar
3. Select iPhone SE (375px)
4. Review dashboard layout

**Expected Result:**
- ✅ Table is readable on small screen
- ✅ Columns stack or hide appropriately
- ✅ Buttons are touch-friendly (44px+ height)
- ✅ Text is legible (14px+ font size)
- ✅ Can scroll to see all content

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 7.2: Tablet Layout (iPad)

**Objective:** Verify dashboard works on tablets

**Steps:**
1. Select iPad (768px) in device toolbar
2. Review dashboard layout

**Expected Result:**
- ✅ Layout adapts to tablet size
- ✅ All features accessible
- ✅ Good use of screen space
- ✅ Touch-friendly controls

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 7.3: Mobile Modal

**Objective:** Verify modal works on mobile

**Steps:**
1. Stay in mobile view (iPhone)
2. Click "View Details" on a job
3. Review modal display

**Expected Result:**
- ✅ Modal fits mobile screen
- ✅ Can scroll within modal
- ✅ Image scales appropriately
- ✅ All buttons accessible
- ✅ Easy to close modal

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

## 🧪 Test Suite 8: Error Handling

### Test 8.1: Network Failure

**Objective:** Verify graceful handling of network errors

**Steps:**
1. Stop Strapi: `docker-compose stop strapi`
2. Try to refresh dashboard
3. Observe error handling
4. Start Strapi: `docker-compose start strapi`
5. Try refresh again

**Expected Result:**
- ✅ Appropriate error message appears
- ✅ Dashboard doesn't crash
- ✅ Can retry after service restored
- ✅ Error message is user-friendly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 8.2: Invalid Data

**Objective:** Verify handling of unexpected data

**Steps:**
1. Create a job in Strapi with missing required fields
2. Refresh dashboard
3. Observe how dashboard handles incomplete data

**Expected Result:**
- ✅ Dashboard displays available data
- ✅ Shows "N/A" or placeholder for missing fields
- ✅ No JavaScript errors
- ✅ Other jobs still display correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

### Test 8.3: Slow Network

**Objective:** Verify behavior under slow network conditions

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Refresh dashboard
4. Observe loading behavior

**Expected Result:**
- ✅ Loading indicator appears
- ✅ Dashboard remains responsive
- ✅ Data eventually loads
- ✅ No timeout errors (or appropriate timeout message)

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

---

## 🧪 Test Suite 9: Performance

### Test 9.1: Load Time

**Objective:** Measure dashboard load time

**Steps:**
1. Clear browser cache
2. Open DevTools → Network tab
3. Load dashboard
4. Note total load time

**Expected Result:**
- ✅ Dashboard loads in < 3 seconds
- ✅ No unnecessary requests
- ✅ Images load efficiently

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

**Load Time:** _____ seconds

---

### Test 9.2: Large Dataset

**Objective:** Verify performance with many jobs

**Steps:**
1. Create 50+ jobs in Strapi
2. Load dashboard
3. Test search and filter performance

**Expected Result:**
- ✅ Table loads without lag
- ✅ Search/filter remains responsive
- ✅ Scrolling is smooth
- ✅ No browser memory issues

**Actual Result:**
- [ ] Pass
- [ ] Fail - Notes: _______________

**Jobs Tested:** _____ (count)

---

## 🧪 Test Suite 10: Browser Compatibility

### Test 10.1: Chrome

**Browser:** Chrome _____  (version)  
**OS:** _____

**Test Results:**
- [ ] All features work
- [ ] No console errors
- [ ] UI displays correctly

**Issues:** _______________

---

### Test 10.2: Firefox

**Browser:** Firefox _____  (version)  
**OS:** _____

**Test Results:**
- [ ] All features work
- [ ] No console errors
- [ ] UI displays correctly

**Issues:** _______________

---

### Test 10.3: Safari

**Browser:** Safari _____  (version)  
**OS:** _____

**Test Results:**
- [ ] All features work
- [ ] No console errors
- [ ] UI displays correctly

**Issues:** _______________

---

### Test 10.4: Edge

**Browser:** Edge _____  (version)  
**OS:** _____

**Test Results:**
- [ ] All features work
- [ ] No console errors
- [ ] UI displays correctly

**Issues:** _______________

---

## 📊 Test Summary

**Total Tests:** 30  
**Tests Passed:** _____  
**Tests Failed:** _____  
**Tests Skipped:** _____  

**Pass Rate:** _____% 

---

## 🐛 Issues Found

### Issue 1
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low  
**Description:** _______________  
**Steps to Reproduce:** _______________  
**Expected:** _______________  
**Actual:** _______________

### Issue 2
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low  
**Description:** _______________  
**Steps to Reproduce:** _______________  
**Expected:** _______________  
**Actual:** _______________

### Issue 3
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low  
**Description:** _______________  
**Steps to Reproduce:** _______________  
**Expected:** _______________  
**Actual:** _______________

---

## ✅ Sign-off

**Tester Name:** _______________  
**Date:** _______________  
**Signature:** _______________

**Status:** ☐ Approved for Production ☐ Needs Fixes ☐ Rejected

**Comments:** _______________

---

## 📝 Notes

Additional observations or comments:

_______________
_______________
_______________

---

**Test Plan Version:** 1.0.0  
**Last Updated:** November 24, 2025
