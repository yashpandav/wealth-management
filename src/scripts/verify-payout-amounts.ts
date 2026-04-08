/**
 * Verify Payout Amount Calculations
 *
 * This script checks that all payout amounts are correctly calculated
 * based on the formula: (principal × ROI) / 100
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  // eslint-disable-next-line no-console
  console.log(`${color}${message}${colors.reset}`);
}

async function verifyPayoutCalculations() {
  log('\n🔍 PAYOUT CALCULATION VERIFICATION\n', colors.bright + colors.cyan);

  // Get all test contracts with their payouts
  const contracts = await prisma.productPurchaseRequest.findMany({
    where: {
      trackingNumber: { startsWith: 'TEST-' },
    },
    include: {
      investmentOption: true,
      investment: true,
      payoutSchedules: {
        orderBy: { scheduledDate: 'asc' },
        take: 3, // Just show first 3
      },
      payouts: {
        orderBy: { scheduledDate: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (contracts.length === 0) {
    log('❌ No test contracts found. Run the comprehensive test first.', colors.red);
    return;
  }

  log(`Found ${contracts.length} test contracts\n`, colors.cyan);

  let allCorrect = true;

  for (const contract of contracts) {
    const principal = contract.amount.toNumber();
    const roi = contract.investmentOption.roi.toNumber();
    const frequency = contract.investmentOption.withdrawalFrequency;
    const window = contract.payoutWindow;

    // Calculate expected interest per payout
    const expectedInterest = (principal * roi) / 100;

    log('─'.repeat(80), colors.cyan);
    log(`\n📋 Contract: ${contract.trackingNumber}`, colors.bright);
    log(`   Investment: ${contract.investment.name}`, colors.cyan);
    log(`   Amount: AED ${principal.toLocaleString()}`, colors.cyan);
    log(`   Frequency: ${frequency}`, colors.cyan);
    log(`   Window: ${window}`, colors.cyan);
    log(`   Duration: ${contract.investmentOption.duration}`, colors.cyan);
    log(`   ROI per period: ${roi}%`, colors.cyan);

    log(`\n   📊 CALCULATION:`, colors.yellow);
    log(`   Formula: (Principal × ROI) / 100`, colors.cyan);
    log(`   Calculation: (${principal.toLocaleString()} × ${roi}) / 100`, colors.cyan);
    log(`   Expected Interest: AED ${expectedInterest.toLocaleString()}`, colors.bright + colors.yellow);

    // Check payout schedules
    if (contract.payoutSchedules.length > 0) {
      log(`\n   ✓ PayoutSchedule Records (showing first 3 of ${contract.payoutSchedules.length}):`, colors.green);

      let schedulesCorrect = true;
      contract.payoutSchedules.slice(0, 3).forEach((schedule, index) => {
        const actualAmount = schedule.interestAmount.toNumber();
        const isCorrect = actualAmount === expectedInterest;

        if (!isCorrect) {
          schedulesCorrect = false;
          allCorrect = false;
        }

        log(`     ${index + 1}. Date: ${schedule.scheduledDate.toISOString().split('T')[0]}`, colors.cyan);
        log(`        Amount: AED ${actualAmount.toLocaleString()} ${isCorrect ? '✓' : '✗ INCORRECT!'}`,
          isCorrect ? colors.green : colors.red);

        if (!isCorrect) {
          log(`        Expected: AED ${expectedInterest.toLocaleString()}`, colors.red);
          log(`        Difference: AED ${Math.abs(actualAmount - expectedInterest).toLocaleString()}`, colors.red);
        }
      });

      if (schedulesCorrect) {
        log(`     All schedule amounts are correct! ✓`, colors.green);
      }
    }

    // Check payout records
    if (contract.payouts.length > 0) {
      log(`\n   ✓ Payout Records (${contract.payouts.length} created):`, colors.green);

      let payoutsCorrect = true;
      contract.payouts.forEach((payout, index) => {
        const actualAmount = payout.amount.toNumber();
        const isCorrect = actualAmount === expectedInterest;

        if (!isCorrect) {
          payoutsCorrect = false;
          allCorrect = false;
        }

        log(`     ${index + 1}. Date: ${payout.scheduledDate.toISOString().split('T')[0]} | Status: ${payout.status}`, colors.cyan);
        log(`        Amount: AED ${actualAmount.toLocaleString()} ${isCorrect ? '✓' : '✗ INCORRECT!'}`,
          isCorrect ? colors.green : colors.red);

        if (!isCorrect) {
          log(`        Expected: AED ${expectedInterest.toLocaleString()}`, colors.red);
          log(`        Difference: AED ${Math.abs(actualAmount - expectedInterest).toLocaleString()}`, colors.red);
        }
      });

      if (payoutsCorrect) {
        log(`     All payout amounts are correct! ✓`, colors.green);
      }
    }

    log('');
  }

  // Summary
  log('═'.repeat(80), colors.cyan);
  log('\n📊 VERIFICATION SUMMARY\n', colors.bright + colors.cyan);

  const totalSchedules = await prisma.payoutSchedule.count({
    where: {
      productPurchaseRequest: {
        trackingNumber: { startsWith: 'TEST-' },
      },
    },
  });

  const totalPayouts = await prisma.payout.count({
    where: {
      productPurchaseRequest: {
        trackingNumber: { startsWith: 'TEST-' },
      },
    },
  });

  log(`Total Test Contracts: ${contracts.length}`, colors.cyan);
  log(`Total PayoutSchedules: ${totalSchedules}`, colors.cyan);
  log(`Total Payouts: ${totalPayouts}`, colors.cyan);

  if (allCorrect) {
    log('\n✅ ALL CALCULATIONS ARE CORRECT!', colors.bright + colors.green);
  } else {
    log('\n❌ SOME CALCULATIONS ARE INCORRECT!', colors.bright + colors.red);
  }

  // Detailed breakdown by frequency
  log('\n📈 Breakdown by Frequency:', colors.cyan);

  const monthlyContracts = contracts.filter(c => c.investmentOption.withdrawalFrequency === 'Monthly');
  const quarterlyContracts = contracts.filter(c => c.investmentOption.withdrawalFrequency === 'Quarterly');

  log(`\nMonthly Contracts: ${monthlyContracts.length}`, colors.yellow);
  monthlyContracts.forEach(c => {
    const principal = c.amount.toNumber();
    const roi = c.investmentOption.roi.toNumber();
    const interest = (principal * roi) / 100;
    log(`  - AED ${principal.toLocaleString()} @ ${roi}% = AED ${interest.toLocaleString()}/month`, colors.cyan);
  });

  log(`\nQuarterly Contracts: ${quarterlyContracts.length}`, colors.yellow);
  quarterlyContracts.forEach(c => {
    const principal = c.amount.toNumber();
    const roi = c.investmentOption.roi.toNumber();
    const interest = (principal * roi) / 100;
    log(`  - AED ${principal.toLocaleString()} @ ${roi}% = AED ${interest.toLocaleString()}/quarter`, colors.cyan);
  });

  log('');
}

verifyPayoutCalculations()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
