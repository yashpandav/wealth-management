/**
 * Verify Payout Calculation
 * Check if payout amounts are calculated correctly based on ROI
 */

import { prisma } from '@/lib/db/prisma';

async function verifyPayoutCalculation() {
  console.log('🔍 Verifying Payout Calculation...\n');

  const trackingNumber = 'PPR-20260118-IW879M';

  const contract = await prisma.productPurchaseRequest.findUnique({
    where: { trackingNumber },
    include: {
      investment: true,
      investmentOption: true,
      payoutSchedules: {
        orderBy: { scheduledDate: 'asc' },
        take: 1,
      },
    },
  });

  if (!contract) {
    console.error('Contract not found!');
    return;
  }

  console.log('📊 Contract Details:');
  console.log('   Investment Name:', contract.investment.name);
  console.log('   Principal Amount:', `AED ${contract.amount}`);
  console.log('   Duration:', contract.investmentOption.duration);
  console.log('   Frequency:', contract.investmentOption.withdrawalFrequency);
  console.log('   ROI:', `${contract.investmentOption.roi}%`);
  console.log('   Annual Return:', `${contract.investmentOption.annualReturn}%`);

  console.log('\n🧮 Manual Calculation:');

  const principal = contract.amount.toNumber();
  const roi = contract.investmentOption.roi.toNumber();
  const annualReturn = contract.investmentOption.annualReturn.toNumber();
  const frequency = contract.investmentOption.withdrawalFrequency;
  const payoutsPerYear = frequency === 'Monthly' ? 12 : 4;

  console.log(`   Principal: AED ${principal.toLocaleString()}`);
  console.log(`   ROI: ${roi}%`);
  console.log(`   Annual Return: ${annualReturn}%`);
  console.log(`   Frequency: ${frequency} (${payoutsPerYear} payouts/year)`);

  // Calculate using ROI
  const interestPerPayoutUsingROI = (principal * roi) / (100 * payoutsPerYear);
  console.log(`\n   Using ROI (${roi}%):`);
  console.log(`   Formula: (${principal} × ${roi}) / (100 × ${payoutsPerYear})`);
  console.log(`   Result: AED ${interestPerPayoutUsingROI.toLocaleString()} per ${frequency === 'Monthly' ? 'month' : 'quarter'}`);

  // Calculate using Annual Return
  const interestPerPayoutUsingAnnualReturn = (principal * annualReturn) / (100 * payoutsPerYear);
  console.log(`\n   Using Annual Return (${annualReturn}%):`);
  console.log(`   Formula: (${principal} × ${annualReturn}) / (100 × ${payoutsPerYear})`);
  console.log(`   Result: AED ${interestPerPayoutUsingAnnualReturn.toLocaleString()} per ${frequency === 'Monthly' ? 'month' : 'quarter'}`);

  // Show actual payout amount
  if (contract.payoutSchedules[0]) {
    const actualAmount = contract.payoutSchedules[0].interestAmount.toNumber();
    console.log(`\n📋 Actual Payout Amount in Schedule:`);
    console.log(`   AED ${actualAmount.toLocaleString()}`);

    console.log(`\n✅ Verification:`);
    if (Math.abs(actualAmount - interestPerPayoutUsingROI) < 0.01) {
      console.log(`   ✓ Matches ROI calculation (${roi}%)`);
    } else if (Math.abs(actualAmount - interestPerPayoutUsingAnnualReturn) < 0.01) {
      console.log(`   ✓ Matches Annual Return calculation (${annualReturn}%)`);
    } else {
      console.log(`   ✗ MISMATCH! Actual amount doesn't match either calculation.`);
      console.log(`   Expected (ROI): AED ${interestPerPayoutUsingROI.toLocaleString()}`);
      console.log(`   Expected (Annual Return): AED ${interestPerPayoutUsingAnnualReturn.toLocaleString()}`);
      console.log(`   Actual: AED ${actualAmount.toLocaleString()}`);
      console.log(`   Difference: AED ${Math.abs(actualAmount - interestPerPayoutUsingROI).toLocaleString()}`);
    }
  }

  // Calculate total return over contract period
  const durationMatch = contract.investmentOption.duration.match(/(\d+)/);
  const durationYears = durationMatch ? parseInt(durationMatch[1]) : 1;
  const totalPayouts = durationYears * payoutsPerYear;
  const actualAmount = contract.payoutSchedules[0]?.interestAmount.toNumber() || 0;
  const totalReturn = actualAmount * totalPayouts;

  console.log(`\n💰 Total Return Calculation:`);
  console.log(`   Total Payouts: ${totalPayouts} (${durationYears} years × ${payoutsPerYear})`);
  console.log(`   Amount per Payout: AED ${actualAmount.toLocaleString()}`);
  console.log(`   Total Interest Earned: AED ${totalReturn.toLocaleString()}`);
  console.log(`   Total Amount Received: AED ${(principal + totalReturn).toLocaleString()}`);
  console.log(`   Effective Return: ${((totalReturn / principal) * 100).toFixed(2)}%`);

  console.log('\n' + '='.repeat(80));
  console.log('📝 EXPLANATION:');
  console.log('ROI = Interest rate per period (used for payout calculation)');
  console.log('Annual Return = Total return percentage shown to client');
  console.log('The system uses ROI to calculate individual payout amounts.');
  console.log('='.repeat(80));
}

verifyPayoutCalculation()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
