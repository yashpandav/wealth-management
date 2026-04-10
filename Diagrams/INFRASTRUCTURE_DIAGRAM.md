```
title Wealth Management CRM Infrastructure

direction down

// User Tier
Users [icon: users] {
  Public Visitor [icon: user]
  Client [icon: user-check]
  Relationship Manager [icon: briefcase]
  Administrator [icon: shield]
  DocAdmin [icon: file-text]
}

// DNS
Route 53 [icon: aws-route-53, label: "AWS Route 53"]

// AWS Cloud
AWS Cloud [icon: aws] {

  ALB [icon: aws-elb, label: "Application Load Balancer\nHTTPS :443 → HTTP :8080\nHealth: /api/health"]

  // Elastic Beanstalk
  Elastic Beanstalk [icon: aws-elastic-beanstalk, label: "AWS Elastic Beanstalk — Node.js 20 LTS"] {

    Auto Scaling Group [icon: aws-ec2-auto-scaling] {
      EC2 Instance A [icon: aws-ec2, label: "EC2 t3.small\nInstance A"]
      EC2 Instance B [icon: aws-ec2, label: "EC2 t3.small\nInstance B (scale-out)"]
    }

    Next.js App [icon: next-js, label: "Next.js 14 — Standalone Output"] {

      Frontend [icon: react, label: "Frontend — React (SSR · RSC · CSR)"] {
        Pages [icon: layout, label: "App Router Pages\n/ · /instruments · /user-form\n/client/* · /rm/*\n/admin/* · /docadmin/*"]
        UI Layer [icon: layers, label: "shadcn/ui + Tailwind CSS\nTanStack Query + Table\nReact Hook Form + Zod\nRecharts · React Dropzone"]
      }

      API Routes [icon: server, label: "Backend — Next.js API Routes"] {
        Auth API [icon: lock, label: "Auth Routes\n/api/auth/[...nextauth]\nregister · verify-email\nforgot/reset-password"]
        Client API [icon: user-check, label: "Client Routes\n/api/client/*\nportfolio · products\npurchase · payouts"]
        RM API [icon: briefcase, label: "RM Routes\n/api/rm/*\nclients · requests\nuploads · dashboard"]
        Admin API [icon: shield, label: "Admin Routes\n/api/admin/*\nusers · analytics\ninstruments · audit-logs"]
        DocAdmin API [icon: file-text, label: "DocAdmin Routes\n/api/docadmin/*\ndocuments · kyc\nassign-rm · payouts"]
        Documents API [icon: folder, label: "Document Routes\n/api/documents/*\nupload · download · verify"]
        Cron API [icon: clock, label: "Cron Routes\n/api/cron/*\npayout-generation\nreminder-15th · month-end"]
      }

      Core Services [icon: package, label: "Core Services — src/lib/"] {
        NextAuth [icon: lock, label: "NextAuth.js v4\nJWT Sessions\nbcrypt 12 rounds\nRBAC role guards"]
        Prisma Client [icon: database, label: "Prisma Client 5.20+\nType-safe ORM\nZod validation layer"]
        S3 Service [icon: aws-s3, label: "S3 Service\n@aws-sdk/client-s3\nupload · download · delete"]
        Email Service [icon: mail, label: "Email Service\nNodemailer · SMTP\n15+ HTML templates"]
      }

    }

    EB Config [icon: settings, label: ".ebextensions/\n01_nodeport.config\n02_swap.config"]

  }

  // S3
  S3 Bucket [icon: aws-s3, label: "Amazon S3\nKYC Documents · Bank Statements\nContracts · Profile Photos"]

  // IAM
  IAM Role [icon: aws-iam, label: "IAM — LabInstanceProfile\nCredentials via Instance\nMetadata Service (no static keys)"]

}

// Neon + PostgreSQL
Neon [icon: database, label: "Neon — Serverless PostgreSQL"] {

  Connection Pooler [icon: aws-rds-proxy, label: "Neon Connection Pooler\nPgBouncer · pool_mode=transaction\nconnection_limit=10 · pool_timeout=20"]

  PostgreSQL [icon: database, label: "PostgreSQL 15+\n20+ Models · 937-line Schema\n13 Enums · UUID PKs · Decimal(15,2)"] {
    User Tables [icon: users, label: "User · Client · RelationshipManager\nAdmin · DocAdmin"]
    Investment Tables [icon: trending-up, label: "Portfolio · Holding · Instrument\nProduct · ProductOption"]
    Transaction Tables [icon: credit-card, label: "PurchaseRequest · WithdrawalRequest\nTransaction · ProductRequest"]
    KYC Tables [icon: file-text, label: "Document · Payout\nInterestPayoutSchedule"]
    Audit Tables [icon: list, label: "AuditLog · Notification · UserLead\nPasswordResetToken · EmailVerification"]
  }

}

// Prisma Schema
Prisma Schema [icon: file-code, label: "prisma/schema.prisma\nprisma generate\nprisma migrate deploy"]

// SMTP
SMTP Server [icon: mail, label: "SMTP Server\nPort 587 · TLS\nVerification · KYC Alerts\nTransaction Notifications"]

// Connections

// Users → Route 53 → ALB → EB
Users > Route 53: HTTPS
Route 53 > ALB: DNS resolve
ALB > Auto Scaling Group: HTTP :8080

// EB internals
Auto Scaling Group > Next.js App
Next.js App -- EB Config

// Frontend ↔ API
Frontend <> API Routes: fetch() · React Query

// API → Services
API Routes > Core Services

// Services → Neon
Prisma Client > Connection Pooler: DATABASE_URL · connection pool
Connection Pooler > PostgreSQL
Prisma Schema --> Prisma Client: generates types

// Services → S3
S3 Service > S3 Bucket: PutObject · GetObject · DeleteObject
Auto Scaling Group > IAM Role: instance role
IAM Role > S3 Bucket: grants access

// Services → SMTP
Email Service > SMTP Server: SMTP · Port 587
```
