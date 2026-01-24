/**
 * Debug ROI Calculation
 * Understand the relationship between ROI, Annual Return, and actual payouts
 */

import { prisma } from '@/lib/db/prisma';

async function debugROICalculation() {
  console.log('🔍 Debugging ROI Calculation Logic\n');

  const trackingNumber = 'PPR-20260118-IW879M';

  const contract = await prisma.productPurchaseRequest.findUnique({
    where: { trackingNumber },
    include: {
      investmentOption: true,
    },
  });

  if (!contract) {
    console.error('Contract not found!');
    return;
  }

  const principal = contract.amount.toNumber();
  const roi = contract.investmentOption.roi.toNumber();
  const annualReturn = contract.investmentOption.annualReturn.toNumber();
  const frequency = contract.investmentOption.withdrawalFrequency;
  const payoutsPerYear = frequency === 'Monthly' ? 12 : 4;
  const durationMatch = contract.investmentOption.duration.match(/(\d+)/);
  const durationYears = durationMatch ? parseInt(durationMatch[1]) : 1;
  const totalPayouts = durationYears * payoutsPerYear;

  console.log('📊 Input Values:');
  console.log(`   Principal: AED ${principal.toLocaleString()}`);
  console.log(`   ROI: ${roi}%`);
  console.log(`   Annual Return: ${annualReturn}%`);
  console.log(`   Frequency: ${frequency}`);
  console.log(`   Duration: ${durationYears} years`);
  console.log(`   Payouts per year: ${payoutsPerYear}`);
  console.log(`   Total payouts: ${totalPayouts}`);

  console.log('\n💡 CORRECT Formula (now used by system):');
  console.log(`   interestPerPayout = principal × (roiPerPeriod / 100)`);

  const correctFormula = (principal * roi) / 100;
  console.log(`   = ${principal.toLocaleString()} × (${roi} / 100)`);
  console.log(`   = ${principal.toLocaleString()} × ${(roi / 100).toFixed(4)}`);
  console.log(`   = AED ${correctFormula.toLocaleString()}`);

  const totalWithCorrect = correctFormula * totalPayouts;
  console.log(`\n   Total over ${durationYears} years: AED ${totalWithCorrect.toLocaleString()}`);
  console.log(`   Effective return: ${((totalWithCorrect / principal) * 100).toFixed(2)}%`);
  console.log(`   Effective annual return: ${((totalWithCorrect / principal / durationYears) * 100).toFixed(2)}%`);

  console.log('\n💡 Alternative: If ROI means % of principal per payout:');
  console.log(`   interestPerPayout = principal × (roi / 100)`);

  const altFormula1 = principal * (roi / 100);
  console.log(`   = ${principal.toLocaleString()} × ${roi / 100}`);
  console.log(`   = AED ${altFormula1.toLocaleString()}`);

  const totalWithAlt1 = altFormula1 * totalPayouts;
  console.log(`\n   Total over ${durationYears} years: AED ${totalWithAlt1.toLocaleString()}`);
  console.log(`   Effective return: ${((totalWithAlt1 / principal) * 100).toFixed(2)}%`);

  console.log('\n💡 Alternative: If Annual Return should drive calculation:');
  console.log(`   interestPerPayout = (principal × annualReturn) / (100 × payoutsPerYear)`);

  const altFormula2 = (principal * annualReturn) / (100 * payoutsPerYear);
  console.log(`   = (${principal} × ${annualReturn}) / (100 × ${payoutsPerYear})`);
  console.log(`   = AED ${altFormula2.toLocaleString()}`);

  const totalWithAlt2 = altFormula2 * totalPayouts;
  console.log(`\n   Total over ${durationYears} years: AED ${totalWithAlt2.toLocaleString()}`);
  console.log(`   Effective return: ${((totalWithAlt2 / principal) * 100).toFixed(2)}%`);
  console.log(`   Effective annual return: ${((totalWithAlt2 / principal / durationYears) * 100).toFixed(2)}%`);

  console.log('\n' + '='.repeat(80));
  console.log('📝 ANALYSIS:');
  console.log('');
  console.log('CORRECT APPROACH:');
  console.log('The ROI field should contain the per-period ROI:');
  console.log(`  - For Monthly payouts: ${roi}% monthly ROI`);
  console.log(`  - For Quarterly payouts: ${roi}% quarterly ROI`);
  console.log('');
  console.log('Formula: Payout = Principal × (ROI per period / 100)');
  console.log(`  Result: AED ${correctFormula.toLocaleString()} per ${frequency === 'Monthly' ? 'month' : 'quarter'}`);
  console.log(`  Total over ${durationYears} years: AED ${totalWithCorrect.toLocaleString()}`);
  console.log(`  Effective annual return: ${((totalWithCorrect / principal / durationYears) * 100).toFixed(2)}%`);
  console.log('');
  console.log('The Annual Return field is used for display/marketing purposes.');
  console.log('It should reflect the total annual return if calculated correctly.');
  console.log('='.repeat(80));
}

debugROICalculation()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
