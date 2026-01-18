# Payout System Testing Guide

This guide provides step-by-step instructions to test the complete payout functionality.

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

## Quick Test (Automated)

Run the comprehensive test script:

```bash
npx tsx src/scripts/test-payout-system.ts
```

This script will:
- ✅ Create test contracts with completed status
- ✅ Generate payout schedules (monthly and quarterly)
- ✅ Create pending payouts from schedules
- ✅ Test cron jobs
- ✅ Complete a sample payout
- ✅ Query client payout history

---

## Manual Testing

### 1. Test Payout Schedule Generation

**Test Data:**
The test script creates:
- **Contract 1**: AED 100,000 | Monthly | Window 1-15 | Started 2 months ago
- **Contract 2**: AED 250,000 | Quarterly | Window 16-30 | Started 4 months ago

**Verify in Prisma Studio:**
```bash
npx prisma studio
```

Navigate to `PayoutSchedule` table and verify:
- Contract 1 should have 12 schedules (12 months)
- Contract 2 should have 8 schedules (4 quarters × 2 years)
- Dates should be on 15th (1-15 window) or last day of month (16-30 window)

### 2. Test Payout Creation from Schedules

**Method 1: Via Service Function**
```typescript
// In Node.js REPL or test script
import { createPendingPayouts } from '@/lib/services/payout.service';

// Create payouts for schedules due in next 30 days
const count = await createPendingPayouts(30);
console.log(`Created ${count} pending payouts`);
```

**Method 2: Via API Endpoint**
```bash
# Trigger the daily cron job manually
curl http://localhost:3000/api/cron/payout-generation
```

**Expected Result:**
- Payout records created with status=PENDING
- PayoutSchedule.isProcessed set to true
- Check in Prisma Studio under `Payout` table

### 3. Test Cron Jobs

#### A. Daily Payout Generation (runs at 00:00 daily)

**Manual Trigger:**
```bash
curl -X GET http://localhost:3000/api/cron/payout-generation
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Daily payout generation completed",
  "timestamp": "2026-01-18T..."
}
```

#### B. 15th Reminder (runs on 14th at 09:00)

**Manual Trigger:**
```bash
curl -X GET http://localhost:3000/api/cron/payout-reminder-15th
```

**What it does:**
- Checks if tomorrow is the 15th
- Fetches pending payouts due on 15th
- Sends reminder email to DocAdmins
- Only sends if payouts exist

**Note:** Will skip if today is not the 14th

#### C. Month-End Reminder (runs on 29th at 09:00)

**Manual Trigger:**
```bash
curl -X GET http://localhost:3000/api/cron/payout-reminder-month-end
```

**What it does:**
- Checks if we're 1-2 days before month end
- Fetches pending payouts due on last day of month
- Sends reminder email to DocAdmins

**Note:** Will skip if today is not close to month end

### 4. Test Payout Completion (DocAdmin Flow)

**Via TypeScript:**
```typescript
import { completePayout } from '@/lib/services/payout.service';

// Get a pending payout ID from Prisma Studio
const payoutId = 'payout-id-here';
const receiptDocumentId = 'receipt-doc-id-here';
const docAdminUserId = 'docadmin-user-id-here';

await completePayout(
  payoutId,
  receiptDocumentId,
  docAdminUserId,
  'Manual test completion'
);
```

**What happens:**
1. ✅ Creates Transaction (type=INTEREST_PAYOUT, status=COMPLETED)
2. ✅ Updates Payout (status=COMPLETED, links receipt and transaction)
3. ✅ Updates PayoutSchedule (isProcessed=true)
4. ✅ Should send email to client (if SMTP configured)

**Verify:**
- Check `Transaction` table for new INTEREST_PAYOUT entry
- Check `Payout` table - status should be COMPLETED
- Check `PayoutSchedule` - isProcessed should be true

### 5. Test Client Payout Queries

**Get client payouts:**
```typescript
import { getClientPayouts, getClientTotalInterestEarned } from '@/lib/services/payout.service';

const clientId = 'client-id-here';

// Get all payouts for client
const payouts = await getClientPayouts(clientId);
console.log(`Total payouts: ${payouts.length}`);

// Get total interest earned
const total = await getClientTotalInterestEarned(clientId);
console.log(`Total earned: AED ${total}`);
```

### 6. Test Specific Dates

To test payouts for a specific date (e.g., test if payouts work on 15th):

```typescript
import { createPendingPayouts } from '@/lib/services/payout.service';
import { addDays } from 'date-fns';

// Test for a date 15 days from now
const lookaheadDays = 15;
const count = await createPendingPayouts(lookaheadDays);
console.log(`Created ${count} payouts for next ${lookaheadDays} days`);
```

**Or use the test script with custom date:**
```bash
# Edit the test script to use your target date
# Then run:
npx tsx src/scripts/test-payout-system.ts
```

---

## Testing Scenarios

### Scenario 1: Monthly Payout (Window 1-15)

1. Create contract with:
   - Amount: 100,000
   - Frequency: Monthly
   - Window: 1-15
   - Start date: 2 months ago

2. Generate schedules
3. Check that payout dates are on the 15th of each month
4. Verify interest calculation: (100,000 × ROI%) / 12

### Scenario 2: Quarterly Payout (Window 16-30)

1. Create contract with:
   - Amount: 250,000
   - Frequency: Quarterly
   - Window: 16-30
   - Start date: 4 months ago

2. Generate schedules
3. Check that payout dates are on last day of month (30/31)
4. Verify interest calculation: (250,000 × ROI%) / 4

### Scenario 3: Past Due Payouts

1. Create contract with start date 6 months ago
2. Generate schedules
3. Run `createPendingPayouts(30)`
4. Should create multiple payouts for past-due schedules

### Scenario 4: Cron Job at Midnight

1. Wait until 00:00 (or manually trigger)
2. Cron should auto-create payouts for next 3 days
3. Check logs for execution confirmation

### Scenario 5: Reminder Emails

**For 15th:**
1. Wait until 14th of month (or mock date)
2. Create payouts scheduled for 15th
3. Run reminder job
4. DocAdmin should receive email

**For Month-End:**
1. Wait until 29th (or mock date)
2. Create payouts scheduled for last day of month
3. Run reminder job
4. DocAdmin should receive email

---

## Debugging

### Check Logs

```bash
# Watch server logs
pnpm dev

# Check cron job execution
tail -f server.log  # if logging to file
```

### Common Issues

**Issue: No payouts created**
- Check if PayoutSchedule exists with `scheduledDate <= today + lookahead`
- Check if `isProcessed = false` on schedules
- Verify contract has `status = COMPLETED` and `payoutWindow` set

**Issue: Cron not running**
- Verify cron initialization in `src/app/api/cron/init/route.ts`
- Check if `node-cron` is running: look for "[CRON]" logs

**Issue: Email not sent**
- Check `SKIP_EMAIL` environment variable (should be false for production)
- Verify SMTP settings in `.env`
- Check email service logs

**Issue: Dates are wrong**
- Verify contract start date
- Check payout window value (must be "1-15" or "16-30")
- Verify frequency (must be "Monthly" or "Quarterly")

### Database Queries for Debugging

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
```

---

## Verification Checklist

After running tests, verify:

- [ ] PayoutSchedules created with correct dates
- [ ] Payout dates match window selection (15th or month-end)
- [ ] Interest amounts calculated correctly
- [ ] Pending Payouts created from schedules
- [ ] Schedules marked as processed after Payout creation
- [ ] Payout completion creates Transaction
- [ ] Transaction type is INTEREST_PAYOUT
- [ ] Client receives email on payout completion (if SMTP enabled)
- [ ] DocAdmin receives reminder emails on 14th and 29th
- [ ] Client can query their payout history
- [ ] Total interest earned calculates correctly
- [ ] Cron jobs run without errors
- [ ] Audit logs created (if implemented)

---

## Next Steps After Testing

1. **Build DocAdmin UI**
   - `/docadmin/payouts` page
   - Pending payouts table
   - Receipt upload form
   - Complete payout button

2. **Build Client UI**
   - `/client/payouts` page
   - Payout history table (read-only)
   - Receipt download
   - Total interest earned summary

3. **Add Audit Logging**
   - Log schedule generation
   - Log payout creation
   - Log payout completion
   - Log failures

4. **Production Setup**
   - Configure Vercel Cron or external cron service
   - Set up SMTP for production emails
   - Configure error monitoring
   - Set up backup jobs

---

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cron/payout-generation` | GET/POST | Daily payout generation (00:00) |
| `/api/cron/payout-reminder-15th` | GET/POST | 15th reminder (14th at 09:00) |
| `/api/cron/payout-reminder-month-end` | GET/POST | Month-end reminder (29th at 09:00) |
| `/api/docadmin/payouts` | GET | List pending payouts (to be built) |
| `/api/docadmin/payouts/[id]/complete` | POST | Complete payout (to be built) |
| `/api/client/payouts` | GET | Client payout history (to be built) |

---

## Environment Variables

```env
# Required for email functionality
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Set to false to enable emails in testing
SKIP_EMAIL=true

# Optional: Secure cron endpoints
CRON_SECRET=your-secret-key
```

---

## Troubleshooting Commands

```bash
# Reset test data
npx prisma migrate reset  # WARNING: Deletes all data

# Re-seed database
npx prisma db seed

# Run test script
npx tsx src/scripts/test-payout-system.ts

# Open Prisma Studio to inspect data
npx prisma studio

# Tail server logs
pnpm dev | grep CRON

# Check database connection
npx prisma db pull
```

---

**Last Updated:** 2026-01-18
