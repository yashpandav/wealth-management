# 11. Future Enhancement

---

## 11.1 Overview

The Wealth Management CRM Platform is in active development with a strong foundation. The following enhancements are planned for future releases, organized by priority and strategic impact. These are informed by known technical limitations, stakeholder feedback, and industry best practices for fintech platforms.

---

## 11.2 High Priority Enhancements

### 11.2.1 Background Job & Scheduler System
**Current Limitation:** No cron jobs or background processing engine — KYC timed rules, payout reminders, and automated archival currently require manual triggers or deploy-time initialization.

**Planned Solution:**
- Integrate **BullMQ** (Redis-backed queue) or **Inngest** for reliable background job processing
- Implement dedicated cron workers for:
  - KYC Day-3 reminder emails
  - KYC Day-6 final warning emails
  - KYC Day-7 account archival
  - Monthly/quarterly payout schedule generation
  - Contract renewal reminders (60 days before expiry)
- Job retry logic, dead letter queues, and job monitoring dashboard
- Alert on failed job execution via Sentry/PagerDuty

**Impact:** Eliminates the critical gap in time-based automation; enables true zero-touch KYC lifecycle management.

---

### 11.2.2 Cloud Document Storage (AWS S3 / Cloudflare R2)
**Current Limitation:** All uploaded documents are stored on the local filesystem (`/uploads/`), making horizontal scaling impossible and creating a single point of failure.

**Planned Solution:**
- Migrate file storage to **AWS S3** or **Cloudflare R2**
- Generate pre-signed URLs for secure, time-limited document access
- Implement CDN distribution for frequently accessed documents
- Server-side encryption (SSE-S3 or SSE-KMS) for documents at rest
- Virus scanning (ClamAV or AWS Macie) on upload
- Automatic lifecycle policies (archive to Glacier after 7 years)

**Impact:** Enables multi-instance deployment, reduces server storage costs, and improves document access performance globally.

---

### 11.2.3 Real-Time Notifications (WebSocket / SSE)
**Current Limitation:** Notifications require a page refresh; no real-time updates.

**Planned Solution:**
- Implement **Server-Sent Events (SSE)** for lightweight real-time notification push
- Or **Socket.io** for bidirectional real-time communication
- Live notification badge update without page refresh
- Real-time purchase request status updates for clients
- Live approval status changes for RMs and DocAdmins

**Impact:** Significantly improves UX for all roles, especially for DocAdmins monitoring payout queues.

---

### 11.2.4 Lead-to-User Automated Conversion Workflow
**Current Limitation:** `UserLead` table is entirely separate from `User` — no automatic or guided conversion flow exists.

**Planned Solution:**
- Build a DocAdmin/RM-initiated "Convert Lead" action
- Auto-create a `User` account from lead data with a temporary password
- Send invitation email to the converted lead
- Link the `UserLead` record to the new `User` via `userId`
- Track conversion rate metrics in Admin analytics
- Status tracking: New → Contacted → Interested → Converted → Lost

**Impact:** Closes the gap in the lead pipeline; enables proper funnel analytics and ROI measurement on marketing channels.

---

### 11.2.5 E-Signature / Digital Contract Workflow
**Current Limitation:** No contract or e-signature workflow — contracts are uploaded as static PDFs with no binding digital signature.

**Planned Solution:**
- Integrate **DocuSign**, **HelloSign**, or **DigiSigner** API
- Generate contract from template with client and investment details auto-populated
- Send contract to client and RM for digital signature
- Track signature status (Sent → Viewed → Signed by Client → Signed by RM → Completed)
- Store signed contract with audit trail in S3
- Webhook callbacks to update contract status in real-time

**Impact:** Eliminates paper-based signature workflows, reduces turn-around time, and provides legally binding digital records.

---

## 11.3 Medium Priority Enhancements

### 11.3.1 Multi-Currency Support
**Current State:** AED is hard-coded as the default currency across all financial fields.

**Planned Enhancement:**
- Support multiple base currencies (AED, USD, EUR, GBP, INR)
- Live exchange rate integration (Open Exchange Rates API or ECB feed)
- Per-client currency preference stored in profile
- Currency conversion in portfolio analytics with historical rates
- Report generation in selected currency

---

### 11.3.2 Redis-Based Caching Layer
**Current State:** All API responses query the database on every request.

**Planned Enhancement:**
- Deploy **Redis** for server-side response caching
- Cache: investment product listings (TTL: 5 minutes)
- Cache: analytics aggregations (TTL: 15 minutes)
- Cache: RM dashboard counts (TTL: 1 minute, invalidated on status changes)
- Session store migration from JWT cookies to Redis-backed sessions
- Pub/Sub for real-time notification broadcasting

**Impact:** Reduces database load by an estimated 40–60% for read-heavy endpoints.

---

### 11.3.3 Advanced Analytics Dashboard
**Current State:** Basic portfolio charts and summary analytics.

**Planned Enhancement:**
- Admin: Interactive AUM trend chart (month-over-month, year-over-year)
- Admin: Investment plan performance comparison (ROI by product, by option duration)
- Admin: Client acquisition funnel (leads → registered → KYC → active investors)
- RM: Personal performance scorecard (conversion rate, client retention, AUM growth)
- Client: Return simulation tool ("If I invest AED X for Y months at Z% ROI")
- Export: CSV/PDF reports for all analytics views

---

### 11.3.4 Mobile Application (React Native)
**Current State:** Responsive web app only.

**Planned Enhancement:**
- React Native app sharing business logic with the web platform
- Client features: portfolio view, request tracking, notification push
- RM features: client list, approval actions
- Biometric authentication (Face ID / Fingerprint)
- Push notifications via FCM/APNs
- Offline portfolio view (cached data)

---

### 11.3.5 SMS & WhatsApp Notifications
**Current State:** Email-only notification system.

**Planned Enhancement:**
- SMS alerts for critical events (payout credited, request approved) via Twilio
- WhatsApp Business API for document collection reminders
- Optional per-user notification preference settings (email / SMS / WhatsApp / in-app)
- OTP delivery via SMS as a second factor for high-value transactions

---

### 11.3.6 Two-Factor Authentication (2FA)
**Current State:** No MFA implemented (AuditAction has `MFA_ENABLE` placeholder).

**Planned Enhancement:**
- TOTP-based 2FA using **Google Authenticator / Authy** via `otplib`
- Mandatory 2FA for Admin and DocAdmin roles
- Optional 2FA for Client and RM roles
- Backup codes generation (10 one-time codes)
- 2FA bypass flow for account recovery

---

## 11.4 Low Priority / Long-Term Enhancements

### 11.4.1 AI-Powered Investment Recommendations
- Personalized product suggestions based on client risk profile, goals, and transaction history
- Anomaly detection for unusual withdrawal patterns (fraud prevention signal)
- Automated KYC risk scoring

### 11.4.2 Open Banking Integration
- Auto-verification of bank statements via Open Banking API
- Real-time balance verification for investment amounts
- Bank transfer initiation from the platform (with regulatory approval)

### 11.4.3 Regulatory Reporting Automation
- Automated generation of regulatory reports (AML, KYC compliance)
- Scheduled submission to financial authority portals
- FATCA/CRS reporting templates

### 11.4.4 Multi-Tenant Architecture
- Support multiple financial institutions on a single platform instance
- Tenant isolation at database level (Row-Level Security or schema separation)
- Per-tenant branding, product catalog, and email templates
- Centralized super-admin console for tenant management

### 11.4.5 Client Self-Service Portal Enhancement
- Downloadable annual investment statements (PDF)
- Tax certificate generation
- Investment calculator with scenario comparison
- Goal-based investment planning wizard

---

## 11.5 Technical Debt Resolution

| Item                              | Current State                    | Planned Resolution                         |
|-----------------------------------|----------------------------------|--------------------------------------------|
| Inconsistent soft-delete pattern  | Only some models have `deletedAt`| Standardize soft delete across all models  |
| Session management                | 30-min JWT only, no "remember me"| Add sliding session + device management    |
| Email failure handling            | Logged but not retried           | Add email queue with retry and DLQ         |
| File storage                      | Local filesystem                 | Migrate to S3/R2 (see 11.2.2)              |
| Background jobs                   | HTTP-triggered cron routes       | Proper job queue (see 11.2.1)              |
| No soft-delete on Document table  | Hard deletes possible            | Add `deletedAt` to `documents` table       |
| No API rate limiting middleware   | Per-route implementations vary   | Centralized rate limiting via middleware   |
| No contract model                 | Contracts stored as Documents    | Dedicated `contracts` table with metadata  |
