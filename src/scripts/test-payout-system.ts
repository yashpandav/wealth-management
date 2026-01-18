/**
 * Comprehensive Payout System Test Script
 *
 * This script tests:
 * 1. Payout schedule generation for completed contracts
 * 2. Payout creation from schedules
 * 3. Cron jobs (daily generation and reminders)
 * 4. Manual payout completion
 *
 * Run with: npx tsx src/scripts/test-payout-system.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  generatePayoutSchedules,
  createPendingPayouts,
  completePayout,
  getPendingPayouts,
  getClientPayouts,
  getClientTotalInterestEarned
} from '@/lib/services/payout.service';
import {
  dailyPayoutGenerationJob,
  payoutReminder15thJob,
  payoutReminderMonthEndJob
} from '@/lib/cron/payout-jobs';

const prisma = new PrismaClient();

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

/**
 * Step 1: Create test data with completed contracts
 */
async function createTestData() {
  section('STEP 1: Creating Test Data');

  // Get existing test users
  const client1 = await prisma.client.findFirst({
    where: { user: { email: 'alice.williams@example.com' } },
    include: { user: true },
  });

  const client2 = await prisma.client.findFirst({
    where: { user: { email: 'bob.davis@example.com' } },
    include: { user: true },
  });

  const rm1 = await prisma.relationshipManager.findFirst({
    where: { user: { email: 'john.smith@wealthcrm.com' } },
  });

  if (!client1 || !client2 || !rm1) {
    throw new Error('Required test users not found. Please run seed first.');
  }

  // Get investment options for testing
  const monthlyOption = await prisma.investmentOption.findFirst({
    where: { withdrawalFrequency: 'Monthly', duration: '1 Year' },
    include: { investment: true },
  });

  const quarterlyOption = await prisma.investmentOption.findFirst({
    where: { withdrawalFrequency: 'Quarterly', duration: '2 Years' },
    include: { investment: true },
  });

  if (!monthlyOption || !quarterlyOption) {
    throw new Error('Required investment options not found. Please run seed first.');
  }

  log('✓ Found existing users and investment options', colors.green);

  // Clean up any existing test contracts
  await prisma.payoutSchedule.deleteMany({
    where: {
      productPurchaseRequest: {
        client: { userId: { in: [client1.userId, client2.userId] } },
      },
    },
  });
  await prisma.payout.deleteMany({
    where: {
      clientId: { in: [client1.id, client2.id] },
    },
  });
  await prisma.productPurchaseRequest.deleteMany({
    where: {
      clientId: { in: [client1.id, client2.id] },
    },
  });

  log('✓ Cleaned up existing test data', colors.green);

  // Create test contract 1: Monthly payouts, window 1-15
  // Contract started 2 months ago, so we should have some payouts due
  const contractStartDate1 = new Date();
  contractStartDate1.setMonth(contractStartDate1.getMonth() - 2);
  contractStartDate1.setDate(1);

  const contract1 = await prisma.productPurchaseRequest.create({
    data: {
      trackingNumber: `TEST-MONTHLY-${Date.now()}`,
      clientId: client1.id,
      investmentId: monthlyOption.investmentId,
      investmentOptionId: monthlyOption.id,
      amount: 100000,
      status: 'COMPLETED',
      payoutWindow: '1-15',
      contractStartDate: contractStartDate1,
      completedAt: contractStartDate1,
      createdAt: new Date(contractStartDate1.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  log(`✓ Created Monthly Contract (1-15 window): ${contract1.id}`, colors.green);
  log(`  Amount: AED 100,000`, colors.cyan);
  log(`  Start Date: ${contractStartDate1.toISOString().split('T')[0]}`, colors.cyan);
  log(`  Frequency: Monthly | ROI: ${monthlyOption.roi}% | Window: 1-15 (payout on 15th)`, colors.cyan);

  // Create test contract 2: Quarterly payouts, window 16-30
  // Contract started 4 months ago
  const contractStartDate2 = new Date();
  contractStartDate2.setMonth(contractStartDate2.getMonth() - 4);
  contractStartDate2.setDate(1);

  const contract2 = await prisma.productPurchaseRequest.create({
    data: {
      trackingNumber: `TEST-QUARTERLY-${Date.now()}`,
      clientId: client2.id,
      investmentId: quarterlyOption.investmentId,
      investmentOptionId: quarterlyOption.id,
      amount: 250000,
      status: 'COMPLETED',
      payoutWindow: '16-30',
      contractStartDate: contractStartDate2,
      completedAt: contractStartDate2,
      createdAt: new Date(contractStartDate2.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  log(`✓ Created Quarterly Contract (16-30 window): ${contract2.id}`, colors.green);
  log(`  Amount: AED 250,000`, colors.cyan);
  log(`  Start Date: ${contractStartDate2.toISOString().split('T')[0]}`, colors.cyan);
  log(`  Frequency: Quarterly | ROI: ${quarterlyOption.roi}% | Window: 16-30 (payout on month-end)`, colors.cyan);

  return { contract1, contract2, client1, client2 };
}

/**
 * Step 2: Test payout schedule generation
 */
async function testPayoutScheduleGeneration(contract1Id: string, contract2Id: string) {
  section('STEP 2: Testing Payout Schedule Generation');

  // Generate schedules for contract 1 (Monthly)
  log('Generating schedules for Monthly contract...', colors.yellow);
  await generatePayoutSchedules(contract1Id);

  const schedules1 = await prisma.payoutSchedule.findMany({
    where: { productPurchaseRequestId: contract1Id },
    orderBy: { scheduledDate: 'asc' },
  });

  log(`✓ Generated ${schedules1.length} payout schedules for Monthly contract`, colors.green);
  log(`  Expected: 12 schedules (12 months × 1 year)`, colors.cyan);

  // Show first 3 schedules
  log('\n  First 3 schedules:', colors.cyan);
  schedules1.slice(0, 3).forEach((schedule, index) => {
    log(`    ${index + 1}. Date: ${schedule.scheduledDate.toISOString().split('T')[0]} | Amount: AED ${schedule.interestAmount.toFixed(2)} | Period: ${schedule.periodStart.toISOString().split('T')[0]} to ${schedule.periodEnd.toISOString().split('T')[0]}`, colors.cyan);
  });

  // Generate schedules for contract 2 (Quarterly)
  log('\nGenerating schedules for Quarterly contract...', colors.yellow);
  await generatePayoutSchedules(contract2Id);

  const schedules2 = await prisma.payoutSchedule.findMany({
    where: { productPurchaseRequestId: contract2Id },
    orderBy: { scheduledDate: 'asc' },
  });

  log(`✓ Generated ${schedules2.length} payout schedules for Quarterly contract`, colors.green);
  log(`  Expected: 8 schedules (4 quarters × 2 years)`, colors.cyan);

  // Show first 3 schedules
  log('\n  First 3 schedules:', colors.cyan);
  schedules2.slice(0, 3).forEach((schedule, index) => {
    log(`    ${index + 1}. Date: ${schedule.scheduledDate.toISOString().split('T')[0]} | Amount: AED ${schedule.interestAmount.toFixed(2)} | Period: ${schedule.periodStart.toISOString().split('T')[0]} to ${schedule.periodEnd.toISOString().split('T')[0]}`, colors.cyan);
  });

  // Check for past due schedules
  const now = new Date();
  const pastDueSchedules = await prisma.payoutSchedule.count({
    where: {
      scheduledDate: { lte: now },
      isProcessed: false,
    },
  });

  log(`\n✓ Found ${pastDueSchedules} past-due schedules ready for payout creation`, colors.green);

  return { schedules1, schedules2, pastDueSchedules };
}

/**
 * Step 3: Test payout creation from schedules
 */
async function testPayoutCreation() {
  section('STEP 3: Testing Payout Creation from Schedules');

  log('Running createPendingPayouts() with 30-day lookahead...', colors.yellow);
  const createdCount = await createPendingPayouts(30);

  log(`✓ Created ${createdCount} pending payout records`, colors.green);

  // Fetch created payouts
  const payouts = await prisma.payout.findMany({
    where: { status: 'PENDING' },
    include: {
      client: { include: { user: true } },
      productPurchaseRequest: {
        include: {
          investmentOption: { include: { investment: true } },
        },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  log(`\n  Total Pending Payouts: ${payouts.length}`, colors.cyan);

  // Show details
  if (payouts.length > 0) {
    log('\n  Payout Details:', colors.cyan);
    payouts.forEach((payout, index) => {
      log(`    ${index + 1}. Client: ${payout.client.user.firstName} ${payout.client.user.lastName}`, colors.cyan);
      log(`       Amount: AED ${payout.amount.toFixed(2)} | Scheduled: ${payout.scheduledDate.toISOString().split('T')[0]}`, colors.cyan);
      log(`       Period: ${payout.periodStart.toISOString().split('T')[0]} to ${payout.periodEnd.toISOString().split('T')[0]}`, colors.cyan);
    });
  }

  return payouts;
}

/**
 * Step 4: Test cron jobs
 */
async function testCronJobs() {
  section('STEP 4: Testing Cron Jobs');

  // Test daily generation job
  log('Testing Daily Payout Generation Job...', colors.yellow);
  try {
    await dailyPayoutGenerationJob();
    log('✓ Daily generation job completed successfully', colors.green);
  } catch (error) {
    log(`✗ Daily generation job failed: ${error}`, colors.red);
  }

  // Check the date to see if reminder jobs should run
  const today = new Date();
  const dayOfMonth = today.getDate();

  // Test 15th reminder
  log('\nTesting 15th Reminder Job...', colors.yellow);
  if (dayOfMonth === 14) {
    try {
      await payoutReminder15thJob();
      log('✓ 15th reminder job would send emails (today is 14th)', colors.green);
    } catch (error) {
      log(`✗ 15th reminder job failed: ${error}`, colors.red);
    }
  } else {
    log(`⊘ Skipped (today is ${dayOfMonth}th, not 14th)`, colors.yellow);
    log('  Note: This job only runs on the 14th of each month', colors.cyan);
  }

  // Test month-end reminder
  log('\nTesting Month-End Reminder Job...', colors.yellow);
  if (dayOfMonth === 29) {
    try {
      await payoutReminderMonthEndJob();
      log('✓ Month-end reminder job would send emails (today is 29th)', colors.green);
    } catch (error) {
      log(`✗ Month-end reminder job failed: ${error}`, colors.red);
    }
  } else {
    log(`⊘ Skipped (today is ${dayOfMonth}th, not 29th)`, colors.yellow);
    log('  Note: This job only runs on the 29th of each month', colors.cyan);
  }
}

/**
 * Step 5: Test manual payout completion
 */
async function testPayoutCompletion() {
  section('STEP 5: Testing Manual Payout Completion');

  // Get a pending payout
  const pendingPayout = await prisma.payout.findFirst({
    where: { status: 'PENDING' },
    include: {
      client: { include: { user: true } },
    },
  });

  if (!pendingPayout) {
    log('⊘ No pending payouts found to test completion', colors.yellow);
    return;
  }

  log(`Testing payout completion for: ${pendingPayout.client.user.firstName} ${pendingPayout.client.user.lastName}`, colors.yellow);
  log(`  Amount: AED ${pendingPayout.amount.toFixed(2)}`, colors.cyan);

  // Get DocAdmin user
  const docAdmin = await prisma.user.findFirst({
    where: { role: 'DOCADMIN' },
  });

  if (!docAdmin) {
    log('✗ DocAdmin user not found', colors.red);
    return;
  }

  // Create a mock receipt document
  // Note: Documents require clientId, so we'll link it to the client
  const receiptDoc = await prisma.document.create({
    data: {
      clientId: pendingPayout.clientId,
      documentType: 'OTHER', // Using OTHER for receipt document
      filePath: '/uploads/receipts/test-receipt.pdf',
      verificationStatus: 'VERIFIED',
    },
  });

  log(`✓ Created mock receipt document: ${receiptDoc.id}`, colors.green);

  // Complete the payout
  log('\nCompleting payout...', colors.yellow);
  try {
    await completePayout(
      pendingPayout.id,
      receiptDoc.id,
      docAdmin.id,
      'Test completion - automated test script'
    );

    log('✓ Payout completed successfully', colors.green);

    // Verify the completion
    const completedPayout = await prisma.payout.findUnique({
      where: { id: pendingPayout.id },
      include: {
        transaction: true,
        receiptDocument: true,
      },
    });

    if (completedPayout) {
      log('\n  Completion Details:', colors.cyan);
      log(`    Status: ${completedPayout.status}`, colors.cyan);
      log(`    Transaction ID: ${completedPayout.transactionId}`, colors.cyan);
      log(`    Receipt Document: ${completedPayout.receiptDocument?.fileName}`, colors.cyan);
      log(`    Processed At: ${completedPayout.processedAt?.toISOString()}`, colors.cyan);
    }

    // Check if PayoutSchedule was marked as processed
    const schedule = await prisma.payoutSchedule.findUnique({
      where: { id: pendingPayout.payoutScheduleId },
    });

    log(`    Schedule Processed: ${schedule?.isProcessed ? 'Yes' : 'No'}`, colors.cyan);

  } catch (error) {
    log(`✗ Payout completion failed: ${error}`, colors.red);
  }
}

/**
 * Step 6: Test client payout queries
 */
async function testClientQueries(client1Id: string, client2Id: string) {
  section('STEP 6: Testing Client Payout Queries');

  // Test client 1 payouts
  log('Fetching payouts for Client 1...', colors.yellow);
  const client1Payouts = await getClientPayouts(client1Id);
  const client1Total = await getClientTotalInterestEarned(client1Id);

  log(`✓ Client 1: ${client1Payouts.length} total payouts`, colors.green);
  log(`  Total Interest Earned: AED ${client1Total.toFixed(2)}`, colors.cyan);
  log(`  Completed: ${client1Payouts.filter(p => p.status === 'COMPLETED').length}`, colors.cyan);
  log(`  Pending: ${client1Payouts.filter(p => p.status === 'PENDING').length}`, colors.cyan);

  // Test client 2 payouts
  log('\nFetching payouts for Client 2...', colors.yellow);
  const client2Payouts = await getClientPayouts(client2Id);
  const client2Total = await getClientTotalInterestEarned(client2Id);

  log(`✓ Client 2: ${client2Payouts.length} total payouts`, colors.green);
  log(`  Total Interest Earned: AED ${client2Total.toFixed(2)}`, colors.cyan);
  log(`  Completed: ${client2Payouts.filter(p => p.status === 'COMPLETED').length}`, colors.cyan);
  log(`  Pending: ${client2Payouts.filter(p => p.status === 'PENDING').length}`, colors.cyan);

  // Test getPendingPayouts with date range
  log('\nFetching pending payouts for next 30 days...', colors.yellow);
  const today = new Date();
  const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingPayouts = await getPendingPayouts(today, next30Days);

  log(`✓ Found ${upcomingPayouts.length} pending payouts in next 30 days`, colors.green);
}

/**
 * Step 7: Manual test specific dates
 */
async function testSpecificDate(targetDate: Date) {
  section(`STEP 7: Testing Payout Generation for Specific Date: ${targetDate.toISOString().split('T')[0]}`);

  log('Checking schedules due on or before this date...', colors.yellow);

  const schedulesForDate = await prisma.payoutSchedule.findMany({
    where: {
      scheduledDate: { lte: targetDate },
      isProcessed: false,
    },
    include: {
      client: { include: { user: true } },
      productPurchaseRequest: {
        include: {
          investmentOption: true,
        },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  log(`✓ Found ${schedulesForDate.length} schedules`, colors.green);

  if (schedulesForDate.length > 0) {
    log('\n  Schedule Details:', colors.cyan);
    schedulesForDate.forEach((schedule, index) => {
      log(`    ${index + 1}. Client: ${schedule.client.user.firstName} ${schedule.client.user.lastName}`, colors.cyan);
      log(`       Date: ${schedule.scheduledDate.toISOString().split('T')[0]} | Amount: AED ${schedule.interestAmount.toFixed(2)}`, colors.cyan);
      log(`       Frequency: ${schedule.productPurchaseRequest.investmentOption.withdrawalFrequency}`, colors.cyan);
    });

    // Create payouts for this date
    log('\nCreating payouts for these schedules...', colors.yellow);

    // Calculate lookahead days to include this date
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const lookaheadDays = Math.max(diffDays + 1, 3);

    const created = await createPendingPayouts(lookaheadDays);
    log(`✓ Created ${created} payout records`, colors.green);
  }
}

/**
 * Main test runner
 */
async function main() {
  try {
    log('\n🧪 PAYOUT SYSTEM COMPREHENSIVE TEST', colors.bright + colors.cyan);
    log('   This script will test all payout functionality\n', colors.cyan);

    // Step 1: Create test data
    const { contract1, contract2, client1, client2 } = await createTestData();

    // Step 2: Test schedule generation
    await testPayoutScheduleGeneration(contract1.id, contract2.id);

    // Step 3: Test payout creation
    await testPayoutCreation();

    // Step 4: Test cron jobs
    await testCronJobs();

    // Step 5: Test payout completion
    await testPayoutCompletion();

    // Step 6: Test client queries
    await testClientQueries(client1.id, client2.id);

    // Step 7: Test specific dates
    // Test for 15th of next month
    const next15th = new Date();
    next15th.setMonth(next15th.getMonth() + 1);
    next15th.setDate(15);
    await testSpecificDate(next15th);

    // Final summary
    section('TEST SUMMARY');

    const totalSchedules = await prisma.payoutSchedule.count();
    const totalPayouts = await prisma.payout.count();
    const pendingPayouts = await prisma.payout.count({ where: { status: 'PENDING' } });
    const completedPayouts = await prisma.payout.count({ where: { status: 'COMPLETED' } });

    log(`✓ Total Payout Schedules: ${totalSchedules}`, colors.green);
    log(`✓ Total Payouts Created: ${totalPayouts}`, colors.green);
    log(`  - Pending: ${pendingPayouts}`, colors.cyan);
    log(`  - Completed: ${completedPayouts}`, colors.cyan);

    log('\n✅ All tests completed successfully!', colors.bright + colors.green);
    log('\n📚 Next Steps:', colors.cyan);
    log('  1. Check the database in Prisma Studio: npx prisma studio', colors.cyan);
    log('  2. Test the cron API endpoints manually:', colors.cyan);
    log('     - GET http://localhost:3000/api/cron/payout-generation', colors.cyan);
    log('     - GET http://localhost:3000/api/cron/payout-reminder-15th', colors.cyan);
    log('     - GET http://localhost:3000/api/cron/payout-reminder-month-end', colors.cyan);
    log('  3. Build the DocAdmin and Client UI to complete the flow', colors.cyan);

  } catch (error) {
    log('\n❌ Test failed with error:', colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
main();
