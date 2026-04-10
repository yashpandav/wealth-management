# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

# Pin exact pnpm version matching packageManager field in package.json
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# HUSKY=0 prevents husky from installing git hooks (no .git in Docker)
# DATABASE_URL dummy needed for prisma generate in postinstall (Prisma 7 requirement)
RUN HUSKY=0 DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm install --frozen-lockfile


# ── Stage 2: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# DATABASE_URL is required by Prisma 7 even for generate (schema validation only, no real connection)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate

# Dummy env vars required by Zod config validation during next build (replaced by real values at runtime)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    NEXTAUTH_URL="http://localhost:3000" \
    NEXTAUTH_SECRET="dummy-secret-for-build-time-only-minimum-32-chars" \
    pnpm build


# ── Stage 3: Production runner (minimal image) ─────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# next.config.mjs `output: standalone` copies only what's needed
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
