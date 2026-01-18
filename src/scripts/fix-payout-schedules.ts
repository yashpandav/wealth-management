/**
 * Fix Payout Schedules with Corrected Calculation
 * Regenerate payout schedules using the correct formula (annualReturn instead of roi)
 */

import { prisma } from '@/lib/db/prisma';
import { generatePayoutSchedules } from '@/lib/services/payout.service';

async function fixPayoutSchedules() {
  console.log('🔧 Fixing Payout Schedules with Corrected Calculation\n');

  const trackingNumber = 'PPR-20260118-IW879M';

  const contract = await prisma.productPurchaseRequest.findUnique({
    where: { trackingNumber },
    include: {
      payoutSchedules: true,
      payouts: true,
    },
  });

  if (!contract) {
    console.error('Contract not found!');
    return;
  }

  console.log(`Found contract: ${contract.trackingNumber}`);
  console.log(`Existing schedules: ${contract.payoutSchedules.length}`);
  console.log(`Existing payouts: ${contract.payouts.length}`);

  // Delete existing payouts
  if (contract.payouts.length > 0) {
    console.log('\n🗑️  Deleting existing payouts...');
    await prisma.payout.deleteMany({
      where: { productPurchaseRequestId: contract.id },
    });
    console.log(`✅ Deleted ${contract.payouts.length} payouts`);
  }

  // Delete existing schedules
  if (contract.payoutSchedules.length > 0) {
    console.log('\n🗑️  Deleting existing payout schedules...');
    await prisma.payoutSchedule.deleteMany({
      where: { productPurchaseRequestId: contract.id },
    });
    console.log(`✅ Deleted ${contract.payoutSchedules.length} schedules`);
  }

  // Regenerate schedules with corrected formula
  console.log('\n💰 Regenerating payout schedules with CORRECTED calculation...');
  await generatePayoutSchedules(contract.id);
  console.log('✅ Schedules regenerated');

  // Verify the new schedules
  const newSchedules = await prisma.payoutSchedule.findMany({
    where: { productPurchaseRequestId: contract.id },
    orderBy: { scheduledDate: 'asc' },
  });

  console.log(`\n📊 New Payout Schedules (Total: ${newSchedules.length}):`);
  newSchedules.forEach((schedule, index) => {
    console.log(
      `   ${index + 1}. Scheduled: ${schedule.scheduledDate.toLocaleDateString()} ` +
      `| Amount: AED ${schedule.interestAmount.toNumber().toLocaleString()} ` +
      `| Period: ${schedule.periodStart.toLocaleDateString()} - ${schedule.periodEnd.toLocaleDateString()}`
    );
  });

  const totalInterest = newSchedules.reduce((sum, s) => sum + s.interestAmount.toNumber(), 0);
  console.log(`\n💰 Total Interest: AED ${totalInterest.toLocaleString()}`);
  console.log(`   Principal: AED ${contract.amount.toNumber().toLocaleString()}`);
  console.log(`   Total Return: AED ${(contract.amount.toNumber() + totalInterest).toLocaleString()}`);
  console.log(`   Effective Return: ${((totalInterest / contract.amount.toNumber()) * 100).toFixed(2)}%`);

  console.log('\n🎉 Payout schedules fixed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart the dev server to pick up the code changes');
  console.log('   2. Run the manipulate-payout-for-testing script again to create test payouts');
  console.log('   3. Test the receipt upload at /docadmin/payouts');
}

fixPayoutSchedules()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
