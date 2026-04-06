import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const query = 'test';
  
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { description: { contains: query, mode: 'insensitive' } },
        { entityId: { contains: query, mode: 'insensitive' } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
        { user: { firstName: { contains: query, mode: 'insensitive' } } },
        { user: { lastName: { contains: query, mode: 'insensitive' } } },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
    take: 1
  });
  console.log('Logs query success, found:', logs.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
