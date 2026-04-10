# Wealth Management CRM Platform

---

## Project Report

**Department of Information and Communication Technology**
**B.Sc. / M.Sc. (Information Technology)**
**Year: 2024–2025**

---

### Basic Information

| Field                  | Details                                              |
|------------------------|------------------------------------------------------|
| **Project Title**      | Wealth Management CRM Platform                       |
| **Project Category**   | Web-Based Enterprise Application                     |
| **Frontend Tools**     | Next.js 14+, React, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend Tools**      | Next.js API Routes (App Router), Prisma ORM          |
| **Database**           | PostgreSQL 15+                                       |
| **Authentication**     | NextAuth.js v4 (JWT-based)                           |
| **State Management**   | TanStack Query (React Query), React Context API      |
| **Email Service**      | Nodemailer (SMTP)                                    |
| **Deployment**         | Docker + AWS Elastic Beanstalk                       |
| **Project Duration**   | Active Development (2024–2025)                       |
| **Submitted By**       | Yash Pandav                                          |

---

# 1. Project Overview

The **Wealth Management CRM Platform** is a comprehensive, enterprise-grade web application designed for financial institutions to manage client portfolios, investment instruments, and multi-role operational workflows. The platform bridges the gap between clients seeking investment opportunities and the financial professionals who guide and manage those investments.

This system enables four distinct user types — **Clients**, **Relationship Managers (RMs)**, **Document Administrators (DocAdmins)**, and **Administrators** — to operate within a secure, role-based environment. Each role has precisely scoped access and capabilities, ensuring data integrity, regulatory compliance, and operational efficiency.

Key differentiators of this platform include:

- **Manual Transaction Processing:** Rather than integrating a payment gateway, the platform is designed for manual bank statement verification by authorized personnel, reflecting real-world enterprise financial workflows.
- **Two-Tier Approval System:** Withdrawal requests require sequential approval from both the Relationship Manager and the Administrator, providing a strong internal control mechanism.
- **KYC Lifecycle Management:** A full document verification pipeline with timed states, automated email reminders, and compliance archival logic.
- **Payout Management:** Automated interest payout scheduling with DocAdmin-controlled execution, receipt upload, and client notification.
- **Audit Trail:** All critical operations are logged with timestamps, IP addresses, actor identity, and before/after state — meeting 7-year financial record retention requirements.

---

## 1.1 Key Stakeholders

### 1. Clients (End Investors)
Individual investors who use the platform to explore investment instruments, submit purchase requests, track their portfolio, and receive payouts. Clients interact with the system through a secure portal after completing KYC verification.

- Browse investment instruments and plans
- Submit investment (purchase) requests
- Track portfolio and transaction history
- Download payout receipts and investment statements
- View assigned Relationship Manager

### 2. Relationship Managers (RMs)
Licensed financial professionals assigned to manage a portfolio of clients. RMs serve as the first line of approval for client investment and withdrawal requests.

- Manage an assigned portfolio of clients
- Review and approve/reject purchase requests
- Handle withdrawal requests (first-tier approval)
- Track lead pipeline from enquiry to active client
- Monitor client KYC status and follow up accordingly

### 3. Document Administrators (DocAdmins)
Operational staff responsible for KYC document verification, RM assignment, contract management, and payout processing. DocAdmins serve as the bridge between the operational and compliance layers.

- Verify client identity and KYC documents
- Assign Relationship Managers to clients
- Upload and manage investment contracts
- Process interest payouts with receipt upload
- Manage the DocAdmin-controlled payout workflow

### 4. Administrators
System-wide supervisors with full access. Administrators define investment products, manage user accounts, perform final withdrawal approvals, and monitor system health through comprehensive analytics.

- Create and manage investment plans and options
- Manage all user accounts and roles
- Final approval authority for withdrawal requests
- Access system-wide analytics and audit logs
- Monitor RM performance metrics

### 5. Public Users (Unauthenticated)
Prospective investors who can browse available investment instruments and submit lead enquiry forms without requiring an account.

- Browse public instrument listings
- Submit lead enquiry forms (`/user-form`)
- Cannot access dashboards, invest, or view personal data

---

## 1.2 Scope

The Wealth Management CRM Platform is designed to provide a complete lifecycle management solution for financial investments, from initial lead capture to final payout, within a secure, multi-role environment.

### Core Features in Scope

#### User Lifecycle Management
- 6-stage lead-to-client pipeline: New Enquiry → RM Assigned → KYC Pending → KYC Approved → Contract Pending → Completed
- State machine logic with validation rules at each transition
- Automated state progression based on document submission and approval events
- Historical state tracking and comprehensive audit trail

#### KYC & Document Verification
- Document upload portal for clients (Identity Proof, Investment Agreements)
- DocAdmin verification workflow with approve/reject actions
- Timed KYC rules: Day 3 reminder, Day 6 final warning, Day 7 account expiry
- Client login restrictions during PENDING and UNDER_REVIEW states
- Archival logic for KYC-expired accounts

#### Investment Management
- Admin-controlled investment plan and option creation
- Investment options include: duration, ROI, payout frequency (Monthly/Quarterly)
- Safeguard: existing client investments are locked; future changes apply only to new investments
- Interactive product browsing with return projections

#### Purchase Request Workflow (Multi-Stage)
1. Client selects product and submits request
2. RM reviews and approves/rejects with payout window selection
3. DocAdmin uploads pre-signed contract
4. DocAdmin finalizes → Transaction created, portfolio updated
5. Payout schedule activated based on contract configuration

#### Payout Management System
- RM selects payout window (1–15 or 16–30) during purchase approval
- DocAdmin-controlled payout execution with receipt upload
- Automated payout schedule generation (Monthly/Quarterly)
- Duplicate prevention per payout cycle
- Client receives receipt download link and email notification

#### Notification & Email System
- 15+ automated email triggers across the entire user journey
- In-app notifications categorized by type (INFO, SUCCESS, WARNING, ERROR, ALERT)
- Email triggers: registration, KYC reminders, purchase approvals, payout completions, contract creation, withdrawal approvals

#### Security & Compliance
- Role-Based Access Control (RBAC) across all layers
- JWT-based session management with 30-minute inactivity timeout
- bcrypt password hashing (12 rounds)
- Account lockout after 5 failed login attempts
- Comprehensive audit logging (30+ action types)
- Soft delete and archival for data integrity

#### Analytics & Reporting
- Client analytics dashboard (portfolio performance, holdings breakdown)
- Admin system-wide analytics (AUM, transaction volumes, RM performance)
- RM dashboard with 6 specialized views for pipeline management
- Export capabilities for audit logs

### Out of Scope
- Real-time payment gateway integration
- E-signature or digital signature workflows
- Multi-currency live exchange rate feed
- Social login (OAuth) — not currently implemented
- SMS-based OTP authentication
- Mobile native application (iOS/Android)

---

## 1.3 Objectives

The primary objective is to deliver an **enterprise-grade Wealth Management CRM** that enables financial institutions to manage the complete investment lifecycle — from prospect to active investor — with strict role-based controls, comprehensive audit trails, and automated workflows.

### 1. Role-Based System Functionality

#### 1.1 Client Objectives
Clients are the primary beneficiaries of the platform's investment services.

- **Portfolio Management:** View real-time portfolio holdings, investment values, and performance analytics
- **Investment Requests:** Submit purchase requests for available instruments and track approval status
- **Payout Tracking:** Monitor interest payout history, download receipts, and track upcoming payout dates
- **Document Management:** Upload KYC documents and track verification status
- **Notifications:** Receive timely in-app and email notifications for all account events

#### 1.2 Relationship Manager (RM) Objectives
RMs manage client relationships and act as the first tier of financial oversight.

- **Lead Pipeline Management:** Track leads through 6 stages — New, Contacted, Interested, Not Interested, Converted, Lost
- **Client Portfolio Oversight:** Monitor all assigned clients' investment activity and KYC status
- **Purchase Request Review:** Approve/reject client investment requests with payout window configuration
- **Withdrawal Oversight:** First-tier review of client withdrawal requests before escalation to Admin
- **KYC Follow-up:** Push KYC reminders to clients with pending document submissions

#### 1.3 DocAdmin Objectives
DocAdmins handle operational execution of KYC, contracts, and payouts.

- **Tab 1 — New Enquiries:** View all leads with form data; assign RMs; filter and sort by status
- **Tab 2 — KYC Pending:** Preview documents, run verification checklist, approve or reject with comments
- **Tab 3 — Product Requested:** View client-product mappings and investment amounts
- **Tab 4 — Contract Pending:** Upload pre-signed contracts; associate product terms and validity period
- **Tab 5 — Completed:** Access finalized contract repository; trigger transaction creation and portfolio update
- **Tab 6 — Pending Receipts:** Upload payout receipts; mark payouts as completed; prevent duplicate uploads

#### 1.4 Admin Objectives
Administrators hold system-wide authority with full operational visibility.

- **Investment Plan Management:** Create and manage investment plans with options (duration, ROI, payout frequency)
- **User Management:** Activate, deactivate, lock, or suspend user accounts; manage roles
- **Withdrawal Final Approval:** Serve as the ultimate authority for client withdrawal requests
- **Analytics & Reporting:** Access comprehensive dashboards for AUM, transaction volumes, and RM performance
- **Audit Compliance:** Review complete audit logs for all system-wide operations

### 2. Workflow & Process Objectives

#### 2.1 Purchase Request Flow
```
Client Submission → RM Review → DocAdmin Contract Upload → DocAdmin Finalization
→ Transaction Created → Payout Schedule Activated
```

#### 2.2 Withdrawal Request Flow (Two-Tier Approval)
```
Client Submission → RM Review (Approve/Reject)
→ [If RM Approved] Admin Review (Final Approve/Reject)
→ Transaction Created (if Admin Approved)
```

#### 2.3 KYC Lifecycle
```
NOT_SUBMITTED → PENDING (docs uploaded) → UNDER_REVIEW (DocAdmin reviewing)
→ VERIFIED (all docs approved) | REJECTED (docs rejected, resubmission required)
→ EXPIRED (Day 7 auto-expiry if not completed)
```

### 3. Security & Compliance Objectives
- Enforce RBAC across all API routes and UI components
- Maintain a 7-year audit trail for all financial operations
- Block login for accounts in PENDING or UNDER_REVIEW KYC status
- Auto-lock accounts after 5 consecutive failed login attempts (30-minute release)
- Encrypt all sensitive data in transit (TLS 1.3) and at rest (field-level encryption)
- GDPR readiness: data export, right to erasure, and consent management

### 4. Performance & Scalability Objectives
- Page load time: < 2 seconds on desktop, < 3 seconds on mobile (3G)
- API response time: p95 < 500ms
- System uptime: 99.9% availability SLA
- Support: 1,000+ concurrent users
- Test coverage: > 80% overall, > 90% for critical financial paths
