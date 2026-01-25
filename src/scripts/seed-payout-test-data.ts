/**
 * Seed Payout Test Data
 * Creates comprehensive test contracts for payout schedule testing
 *
 * Usage: npx tsx src/scripts/seed-payout-test-data.ts
 */

import { PrismaClient, ProductPurchaseRequest } from '@prisma/client';
import { generatePayoutSchedules, createPendingPayouts } from '@/lib/services/payout.service';
import { subMonths } from 'date-fns';

const prisma = new PrismaClient();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

async function main() {
  try {
    section('🌱 PAYOUT TEST DATA SEEDING');

    // Get test clients and RM
    const clients = await prisma.client.findMany({
      include: { user: true },
      take: 3,
    });

    if (clients.length === 0) {
      log('❌ No clients found. Please run `pnpm prisma db seed` first.', colors.red);
      process.exit(1);
    }

    const client1 = clients[0];
    const client2 = clients[1] || clients[0];
    const client3 = clients[2] || clients[0];

    // Get the specific test.verified@example.com user
    const testVerifiedUser = await prisma.client.findFirst({
      where: { user: { email: 'test.verified@example.com' } },
      include: { user: true },
    });

    if (!testVerifiedUser) {
      log('⚠️  test.verified@example.com user not found in database.', colors.yellow);
      log('   Creating contracts for available clients only.', colors.yellow);
    }

    log(`Found ${clients.length} test clients:`, colors.cyan);
    clients.forEach((c, i) => {
      log(`  ${i + 1}. ${c.user.firstName} ${c.user.lastName} (${c.user.email})`, colors.cyan);
    });
    if (testVerifiedUser) {
      log(`  ⭐ ${testVerifiedUser.user.firstName} ${testVerifiedUser.user.lastName} (${testVerifiedUser.user.email})`, colors.bright + colors.cyan);
    }

    // Get investment options
    const monthlyOption1Year = await prisma.investmentOption.findFirst({
      where: { withdrawalFrequency: 'Monthly', duration: '1 Year' },
      include: { investment: true },
    });

    const monthlyOption2Year = await prisma.investmentOption.findFirst({
      where: { withdrawalFrequency: 'Monthly', duration: '2 Years' },
      include: { investment: true },
    });

    const quarterlyOption2Year = await prisma.investmentOption.findFirst({
      where: { withdrawalFrequency: 'Quarterly', duration: '2 Years' },
      include: { investment: true },
    });

    if (!monthlyOption1Year || !quarterlyOption2Year) {
      log('❌ Required investment options not found. Please run seed first.', colors.red);
      process.exit(1);
    }

    log('\n✅ Found required investment options', colors.green);

    // Clean up old test contracts
    section('🧹 Cleaning Up Old Test Data');

    const oldContracts = await prisma.productPurchaseRequest.findMany({
      where: { trackingNumber: { startsWith: 'PAYOUT-TEST-' } },
      select: { id: true },
    });

    if (oldContracts.length > 0) {
      await prisma.payout.deleteMany({
        where: { productPurchaseRequestId: { in: oldContracts.map(c => c.id) } },
      });
      await prisma.payoutSchedule.deleteMany({
        where: { productPurchaseRequestId: { in: oldContracts.map(c => c.id) } },
      });
      await prisma.productPurchaseRequest.deleteMany({
        where: { trackingNumber: { startsWith: 'PAYOUT-TEST-' } },
      });
      log(`✅ Cleaned up ${oldContracts.length} old test contracts`, colors.green);
    }

    // Create test contracts with various scenarios
    section('📝 Creating Test Contracts');

    const now = new Date();
    const contracts: ProductPurchaseRequest[] = [];

    // ========================================
    // SCENARIO 1: Monthly 1-15 (Started 3 months ago)
    // ========================================
    log('\n1️⃣  Creating Monthly 1-15 contract (3 months old)...', colors.yellow);

    const contractStart1 = subMonths(now, 3);
    contractStart1.setDate(1);

    const contract1 = await prisma.productPurchaseRequest.create({
      data: {
        trackingNumber: `PAYOUT-TEST-MONTHLY-1-15-${Date.now()}`,
        clientId: client1.id,
        investmentId: monthlyOption1Year!.investmentId,
        investmentOptionId: monthlyOption1Year!.id,
        amount: 100000,
        status: 'COMPLETED',
        payoutWindow: '1-15',
        contractStartDate: contractStart1,
        completedAt: contractStart1,
        createdAt: new Date(contractStart1.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    log(`   ✅ Created: ${contract1.trackingNumber}`, colors.green);
    log(`      Amount: AED 100,000`, colors.cyan);
    log(`      Frequency: Monthly (1 Year = 12 payouts)`, colors.cyan);
    log(`      Window: 1-15 (Payout on 15th)`, colors.cyan);
    log(`      Start Date: ${contractStart1.toISOString().split('T')[0]}`, colors.cyan);
    log(`      Expected Interest: AED 3,000/month`, colors.cyan);

    await generatePayoutSchedules(contract1.id);
    contracts.push(contract1);

    // ========================================
    // SCENARIO 2: Monthly 16-30 (Started 2 months ago)
    // ========================================
    log('\n2️⃣  Creating Monthly 16-30 contract (2 months old)...', colors.yellow);

    const contractStart2 = subMonths(now, 2);
    contractStart2.setDate(1);

    const contract2 = await prisma.productPurchaseRequest.create({
      data: {
        trackingNumber: `PAYOUT-TEST-MONTHLY-16-30-${Date.now()}`,
        clientId: client2.id,
        investmentId: monthlyOption1Year!.investmentId,
        investmentOptionId: monthlyOption1Year!.id,
        amount: 150000,
        status: 'COMPLETED',
        payoutWindow: '16-30',
        contractStartDate: contractStart2,
        completedAt: contractStart2,
        createdAt: new Date(contractStart2.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    });

    log(`   ✅ Created: ${contract2.trackingNumber}`, colors.green);
    log(`      Amount: AED 150,000`, colors.cyan);
    log(`      Frequency: Monthly (1 Year = 12 payouts)`, colors.cyan);
    log(`      Window: 16-30 (Payout on month-end)`, colors.cyan);
    log(`      Start Date: ${contractStart2.toISOString().split('T')[0]}`, colors.cyan);
    log(`      Expected Interest: AED 4,500/month`, colors.cyan);

    await generatePayoutSchedules(contract2.id);
    contracts.push(contract2);

    // ========================================
    // SCENARIO 3: Quarterly 1-15 (Started 6 months ago)
    // ========================================
    log('\n3️⃣  Creating Quarterly 1-15 contract (6 months old)...', colors.yellow);

    const contractStart3 = subMonths(now, 6);
    contractStart3.setDate(1);

    const contract3 = await prisma.productPurchaseRequest.create({
      data: {
        trackingNumber: `PAYOUT-TEST-QUARTERLY-1-15-${Date.now()}`,
        clientId: client3.id,
        investmentId: quarterlyOption2Year.investmentId,
        investmentOptionId: quarterlyOption2Year.id,
        amount: 250000,
        status: 'COMPLETED',
        payoutWindow: '1-15',
        contractStartDate: contractStart3,
        completedAt: contractStart3,
        createdAt: new Date(contractStart3.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
    });

    log(`   ✅ Created: ${contract3.trackingNumber}`, colors.green);
    log(`      Amount: AED 250,000`, colors.cyan);
    log(`      Frequency: Quarterly (2 Years = 8 payouts)`, colors.cyan);
    log(`      Window: 1-15 (Payout on 15th every 3 months)`, colors.cyan);
    log(`      Start Date: ${contractStart3.toISOString().split('T')[0]}`, colors.cyan);
    log(`      Expected Interest: AED 25,000/quarter`, colors.cyan);

    await generatePayoutSchedules(contract3.id);
    contracts.push(contract3);

    // ========================================
    // SCENARIO 4: Quarterly 16-30 (Started 4 months ago)
    // ========================================
    log('\n4️⃣  Creating Quarterly 16-30 contract (4 months old)...', colors.yellow);

    const contractStart4 = subMonths(now, 4);
    contractStart4.setDate(1);

    const contract4 = await prisma.productPurchaseRequest.create({
      data: {
        trackingNumber: `PAYOUT-TEST-QUARTERLY-16-30-${Date.now()}`,
        clientId: client1.id,
        investmentId: quarterlyOption2Year.investmentId,
        investmentOptionId: quarterlyOption2Year.id,
        amount: 300000,
        status: 'COMPLETED',
        payoutWindow: '16-30',
        contractStartDate: contractStart4,
        completedAt: contractStart4,
        createdAt: new Date(contractStart4.getTime() - 12 * 24 * 60 * 60 * 1000),
      },
    });

    log(`   ✅ Created: ${contract4.trackingNumber}`, colors.green);
    log(`      Amount: AED 300,000`, colors.cyan);
    log(`      Frequency: Quarterly (2 Years = 8 payouts)`, colors.cyan);
    log(`      Window: 16-30 (Payout on month-end every 3 months)`, colors.cyan);
    log(`      Start Date: ${contractStart4.toISOString().split('T')[0]}`, colors.cyan);
    log(`      Expected Interest: AED 30,000/quarter`, colors.cyan);

    await generatePayoutSchedules(contract4.id);
    contracts.push(contract4);

    // ========================================
    // SCENARIO 5: Recent Monthly (Started last month) - For testing upcoming payouts
    // ========================================
    log('\n5️⃣  Creating Recent Monthly contract (1 month old)...', colors.yellow);

    const contractStart5 = subMonths(now, 1);
    contractStart5.setDate(5); // Started on 5th of last month

    const contract5 = await prisma.productPurchaseRequest.create({
      data: {
        trackingNumber: `PAYOUT-TEST-MONTHLY-RECENT-${Date.now()}`,
        clientId: client2.id,
        investmentId: monthlyOption2Year!.investmentId,
        investmentOptionId: monthlyOption2Year!.id,
        amount: 200000,
        status: 'COMPLETED',
        payoutWindow: '1-15',
        contractStartDate: contractStart5,
        completedAt: contractStart5,
        createdAt: new Date(contractStart5.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    log(`   ✅ Created: ${contract5.trackingNumber}`, colors.green);
    log(`      Amount: AED 200,000`, colors.cyan);
    log(`      Frequency: Monthly (2 Years = 24 payouts)`, colors.cyan);
    log(`      Window: 1-15 (Payout on 15th)`, colors.cyan);
    log(`      Start Date: ${contractStart5.toISOString().split('T')[0]}`, colors.cyan);
    log(`      Expected Interest: AED 7,000/month`, colors.cyan);

    await generatePayoutSchedules(contract5.id);
    contracts.push(contract5);

    // ========================================
    // SCENARIO 6: Contract for test.verified@example.com (if available)
    // ========================================
    if (testVerifiedUser) {
      log('\n6️⃣  Creating Monthly contract for test.verified@example.com...', colors.yellow);

      const contractStart6 = subMonths(now, 2);
      contractStart6.setDate(10); // Started on 10th, 2 months ago

      const contract6 = await prisma.productPurchaseRequest.create({
        data: {
          trackingNumber: `PAYOUT-TEST-VERIFIED-USER-${Date.now()}`,
          clientId: testVerifiedUser.id,
          investmentId: monthlyOption1Year!.investmentId,
          investmentOptionId: monthlyOption1Year!.id,
          amount: 175000,
          status: 'COMPLETED',
          payoutWindow: '1-15',
          contractStartDate: contractStart6,
          completedAt: contractStart6,
          createdAt: new Date(contractStart6.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
      });

      log(`   ✅ Created: ${contract6.trackingNumber}`, colors.green);
      log(`      Client: ${testVerifiedUser.user.email}`, colors.bright + colors.cyan);
      log(`      Amount: AED 175,000`, colors.cyan);
      log(`      Frequency: Monthly (1 Year = 12 payouts)`, colors.cyan);
      log(`      Window: 1-15 (Payout on 15th)`, colors.cyan);
      log(`      Start Date: ${contractStart6.toISOString().split('T')[0]}`, colors.cyan);
      log(`      Expected Interest: AED 5,250/month`, colors.cyan);

      await generatePayoutSchedules(contract6.id);
      contracts.push(contract6);
    }

    // ========================================
    // Summary
    // ========================================
    section('📊 Summary');

    const totalSchedules = await prisma.payoutSchedule.count({
      where: {
        productPurchaseRequest: {
          trackingNumber: { startsWith: 'PAYOUT-TEST-' },
        },
      },
    });

    log(`✅ Created ${contracts.length} test contracts`, colors.green);
    log(`✅ Generated ${totalSchedules} payout schedules`, colors.green);

    // Show breakdown
    log('\nBreakdown:', colors.cyan);
    for (const contract of contracts) {
      const scheduleCount = await prisma.payoutSchedule.count({
        where: { productPurchaseRequestId: contract.id },
      });
      log(`  - ${contract.trackingNumber}: ${scheduleCount} schedules`, colors.cyan);
    }

    // ========================================
    // Create Pending Payouts from Past Due Schedules
    // ========================================
    section('💰 Creating Pending Payouts');

    log('Running daily payout generation (30-day lookahead)...', colors.yellow);
    const createdCount = await createPendingPayouts(30);
    log(`✅ Created ${createdCount} pending payouts from past-due schedules`, colors.green);

    // Show payout status
    const payoutSummary = await prisma.payout.groupBy({
      by: ['status'],
      where: {
        productPurchaseRequest: {
          trackingNumber: { startsWith: 'PAYOUT-TEST-' },
        },
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    log('\nPayout Status:', colors.cyan);
    payoutSummary.forEach((s) => {
      log(`  - ${s.status}: ${s._count.id} payouts (Total: AED ${Number(s._sum.amount || 0).toLocaleString()})`, colors.cyan);
    });

    // Show upcoming schedules
    const upcomingSchedules = await prisma.payoutSchedule.findMany({
      where: {
        productPurchaseRequest: {
          trackingNumber: { startsWith: 'PAYOUT-TEST-' },
        },
        isProcessed: false,
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
      include: {
        productPurchaseRequest: {
          include: {
            client: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (upcomingSchedules.length > 0) {
      log('\n📅 Next 5 Upcoming Payout Schedules:', colors.cyan);
      upcomingSchedules.forEach((s, i) => {
        log(`  ${i + 1}. ${s.scheduledDate.toISOString().split('T')[0]} | AED ${s.interestAmount} | ${s.productPurchaseRequest.client.user.firstName} ${s.productPurchaseRequest.client.user.lastName}`, colors.cyan);
      });
    }

    // ========================================
    // Testing Instructions
    // ========================================
    section('🧪 Testing Instructions');

    log('Test data has been seeded successfully! Here\'s what you can do:\n', colors.bright + colors.green);

    log('1. Test DocAdmin Payout Dashboard:', colors.yellow);
    log('   - Go to: http://localhost:3000/docadmin/payouts', colors.cyan);
    log('   - View tabs: Missed | Pending | Upcoming | Completed', colors.cyan);
    log('   - Upload receipts for pending payouts', colors.cyan);

    log('\n2. Test Client Payout History:', colors.yellow);
    log('   - Login as: test.verified@example.com (Password: Password123!)', colors.cyan);
    log('   - Go to: http://localhost:3000/client/payouts', colors.cyan);
    log('   - View status cards: Missed | Pending | Scheduled | Completed', colors.cyan);
    log('   - Filter by status and download receipts', colors.cyan);

    log('\n3. Test Cron Jobs:', colors.yellow);
    log('   - Daily generation: npx tsx src/scripts/test-cron-jobs.ts', colors.cyan);
    log('   - Manual trigger: curl http://localhost:3000/api/cron/payout-generation', colors.cyan);

    log('\n4. Complete a Payout:', colors.yellow);
    log('   - Run: npx tsx src/scripts/manipulate-payout-for-testing.ts', colors.cyan);
    log('   - Then upload receipt in DocAdmin dashboard', colors.cyan);
    log('   - Check client receives email and in-app notification', colors.cyan);

    log('\n5. Verify Calculations:', colors.yellow);
    log('   - Run: npx tsx src/scripts/verify-payout-amounts.ts', colors.cyan);

    log('\n✅ All test data ready for comprehensive payout testing!', colors.bright + colors.green);

  } catch (error) {
    log('\n❌ Error seeding payout test data:', colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
