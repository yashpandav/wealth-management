/**
 * Application Configuration
 * Centralized configuration with environment variable validation
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Email (optional in development)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('Wealth Management CRM'),
  APP_URL: z.string().url().optional(),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).optional(),
  MAX_LOGIN_ATTEMPTS: z.string().transform(Number).pipe(z.number().positive()).optional(),
  LOCKOUT_DURATION: z.string().transform(Number).pipe(z.number().positive()).optional(),

  // Features
  ENABLE_MFA: z.string().transform((val) => val === 'true').optional(),
  ENABLE_EMAIL_VERIFICATION: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  ENABLE_AUDIT_LOG: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  MAINTENANCE_MODE: z
    .string()
    .transform((val) => val === 'true')
    .optional(),

  // Development
  DEBUG_MODE: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  SKIP_EMAIL: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

// Validate environment variables (only on server-side)
function validateEnv() {
  // Only validate on server-side (Node.js environment)
  if (typeof window !== 'undefined') {
    // Return empty object for browser - config won't be used client-side
    return {} as z.infer<typeof envSchema>;
  }

  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Invalid environment variables:\n${missingVars.join('\n')}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Export configuration object
export const config = {
  database: {
    url: env.DATABASE_URL,
  },
  auth: {
    url: env.NEXTAUTH_URL,
    secret: env.NEXTAUTH_SECRET,
    sessionMaxAge: 30 * 60, // 30 minutes inactivity timeout
    sessionUpdateAge: 5 * 60, // 5 minutes - refresh session if active
  },
  email: {
    host: env.SMTP_HOST || 'localhost',
    port: parseInt(env.SMTP_PORT || '587'),
    user: env.SMTP_USER || '',
    password: env.SMTP_PASSWORD || '',
    from: env.SMTP_FROM || 'noreply@example.com',
    skip: env.SKIP_EMAIL || false,
  },
  app: {
    name: env.APP_NAME,
    url: env.APP_URL || env.NEXTAUTH_URL,
    env: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS || 12,
    maxLoginAttempts: env.MAX_LOGIN_ATTEMPTS || 5,
    lockoutDuration: env.LOCKOUT_DURATION || 30,
  },
  features: {
    mfa: env.ENABLE_MFA || false,
    emailVerification: env.ENABLE_EMAIL_VERIFICATION || true,
    auditLog: env.ENABLE_AUDIT_LOG || true,
    maintenanceMode: env.MAINTENANCE_MODE || false,
  },
  development: {
    debugMode: env.DEBUG_MODE || false,
  },
} as const;

// Type export for TypeScript
export type Config = typeof config;
