/**
 * Simple script to test cron jobs directly
 * Run with: npx tsx src/scripts/test-cron-jobs.ts
 */

import {
  dailyPayoutGenerationJob,
  payoutReminder15thJob,
  payoutReminderMonthEndJob
} from '@/lib/cron/payout-jobs';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.cyan}  CRON JOBS TEST${colors.reset}`);
  console.log('='.repeat(80) + '\n');

  try {
    // Test 1: Daily Payout Generation
    console.log(`${colors.yellow}1. Testing Daily Payout Generation Job...${colors.reset}`);
    await dailyPayoutGenerationJob();
    console.log(`${colors.green}   ✓ Daily payout generation completed${colors.reset}\n`);

    // Test 2: 15th Reminder
    console.log(`${colors.yellow}2. Testing 15th Reminder Job...${colors.reset}`);
    const today = new Date();
    const dayOfMonth = today.getDate();

    if (dayOfMonth === 14) {
      await payoutReminder15thJob();
      console.log(`${colors.green}   ✓ 15th reminder completed (today is 14th)${colors.reset}\n`);
    } else {
      console.log(`${colors.cyan}   ⊘ Skipped (today is ${dayOfMonth}th, not 14th)${colors.reset}\n`);
    }

    // Test 3: Month-End Reminder
    console.log(`${colors.yellow}3. Testing Month-End Reminder Job...${colors.reset}`);

    if (dayOfMonth === 29) {
      await payoutReminderMonthEndJob();
      console.log(`${colors.green}   ✓ Month-end reminder completed (today is 29th)${colors.reset}\n`);
    } else {
      console.log(`${colors.cyan}   ⊘ Skipped (today is ${dayOfMonth}th, not 29th)${colors.reset}\n`);
    }

    console.log(`${colors.green}✅ All cron job tests completed successfully!${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Test failed:${colors.reset}`, error);
    process.exit(1);
  }
}

main();
