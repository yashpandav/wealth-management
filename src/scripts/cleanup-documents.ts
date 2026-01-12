
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting document cleanup...');

    try {
        // Delete documents with deprecated types
        // Using raw SQL to avoid type errors since we updated the schema
        const deprecatedTypes = [
            'ADDRESS_PROOF',
            'INCOME_PROOF',
            'BANK_STATEMENT',
            'TAX_DOCUMENT',
            'KYC_FORM'
        ];

        const formattedTypes = deprecatedTypes.map(t => `'${t}'`).join(', ');

        const result = await prisma.$executeRawUnsafe(
            `DELETE FROM "documents" WHERE "documentType" IN (${formattedTypes})`
        );

        console.log(`Cleanup complete. Deleted ${result} documents.`);
    } catch (error) {
        console.error('Error cleaning up documents:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
