# 6. UML Diagrams

---

## 6.1 Use-Case Diagram

The use-case diagram illustrates the interactions between the five actors and the system's primary functional boundaries.

### Actors
- **Public User** — Unauthenticated visitor
- **Client** — Registered, KYC-verified investor
- **Relationship Manager (RM)** — Financial advisor managing clients
- **DocAdmin** — Operational staff for KYC and contract management
- **Administrator** — System-wide supervisor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WEALTH MANAGEMENT CRM SYSTEM                            │
│                                                                             │
│  ┌─────────────┐         ┌──────────────────────────────────────────────┐   │
│  │ Public User │────────▶│ Browse Investment Products                   │   │
│  │             │────────▶│ Submit Lead Enquiry Form                     │   │
│  └─────────────┘         └──────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────┐         ┌──────────────────────────────────────────────┐   │
│  │   Client    │────────▶│ Register & Verify Email                      │   │
│  │             │────────▶│ Upload KYC Documents                         │   │
│  │             │────────▶│ Browse & View Investment Products            │   │
│  │             │────────▶│ Submit Purchase Request                      │   │
│  │             │────────▶│ View Portfolio & Holdings                    │   │
│  │             │────────▶│ View Transaction History                     │   │
│  │             │────────▶│ View Payout History & Download Receipts      │   │
│  │             │────────▶│ View Assigned RM Details                     │   │
│  │             │────────▶│ View In-App Notifications                    │   │
│  │             │────────▶│ Reset Password                               │   │
│  └─────────────┘         └──────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────┐         ┌──────────────────────────────────────────────┐   │
│  │     RM      │────────▶│ View 6-View Dashboard                        │   │
│  │             │────────▶│ Manage Lead Pipeline (Status & Notes)        │   │
│  │             │────────▶│ View Assigned Clients                        │   │
│  │             │────────▶│ Push KYC Reminder to Clients                 │   │
│  │             │────────▶│ Review & Approve/Reject Purchase Requests    │   │
│  │             │────────▶│ Select Payout Window on Approval             │   │
│  │             │────────▶│ Review & Approve/Reject Withdrawal Requests  │   │
│  │             │────────▶│ View Client Portfolio & Transactions         │   │
│  │             │────────▶│ Upload Documents for Clients                 │   │
│  └─────────────┘         └──────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────┐         ┌──────────────────────────────────────────────┐   │
│  │  DocAdmin   │────────▶│ View 6-Tab Portal                            │   │
│  │             │────────▶│ Assign RM to Leads & Clients                 │   │
│  │             │────────▶│ Verify/Reject KYC Documents                  │   │
│  │             │────────▶│ Upload Pre-Signed Contract                   │   │
│  │             │────────▶│ Finalize Purchase Request (Create Transaction)│   │
│  │             │────────▶│ Upload Payout Receipt                        │   │
│  │             │────────▶│ Mark Payout as Completed                     │   │
│  └─────────────┘         └──────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────┐         ┌──────────────────────────────────────────────┐   │
│  │    Admin    │────────▶│ Create & Manage Investment Plans & Options   │   │
│  │             │────────▶│ Manage All User Accounts                     │   │
│  │             │────────▶│ Final Approve/Reject Withdrawal Requests     │   │
│  │             │────────▶│ View System Analytics Dashboard              │   │
│  │             │────────▶│ Access & Export Audit Logs                   │   │
│  │             │────────▶│ Monitor RM Performance                       │   │
│  │             │────────▶│ Manage All Leads                             │   │
│  └─────────────┘         └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6.2 Class Diagram

The class diagram represents the core domain models and their relationships.

```
┌─────────────────────────────┐
│           User              │
├─────────────────────────────┤
│ - id: UUID                  │
│ - email: String             │
│ - password: String (hashed) │
│ - role: UserRole            │
│ - firstName: String         │
│ - lastName: String          │
│ - phone: String?            │
│ - status: AccountStatus     │
│ - emailVerified: Boolean    │
│ - failedLoginAttempts: Int  │
│ - isArchived: Boolean       │
│ - createdAt: DateTime       │
├─────────────────────────────┤
│ + login(): Session          │
│ + resetPassword(): void     │
│ + verifyEmail(): void       │
└──────────┬──────────────────┘
           │ 1:1
     ┌─────┴──────┐
     │            │
┌────▼─────┐  ┌──▼──────────────────────┐
│  Client  │  │  RelationshipManager     │
├──────────┤  ├──────────────────────────┤
│ - userId │  │ - userId                 │
│ - assignedRMId?: UUID       │  │ - specialization: String? │
│ - verificationStatus        │  │ - maxClientLimit: Int     │
│ - riskTolerance: String?    │  │ - totalAUM: Decimal       │
│ - kycVerified: Boolean      │  ├──────────────────────────┤
├──────────────────────────────┤  │ + getAssignedClients()   │
│ + uploadDocument(): void    │  │ + approvePurchase()       │
│ + submitPurchaseRequest()   │  │ + approveWithdrawal()     │
│ + viewPortfolio(): Portfolio│  └──────────────────────────┘
└──────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              ProductPurchaseRequest                  │
├─────────────────────────────────────────────────────┤
│ - id: UUID                                          │
│ - clientId: UUID                                    │
│ - investmentId: UUID                                │
│ - investmentOptionId: UUID                          │
│ - rmId: UUID                                        │
│ - amount: Decimal                                   │
│ - status: RequestStatus                             │
│ - payoutWindow: String?                             │
│ - contractDocumentId: UUID?                         │
│ - completedById: UUID?                              │
├─────────────────────────────────────────────────────┤
│ + submit(): void                                    │
│ + approve(payoutWindow): void                       │
│ + uploadContract(doc): void                         │
│ + finalize(): Transaction                           │
└─────────────────────────────────────────────────────┘

┌──────────────────────────────┐    ┌────────────────────────────┐
│         Investment           │    │      InvestmentOption      │
├──────────────────────────────┤    ├────────────────────────────┤
│ - id: UUID                   │    │ - id: UUID                 │
│ - name: String               │1:N │ - investmentId: UUID       │
│ - description: Text          │───▶│ - duration: Int (months)   │
│ - minimumInvestment: Decimal │    │ - roi: Decimal (%)         │
│ - isActive: Boolean          │    │ - payoutFrequency: String  │
└──────────────────────────────┘    │ - isActive: Boolean        │
                                    └────────────────────────────┘

┌──────────────────────────────┐    ┌────────────────────────────┐
│       PayoutSchedule         │    │           Payout           │
├──────────────────────────────┤    ├────────────────────────────┤
│ - id: UUID                   │    │ - id: UUID                 │
│ - clientId: UUID             │1:1 │ - scheduleId: UUID         │
│ - purchaseRequestId: UUID    │───▶│ - clientId: UUID           │
│ - scheduledDate: DateTime    │    │ - amount: Decimal          │
│ - amount: Decimal            │    │ - status: PayoutStatus     │
│ - period: String             │    │ - receiptDocumentId: UUID? │
│ - isPaid: Boolean            │    │ - processedById: UUID?     │
└──────────────────────────────┘    │ - transactionId: UUID?     │
                                    └────────────────────────────┘

┌──────────────────────────────┐    ┌────────────────────────────┐
│         Transaction          │    │          Document          │
├──────────────────────────────┤    ├────────────────────────────┤
│ - id: UUID                   │    │ - id: UUID                 │
│ - clientId: UUID             │    │ - clientId: UUID?          │
│ - type: TransactionType      │    │ - type: DocumentType       │
│ - status: TransactionStatus  │    │ - fileName: String         │
│ - amount: Decimal            │    │ - filePath: String         │
│ - netAmount: Decimal         │    │ - verificationStatus       │
│ - fees: Decimal              │    │ - verifiedById: UUID?      │
│ - currency: String (AED)     │    │ - rejectionReason: String? │
│ - processedById: UUID?       │    └────────────────────────────┘
│ - approvedById: UUID?        │
└──────────────────────────────┘
```

---

## 6.3 Activity Diagrams

### 6.3.1 Purchase Request Activity Diagram

```
[Client]                  [RM]                    [DocAdmin]              [System]
   │                        │                         │                      │
   ▼                        │                         │                      │
Browse Products             │                         │                      │
   │                        │                         │                      │
   ▼                        │                         │                      │
Select Product              │                         │                      │
& Enter Amount              │                         │                      │
   │                        │                         │                      │
   ▼                        │                         │                      │
Submit Purchase ──────────▶ Receive Notification      │                      │
Request                     │                         │                      │
   │                status: PENDING                   │                      │
   ▼                        │                         │                      │
Await RM Review             ▼                         │                      │
                       Review Request                 │                      │
                            │                         │                      │
                    ┌───────┴────────┐                │                      │
                    │                │                │                      │
                 Approve          Reject              │                      │
                    │                │                │                      │
              Select Payout      Send Rejection       │                      │
              Window             Notification         │                      │
                    │                │                │                      │
            status: PROCESSING   status: REJECTED     │                      │
                    │                │                │                      │
                    │    ◀─────────────────────────── │                      │
                    ▼                                 ▼                      │
            [DocAdmin Notified]         Review Contract                      │
                                        Pending Tab                          │
                                             │                               │
                                        Upload Pre-Signed                    │
                                        Contract (PDF)                       │
                                             │                               │
                                        Finalize Request ──────────────────▶ Create Transaction
                                             │                               Create PayoutSchedule
                                        status: COMPLETED                    Update Portfolio
                                             │                               Send Emails
                                             ▼                               │
                                       [Client Notified                      │
                                        - Contract Created                   │
                                        - Payout Schedule Active]            │
```

### 6.3.2 KYC Verification Activity Diagram

```
[Client]                       [System/Cron]              [DocAdmin]
   │                                │                          │
   ▼                                │                          │
Register & Verify Email             │                          │
   │                                │                          │
   ▼                                │                          │
Upload KYC Documents                │                          │
   │                                │                          │
   ▼              ──────────────────▶                          │
status: PENDING        Notify DocAdmin                         │
   │                                │                          │
   ▼                                │              Review Documents
Login Blocked                       │                          │
(PENDING state)                     │                 ┌────────┴────────┐
   │                                │                 │                 │
   │                          Day 3 Reminder          │                 │
   │                          Email Sent           Approve            Reject
   │                                │                 │                 │
   │                          Day 6 Final             │            Send Rejection
   │                          Warning Email      status: VERIFIED  Email + Reason
   │                                │                 │                 │
   │                          Day 7 Archive           │            Client Can
   │                          (if not verified)   Login Re-enabled  Resubmit
   │                          status: EXPIRED          │
   ▼                                │                  ▼
If REJECTED:                        │           Access Full Platform
Can Resubmit                        │           (Investment, Requests)
Documents
```

### 6.3.3 Withdrawal Request Activity Diagram

```
[Client]          [RM]              [Admin]           [System]
   │                │                  │                  │
   ▼                │                  │                  │
Submit              │                  │                  │
Withdrawal ────────▶│                  │                  │
Request             │                  │                  │
   │         status: PENDING           │                  │
   │                │                  │                  │
   │           Review Request          │                  │
   │                │                  │                  │
   │        ┌───────┴──────┐           │                  │
   │        │              │           │                  │
   │     Approve        Reject         │                  │
   │        │              │           │                  │
   │  status: RM_APPROVED  │    status: RM_REJECTED        │
   │        │       Send Notification  │                  │
   │        ▼              │           │                  │
   │  [Admin Notified] ────┼──────────▶│                  │
   │        │              │     Review Request           │
   │        │              │           │                  │
   │        │              │   ┌───────┴──────┐           │
   │        │              │   │              │           │
   │        │              │ Final          Final         │
   │        │              │ Approve        Reject        │
   │        │              │   │              │           │
   │        │              │ status:ADMIN  status:ADMIN   │
   │        │              │ _APPROVED     _REJECTED      │
   │        │              │   │              │           │
   │        │              │   ▼              │           │
   │        │              │ Create ─────────▶│           │
   │        │              │ Transaction      │     Send Notification
   │        │              │                  │     to Client
   ▼        ▼              ▼                  ▼
[Client receives email at each status change]
```

---

## 6.4 Sequence Diagrams

### 6.4.1 User Login Sequence

```
Client Browser         NextAuth          Database (Prisma)     Session Store
      │                    │                    │                    │
      │── POST /api/auth ──▶│                    │                    │
      │  (email, password)  │                    │                    │
      │                    │── findUnique ──────▶│                    │
      │                    │  WHERE email=...    │                    │
      │                    │◀── User record ─────│                    │
      │                    │                    │                    │
      │                    │── bcrypt.compare() │                    │
      │                    │   (password hash)   │                    │
      │                    │                    │                    │
      │         [If failed] │                    │                    │
      │                    │── update ──────────▶│                    │
      │                    │  failedLoginAttempts│                    │
      │◀── 401 Unauthorized│                    │                    │
      │                    │                    │                    │
      │         [If passed] │                    │                    │
      │                    │── Check verificationStatus ────────────│
      │                    │   [If PENDING/UNDER_REVIEW → Block]     │
      │                    │                    │                    │
      │                    │── Create JWT token ▶│                    │
      │                    │   {id, email, role, │                    │
      │                    │    status, verified}│                    │
      │                    │                    │── Store session ──▶│
      │◀── 200 OK ─────────│                    │                    │
      │   Set-Cookie: session                   │                    │
      │   (httpOnly, Secure,│                   │                    │
      │    SameSite=Strict)│                    │                    │
```

### 6.4.2 Payout Processing Sequence

```
Cron Job          DocAdmin UI        API Route         Prisma           Email Service
   │                  │                  │                │                  │
   │── GET /api/cron ─▶│                  │                │                  │
   │  payout-generation│                  │                │                  │
   │                  │── GET /api/docadmin/payouts ──────▶│                  │
   │                  │                  │── query pending ▶│                  │
   │                  │                  │   payout_schedules                 │
   │                  │◀── Pending list ──│◀── results ─────│                  │
   │                  │                  │                │                  │
   │                  │ Upload Receipt   │                │                  │
   │                  │── POST /complete ▶│                │                  │
   │                  │  (payoutId, file) │                │                  │
   │                  │                  │── Create Document ─────────────────│
   │                  │                  │── Update Payout ▶│                  │
   │                  │                  │   status: COMPLETED                 │
   │                  │                  │── Create Transaction ──────────────│
   │                  │                  │── Update PayoutSchedule ──────────│
   │                  │                  │── Create AuditLog ─────────────────│
   │                  │                  │                │── sendPayoutEmail ─▶│
   │                  │                  │                │                  │── Send to client
   │                  │◀── 200 OK ────────│                │                  │
```

### 6.4.3 KYC Document Verification Sequence

```
DocAdmin Browser      API Route           Prisma DB          Email Service
      │                    │                  │                    │
      │── GET /docadmin ──▶│                  │                    │
      │   /documents        │── findMany ─────▶│                    │
      │                    │   PENDING docs    │                    │
      │◀── Document list ──│◀── results ───────│                    │
      │                    │                  │                    │
      │ [Preview Document] │                  │                    │
      │── GET /download ──▶│                  │                    │
      │◀── PDF/Image ──────│                  │                    │
      │                    │                  │                    │
      │ [Approve Document] │                  │                    │
      │── POST /verify ───▶│                  │                    │
      │  {docId, VERIFY}   │── update Document▶│                    │
      │                    │   UNDER_REVIEW→   │                    │
      │                    │   VERIFIED        │                    │
      │                    │── Recalculate ────▶│                    │
      │                    │   Client.verificationStatus            │
      │                    │   (if all docs VERIFIED → VERIFIED)    │
      │                    │── Create AuditLog ▶│                    │
      │                    │                  │── sendVerified ────▶│
      │◀── 200 Success ────│                  │   Email             │── To client
```
