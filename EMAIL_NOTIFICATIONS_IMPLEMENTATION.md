# Email Notifications Implementation Guide

This document provides a complete overview of the email notification system implementation for the Wealth Management CRM platform.

## Summary of Changes

### ✅ Completed

1. **16 new email templates** added to `src/lib/email/email.service.ts`
2. **All email functions exported** from `src/lib/email/index.ts`
3. **Cron job service structure** created at `src/lib/cron/email-reminders.cron.ts`

---

## Email Templates Added

### Client Emails (8 templates)

#### Event-Based
1. **sendPurchaseRequestSubmittedEmail** - Confirmation when client submits purchase request
2. **sendProductRequestSubmittedEmail** - Confirmation when client submits product request
3. **sendContractUploadedEmail** - Notification when contract is ready for review

#### Time-Based (Cron Jobs)
4. **sendKYCReminderDay3** - KYC reminder 3 days after email verification
5. **sendKYCReminderDay6** - Final KYC reminder with deactivation warning (6 days after verification)
6. **sendKYCExpiredEmail** - Account deactivated notification (7 days after verification)
7. **sendMonthlyPayoutReminderEmail** - Monthly payout reminder on 15th of each month
8. **sendContractRenewalReminderEmail** - Contract renewal reminder 60 days before expiry

### RM Emails (3 templates)

1. **sendRMNewLeadAssignedEmail** - Notification when lead is assigned to RM
2. **sendRMPurchaseRequestNotification** - Alert when client submits purchase request
3. **sendRMWithdrawalRequestNotification** - Alert when client submits withdrawal request

### Admin Emails (1 template)

1. **sendAdminWithdrawalEscalationEmail** - Notification when RM approves withdrawal (requires admin approval)

### DocAdmin Emails (1 template)

1. **sendDocAdminContractUploadRequiredEmail** - Notification when product request is approved (contract upload needed)

---

## API Route Integration Points

### Client Purchase Request Submission
**File:** `src/app/api/client/purchase-requests/route.ts`
**Location:** After line 195 (after purchase request is created)
**Code to add:**
```typescript
import { sendPurchaseRequestSubmittedEmail, sendRMPurchaseRequestNotification } from '@/lib/email';

// After creating purchase request (line 195)

// Get client details
const clientUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { firstName: true, email: true },
});

// Send confirmation to client
if (clientUser) {
  sendPurchaseRequestSubmittedEmail(
    clientUser.email,
    clientUser.firstName,
    purchaseRequest.trackingNumber!,
    instrument.name,
    instrument.symbol,
    data.amount,
    instrument.currency
  ).catch(err => console.error('Failed to send client confirmation email:', err));
}

// Send notification to RM (if assigned)
if (client.assignedRM) {
  const rmName = `${client.assignedRM.user.firstName} ${client.assignedRM.user.lastName}`;
  const clientName = `${clientUser?.firstName} ${session.user.lastName || ''}`;

  sendRMPurchaseRequestNotification(
    client.assignedRM.user.email,
    rmName,
    clientName,
    purchaseRequest.trackingNumber!,
    instrument.name,
    instrument.symbol,
    data.amount,
    instrument.currency
  ).catch(err => console.error('Failed to send RM notification email:', err));
}
```

### Client Product Request Submission
**File:** `src/app/api/client/product-requests/route.ts`
**Location:** After line 284 (after product request is created)
**Code to add:**
```typescript
import { sendProductRequestSubmittedEmail } from '@/lib/email';

// After creating product request (line 284)
// Note: RM email is already sent (inline) - should be refactored to use sendRMProductRequestNotification

// Send confirmation to client
sendProductRequestSubmittedEmail(
  client.user.email,
  client.user.firstName,
  purchaseRequest.trackingNumber!,
  product.name,
  data.amount,
  product.currency,
  productOption.duration,
  Number(productOption.roi)
).catch(err => console.error('Failed to send client confirmation email:', err));
```

### Client Withdrawal Request Submission
**File:** `src/app/api/client/withdrawal-requests/route.ts`
**Location:** After withdrawal request creation
**Code to add:**
```typescript
import { sendRMWithdrawalRequestNotification } from '@/lib/email';

// After creating withdrawal request

// Send notification to RM (if assigned)
if (client.assignedRM) {
  const rmName = `${client.assignedRM.user.firstName} ${client.assignedRM.user.lastName}`;
  const clientName = `${client.user.firstName} ${client.user.lastName}`;

  sendRMWithdrawalRequestNotification(
    client.assignedRM.user.email,
    rmName,
    clientName,
    withdrawalRequest.trackingNumber!,
    data.amount,
    'USD' // Or get from portfolio
  ).catch(err => console.error('Failed to send RM notification email:', err));
}
```

### RM Approves Withdrawal - Escalate to Admin
**File:** `src/app/api/rm/withdrawal-requests/[id]/review/route.ts`
**Location:** After RM approves withdrawal
**Code to add:**
```typescript
import { sendAdminWithdrawalEscalationEmail } from '@/lib/email';

// After updating withdrawal status to RM_APPROVED

// Get all admins
const admins = await prisma.user.findMany({
  where: { role: 'ADMIN', status: 'ACTIVE' },
  select: { email: true, firstName: true, lastName: true },
});

// Send notification to all admins
for (const admin of admins) {
  const adminName = `${admin.firstName} ${admin.lastName}`;
  const clientName = `${withdrawalRequest.client.user.firstName} ${withdrawalRequest.client.user.lastName}`;
  const rmName = `${rm.user.firstName} ${rm.user.lastName}`;

  sendAdminWithdrawalEscalationEmail(
    admin.email,
    adminName,
    clientName,
    withdrawalRequest.trackingNumber,
    Number(withdrawalRequest.amount),
    'USD', // Or get from portfolio
    rmName
  ).catch(err => console.error('Failed to send admin notification email:', err));
}
```

### RM Approves Product Request - Notify DocAdmin for Contract
**File:** `src/app/api/rm/product-requests/[id]/route.ts`
**Location:** After RM approves product request (after line 274)
**Code to add:**
```typescript
import { sendDocAdminContractUploadRequiredEmail } from '@/lib/email';

// After approving product request (action === 'APPROVE')

if (action === 'APPROVE') {
  // Get all DocAdmins
  const docAdmins = await prisma.user.findMany({
    where: { role: 'DOCADMIN', status: 'ACTIVE' },
    select: { email: true, firstName: true, lastName: true },
  });

  // Send notification to all DocAdmins
  for (const docAdmin of docAdmins) {
    const docAdminName = `${docAdmin.firstName} ${docAdmin.lastName}`;

    sendDocAdminContractUploadRequiredEmail(
      docAdmin.email,
      docAdminName,
      clientName,
      productName,
      productRequest.trackingNumber,
      amount,
      currency
    ).catch(err => console.error('Failed to send DocAdmin notification email:', err));
  }
}
```

### DocAdmin Uploads Contract
**File:** `src/app/api/docadmin/product-requests/[id]/upload-contract/route.ts`
**Location:** After contract upload is successful
**Code to add:**
```typescript
import { sendContractUploadedEmail } from '@/lib/email';

// After successfully uploading contract

// Get product request with client details
const productRequest = await prisma.productPurchaseRequest.findUnique({
  where: { id: productRequestId },
  include: {
    client: {
      include: {
        user: {
          select: { email: true, firstName: true },
        },
      },
    },
    product: {
      select: { name: true },
    },
  },
});

if (productRequest) {
  // Construct contract URL
  const contractUrl = `${process.env.NEXTAUTH_URL}/client/product-requests/${productRequest.id}/contract`;

  sendContractUploadedEmail(
    productRequest.client.user.email,
    productRequest.client.user.firstName,
    productRequest.product.name,
    productRequest.trackingNumber,
    contractUrl
  ).catch(err => console.error('Failed to send contract uploaded email:', err));
}
```

### Lead Assignment to RM
**File:** `src/app/api/docadmin/leads/[id]/assign-rm/route.ts` OR `src/app/api/admin/clients/assign/route.ts`
**Location:** After RM is assigned to lead/client
**Code to add:**
```typescript
import { sendRMNewLeadAssignedEmail } from '@/lib/email';

// After assigning RM to lead

// Get RM and lead details
const rm = await prisma.relationshipManager.findUnique({
  where: { id: rmId },
  include: {
    user: {
      select: { email: true, firstName: true, lastName: true },
    },
  },
});

const lead = await prisma.userLead.findUnique({
  where: { id: leadId },
  select: { firstName: true, lastName: true, email: true, phone: true },
});

if (rm && lead) {
  const rmName = `${rm.user.firstName} ${rm.user.lastName}`;
  const leadName = `${lead.firstName} ${lead.lastName}`;

  sendRMNewLeadAssignedEmail(
    rm.user.email,
    rmName,
    leadName,
    lead.email,
    lead.phone || 'N/A'
  ).catch(err => console.error('Failed to send RM lead assignment email:', err));
}
```

---

## Cron Jobs Setup

### Prerequisites

1. **Install cron library:**
```bash
pnpm add node-cron @types/node-cron
```

2. **Uncomment cron code** in `src/lib/cron/email-reminders.cron.ts`

### Cron Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| KYC Day 3 | Daily 9:00 AM | Send reminder 3 days after email verification |
| KYC Day 6 | Daily 9:00 AM | Send warning 6 days after email verification |
| KYC Expiry | Daily 9:00 AM | Deactivate accounts 7 days after email verification |
| Monthly Payout | 15th at 9:00 AM | Send monthly payout reminders |
| Contract Renewal | Daily 9:00 AM | Send reminders 60 days before contract expiry |

### Cron Initialization

**Option 1: Next.js API Route**
Create `src/app/api/cron/init/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { initializeEmailCronJobs } from '@/lib/cron/email-reminders.cron';

// Call once during server startup
initializeEmailCronJobs();

export async function GET() {
  return NextResponse.json({ message: 'Cron jobs initialized' });
}
```

**Option 2: Standalone Server**
Create `src/server/cron-server.ts`:
```typescript
import { initializeEmailCronJobs } from '@/lib/cron/email-reminders.cron';

console.log('Starting cron server...');
initializeEmailCronJobs();
console.log('Cron server running');
```

### Manual Testing Endpoints

Create `src/app/api/cron/test/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { emailCronHandlers } from '@/lib/cron/email-reminders.cron';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Only admins can trigger cron jobs manually
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { job } = await request.json();

  const handler = emailCronHandlers[job as keyof typeof emailCronHandlers];
  if (!handler) {
    return NextResponse.json({ error: 'Invalid job name' }, { status: 400 });
  }

  const result = await handler();
  return NextResponse.json(result);
}
```

---

## Testing Checklist

### Event-Based Emails
- [ ] Client submits purchase request → Client receives confirmation, RM receives notification
- [ ] Client submits product request → Client receives confirmation, RM receives notification
- [ ] Client submits withdrawal request → RM receives notification
- [ ] RM approves purchase request → Client receives approval email
- [ ] RM rejects purchase request → Client receives rejection email
- [ ] RM approves product request → DocAdmin receives contract upload notification
- [ ] RM approves withdrawal → Admin receives escalation notification
- [ ] Admin approves withdrawal → Client receives final approval email
- [ ] DocAdmin uploads contract → Client receives contract ready email
- [ ] Lead assigned to RM → RM receives assignment notification

### Time-Based Emails (Cron)
- [ ] Day 3 KYC reminder sent to users who verified 3 days ago
- [ ] Day 6 KYC warning sent to users who verified 6 days ago
- [ ] Day 7 account deactivation + email sent to users who verified 7 days ago
- [ ] Monthly payout reminder sent on 15th of month
- [ ] Contract renewal reminder sent 60 days before expiry

### Email Delivery
- [ ] Check SKIP_EMAIL flag in development (emails logged, not sent)
- [ ] Verify SMTP configuration for production
- [ ] Test email formatting on multiple clients (Gmail, Outlook, Apple Mail)
- [ ] Verify all links in emails are correct
- [ ] Check mobile responsiveness of email templates

---

## Environment Variables

Ensure these are set in `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SKIP_EMAIL=true  # Set to false in production

# Application URL (for email links)
NEXTAUTH_URL=http://localhost:3000  # Update for production
```

---

## Important Notes

### Idempotency
All time-based emails are idempotent:
- Each cron job queries by exact date range
- Prevents duplicate emails
- Users are queried once per condition

### Error Handling
- All email sends use `.catch()` to prevent blocking
- Errors are logged but don't stop execution
- Failed emails should be monitored via logs

### Database Queries
- Cron jobs use indexed date fields
- Consider adding indexes on:
  - `User.emailVerifiedAt`
  - `ProductPurchaseRequest.createdAt`
  - Add contract expiry date field if needed

### Scalability
- For high volume, consider using a queue (Bull, BullMQ)
- Batch email sends in chunks
- Use background workers for heavy operations

---

## Next Steps

1. **Review and adjust** email templates to match brand voice
2. **Install cron library** and uncomment cron code
3. **Integrate email triggers** into API routes using code snippets above
4. **Test email delivery** in development environment
5. **Set up monitoring** for email failures
6. **Deploy cron jobs** to production server
7. **Monitor logs** for the first few days after deployment

---

## Additional Resources

- Email Service: `src/lib/email/email.service.ts`
- Cron Jobs: `src/lib/cron/email-reminders.cron.ts`
- Existing Templates: Review for consistency
- CLAUDE.md: Project documentation and standards

---

**Implementation Status:** ✅ Email templates complete, ⏳ API integration pending, ⏳ Cron setup pending

**Last Updated:** 2025-12-28
