---
Wealth Management CRM Platform - System Analysis Report
---

A. TECH STACK & TOOLS

Frontend Framework

- Next.js 14+ with App Router (TypeScript)
- React 18.3 with React Hook Form for forms
- Tailwind CSS 3.4+ with shadcn/ui components
- TanStack Query for server state management
- Recharts for data visualization

Backend Framework

- Next.js API Routes (App Router /api/ endpoints)
- 60+ RESTful API endpoints organized by role

Authentication System

- NextAuth.js v4 with Credentials Provider
- JWT-based sessions (30-minute inactivity timeout)
- bcrypt (rounds=12) for password hashing
- Email verification flow - token-based with 24-hour expiry
- Account lockout - 5 failed attempts → 30-minute lockout
- No OAuth/Social login currently implemented

Database & ORM

- PostgreSQL 15+
- Prisma 5.20 ORM with schema at prisma/schema.prisma
- 937 lines of schema defining 20+ models

Database Schema Key Entities & Relations

| Entity                | Key Relations                                            |
|-----------------------|----------------------------------------------------------|
| User                  | Base entity → extends to Client, RM, Admin, DocAdmin     |
| Client                | 1:1 to RM (optional), 1:1 to Portfolio, 1:many Documents |
| Portfolio             | 1:many Holdings                                          |
| Holding               | many:1 Instrument                                        |
| PurchaseRequest       | Client → Instrument, processed by RM                     |
| WithdrawalRequest     | Client → two-tier approval (RM → Admin)                  |
| Document              | Client → verified by DocAdmin/Admin                      |
| AuditLog              | Tracks 30+ action types                                  |
| UserLead              | Public form submissions (separate from Users)            |
| Product/ProductOption | Investment venture types (A/B/C)                         |

File Storage

- Local file paths stored in database (filePath field in Document)
- Document uploads to /uploads/ directory via /api/documents/upload and /api/rm/upload
- No cloud storage (S3/GCS) integration

Email / Notification System

- Nodemailer with SMTP configuration
- In-app notifications via Notification model
- Email templates in src/lib/email/email.service.ts (1,260 lines)
- Skip email flag for development (SKIP_EMAIL=true)

Role-Based Access Control (RBAC)

- Defined in src/lib/auth/rbac.hooks.ts
- Permissions mapped per role in rolePermissions object
- Client-side hooks: useIsAdmin(), useIsRM(), useIsClient(), useIsDocAdmin()
- Server-side checks via getServerSession() + role validation

Background Jobs / Cron / Queues

- NOT IMPLEMENTED - No background processing
- No cron jobs, schedulers, or message queues
- All operations are synchronous request/response

---
B. USER ROLES & PERMISSIONS (CURRENT)

1. PUBLIC USER (Unauthenticated)

Can Access:
- Browse /instruments (public listing)
- Submit /user-form (lead form only)
- View homepage

Cannot:
- Access any dashboard
- Make investments
- View personal data

---
2. CLIENT (Authenticated Customer)

Can Access:
- View assigned RM details (/client/my-rm)
- Browse instruments and products
- Submit purchase requests
- Submit withdrawal requests
- View portfolio and transaction history
- View analytics dashboard
- View own notifications

Cannot:
- Approve any transactions
- Access other clients' data
- Create instruments
- View admin panels

Role Assignment:
- Created during registration (/api/auth/register)
- Client record auto-created with verificationStatus: NOT_SUBMITTED

---
3. RELATIONSHIP MANAGER (RM)

Can Access:
- View assigned clients list (/rm/clients)
- View client portfolio details
- Process/approve/reject purchase requests
- Review withdrawal requests → submit to Admin OR reject
- View pending requests dashboard
- Upload files for clients

Cannot:
- Final approve withdrawals (admin only)
- Create instruments
- Assign RMs to clients
- Access system-wide analytics

---
4. DOCADMIN (Document Administrator)

Can Access:
- View pending documents for verification
- Verify or reject documents
- Assign RM to client during verification
- Update client verification status
- View audit logs

Cannot:
- Process financial transactions
- Create instruments
- Access full admin dashboard

---
5. ADMIN (Administrator)

Can Access:
- Everything - full system access
- Create/edit/delete investment instruments
- Assign clients to RMs
- Final approval for withdrawal requests
- View system-wide analytics
- Manage user accounts
- Access all audit logs
- Override any operation

Cannot:
- (No restrictions)

---
C. CURRENT LEAD & USER FLOW

1. Lead Creation (Public Form)

- User visits /user-form
- 2-step form: Personal Info → Financial Info
- Submits to /api/leads
- Data stored in UserLead table
- No automatic conversion to user - leads remain separate

2. User Registration

- User visits /register
- Submits form → /api/auth/register
- Creates User + Client records
- Sends verification email (24-hour token)
- verificationStatus: NOT_SUBMITTED

3. Email Verification

- User clicks email link → /verify-email?token=xxx
- Token validated → emailVerified: true
- Welcome email sent with KYC prompt

4. Login Restrictions During Verification

- If verificationStatus is PENDING or UNDER_REVIEW:
- Login is BLOCKED with message "documents under verification"
- If NOT_SUBMITTED, REJECTED, or EXPIRED:
- Login allowed so user can upload/resubmit documents

5. Document/KYC Submission

- Client visits /upload-documents (auth page)
- Uploads via /api/documents/upload
- Document created with verificationStatus: PENDING
- Client's verificationStatus updated to PENDING

6. RM Assignment

- Currently happens during document verification by DocAdmin
- DocAdmin verifies document → optionally assigns RM
- OR Admin can assign via /admin/assignments
- Creates Client.assignedRMId relationship

7. KYC Approval

- DocAdmin reviews documents at /docadmin/documents
- Calls /api/documents/verify with VERIFY or REJECT
- Updates document status → recalculates client verificationStatus
- If all docs verified → client verificationStatus: VERIFIED

8. Product/Instrument Selection

- Client browses /client/products or /client/instruments
- Views details at /client/products/[id]

9. Purchase Request

- Client submits purchase request
- Stored in PurchaseRequest with status: PENDING
- RM reviews at /rm/purchase-requests/[id]
- RM approves → Transaction created → Portfolio updated
- RM rejects → Client notified

10. Withdrawal Request (Two-Tier)

1. Client submits → status: PENDING
2. RM reviews:
- Approves → status: RM_APPROVED → sent to Admin
- Rejects → status: RM_REJECTED → ends
3. Admin reviews (if RM approved):
- Approves → status: ADMIN_APPROVED → Transaction created → Portfolio deducted
- Rejects → status: ADMIN_REJECTED → ends

---
D. ADMIN PANELS & DASHBOARDS

Admin Dashboard (/admin)

- Users management (/admin/users)
- Instruments management (/admin/instruments)
- Client assignments (/admin/assignments)
- Purchase requests oversight (/admin/purchase-requests)
- Withdrawal final approval (/admin/withdrawal-requests)
- Audit logs (/admin/audit-logs)
- RM performance (/admin/rm-performance)
- Leads management (/admin/leads)

DocAdmin Dashboard (/docadmin)

- Document verification queue (/docadmin/documents)
- Stats: Pending, Under Review, Verified, Rejected
- Assign RM to client (/docadmin/assign-rm)

RM Dashboard (/rm)

- Assigned clients list (/rm/clients)
- Pending purchase requests (/rm/purchase-requests)
- Pending withdrawal requests (/rm/withdrawal-requests)
- Product requests (/rm/product-requests)

Client Dashboard (/client)

- Portfolio overview (/client/portfolio)
- Products browse (/client/products)
- Purchase requests history (/client/purchase-requests)
- Withdrawal requests (/client/withdrawal-requests)
- Analytics (/client/analytics)
- My RM info (/client/my-rm)

---
E. NOTIFICATIONS & EMAILS

When Emails Are Sent

| Event                     | Email Sent To               |
|---------------------------|-----------------------------|
| Registration              | User (verification email)   |
| Email verified            | User (welcome + KYC prompt) |
| Document uploaded         | DocAdmin (notification)     |
| Document verified         | User                        |
| Document rejected         | User (with reason)          |
| Purchase approved         | Client                      |
| Purchase rejected         | Client                      |
| Withdrawal submitted      | Client (confirmation)       |
| Withdrawal RM approved    | Client (status update)      |
| Withdrawal final approved | Client (with bank details)  |
| Withdrawal rejected       | Client (with reason)        |
| Password reset requested  | User (reset link)           |

In-App Notifications

- Notification model with types: INFO, SUCCESS, WARNING, ERROR, ALERT
- Categories: TRANSACTION, REQUEST, ASSIGNMENT, SYSTEM, PORTFOLIO, SECURITY
- Displayed via /notifications page
- Bell icon in header

Time-Based Automations

- NONE EXIST - No reminders, scheduled tasks, or automated follow-ups

---
F. STATE MANAGEMENT & STATUS MODELS

User Account Status (AccountStatus)

ACTIVE | INACTIVE | LOCKED | SUSPENDED
- LOCKED: After 5 failed login attempts (auto-unlock after 30 min)
- SUSPENDED: Manual admin action

Client Verification Status (VerificationStatus)

NOT_SUBMITTED → PENDING → UNDER_REVIEW → VERIFIED | REJECTED | EXPIRED
- Transitions managed by document verification API
- Blocks login when PENDING or UNDER_REVIEW

Purchase Request Status (RequestStatus)

PENDING → PROCESSING → APPROVED | REJECTED
- RM can approve/reject
- Single-tier approval

Withdrawal Status (WithdrawalStatus)

PENDING → RM_REVIEW → RM_APPROVED → ADMIN_REVIEW → ADMIN_APPROVED | ADMIN_REJECTED
                    ↘ RM_REJECTED (ends flow)
- Two-tier mandatory approval
- Status checked before each transition

Transaction Status (TransactionStatus)

COMPLETED | FAILED | REVERSED | PENDING_SETTLEMENT

Document Verification Status (VerificationStatus)

PENDING → UNDER_REVIEW → VERIFIED | REJECTED

---
G. KNOWN LIMITATIONS & TECH DEBT

No Background Processing

- Critical Gap: No cron jobs, schedulers, or queues
- Cannot implement: time-based reminders, auto-expiry, scheduled reports
- Affects: 3–7 day KYC deadlines, lead auto-removal, session cleanup

No Lead-to-User Conversion

- UserLead table is separate from User
- No workflow to convert leads to registered users
- No status tracking for leads (contacted, converted, lost)

No Time-Based Rules

- Cannot enforce "KYC must complete within X days"
- Cannot auto-deactivate stale leads
- Cannot send reminder emails

Document Storage

- Files stored locally (not cloud)
- No CDN integration
- Potential scalability issue

No Contract/Signing Workflow

- No Contract model exists
- No e-signature integration
- No agreement tracking

Session Management

- 30-minute inactivity timeout
- No "remember me" option
- No multi-device session management

Missing Features for Multi-Step Approvals

- No "in-progress" or "pending verification" intermediate states for complex flows
- DocAdmin cannot mark document as "under review" - only verify/reject

No Soft Delete Consistency

- Some models have deletedAt (soft delete)
- Others don't - inconsistent pattern

Email Failure Handling

- Email failures logged but not retried
- No email queue or delivery tracking

---
H. QUESTIONS BEFORE DESIGN

Lead Management

1. Should leads automatically convert to users after a certain action?
2. What happens to stale leads (no contact in X days)?
3. Should leads have status (new, contacted, qualified, converted)?

KYC/Document Workflow

4. What is the exact KYC timeline requirement (3–7 days)?
5. What happens if KYC expires? Auto-lock user or just flag?
6. Can users re-upload rejected documents without re-registration?

RM Assignment

7. Is RM assignment mandatory before KYC approval or after?
8. Can DocAdmin assign RM, or is this Admin-only?
9. What if an RM leaves? How are clients reassigned?

Contract Lifecycle

10. Is there a contract signing step between KYC approval and first purchase?
11. Should contracts require e-signature?
12. Is contract versioning needed?

Time-Based Automation

13. What reminders are needed? (KYC pending, document expiry, etc.)
14. Should the system auto-deactivate leads after X days of inactivity?
15. What is the frequency of scheduled reports (if any)?

Product/Investment Model

16. Are Products (Venture A/B/C) separate from Instruments?
17. Should clients invest in Products or Instruments (or both)?
18. What is the relationship between ProductPurchaseRequest and PurchaseRequest?

Technical

19. Is background job processing acceptable (e.g., Bull/Redis queue)?
20. Should emails be queued for retry on failure?
21. Is cloud file storage (S3) acceptable for documents?

---
This analysis provides a complete understanding of the current system state. No code changes have been proposed - this is purely an assessment of what exists.