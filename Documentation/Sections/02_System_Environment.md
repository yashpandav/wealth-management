# 2. System Environment

---

## 2.1 Technology Description

The Wealth Management CRM Platform is built on a modern, full-stack JavaScript/TypeScript ecosystem, leveraging the **Next.js 14 App Router** as its unified framework for both the frontend rendering layer and the backend API layer. This approach eliminates the need for a separate backend server while maintaining clear separation of concerns through the App Router's routing conventions.

### 2.1.1 Frontend Technologies

#### Next.js 14+ (App Router)
The core framework powering both server-side rendering (SSR), static generation (SSG), and client-side interaction. The App Router paradigm enables:
- **React Server Components (RSC):** Data-fetching components that render on the server, reducing client-side JavaScript bundle size
- **Server Actions:** Type-safe server mutations without explicit API route definitions
- **Nested Layouts:** Persistent shell layouts for each role dashboard (client, rm, admin, docadmin)
- **Route Groups:** Clean URL organization without affecting URL structure

#### TypeScript 5+ (Strict Mode)
All source files are written in strict TypeScript, eliminating implicit `any` types, enforcing null checks, and enabling rich IDE tooling. The shared type system ensures API contracts between frontend and backend are validated at compile time.

#### Tailwind CSS 3.4+
Utility-first CSS framework providing:
- Responsive design with mobile-first breakpoints
- Custom design tokens for the financial theme (color palette, typography scale)
- Dark/light mode support via CSS variables
- Zero unused CSS in production (PurgeCSS integration)

#### shadcn/ui Component Library
A curated set of accessible, customizable React components built on Radix UI primitives:
- **Form Controls:** Input, Select, Checkbox, Radio, Switch, Slider
- **Overlays:** Dialog, Sheet, Popover, Tooltip, Dropdown Menu
- **Data Display:** Table, Card, Badge, Avatar, Skeleton
- **Feedback:** Toast (React Hot Toast), Alert, Progress
- All components are keyboard-navigable and screen-reader compatible (WCAG 2.1 AA)

#### TanStack Query (React Query v5)
Client-side data-fetching and server-state synchronization library:
- Automatic background refetching and stale-while-revalidate caching
- Optimistic UI updates for a smooth user experience
- Infinite scroll and paginated query support
- Devtools for query state inspection

#### React Hook Form + Zod
- **React Hook Form:** Performant form state management with minimal re-renders
- **Zod:** Schema-based runtime validation with TypeScript type inference
- Combined: Validated forms with zero boilerplate, type-safe error messages

#### Recharts
SVG-based charting library used for:
- Portfolio performance line charts
- Holdings distribution pie charts
- Transaction volume bar charts
- Analytics trend visualizations

---

### 2.1.2 Backend Technologies

#### Next.js API Routes (App Router `/app/api/`)
60+ RESTful API endpoints organized by role namespace, each implementing:
- Authentication checks via `getServerSession()`
- Role-based authorization guards
- Zod input validation
- Prisma ORM queries
- Structured JSON responses `{ success, data, message }`

#### Prisma ORM 5.20+
Type-safe database access layer with:
- **Schema-first design:** Single `schema.prisma` source of truth (20+ models, 937 lines)
- **Migrations:** Version-controlled database migrations via `prisma migrate`
- **Type generation:** Auto-generated TypeScript client with full model typings
- **Query optimization:** `select` and `include` for precise data fetching, avoiding N+1 issues
- **Soft delete support:** `deletedAt` pattern for non-destructive record removal

#### NextAuth.js v4
JWT-based authentication provider with:
- **Credentials Provider:** Custom email/password authentication with bcrypt verification
- **Session Strategy:** JWT tokens stored in secure, httpOnly cookies
- **Callbacks:** Custom `jwt` and `session` callbacks inject `role`, `userId`, and account status
- **Token expiry:** 30-minute inactivity timeout with automatic session refresh

#### Nodemailer (SMTP Email)
Email delivery service using SMTP configuration:
- 15+ email templates for the complete user journey
- HTML email templates with inline CSS for cross-client compatibility
- Development skip flag (`SKIP_EMAIL=true`) for local development
- Error logging with graceful degradation (non-blocking)

---

### 2.1.3 Database

#### PostgreSQL 15+
Production-grade relational database with:
- **14 tables** across 3 logical domains: User/Auth, Investment, Audit
- **13 enums** for type-safe status and category values
- **Composite indexes** on frequently joined columns (e.g., `clientId + type + status`)
- **UUID primary keys** for all entities (security and horizontal scalability)
- **Decimal precision:** `Decimal(15,2)` for all financial amounts (AED currency)
- **Soft deletes:** `deletedAt` timestamps on User and Transaction tables
- **Archival:** `isArchived` flag with `archivedAt` timestamp for KYC-expired users

---

### 2.1.4 DevOps & Infrastructure

#### Docker + Docker Compose
- Containerized application and database for consistent environments
- `docker-compose.yml` for local development with PostgreSQL service
- `Dockerfile` with multi-stage build for optimized production image
- **Next.js standalone output** for minimal container footprint

#### AWS Elastic Beanstalk
- Production deployment target with auto-scaling capabilities
- Elastic Beanstalk configuration via `.ebextensions/`
- Environment variables managed via EB environment settings
- Health check endpoint at `/api/health`

#### GitHub Actions CI/CD
Automated pipeline steps:
1. Lint & Format (ESLint, Prettier)
2. Type Check (TypeScript strict compilation)
3. Unit Tests (Jest with coverage report)
4. Production Build (Next.js)
5. Integration Tests (API endpoints)
6. E2E Tests (Playwright critical paths)
7. Security Scan (npm audit, Snyk)
8. Deploy to Staging (automatic)
9. Deploy to Production (manual approval gate)

---

## 2.2 Software Requirements

### 2.2.1 Development Environment Requirements

| Software            | Minimum Version | Recommended | Purpose                          |
|---------------------|-----------------|-------------|----------------------------------|
| Node.js             | 18.17.0         | 20.x LTS    | JavaScript runtime               |
| pnpm                | 8.0.0           | 9.x         | Package manager                  |
| PostgreSQL          | 15.0            | 15.x        | Primary database                 |
| Docker              | 20.x            | 24.x        | Containerization                 |
| Docker Compose      | 2.x             | 2.x         | Multi-container orchestration    |
| Git                 | 2.x             | 2.x         | Version control                  |
| VS Code (optional)  | 1.80+           | Latest      | IDE with TypeScript support      |

### 2.2.2 Runtime Dependencies (Key Packages)

| Package                   | Version   | Purpose                              |
|---------------------------|-----------|--------------------------------------|
| `next`                    | 14.x      | Full-stack React framework           |
| `react`                   | 18.x      | UI component library                 |
| `typescript`              | 5.x       | Static type checking                 |
| `@prisma/client`          | 5.20+     | Type-safe database client            |
| `next-auth`               | 4.x       | Authentication (JWT sessions)        |
| `zod`                     | 3.x       | Runtime schema validation            |
| `@tanstack/react-query`   | 5.x       | Server state management & caching    |
| `react-hook-form`         | 7.x       | Form state management                |
| `tailwindcss`             | 3.4+      | Utility-first CSS framework          |
| `@radix-ui/*`             | Latest    | Accessible UI primitives             |
| `bcryptjs`                | 2.x       | Password hashing (12 rounds)         |
| `nodemailer`              | 6.x       | SMTP email delivery                  |
| `recharts`                | 2.x       | SVG data visualization charts        |
| `date-fns`                | 3.x       | Date utility functions               |
| `react-dropzone`          | 14.x      | File upload UI component             |
| `react-hot-toast`         | 2.x       | Toast notification system            |
| `@tanstack/react-table`   | 8.x       | Headless table with sorting/filter   |

### 2.2.3 Development Dependencies

| Package           | Version | Purpose                           |
|-------------------|---------|-----------------------------------|
| `eslint`          | 8.x     | Code linting (strict TypeScript)  |
| `prettier`        | 3.x     | Code formatting                   |
| `husky`           | 9.x     | Git hook management               |
| `lint-staged`     | 15.x    | Run checks on staged files only   |
| `jest`            | 29.x    | Unit and integration testing      |
| `@testing-library/react` | 14.x | React component testing     |
| `playwright`      | 1.x     | End-to-end browser testing        |
| `prisma`          | 5.20+   | Database schema and migration CLI |

### 2.2.4 Required Environment Variables

```bash
# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:password@localhost:5432/fintech"

# ─── Authentication (NextAuth.js) ──────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

# ─── Email (SMTP) ──────────────────────────────────────────────────────────────
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Wealth Management <noreply@example.com>"

# ─── Application ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SKIP_EMAIL="true"                  # Set to false in production

# ─── Optional: Security ────────────────────────────────────────────────────────
CORS_ORIGIN="http://localhost:3000"

# ─── Optional: Error Tracking ──────────────────────────────────────────────────
SENTRY_DSN="your-sentry-dsn"

# ─── Optional: Analytics ───────────────────────────────────────────────────────
ANALYTICS_ID="your-analytics-id"
```

### 2.2.5 Hardware Requirements

#### Development Machine (Minimum)
| Component | Minimum       | Recommended        |
|-----------|---------------|--------------------|
| CPU       | 2 cores       | 4+ cores (Intel i5 / AMD Ryzen 5) |
| RAM       | 8 GB          | 16 GB              |
| Storage   | 20 GB free    | 50 GB SSD          |
| OS        | Windows 10 / macOS 12 / Ubuntu 20.04 | Any modern 64-bit OS |
| Network   | Stable internet (for npm, Prisma) | Broadband |

#### Production Server (Minimum — AWS Elastic Beanstalk)
| Component | Specification                         |
|-----------|---------------------------------------|
| Instance  | t3.small (2 vCPU, 2 GB RAM) minimum   |
| Database  | RDS PostgreSQL db.t3.micro or higher  |
| Storage   | 30 GB EBS gp3                         |
| Load Balancer | Application Load Balancer (ALB) |
| Network   | VPC with private subnets for DB       |

### 2.2.6 Browser Compatibility

| Browser         | Minimum Version | Support Level |
|-----------------|-----------------|---------------|
| Google Chrome   | 100+            | Full          |
| Mozilla Firefox | 100+            | Full          |
| Microsoft Edge  | 100+            | Full          |
| Safari          | 15+             | Full          |
| Opera           | 85+             | Full          |
| Mobile Chrome   | Android 10+     | Full          |
| Mobile Safari   | iOS 15+         | Full          |
| Internet Explorer | Any           | Not Supported |
