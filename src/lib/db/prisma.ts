/**
 * Prisma Client Instance
 * Singleton pattern for database connection
 */

import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// PrismaClient is attached to the `global` object in development
// to prevent exhausting database connections during hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.app.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool configuration
    datasources: {
      db: {
        url: config.database.url,
      },
    },
    // Performance optimization
    errorFormat: config.app.isDevelopment ? 'pretty' : 'minimal',
  });

if (config.app.isDevelopment) {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
