/**
 * Manipulate Payout Schedule for Testing
 * This script modifies payout schedule dates so you can test receipt upload TODAY
 */

import { prisma } from '@/lib/db/prisma';
import { createPendingPayouts } from '@/lib/services/payout.service';

async function manipulatePayoutForTesting() {
  console.log('🔧 Starting payout schedule manipulation for testing...\n');

  // Find the contract by tracking number
  const trackingNumber = 'PPR-20260118-IW879M';

  const contract = await prisma.productPurchaseRequest.findUnique({
    where: { trackingNumber },
    include: {
      client: {
        include: {
          user: true,
        },
      },
      investment: true,
      investmentOption: true,
      payoutSchedules: {
        orderBy: { scheduledDate: 'asc' },
      },
    },
  });

  if (!contract) {
    console.error(`❌ Contract with tracking number ${trackingNumber} not found!`);
    console.log('Available contracts:');
    const contracts = await prisma.productPurchaseRequest.findMany({
      where: { status: 'COMPLETED' },
      select: { trackingNumber: true, id: true },
    });
    console.table(contracts);
    return;
  }

  console.log(`✅ Found contract: ${contract.trackingNumber}`);
  console.log(`   Client: ${contract.client.user.firstName} ${contract.client.user.lastName}`);
  console.log(`   Investment: ${contract.investment.name}`);
  console.log(`   Amount: AED ${contract.amount}`);
  console.log(`   Duration: ${contract.investmentOption.duration}`);
  console.log(`   Frequency: ${contract.investmentOption.withdrawalFrequency}`);
  console.log(`   Total Schedules: ${contract.payoutSchedules.length}\n`);

  if (contract.payoutSchedules.length === 0) {
    console.log('⚠️  No payout schedules found. They should have been generated automatically.');
    console.log('   This might indicate an error during contract upload.');
    return;
  }

  // Show current schedule dates
  console.log('📅 Current Payout Schedule:');
  contract.payoutSchedules.forEach((schedule, index) => {
    console.log(
      `   ${index + 1}. Scheduled: ${schedule.scheduledDate.toLocaleDateString()} ` +
      `| Period: ${schedule.periodStart.toLocaleDateString()} - ${schedule.periodEnd.toLocaleDateString()} ` +
      `| Amount: AED ${schedule.interestAmount} ` +
      `| Processed: ${schedule.isProcessed ? 'Yes' : 'No'}`
    );
  });

  // Modify the first 2 payout schedules to be due today and tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('\n🔧 Modifying first 2 payout schedules for testing...');

  // Update first schedule to today
  if (contract.payoutSchedules[0]) {
    await prisma.payoutSchedule.update({
      where: { id: contract.payoutSchedules[0].id },
      data: {
        scheduledDate: today,
        isProcessed: false, // Make sure it's not marked as processed
      },
    });
    console.log(`✅ Updated schedule 1: Now due TODAY (${today.toLocaleDateString()})`);
  }

  // Update second schedule to tomorrow
  if (contract.payoutSchedules[1]) {
    await prisma.payoutSchedule.update({
      where: { id: contract.payoutSchedules[1].id },
      data: {
        scheduledDate: tomorrow,
        isProcessed: false,
      },
    });
    console.log(`✅ Updated schedule 2: Now due TOMORROW (${tomorrow.toLocaleDateString()})`);
  }

  // Now create pending payouts from the updated schedules
  console.log('\n💰 Creating pending payouts from updated schedules...');
  const createdCount = await createPendingPayouts(7); // Look ahead 7 days
  console.log(`✅ Created ${createdCount} pending payout(s)`);

  // Show the pending payouts
  const pendingPayouts = await prisma.payout.findMany({
    where: {
      productPurchaseRequestId: contract.id,
      status: 'PENDING',
    },
    include: {
      payoutSchedule: true,
    },
    orderBy: { scheduledDate: 'asc' },
  });

  console.log('\n📋 Pending Payouts Ready for Testing:');
  if (pendingPayouts.length === 0) {
    console.log('   ⚠️  No pending payouts found. This might mean they were already created.');

    // Check if payouts already exist
    const allPayouts = await prisma.payout.findMany({
      where: { productPurchaseRequestId: contract.id },
      include: { payoutSchedule: true },
      orderBy: { scheduledDate: 'asc' },
    });

    if (allPayouts.length > 0) {
      console.log('\n   Existing payouts for this contract:');
      allPayouts.forEach((payout, index) => {
        console.log(
          `   ${index + 1}. Status: ${payout.status} ` +
          `| Scheduled: ${payout.scheduledDate.toLocaleDateString()} ` +
          `| Amount: AED ${payout.amount}`
        );
      });
    }
  } else {
    pendingPayouts.forEach((payout, index) => {
      console.log(
        `   ${index + 1}. ID: ${payout.id} ` +
        `| Scheduled: ${payout.scheduledDate.toLocaleDateString()} ` +
        `| Amount: AED ${payout.amount} ` +
        `| Period: ${payout.periodStart.toLocaleDateString()} - ${payout.periodEnd.toLocaleDateString()}`
      );
    });

    console.log('\n✅ SUCCESS! You can now test payout receipt upload:');
    console.log('   1. Go to: http://localhost:3001/docadmin/payouts');
    console.log('   2. Find the pending payout(s) listed above');
    console.log('   3. Click "Upload Receipt" button');
    console.log('   4. Upload a test PDF/image file');
    console.log('   5. Verify the payout completes successfully');
  }

  console.log('\n🎉 Testing setup complete!');
}

manipulatePayoutForTesting()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
