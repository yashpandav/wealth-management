# Fishbone (Ishikawa) Diagrams — EMDEE Ventures Wealth Management CRM

---

## 1. Successful Investment Lifecycle — Cause & Effect

> **Effect:** Seamless Lead → Client → Investment → Payout Journey

```mermaid
flowchart LR

    Effect(["Successful Investment Lifecycle\nLead → Client → Investment → Payout"])

    %% ─── Main Bones ───────────────────────────────────────
    A["User Acquisition\n& Onboarding"]
    B["Document &\nKYC Management"]
    C["Investment\nConfiguration"]
    D["Purchase Request\nWorkflow"]
    E["Payout\nProcessing"]
    F["System\nInfrastructure"]

    A --> Effect
    B --> Effect
    C --> Effect
    D --> Effect
    E --> Effect
    F --> Effect

    %% ─── A: User Acquisition ──────────────────────────────
    A1["Lead Form Submission\n/user-form"]
    A2["Lead Source Tracking\nInstagram/YouTube/Referral"]
    A3["RM Assignment by DocAdmin"]
    A4["Lead → Registered User\nConversion"]
    A5["Email Verification\nVerificationToken"]
    A6["Client Profile Creation\nKYC Pending"]

    A1 --> A
    A2 --> A
    A3 --> A
    A4 --> A
    A5 --> A
    A6 --> A

    %% ─── B: Document & KYC ────────────────────────────────
    B1["Identity Document Upload\nPASSPORT / NATIONAL ID"]
    B2["DocAdmin Review Workflow\nPENDING → UNDER_REVIEW"]
    B3["Verification Decision\nVERIFIED / REJECTED"]
    B4["Rejection Handling\nRe-submission Loop"]
    B5["Client Status Sync\nverificationStatus field"]
    B6["Investment Agreement\nContract Storage"]

    B1 --> B
    B2 --> B
    B3 --> B
    B4 --> B
    B5 --> B
    B6 --> B

    %% ─── C: Investment Configuration ──────────────────────
    C1["Investment Tiers\nAED 50K / 100K / 500K+"]
    C2["Investment Options\nDuration + ROI + Frequency"]
    C3["Admin Plan Management\nCreate / Activate / Deactivate"]
    C4["ROI Calculation\nMonthly Interest = Amount × ROI%"]
    C5["Payout Window Config\n1-15 or 16-30 of month"]

    C1 --> C
    C2 --> C
    C3 --> C
    C4 --> C
    C5 --> C

    %% ─── D: Purchase Workflow ──────────────────────────────
    D1["Client Submits Request\nWM-xxxx Tracking Number"]
    D2["RM Review & Approval\nWith Payout Window"]
    D3["DocAdmin Contract Upload\nINVESTMENT_AGREEMENT"]
    D4["Contract Activation\nstatus = COMPLETED"]
    D5["PayoutSchedule Generation\nAuto on completion"]

    D1 --> D
    D2 --> D
    D3 --> D
    D4 --> D
    D5 --> D

    %% ─── E: Payout Processing ──────────────────────────────
    E1["Daily Cron Job\nScheduled 2AM UTC"]
    E2["Due Schedule Detection\nscheduledDate <= TODAY"]
    E3["Payout Record Creation\nstatus = PENDING"]
    E4["DocAdmin Receipt Upload\nProof of payment"]
    E5["Transaction Creation\nINTEREST_PAYOUT type"]
    E6["Client Notification\nEmail + In-App"]

    E1 --> E
    E2 --> E
    E3 --> E
    E4 --> E
    E5 --> E
    E6 --> E

    %% ─── F: System Infrastructure ──────────────────────────
    F1["PostgreSQL Database\nPrisma ORM"]
    F2["NextAuth.js\nSession Management"]
    F3["Email Service\nBranded HTML Templates"]
    F4["Audit Logging\nAll critical actions traced"]
    F5["In-App Notifications\nReal-time alerts"]
    F6["File Storage\nDocuments / Contracts / Receipts"]
    F7["Role-Based Access Control\nCLIENT / RM / DOCADMIN / ADMIN"]

    F1 --> F
    F2 --> F
    F3 --> F
    F4 --> F
    F5 --> F
    F6 --> F
    F7 --> F
```

---

## 2. Payout Failure Root Cause Analysis

> **Effect:** Interest Payout Not Received by Client

```mermaid
flowchart LR

    Problem(["Client Did Not Receive\nInterest Payout"])

    %% Main Causes
    M1["Scheduling Issues"]
    M2["DocAdmin Process Gap"]
    M3["System / Tech Failure"]
    M4["Contract Data Issues"]
    M5["Notification Failure"]
    M6["Client Issues"]

    M1 --> Problem
    M2 --> Problem
    M3 --> Problem
    M4 --> Problem
    M5 --> Problem
    M6 --> Problem

    %% M1: Scheduling
    M1A["Cron job did not run\n(server downtime)"]
    M1B["PayoutSchedule not generated\n(contract not completed)"]
    M1C["scheduledDate in wrong timezone"]
    M1D["isProcessed flag stuck = true\nData inconsistency"]

    M1A --> M1
    M1B --> M1
    M1C --> M1
    M1D --> M1

    %% M2: DocAdmin
    M2A["DocAdmin did not upload receipt\nBlocking completion"]
    M2B["Payout not marked COMPLETED\nIn DocAdmin portal"]
    M2C["Wrong payout record selected"]
    M2D["DocAdmin not notified\nNotification email failed"]

    M2A --> M2
    M2B --> M2
    M2C --> M2
    M2D --> M2

    %% M3: Tech
    M3A["Transaction INSERT failed\nDB constraint violation"]
    M3B["Payout UPDATE timed out"]
    M3C["API server error 500"]
    M3D["Database connection pool exhausted"]

    M3A --> M3
    M3B --> M3
    M3C --> M3
    M3D --> M3

    %% M4: Contract Data
    M4A["contractStartDate not set\nPayoutSchedule not generated"]
    M4B["Wrong ROI or duration\nin InvestmentOption"]
    M4C["payoutWindow not set by RM"]

    M4A --> M4
    M4B --> M4
    M4C --> M4

    %% M5: Notification
    M5A["SMTP provider failure\nEmail not delivered"]
    M5B["Client email address invalid"]
    M5C["Notification marked read\nbut payout still pending"]

    M5A --> M5
    M5B --> M5
    M5C --> M5

    %% M6: Client
    M6A["Client checked wrong\npayout history period"]
    M6B["Client account suspended\nBlocking access"]
    M6C["Client not using\ncorrect login"]

    M6A --> M6
    M6B --> M6
    M6C --> M6
```

---

## 3. KYC Verification Delays — Root Cause Analysis

> **Effect:** Client Stuck in PENDING Verification — Cannot Invest

```mermaid
flowchart LR

    Problem(["Client KYC Stuck PENDING\nCannot Submit Investment Request"])

    M1["Document Upload Issues"]
    M2["DocAdmin Bottleneck"]
    M3["Document Quality"]
    M4["Rejection Loop"]
    M5["System Configuration"]

    M1 --> Problem
    M2 --> Problem
    M3 --> Problem
    M4 --> Problem
    M5 --> Problem

    M1A["File size exceeds limit"]
    M1B["Unsupported file format"]
    M1C["Wrong document type selected"]
    M1D["Upload interrupted / failed"]

    M1A --> M1
    M1B --> M1
    M1C --> M1
    M1D --> M1

    M2A["DocAdmin queue backlog"]
    M2B["DocAdmin not assigned\nto verification queue"]
    M2C["DocAdmin notification not received"]
    M2D["Lack of reviewer availability"]

    M2A --> M2
    M2B --> M2
    M2C --> M2
    M2D --> M2

    M3A["ID document is blurry"]
    M3B["Document is expired"]
    M3C["Name mismatch with account"]
    M3D["Document partially cropped"]

    M3A --> M3
    M3B --> M3
    M3C --> M3
    M3D --> M3

    M4A["Client does not see rejection reason"]
    M4B["Client re-uploads same document"]
    M4C["Lack of client guidance\non requirements"]

    M4A --> M4
    M4B --> M4
    M4C --> M4

    M5A["verificationStatus not updating\non partial verification"]
    M5B["Document list not refreshing\nin UI after upload"]

    M5A --> M5
    M5B --> M5
```