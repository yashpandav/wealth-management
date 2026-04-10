# 8. Data Dictionary

The Data Dictionary provides a complete, structured reference for all 14 database tables in the Wealth Management CRM Platform. Each entry documents fields, data types, constraints, and descriptions.

**Database:** PostgreSQL 15+  
**ORM:** Prisma 5.20+  
**Currency:** AED (default)  
**Primary Key Convention:** UUID (`uuid()` auto-generated)  

---

## Table 1: `users`

Base entity for all authenticated users. All roles (CLIENT, RM, ADMIN, DOCADMIN) share this table.

| Column                | Type              | Nullable | Default        | Description                                                   |
|-----------------------|-------------------|----------|----------------|---------------------------------------------------------------|
| `id`                  | UUID              | No       | `uuid()`       | Primary key — unique user identifier                          |
| `email`               | VARCHAR           | No       | —              | Unique email address (used as login credential)               |
| `password`            | TEXT              | No       | —              | bcrypt-hashed password (cost factor = 12)                     |
| `role`                | ENUM (UserRole)   | No       | —              | `CLIENT` \| `RM` \| `ADMIN` \| `DOCADMIN`                    |
| `firstName`           | VARCHAR           | No       | —              | User's first name                                             |
| `lastName`            | VARCHAR           | No       | —              | User's last name                                              |
| `phone`               | VARCHAR           | Yes      | NULL           | Contact phone number (optional)                               |
| `status`              | ENUM (AccountStatus) | No  | `ACTIVE`       | `ACTIVE` \| `INACTIVE` \| `LOCKED` \| `SUSPENDED`           |
| `isActive`            | BOOLEAN           | No       | `true`         | Whether the account can log in                                |
| `emailVerified`       | BOOLEAN           | No       | `false`        | Whether the email address has been verified                   |
| `failedLoginAttempts` | INT               | No       | `0`            | Consecutive failed login counter (resets on success)          |
| `accountLockedUntil`  | TIMESTAMP         | Yes      | NULL           | Auto-unlock timestamp (set after 5 failed attempts, +30 min)  |
| `lastLogin`           | TIMESTAMP         | Yes      | NULL           | Timestamp of last successful login                            |
| `lastFailedLogin`     | TIMESTAMP         | Yes      | NULL           | Timestamp of most recent failed login attempt                 |
| `isArchived`          | BOOLEAN           | No       | `false`        | Soft-archive flag (used for KYC Day-7 expired users)          |
| `archivedAt`          | TIMESTAMP         | Yes      | NULL           | When the user was archived                                    |
| `createdAt`           | TIMESTAMP         | No       | `now()`        | Record creation timestamp                                     |
| `updatedAt`           | TIMESTAMP         | No       | auto           | Auto-updated on any record change                             |
| `deletedAt`           | TIMESTAMP         | Yes      | NULL           | Soft-delete timestamp (null = active record)                  |

**Indexes:** `email`, `role`, `status`, `isArchived`

---

## Table 2: `clients`

Client-specific data extending a `users` record. Auto-created on CLIENT registration.

| Column              | Type                    | Nullable | Default          | Description                                                   |
|---------------------|-------------------------|----------|------------------|---------------------------------------------------------------|
| `id`                | UUID                    | No       | `uuid()`         | Primary key                                                   |
| `userId`            | UUID                    | No       | —                | Foreign key → `users.id` (1:1, CASCADE delete)                |
| `assignedRMId`      | UUID                    | Yes      | NULL             | Foreign key → `relationship_managers.id` (optional until assigned) |
| `riskTolerance`     | VARCHAR                 | Yes      | NULL             | `LOW` \| `MEDIUM` \| `HIGH` — client's risk appetite          |
| `investmentGoals`   | TEXT                    | Yes      | NULL             | Free-text description of investment goals                     |
| `kycVerified`       | BOOLEAN                 | No       | `false`          | Legacy flag — whether KYC is fully verified                   |
| `kycDocuments`      | TEXT                    | Yes      | NULL             | JSON array of document reference URLs (legacy)                |
| `verificationStatus`| ENUM (VerificationStatus) | No   | `NOT_SUBMITTED`  | `NOT_SUBMITTED` \| `PENDING` \| `UNDER_REVIEW` \| `VERIFIED` \| `REJECTED` \| `EXPIRED` |
| `assignedAt`        | TIMESTAMP               | No       | `now()`          | When the client record was created / RM was first assigned    |
| `archivedReason`    | TEXT                    | Yes      | NULL             | Reason for archival (e.g., `"KYC_EXPIRED_DAY_7"`)             |
| `updatedAt`         | TIMESTAMP               | No       | auto             | Auto-updated on any record change                             |

**Indexes:** `assignedRMId`, `verificationStatus`, `(assignedRMId, verificationStatus)` (composite)

---

## Table 3: `relationship_managers`

RM-specific data extending a `users` record.

| Column           | Type      | Nullable | Default | Description                                           |
|------------------|-----------|----------|---------|-------------------------------------------------------|
| `id`             | UUID      | No       | `uuid()`| Primary key                                           |
| `userId`         | UUID      | No       | —       | Foreign key → `users.id` (1:1, CASCADE delete)        |
| `specialization` | VARCHAR   | Yes      | NULL    | Specialization area (e.g., "High Net Worth", "Retirement Planning") |
| `certifications` | TEXT      | Yes      | NULL    | JSON array of professional certifications             |
| `maxClientLimit` | INT       | Yes      | `50`    | Maximum number of clients this RM can manage          |
| `totalAUM`       | DECIMAL(15,2) | No  | `0`     | Total Assets Under Management (sum of active investments) |
| `createdAt`      | TIMESTAMP | No       | `now()` | Record creation timestamp                             |
| `updatedAt`      | TIMESTAMP | No       | auto    | Auto-updated on any change                            |

---

## Table 4: `transactions`

Records of all completed financial operations.

| Column                  | Type                     | Nullable | Default       | Description                                                   |
|-------------------------|--------------------------|----------|---------------|---------------------------------------------------------------|
| `id`                    | UUID                     | No       | `uuid()`      | Primary key                                                   |
| `clientId`              | UUID                     | No       | —             | Foreign key → `clients.id` (CASCADE delete)                   |
| `type`                  | ENUM (TransactionType)   | No       | —             | `PURCHASE` \| `WITHDRAWAL` \| `INTEREST_PAYOUT` \| `DIVIDEND` \| `ADJUSTMENT` |
| `status`                | ENUM (TransactionStatus) | No       | `COMPLETED`   | `COMPLETED` \| `FAILED` \| `REVERSED` \| `PENDING_SETTLEMENT` |
| `amount`                | DECIMAL(15,2)            | No       | —             | Base transaction amount                                       |
| `total`                 | DECIMAL(15,2)            | No       | —             | Total transaction value (may include fees)                    |
| `fees`                  | DECIMAL(15,2)            | No       | `0`           | Commission or processing fees                                 |
| `netAmount`             | DECIMAL(15,2)            | No       | —             | Final amount after fees                                       |
| `currency`              | VARCHAR(3)               | No       | `AED`         | ISO currency code                                             |
| `bankStatementReference`| TEXT                     | Yes      | NULL          | Reference to external bank statement for manual verification  |
| `paymentProof`          | TEXT                     | Yes      | NULL          | Path or reference to payment proof document                   |
| `processedById`         | UUID                     | Yes      | NULL          | Foreign key → `relationship_managers.id` (RM who processed)   |
| `approvedById`          | UUID                     | Yes      | NULL          | Foreign key → `users.id` (Admin who approved, for withdrawals)|
| `payoutId`              | UUID                     | Yes      | NULL          | Foreign key → `payouts.id` (for INTEREST_PAYOUT transactions) |
| `completedAt`           | TIMESTAMP                | No       | `now()`       | When transaction was finalized                                |
| `createdAt`             | TIMESTAMP                | No       | `now()`       | Record creation timestamp                                     |
| `updatedAt`             | TIMESTAMP                | No       | auto          | Auto-updated on any change                                    |
| `deletedAt`             | TIMESTAMP                | Yes      | NULL          | Soft-delete (for reversed transactions)                       |
| `notes`                 | TEXT                     | Yes      | NULL          | Internal notes or reason codes                                |
| `metadata`              | TEXT                     | Yes      | NULL          | JSON blob for additional data                                 |
| `failureReason`         | TEXT                     | Yes      | NULL          | Reason for FAILED status                                      |

**Indexes:** `clientId`, `type`, `status`, `completedAt`, `processedById`, `createdAt`, `(clientId, type, status)` (composite)

---

## Table 5: `audit_logs`

Immutable audit trail for all critical system actions.

| Column        | Type             | Nullable | Default   | Description                                                   |
|---------------|------------------|----------|-----------|---------------------------------------------------------------|
| `id`          | UUID             | No       | `uuid()`  | Primary key                                                   |
| `userId`      | UUID             | Yes      | NULL      | Foreign key → `users.id` (null for system-generated actions)  |
| `action`      | ENUM (AuditAction) | No     | —         | One of 30+ action types (LOGIN, PURCHASE_REQUEST_APPROVE, etc.)|
| `description` | TEXT             | Yes      | NULL      | Human-readable description of the action                      |
| `entityType`  | VARCHAR(50)      | No       | —         | Type of affected entity (e.g., "User", "Transaction")         |
| `entityId`    | VARCHAR          | No       | —         | ID of the affected entity                                     |
| `oldValues`   | JSON             | Yes      | NULL      | State before the action (for change tracking)                 |
| `newValues`   | JSON             | Yes      | NULL      | State after the action                                        |
| `ipAddress`   | VARCHAR(45)      | Yes      | NULL      | IPv4 or IPv6 address of the requester                         |
| `userAgent`   | TEXT             | Yes      | NULL      | Browser/client user agent string                              |
| `createdAt`   | TIMESTAMP        | No       | `now()`   | When the action occurred                                      |

**Indexes:** `userId`, `action`, `entityType`, `createdAt`

---

## Table 6: `notifications`

In-app notification inbox for all users.

| Column       | Type                        | Nullable | Default  | Description                                                   |
|--------------|-----------------------------|----------|----------|---------------------------------------------------------------|
| `id`         | UUID                        | No       | `uuid()` | Primary key                                                   |
| `userId`     | UUID                        | No       | —        | Foreign key → `users.id` (recipient)                          |
| `type`       | ENUM (NotificationType)     | No       | —        | `INFO` \| `SUCCESS` \| `WARNING` \| `ERROR` \| `ALERT`        |
| `category`   | ENUM (NotificationCategory) | No       | —        | `TRANSACTION` \| `REQUEST` \| `ASSIGNMENT` \| `SYSTEM` \| `PORTFOLIO` \| `SECURITY` |
| `title`      | VARCHAR                     | No       | —        | Short notification title                                      |
| `message`    | TEXT                        | No       | —        | Full notification body                                        |
| `isRead`     | BOOLEAN                     | No       | `false`  | Whether the user has read this notification                   |
| `actionUrl`  | VARCHAR                     | Yes      | NULL     | Optional deep-link URL for the notification                   |
| `createdAt`  | TIMESTAMP                   | No       | `now()`  | When the notification was created                             |

**Indexes:** `userId`, `isRead`, `createdAt`

---

## Table 7: `verification_tokens`

Time-limited tokens for email verification and password reset.

| Column      | Type      | Nullable | Default   | Description                                                   |
|-------------|-----------|----------|-----------|---------------------------------------------------------------|
| `id`        | UUID      | No       | `uuid()`  | Primary key                                                   |
| `userId`    | UUID      | No       | —         | Foreign key → `users.id`                                      |
| `token`     | VARCHAR   | No       | —         | Cryptographically secure random token (unique)                |
| `type`      | VARCHAR   | No       | —         | `EMAIL_VERIFICATION` \| `PASSWORD_RESET`                      |
| `expiresAt` | TIMESTAMP | No       | —         | Token expiry (24 hours for email verification, 1 hour for reset) |
| `usedAt`    | TIMESTAMP | Yes      | NULL      | When the token was consumed (null = unused)                   |
| `createdAt` | TIMESTAMP | No       | `now()`   | When the token was generated                                  |

---

## Table 8: `documents`

Storage metadata for all file uploads: KYC documents, contracts, and payout receipts.

| Column               | Type                    | Nullable | Default         | Description                                                   |
|----------------------|-------------------------|----------|-----------------|---------------------------------------------------------------|
| `id`                 | UUID                    | No       | `uuid()`        | Primary key                                                   |
| `clientId`           | UUID                    | Yes      | NULL            | Foreign key → `clients.id` (null for RM-uploaded files)       |
| `type`               | ENUM (DocumentType)     | No       | —               | `IDENTITY_PROOF` \| `INVESTMENT_AGREEMENT` \| `OTHER`         |
| `fileName`           | VARCHAR                 | No       | —               | Original filename as uploaded by the user                     |
| `filePath`           | TEXT                    | No       | —               | Server-side storage path (relative to `/uploads/`)            |
| `fileSize`           | INT                     | Yes      | NULL            | File size in bytes                                            |
| `mimeType`           | VARCHAR                 | Yes      | NULL            | MIME type (e.g., `application/pdf`, `image/jpeg`)             |
| `verificationStatus` | ENUM (VerificationStatus) | No    | `PENDING`       | Verification state of this specific document                  |
| `verifiedById`       | UUID                    | Yes      | NULL            | Foreign key → `users.id` (DocAdmin/Admin who verified)        |
| `verifiedAt`         | TIMESTAMP               | Yes      | NULL            | When verification was completed                               |
| `rejectionReason`    | TEXT                    | Yes      | NULL            | Reason for rejection (populated when status = REJECTED)       |
| `uploadedById`       | UUID                    | Yes      | NULL            | Foreign key → `users.id` (who uploaded — for RM uploads)      |
| `createdAt`          | TIMESTAMP               | No       | `now()`         | Upload timestamp                                              |
| `updatedAt`          | TIMESTAMP               | No       | auto            | Auto-updated on any change                                    |

---

## Table 9: `user_leads`

Public form submissions from prospective investors.

| Column            | Type              | Nullable | Default     | Description                                                   |
|-------------------|-------------------|----------|-------------|---------------------------------------------------------------|
| `id`              | UUID              | No       | `uuid()`    | Primary key                                                   |
| `userId`          | UUID              | Yes      | NULL        | Foreign key → `users.id` (set when lead converts to user)     |
| `assignedRMId`    | UUID              | Yes      | NULL        | Foreign key → `relationship_managers.id` (assigned by DocAdmin)|
| `firstName`       | VARCHAR           | No       | —           | Lead's first name                                             |
| `lastName`        | VARCHAR           | No       | —           | Lead's last name                                              |
| `email`           | VARCHAR           | No       | —           | Lead's email address                                          |
| `phone`           | VARCHAR           | Yes      | NULL        | Lead's phone number                                           |
| `source`          | ENUM (LeadSource) | Yes      | NULL        | `INSTAGRAM` \| `YOUTUBE` \| `FACEBOOK_ADS` \| `GOOGLE_ADS` \| `WEBSITE` \| `REFERRAL` \| `OTHER` |
| `status`          | ENUM (LeadStatus) | No       | `NEW`       | `NEW` \| `CONTACTED` \| `INTERESTED` \| `NOT_INTERESTED` \| `CONVERTED` \| `LOST` |
| `notes`           | TEXT              | Yes      | NULL        | RM's follow-up notes                                          |
| `investmentAmount`| DECIMAL(15,2)     | Yes      | NULL        | Stated investment interest amount                             |
| `investmentGoals` | TEXT              | Yes      | NULL        | Self-reported investment goals                                |
| `riskTolerance`   | VARCHAR           | Yes      | NULL        | Self-reported risk tolerance                                  |
| `createdAt`       | TIMESTAMP         | No       | `now()`     | When the lead form was submitted                              |
| `updatedAt`       | TIMESTAMP         | No       | auto        | Auto-updated on any change                                    |

---

## Table 10: `investments`

Investment plans defined and managed by Administrators.

| Column              | Type          | Nullable | Default   | Description                                                   |
|---------------------|---------------|----------|-----------|---------------------------------------------------------------|
| `id`                | UUID          | No       | `uuid()`  | Primary key                                                   |
| `name`              | VARCHAR       | No       | —         | Investment plan name (e.g., "Fixed Deposit Plan A")           |
| `description`       | TEXT          | Yes      | NULL      | Detailed description of the investment product                |
| `minimumInvestment` | DECIMAL(15,2) | No       | —         | Minimum investable amount (in AED)                            |
| `maximumInvestment` | DECIMAL(15,2) | Yes      | NULL      | Maximum investable amount (null = no limit)                   |
| `isActive`          | BOOLEAN       | No       | `true`    | Whether the plan is available for new investments             |
| `createdById`       | UUID          | Yes      | NULL      | Foreign key → `users.id` (Admin who created)                  |
| `createdAt`         | TIMESTAMP     | No       | `now()`   | Plan creation timestamp                                       |
| `updatedAt`         | TIMESTAMP     | No       | auto      | Auto-updated on any change                                    |

---

## Table 11: `investment_options`

Specific duration/ROI configurations within an investment plan.

| Column            | Type          | Nullable | Default   | Description                                                   |
|-------------------|---------------|----------|-----------|---------------------------------------------------------------|
| `id`              | UUID          | No       | `uuid()`  | Primary key                                                   |
| `investmentId`    | UUID          | No       | —         | Foreign key → `investments.id`                                |
| `duration`        | INT           | No       | —         | Investment duration in months (e.g., 12, 24, 36)              |
| `roi`             | DECIMAL(5,2)  | No       | —         | Annual Return on Investment percentage (e.g., 8.50 = 8.5%)   |
| `payoutFrequency` | VARCHAR       | No       | —         | `MONTHLY` \| `QUARTERLY` — interest distribution frequency    |
| `isActive`        | BOOLEAN       | No       | `true`    | Whether this option is available for selection                |
| `createdAt`       | TIMESTAMP     | No       | `now()`   | Option creation timestamp                                     |
| `updatedAt`       | TIMESTAMP     | No       | auto      | Auto-updated on any change                                    |

---

## Table 12: `investment_purchase_requests`

Multi-stage investment purchase workflow tracking.

| Column               | Type                 | Nullable | Default     | Description                                                   |
|----------------------|----------------------|----------|-------------|---------------------------------------------------------------|
| `id`                 | UUID                 | No       | `uuid()`    | Primary key                                                   |
| `clientId`           | UUID                 | No       | —           | Foreign key → `clients.id`                                    |
| `investmentId`       | UUID                 | No       | —           | Foreign key → `investments.id`                                |
| `investmentOptionId` | UUID                 | No       | —           | Foreign key → `investment_options.id`                         |
| `rmId`               | UUID                 | No       | —           | Foreign key → `relationship_managers.id` (assigned reviewer)  |
| `amount`             | DECIMAL(15,2)        | No       | —           | Investment amount requested by client                         |
| `status`             | ENUM (RequestStatus) | No       | `PENDING`   | `PENDING` \| `PROCESSING` \| `APPROVED` \| `REJECTED` \| `COMPLETED` \| `CANCELLED` |
| `payoutWindow`       | VARCHAR              | Yes      | NULL        | `1-15` or `16-30` — selected by RM on approval               |
| `contractDocumentId` | UUID                 | Yes      | NULL        | Foreign key → `documents.id` (pre-signed contract)            |
| `completedById`      | UUID                 | Yes      | NULL        | Foreign key → `users.id` (DocAdmin who finalized)             |
| `completedAt`        | TIMESTAMP            | Yes      | NULL        | When DocAdmin finalized the request                           |
| `rmNotes`            | TEXT                 | Yes      | NULL        | RM's approval/rejection notes                                 |
| `rejectionReason`    | TEXT                 | Yes      | NULL        | Reason for rejection (by RM)                                  |
| `contractStartDate`  | TIMESTAMP            | Yes      | NULL        | Investment contract start date (set on finalization)          |
| `contractEndDate`    | TIMESTAMP            | Yes      | NULL        | Investment contract end date (start + option duration)        |
| `createdAt`          | TIMESTAMP            | No       | `now()`     | When request was submitted                                    |
| `updatedAt`          | TIMESTAMP            | No       | auto        | Auto-updated on any change                                    |

---

## Table 13: `payout_schedules`

Auto-generated schedule of future interest payouts per investment contract.

| Column               | Type          | Nullable | Default   | Description                                                   |
|----------------------|---------------|----------|-----------|---------------------------------------------------------------|
| `id`                 | UUID          | No       | `uuid()`  | Primary key                                                   |
| `clientId`           | UUID          | No       | —         | Foreign key → `clients.id`                                    |
| `purchaseRequestId`  | UUID          | No       | —         | Foreign key → `investment_purchase_requests.id`               |
| `scheduledDate`      | TIMESTAMP     | No       | —         | Expected payout date (15th or 30th of a month)                |
| `amount`             | DECIMAL(15,2) | No       | —         | Calculated interest amount for this period                    |
| `period`             | VARCHAR       | No       | —         | Human-readable period (e.g., "Jan 2025", "Q1 2025")           |
| `payoutWindow`       | VARCHAR       | No       | —         | `1-15` or `16-30` (inherited from purchase request)           |
| `isPaid`             | BOOLEAN       | No       | `false`   | Whether this schedule has been executed                       |
| `createdAt`          | TIMESTAMP     | No       | `now()`   | When the schedule was generated                               |

---

## Table 14: `payouts`

Executed payout records with DocAdmin receipt confirmation.

| Column            | Type                 | Nullable | Default     | Description                                                   |
|-------------------|----------------------|----------|-------------|---------------------------------------------------------------|
| `id`              | UUID                 | No       | `uuid()`    | Primary key                                                   |
| `clientId`        | UUID                 | No       | —           | Foreign key → `clients.id`                                    |
| `purchaseRequestId`| UUID                | No       | —           | Foreign key → `investment_purchase_requests.id`               |
| `scheduleId`      | UUID                 | No       | —           | Foreign key → `payout_schedules.id` (1:1)                     |
| `amount`          | DECIMAL(15,2)        | No       | —           | Payout amount                                                 |
| `status`          | ENUM (PayoutStatus)  | No       | `PENDING`   | `PENDING` \| `COMPLETED` \| `FAILED`                          |
| `receiptDocumentId`| UUID               | Yes      | NULL        | Foreign key → `documents.id` (uploaded receipt)               |
| `processedById`   | UUID                 | Yes      | NULL        | Foreign key → `users.id` (DocAdmin who completed the payout)  |
| `processedAt`     | TIMESTAMP            | Yes      | NULL        | When the payout was marked as COMPLETED                       |
| `transactionId`   | UUID                 | Yes      | NULL        | Foreign key → `transactions.id` (created on completion)       |
| `notes`           | TEXT                 | Yes      | NULL        | DocAdmin notes                                                |
| `createdAt`       | TIMESTAMP            | No       | `now()`     | When the payout record was created                            |
| `updatedAt`       | TIMESTAMP            | No       | auto        | Auto-updated on any change                                    |

---

## Enum Reference Table

| Enum                    | Values                                                                                                     |
|-------------------------|------------------------------------------------------------------------------------------------------------|
| `UserRole`              | `CLIENT`, `RM`, `ADMIN`, `DOCADMIN`                                                                        |
| `AccountStatus`         | `ACTIVE`, `INACTIVE`, `LOCKED`, `SUSPENDED`                                                                |
| `VerificationStatus`    | `NOT_SUBMITTED`, `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `EXPIRED`                              |
| `RequestStatus`         | `PENDING`, `PROCESSING`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED`                                  |
| `TransactionType`       | `PURCHASE`, `WITHDRAWAL`, `INTEREST_PAYOUT`, `DIVIDEND`, `ADJUSTMENT`                                      |
| `TransactionStatus`     | `COMPLETED`, `FAILED`, `REVERSED`, `PENDING_SETTLEMENT`                                                    |
| `PayoutStatus`          | `PENDING`, `COMPLETED`, `FAILED`                                                                           |
| `DocumentType`          | `IDENTITY_PROOF`, `INVESTMENT_AGREEMENT`, `OTHER`                                                          |
| `LeadSource`            | `INSTAGRAM`, `YOUTUBE`, `FACEBOOK_ADS`, `GOOGLE_ADS`, `WEBSITE`, `REFERRAL`, `OTHER`                       |
| `LeadStatus`            | `NEW`, `CONTACTED`, `INTERESTED`, `NOT_INTERESTED`, `CONVERTED`, `LOST`                                    |
| `NotificationType`      | `INFO`, `SUCCESS`, `WARNING`, `ERROR`, `ALERT`                                                             |
| `NotificationCategory`  | `TRANSACTION`, `REQUEST`, `ASSIGNMENT`, `SYSTEM`, `PORTFOLIO`, `SECURITY`                                  |
| `AuditAction`           | `LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `CLIENT_ASSIGN`, `PURCHASE_REQUEST_CREATE`, `PURCHASE_REQUEST_APPROVE`, `PURCHASE_REQUEST_REJECT`, `TRANSACTION_CREATE`, `DOCUMENT_UPLOAD`, `DOCUMENT_VERIFY`, `DOCUMENT_REJECT`, `PAYOUT_CREATED`, `PAYOUT_COMPLETED`, `INVESTMENT_CREATE`, `CLIENT_ARCHIVE`, `CLIENT_RESTORE`, `DATA_EXPORT` (+ 10 more) |
