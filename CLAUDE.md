# Claude Code Instructions - Wealth Management CRM Platform

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

---

## Project Overview

### Product Vision

This is an **enterprise-grade Wealth Management CRM platform** designed for financial institutions. The platform enables:

- **Clients** to explore and invest in financial instruments
- **Relationship Managers (RMs)** to manage client portfolios and process transactions
- **Administrators** to oversee operations, create instruments, and approve critical transactions

### Key Business Context

- **Client-RM Relationship:** Multiple clients can be assigned to one RM, but each client has only ONE RM
- **Manual Transaction Processing:** No payment gateway integration - RMs and admins verify bank statements manually
- **Two-Tier Approval:** Withdrawals require both RM review AND admin approval
- **Public Access:** Unauthenticated users can browse instruments but must sign in to invest
- **Enterprise Standards:** Production-grade code with security, compliance, observability, and scalability

---

## Architecture & Technology Stack

### Core Technologies

- **Framework:** Next.js 14+ with App Router (TypeScript)
- **Language:** TypeScript 5+ (strict mode)
- **Database:** PostgreSQL 15+
- **ORM:** Prisma 5+
- **Authentication:** NextAuth.js v4 or Auth.js v5
- **Validation:** Zod schemas
- **State Management:** React Context API + TanStack Query (React Query)
- **Forms:** React Hook Form
- **Styling:** Tailwind CSS 3+ with shadcn/ui components

### Database Configuration

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/fintech"
```

### Supporting Libraries

- **Date handling:** date-fns
- **Charts:** Recharts or Chart.js
- **PDF generation:** react-pdf or jsPDF
- **Email:** Nodemailer or Resend
- **Notifications:** React Hot Toast
- **Tables:** TanStack Table
- **File uploads:** React Dropzone

### Development Tools

- **Package manager:** pnpm
- **Linting:** ESLint (strict rules)
- **Formatting:** Prettier
- **Testing:** Jest + React Testing Library + Playwright
- **Git hooks:** Husky + lint-staged
- **Commits:** Conventional Commits

### DevOps & Monitoring

- **Containers:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Logging:** Winston or Pino
- **APM:** OpenTelemetry
- **Error tracking:** Sentry
- **Monitoring:** Prometheus + Grafana

---

## User Roles & Capabilities

### 1. Public User (Unauthenticated)

**Access:** Read-only public content

- Browse available investment instruments
- View RM portfolio performance (anonymized)
- Access general market trends
- **Cannot:** Make investments, access personal data

### 2. Client (Authenticated Customer)

**Access:** Personal portfolio management

- View assigned RM details (name, email, phone)
- Browse instruments with detailed information
- Submit purchase requests
- Submit withdrawal requests
- View portfolio and transaction history
- Access personal analytics
- **Cannot:** Approve own transactions, access other clients' data, create instruments

### 3. Relationship Manager (RM)

**Access:** Client management and transaction processing

- View all assigned clients
- Access client portfolio details
- Process purchase requests (approve/reject)
- Review withdrawal requests (submit to admin)
- View pending requests dashboard
- Generate client reports
- **Cannot:** Approve final withdrawals, create instruments, access system-wide analytics

### 4. Administrator

**Access:** Full system access

- Create/edit investment instruments
- Assign clients to RMs
- **Final approval authority** for withdrawal requests
- View system-wide analytics dashboard
- Manage user accounts
- Access audit logs
- **Cannot:** Directly process client transactions (delegates to RMs)

---

## Critical Business Rules

### Transaction Workflows

#### Purchase Request Flow

1. **Client** submits purchase request for instrument
2. **RM** reviews request and verifies bank statement
3. **RM** approves → Transaction completes automatically
4. **RM** rejects → Client notified with reason

#### Withdrawal Request Flow

1. **Client** submits withdrawal request
2. **RM** reviews request and verifies availability
3. **RM** submits to admin for approval (or rejects)
4. **Admin** provides final approval/rejection
5. Transaction completes only after admin approval

### Assignment Rules

- **One-to-Many:** One RM can manage multiple clients
- **One-to-One:** One client can only have ONE RM
- Assignment/reassignment creates audit trail
- Both parties notified of assignment changes

### Manual Processing

- **No Payment Gateway:** All transactions verified manually via bank statements
- RMs and admins reference external bank statements before approval
- Audit trail required for all approvals/rejections

---

## Database Schema (Key Entities)

### Core Tables

- **User** - Base entity with role (CLIENT, RM, ADMIN)
- **Client** - Extends User, links to RM
- **RelationshipManager** - Extends User
- **Instrument** - Investment products (stocks, bonds, funds, etc.)
- **Portfolio** - Client holdings aggregate
- **Holding** - Individual instrument positions
- **PurchaseRequest** - Client purchase submissions
- **WithdrawalRequest** - Two-tier approval workflow
- **Transaction** - Completed financial transactions
- **Notification** - In-app notifications
- **AuditLog** - Comprehensive audit trail

### Important Relationships

```
Client (1) ←→ (1) RM
Client (1) ←→ (1) Portfolio
Portfolio (1) ←→ (many) Holdings
Holding (many) ←→ (1) Instrument
Client (1) ←→ (many) PurchaseRequests
Client (1) ←→ (many) WithdrawalRequests
```

---

## Security & Compliance Requirements

### Authentication & Authorization

- **Password:** bcrypt hashing (rounds=12), min 8 chars with complexity
- **MFA:** TOTP-based multi-factor authentication
- **Sessions:** Secure cookies (httpOnly, secure, sameSite)
- **Lockout:** 5 failed attempts triggers account lock
- **Timeout:** 30 minutes inactivity
- **RBAC:** Role-based access control at all layers

### Data Protection

- **Encryption:** TLS 1.3 for transit, field-level for sensitive data
- **PII Protection:** Mask in logs, encrypt at rest
- **Audit Trail:** Log all critical actions (7-year retention)
- **GDPR Ready:** Data export, right to erasure

### Input Validation

- **Client & Server:** Zod validation on both sides
- **SQL Injection:** Prevented by Prisma ORM
- **XSS:** React built-in escaping + sanitization
- **CSRF:** NextAuth built-in protection
- **Rate Limiting:** API route protection

---

## Performance Requirements

### Critical Metrics

- **Page Load:** <2s desktop, <3s mobile (3G)
- **API Response:** p95 <500ms
- **Uptime:** 99.9% availability SLA
- **Concurrent Users:** Support 1000+ simultaneous
- **Test Coverage:** >80% minimum

### Optimization Strategy

- Server-side rendering (SSR) for critical paths
- Code splitting and lazy loading
- Image optimization (Next.js Image)
- Database query optimization and indexing
- Connection pooling
- CDN for static assets
- Caching strategy (Redis for production)

---

## Development Workflow

### Branch Strategy

- **main/master:** Production-ready code
- **feature/\*:** New features
- **fix/\*:** Bug fixes
- **hotfix/\*:** Critical production fixes

### Commit Conventions

Use Conventional Commits format:

```
feat: add client portfolio view
fix: resolve RM assignment validation
chore: update dependencies
docs: update API documentation
test: add purchase workflow tests
```

### Code Quality Standards

- **TypeScript Strict Mode:** No implicit any
- **ESLint:** Zero warnings in production
- **Prettier:** Consistent formatting
- **Tests Required:** All PRs need tests for new features
- **Code Review:** Minimum 1 approval before merge

### Testing Requirements

- **Unit Tests:** Jest for business logic, utilities
- **Integration Tests:** API endpoints, database operations
- **E2E Tests:** Playwright for critical user paths
- **Coverage:** >80% overall, >90% for critical paths

---

## Key Technical Considerations

### Error Handling

- Centralized error handling middleware
- User-friendly error messages
- Detailed logging for debugging
- Error tracking with Sentry
- Graceful degradation

### Logging & Monitoring

- Structured JSON logging
- Log levels: error, warn, info, debug
- Request/response logging
- Performance metrics
- Health check endpoints
- APM with OpenTelemetry

### Accessibility

- WCAG 2.1 Level AA compliance
- Semantic HTML
- ARIA labels
- Keyboard navigation
- 4.5:1 color contrast minimum
- Screen reader compatible

### Responsive Design

- Mobile-first approach
- Breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
- Touch-friendly UI (44x44px minimum tap targets)
- Progressive enhancement

---

## API Design Principles

### RESTful Conventions

- **GET** - Retrieve resources (idempotent)
- **POST** - Create resources
- **PUT/PATCH** - Update resources
- **DELETE** - Remove resources

### Route Structure

```
/api/auth/*           - Authentication endpoints
/api/users/*          - User management
/api/clients/*        - Client operations
/api/rms/*            - RM operations
/api/instruments/*    - Instrument CRUD
/api/requests/*       - Transaction requests
/api/portfolio/*      - Portfolio data
/api/analytics/*      - Analytics data
/api/admin/*          - Admin operations
```

### Response Format

```typescript
// Success
{ success: true, data: {...}, message?: string }

// Error
{ success: false, error: string, details?: any }
```

### Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (business rule violation)
- **500** - Internal Server Error

---

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/fintech"

# Authentication (NextAuth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email (for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASS="your-password"

# Optional: Error tracking
SENTRY_DSN="your-sentry-dsn"

# Optional: Analytics
ANALYTICS_ID="your-analytics-id"
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

1. **Lint & Format:** ESLint, Prettier check
2. **Type Check:** TypeScript compilation
3. **Unit Tests:** Jest with coverage report
4. **Build:** Next.js production build
5. **Integration Tests:** API endpoint tests
6. **E2E Tests:** Playwright critical paths
7. **Security Scan:** npm audit, Snyk
8. **Deploy:** Staging (auto), Production (manual approval)

### Pre-commit Hooks (Husky)

- ESLint check
- Prettier format
- Type check
- Staged files only

---

## Documentation Requirements

### Code Documentation

- **JSDoc comments** for complex functions
- **README.md** for each major module
- **Architecture Decision Records (ADRs)** for key decisions
- **API documentation** using OpenAPI/Swagger

### User Documentation

- User guides per role (Client, RM, Admin)
- Video tutorials for complex workflows
- FAQ and troubleshooting guides
- Privacy policy and Terms of Service

---

## Common Pitfalls to Avoid

### Security

- ❌ Never store sensitive data in localStorage
- ❌ Never expose internal IDs in URLs without authorization
- ❌ Never trust client-side validation alone
- ❌ Never log sensitive data (passwords, tokens, PII)
- ✅ Always validate on server side
- ✅ Always use parameterized queries (Prisma handles this)
- ✅ Always implement rate limiting on sensitive endpoints

### Performance

- ❌ Avoid N+1 queries (use Prisma include/select wisely)
- ❌ Avoid fetching unnecessary data
- ❌ Avoid blocking operations in API routes
- ✅ Use database indexes on foreign keys and frequently queried fields
- ✅ Implement pagination for large datasets
- ✅ Use React Query for caching and optimistic updates

### Code Quality

- ❌ Avoid large components (split into smaller)
- ❌ Avoid inline styles (use Tailwind classes)
- ❌ Avoid magic numbers (use constants)
- ❌ Avoid any type (use proper typing)
- ✅ Use custom hooks for reusable logic
- ✅ Use Zod for runtime validation
- ✅ Write tests alongside code

---

## Task Master Workflow Integration

### Daily Development Loop

1. **Start:** `task-master next` - Get next available task
2. **Review:** `task-master show <id>` - Understand requirements
3. **Work:** Implement the task following standards
4. **Document:** `task-master update-subtask --id=<id> --prompt="progress notes"`
5. **Complete:** `task-master set-status --id=<id> --status=done`
6. **Repeat:** Continue with next task

### Best Practices

- Use `task-master analyze-complexity` before starting complex tasks
- Use `task-master expand --id=<id>` to break down large tasks
- Update subtasks with implementation notes and learnings
- Reference task IDs in git commits: `feat: implement auth (task-3)`

---

## Quick Reference Commands

### Development

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start dev server (localhost:3000)
pnpm build                # Production build
pnpm start                # Start production server
pnpm lint                 # Run ESLint
pnpm format               # Format with Prettier
pnpm type-check           # TypeScript check
```

### Database

```bash
pnpm prisma generate      # Generate Prisma client
pnpm prisma migrate dev   # Create and apply migration
pnpm prisma studio        # Open Prisma Studio GUI
pnpm prisma db seed       # Seed database
```

### Testing

```bash
pnpm test                 # Run Jest tests
pnpm test:watch           # Watch mode
pnpm test:coverage        # With coverage
pnpm test:e2e             # Run Playwright E2E tests
```

### Task Master

```bash
task-master next          # Get next task
task-master show <id>     # View task details
task-master set-status --id=<id> --status=done
task-master expand --id=<id>
task-master analyze-complexity
```

---

## Project Structure

```
/root/fin-mgmt/
├── .claude/              # Claude Code configuration
├── .taskmaster/          # Task Master files
│   ├── docs/prd.txt     # Product Requirements Document
│   ├── tasks/           # Generated task files
│   └── config.json      # Task Master config
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── lib/             # Utilities and helpers
│   ├── types/           # TypeScript types
│   └── styles/          # Global styles
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
├── public/              # Static assets
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
├── docker-compose.yml   # Local development setup
├── Dockerfile           # Production container
└── package.json         # Dependencies and scripts
```

---

## Support & Resources

### Documentation

- **PRD:** `.taskmaster/docs/prd.txt` - Complete product requirements
- **Tasks:** `.taskmaster/tasks/` - All development tasks
- **API Docs:** (To be generated with OpenAPI)

### External Resources

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- shadcn/ui: https://ui.shadcn.com
- TanStack Query: https://tanstack.com/query
- Task Master: https://github.com/cyanheads/task-master-ai

---

## Important Reminders

1. **Always validate input** on both client and server side
2. **Always implement proper error handling** with user-friendly messages
3. **Always write tests** for new features and bug fixes
4. **Always check authorization** before data access or mutations
5. **Always log critical operations** for audit trail
6. **Always use TypeScript strict mode** and avoid `any` type
7. **Always follow the PRD** - refer to `.taskmaster/docs/prd.txt` for requirements
8. **Always update Task Master** with progress and learnings
9. **Always consider mobile experience** - test on smaller screens
10. **Always think security first** - this is a financial platform

---

**Last Updated:** 2025-10-25
**Project Status:** Initial Setup Phase
**Current Focus:** Project initialization and task generation complete
