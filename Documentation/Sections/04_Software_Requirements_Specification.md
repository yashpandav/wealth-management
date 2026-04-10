# 4. Software Requirements Specification (SRS)

---

## 4.1 Functional Requirements

Functional requirements define the specific behaviors, features, and operations the system must support. These are organized by user role.

---

### 4.1.1 Public User (Unauthenticated)

| Req. ID | Requirement                                                                 | Priority |
|---------|-----------------------------------------------------------------------------|----------|
| PU-01   | The system shall allow any visitor to browse the instrument/product listing without authentication | High |
| PU-02   | The system shall allow public users to submit a lead enquiry form (2-step: Personal Info → Financial Info) | High |
| PU-03   | The system shall store submitted lead data in the `user_leads` table with a `NEW` status | High |
| PU-04   | The system shall redirect unauthenticated users attempting to access protected routes to the login page | High |
| PU-05   | The system shall display product details (name, description, ROI, duration) publicly without login | Medium |

---

### 4.1.2 Authentication & Registration

| Req. ID | Requirement                                                                 | Priority |
|---------|-----------------------------------------------------------------------------|----------|
| AU-01   | The system shall allow new users to register with email, password, first name, and last name | High |
| AU-02   | The system shall send a verification email with a 24-hour expiry token upon registration | High |
| AU-03   | The system shall verify email tokens and mark the account as `emailVerified: true` | High |
| AU-04   | The system shall block login if the account's KYC `verificationStatus` is `PENDING` or `UNDER_REVIEW` with a descriptive error message | High |
| AU-05   | The system shall lock an account for 30 minutes after 5 consecutive failed login attempts | High |
| AU-06   | The system shall support password reset via a time-limited email token | High |
| AU-07   | The system shall expire JWT sessions after 30 minutes of inactivity | High |
| AU-08   | The system shall inject `role`, `userId`, and `status` into the session JWT for all authorized requests | High |
| AU-09   | The system shall hash all passwords using bcrypt with a cost factor of 12 | High |

---

### 4.1.3 Client Requirements

| Req. ID | Requirement                                                                 | Priority |
|---------|-----------------------------------------------------------------------------|----------|
| CL-01   | The system shall display the client's assigned Relationship Manager profile and contact details | High |
| CL-02   | The system shall display the client's portfolio: total invested amount, holdings, and returns | High |
| CL-03   | The system shall allow clients to browse all available investment products/instruments | High |
| CL-04   | The system shall allow verified clients to submit a purchase request for an investment product with an amount | High |
| CL-05   | The system shall display real-time purchase request status (PENDING, RM_APPROVED, COMPLETED, REJECTED) | High |
| CL-06   | The system shall allow clients to upload KYC documents (Identity Proof, Investment Agreement) | High |
| CL-07   | The system shall restrict document upload to supported formats (PDF, JPG, PNG) with size limits | Medium |
| CL-08   | The system shall display payout history with receipt download links | High |
| CL-09   | The system shall display total interest earned and active contract status | High |
| CL-10   | The system shall show clients their in-app notification feed with mark-as-read functionality | Medium |
| CL-11   | The system shall display a banner if the client has no RM assigned or KYC is pending, and restrict product purchase | High |
| CL-12   | The system shall show portfolio analytics: investment breakdown charts, performance over time | Medium |
| CL-13   | The system shall allow clients to view their complete transaction history | High |

---

### 4.1.4 Relationship Manager (RM) Requirements

| Req. ID | Requirement                                                                 | Priority |
|---------|-----------------------------------------------------------------------------|----------|
| RM-01   | The system shall display the RM's dashboard with 6 dedicated views: Leads, Registered Clients (No KYC), KYC Pending, Active Clients, Purchase Requests, Withdrawal Requests | High |
| RM-02   | The system shall allow RMs to view all assigned leads with contact info and source tracking | High |
| RM-03   | The system shall allow RMs to update lead status (NEW → CONTACTED → INTERESTED → CONVERTED / LOST) | High |
| RM-04   | The system shall allow RMs to add, edit, and delete follow-up notes against each lead (CRUD) | Medium |
| RM-05   | The system shall allow RMs to push KYC reminder emails to registered clients with pending submissions | Medium |
| RM-06   | The system shall display the client's KYC verification status in real-time (read-only for RM) | High |
| RM-07   | The system shall allow RMs to review client purchase requests with full details (product, amount, client info) | High |
| RM-08   | The system shall allow RMs to approve or reject purchase requests with a reason and selected payout window (1–15 or 16–30) | High |
| RM-09   | The system shall allow RMs to review withdrawal requests and approve (escalate to Admin) or reject them | High |
| RM-10   | The system shall display RM dashboard statistics: total clients, pending requests, active investments | Medium |
| RM-11   | The system shall restrict RMs from accessing other RMs' client data | High |
| RM-12   | The system shall allow RMs to view full client portfolio and transaction history for their assigned clients | High |
| RM-13   | The system shall allow RMs to upload supporting documents for clients | Medium |

---

### 4.1.5 Document Administrator (DocAdmin) Requirements

| Req. ID | Requirement                                                                 | Priority |
|---------|-----------------------------------------------------------------------------|----------|
| DA-01   | The system shall display the DocAdmin portal with 6 tabs: New Enquiries, KYC Pending, Product Requested, Contract Pending, Completed, Pending Receipts | High |
| DA-02   | The system shall allow DocAdmins to assign an RM to a client from the New Enquiries tab | High |
| DA-03   | The system shall allow DocAdmins to assign an RM to a lead from the Leads management section | High |
| DA-04   | The system shall allow DocAdmins to preview KYC documents and run a verification checklist | High |
| DA-05   | The system shall allow DocAdmins to verify (approve) or reject KYC documents with a reason | High |
| DA-06   | The system shall automatically update `Client.verificationStatus` based on document verification outcomes | High |
| DA-07   | The system shall display all RM-approved purchase requests awaiting contract upload in the Contract Pending tab | High |
| DA-08   | The system shall allow DocAdmins to upload a pre-signed contract (PDF) against a purchase request | High |
| DA-09   | The system shall allow DocAdmins to finalize a purchase request: creates a Transaction, updates portfolio, activates payout schedule | High |
| DA-10   | The system shall prevent finalization if a contract has not been uploaded | High |
| DA-11   | The system shall display all contracts due for payout in the Pending Receipts tab | High |
| DA-12   | The system shall allow DocAdmins to upload a payout receipt (PDF/Image) and mark a payout as COMPLETED | High |
| DA-13   | The system shall prevent duplicate payout receipt uploads for the same payout cycle | High |
| DA-14   | The system shall send a payout notification email to the client upon payout completion | High |
| DA-15   | The system shall display pending document counts in the DocAdmin navigation badge | Medium |
| DA-16   | The system shall allow DocAdmins to view all registered clients and their verification status | Medium |

---

### 4.1.6 Administrator Requirements

| Req. ID | Requirement                                                                 | Priority |
|---------|-----------------------------------------------------------------------------|----------|
| AD-01   | The system shall allow Admins to create new Investment Plans with name, description, and minimum investment amount | High |
| AD-02   | The system shall allow Admins to add Investment Options to plans with: duration, ROI percentage, and payout frequency (Monthly/Quarterly) | High |
| AD-03   | The system shall lock existing client investments when Admin changes an Investment Option — changes apply only to new investments | High |
| AD-04   | The system shall allow Admins to view all registered users and filter by role/status | High |
| AD-05   | The system shall allow Admins to activate, deactivate, lock, or suspend user accounts | High |
| AD-06   | The system shall allow Admins to unlock locked accounts manually | Medium |
| AD-07   | The system shall allow Admins to perform bulk status updates on multiple users | Medium |
| AD-08   | The system shall display all RM-approved withdrawal requests awaiting Admin final approval | High |
| AD-09   | The system shall allow Admins to approve or reject withdrawal requests with a reason | High |
| AD-10   | The system shall display system-wide analytics: total AUM, transaction volumes, RM performance metrics | High |
| AD-11   | The system shall allow Admins to view, filter, and export the complete audit log | High |
| AD-12   | The system shall display all RMs with their assigned client count and performance metrics | Medium |
| AD-13   | The system shall allow Admins to view all leads with status and source tracking | Medium |
| AD-14   | The system shall provide an admin dashboard with summary KPIs | High |

---

### 4.1.7 Notification & Email Requirements

| Req. ID | Requirement                                                                 | Priority |
|---------|-----------------------------------------------------------------------------|----------|
| NE-01   | The system shall send an email verification link on registration (24-hour expiry) | High |
| NE-02   | The system shall send a welcome email after successful email verification | High |
| NE-03   | The system shall send a KYC Day-3 reminder email to clients with pending KYC | High |
| NE-04   | The system shall send a KYC Day-6 final warning email with account deactivation notice | High |
| NE-05   | The system shall send a KYC expiry email when the account is archived on Day 7 | High |
| NE-06   | The system shall send email confirmation when a purchase request is submitted, approved, or rejected | High |
| NE-07   | The system shall send a payout completion email with receipt attachment to the client | High |
| NE-08   | The system shall send a contract creation notification email | Medium |
| NE-09   | The system shall send withdrawal status notification emails at each approval stage | High |
| NE-10   | The system shall send in-app notifications for all major events (transaction, assignment, security, system) | High |
| NE-11   | The system shall support a `SKIP_EMAIL` flag for development environments | Medium |

---

### 4.1.8 Audit & Compliance Requirements

| Req. ID | Requirement                                                                 | Priority |
|---------|-----------------------------------------------------------------------------|----------|
| AC-01   | The system shall log every critical action to the `audit_logs` table with: actor ID, action type, entity type, entity ID, old values, new values, IP address, user agent, and timestamp | High |
| AC-02   | The system shall support 30+ audit action types across authentication, user management, documents, transactions, payouts, and investment management | High |
| AC-03   | The system shall allow Admins to export audit logs in CSV format | Medium |
| AC-04   | The system shall retain audit log records for a minimum of 7 years | High |
| AC-05   | The system shall support soft deletion (non-destructive removal) for User and Transaction records | High |
| AC-06   | The system shall archive KYC-expired accounts with an archival reason and timestamp | High |

---

## 4.2 Non-Functional Requirements

Non-functional requirements define the quality attributes and constraints the system must satisfy.

---

### 4.2.1 Performance Requirements

| Req. ID | Requirement                                                                 | Target         |
|---------|-----------------------------------------------------------------------------|----------------|
| PF-01   | Page load time (desktop, broadband)                                         | < 2 seconds    |
| PF-02   | Page load time (mobile, 3G network)                                         | < 3 seconds    |
| PF-03   | API response time (p95 across all endpoints)                                | < 500ms        |
| PF-04   | System uptime SLA                                                            | 99.9%          |
| PF-05   | Concurrent user support                                                      | 1,000+ users   |
| PF-06   | Database query time for paginated list endpoints                             | < 200ms        |
| PF-07   | File upload processing (document upload)                                    | < 5 seconds    |

---

### 4.2.2 Security Requirements

| Req. ID | Requirement                                                                 | Standard       |
|---------|-----------------------------------------------------------------------------|----------------|
| SE-01   | All passwords shall be hashed using bcrypt with a minimum cost factor of 12 | OWASP          |
| SE-02   | All session tokens shall be stored in httpOnly, Secure, SameSite=Strict cookies | OWASP        |
| SE-03   | All API routes shall enforce server-side role and ownership validation       | RBAC           |
| SE-04   | All client-submitted data shall be validated on both client and server sides using Zod | OWASP  |
| SE-05   | SQL injection shall be prevented by exclusive use of Prisma ORM parameterized queries | OWASP  |
| SE-06   | XSS shall be prevented by React's built-in escaping and Content Security Policy headers | OWASP |
| SE-07   | CSRF shall be prevented by NextAuth's built-in CSRF token mechanism         | OWASP          |
| SE-08   | Sensitive data (passwords, tokens, PII) shall never be logged               | GDPR/SOC2      |
| SE-09   | All API endpoints shall implement rate limiting for sensitive operations     | OWASP          |
| SE-10   | All data in transit shall use TLS 1.3 encryption                            | PCI DSS        |

---

### 4.2.3 Usability Requirements

| Req. ID | Requirement                                                                 |
|---------|-----------------------------------------------------------------------------|
| UX-01   | The interface shall comply with WCAG 2.1 Level AA accessibility standards  |
| UX-02   | All interactive elements shall have a minimum touch target of 44×44 pixels |
| UX-03   | The color contrast ratio shall be a minimum of 4.5:1 for body text         |
| UX-04   | All forms shall display inline validation errors for each field             |
| UX-05   | All asynchronous operations shall display appropriate loading indicators    |
| UX-06   | The system shall be fully navigable using keyboard alone (Tab, Enter, Escape) |
| UX-07   | The interface shall be fully responsive across mobile (< 640px), tablet (640–1024px), and desktop (> 1024px) breakpoints |
| UX-08   | Error messages shall be user-friendly and include actionable guidance       |

---

### 4.2.4 Reliability & Maintainability Requirements

| Req. ID | Requirement                                                                 |
|---------|-----------------------------------------------------------------------------|
| RL-01   | The system shall implement graceful degradation — email failures shall be logged but shall not block primary operations |
| RL-02   | The system shall implement centralized error handling middleware with structured error responses |
| RL-03   | Test coverage shall exceed 80% overall and 90% for critical financial paths |
| RL-04   | The codebase shall maintain zero ESLint warnings in production builds       |
| RL-05   | All TypeScript code shall compile in strict mode with no type errors        |
| RL-06   | Database migrations shall be version-controlled and reversible              |
| RL-07   | The system shall implement health check endpoints for infrastructure monitoring |

---

### 4.2.5 Scalability Requirements

| Req. ID | Requirement                                                                 |
|---------|-----------------------------------------------------------------------------|
| SC-01   | The application shall support horizontal scaling through stateless API design |
| SC-02   | Database connection pooling shall be configured for production workloads    |
| SC-03   | All paginated endpoints shall support cursor-based or offset-based pagination |
| SC-04   | Database queries shall use indexed columns for all filtered, sorted, and joined operations |
| SC-05   | Server-side caching (Redis-ready) shall be planned for high-traffic endpoints |

---

### 4.2.6 Compliance Requirements

| Req. ID | Requirement                                                                 |
|---------|-----------------------------------------------------------------------------|
| CO-01   | Audit logs shall be retained for a minimum of 7 years in compliance with financial record-keeping standards |
| CO-02   | The system shall support GDPR data export requests and right-to-erasure workflows |
| CO-03   | All financial amounts shall be stored with 15-digit precision and 2 decimal places |
| CO-04   | Document storage paths shall be secured and not publicly accessible without authentication |
| CO-05   | The system shall prevent duplicate payout processing for the same cycle (idempotency guard) |
