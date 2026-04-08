/**
 * Verify Test User Payouts
 * Checks payout data for test.verified@example.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console
  console.log('\n🔍 Verifying Payouts for test.verified@example.com\n');
  // eslint-disable-next-line no-console
  console.log('='.repeat(80));

  // Find the test user
  const client = await prisma.client.findFirst({
    where: { user: { email: 'test.verified@example.com' } },
    include: {
      user: true,
      assignedRM: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!client) {
    // eslint-disable-next-line no-console
    console.log('❌ User test.verified@example.com not found');
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`\n✅ Client Found:`);
  // eslint-disable-next-line no-console
  console.log(`   Name: ${client.user.firstName} ${client.user.lastName}`);
  // eslint-disable-next-line no-console
  console.log(`   Email: ${client.user.email}`);
  // eslint-disable-next-line no-console
  console.log(`   Status: ${client.verificationStatus}`);
  if (client.assignedRM) {
    // eslint-disable-next-line no-console
    console.log(`   RM: ${client.assignedRM.user.firstName} ${client.assignedRM.user.lastName}`);
  }

  // Get contracts
  const contracts = await prisma.productPurchaseRequest.findMany({
    where: {
      clientId: client.id,
      trackingNumber: { startsWith: 'PAYOUT-TEST-' },
    },
    include: {
      investment: true,
      investmentOption: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`\n📋 Contracts: ${contracts.length}`);
  // eslint-disable-next-line no-console
  console.log('='.repeat(80));

  for (const contract of contracts) {
    // eslint-disable-next-line no-console
    console.log(`\n📄 Contract: ${contract.trackingNumber}`);
    // eslint-disable-next-line no-console
    console.log(`   Investment: ${contract.investment.name}`);
    // eslint-disable-next-line no-console
    console.log(`   Amount: AED ${contract.amount.toLocaleString()}`);
    // eslint-disable-next-line no-console
    console.log(`   Frequency: ${contract.investmentOption.withdrawalFrequency}`);
    // eslint-disable-next-line no-console
    console.log(`   Duration: ${contract.investmentOption.duration}`);
    // eslint-disable-next-line no-console
    console.log(`   ROI: ${contract.investmentOption.roi}%`);
    // eslint-disable-next-line no-console
    console.log(`   Window: ${contract.payoutWindow}`);
    // eslint-disable-next-line no-console
    console.log(`   Start Date: ${contract.contractStartDate?.toISOString().split('T')[0]}`);
    // eslint-disable-next-line no-console
    console.log(`   Status: ${contract.status}`);

    // Get payout schedules
    const schedules = await prisma.payoutSchedule.findMany({
      where: { productPurchaseRequestId: contract.id },
      orderBy: { scheduledDate: 'asc' },
    });

    // eslint-disable-next-line no-console
    console.log(`\n   📅 Payout Schedules: ${schedules.length}`);

    // Show first 5 and last 3 schedules
    const showSchedules = [
      ...schedules.slice(0, 5),
      ...(schedules.length > 8 ? [{ scheduledDate: new Date(), interestAmount: 0, isProcessed: false }] : []),
      ...schedules.slice(-3),
    ];

    showSchedules.forEach((s, i) => {
      if (s.interestAmount === 0) {
        // eslint-disable-next-line no-console
        console.log(`      ...`);
      } else {
        const status = s.isProcessed ? '✓ Processed' : '⏳ Pending';
        // eslint-disable-next-line no-console
        console.log(`      ${i + 1}. ${s.scheduledDate.toISOString().split('T')[0]} | AED ${s.interestAmount.toString().padStart(7)} | ${status}`);
      }
    });

    // Get payouts
    const payouts = await prisma.payout.findMany({
      where: { productPurchaseRequestId: contract.id },
      orderBy: { scheduledDate: 'asc' },
    });

    // eslint-disable-next-line no-console
    console.log(`\n   💰 Payouts Created: ${payouts.length}`);

    const byStatus = payouts.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(byStatus).forEach(([status, count]) => {
      const totalAmount = payouts
        .filter(p => p.status === status)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      // eslint-disable-next-line no-console
      console.log(`      - ${status}: ${count} (Total: AED ${totalAmount.toLocaleString()})`);
    });

    // Show next 3 upcoming payouts
    const upcomingPayouts = payouts
      .filter(p => p.status === 'PENDING' && new Date(p.scheduledDate) >= new Date())
      .slice(0, 3);

    if (upcomingPayouts.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`\n   📆 Next Upcoming Payouts:`);
      upcomingPayouts.forEach((p, i) => {
        // eslint-disable-next-line no-console
        console.log(`      ${i + 1}. ${p.scheduledDate.toISOString().split('T')[0]} | AED ${p.amount.toString().padStart(7)}`);
      });
    }
  }

  // Summary
  // eslint-disable-next-line no-console
  console.log('\n' + '='.repeat(80));
  // eslint-disable-next-line no-console
  console.log('📊 SUMMARY');
  // eslint-disable-next-line no-console
  console.log('='.repeat(80));

  const totalSchedules = await prisma.payoutSchedule.count({
    where: { clientId: client.id },
  });

  const totalPayouts = await prisma.payout.count({
    where: { clientId: client.id },
  });

  const totalExpectedInterest = await prisma.payoutSchedule.aggregate({
    where: { clientId: client.id },
    _sum: { interestAmount: true },
  });

  const totalPaidOut = await prisma.payout.aggregate({
    where: { clientId: client.id, status: 'COMPLETED' },
    _sum: { amount: true },
  });

  const totalPending = await prisma.payout.aggregate({
    where: { clientId: client.id, status: 'PENDING' },
    _sum: { amount: true },
  });

  // eslint-disable-next-line no-console
  console.log(`\n✅ Total Payout Schedules: ${totalSchedules}`);
  // eslint-disable-next-line no-console
  console.log(`✅ Total Payouts Created: ${totalPayouts}`);
  // eslint-disable-next-line no-console
  console.log(`✅ Total Expected Interest: AED ${Number(totalExpectedInterest._sum.interestAmount || 0).toLocaleString()}`);
  // eslint-disable-next-line no-console
  console.log(`💰 Total Paid Out (COMPLETED): AED ${Number(totalPaidOut._sum.amount || 0).toLocaleString()}`);
  // eslint-disable-next-line no-console
  console.log(`⏳ Total Pending: AED ${Number(totalPending._sum.amount || 0).toLocaleString()}`);

  // eslint-disable-next-line no-console
  console.log('\n✅ Verification Complete!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
