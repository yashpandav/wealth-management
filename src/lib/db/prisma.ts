/**
 * Prisma Client Instance
 * Singleton pattern for database connection
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config'

// PrismaClient is attached to the `global` object in development
// to prevent exhausting database connections during hot-reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('[Database] Connection successful');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Database] Connection failed:', error);
    return false;
  }
}
