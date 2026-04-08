# Sequence Diagrams — EMDEE Ventures Wealth Management CRM

---

## 1. Lead Capture & RM Assignment

```mermaid
sequenceDiagram
    actor Visitor as Public Visitor
    participant WF  as User Form (/user-form)
    participant API as API Server
    participant DB  as PostgreSQL
    participant EA  as Email Service
    participant DA  as DocAdmin

    Visitor->>WF: Fill lead form (name, email, phone, source)
    WF->>API: POST /api/leads
    API->>DB: INSERT UserLead (status=NEW)
    API->>EA: Send "New Enquiry" email to DocAdmin
    API-->>WF: 201 Created (leadId)
    WF-->>Visitor: Redirect → /register

    DA->>API: GET /api/docadmin/leads
    DA->>API: PATCH /api/docadmin/leads/:id/assign-rm { rmId }
    API->>DB: UPDATE UserLead SET assignedRMId, status=CONTACTED
    API->>EA: Notify RM of new lead assignment
    API-->>DA: 200 OK
```

---

## 2. Client Registration & Email Verification

```mermaid
sequenceDiagram
    actor C   as Visitor/Lead
    participant FE  as Frontend (/register)
    participant API as Auth API
    participant DB  as PostgreSQL
    participant EA  as Email Service

    C->>FE: Submit registration form
    FE->>API: POST /api/auth/register { email, password, firstName, ... }
    API->>DB: Check email uniqueness
    API->>DB: INSERT User (role=CLIENT, emailVerified=false)
    API->>DB: INSERT Client record (verificationStatus=NOT_SUBMITTED)
    API->>DB: UPDATE UserLead SET userId, status=CONVERTED
    API->>DB: INSERT VerificationToken (type=EMAIL_VERIFICATION)
    API->>EA: Send "Verify Email" email with token link
    API-->>FE: 201 Created
    FE-->>C: "Check your email" confirmation

    C->>API: GET /api/auth/verify-email?token=xxx
    API->>DB: Validate VerificationToken (not used, not expired)
    API->>DB: UPDATE User SET emailVerified=true
    API->>DB: UPDATE VerificationToken SET used=true
    API->>EA: Send "Welcome" email
    API-->>C: Redirect → /login
```

---

## 3. KYC Document Upload & Verification

```mermaid
sequenceDiagram
    actor C     as Client
    actor DA    as DocAdmin
    participant API as API Server
    participant FS  as File Storage
    participant DB  as PostgreSQL
    participant EA  as Email Service

    C->>API: POST /api/client/documents (multipart: file, documentType)
    API->>FS: Save file → /documents/...
    API->>DB: INSERT Document (status=PENDING, verificationStatus=PENDING)
    API->>DB: UPDATE Client SET verificationStatus=PENDING
    API->>EA: Notify DocAdmin of new document
    API-->>C: 201 Created

    DA->>API: GET /api/docadmin/documents?status=PENDING
    DA->>API: PATCH /api/docadmin/documents/:id/verify { action: VERIFY | REJECT }

    alt Verified
        API->>DB: UPDATE Document SET verificationStatus=VERIFIED
        API->>DB: UPDATE Client SET verificationStatus=VERIFIED
        API->>EA: Email Client "KYC Approved"
        API->>DB: INSERT AuditLog (DOCUMENT_VERIFY)
    else Rejected
        API->>DB: UPDATE Document SET verificationStatus=REJECTED, rejectionReason
        API->>DB: UPDATE Client SET verificationStatus=REJECTED
        API->>EA: Email Client "KYC Rejected" with reason
        API->>DB: INSERT AuditLog (DOCUMENT_REJECT)
    end
    API-->>DA: 200 OK
```

---

## 4. Investment Purchase Request → RM Approval → Contract

```mermaid
sequenceDiagram
    actor C    as Client
    actor RM   as Relationship Manager
    actor DA   as DocAdmin
    participant API as API Server
    participant DB  as PostgreSQL
    participant EA  as Email Service
    participant PS  as Payout Scheduler

    C->>API: POST /api/client/purchase-requests { investmentId, optionId, amount }
    API->>DB: INSERT ProductPurchaseRequest (status=PENDING, trackingNumber=WM-xxxx)
    API->>EA: Notify RM — new purchase request
    API-->>C: 201 Created (trackingNumber)

    RM->>API: GET /api/rm/product-requests?status=PENDING
    RM->>API: PATCH /api/rm/product-requests/:id/approve { payoutWindow: "1-15"|"16-30", rmNotes }
    API->>DB: UPDATE ProductPurchaseRequest SET status=APPROVED, payoutWindow, processedAt
    API->>EA: Notify DocAdmin — request approved, awaiting contract
    API->>EA: Notify Client — purchase request approved
    API-->>RM: 200 OK

    DA->>API: POST /api/docadmin/contract/:requestId { contractFile (multipart) }
    API->>DB: INSERT Document (type=INVESTMENT_AGREEMENT)
    API->>DB: UPDATE ProductPurchaseRequest SET contractDocumentId, contractStartDate=now, status=COMPLETED, completedAt
    API->>PS: generatePayoutSchedules(request)
    PS->>DB: INSERT PayoutSchedule[] (one per period based on duration & frequency)
    API->>DB: INSERT AuditLog (PAYOUT_SCHEDULE_CREATED)
    API->>EA: Email Client "Investment Activated"
    API-->>DA: 200 OK
```

---

## 5. Interest Payout Processing (Automated + DocAdmin)

```mermaid
sequenceDiagram
    participant CR  as Cron Job (Daily 2AM)
    actor DA        as DocAdmin
    actor C         as Client
    participant API as API Server
    participant DB  as PostgreSQL
    participant EA  as Email Service

    CR->>API: POST /api/cron/payouts (internal trigger)
    API->>DB: SELECT PayoutSchedule WHERE scheduledDate <= TODAY AND isProcessed=false
    loop For each due schedule
        API->>DB: INSERT Payout (status=PENDING, amount=interestAmount)
        API->>DB: UPDATE PayoutSchedule SET isProcessed=true
        API->>DB: INSERT AuditLog (PAYOUT_CREATED)
        API->>EA: Notify DocAdmin — payout due
    end
    API-->>CR: 200 OK (count processed)

    DA->>API: GET /api/docadmin/payouts?status=PENDING
    DA->>API: POST /api/docadmin/payouts/:id/receipt { receiptFile }
    API->>DB: INSERT Document (type=OTHER, payout receipt)
    DA->>API: PATCH /api/docadmin/payouts/:id/complete
    API->>DB: UPDATE Payout SET status=COMPLETED, processedById, processedAt
    API->>DB: INSERT Transaction (type=INTEREST_PAYOUT, status=COMPLETED)
    API->>DB: INSERT AuditLog (PAYOUT_COMPLETED)
    API->>EA: Email Client "Interest Payout Processed"
    API->>DB: INSERT Notification for Client
    API-->>DA: 200 OK

    C->>API: GET /api/client/payouts
    API-->>C: Payout history with receipts
```

---

## 6. Admin — Investment Plan Management

```mermaid
sequenceDiagram
    actor A   as Admin
    participant API as API Server
    participant DB  as PostgreSQL

    A->>API: POST /api/admin/investments { name, minAmount, maxAmount, currency }
    API->>DB: INSERT Investment (isActive=true)
    API->>DB: INSERT AuditLog (INVESTMENT_CREATE)
    API-->>A: 201 Created (investmentId)

    A->>API: POST /api/admin/investments/:id/options { duration, roi, annualReturn, withdrawalFrequency }
    API->>DB: INSERT InvestmentOption (isActive=true)
    API->>DB: INSERT AuditLog (INVESTMENT_OPTION_CREATE)
    API-->>A: 201 Created

    Note over API,DB: Existing client contracts remain unchanged
    Note over API,DB: New clients see updated plans immediately
```

---

## 7. Admin — RM & Client Assignment

```mermaid
sequenceDiagram
    actor A   as Admin
    participant API as API Server
    participant DB  as PostgreSQL
    participant EA  as Email Service

    A->>API: POST /api/admin/assignments { clientId, rmId }
    API->>DB: SELECT Client, RelationshipManager (validate both exist)
    API->>DB: UPDATE Client SET assignedRMId=rmId, assignedAt=now
    API->>DB: INSERT AuditLog (CLIENT_ASSIGN)
    API->>EA: Notify RM of new client assignment
    API->>EA: Notify Client of RM assignment
    API-->>A: 200 OK

    A->>API: PATCH /api/admin/assignments/:clientId/reassign { newRmId }
    API->>DB: UPDATE Client SET assignedRMId=newRmId
    API->>DB: INSERT AuditLog (CLIENT_REASSIGN)
    API->>EA: Notify old RM, new RM, and Client
    API-->>A: 200 OK
```