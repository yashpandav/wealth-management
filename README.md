# Wealth Management CRM

Enterprise-grade Wealth Management CRM platform designed for financial institutions.

## Features

- **Client Portal**: Browse instruments, submit requests, view portfolio
- **Relationship Manager Dashboard**: Manage clients, process transactions
- **Admin Panel**: System configuration, analytics, approvals
- **Two-tier Approval**: Secure withdrawal workflow
- **Manual Processing**: Bank statement verification
- **Audit Trail**: Comprehensive logging and compliance

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5+ (strict mode)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query

## Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- PostgreSQL 15 or higher
- pnpm 8.0.0 or higher

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd fin-mgmt
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:

- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `SMTP_*`: Email configuration (optional for development)

4. **Set up the database**

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Seed with test data
pnpm db:seed
```

5. **Start development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors
pnpm format       # Format code with Prettier
pnpm type-check   # Check TypeScript types
pnpm test         # Run tests
```

### Database Commands

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes (development)
pnpm db:studio    # Open Prisma Studio GUI
pnpm db:seed      # Seed database
```

### Code Quality

The project uses:

- **ESLint**: Strict TypeScript rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks
- **lint-staged**: Run checks on staged files

All commits must pass linting and formatting checks.

### Folder Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   ├── dashboard/      # Dashboard widgets
│   ├── auth/           # Auth components
│   ├── client/         # Client-specific
│   ├── rm/             # RM-specific
│   └── admin/          # Admin-specific
├── lib/                # Core utilities
│   ├── auth/           # Authentication
│   ├── db/             # Database utilities
│   ├── email/          # Email utilities
│   ├── utils/          # Helper functions
│   └── validation/     # Zod schemas
├── types/              # TypeScript types
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## User Roles

### Client

- Browse investment instruments
- Submit purchase/withdrawal requests
- View portfolio and analytics
- Track request status

### Relationship Manager (RM)

- Manage assigned clients
- Process purchase requests
- Review withdrawal requests
- Generate reports

### Administrator

- Create/edit instruments
- Assign clients to RMs
- Approve withdrawal requests (final)
- View system analytics
- Access audit logs

## Security

- **Password Hashing**: bcrypt (12 rounds)
- **Session Management**: Secure cookies (httpOnly, secure, sameSite)
- **Account Lockout**: 5 failed attempts
- **Session Timeout**: 30 minutes inactivity
- **Input Validation**: Zod schemas (client & server)
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: Secret for token encryption

### Optional Variables

- Email configuration (`SMTP_*`)
- Security settings
- Feature flags
- Rate limiting
- File upload settings

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure tests pass
4. Ensure linting passes
5. Submit a pull request

## Deployment Journey: From AWS to GCP VPS

### The Motivation
Initially, this project was deployed and hosted using **AWS Elastic Beanstalk** (with files stored in Amazon S3). However, when AWS credits expired, maintaining the managed infrastructure became cost-prohibitive. Furthermore, there was a growing need for a centralized, self-managed Virtual Private Server (VPS) that could host multiple independent projects simultaneously without racking up individual service costs.

### The Migration Strategy
To solve this, the infrastructure was migrated to a **Google Cloud Platform (GCP) VPS** utilizing **Dokploy**—a free, open-source Platform as a Service (PaaS) that simplifies Docker-based deployments.

### Key Deployment Steps
1. **Infrastructure Provisioning**: 
   - Spun up a VM on Google Cloud Platform.
   - Assigned a **Static External IP** to ensure the server address remains permanent even after VM reboots.
   - Configured GCP Firewalls to explicitly allow inbound HTTP (Port 80) and HTTPS (Port 443) traffic.

2. **Dokploy & Containerization**:
   - Installed Dokploy to manage applications, databases, and SSL certificates automatically.
   - Containerized the Next.js application by writing a custom `Dockerfile` and `docker-compose.yml`.
   - Migrated away from AWS S3 by mounting a local Docker volume (`uploads:/app/public/uploads`) for persistent, free file storage.

3. **DNS Routing & Security (Cloudflare)**:
   - Mapped the custom domain (`wealthmanagementcrm.yashpandav.dev`) in **Cloudflare**.
   - Updated the `A` record to point directly to the GCP Static IP.
   - Set Cloudflare Proxy status to **DNS Only (Grey Cloud)** to allow Dokploy's built-in Traefik router to successfully negotiate and manage SSL certificates via Let's Encrypt.

This new architecture provides full root-level control over the infrastructure, eliminates recurring PaaS costs, and allows for infinite scalability when hosting additional personal projects on the exact same machine.

## License

Proprietary - All rights reserved

## Support

For support, contact your development team or refer to the internal documentation.
