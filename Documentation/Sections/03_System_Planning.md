# 3. System Planning

---

## 3.1 Feasibility Study

A feasibility study was conducted before development commenced to evaluate the viability of building a full-stack Wealth Management CRM platform. The study examined the system from four key dimensions.

---

### 3.1.1 Technical Feasibility

The project leverages a well-established, production-proven technology stack that is actively maintained by large communities.

| Technical Concern              | Assessment                                                                 |
|-------------------------------|----------------------------------------------------------------------------|
| **Framework maturity**        | Next.js 14 is used in large-scale production applications worldwide        |
| **Database reliability**      | PostgreSQL is ACID-compliant, battle-tested for financial applications     |
| **Authentication security**   | NextAuth.js provides JWT-based sessions with proven security practices     |
| **ORM safety**                | Prisma ORM prevents SQL injection and provides type-safe queries           |
| **Email delivery**            | Nodemailer with SMTP is standard for transactional email                   |
| **UI component ecosystem**    | shadcn/ui + Radix UI provides accessible, production-ready components      |
| **Deployment feasibility**    | Docker + AWS Elastic Beanstalk provides scalable deployment                |
| **Developer availability**    | TypeScript + React skills are widely available in the developer market     |

**Conclusion:** The platform is **technically feasible**. All selected technologies are stable, well-documented, and appropriate for an enterprise financial application.

---

### 3.1.2 Operational Feasibility

| Operational Concern              | Assessment                                                               |
|----------------------------------|--------------------------------------------------------------------------|
| **Role clarity**                 | Four clearly defined roles (Client, RM, DocAdmin, Admin) with non-overlapping responsibilities |
| **Workflow simplicity**          | Guided, step-by-step workflows reduce training overhead                  |
| **Manual verification support** | The platform accommodates manual bank statement verification — no dependency on payment gateways |
| **Email-first notifications**    | All stakeholders receive email alerts, reducing missed actions           |
| **Adoption curve**               | Familiar web UI patterns ensure low learning curve for all user types    |
| **Audit compliance**             | Built-in audit trail satisfies typical financial institution requirements |

**Conclusion:** The system is **operationally feasible**. The workflows align with standard financial institution practices, and the platform design reduces operational errors through validation and role-based restrictions.

---

### 3.1.3 Economic Feasibility

| Cost Category              | Approach                                                                  |
|---------------------------|---------------------------------------------------------------------------|
| **Development stack**     | Open-source technologies (Next.js, PostgreSQL, Prisma) — zero licensing costs |
| **Infrastructure**        | AWS Elastic Beanstalk with pay-as-you-go pricing (~$30–$100/month for a small-scale deployment) |
| **Email delivery**        | SMTP-based using existing email provider; optional upgrade to SendGrid/AWS SES for scale |
| **Monitoring**            | OpenTelemetry + Prometheus/Grafana (open-source); Sentry has a free tier |
| **Return on Investment**  | Centralizing client management, reducing manual errors, and automating notifications directly reduces operational overhead costs |

**Conclusion:** The platform is **economically feasible**. Open-source tooling and cloud-based infrastructure provide cost-effective delivery with a clear path to scale.

---

### 3.1.4 Schedule Feasibility

| Phase                             | Scope                                                     | Estimated Effort |
|----------------------------------|-----------------------------------------------------------|-----------------|
| **Phase 1 — Core Foundation**    | Auth, RBAC, User management, database schema              | 80–100 hours    |
| **Phase 2 — Client & RM Flows**  | Portfolio, purchase requests, RM dashboard (6 views)      | 100–120 hours   |
| **Phase 3 — DocAdmin & KYC**     | DocAdmin portal (6 tabs), KYC verification, RM assignment | 120–140 hours   |
| **Phase 4 — Investment Plans**   | Admin instrument management, investment options           | 60–80 hours     |
| **Phase 5 — Payout System**      | Payout schedules, DocAdmin receipt upload, cron jobs      | 40–60 hours     |
| **Phase 6 — Email & Notifications** | 15+ email templates, in-app notification system       | 50–70 hours     |
| **Phase 7 — Analytics & Audit**  | Dashboards, audit logs, RM performance, export            | 40–60 hours     |
| **Phase 8 — Testing & Deployment** | Unit, integration, E2E tests, Docker, CI/CD             | 60–80 hours     |
| **Total Estimated Effort**       |                                                           | **550–710 hours** |

**Conclusion:** The project is **schedule-feasible** when broken into parallel workstreams, with realistic milestones for each phase.

---

## 3.2 Software Engineering Model

The Wealth Management CRM Platform was developed using an **Incremental Development Model** with elements of **Agile Scrum** practices, which was determined to be the most appropriate approach given:

1. **Evolving Requirements:** The scope expanded significantly from the original PoC — moving from 3 roles to 4, adding KYC timed rules, payout management, and a full contract system.
2. **Parallel Workstreams:** Frontend, backend API, and database work could proceed concurrently.
3. **Early Validation:** Each increment delivered working software that could be reviewed and validated by stakeholders.
4. **Risk Mitigation:** High-risk features (payout scheduling, two-tier approvals) were tackled in focused sprints with early prototyping.

---

### 3.2.1 Development Model — Incremental Delivery

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     INCREMENTAL DEVELOPMENT MODEL                        │
├───────────┬──────────────────────────────────────────────────────────────┤
│ Increment │ Deliverables                                                  │
├───────────┼──────────────────────────────────────────────────────────────┤
│     1     │ Database schema, Auth (register/login/JWT), RBAC guards       │
│     2     │ Client portal (portfolio, purchase request, document upload)  │
│     3     │ RM dashboard (6 views: leads, registered, KYC, active, etc.)  │
│     4     │ DocAdmin portal (6 tabs: enquiries, KYC, contracts, payouts)  │
│     5     │ Admin panel (instruments, users, withdrawal approvals)        │
│     6     │ Payout engine (schedule generation, cron jobs, receipts)      │
│     7     │ Email system (15+ templates, SMTP integration)                │
│     8     │ Analytics, audit logs, testing, deployment pipeline           │
└───────────┴──────────────────────────────────────────────────────────────┘
```

---

### 3.2.2 Development Lifecycle Phases

#### Phase 1: Requirements & Design
- Stakeholder analysis and role definition
- Product Requirements Document (PRD) creation
- Database schema design (ER diagram, Prisma schema)
- API contract specification (REST endpoint design)
- UI wireframe and component hierarchy planning

#### Phase 2: Core Development (Increments 1–5)
- Database setup and Prisma migrations
- Authentication and RBAC implementation
- Feature development by role: Client → RM → DocAdmin → Admin
- API route implementation with validation
- Frontend page and component development

#### Phase 3: Integration & Automation (Increments 6–7)
- Payout scheduling engine (cron jobs, schedule generation)
- Email service integration and template creation
- In-app notification system
- KYC timed rules implementation

#### Phase 4: Quality Assurance
- Unit testing (Jest — business logic, utility functions)
- Integration testing (API endpoints, database operations)
- End-to-end testing (Playwright — critical user flows)
- Security review (RBAC verification, input sanitization audit)
- Performance profiling (Lighthouse scores, API response times)

#### Phase 5: Deployment & CI/CD
- Docker containerization
- GitHub Actions CI/CD pipeline configuration
- AWS Elastic Beanstalk deployment setup
- Environment variable management
- Production monitoring (health checks, error tracking)

---

### 3.2.3 Git Branching Strategy

```
main / master          — Production-ready code
  └── feature/*        — New feature development
  └── fix/*            — Bug fixes
  └── hotfix/*         — Critical production patches
  └── release/*        — Release preparation and QA
```

**Commit Convention (Conventional Commits):**
```
feat: add client portfolio view
fix: resolve RM assignment validation
chore: update dependencies
docs: update API documentation
test: add purchase workflow tests
refactor: simplify payout schedule generation
```

---

### 3.2.4 Code Quality Gates (Pre-commit Hooks via Husky)

Every commit triggers the following checks on staged files via `lint-staged`:
1. **ESLint** — Zero warnings in strict TypeScript mode
2. **Prettier** — Enforce consistent code formatting
3. **TypeScript Compiler** — Fail on any type errors

These gates prevent broken or poorly formatted code from entering the repository, maintaining a consistently high codebase standard throughout development.

---

### 3.2.5 Testing Strategy

| Test Type         | Tool              | Coverage Target      | Scope                                   |
|-------------------|-------------------|---------------------|-----------------------------------------|
| Unit Tests        | Jest              | > 80% overall       | Business logic, utility functions, Zod schemas |
| Integration Tests | Jest + Supertest  | > 80% API routes    | API endpoints, Prisma database queries  |
| E2E Tests         | Playwright        | > 90% critical paths | Authentication, purchase flow, KYC workflow, payout processing |
| Type Checking     | TypeScript (tsc)  | 100%                | All TypeScript source files             |
| Linting           | ESLint            | 100%                | All JavaScript/TypeScript source files  |
