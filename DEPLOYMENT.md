# Wealth Management Deployment Guide

This repository has been prepared for self-hosted production deployment using **Dokploy** on a single Ubuntu VM.

## Deployment Report (Phase 1 & Changes)

### Application Architecture
- **Framework**: Next.js 14.2 (App Router)
- **Package Manager**: pnpm (v8.15.0)
- **Database**: PostgreSQL 15+ (managed via Docker Compose in this setup)
- **ORM**: Prisma (v7.6.0)
- **Authentication**: NextAuth.js (v4)
- **Build Mode**: Next.js Standalone Mode (optimized for Docker)

### Changes Implemented for Production Readiness
1. **Health Checks**: Implemented `/api/health` endpoint for Docker container and load balancer health checks.
2. **Dockerfile Refinements**: 
   - Added automatic Prisma schema generation and database migrations on container startup (`npx prisma migrate deploy`).
   - Replaced development scripts and optimized the runner stage to use `standalone` output.
3. **Docker Compose**: 
   - Configured `app` and `postgres` services.
   - Set up an isolated `wealth-net` network.
   - Enforced named volume `pgdata` to persist database records.
   - Enforced named volume `uploads` for storing file uploads persistently.
   - Created proper `depends_on` conditions with PostgreSQL health checks.
4. **Environment Variables**: Documented all necessary variables in `.env.example`.
5. **Security**: Checked and retained existing security headers (e.g., `Strict-Transport-Security`, `X-Frame-Options`). Handled dynamic URLs instead of hardcoded `localhost`.

---

## Local Docker Testing

To test the production build locally before deploying:

### 1. Build
```bash
docker-compose build
```

### 2. Run
```bash
# Start the services in detached mode
docker-compose up -d
```

### 3. Stop
```bash
# Stop and remove containers, networks
docker-compose down
```
*(To wipe data, use `docker-compose down -v`)*

---

## Environment Variables

When deploying to Dokploy, configure the following environment variables:

| Variable | Description | Example |
| --- | --- | --- |
| `NODE_ENV` | Application environment. | `production` |
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://postgres:password@postgres:5432/fintech` |
| `POSTGRES_USER` | PostgreSQL user (for the DB container). | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password (for the DB container). | `password` |
| `POSTGRES_DB` | PostgreSQL database name. | `fintech` |
| `NEXTAUTH_URL` | Base URL of the application. | `https://wealth.yashpandav.dev` |
| `NEXTAUTH_SECRET` | Secret used to encrypt session tokens. | `your-random-strong-secret-key-32-chars` |
| `APP_URL` | Application URL (used internally for headers/CORS). | `https://wealth.yashpandav.dev` |
| `NEXT_PUBLIC_APP_URL` | Application URL exposed to browser. | `https://wealth.yashpandav.dev` |
| `SMTP_HOST` | SMTP Host for outgoing emails. | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP Port. | `587` |
| `SMTP_USER` | SMTP Username. | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP Password. | `your-app-password` |
| `SMTP_FROM` | Sender address. | `noreply@yashpandav.dev` |
| `STORAGE_TYPE` | Where to store files (`local` or `s3`). | `local` |

---

## Dokploy Deployment Instructions

The application is configured to run effortlessly on Dokploy.

### Prerequisites
1. Connect your server to Dokploy.
2. Ensure you have the domain `wealth.yashpandav.dev` pointing to your Dokploy server.

### Steps
1. Create a new **Docker Compose** application in Dokploy.
2. Link your GitHub repository.
3. In the **Environment Variables** section, copy the variables from above and fill in your production secrets.
4. Set the **Compose Path** to `docker-compose.yml`.
5. Click **Deploy**.

**Dokploy will automatically:**
1. Provision the PostgreSQL database.
2. Build the Next.js Docker image.
3. Start the containers.
4. Run Prisma database migrations (`npx prisma migrate deploy`) at container startup.
5. Manage Traefik routing to expose the application to your domain.

### Required Volumes
- `pgdata`: Automatically created by Compose to ensure the Postgres database persists across container restarts.
- `uploads`: Automatically created by Compose to ensure local file uploads (KYC docs, receipts) persist across container updates.

---

## Troubleshooting

### 1. 502 Bad Gateway
**Cause**: The Node.js application is still starting or failed to start.
**Fix**: Check the `app` container logs. Ensure database migrations completed successfully and that `NEXTAUTH_SECRET` is set.

### 2. Database Connection Errors
**Cause**: Incorrect `DATABASE_URL` format.
**Fix**: Ensure `DATABASE_URL` matches the internal Docker Compose DNS name (`postgres`), not `localhost`. Example: `postgresql://postgres:password@postgres:5432/fintech`.

### 3. File Uploads Not Persisting
**Cause**: The local upload directory isn't mounted correctly.
**Fix**: Ensure the `uploads` volume in `docker-compose.yml` is active and mapped to `/app/public/uploads`.

### 4. Authentication Failed / Redirects to Localhost
**Cause**: `NEXTAUTH_URL` is incorrectly configured or missing.
**Fix**: Ensure `NEXTAUTH_URL` is set to the exact production domain (e.g., `https://wealth.yashpandav.dev`).
