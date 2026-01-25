#!/usr/bin/env tsx
/**
 * Payout Test Manager
 * Comprehensive script for testing all payout scenarios
 *
 * Usage: npx tsx src/scripts/payout-test-manager.ts [command]
 *
 * Commands:
 *   setup       - Initial setup: create test contracts and schedules
 *   today       - Set payouts for today's testing
 *   upcoming    - Show upcoming payouts
 *   missed      - Show missed payouts
 *   complete    - Mark payouts as completed
 *   reset       - Reset all test data
 *   show        - Show all payout data
 *   verify      - Verify payout calculations
 */

import { PrismaClient } from '@prisma/client';
import { generatePayoutSchedules, createPendingPayouts } from '@/lib/services/payout.service';
import { addMonths, subMonths, addDays } from 'date-fns';

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

function header(title: string) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

// ==================== SETUP: Create Test Contracts ====================
async function setupTestContracts() {
  header('📝 SETUP: Creating Test Contracts');

  const testVerifiedUser = await prisma.client.findFirst({
    where: { user: { email: 'test.verified@example.com' } },
    include: { user: true },
  });

  if (!testVerifiedUser) {
    log('❌ test.verified@example.com not found. Run: pnpm prisma db seed', colors.red);
    return;
  }

  log(`✅ Found user: ${testVerifiedUser.user.email}`, colors.green);

  // Get investment options
  const monthlyOption = await prisma.investmentOption.findFirst({
    where: { withdrawalFrequency: 'Monthly', duration: '1 Year' },
    include: { investment: true },
  });

  const quarterlyOption = await prisma.investmentOption.findFirst({
    where: { withdrawalFrequency: 'Quarterly', duration: '2 Years' },
    include: { investment: true },
  });

  if (!monthlyOption || !quarterlyOption) {
    log('❌ Investment options not found', colors.red);
    return;
  }

  // Clean old test contracts
  const oldContracts = await prisma.productPurchaseRequest.findMany({
    where: { trackingNumber: { startsWith: 'PAYOUT-TEST-' } },
  });

  if (oldContracts.length > 0) {
    for (const contract of oldContracts) {
      await prisma.payout.deleteMany({ where: { productPurchaseRequestId: contract.id } });
      await prisma.payoutSchedule.deleteMany({ where: { productPurchaseRequestId: contract.id } });
    }
    await prisma.productPurchaseRequest.deleteMany({
      where: { trackingNumber: { startsWith: 'PAYOUT-TEST-' } },
    });
    log(`🧹 Cleaned up ${oldContracts.length} old test contracts`, colors.yellow);
  }

  const now = new Date();
  const contracts = [];

  // Contract 1: Monthly 1-15 (started 2 months ago)
  log('\n1️⃣  Creating Monthly 1-15 contract...', colors.yellow);
  const start1 = subMonths(now, 2);
  start1.setDate(10);

  const contract1 = await prisma.productPurchaseRequest.create({
    data: {
      trackingNumber: `PAYOUT-TEST-MONTHLY-1-15-${Date.now()}`,
      clientId: testVerifiedUser.id,
      investmentId: monthlyOption.investmentId,
      investmentOptionId: monthlyOption.id,
      amount: 100000,
      status: 'COMPLETED',
      payoutWindow: '1-15',
      contractStartDate: start1,
      completedAt: start1,
      createdAt: new Date(start1.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  log(`   ✅ Contract: ${contract1.trackingNumber}`, colors.green);
  log(`      Amount: AED 100,000 | Monthly | ROI: 3%`, colors.cyan);
  log(`      Start: ${start1.toISOString().split('T')[0]} | Window: 1-15 (15th)`, colors.cyan);

  await generatePayoutSchedules(contract1.id);
  contracts.push(contract1);

  // Contract 2: Monthly 16-30 (started 2 months ago)
  log('\n2️⃣  Creating Monthly 16-30 contract...', colors.yellow);
  const start2 = subMonths(now, 2);
  start2.setDate(20);

  const contract2 = await prisma.productPurchaseRequest.create({
    data: {
      trackingNumber: `PAYOUT-TEST-MONTHLY-16-30-${Date.now()}`,
      clientId: testVerifiedUser.id,
      investmentId: monthlyOption.investmentId,
      investmentOptionId: monthlyOption.id,
      amount: 150000,
      status: 'COMPLETED',
      payoutWindow: '16-30',
      contractStartDate: start2,
      completedAt: start2,
      createdAt: new Date(start2.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  log(`   ✅ Contract: ${contract2.trackingNumber}`, colors.green);
  log(`      Amount: AED 150,000 | Monthly | ROI: 3%`, colors.cyan);
  log(`      Start: ${start2.toISOString().split('T')[0]} | Window: 16-30 (month-end)`, colors.cyan);

  await generatePayoutSchedules(contract2.id);
  contracts.push(contract2);

  // Contract 3: Quarterly
  log('\n3️⃣  Creating Quarterly contract...', colors.yellow);
  const start3 = subMonths(now, 4);
  start3.setDate(1);

  const contract3 = await prisma.productPurchaseRequest.create({
    data: {
      trackingNumber: `PAYOUT-TEST-QUARTERLY-${Date.now()}`,
      clientId: testVerifiedUser.id,
      investmentId: quarterlyOption.investmentId,
      investmentOptionId: quarterlyOption.id,
      amount: 200000,
      status: 'COMPLETED',
      payoutWindow: '1-15',
      contractStartDate: start3,
      completedAt: start3,
      createdAt: new Date(start3.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  log(`   ✅ Contract: ${contract3.trackingNumber}`, colors.green);
  log(`      Amount: AED 200,000 | Quarterly | ROI: 10%`, colors.cyan);
  log(`      Start: ${start3.toISOString().split('T')[0]} | Window: 1-15 (15th)`, colors.cyan);

  await generatePayoutSchedules(contract3.id);
  contracts.push(contract3);

  const totalSchedules = await prisma.payoutSchedule.count({
    where: { productPurchaseRequestId: { in: contracts.map(c => c.id) } },
  });

  log(`\n✅ Created ${contracts.length} contracts with ${totalSchedules} payout schedules`, colors.bright + colors.green);
}

// ==================== TODAY: Set payouts for today ====================
async function setPayoutsForToday() {
  header('📅 SET PAYOUTS FOR TODAY');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in2Days = new Date(today);
  in2Days.setDate(in2Days.getDate() + 2);

  log(`📆 Today: ${today.toLocaleDateString()}`, colors.bright + colors.cyan);

  const testContracts = await prisma.productPurchaseRequest.findMany({
    where: {
      trackingNumber: { startsWith: 'PAYOUT-TEST-' },
      status: 'COMPLETED',
    },
    include: {
      payoutSchedules: { orderBy: { scheduledDate: 'asc' } },
    },
  });

  if (testContracts.length === 0) {
    log('❌ No test contracts found. Run: npx tsx src/scripts/payout-test-manager.ts setup', colors.red);
    return;
  }

  log(`✅ Found ${testContracts.length} test contracts\n`, colors.green);

  // Clean up old payouts
  for (const contract of testContracts) {
    await prisma.payout.deleteMany({ where: { productPurchaseRequestId: contract.id } });
    await prisma.payoutSchedule.updateMany({
      where: { productPurchaseRequestId: contract.id },
      data: { isProcessed: false },
    });
  }

  log('🧹 Cleaned up old payouts\n', colors.yellow);

  // Set first contract schedules for testing
  const contract = testContracts[0];
  const schedules = contract.payoutSchedules;

  if (schedules.length >= 5) {
    log('📊 Setting up testing scenarios:', colors.bright + colors.yellow);

    await prisma.payoutSchedule.update({
      where: { id: schedules[0].id },
      data: { scheduledDate: twoDaysAgo },
    });
    log(`  ❌ MISSED: 2 days ago - AED ${schedules[0].interestAmount}`, colors.red);

    await prisma.payoutSchedule.update({
      where: { id: schedules[1].id },
      data: { scheduledDate: yesterday },
    });
    log(`  ❌ MISSED: Yesterday - AED ${schedules[1].interestAmount}`, colors.red);

    await prisma.payoutSchedule.update({
      where: { id: schedules[2].id },
      data: { scheduledDate: today },
    });
    log(`  ⏰ PENDING: Today - AED ${schedules[2].interestAmount}`, colors.yellow);

    await prisma.payoutSchedule.update({
      where: { id: schedules[3].id },
      data: { scheduledDate: tomorrow },
    });
    log(`  📅 UPCOMING: Tomorrow - AED ${schedules[3].interestAmount}`, colors.blue);

    await prisma.payoutSchedule.update({
      where: { id: schedules[4].id },
      data: { scheduledDate: in2Days },
    });
    log(`  📅 UPCOMING: In 2 days - AED ${schedules[4].interestAmount}`, colors.blue);
  }

  // Create pending payouts
  log('\n💰 Creating pending payout records...', colors.yellow);
  const count = await createPendingPayouts(5);
  log(`✅ Created ${count} pending payouts`, colors.green);

  await showPayoutSummary();
}

// ==================== SHOW: Display all payout data ====================
async function showPayoutSummary() {
  header('📊 PAYOUT SUMMARY');

  const totalPending = await prisma.payout.count({ where: { status: 'PENDING' } });
  const totalCompleted = await prisma.payout.count({ where: { status: 'COMPLETED' } });

  const byDate = await prisma.payout.groupBy({
    by: ['scheduledDate', 'status'],
    where: { status: 'PENDING' },
    _count: { id: true },
    _sum: { amount: true },
  });

  log(`Total Pending: ${totalPending}`, colors.cyan);
  log(`Total Completed: ${totalCompleted}`, colors.green);

  if (byDate.length > 0) {
    log('\nPending Payouts by Date:', colors.bright + colors.cyan);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    byDate.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    byDate.forEach((item) => {
      const date = new Date(item.scheduledDate);
      const daysFrom = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let label = '';
      let color = colors.cyan;

      if (daysFrom < 0) {
        label = `${Math.abs(daysFrom)} days ago (MISSED)`;
        color = colors.red;
      } else if (daysFrom === 0) {
        label = 'TODAY (PENDING)';
        color = colors.yellow;
      } else if (daysFrom === 1) {
        label = 'Tomorrow (UPCOMING)';
        color = colors.blue;
      } else {
        label = `In ${daysFrom} days (UPCOMING)`;
        color = colors.blue;
      }

      log(
        `  ${date.toLocaleDateString()}: ${item._count.id} payout(s) - AED ${Number(item._sum.amount || 0).toLocaleString()} - ${label}`,
        color
      );
    });
  }
}

// ==================== UPCOMING: Show upcoming payouts ====================
async function showUpcoming() {
  header('📅 UPCOMING PAYOUTS');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = await prisma.payout.findMany({
    where: {
      status: 'PENDING',
      scheduledDate: { gte: today },
    },
    orderBy: { scheduledDate: 'asc' },
    take: 10,
    include: {
      client: { include: { user: true } },
      productPurchaseRequest: {
        include: {
          investment: true,
        },
      },
    },
  });

  if (upcoming.length === 0) {
    log('No upcoming payouts found', colors.yellow);
    return;
  }

  upcoming.forEach((payout, i) => {
    const daysFrom = Math.floor(
      (new Date(payout.scheduledDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const label = daysFrom === 0 ? 'Today' : daysFrom === 1 ? 'Tomorrow' : `In ${daysFrom} days`;

    log(
      `${i + 1}. ${label} (${new Date(payout.scheduledDate).toLocaleDateString()}) - ` +
        `${payout.client.user.firstName} ${payout.client.user.lastName} - ` +
        `AED ${payout.amount.toString()} - ${payout.productPurchaseRequest.investment.name}`,
      colors.cyan
    );
  });
}

// ==================== MISSED: Show missed payouts ====================
async function showMissed() {
  header('❌ MISSED PAYOUTS');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missed = await prisma.payout.findMany({
    where: {
      status: 'PENDING',
      scheduledDate: { lt: today },
    },
    orderBy: { scheduledDate: 'desc' },
    take: 10,
    include: {
      client: { include: { user: true } },
      productPurchaseRequest: {
        include: {
          investment: true,
        },
      },
    },
  });

  if (missed.length === 0) {
    log('No missed payouts found', colors.green);
    return;
  }

  missed.forEach((payout, i) => {
    const daysAgo = Math.floor(
      (today.getTime() - new Date(payout.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    log(
      `${i + 1}. ${daysAgo} days ago (${new Date(payout.scheduledDate).toLocaleDateString()}) - ` +
        `${payout.client.user.firstName} ${payout.client.user.lastName} - ` +
        `AED ${payout.amount.toString()} - ${payout.productPurchaseRequest.investment.name}`,
      colors.red
    );
  });
}

// ==================== COMPLETE: Mark payouts as completed ====================
async function completePayouts() {
  header('✅ COMPLETE PAYOUTS');

  const pending = await prisma.payout.findMany({
    where: { status: 'PENDING' },
    orderBy: { scheduledDate: 'asc' },
    take: 3,
    include: {
      client: { include: { user: true } },
    },
  });

  if (pending.length === 0) {
    log('No pending payouts to complete', colors.yellow);
    return;
  }

  log(`Found ${pending.length} pending payouts. Marking first 3 as completed...\n`, colors.yellow);

  for (const payout of pending) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    log(
      `✅ Completed: ${new Date(payout.scheduledDate).toLocaleDateString()} - ` +
        `${payout.client.user.firstName} ${payout.client.user.lastName} - AED ${payout.amount.toString()}`,
      colors.green
    );
  }

  log(`\n✅ Marked ${pending.length} payouts as completed`, colors.bright + colors.green);
}

// ==================== VERIFY: Verify calculations ====================
async function verifyCalculations() {
  header('🔍 VERIFY PAYOUT CALCULATIONS');

  const contracts = await prisma.productPurchaseRequest.findMany({
    where: {
      trackingNumber: { startsWith: 'PAYOUT-TEST-' },
      status: 'COMPLETED',
    },
    include: {
      investmentOption: true,
      payoutSchedules: true,
    },
  });

  let allCorrect = true;

  for (const contract of contracts) {
    const { amount, payoutSchedules, investmentOption } = contract;
    const expectedInterest = (Number(amount) * investmentOption.roi) / 100;

    log(`\n📄 ${contract.trackingNumber}`, colors.cyan);
    log(`   Amount: AED ${Number(amount).toLocaleString()}`, colors.cyan);
    log(`   ROI: ${investmentOption.roi}%`, colors.cyan);
    log(`   Expected Interest: AED ${expectedInterest.toLocaleString()}`, colors.cyan);

    let errors = 0;
    payoutSchedules.forEach((schedule) => {
      const actual = Number(schedule.interestAmount);
      if (Math.abs(actual - expectedInterest) > 0.01) {
        log(
          `   ❌ Schedule ${schedule.scheduledDate.toISOString().split('T')[0]}: ` +
            `Expected AED ${expectedInterest}, Got AED ${actual}`,
          colors.red
        );
        errors++;
        allCorrect = false;
      }
    });

    if (errors === 0) {
      log(`   ✅ All ${payoutSchedules.length} schedules correct`, colors.green);
    } else {
      log(`   ❌ ${errors} schedule(s) have incorrect amounts`, colors.red);
    }
  }

  if (allCorrect) {
    log('\n✅ All payout calculations are correct!', colors.bright + colors.green);
  } else {
    log('\n❌ Some calculations are incorrect', colors.bright + colors.red);
  }
}

// ==================== RESET: Clean all test data ====================
async function resetTestData() {
  header('🧹 RESET TEST DATA');

  const contracts = await prisma.productPurchaseRequest.findMany({
    where: { trackingNumber: { startsWith: 'PAYOUT-TEST-' } },
  });

  if (contracts.length === 0) {
    log('No test data to reset', colors.yellow);
    return;
  }

  for (const contract of contracts) {
    await prisma.payout.deleteMany({ where: { productPurchaseRequestId: contract.id } });
    await prisma.payoutSchedule.deleteMany({ where: { productPurchaseRequestId: contract.id } });
  }

  await prisma.productPurchaseRequest.deleteMany({
    where: { trackingNumber: { startsWith: 'PAYOUT-TEST-' } },
  });

  log(`✅ Deleted ${contracts.length} test contracts and all related data`, colors.green);
}

// ==================== MAIN ====================
async function main() {
  const command = process.argv[2] || 'help';

  try {
    switch (command) {
      case 'setup':
        await setupTestContracts();
        break;

      case 'today':
        await setPayoutsForToday();
        break;

      case 'show':
        await showPayoutSummary();
        break;

      case 'upcoming':
        await showUpcoming();
        break;

      case 'missed':
        await showMissed();
        break;

      case 'complete':
        await completePayouts();
        break;

      case 'verify':
        await verifyCalculations();
        break;

      case 'reset':
        await resetTestData();
        break;

      default:
        header('🧪 PAYOUT TEST MANAGER');
        log('Usage: npx tsx src/scripts/payout-test-manager.ts [command]\n', colors.cyan);
        log('Commands:', colors.bright + colors.yellow);
        log('  setup       - Create test contracts and schedules', colors.cyan);
        log('  today       - Set payouts for today (missed, pending, upcoming)', colors.cyan);
        log('  show        - Show all payout data summary', colors.cyan);
        log('  upcoming    - Show upcoming payouts', colors.cyan);
        log('  missed      - Show missed/overdue payouts', colors.cyan);
        log('  complete    - Mark pending payouts as completed', colors.cyan);
        log('  verify      - Verify payout calculations', colors.cyan);
        log('  reset       - Delete all test data', colors.cyan);
        log('\nExample workflow:', colors.bright + colors.yellow);
        log('  1. npx tsx src/scripts/payout-test-manager.ts setup', colors.cyan);
        log('  2. npx tsx src/scripts/payout-test-manager.ts today', colors.cyan);
        log('  3. npx tsx src/scripts/payout-test-manager.ts show', colors.cyan);
        log('  4. Test in browser: http://localhost:3000/docadmin/payouts', colors.cyan);
        log('  5. npx tsx src/scripts/payout-test-manager.ts complete', colors.cyan);
        break;
    }
  } catch (error) {
    log('\n❌ Error:', colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
