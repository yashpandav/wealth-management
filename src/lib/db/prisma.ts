import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create pg pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // ✅ REQUIRED
  });

if (process.env.NODE_ENV !== 'production') {
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
    console.log('[Database] Connection successful');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Database] Connection failed:', error);
    return false;
  }
}
