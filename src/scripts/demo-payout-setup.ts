#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              LIVE DEMO: PAYOUT FUNCTIONALITY SETUP SCRIPT                  ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Prepares your REAL production data for a live demo of payout              ║
 * ║  functionality WITHOUT waiting for the scheduled cron job.                 ║
 * ║                                                                            ║
 * ║  What it does:                                                             ║
 * ║  1. Lists all COMPLETED investment orders in the database                  ║
 * ║  2. Moves the next upcoming payout schedule date(s) to TODAY              ║
 * ║  3. Runs the cron job inline → creates PENDING Payout records             ║
 * ║  4. Shows demo walkthrough URLs                                           ║
 * ║                                                                            ║
 * ║  Usage:                                                                    ║
 * ║    pnpm demo:payout              (interactive menu)                        ║
 * ║    pnpm demo:payout:list         (list all contracts)                      ║
 * ║    pnpm demo:payout:all          (set up all contracts for demo)           ║
 * ║    pnpm demo:payout:status       (show pending payouts)                    ║
 * ║    pnpm demo:payout:cron         (only run cron job inline)               ║
 * ║    pnpm demo:payout:reset        (undo date changes)                       ║
 * ║                                                                            ║
 * ║  Or directly:                                                              ║
 * ║    npx tsx src/scripts/demo-payout-setup.ts [list|all|status|reset|<id>] ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Load env vars from .env.local BEFORE any other imports
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
loadEnv({ path: resolve(process.cwd(), '.env.local') });
loadEnv({ path: resolve(process.cwd(), '.env') });

import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { addDays } from 'date-fns';
import * as readline from 'readline';

// ── Prisma client (with PrismaPg adapter, same as the app) ────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

// ── Color helpers ─────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
};

const log = (msg: string, color = c.reset) => console.log(`${color}${msg}${c.reset}`);
const ok = (msg: string) => log(`${msg}`, c.green);
const warn = (msg: string) => log(`${msg}`, c.yellow);
const err = (msg: string) => log(`${msg}`, c.red);
const step = (n: number, msg: string) => log(`\n${c.bold}${c.blue}[STEP ${n}]${c.reset} ${c.bold}${msg}${c.reset}`);
const info = (msg: string) => log(`  ℹ  ${msg}`, c.cyan);
const hr = () => console.log(`${c.dim}${'─'.repeat(76)}${c.reset}`);

function header(title: string) {
  const pad = ' '.repeat(Math.max(0, 72 - title.length));
  console.log('\n');
  console.log(`${c.bold}${c.bgBlue}  ${'═'.repeat(72)}  ${c.reset}`);
  console.log(`${c.bold}${c.bgBlue}    ${title}${pad}  ${c.reset}`);
  console.log(`${c.bold}${c.bgBlue}  ${'═'.repeat(72)}  ${c.reset}\n`);
}

function fmtAed(n: number | string | Prisma.Decimal) {
  return `AED ${Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(`${c.yellow}${question}${c.reset}`, ans => { rl.close(); resolve(ans.trim()); }));
}

// ── Inline createPendingPayouts (mirrors payout.service.ts but uses bare PrismaClient) ──
async function createPendingPayoutsInline(lookAheadDays: number = 3): Promise<number> {
  const today = new Date();
  const lookAheadDate = addDays(today, lookAheadDays);

  const dueSchedules = await prisma.payoutSchedule.findMany({
    where: { isProcessed: false, scheduledDate: { lte: lookAheadDate } },
    include: { productPurchaseRequest: true, client: true },
  });

  let createdCount = 0;

  for (const schedule of dueSchedules) {
    try {
      const existingPayout = await prisma.payout.findUnique({
        where: { payoutScheduleId: schedule.id },
      });

      if (existingPayout) {
        await prisma.payoutSchedule.update({ where: { id: schedule.id }, data: { isProcessed: true } });
        continue;
      }

      await prisma.payout.create({
        data: {
          productPurchaseRequestId: schedule.productPurchaseRequestId,
          payoutScheduleId: schedule.id,
          clientId: schedule.clientId,
          amount: schedule.interestAmount,
          periodStart: schedule.periodStart,
          periodEnd: schedule.periodEnd,
          scheduledDate: schedule.scheduledDate,
          status: 'PENDING',
        },
      });

      await prisma.payoutSchedule.update({ where: { id: schedule.id }, data: { isProcessed: true } });
      createdCount++;
    } catch (e) {
      console.error(`Failed for schedule ${schedule.id}:`, e);
    }
  }

  return createdCount;
}

async function fetchContracts() {
  return prisma.productPurchaseRequest.findMany({
    where: { status: 'COMPLETED' },
    include: {
      client: { include: { user: true } },
      investmentOption: true,
      investment: true,
      payoutSchedules: { orderBy: { scheduledDate: 'asc' } },
    },
    orderBy: { completedAt: 'desc' },
  });
}


async function cmdList() {
  header('COMPLETED INVESTMENT CONTRACTS');

  const contracts = await fetchContracts();

  if (contracts.length === 0) {
    warn('No COMPLETED investment contracts found.');
    warn('Complete a purchase request in DocAdmin first, then run this script.');
    return;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  log(`  Found ${c.bold}${contracts.length}${c.reset} completed contract(s):\n`);

  contracts.forEach((contract, idx) => {
    const user = contract.client.user;
    const unprocessed = contract.payoutSchedules.filter(s => !s.isProcessed);
    const processed = contract.payoutSchedules.filter(s => s.isProcessed);
    const next = unprocessed[0];

    log(`${c.bold}${c.cyan}  [${idx + 1}] ${contract.trackingNumber}${c.reset}`);
    log(`       Client    : ${user.firstName} ${user.lastName} (${user.email})`);
    log(`       Investment: ${contract.investment.name}  |  ${fmtAed(contract.amount)}`);
    log(`       Frequency : ${contract.investmentOption.withdrawalFrequency}  |  Duration: ${contract.investmentOption.duration}  |  ROI: ${contract.investmentOption.roi}%`);
    log(`       Schedules : ${processed.length}/${contract.payoutSchedules.length} processed`);

    if (next) {
      const days = Math.floor((new Date(next.scheduledDate).getTime() - today.getTime()) / 86400000);
      const label =
        days < 0 ? `${c.red}OVERDUE (${Math.abs(days)}d)${c.reset}` :
          days === 0 ? `${c.green}TODAY${c.reset}` :
            days === 1 ? `${c.green}Tomorrow${c.reset}` :
              `${c.yellow}in ${days} days${c.reset}`;
      log(`       Next Payout: ${c.bold}${fmtDate(next.scheduledDate)}${c.reset} (${label}) — ${fmtAed(next.interestAmount)}`);
    } else {
      log(`       Next Payout: ${c.dim}All schedules processed${c.reset}`);
    }
    log('');
  });

  hr();
  log(`  ${c.bold}To demo a specific contract:${c.reset}  pnpm demo:payout <trackingNumber>`);
  log(`  ${c.bold}To demo all contracts:${c.reset}        pnpm demo:payout:all`);
}

async function cmdSetupDemo(targetIds: string[] | 'all') {
  header('🚀  LIVE DEMO — PAYOUT SETUP');

  const allContracts = await fetchContracts();

  if (allContracts.length === 0) {
    err('No COMPLETED investment contracts found. Cannot set up demo.');
    return;
  }

  const targets = targetIds === 'all'
    ? allContracts.filter(c => c.payoutSchedules.some(s => !s.isProcessed))
    : allContracts.filter(c =>
      targetIds.includes(c.id) || targetIds.includes(c.trackingNumber)
    );

  if (targets.length === 0) {
    err('No matching contracts found, or all selected contracts have no pending schedules.');
    log('\n  Available tracking numbers:');
    allContracts.forEach(c => log(`    • ${c.trackingNumber}`));
    return;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);

  step(1, `Moving payout dates to today for ${targets.length} contract(s)`);

  for (const contract of targets) {
    const unprocessed = contract.payoutSchedules
      .filter(s => !s.isProcessed)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    if (unprocessed.length === 0) {
      warn(`${contract.trackingNumber} — no unprocessed schedules, skipping`);
      continue;
    }

    if (unprocessed.length >= 3) {
      await prisma.payoutSchedule.update({ where: { id: unprocessed[0].id }, data: { scheduledDate: twoDaysAgo } });
      await prisma.payoutSchedule.update({ where: { id: unprocessed[1].id }, data: { scheduledDate: yesterday } });
      await prisma.payoutSchedule.update({ where: { id: unprocessed[2].id }, data: { scheduledDate: today } });
      ok(`${contract.trackingNumber} → 2 overdue + 1 due today`);
    } else if (unprocessed.length === 2) {
      await prisma.payoutSchedule.update({ where: { id: unprocessed[0].id }, data: { scheduledDate: yesterday } });
      await prisma.payoutSchedule.update({ where: { id: unprocessed[1].id }, data: { scheduledDate: today } });
      ok(`${contract.trackingNumber} → 1 overdue + 1 due today`);
    } else {
      await prisma.payoutSchedule.update({ where: { id: unprocessed[0].id }, data: { scheduledDate: today } });
      ok(`${contract.trackingNumber} → 1 due today`);
    }
  }

  step(2, 'Removing stale PENDING payout records from previous runs');

  for (const contract of targets) {
    const deleted = await prisma.payout.deleteMany({
      where: { productPurchaseRequestId: contract.id, status: 'PENDING' },
    });

    await prisma.payoutSchedule.updateMany({
      where: { productPurchaseRequestId: contract.id, isProcessed: true, payout: null },
      data: { isProcessed: false },
    });

    if (deleted.count > 0) info(`Removed ${deleted.count} stale payout(s) for ${contract.trackingNumber}`);
  }

  step(3, 'Running the payout generation cron job inline (look-ahead: 3 days)');
  const created = await createPendingPayoutsInline(3);
  ok(`Cron complete → ${c.bold}${created}${c.reset}${c.green} PENDING payout record(s) created`);

  step(4, 'PENDING payouts now visible to DocAdmin');

  const pendingPayouts = await prisma.payout.findMany({
    where: { status: 'PENDING', productPurchaseRequestId: { in: targets.map(t => t.id) } },
    include: {
      client: { include: { user: true } },
      productPurchaseRequest: { include: { investment: true, investmentOption: true } },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  if (pendingPayouts.length === 0) {
    warn('No PENDING payouts created. Check that payout schedules were moved to today.');
  } else {
    log(`\n  ${c.bold}${pendingPayouts.length} payout(s) ready:${c.reset}\n`);
    pendingPayouts.forEach((p, i) => {
      const user = p.client.user;
      const days = Math.floor((new Date(p.scheduledDate).getTime() - today.getTime()) / 86400000);
      const tag =
        days < 0 ? `${c.red}OVERDUE (${Math.abs(days)}d ago)${c.reset}` :
          days === 0 ? `${c.green}DUE TODAY${c.reset}` :
            `${c.yellow}in ${days}d${c.reset}`;

      log(`  ${i + 1}. ${c.bold}${user.firstName} ${user.lastName}${c.reset}`);
      log(`     Amount  : ${c.bold}${fmtAed(p.amount)}${c.reset}  →  ${tag}`);
      log(`     Schedule: ${fmtDate(p.scheduledDate)}  |  Period: ${fmtDate(p.periodStart)} → ${fmtDate(p.periodEnd)}`);
      log(`     Contract: ${p.productPurchaseRequest.trackingNumber}  |  ${p.productPurchaseRequest.investmentOption.withdrawalFrequency}`);
      log('');
    });
  }

  step(5, 'Live Demo Walkthrough');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  log(`\n  ${c.bold}${c.bgGreen}  DEMO SCRIPT  ${c.reset}\n`);
  log(`  ${c.bold}1. DocAdmin → Payouts Dashboard${c.reset}`);
  log(`     ${c.cyan}${appUrl}/docadmin/payouts${c.reset}`);
  log(`     DocAdmin sees ${pendingPayouts.length} pending payout(s). Upload a receipt to complete.\n`);

  log(`  ${c.bold}2. Client → Payout History${c.reset}`);
  log(`     ${c.cyan}${appUrl}/client/payouts${c.reset}`);
  log(`     Client sees payout history. After DocAdmin completes, status updates here.\n`);

  log(`  ${c.bold}3. Client → Portfolio${c.reset}`);
  log(`     ${c.cyan}${appUrl}/client/portfolio${c.reset}`);
  log(`     Portfolio balance & interest earned updates after completion.\n`);

  log(`  ${c.bold}4. Trigger cron from browser (no auth needed for demo):${c.reset}`);
  log(`     GET  ${c.cyan}${appUrl}/api/demo/payout-trigger${c.reset}  — check status`);
  log(`     POST ${c.cyan}${appUrl}/api/demo/payout-trigger${c.reset}  — run cron\n`);

  hr();
  log(`\n  ${c.yellow}${c.bold}When done, reset with:${c.reset}  pnpm demo:payout:reset\n`);
}

async function cmdRunCron() {
  header('⚙️   RUN PAYOUT CRON JOB (inline)');

  const today = new Date();
  const lah = addDays(today, 3);

  const due = await prisma.payoutSchedule.count({
    where: { isProcessed: false, scheduledDate: { lte: lah } },
  });

  info(`Found ${due} unprocessed schedule(s) due by ${fmtDate(lah)}`);

  const created = await createPendingPayoutsInline(3);
  ok(`Created ${created} PENDING payout record(s)`);

  await cmdStatus();
}

async function cmdStatus() {
  header('📊  CURRENT PAYOUT STATUS');

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [_pending, completed, overdue, upcoming] = await Promise.all([
    prisma.payout.count({ where: { status: 'PENDING' } }),
    prisma.payout.count({ where: { status: 'COMPLETED' } }),
    prisma.payout.count({ where: { status: 'PENDING', scheduledDate: { lt: today } } }),
    prisma.payout.count({ where: { status: 'PENDING', scheduledDate: { gte: today } } }),
  ]);

  const unprocessedSchedules = await prisma.payoutSchedule.count({ where: { isProcessed: false } });

  log(`\n  ${c.bold}Summary${c.reset}`);
  log(`    ${c.yellow}⏳ Pending (upcoming) : ${upcoming}${c.reset}`);
  log(`    ${c.red}❗ Overdue            : ${overdue}${c.reset}`);
  log(`    ${c.green}✅ Completed          : ${completed}${c.reset}`);
  log(`    ${c.dim}📅 Unprocessed sched. : ${unprocessedSchedules}${c.reset}`);

  const list = await prisma.payout.findMany({
    where: { status: 'PENDING' },
    include: {
      client: { include: { user: true } },
      productPurchaseRequest: { include: { investment: true } },
    },
    orderBy: { scheduledDate: 'asc' },
    take: 20,
  });

  if (list.length > 0) {
    log(`\n  ${c.bold}Pending Payouts:${c.reset}\n`);
    list.forEach((p, i) => {
      const user = p.client.user;
      const days = Math.floor((new Date(p.scheduledDate).getTime() - today.getTime()) / 86400000);
      const tag =
        days < 0 ? `${c.red}OVERDUE${c.reset}` :
          days === 0 ? `${c.green}TODAY${c.reset}` :
            `${c.yellow}in ${days}d${c.reset}`;
      log(`  ${i + 1}. ${user.firstName} ${user.lastName}  |  ${fmtAed(p.amount)}  |  ${fmtDate(p.scheduledDate)}  [${tag}]`);
    });
  } else {
    warn('No PENDING payouts. Run demo setup first.');
  }
  log('');
}

async function cmdReset() {
  header(' RESET — RESTORE ORIGINAL PAYOUT DATES');

  const ans = await prompt('  This will DELETE all PENDING payout records (not COMPLETED). Continue? [y/N]: ');
  if (ans.toLowerCase() !== 'y') { log('\n  Aborted.', c.yellow); return; }

  step(1, 'Deleting all PENDING payout records');
  const del = await prisma.payout.deleteMany({ where: { status: 'PENDING' } });
  ok(`Deleted ${del.count} pending payout record(s)`);

  step(2, 'Resetting payout schedules linked to deleted payments to unprocessed');
  const reset = await prisma.payoutSchedule.updateMany({
    where: { isProcessed: true, payout: null },
    data: { isProcessed: false },
  });
  ok(`Reset ${reset.count} schedule(s) to unprocessed`);

  step(3, 'Restoring schedule dates to correct calculated values');

  const contracts = await prisma.productPurchaseRequest.findMany({
    where: { status: 'COMPLETED', contractStartDate: { not: null } },
    include: { investmentOption: true, payoutSchedules: { orderBy: { scheduledDate: 'asc' } } },
  });

  let restored = 0;

  for (const contract of contracts) {
    if (!contract.contractStartDate || !contract.payoutWindow) continue;

    const isMonthly = contract.investmentOption.withdrawalFrequency === 'Monthly';
    const start = new Date(contract.contractStartDate);
    const unproc = contract.payoutSchedules.filter(s => !s.isProcessed);

    for (let i = 0; i < unproc.length; i++) {
      const schedule = unproc[i];
      const idxInAll = contract.payoutSchedules.findIndex(s => s.id === schedule.id);
      const months = isMonthly ? idxInAll + 1 : (idxInAll + 1) * 3;

      const targetMonth = new Date(start);
      targetMonth.setMonth(start.getMonth() + months);

      const correctDate = contract.payoutWindow === '1-15'
        ? new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 15)
        : new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0); // last day

      const curr = new Date(schedule.scheduledDate);
      const differs =
        correctDate.getFullYear() !== curr.getFullYear() ||
        correctDate.getMonth() !== curr.getMonth() ||
        correctDate.getDate() !== curr.getDate();

      if (differs) {
        await prisma.payoutSchedule.update({ where: { id: schedule.id }, data: { scheduledDate: correctDate } });
        restored++;
      }
    }
  }

  ok(`Restored ${restored} schedule date(s) to their calculated values`);
  log(`\n  ${c.bold}${c.green}Reset complete!${c.reset} Database is back to original state.\n`);
}

async function cmdInteractive() {
  header('PAYOUT DEMO SETUP — INTERACTIVE MODE');

  const contracts = await fetchContracts();

  if (contracts.length === 0) {
    err('No COMPLETED contracts found. Complete a purchase request in DocAdmin first.');
    return;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  log(`  Found ${c.bold}${contracts.length}${c.reset} completed contract(s):\n`);

  contracts.forEach((contract, idx) => {
    const user = contract.client.user;
    const unproc = contract.payoutSchedules.filter(s => !s.isProcessed);
    const next = unproc[0];
    const nextLabel = next ? `${fmtDate(next.scheduledDate)} — ${fmtAed(next.interestAmount)}` : '(all done)';
    log(`  ${c.bold}[${idx + 1}]${c.reset} ${contract.trackingNumber}`);
    log(`       ${user.firstName} ${user.lastName} | ${fmtAed(contract.amount)} | ${contract.investmentOption.withdrawalFrequency}`);
    log(`       Next: ${nextLabel}\n`);
  });

  log(`  ${c.bold}[A]${c.reset} Setup ALL contracts for demo`);
  log(`  ${c.bold}[S]${c.reset} Show current status`);
  log(`  ${c.bold}[R]${c.reset} Reset / undo date changes`);
  log(`  ${c.bold}[Q]${c.reset} Quit\n`);

  const ans = await prompt('  Enter contract number(s) (e.g. 1,3), A, S, R or Q: ');

  if (!ans || ans.toLowerCase() === 'q') { log('\n  Bye!', c.cyan); return; }
  if (ans.toLowerCase() === 's') { await cmdStatus(); return; }
  if (ans.toLowerCase() === 'r') { await cmdReset(); return; }
  if (ans.toLowerCase() === 'a') { await cmdSetupDemo('all'); return; }

  const nums = ans.split(/[\s,]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  const selected = nums.map(n => contracts[n - 1]).filter(Boolean);

  if (selected.length === 0) { err('Invalid selection.'); return; }
  await cmdSetupDemo(selected.map(s => s.id));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const arg = process.argv[2];
  try {
    if (!arg) await cmdInteractive();
    else if (arg === 'list') await cmdList();
    else if (arg === 'all') await cmdSetupDemo('all');
    else if (arg === 'run-cron') await cmdRunCron();
    else if (arg === 'status') await cmdStatus();
    else if (arg === 'reset') await cmdReset();
    else await cmdSetupDemo([arg]);
  } catch (error) {
    err('Script failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();