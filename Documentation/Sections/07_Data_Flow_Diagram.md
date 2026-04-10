# 7. Data Flow Diagram

---

## 7.1 Overview

Data Flow Diagrams (DFDs) illustrate how data moves through the Wealth Management CRM Platform — from external actors (users), through processes (business logic), into data stores (database tables). DFDs use the following notation:

- **Rectangle** — External entity (actor)
- **Rounded Rectangle / Circle** — Process
- **Open Rectangle** — Data store
- **Arrow** — Data flow

---

## 7.2 Level 0 DFD — Context Diagram

The context diagram shows the system as a single process receiving and sending data to all external actors.

```
┌──────────────┐    Registration, Login,          ┌───────────────────────────────┐
│ Public User  │──── Lead Form Data ─────────────▶│                               │
│              │◀─── Instrument Listings ──────────│                               │
└──────────────┘                                   │                               │
                                                   │                               │
┌──────────────┐    Document Uploads,              │   WEALTH MANAGEMENT CRM       │
│   Client     │──── Purchase Requests ────────────│         SYSTEM                │
│              │◀─── Portfolio Data, Payouts,  ────│                               │
│              │     Notifications, Receipts        │                               │
└──────────────┘                                   │                               │
                                                   │                               │
┌──────────────┐    Lead Updates, Request          │                               │
│     RM       │──── Approvals, Notes ─────────────│                               │
│              │◀─── Client Lists, Request  ────────│                               │
│              │     Alerts, Dashboard Data          │                               │
└──────────────┘                                   │                               │
                                                   │                               │
┌──────────────┐    KYC Decisions, Contract        │                               │
│  DocAdmin    │──── Uploads, Payout Receipts ─────│                               │
│              │◀─── Pending Lists, Client ─────────│                               │
│              │     Data, Counts                   │                               │
└──────────────┘                                   │                               │
                                                   │                               │
┌──────────────┐    Plan Configs, User Actions,    │                               │
│    Admin     │──── Withdrawal Decisions ──────────│                               │
│              │◀─── Analytics, Audit Logs, ────────│                               │
│              │     User Lists                     │                               │
└──────────────┘                                   └───────────────────────────────┘
                                                             │         ▲
                                                             ▼         │
                                                    ┌─────────────────────────┐
                                                    │    Email Service        │
                                                    │   (SMTP/Nodemailer)     │
                                                    └─────────────────────────┘
```

---

## 7.3 Level 1 DFD — Major Processes

The Level 1 DFD expands the system into its 8 major processes.

```
External Entities          Processes                          Data Stores
                       ┌──────────────────┐
[Public User] ─────────▶│ P1: User         │──────────────────▶ [D1: users]
[Client]      ─────────▶│ Authentication   │◀────────────────── [D1: users]
              ◀─────────│ & Registration   │──────────────────▶ [D2: verification_tokens]
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
[Client]      ─────────▶│ P2: KYC &        │──────────────────▶ [D3: documents]
[DocAdmin]    ─────────▶│ Document         │◀────────────────── [D3: documents]
              ◀─────────│ Management       │──────────────────▶ [D4: clients]
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
[Client]      ─────────▶│ P3: Investment   │──────────────────▶ [D5: investments]
[Admin]       ─────────▶│ Plan Management  │◀────────────────── [D5: investments]
              ◀─────────│                  │──────────────────▶ [D6: investment_options]
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
[Client]      ─────────▶│ P4: Purchase     │──────────────────▶ [D7: purchase_requests]
[RM]          ─────────▶│ Request          │◀────────────────── [D7: purchase_requests]
[DocAdmin]    ─────────▶│ Workflow         │──────────────────▶ [D8: transactions]
              ◀─────────│                  │──────────────────▶ [D9: payout_schedules]
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
[DocAdmin]    ─────────▶│ P5: Payout       │──────────────────▶ [D10: payouts]
[System Cron] ─────────▶│ Management       │◀────────────────── [D9: payout_schedules]
              ◀─────────│                  │──────────────────▶ [D8: transactions]
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
[Client]      ─────────▶│ P6: Withdrawal   │──────────────────▶ [D7: purchase_requests]
[RM]          ─────────▶│ Request          │──────────────────▶ [D8: transactions]
[Admin]       ─────────▶│ Workflow         │◀────────────────── [D4: clients]
              ◀─────────│                  │                    
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
[All Users]   ─────────▶│ P7: Notification │──────────────────▶ [D11: notifications]
              ◀─────────│ & Email System   │──────────────────▶ [Email Service]
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
[Admin]       ─────────▶│ P8: Audit &      │──────────────────▶ [D12: audit_logs]
              ◀─────────│ Analytics        │◀────────────────── [D12: audit_logs]
                        └──────────────────┘
```

---

## 7.4 Level 2 DFD — Purchase Request Workflow (P4 Expanded)

```
External Entities          Sub-Processes                      Data Stores
                       ┌──────────────────────┐
[Client]      ─────────▶│ P4.1: Submit Request │──────────────▶ [D7: purchase_requests]
              ◀─────────│ (Validate + Store)   │──────────────▶ [D12: audit_logs]
                        └──────────────────────┘
                                   │ status: PENDING
                                   ▼
                        ┌──────────────────────┐
[RM]          ─────────▶│ P4.2: RM Review      │◀─────────────  [D7: purchase_requests]
              ◀─────────│ (Approve/Reject +     │──────────────▶ [D7: update status]
                        │  Payout Window Select)│──────────────▶ [D11: notifications]
                        └──────────────────────┘
                                   │ status: PROCESSING (approved)
                                   ▼
                        ┌──────────────────────┐
[DocAdmin]    ─────────▶│ P4.3: Contract Upload│◀─────────────  [D7: purchase_requests]
              ◀─────────│ (PDF Storage +        │──────────────▶ [D3: documents]
                        │  Link to Request)     │──────────────▶ [D7: update contractDocId]
                        └──────────────────────┘
                                   │ contract uploaded
                                   ▼
                        ┌──────────────────────┐
[DocAdmin]    ─────────▶│ P4.4: Finalization   │──────────────▶ [D8: transactions] (CREATE)
              ◀─────────│ (Create Transaction + │──────────────▶ [D9: payout_schedules] (CREATE)
                        │  Generate Schedules + │──────────────▶ [D7: status=COMPLETED]
                        │  Update Portfolio)    │──────────────▶ [D12: audit_logs]
                        └──────────────────────┘               [Email: client notified]
```

---

## 7.5 Level 2 DFD — KYC Workflow (P2 Expanded)

```
External Entities          Sub-Processes                      Data Stores
                       ┌──────────────────────┐
[Client]      ─────────▶│ P2.1: Document Upload│──────────────▶ [D3: documents]
              ◀─────────│ (Validate + Store    │──────────────▶ [D4: clients]
                        │  Update status:PENDING)│              (verificationStatus → PENDING)
                        └──────────────────────┘
                                   │
                        ┌──────────────────────┐
[System Cron] ─────────▶│ P2.2: KYC Timer      │──────────────▶ [Email: Day 3 reminder]
              ─────────▶│ (Day 3 reminder,      │──────────────▶ [Email: Day 6 warning]
                        │  Day 6 warning,       │──────────────▶ [D4: clients]
                        │  Day 7 archive)       │              (status → EXPIRED, isArchived)
                        └──────────────────────┘
                                   │
                        ┌──────────────────────┐
[DocAdmin]    ─────────▶│ P2.3: DocAdmin Review│◀─────────────  [D3: documents]
              ◀─────────│ (Verify/Reject Doc +  │──────────────▶ [D3: update status]
                        │  Recalc Client Status)│──────────────▶ [D4: clients]
                        └──────────────────────┘              (recalculate verificationStatus)
                                   │
                        ┌──────────────────────┐
[DocAdmin]    ─────────▶│ P2.4: RM Assignment  │──────────────▶ [D4: clients]
              ◀─────────│ (Assign RM to Client │              (assignedRMId)
                        │  or Lead)             │──────────────▶ [D12: audit_logs]
                        └──────────────────────┘               [Email: RM notified]
```

---

## 7.6 Data Store Summary

| ID  | Data Store Name          | Table(s)                          | Primary Access    |
|-----|--------------------------|-----------------------------------|-------------------|
| D1  | User Accounts            | `users`                           | All roles         |
| D2  | Verification Tokens      | `verification_tokens`             | System (Auth)     |
| D3  | Documents                | `documents`                       | Client, DocAdmin  |
| D4  | Client Profiles          | `clients`                         | RM, DocAdmin, Admin|
| D5  | Investment Plans         | `investments`                     | Admin, Client     |
| D6  | Investment Options       | `investment_options`              | Admin, Client     |
| D7  | Purchase Requests        | `investment_purchase_requests`    | Client, RM, DocAdmin|
| D8  | Transactions             | `transactions`                    | Client, Admin     |
| D9  | Payout Schedules         | `payout_schedules`                | System, DocAdmin  |
| D10 | Payouts                  | `payouts`                         | DocAdmin, Client  |
| D11 | Notifications            | `notifications`                   | All users         |
| D12 | Audit Logs               | `audit_logs`                      | Admin (read-only) |
| D13 | User Leads               | `user_leads`                      | Public, RM, DocAdmin|
| D14 | Relationship Managers    | `relationship_managers`           | DocAdmin, Admin   |
