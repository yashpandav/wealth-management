# 9. Software Design

---

## 9.1 Database Design

### 9.1.1 Schema Architecture

The database follows a **role-extension pattern** where the `users` table serves as the authentication and identity anchor, and role-specific tables (`clients`, `relationship_managers`) extend it via a unique foreign key relationship. This approach:

- Keeps authentication logic centralized
- Allows role-specific fields without nullable columns in the base table
- Enables clean cascade deletes (deleting a user removes all role-specific data)
- Simplifies access control (a single `role` field gates all permissions)

```sql
-- Core Pattern: User → Role Extension (1:1)
users
  id (PK, UUID)
  email (UNIQUE)
  role (ENUM: CLIENT | RM | ADMIN | DOCADMIN)
  ...

clients
  id (PK, UUID)
  userId (FK → users.id, UNIQUE)  -- 1:1 enforced by UNIQUE constraint
  assignedRMId (FK → relationship_managers.id, nullable)
  verificationStatus (ENUM)
  ...

relationship_managers
  id (PK, UUID)
  userId (FK → users.id, UNIQUE)  -- 1:1 enforced by UNIQUE constraint
  totalAUM (DECIMAL 15,2)
  ...
```

### 9.1.2 Financial Data Precision

All monetary values use `DECIMAL(15,2)` to avoid floating-point arithmetic errors that are unacceptable in financial applications.

```
Stored as: 1234567890.50 (not 1234567890.4999999...)
Max value: 999,999,999,999,999.99
Precision: 2 decimal places (paisa/fils level accuracy)
Currency:  AED (UAE Dirham) — default across all tables
```

### 9.1.3 Index Strategy

Critical query patterns are accelerated with targeted indexes:

| Table                      | Index                              | Query Pattern                            |
|----------------------------|------------------------------------|------------------------------------------|
| `users`                    | `email`                            | Login lookup by email                    |
| `users`                    | `role`, `status`                   | Admin user management filters            |
| `users`                    | `isArchived`                       | Exclude archived from active queries     |
| `clients`                  | `assignedRMId`                     | RM's "my clients" query                  |
| `clients`                  | `verificationStatus`               | DocAdmin KYC pending filter              |
| `clients`                  | `(assignedRMId, verificationStatus)`| RM's KYC view — most selective filter   |
| `transactions`             | `(clientId, type, status)`         | Portfolio AUM calculation                |
| `transactions`             | `completedAt`                      | Date-range analytics                     |
| `audit_logs`               | `userId`, `action`, `createdAt`    | Audit log filtering                      |

### 9.1.4 Soft Delete & Archival Pattern

```
Standard Soft Delete:
  deletedAt DateTime?    -- null = active, timestamp = deleted
  Query filter: WHERE deletedAt IS NULL

KYC Archival (Extended):
  isArchived Boolean     -- false = active, true = archived
  archivedAt DateTime?   -- when archived
  archivedReason Text?   -- "KYC_EXPIRED_DAY_7"
  Query filter: WHERE isArchived = false AND deletedAt IS NULL
```

---

## 9.2 API Design

### 9.2.1 Architecture

The API is built on **Next.js 14 App Router** API routes (`/app/api/`), organized by role namespace. Each route file exports HTTP method handlers (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).

**Standard Response Format:**
```typescript
// Success
{ success: true, data: {...}, message?: "Optional message" }

// Error
{ success: false, error: "Description", details?: {...} }
```

**Authentication Pattern (all protected routes):**
```typescript
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
if (session.user.role !== "RM") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
```

### 9.2.2 Complete API Reference

#### Authentication Endpoints (`/api/auth/`)

| Method | Endpoint                        | Access  | Description                                      |
|--------|---------------------------------|---------|--------------------------------------------------|
| POST   | `/api/auth/register`            | Public  | Register new user (creates User + Client record) |
| POST   | `/api/auth/[...nextauth]`       | Public  | NextAuth.js sign-in/sign-out handler             |
| POST   | `/api/auth/verify-email`        | Public  | Verify email with token                          |
| POST   | `/api/auth/forgot-password`     | Public  | Request password reset email                     |
| POST   | `/api/auth/reset-password`      | Public  | Reset password using token                       |

#### Client Endpoints (`/api/client/`)

| Method | Endpoint                          | Access  | Description                               |
|--------|-----------------------------------|---------|-------------------------------------------|
| GET    | `/api/client/my-rm`               | Client  | Get assigned RM details                   |
| GET    | `/api/client/portfolio`           | Client  | Get portfolio holdings and total value    |
| GET    | `/api/client/analytics`           | Client  | Get portfolio analytics data              |
| GET    | `/api/client/transactions`        | Client  | Get transaction history                   |
| GET    | `/api/client/products`            | Client  | Get all active investment products        |
| GET    | `/api/client/products/[id]`       | Client  | Get specific product details              |
| POST   | `/api/client/product-requests`    | Client  | Submit a purchase request                 |
| GET    | `/api/client/product-requests`    | Client  | Get own purchase request history          |
| GET    | `/api/client/payouts`             | Client  | Get payout history                        |
| POST   | `/api/client/assign-rm`           | Client  | Internal RM assignment endpoint           |

#### Relationship Manager Endpoints (`/api/rm/`)

| Method | Endpoint                                    | Access | Description                              |
|--------|---------------------------------------------|--------|------------------------------------------|
| GET    | `/api/rm/dashboard/stats`                   | RM     | Dashboard summary statistics             |
| GET    | `/api/rm/leads`                             | RM     | Get assigned leads                       |
| PATCH  | `/api/rm/leads/[id]/update-status`          | RM     | Update lead status and notes             |
| GET    | `/api/rm/registered-clients`                | RM     | Clients registered but no KYC submitted  |
| GET    | `/api/rm/kyc-pending`                       | RM     | Clients with pending KYC documents       |
| GET    | `/api/rm/active-clients`                    | RM     | Fully verified, active clients           |
| GET    | `/api/rm/clients`                           | RM     | All assigned clients                     |
| GET    | `/api/rm/clients/[id]`                      | RM     | Specific client details                  |
| GET    | `/api/rm/product-requests`                  | RM     | All purchase requests from assigned clients |
| GET    | `/api/rm/product-requests/[id]`             | RM     | Specific purchase request details        |
| PATCH  | `/api/rm/product-requests/[id]`             | RM     | Approve/reject purchase request          |
| POST   | `/api/rm/upload`                            | RM     | Upload document for a client             |

#### DocAdmin Endpoints (`/api/docadmin/`)

| Method | Endpoint                                           | Access   | Description                                  |
|--------|----------------------------------------------------|----------|----------------------------------------------|
| GET    | `/api/docadmin/clients`                            | DocAdmin | All clients with verification status         |
| GET    | `/api/docadmin/clients/[id]/assign-rm`             | DocAdmin | Assign RM to a specific client               |
| POST   | `/api/docadmin/clients/[id]/assign-rm`             | DocAdmin | Execute RM assignment                        |
| GET    | `/api/docadmin/leads`                              | DocAdmin | All leads awaiting RM assignment             |
| POST   | `/api/docadmin/leads/[id]/assign-rm`               | DocAdmin | Assign RM to a lead                          |
| GET    | `/api/docadmin/product-requests`                   | DocAdmin | Purchase requests in contract workflow       |
| POST   | `/api/docadmin/product-requests/[id]/upload-contract` | DocAdmin | Upload pre-signed contract PDF            |
| POST   | `/api/docadmin/product-requests/[id]/finalize`     | DocAdmin | Finalize purchase (create transaction + schedule) |
| GET    | `/api/docadmin/payouts`                            | DocAdmin | All pending payout receipts                  |
| POST   | `/api/docadmin/payouts/[id]/complete`              | DocAdmin | Upload receipt and mark payout completed     |
| GET    | `/api/docadmin/rms`                                | DocAdmin | List of all available RMs                    |
| GET    | `/api/docadmin/pending-counts`                     | DocAdmin | Badge counts for navigation tabs             |

#### Admin Endpoints (`/api/admin/`)

| Method | Endpoint                                    | Access | Description                                   |
|--------|---------------------------------------------|--------|-----------------------------------------------|
| GET    | `/api/admin/users`                          | Admin  | All users with filters                        |
| GET    | `/api/admin/users/[id]`                     | Admin  | Specific user details                         |
| PATCH  | `/api/admin/users/[id]/status`              | Admin  | Update user account status                    |
| POST   | `/api/admin/users/[id]/unlock`              | Admin  | Unlock locked user account                    |
| POST   | `/api/admin/users/bulk-status`              | Admin  | Bulk status update for multiple users         |
| GET    | `/api/admin/clients`                        | Admin  | All clients with RM assignment info           |
| POST   | `/api/admin/clients/assign`                 | Admin  | Assign RM to a specific client                |
| POST   | `/api/admin/clients/bulk-assign`            | Admin  | Bulk RM assignment                            |
| GET    | `/api/admin/rms`                            | Admin  | All RMs with client counts                    |
| GET    | `/api/admin/rm-performance`                 | Admin  | RM performance metrics                        |
| GET    | `/api/admin/investment-plans`               | Admin  | All investment plans                          |
| POST   | `/api/admin/investment-plans`               | Admin  | Create new investment plan/option             |
| GET    | `/api/admin/product-requests`               | Admin  | Withdrawal requests awaiting admin approval   |
| GET    | `/api/admin/leads`                          | Admin  | All leads                                     |
| GET    | `/api/admin/audit-logs`                     | Admin  | Paginated audit log                           |
| GET    | `/api/admin/audit-logs/export`              | Admin  | Export audit log as CSV                       |
| GET    | `/api/admin/analytics/overview`             | Admin  | System-wide analytics overview                |

#### Shared Endpoints

| Method | Endpoint                         | Access        | Description                             |
|--------|----------------------------------|---------------|-----------------------------------------|
| GET    | `/api/products`                  | Public        | All active investment products (public) |
| GET    | `/api/products/[id]`             | Public        | Product detail (public)                 |
| POST   | `/api/leads`                     | Public        | Submit lead enquiry form                |
| GET    | `/api/leads/[id]`                | RM/DocAdmin   | Get specific lead detail                |
| POST   | `/api/documents/upload`          | Client        | Upload KYC document                     |
| GET    | `/api/documents`                 | Authenticated | List own documents                      |
| GET    | `/api/documents/[id]/download`   | Authenticated | Download specific document              |
| POST   | `/api/documents/verify`          | DocAdmin/Admin| Verify or reject a document             |
| GET    | `/api/user/profile`              | Authenticated | Get own profile                         |
| PATCH  | `/api/user/profile`              | Authenticated | Update own profile                      |
| POST   | `/api/user/profile/photo`        | Authenticated | Upload profile photo                    |
| GET    | `/api/user/notifications`        | Authenticated | Get notifications                       |

#### Cron / Automation Endpoints (`/api/cron/`)

| Method | Endpoint                              | Trigger       | Description                                   |
|--------|---------------------------------------|---------------|-----------------------------------------------|
| GET    | `/api/cron/payout-generation`         | Cron (daily)  | Generate payout records for due schedules     |
| GET    | `/api/cron/payout-reminder-15th`      | Cron (15th)   | Send DocAdmin payout reminder on 15th         |
| GET    | `/api/cron/payout-reminder-month-end` | Cron (30th)   | Send DocAdmin payout reminder at month end    |
| GET    | `/api/cron/init`                      | System start  | Initialize system (schedule generation)       |

---

## 9.3 Interface Design

### 9.3.1 Application Routes & Pages

The application UI is organized into role-specific route groups using Next.js App Router route groups.

#### Public Routes
| Path              | Component              | Description                          |
|-------------------|------------------------|--------------------------------------|
| `/`               | Home Page              | Landing page with product highlights |
| `/instruments`    | Product Listing        | Public investment product browsing   |
| `/user-form`      | Lead Form              | 2-step prospective investor form     |
| `/login`          | Login Page             | Email/password authentication        |
| `/register`       | Registration Page      | New account creation                 |
| `/verify-email`   | Email Verification     | Token-based email confirmation       |
| `/forgot-password`| Password Recovery      | Password reset request               |
| `/reset-password` | Password Reset         | New password form                    |
| `/upload-documents`| Document Upload       | KYC document submission              |

#### Client Routes (`/client/`)
| Path                      | Description                              |
|---------------------------|------------------------------------------|
| `/client/dashboard`       | Portfolio overview, quick stats          |
| `/client/portfolio`       | Holdings, investment breakdown chart     |
| `/client/analytics`       | Performance over time, returns chart     |
| `/client/products`        | Available investment products list       |
| `/client/products/[id]`   | Product detail + investment amount slider|
| `/client/product-requests`| Own purchase request history & status    |
| `/client/payouts`         | Payout history, receipt downloads        |
| `/client/my-rm`           | Assigned RM details and contact          |
| `/client/transactions`    | Complete transaction history             |
| `/notifications`          | In-app notification inbox                |

#### Relationship Manager Routes (`/rm/`)
| Path                         | Description                              |
|------------------------------|------------------------------------------|
| `/rm/dashboard`              | 6-view pipeline dashboard                |
| `/rm/leads`                  | Lead pipeline management                 |
| `/rm/clients`                | All assigned clients                     |
| `/rm/clients/[id]`           | Individual client portfolio view         |
| `/rm/purchase-requests`      | Purchase requests awaiting RM review     |
| `/rm/purchase-requests/[id]` | Detailed request view with approve/reject|
| `/rm/withdrawal-requests`    | Withdrawal requests for review           |

#### DocAdmin Routes (`/docadmin/`)
| Path                         | Description                              |
|------------------------------|------------------------------------------|
| `/docadmin/dashboard`        | 6-tab operational portal                 |
| `/docadmin/documents`        | KYC document verification queue          |
| `/docadmin/leads`            | Lead RM assignment                       |
| `/docadmin/product-requests` | Contract upload and finalization         |
| `/docadmin/payouts`          | Pending payout receipt management        |

#### Admin Routes (`/admin/`)
| Path                       | Description                              |
|----------------------------|------------------------------------------|
| `/admin/dashboard`         | System KPI overview                      |
| `/admin/users`             | All user accounts management             |
| `/admin/clients`           | Client RM assignment                     |
| `/admin/instruments`       | Investment plan and option management    |
| `/admin/withdrawal-requests`| Final withdrawal approval queue         |
| `/admin/analytics`         | System-wide analytics dashboard          |
| `/admin/audit-logs`        | Full audit log viewer + export           |
| `/admin/rm-performance`    | RM performance metrics                   |
| `/admin/leads`             | All lead management                      |

### 9.3.2 Component Architecture

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth route group (login, register)
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── client/               # Client-only pages
│   │   ├── rm/                   # RM-only pages
│   │   ├── docadmin/             # DocAdmin-only pages
│   │   └── admin/                # Admin-only pages
│   └── api/                      # All API route handlers
│
├── components/
│   ├── ui/                       # Base shadcn/ui components
│   │   ├── button.tsx            │ Input, Select, Checkbox...
│   │   ├── dialog.tsx            │ Table, Badge, Avatar...
│   │   └── ...                   │
│   ├── layout/                   # Structural components
│   │   ├── Sidebar.tsx           # Role-specific navigation sidebar
│   │   ├── Header.tsx            # Top bar with notifications bell
│   │   └── DashboardLayout.tsx   # Unified dashboard wrapper
│   ├── auth/                     # Auth-specific components
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── client/                   # Client-specific components
│   │   ├── PortfolioChart.tsx
│   │   ├── PurchaseRequestForm.tsx
│   │   └── PayoutHistoryTable.tsx
│   ├── rm/                       # RM-specific components
│   │   ├── LeadPipelineView.tsx
│   │   ├── PurchaseApprovalForm.tsx
│   │   └── ClientDashboardCard.tsx
│   ├── docadmin/                 # DocAdmin-specific components
│   │   ├── DocumentVerificationCard.tsx
│   │   ├── ContractUploadModal.tsx
│   │   └── PayoutReceiptUpload.tsx
│   ├── admin/                    # Admin-specific components
│   │   ├── InvestmentPlanForm.tsx
│   │   ├── UserManagementTable.tsx
│   │   └── AuditLogExport.tsx
│   └── shared/                   # Shared across roles
│       ├── NotificationBell.tsx
│       ├── DataTable.tsx          # TanStack Table wrapper
│       └── ConfirmationModal.tsx
│
├── lib/
│   ├── auth/
│   │   ├── auth.config.ts        # NextAuth configuration
│   │   └── rbac.hooks.ts         # useIsAdmin(), useIsRM() hooks
│   ├── db/
│   │   └── prisma.ts             # Prisma client singleton
│   ├── email/
│   │   └── email.service.ts      # All email templates (1,260 lines)
│   ├── utils/
│   │   ├── formatters.ts         # Currency, date formatters
│   │   └── validators.ts         # Shared validation helpers
│   └── validation/
│       └── schemas/              # Zod schemas per domain
│
├── types/
│   └── index.ts                  # Shared TypeScript types
│
└── hooks/
    ├── usePortfolio.ts           # Portfolio data hook
    ├── usePurchaseRequests.ts    # Purchase request hooks
    └── useNotifications.ts       # Notification polling hook
```

### 9.3.3 Design System

**Color Palette:**
- Primary: Deep Navy Blue `#1E3A5F` — Trust, stability (financial)
- Accent: Gold `#D4AF37` — Premium, wealth
- Success: Green `#22C55E`
- Warning: Amber `#F59E0B`
- Danger: Red `#EF4444`
- Neutral: Gray scale (`#F9FAFB` to `#111827`)

**Typography:**
- Font: Inter (system-fallback sans-serif stack)
- Heading scale: 2xl (24px), xl (20px), lg (18px), base (16px)
- Body: 14px/16px with 1.5 line-height

**Responsive Breakpoints:**
- Mobile: `< 640px` — single column, bottom navigation
- Tablet: `640px–1024px` — condensed sidebar, 2-column grids
- Desktop: `> 1024px` — full sidebar, 3+ column layouts

**Accessibility:**
- WCAG 2.1 Level AA compliant
- 4.5:1 minimum contrast ratio
- Full keyboard navigation
- ARIA labels on all interactive elements
- Focus-visible outlines on all focusable elements
