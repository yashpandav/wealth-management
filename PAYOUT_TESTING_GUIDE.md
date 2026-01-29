# Payout Testing Guide

## ✅ Database Setup Complete

Your database has been successfully seeded with a verified test user ready for payout testing!

## 📋 Test User Details

**Email:** `test.verified@example.com`
**Password:** `Password123!`
**Status:** ✅ KYC Verified
**RM Assigned:** ✅ John Smith
**Risk Tolerance:** MEDIUM
**Investment Goals:** Regular monthly income through fixed returns

## 🚀 Quick Start - Payout Testing

### Step 1: Create Test Investment Contracts

Run the payout test manager to create investment contracts with payout schedules:

```bash
npx tsx src/scripts/payout-test-manager.ts setup
```

This will create:
- **3 test contracts** for test.verified@example.com
  - Monthly contract (1-15 window): AED 100,000
  - Monthly contract (16-30 window): AED 150,000
  - Quarterly contract: AED 200,000
- **Payout schedules** for each contract (monthly/quarterly)
- Contracts started 2-4 months ago (with historical data)

### Step 2: Generate Pending Payouts for Today

Set up payouts for current testing (missed, pending, upcoming):

```bash
npx tsx src/scripts/payout-test-manager.ts today
```

This creates:
- ❌ **Missed payouts** (2 days ago, yesterday)
- ⏰ **Pending payouts** (today)
- 📅 **Upcoming payouts** (tomorrow, +2 days)

### Step 3: View Payout Summary

```bash
npx tsx src/scripts/payout-test-manager.ts show
```

Shows:
- Total pending/completed payouts
- Breakdown by date
- Missed vs upcoming counts

## 🧪 Testing Workflows

### Test DocAdmin Payout Dashboard

1. **Login as DocAdmin:**
   - Email: `docadmin@wealthcrm.com`
   - Password: `Password123!`

2. **Navigate to:**
   ```
   http://localhost:3000/docadmin/payouts
   ```

3. **Test Features:**
   - View tabs: Missed | Pending | Upcoming | Completed
   - Filter by date range
   - Upload payout receipts
   - Mark payouts as completed
   - Download receipt PDFs

### Test Client Payout View

1. **Login as Test Client:**
   - Email: `test.verified@example.com`
   - Password: `Password123!`

2. **Navigate to:**
   ```
   http://localhost:3000/client/payouts
   ```

3. **Test Features:**
   - View status cards: Missed | Pending | Scheduled | Completed
   - Filter payouts by status
   - Download payout receipts
   - View payout history timeline
   - Check payout amounts match contracts

## 📊 Payout Test Manager Commands

```bash
# Show all available commands
npx tsx src/scripts/payout-test-manager.ts

# Create test contracts and schedules
npx tsx src/scripts/payout-test-manager.ts setup

# Set payouts for today (missed/pending/upcoming)
npx tsx src/scripts/payout-test-manager.ts today

# Show payout summary
npx tsx src/scripts/payout-test-manager.ts show

# Show upcoming payouts only
npx tsx src/scripts/payout-test-manager.ts upcoming

# Show missed/overdue payouts
npx tsx src/scripts/payout-test-manager.ts missed

# Mark first 3 pending payouts as completed
npx tsx src/scripts/payout-test-manager.ts complete

# Verify payout calculations are correct
npx tsx src/scripts/payout-test-manager.ts verify

# Clean up all test data
npx tsx src/scripts/payout-test-manager.ts reset
```

## 🔍 Verify Payout Calculations

```bash
npx tsx src/scripts/verify-payout-amounts.ts
```

**Expected Calculations:**
- Monthly 3% ROI: `(Principal × 3) / 100`
  - AED 100,000 → AED 3,000/month
  - AED 150,000 → AED 4,500/month
- Quarterly 10% ROI: `(Principal × 10) / 100`
  - AED 200,000 → AED 20,000/quarter

---

**Last Updated:** 2026-01-25
**Status:** ✅ Ready for Testing
**Test User:** test.verified@example.com
**Password:** Password123!
