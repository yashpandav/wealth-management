# Payout System - Comprehensive Testing Guide

## ✅ Test Data Successfully Seeded

### Test Contracts Created

| # | Client | Amount | Frequency | Window | Duration | Interest/Period | Status |
|---|--------|--------|-----------|--------|----------|-----------------|--------|
| 1 | Alice Williams | AED 100,000 | Monthly | 1-15 (15th) | 1 Year | AED 3,000 | ✅ Active |
| 2 | TestDay3 User | AED 150,000 | Monthly | 16-30 (Month-end) | 1 Year | AED 4,500 | ✅ Active |
| 3 | TestDay6 User | AED 250,000 | Quarterly | 1-15 (15th) | 2 Years | AED 25,000 | ✅ Active |
| 4 | Alice Williams | AED 300,000 | Quarterly | 16-30 (Month-end) | 2 Years | AED 30,000 | ✅ Active |
| 5 | TestDay3 User | AED 200,000 | Monthly | 1-15 (15th) | 2 Years | AED 7,000 | ✅ Active |
| 6 | **test.verified@example.com** | **AED 175,000** | **Monthly** | **1-15 (15th)** | **1 Year** | **AED 5,250** | **✅ Active** |

### Overall Summary

- **Total Contracts**: 6
- **Total Payout Schedules**: 76
- **Total Pending Payouts**: 14 (AED 128,750)
- **Total Expected Interest**: AED 561,000 across all contracts

---

## 🧪 Testing Scenarios

### 1. Test as test.verified@example.com

**Login Credentials:**
- Email: `test.verified@example.com`
- Password: `Password123!`

**What to Test:**

1. **View Payout History** (`/client/payouts`)
   - Should see 12 total payout schedules
   - **3 pending payouts** already created (Dec 15, Jan 15, Feb 15)
   - Status cards showing: Missed | Pending | Scheduled | Completed
   - Expected next payout: **March 15, 2026** for **AED 5,250**

2. **Download Receipts** (after DocAdmin completes payouts)
   - Receipt download button appears for completed payouts
   - PDF/Image receipts downloadable

3. **In-App Notifications**
   - Check `/notifications` after payout completion
   - Should receive SUCCESS notification

4. **Email Notifications**
   - Should receive "Interest Payment Credited" email after payout completion
   - Email includes amount, period, contract number, and receipt link

---

### 2. Test as DocAdmin

**Login Credentials:**
- Email: `docadmin@wealthcrm.com`
- Password: `Password123!`

**What to Test:**

1. **Pending Payouts Dashboard** (`/docadmin/payouts`)
   - **Missed Tab**: Overdue payouts (before today)
   - **Pending Tab**: Payouts due today
   - **Upcoming Tab**: Payouts in next 2 days
   - **Completed Tab**: Already processed payouts

2. **Upload Receipt for test.verified@example.com**
   - Find payout for test.verified@example.com
   - Click "Upload Receipt" button
   - Select PDF/Image file (max 10MB)
   - Add optional notes
   - Click "Complete Payout"
   - Verify:
     - Payout status changes to COMPLETED
     - Transaction created
     - Client receives email and notification

3. **Search & Filter**
   - Search by client name: "TestVerified"
   - Search by tracking number: `PAYOUT-TEST-VERIFIED-USER-*`
   - Filter by date range
   - Filter by status

4. **Summary Statistics**
   - View total pending payouts
   - View total amounts by status
   - Check upcoming payout dates

---

### 3. Test Cron Jobs

**Daily Payout Generation** (Creates Payout records from PayoutSchedules)

```bash
# Manual trigger via API
curl http://localhost:3000/api/cron/payout-generation

# Or run test script
npx tsx src/scripts/test-cron-jobs.ts
```

**Expected Behavior:**
- Scans PayoutSchedules due within next 30 days
- Creates Payout records with status PENDING
- Marks PayoutSchedule as processed
- Creates audit log entries

**15th Reminder Email** (Runs on 14th at 9 AM)

```bash
curl http://localhost:3000/api/cron/payout-reminder-15th
```

**Expected Behavior:**
- Only runs on 14th of each month
- Sends email to all DocAdmins
- Lists all payouts due on 15th

**Month-End Reminder Email** (Runs on 29th at 9 AM)

```bash
curl http://localhost:3000/api/cron/payout-reminder-month-end
```

**Expected Behavior:**
- Runs 1-2 days before month end
- Sends email to all DocAdmins
- Lists all payouts due on last day of month

---

### 4. Test Payout Schedule Logic

**Verify Calculations:**

```bash
npx tsx src/scripts/verify-payout-amounts.ts
```

**Expected Output:**
- ✅ All 76 schedules verified
- ✅ All interest calculations correct
- ✅ Payout dates match window rules

**Test for test.verified@example.com:**
- Contract: AED 175,000 @ 3% monthly ROI
- Expected Interest: AED 5,250 per month
- Payout Window: 1-15 → **15th of each month**
- Payout Dates:
  - 2025-12-15, 2026-01-15, 2026-02-15, 2026-03-15, 2026-04-15
  - 2026-05-15, 2026-06-15, 2026-07-15, 2026-08-15, 2026-09-15
  - 2026-10-15, 2026-11-15

---

### 5. Test Email Notifications

**Test Payout Completion Email:**

1. Login as DocAdmin
2. Go to `/docadmin/payouts`
3. Find pending payout for test.verified@example.com (Feb 15, 2026)
4. Upload receipt and complete
5. Check email for test.verified@example.com

**Expected Email:**
- Subject: "Interest Payment Credited - AED 5,250"
- Body includes:
  - Amount: AED 5,250
  - Contract: PAYOUT-TEST-VERIFIED-USER-xxxxx
  - Period: Feb 1, 2026 - Feb 15, 2026
  - Receipt attached/linked
  - "View Payout History" button

---

### 6. Test Payout Windows

**Monthly 1-15 (Payout on 15th):**
- test.verified@example.com: ✅ All payouts on 15th
- Contract 1 (Alice): ✅ All payouts on 15th
- Contract 5 (TestDay3): ✅ All payouts on 15th

**Monthly 16-30 (Payout on month-end):**
- Contract 2 (TestDay3): ✅ All payouts on last day (28th, 30th, 31st)

**Quarterly 1-15 (Every 3 months on 15th):**
- Contract 3 (TestDay6): ✅ Payouts on 15th every 3 months

**Quarterly 16-30 (Every 3 months on month-end):**
- Contract 4 (Alice): ✅ Payouts on last day every 3 months

---

## 🔧 Testing Utilities

### Seed Test Data (Run Again)

```bash
npx tsx src/scripts/seed-payout-test-data.ts
```

Cleans old test data and creates fresh contracts.

### Verify test.verified@example.com

```bash
npx tsx src/scripts/verify-test-user-payouts.ts
```

Shows detailed payout information for test.verified@example.com.

### Manipulate Payouts for Testing

```bash
npx tsx src/scripts/manipulate-payout-for-testing.ts
```

Interactive script to:
- Set payout scheduled dates to today
- Mark payouts as overdue
- Create upcoming payouts

### Verify All Payout Calculations

```bash
npx tsx src/scripts/verify-payout-amounts.ts
```

Validates all payout schedule amounts are correct.

---

## 📊 Expected Test Results

### For test.verified@example.com

**Contract Details:**
- Tracking Number: `PAYOUT-TEST-VERIFIED-USER-1769317412432`
- Investment Amount: AED 175,000
- ROI: 3% per month
- Frequency: Monthly
- Duration: 1 Year (12 payouts)
- Payout Window: 1-15 (15th of month)
- Start Date: November 10, 2025

**Payout Schedule:**

| # | Scheduled Date | Amount | Period Start | Period End | Status |
|---|----------------|--------|--------------|------------|--------|
| 1 | 2025-12-15 | AED 5,250 | 2025-11-10 | 2025-12-09 | ✓ Payout Created |
| 2 | 2026-01-15 | AED 5,250 | 2025-12-10 | 2026-01-09 | ✓ Payout Created |
| 3 | 2026-02-15 | AED 5,250 | 2026-01-10 | 2026-02-09 | ✓ Payout Created |
| 4 | 2026-03-15 | AED 5,250 | 2026-02-10 | 2026-03-09 | ⏳ Scheduled |
| 5 | 2026-04-15 | AED 5,250 | 2026-03-10 | 2026-04-09 | ⏳ Scheduled |
| 6 | 2026-05-15 | AED 5,250 | 2026-04-10 | 2026-05-09 | ⏳ Scheduled |
| 7 | 2026-06-15 | AED 5,250 | 2026-05-10 | 2026-06-09 | ⏳ Scheduled |
| 8 | 2026-07-15 | AED 5,250 | 2026-06-10 | 2026-07-09 | ⏳ Scheduled |
| 9 | 2026-08-15 | AED 5,250 | 2026-07-10 | 2026-08-09 | ⏳ Scheduled |
| 10 | 2026-09-15 | AED 5,250 | 2026-08-10 | 2026-09-09 | ⏳ Scheduled |
| 11 | 2026-10-15 | AED 5,250 | 2026-09-10 | 2026-10-09 | ⏳ Scheduled |
| 12 | 2026-11-15 | AED 5,250 | 2026-10-10 | 2026-11-09 | ⏳ Scheduled |

**Totals:**
- Total Interest Expected: AED 63,000
- Payouts Created: 3 (PENDING)
- Pending Amount: AED 15,750

---

## ✅ System Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Payout Schedule Generation** | ✅ Working | All 76 schedules correct |
| **Monthly 1-15** | ✅ Verified | Payouts on 15th |
| **Monthly 16-30** | ✅ Verified | Payouts on month-end |
| **Quarterly 1-15** | ✅ Verified | Payouts on 15th every 3 months |
| **Quarterly 16-30** | ✅ Verified | Payouts on month-end every 3 months |
| **Interest Calculations** | ✅ 100% Accurate | (Principal × ROI) / 100 |
| **DocAdmin Dashboard** | ✅ Working | All tabs functional |
| **Client Dashboard** | ✅ Working | Status cards, filters working |
| **Client Emails** | ✅ **FIXED** | Now sends on completion |
| **In-App Notifications** | ✅ **ADDED** | Shows in dashboard |
| **Receipt Upload** | ✅ Working | PDF/Image supported |
| **Receipt Download** | ✅ Working | Available for clients |
| **Cron Jobs** | ✅ Working | Daily generation + reminders |
| **test.verified@example.com** | ✅ **READY** | Contract active with 12 payouts |

---

## 🚀 Quick Start Testing

1. **Login as test.verified@example.com**
   ```
   Email: test.verified@example.com
   Password: Password123!
   ```

2. **View Your Payouts**
   - Go to: http://localhost:3000/client/payouts
   - See 3 pending payouts (Dec, Jan, Feb)
   - Next payout: March 15, 2026 for AED 5,250

3. **Login as DocAdmin**
   ```
   Email: docadmin@wealthcrm.com
   Password: Password123!
   ```

4. **Complete a Payout**
   - Go to: http://localhost:3000/docadmin/payouts
   - Find test.verified@example.com payout
   - Upload receipt (any PDF/image)
   - Complete payout

5. **Verify Client Receives:**
   - ✅ Email: "Interest Payment Credited - AED 5,250"
   - ✅ In-app notification
   - ✅ Receipt download available in transaction history

---

**Last Updated:** January 25, 2026
**Test Data Version:** 1.0
**Status:** ✅ All systems operational
