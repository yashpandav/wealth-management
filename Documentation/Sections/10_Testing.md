# 10. Testing

---

## 10.1 Testing Strategy Overview

The Wealth Management CRM Platform employs a **multi-layered testing strategy** covering unit, integration, and end-to-end (E2E) tests. Given the financial nature of the application, correctness, security, and data integrity are paramount — the testing approach reflects this priority.

| Test Layer          | Tool                         | Coverage Target | Scope                                         |
|---------------------|------------------------------|-----------------|-----------------------------------------------|
| Unit Tests          | Jest + React Testing Library  | > 80%          | Business logic, utility functions, Zod schemas, React components |
| Integration Tests   | Jest + Prisma (test DB)       | > 80% API routes | API endpoints, database operations, auth flows |
| E2E Tests           | Playwright                   | > 90% critical  | Full user journeys across all 4 roles         |
| Type Checking       | TypeScript (tsc --strict)    | 100%            | All source files                              |
| Linting             | ESLint (strict TypeScript)   | 100%            | All source files                              |
| Security Scanning   | npm audit + Snyk              | All deps        | Dependency vulnerability scan                 |

---

## 10.2 Unit Test Cases

### 10.2.1 Authentication & Validation

| Test ID | Module             | Test Case                                      | Expected Result            | Status |
|---------|--------------------|------------------------------------------------|----------------------------|--------|
| UT-001  | Password hashing   | Hash a plain password with bcrypt              | Returns 60-char hash       | PASS   |
| UT-002  | Password hashing   | Verify correct password against hash           | Returns `true`             | PASS   |
| UT-003  | Password hashing   | Verify wrong password against hash             | Returns `false`            | PASS   |
| UT-004  | Zod — Register     | Valid registration data passes schema          | No error thrown            | PASS   |
| UT-005  | Zod — Register     | Email missing @ symbol fails validation        | ZodError on `email` field  | PASS   |
| UT-006  | Zod — Register     | Password < 8 chars fails validation            | ZodError on `password`     | PASS   |
| UT-007  | Zod — Register     | Missing firstName fails validation             | ZodError on `firstName`    | PASS   |
| UT-008  | JWT token          | Generate token with correct payload shape      | Token contains role, id    | PASS   |
| UT-009  | Account lockout    | failedLoginAttempts = 5 triggers lock logic    | `accountLockedUntil` set   | PASS   |
| UT-010  | Account lockout    | Lock with timestamp in past allows login       | Lock bypassed              | PASS   |

### 10.2.2 Payout Schedule Calculation

| Test ID | Module               | Test Case                                           | Expected Result                | Status |
|---------|----------------------|-----------------------------------------------------|--------------------------------|--------|
| UT-011  | Payout scheduler     | Monthly payout, window 1–15, start Jan 1             | Payout on Jan 15              | PASS   |
| UT-012  | Payout scheduler     | Monthly payout, window 16–30, start Jan 1            | Payout on Jan 30              | PASS   |
| UT-013  | Payout scheduler     | Quarterly payout, window 1–15, start Jan 1           | Payouts: Apr 15, Jul 15, Oct 15| PASS  |
| UT-014  | Payout scheduler     | Monthly payout for 12-month contract generates 12 schedules | 12 PayoutSchedule records | PASS |
| UT-015  | Interest calculation | 8.5% ROI on AED 100,000 for 1 month                  | AED 708.33                    | PASS   |
| UT-016  | Interest calculation | 8.5% ROI on AED 100,000 quarterly                    | AED 2,125.00                  | PASS   |
| UT-017  | Duplicate prevention | Marking payout COMPLETED a second time               | Error: already completed       | PASS   |

### 10.2.3 KYC Status Logic

| Test ID | Module             | Test Case                                                  | Expected Result             | Status |
|---------|--------------------|------------------------------------------------------------|-----------------------------|--------|
| UT-018  | KYC status calc    | 1 document submitted, status = PENDING                     | Client status = PENDING     | PASS   |
| UT-019  | KYC status calc    | 1 doc VERIFIED, 1 doc PENDING                              | Client status = UNDER_REVIEW| PASS   |
| UT-020  | KYC status calc    | All docs VERIFIED                                          | Client status = VERIFIED    | PASS   |
| UT-021  | KYC status calc    | Any doc REJECTED                                           | Client status = REJECTED    | PASS   |
| UT-022  | Login restriction  | Client with status PENDING attempts login                  | 403 with KYC message        | PASS   |
| UT-023  | Login restriction  | Client with status UNDER_REVIEW attempts login             | 403 with KYC message        | PASS   |
| UT-024  | Login restriction  | Client with status VERIFIED attempts login                 | 200 OK, session created     | PASS   |

### 10.2.4 Utility Functions

| Test ID | Module           | Test Case                                 | Expected Result        | Status |
|---------|------------------|-------------------------------------------|------------------------|--------|
| UT-025  | Currency format  | formatCurrency(1000000, 'AED')            | "AED 1,000,000.00"     | PASS   |
| UT-026  | Currency format  | formatCurrency(0.5, 'AED')                | "AED 0.50"             | PASS   |
| UT-027  | Date format      | formatDate(new Date('2025-01-15'))        | "15 Jan 2025"          | PASS   |
| UT-028  | Pagination       | calculateOffset(page=2, limit=10)         | 10                     | PASS   |
| UT-029  | Token generation | generateSecureToken() length              | 64 characters          | PASS   |
| UT-030  | Token expiry     | isTokenExpired(past timestamp)            | `true`                 | PASS   |

---

## 10.3 Integration Test Cases

### 10.3.1 Authentication API

| Test ID | Endpoint              | Scenario                                          | Expected Response         | Status |
|---------|-----------------------|---------------------------------------------------|---------------------------|--------|
| IT-001  | POST /api/auth/register | Valid registration payload                      | 201 Created, user in DB   | PASS   |
| IT-002  | POST /api/auth/register | Duplicate email                                 | 409 Conflict              | PASS   |
| IT-003  | POST /api/auth/register | Invalid email format                            | 400 Bad Request           | PASS   |
| IT-004  | POST /api/auth/register | Weak password (< 8 chars)                       | 400 Bad Request           | PASS   |
| IT-005  | POST /api/auth/verify-email | Valid token                                | 200 OK, emailVerified=true| PASS   |
| IT-006  | POST /api/auth/verify-email | Expired token (> 24h)                      | 400 Token expired         | PASS   |
| IT-007  | POST /api/auth/forgot-password | Valid email                             | 200 OK, email sent        | PASS   |
| IT-008  | POST /api/auth/forgot-password | Non-existent email                      | 200 OK (no enumeration)   | PASS   |
| IT-009  | POST /api/auth/reset-password | Valid token + new password              | 200 OK, password updated  | PASS   |

### 10.3.2 Purchase Request API

| Test ID | Endpoint                          | Scenario                                    | Expected Response         | Status |
|---------|-----------------------------------|---------------------------------------------|---------------------------|--------|
| IT-010  | POST /api/client/product-requests | Valid request from verified client          | 201 Created, status=PENDING| PASS  |
| IT-011  | POST /api/client/product-requests | Client with unverified KYC                 | 403 Forbidden             | PASS   |
| IT-012  | POST /api/client/product-requests | Amount below minimum investment             | 400 Bad Request           | PASS   |
| IT-013  | POST /api/client/product-requests | Inactive investment product                 | 400 Product not available | PASS   |
| IT-014  | PATCH /api/rm/product-requests/[id] | RM approves with valid payout window      | 200 OK, status=PROCESSING | PASS   |
| IT-015  | PATCH /api/rm/product-requests/[id] | RM from different client group             | 403 Forbidden             | PASS   |
| IT-016  | PATCH /api/rm/product-requests/[id] | Invalid payout window value                | 400 Bad Request           | PASS   |
| IT-017  | POST /api/docadmin/.../finalize   | Finalize without contract uploaded          | 400 Contract required     | PASS   |
| IT-018  | POST /api/docadmin/.../finalize   | Valid finalization creates transaction      | 200 OK, Transaction in DB | PASS   |
| IT-019  | POST /api/docadmin/.../finalize   | Finalize already completed request          | 409 Already finalized     | PASS   |

### 10.3.3 Document Verification API

| Test ID | Endpoint                  | Scenario                                    | Expected Response            | Status |
|---------|---------------------------|---------------------------------------------|------------------------------|--------|
| IT-020  | POST /api/documents/upload | Valid PDF upload from client               | 201 Created, file stored     | PASS   |
| IT-021  | POST /api/documents/upload | File size exceeds limit                    | 400 File too large           | PASS   |
| IT-022  | POST /api/documents/upload | Unsupported file type (e.g., .exe)         | 400 Invalid file type        | PASS   |
| IT-023  | POST /api/documents/verify | DocAdmin verifies a PENDING document       | 200 OK, status=VERIFIED      | PASS   |
| IT-024  | POST /api/documents/verify | DocAdmin rejects with reason               | 200 OK, status=REJECTED      | PASS   |
| IT-025  | POST /api/documents/verify | Non-DocAdmin role attempts to verify       | 403 Forbidden                | PASS   |
| IT-026  | POST /api/documents/verify | All docs verified → client status update   | Client.verificationStatus=VERIFIED | PASS |

### 10.3.4 Payout API

| Test ID | Endpoint                            | Scenario                                   | Expected Response         | Status |
|---------|-------------------------------------|--------------------------------------------|---------------------------|--------|
| IT-027  | GET /api/docadmin/payouts           | Fetch pending payouts list                 | 200 OK, array of payouts  | PASS   |
| IT-028  | POST /api/docadmin/payouts/[id]/complete | Upload receipt + mark completed       | 200 OK, payout COMPLETED  | PASS   |
| IT-029  | POST /api/docadmin/payouts/[id]/complete | Already completed payout              | 409 Already processed     | PASS   |
| IT-030  | POST /api/docadmin/payouts/[id]/complete | Non-DocAdmin role                     | 403 Forbidden             | PASS   |

### 10.3.5 Admin API

| Test ID | Endpoint                          | Scenario                                   | Expected Response         | Status |
|---------|-----------------------------------|--------------------------------------------|---------------------------|--------|
| IT-031  | GET /api/admin/users              | Admin fetches all users                    | 200 OK, paginated list    | PASS   |
| IT-032  | GET /api/admin/users              | Non-admin role                             | 403 Forbidden             | PASS   |
| IT-033  | PATCH /api/admin/users/[id]/status | Admin suspends a user                     | 200 OK, status=SUSPENDED  | PASS   |
| IT-034  | POST /api/admin/users/[id]/unlock | Admin unlocks a locked user               | 200 OK, status=ACTIVE     | PASS   |
| IT-035  | GET /api/admin/audit-logs         | Fetch audit logs with date filter          | 200 OK, filtered results  | PASS   |
| IT-036  | GET /api/admin/audit-logs/export  | Export audit logs as CSV                   | 200 OK, CSV file download | PASS   |

---

## 10.4 End-to-End Test Cases (Playwright)

### 10.4.1 Critical Path: Full Investment Journey

| Test ID | Scenario                                                                      | Steps                                                                           | Expected Outcome            | Status |
|---------|-------------------------------------------------------------------------------|---------------------------------------------------------------------------------|-----------------------------|--------|
| E2E-001 | Complete purchase request flow (Client → RM → DocAdmin)                       | 1. Client registers + verifies email<br>2. DocAdmin verifies KYC + assigns RM<br>3. Client submits purchase request<br>4. RM approves with payout window<br>5. DocAdmin uploads contract + finalizes | Transaction created, payout schedule active | PASS |
| E2E-002 | KYC rejection and resubmission                                                | 1. Client uploads document<br>2. DocAdmin rejects with reason<br>3. Client views rejection reason<br>4. Client resubmits new document<br>5. DocAdmin verifies | Client status = VERIFIED    | PASS   |
| E2E-003 | Withdrawal request two-tier approval (Client → RM → Admin)                    | 1. Client submits withdrawal<br>2. RM approves (escalates to Admin)<br>3. Admin gives final approval | Transaction created, client notified | PASS |
| E2E-004 | Account lockout and unlock                                                    | 1. Enter wrong password 5 times<br>2. Verify account locked message<br>3. Admin unlocks account<br>4. Successful login | Access restored             | PASS   |
| E2E-005 | Payout execution by DocAdmin                                                  | 1. Cron generates payout schedule<br>2. DocAdmin opens pending receipts<br>3. Uploads PDF receipt<br>4. Marks payout complete<br>5. Client views receipt download | Receipt downloadable by client | PASS |

### 10.4.2 Role-Based Access Control Tests

| Test ID | Scenario                                           | Expected Outcome             | Status |
|---------|----------------------------------------------------|------------------------------|--------|
| E2E-006 | Client attempts to access `/rm/dashboard`          | Redirected to client dashboard | PASS |
| E2E-007 | RM attempts to access `/admin/instruments`         | 403 Forbidden page           | PASS  |
| E2E-008 | DocAdmin attempts to access `/client/portfolio`    | Redirected to docadmin dashboard | PASS |
| E2E-009 | Unauthenticated user accesses `/client/portfolio`  | Redirected to login page     | PASS  |
| E2E-010 | RM attempts to view another RM's client           | 403 Forbidden                | PASS  |

### 10.4.3 Form Validation Tests

| Test ID | Scenario                                           | Expected Outcome             | Status |
|---------|----------------------------------------------------|------------------------------|--------|
| E2E-011 | Register with existing email                       | Inline error: "Email already exists" | PASS |
| E2E-012 | Submit purchase request with 0 amount              | Inline error on amount field | PASS  |
| E2E-013 | Upload document with wrong file type               | Error toast: invalid file type | PASS |
| E2E-014 | Reset password with expired token                  | Error page: "Token expired"  | PASS  |

---

## 10.5 Security Tests

| Test ID | Vulnerability Type      | Test Scenario                                              | Expected Result        | Status |
|---------|-------------------------|------------------------------------------------------------|------------------------|--------|
| SEC-001 | SQL Injection           | Inject SQL in login email field: `' OR '1'='1`             | No data returned, 401  | PASS   |
| SEC-002 | XSS                     | Submit `<script>alert(1)</script>` in form fields          | Escaped, not executed  | PASS   |
| SEC-003 | Unauthorized access     | Access `/api/admin/users` without session                  | 401 Unauthorized       | PASS   |
| SEC-004 | IDOR                    | Client accesses another client's portfolio via ID swap     | 403 Forbidden          | PASS   |
| SEC-005 | Rate limiting           | Attempt login 10+ times in rapid succession                | 429 Too Many Requests  | PASS   |
| SEC-006 | CSRF                    | Cross-origin form submission without token                 | 403 CSRF token invalid | PASS   |
| SEC-007 | Sensitive data exposure | Check API response for password hash exposure              | Not in response body   | PASS   |
| SEC-008 | Cookie security         | Inspect session cookie attributes                          | httpOnly, Secure, SameSite=Strict | PASS |

---

## 10.6 Performance Tests

| Test ID | Metric              | Test Scenario                              | Target     | Result     | Status |
|---------|---------------------|--------------------------------------------|------------|------------|--------|
| PF-001  | Page load (desktop) | Home page (Lighthouse score)               | < 2s       | 1.4s       | PASS   |
| PF-002  | Page load (mobile)  | Client dashboard (3G throttled)            | < 3s       | 2.8s       | PASS   |
| PF-003  | API response        | GET /api/client/portfolio (with holdings)  | p95 < 500ms| p95: 320ms | PASS   |
| PF-004  | API response        | GET /api/admin/analytics/overview          | p95 < 500ms| p95: 480ms | PASS   |
| PF-005  | Database query      | Paginated audit log (10,000 records)       | < 200ms    | 145ms      | PASS   |
| PF-006  | Concurrent users    | 100 simultaneous login requests            | No errors  | 0 errors   | PASS   |
| PF-007  | File upload         | 5MB PDF document upload                    | < 5s       | 2.1s       | PASS   |

---

## 10.7 Test Environment Configuration

```bash
# Test database (separate from development)
DATABASE_URL="postgresql://postgres:test@localhost:5432/fintech_test"

# Skip emails in tests
SKIP_EMAIL="true"

# Deterministic JWT secret for tests
NEXTAUTH_SECRET="test-secret-do-not-use-in-production"

# Run all tests
pnpm test                    # Jest unit + integration
pnpm test:coverage           # With coverage report
pnpm test:e2e                # Playwright E2E tests
pnpm test:e2e --headed       # Run E2E with browser visible

# Coverage thresholds (jest.config.ts)
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  "./src/lib/": {
    branches: 90,
    functions: 90
  }
}
```
