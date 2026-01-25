# Payout System Testing Guide

## Overview

This comprehensive guide explains how to thoroughly test the payout functionality for both **Monthly** and **Quarterly** payouts with different payout windows.

## System Architecture

### Key Components

1. **PayoutSchedule** - Generated when a contract is COMPLETED
   - Contains all future payout dates for the entire contract lifetime
   - Fields: `scheduledDate`, `interestAmount`, `periodStart`, `periodEnd`, `isProcessed`

2. **Payout** - Created from PayoutSchedule by the daily cron job
   - Represents an actual payout that DocAdmin must process
   - Fields: `status` (PENDING/COMPLETED), `amount`, `receiptDocumentId`, `transactionId`

3. **Cron Jobs** - 3 automated jobs:
   - **Daily Generation** (00:00): Creates Payout records from PayoutSchedules (3-day lookahead)
   - **15th Reminder** (14th at 09:00): Emails DocAdmins about payouts due on 15th
   - **Month-End Reminder** (29th at 09:00): Emails DocAdmins about month-end payouts

### Payout Logic

#### Monthly Payouts
- **Window 1-15**: Payout on **15th of each month**
- **Window 16-30**: Payout on **last day of each month**
- Contract with 1 Year duration = 12 monthly payouts

#### Quarterly Payouts
- **Window 1-15**: Payout on **15th every 3 months**
- **Window 16-30**: Payout on **last day every 3 months**
- Contract with 2 Years duration = 8 quarterly payouts

**Example:** Contract starts Jan 1
- **Monthly (1-15)**: Payouts on Feb 15, Mar 15, Apr 15, ... Jan 15
- **Monthly (16-30)**: Payouts on Feb 28/29, Mar 31, Apr 30, ... Jan 31
- **Quarterly (1-15)**: Payouts on Apr 15, Jul 15, Oct 15, Jan 15 (next year), ...
- **Quarterly (16-30)**: Payouts on Apr 30, Jul 31, Oct 31, Jan 31 (next year), ...

---

## Testing Strategies

### Strategy 1: Comprehensive Automated Testing ⭐ RECOMMENDED

Use the comprehensive testing script to validate all scenarios:

```bash
npx tsx src/scripts/comprehensive-payout-testing.ts
```

**This script:**
- ✅ Creates 4 test contracts (Monthly 1-15, Monthly 16-30, Quarterly 1-15, Quarterly 16-30)
- ✅ Generates payout schedules for each
- ✅ Validates schedule dates are correct (15th or month-end)
- ✅ Validates quarterly spacing (exactly 3 months apart)
- ✅ Tests payout creation from schedules
- ✅ Tests cron jobs
- ✅ Shows detailed validation results with ✓/✗ indicators

**Output Example:**
```
================================================================================
  TEST SCENARIO 1: Monthly Payouts - Window 1-15 (Payout on 15th)
================================================================================

Creating test contract:
  Client: Alice Williams
  Start Date: 2025-10-24
  Amount: AED 100,000
  Frequency: Monthly
  Window: 1-15 (payouts on 15th of each month)
  Duration: 1 Year (12 payouts)
  ROI: 1.5% per month

✓ Contract created: TEST-MONTHLY-1-15-1737733567890

▶ Generating Payout Schedules
✓ Generated 12 payout schedules

Validating schedule dates:
✓ All 12 payouts are scheduled on the 15th

First 3 schedules:
  1. 2025-11-15 | AED 1500.00 | Period: 2025-10-24 to 2025-11-14
  2. 2025-12-15 | AED 1500.00 | Period: 2025-11-15 to 2025-12-14
  3. 2026-01-15 | AED 1500.00 | Period: 2025-12-15 to 2026-01-14
```

---

### Strategy 2: Manual Date Manipulation Testing

When you need to test **today's date** (e.g., for DocAdmin receipt upload):

#### Step 1: Create a contract using comprehensive test
```bash
npx tsx src/scripts/comprehensive-payout-testing.ts
```

#### Step 2: Note the contract tracking number from output
Example: `TEST-MONTHLY-1-15-1737733567890`

#### Step 3: Use the manipulation script

Edit `src/scripts/manipulate-payout-for-testing.ts` and update line 13:
```typescript
const trackingNumber = 'TEST-MONTHLY-1-15-1737733567890'; // Your tracking number
```

Then run:
```bash
npx tsx src/scripts/manipulate-payout-for-testing.ts
```

**This will:**
- Set the first payout schedule to **today**
- Set the second payout schedule to **tomorrow**
- Create pending Payout records
- Show you the payout IDs for testing

**Output:**
```
✅ Created 2 pending payout(s)

📋 Pending Payouts Ready for Testing:
   1. ID: payout_abc123 | Scheduled: 2026-01-24 | Amount: AED 1500.00
   2. ID: payout_def456 | Scheduled: 2026-01-25 | Amount: AED 1500.00

✅ SUCCESS! You can now test payout receipt upload:
   1. Go to: http://localhost:3001/docadmin/payouts
   2. Find the pending payout(s) listed above
   3. Click "Upload Receipt" button
   4. Upload a test PDF/image file
   5. Verify the payout completes successfully
```

---

### Strategy 3: Testing Cron Jobs via API

Test the cron endpoints directly:

#### Daily Payout Generation
```bash
curl http://localhost:3000/api/cron/payout-generation
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Daily payout generation completed",
  "timestamp": "2026-01-24T..."
}
```

#### 15th Reminder (only works on 14th)
```bash
curl http://localhost:3000/api/cron/payout-reminder-15th
```

**What it does:**
- Checks if tomorrow is the 15th
- Fetches pending payouts due on 15th
- Sends reminder email to DocAdmins
- Only sends if payouts exist

**Note:** Will skip if today is not the 14th

#### Month-End Reminder (only works on 29th)
```bash
curl http://localhost:3000/api/cron/payout-reminder-month-end
```

**What it does:**
- Checks if we're 1-2 days before month end
- Fetches pending payouts due on last day of month
- Sends reminder email to DocAdmins

**Note:** Will skip if today is not close to month end

---

### Strategy 4: Using Existing Test Scripts

#### Original Payout System Test
```bash
npx tsx src/scripts/test-payout-system.ts
```
- Tests end-to-end payout flow
- Creates contracts, schedules, payouts, and completes a payout

#### Test Cron Jobs
```bash
npx tsx src/scripts/test-cron-jobs.ts
```
- Directly tests the 3 cron jobs

#### Verify Payout Calculation
```bash
npx tsx src/scripts/verify-payout-calculation.ts
```
- Validates ROI calculation logic

---

## Validation Checklist

Use this checklist to ensure everything works correctly:

### ✅ Monthly Payouts (1-15 Window)
- [ ] All 12 schedules created for 1-year contract
- [ ] All schedules are on the **15th** of each month
- [ ] Interest amount matches: `(amount × ROI) / 100`
- [ ] Period dates are correct (month 0 to month 1, month 1 to month 2, etc.)
- [ ] Past-due schedules create Payout records
- [ ] Payout status is PENDING initially

### ✅ Monthly Payouts (16-30 Window)
- [ ] All 12 schedules created
- [ ] All schedules are on **last day of month** (28/29/30/31)
- [ ] February handled correctly (28 or 29 for leap years)
- [ ] Interest calculation correct
- [ ] Period dates correct

### ✅ Quarterly Payouts (1-15 Window)
- [ ] 8 schedules created for 2-year contract
- [ ] All schedules are on the **15th**
- [ ] Schedules are exactly **3 months apart**
- [ ] First payout is 3 months after start date
- [ ] Interest amount is: `(amount × quarterly ROI) / 100`
- [ ] Period spans 3 months

### ✅ Quarterly Payouts (16-30 Window)
- [ ] 8 schedules created
- [ ] All schedules are on **month-end**
- [ ] Schedules are exactly **3 months apart**
- [ ] Calculation correct

### ✅ Cron Jobs
- [ ] Daily job creates Payout records from PayoutSchedules
- [ ] Daily job looks ahead 3 days by default
- [ ] Daily job marks schedules as `isProcessed: true`
- [ ] 15th reminder only runs on 14th
- [ ] Month-end reminder only runs on 29th
- [ ] Email reminders sent to all active DocAdmins

### ✅ Payout Completion (DocAdmin Flow)
- [ ] DocAdmin can see pending payouts
- [ ] DocAdmin can upload receipt (PDF/image)
- [ ] Payout status changes to COMPLETED
- [ ] Transaction record created with type INTEREST_PAYOUT
- [ ] Client receives email notification
- [ ] Receipt is downloadable by client
- [ ] Audit log entry created

---

## Common Issues & Troubleshooting

### Issue 1: Schedules not created
**Symptom:** `generatePayoutSchedules()` returns 0 schedules

**Possible Causes:**
- Contract status is not `COMPLETED`
- `contractStartDate` is null
- `payoutWindow` is null
- Investment option not found

**Solution:**
```typescript
// Check contract before generating schedules
const contract = await prisma.productPurchaseRequest.findUnique({
  where: { id: contractId },
  include: { investmentOption: true },
});

console.log('Contract Status:', contract?.status);
console.log('Start Date:', contract?.contractStartDate);
console.log('Payout Window:', contract?.payoutWindow);
```

---

### Issue 2: Payouts not created by cron job
**Symptom:** Daily cron runs but creates 0 payouts

**Possible Causes:**
- No schedules within 3-day lookahead window
- Schedules already marked as `isProcessed: true`
- Payout already exists for the schedule

**Solution:**
```bash
# Check unprocessed schedules
npx prisma studio
# Go to PayoutSchedule table
# Filter: isProcessed = false AND scheduledDate <= (today + 3 days)
```

Or query directly:
```typescript
const dueSchedules = await prisma.payoutSchedule.findMany({
  where: {
    isProcessed: false,
    scheduledDate: { lte: addDays(new Date(), 3) },
  },
});
console.log('Due schedules:', dueSchedules.length);
```

---

### Issue 3: Wrong dates in schedules
**Symptom:** Payouts scheduled on wrong days (e.g., 14th instead of 15th)

**Possible Causes:**
- Timezone issues
- Date calculation logic error
- Wrong payout window stored

**Debug:**
```typescript
import { addMonths, endOfMonth } from 'date-fns';

const startDate = new Date('2026-01-01');
const monthOffset = 1;
const payoutMonth = addMonths(startDate, monthOffset);

console.log('Start:', startDate.toISOString());
console.log('Payout Month:', payoutMonth.toISOString());

// For 1-15 window
const date15th = new Date(payoutMonth.getFullYear(), payoutMonth.getMonth(), 15);
console.log('15th:', date15th.toISOString());

// For 16-30 window
const monthEnd = endOfMonth(payoutMonth);
console.log('Month-end:', monthEnd.toISOString());
```

---

### Issue 4: Quarterly spacing incorrect
**Symptom:** Quarterly payouts are not exactly 3 months apart

**Debug:**
```typescript
// Check the schedules
const schedules = await prisma.payoutSchedule.findMany({
  where: { productPurchaseRequestId: contractId },
  orderBy: { scheduledDate: 'asc' },
});

schedules.forEach((s, i) => {
  if (i > 0) {
    const prev = schedules[i - 1].scheduledDate;
    const curr = s.scheduledDate;
    const monthDiff = (curr.getFullYear() - prev.getFullYear()) * 12
                    + (curr.getMonth() - prev.getMonth());
    console.log(`${i}: ${curr.toISOString().split('T')[0]} (${monthDiff} months from previous)`);
  }
});
```

---

### Issue 5: Email not sent
**Symptoms:**
- Cron runs successfully but no emails received
- DocAdmins not receiving reminder emails

**Possible Causes:**
- `SKIP_EMAIL=true` in `.env`
- SMTP settings not configured
- Email service error (check logs)

**Solution:**
```bash
# Check environment variables
cat .env | grep EMAIL
cat .env | grep SMTP

# Should see:
# SKIP_EMAIL=false  (or not set)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASS=your-password
```

---

### Issue 6: Cron jobs not running
**Symptom:** No "[CRON]" messages in logs

**Possible Causes:**
- Cron initialization not called
- `node-cron` package issue
- Server not started correctly

**Solution:**
```bash
# Check if cron initialization is called
# Look in server startup logs for:
# "[CRON] Email notification cron jobs initialized"
# "[CRON] Payout cron jobs initialized"

# Check cron job status
curl http://localhost:3000/api/cron/init

# Should return:
# {
#   "success": true,
#   "message": "All cron jobs are initialized and running",
#   "jobs": [...]
# }
```

---

## Test Data Cleanup

After testing, clean up test data:

### Option 1: SQL (via Prisma Studio)
```sql
-- Delete test payouts
DELETE FROM "Payout"
WHERE "productPurchaseRequestId" IN (
  SELECT id FROM "ProductPurchaseRequest"
  WHERE "trackingNumber" LIKE 'TEST-%'
);

-- Delete test payout schedules
DELETE FROM "PayoutSchedule"
WHERE "productPurchaseRequestId" IN (
  SELECT id FROM "ProductPurchaseRequest"
  WHERE "trackingNumber" LIKE 'TEST-%'
);

-- Delete test contracts
DELETE FROM "ProductPurchaseRequest"
WHERE "trackingNumber" LIKE 'TEST-%';
```

### Option 2: TypeScript/Prisma
```typescript
await prisma.payout.deleteMany({
  where: {
    productPurchaseRequest: {
      trackingNumber: { startsWith: 'TEST-' },
    },
  },
});

await prisma.payoutSchedule.deleteMany({
  where: {
    productPurchaseRequest: {
      trackingNumber: { startsWith: 'TEST-' },
    },
  },
});

await prisma.productPurchaseRequest.deleteMany({
  where: {
    trackingNumber: { startsWith: 'TEST-' },
  },
});
```

---

## ROI Calculation Reference

**Monthly:**
- ROI field in InvestmentOption: Monthly ROI (e.g., 1.5%)
- Interest per payout: `(principal × 1.5) / 100`
- Example: AED 100,000 × 1.5% = AED 1,500 per month

**Quarterly:**
- ROI field in InvestmentOption: Quarterly ROI (e.g., 4.5%)
- Interest per payout: `(principal × 4.5) / 100`
- Example: AED 250,000 × 4.5% = AED 11,250 per quarter

**Important:** The `roi` field stores the **per-period ROI**, not annual ROI.
- Monthly option: `roi` = monthly return
- Quarterly option: `roi` = quarterly return
- The `annualReturn` field stores the equivalent annual return for display purposes

---

## Architecture Diagram

```
Contract Lifecycle:

  1. ProductPurchaseRequest created (PENDING)
     ↓
  2. RM approves → PROCESSING
     ↓
  3. DocAdmin uploads contract → COMPLETED
     ↓
  4. generatePayoutSchedules() creates PayoutSchedule records
     ├─ Monthly: 12 schedules (1 year) or 24 (2 years)
     └─ Quarterly: 4 schedules (1 year) or 8 (2 years)

  Daily Cron Job (00:00):
     ↓
  5. createPendingPayouts() reads PayoutSchedule
     ├─ Filters: isProcessed = false AND scheduledDate <= today+3 days
     └─ Creates Payout records (status: PENDING)

  DocAdmin Action:
     ↓
  6. Upload receipt → completePayout()
     ├─ Create Transaction (type: INTEREST_PAYOUT)
     ├─ Update Payout (status: COMPLETED, link receipt)
     ├─ Create AuditLog
     └─ Send email to client

  Client View:
     ↓
  7. Client sees payout history + downloads receipt
```

---

## Prerequisites

1. **Database migration applied**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Database seeded**:
   ```bash
   npx prisma db seed
   ```

3. **Development server running**:
   ```bash
   pnpm dev
   ```

---

## Quick Reference Commands

```bash
# ⭐ Run comprehensive tests (RECOMMENDED)
npx tsx src/scripts/comprehensive-payout-testing.ts

# Manipulate dates for today's testing
npx tsx src/scripts/manipulate-payout-for-testing.ts

# Test original payout system
npx tsx src/scripts/test-payout-system.ts

# Test cron jobs
npx tsx src/scripts/test-cron-jobs.ts

# Verify calculations
npx tsx src/scripts/verify-payout-calculation.ts

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Check cron job status
curl http://localhost:3000/api/cron/init

# Trigger daily generation manually
curl http://localhost:3000/api/cron/payout-generation

# Trigger 15th reminder manually
curl http://localhost:3000/api/cron/payout-reminder-15th

# Trigger month-end reminder manually
curl http://localhost:3000/api/cron/payout-reminder-month-end
```

---

## Database Queries for Debugging

```sql
-- Check payout schedules
SELECT * FROM "PayoutSchedule"
WHERE "isProcessed" = false
ORDER BY "scheduledDate" ASC;

-- Check pending payouts
SELECT * FROM "Payout"
WHERE "status" = 'PENDING'
ORDER BY "scheduledDate" ASC;

-- Check completed payouts with transactions
SELECT p.*, t."type", t."amount"
FROM "Payout" p
LEFT JOIN "Transaction" t ON p."transactionId" = t.id
WHERE p."status" = 'COMPLETED';

-- Total interest by client
SELECT c."id", u."firstName", u."lastName", SUM(p."amount") as "totalInterest"
FROM "Payout" p
JOIN "Client" c ON p."clientId" = c."id"
JOIN "User" u ON c."userId" = u."id"
WHERE p."status" = 'COMPLETED'
GROUP BY c."id", u."firstName", u."lastName";

-- Check for test data
SELECT "trackingNumber", "payoutWindow", "contractStartDate", "status"
FROM "ProductPurchaseRequest"
WHERE "trackingNumber" LIKE 'TEST-%';
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Test all 4 payout scenarios (monthly/quarterly × 1-15/16-30)
- [ ] Verify cron jobs are scheduled correctly in production environment
- [ ] Set `CRON_SECRET` environment variable for security
- [ ] Configure SMTP for email notifications
- [ ] Test email delivery to DocAdmins
- [ ] Verify timezone handling (all dates in UTC in DB)
- [ ] Test leap year edge case (February 29 for 16-30 window)
- [ ] Load test: Create 100+ contracts and verify performance
- [ ] Monitor cron job execution logs
- [ ] Set up alerts for failed payout generations
- [ ] Document payout SLA for DocAdmins
- [ ] Configure external cron service (Vercel Cron, AWS EventBridge, etc.)

---

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cron/init` | GET | Health check for cron jobs |
| `/api/cron/payout-generation` | GET/POST | Daily payout generation (00:00) |
| `/api/cron/payout-reminder-15th` | GET/POST | 15th reminder (14th at 09:00) |
| `/api/cron/payout-reminder-month-end` | GET/POST | Month-end reminder (29th at 09:00) |
| `/api/docadmin/payouts` | GET | List pending payouts |
| `/api/docadmin/payouts/[id]/complete` | POST | Complete payout |
| `/api/client/payouts` | GET | Client payout history |

---

## Environment Variables

```env
# Required for email functionality
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Set to false to enable emails in production
SKIP_EMAIL=true

# Optional: Secure cron endpoints
CRON_SECRET=your-secret-key
```

---

## Next Steps After Testing

1. **Verify All Tests Pass**
   - Run comprehensive test script
   - Check all ✓ validations pass
   - No ✗ errors in output

2. **Test DocAdmin UI**
   - Navigate to `/docadmin/payouts`
   - Verify pending payouts list
   - Test receipt upload
   - Verify payout completion

3. **Test Client UI**
   - Navigate to `/client/payouts`
   - Verify payout history
   - Test receipt download
   - Verify total interest calculation

4. **Production Setup**
   - Configure external cron service
   - Set up SMTP for production emails
   - Configure error monitoring
   - Set up backup jobs

---

**Last Updated:** 2026-01-24
**Version:** 2.0
**Contributors:** Claude Code
