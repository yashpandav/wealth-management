# Activity Diagrams — EMDEE Ventures Wealth Management CRM

---

## 1. Lead → Client Conversion Activity

```mermaid
flowchart TD
    A([Start: Visitor Submits Enquiry Form]) --> B[System creates UserLead\nstatus = NEW]
    B --> C[DocAdmin reviews new leads]
    C --> D{Has suitable RM?}
    D -- No --> E[Wait / Reassign later]
    D -- Yes --> F[Assign RM to Lead\nstatus = CONTACTED]
    F --> G[RM contacts Visitor]
    G --> H{Visitor interested?}
    H -- No --> I[Update LeadStatus = LOST]
    I --> Z([End])
    H -- Yes --> J[RM updates LeadStatus = INTERESTED]
    J --> K[Visitor registers account\n/register]
    K --> L[System creates User + Client record\nLinks UserLead.userId\nstatus = CONVERTED]
    L --> M[Email Verification sent]
    M --> N{Visitor clicks verify link?}
    N -- Expired --> O[Resend verification email]
    O --> N
    N -- Yes --> P[User.emailVerified = true]
    P --> Z2([End: Client Account Active])
```

---

## 2. KYC Document Verification Activity

```mermaid
flowchart TD
    A([Start: Client Uploads Document]) --> B[INSERT Document\nverificationStatus = PENDING]
    B --> C[Client.verificationStatus = PENDING]
    C --> D[DocAdmin notified via email + notification]
    D --> E[DocAdmin opens Document list]
    E --> F[DocAdmin reviews document]
    F --> G{Decision?}
    G -- VERIFY --> H[Document.verificationStatus = VERIFIED]
    H --> I{All documents verified?}
    I -- No --> J[Client remains PENDING]
    I -- Yes --> K[Client.verificationStatus = VERIFIED]
    K --> L[Email: KYC Approved]
    L --> M([End: Client KYC Verified])
    G -- REJECT --> N[Document.verificationStatus = REJECTED\nRejection reason recorded]
    N --> O[Client.verificationStatus = REJECTED]
    O --> P[Email: KYC Rejected with reason]
    P --> Q[Client re-uploads document]
    Q --> B
    J --> Z([Waiting for more uploads])
```

---

## 3. Investment Purchase Request Lifecycle

```mermaid
flowchart TD
    A([Start: Client Submits Purchase Request]) --> B[INSERT ProductPurchaseRequest\nstatus = PENDING\ntrackingNumber = WM-xxxx]
    B --> C[RM notified via email + notification]
    C --> D[RM reviews request]
    D --> E{RM Decision?}
    E -- REJECT --> F[status = REJECTED\nrejectionReason recorded\nClient notified]
    F --> Z([End: Request Rejected])
    E -- APPROVE --> G[status = APPROVED\npayoutWindow set: 1-15 or 16-30\nClient & DocAdmin notified]
    G --> H[DocAdmin uploads Investment Agreement contract]
    H --> I[INSERT Document\ntype = INVESTMENT_AGREEMENT]
    I --> J[Document linked to request\ncontractDocumentId set]
    J --> K[DocAdmin finalizes contract]
    K --> L[status = COMPLETED\ncontractStartDate = today\ncompletedAt = now]
    L --> M[System generates PayoutSchedules\nbased on duration + ROI + frequency]
    M --> N[Email: Investment Activated to Client]
    N --> O([End: Investment Active, Payouts Scheduled])
```

---

## 4. Automated Payout Processing Activity

```mermaid
flowchart TD
    A([Cron Job: Daily 2 AM UTC]) --> B[Query due PayoutSchedules\nscheduledDate <= TODAY\nisProcessed = false]
    B --> C{Any due schedules?}
    C -- No --> Z([End: Nothing to process])
    C -- Yes --> D[For each due PayoutSchedule]
    D --> E[INSERT Payout record\nstatus = PENDING]
    E --> F[UPDATE PayoutSchedule\nisProcessed = true]
    F --> G[INSERT AuditLog: PAYOUT_CREATED]
    G --> H[Notify DocAdmin via email + notification]
    H --> I{More schedules?}
    I -- Yes --> D
    I -- No --> J[DocAdmin reviews pending payouts]
    J --> K[DocAdmin uploads receipt document]
    K --> L[DocAdmin marks payout COMPLETED]
    L --> M[UPDATE Payout: status = COMPLETED\nprocessedById, processedAt]
    M --> N[INSERT Transaction\ntype = INTEREST_PAYOUT\nstatus = COMPLETED]
    N --> O[INSERT Notification for Client]
    O --> P[Email: Interest Payout Processed to Client]
    P --> Q([End: Payout Complete])
```

---

## 5. Admin User & RM Management Activity

```mermaid
flowchart TD
    A([Admin logs in]) --> B[View system dashboard\n/admin]
    B --> C{Action?}

    C -- Manage Users --> D[View all users /admin/users]
    D --> E{User action?}
    E -- Activate/Deactivate --> F[UPDATE User.status\nINSERT AuditLog]
    E -- Create RM --> G[POST /api/admin/users\nrole = RM\nRelationshipManager record created]

    C -- Assign Clients --> H[View unassigned clients\n/admin/assignments]
    H --> I[Select Client + RM]
    I --> J[UPDATE Client.assignedRMId\nINSERT AuditLog: CLIENT_ASSIGN\nNotify RM + Client]

    C -- Manage Plans --> K[View investment plans\n/admin/investment-plans]
    K --> L{Plan action?}
    L -- Create Plan --> M[INSERT Investment + InvestmentOptions]
    L -- Toggle Active --> N[UPDATE Investment.isActive]
    L -- Edit Option --> O[UPDATE InvestmentOption]

    C -- Monitor Performance --> P[View RM performance dashboard\n/admin/rm-performance]
    C -- View Audit Logs --> Q[View audit trail\n/admin/audit-logs]

    F --> Z([Done])
    G --> Z
    J --> Z
    M --> Z
    N --> Z
    O --> Z
    P --> Z
    Q --> Z
```