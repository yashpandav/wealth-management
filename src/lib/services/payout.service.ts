/**
 * Payout Service
 * Handles payout schedule generation and interest calculation
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { addMonths, addDays, endOfMonth, startOfMonth } from 'date-fns';

/**
 * Generate all payout schedules for a completed contract
 * Called when DocAdmin completes a ProductPurchaseRequest with contract
 */
export async function generatePayoutSchedules(
  productPurchaseRequestId: string
): Promise<void> {
  // Fetch the contract details
  const contract = await prisma.productPurchaseRequest.findUnique({
    where: { id: productPurchaseRequestId },
    include: {
      investmentOption: true,
      investment: true,
      client: true,
    },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (contract.status !== 'COMPLETED') {
    throw new Error('Contract must be completed before generating payout schedules');
  }

  if (!contract.contractStartDate) {
    throw new Error('Contract start date is required');
  }

  if (!contract.payoutWindow) {
    throw new Error('Payout window is required');
  }

  // Parse duration (e.g., "1 Year", "2 Years" → 1, 2)
  const durationMatch = contract.investmentOption.duration.match(/(\d+)\s*Year/i);
  if (!durationMatch) {
    throw new Error('Invalid duration format');
  }
  const durationYears = parseInt(durationMatch[1], 10);

  // Determine number of payouts based on frequency
  const frequency = contract.investmentOption.withdrawalFrequency;
  const payoutsPerYear = frequency === 'Monthly' ? 12 : 4; // Monthly = 12, Quarterly = 4
  const totalPayouts = durationYears * payoutsPerYear;

  // Calculate interest per payout using Annual Return (not ROI)
  // Annual Return is the advertised rate shown to clients
  const principalAmount = contract.amount;
  const annualReturn = contract.investmentOption.annualReturn;
  const interestPerPayout = (principalAmount.toNumber() * annualReturn.toNumber()) / (100 * payoutsPerYear);

  const schedules: Prisma.PayoutScheduleCreateManyInput[] = [];
  const startDate = new Date(contract.contractStartDate);

  for (let i = 0; i < totalPayouts; i++) {
    let scheduledDate: Date;
    let periodStart: Date;
    let periodEnd: Date;

    if (frequency === 'Monthly') {
      // Monthly frequency
      const monthOffset = i + 1; // Start from month 1
      const payoutMonth = addMonths(startDate, monthOffset);

      if (contract.payoutWindow === '1-15') {
        // Payout on 15th of the month
        scheduledDate = new Date(payoutMonth.getFullYear(), payoutMonth.getMonth(), 15);
      } else {
        // Payout on last day of the month
        scheduledDate = endOfMonth(payoutMonth);
      }

      // Period is the previous month
      periodStart = addMonths(startDate, i);
      periodEnd = addDays(addMonths(startDate, monthOffset), -1);
    } else {
      // Quarterly frequency
      const quarterOffset = (i + 1) * 3; // 3, 6, 9, 12, ...
      const payoutMonth = addMonths(startDate, quarterOffset);

      if (contract.payoutWindow === '1-15') {
        scheduledDate = new Date(payoutMonth.getFullYear(), payoutMonth.getMonth(), 15);
      } else {
        scheduledDate = endOfMonth(payoutMonth);
      }

      // Period is the previous 3 months
      periodStart = addMonths(startDate, i * 3);
      periodEnd = addDays(addMonths(startDate, quarterOffset), -1);
    }

    schedules.push({
      id: undefined as any, // Let Prisma generate
      productPurchaseRequestId: contract.id,
      clientId: contract.clientId,
      scheduledDate,
      periodStart,
      periodEnd,
      interestAmount: new Prisma.Decimal(interestPerPayout.toFixed(2)),
      isProcessed: false,
    });
  }

  // Insert all schedules
  await prisma.payoutSchedule.createMany({
    data: schedules,
    skipDuplicates: true,
  });

  // Create audit log for schedule generation
  try {
    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM', // System-generated action
        action: 'PAYOUT_SCHEDULE_CREATED',
        entityType: 'PayoutSchedule',
        entityId: productPurchaseRequestId,
        description: `Generated ${schedules.length} payout schedules for contract ${contract.investmentOption.duration} (${frequency})`,
        metadata: {
          contractId: productPurchaseRequestId,
          clientId: contract.clientId,
          totalSchedules: schedules.length,
          frequency,
          payoutWindow: contract.payoutWindow,
          interestPerPayout,
          principalAmount: principalAmount.toNumber(),
          annualReturn: annualReturn.toNumber(),
          duration: contract.investmentOption.duration,
          investmentName: contract.investment.name,
        },
        ipAddress: 'system',
        userAgent: 'payout-service',
        severity: 'INFO',
        success: true,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log for payout schedule generation:', error);
    // Don't fail the operation if audit log creation fails
  }

  console.log(`Generated ${schedules.length} payout schedules for contract ${productPurchaseRequestId}`);
}

/**
 * Calculate payout date based on start date, frequency, window, and iteration
 */
export function calculatePayoutDate(
  startDate: Date,
  frequency: 'Monthly' | 'Quarterly',
  window: '1-15' | '16-30',
  iteration: number
): Date {
  const monthsToAdd = frequency === 'Monthly' ? iteration + 1 : (iteration + 1) * 3;
  const payoutMonth = addMonths(startDate, monthsToAdd);

  if (window === '1-15') {
    return new Date(payoutMonth.getFullYear(), payoutMonth.getMonth(), 15);
  } else {
    return endOfMonth(payoutMonth);
  }
}

/**
 * Calculate interest amount for a specific period
 */
export function calculateInterestAmount(
  principalAmount: number,
  roiPercentage: number,
  payoutsPerYear: number
): number {
  return (principalAmount * roiPercentage) / (100 * payoutsPerYear);
}

/**
 * Create Payout records from due PayoutSchedules
 * Called by cron job to create pending payouts for upcoming dates
 */
export async function createPendingPayouts(lookAheadDays: number = 3): Promise<number> {
  const today = new Date();
  const lookAheadDate = addDays(today, lookAheadDays);

  // Find all unprocessed schedules with scheduled date within the look-ahead window
  const dueSchedules = await prisma.payoutSchedule.findMany({
    where: {
      isProcessed: false,
      scheduledDate: {
        lte: lookAheadDate,
      },
    },
    include: {
      productPurchaseRequest: true,
      client: true,
    },
  });

  let createdCount = 0;

  for (const schedule of dueSchedules) {
    try {
      // Check if Payout already exists for this schedule
      const existingPayout = await prisma.payout.findUnique({
        where: { payoutScheduleId: schedule.id },
      });

      if (existingPayout) {
        // Already created, mark schedule as processed
        await prisma.payoutSchedule.update({
          where: { id: schedule.id },
          data: { isProcessed: true },
        });
        continue;
      }

      // Create Payout record
      const newPayout = await prisma.payout.create({
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

      // Mark schedule as processed
      await prisma.payoutSchedule.update({
        where: { id: schedule.id },
        data: { isProcessed: true },
      });

      // Create audit log for payout creation
      try {
        await prisma.auditLog.create({
          data: {
            userId: 'SYSTEM', // System-generated action (cron job)
            action: 'PAYOUT_CREATED',
            entityType: 'Payout',
            entityId: newPayout.id,
            description: `Created pending payout for client (${schedule.clientId}) - scheduled for ${schedule.scheduledDate.toLocaleDateString()}`,
            metadata: {
              payoutId: newPayout.id,
              payoutScheduleId: schedule.id,
              contractId: schedule.productPurchaseRequestId,
              clientId: schedule.clientId,
              amount: schedule.interestAmount.toNumber(),
              scheduledDate: schedule.scheduledDate.toISOString(),
              periodStart: schedule.periodStart.toISOString(),
              periodEnd: schedule.periodEnd.toISOString(),
            },
            ipAddress: 'system',
            userAgent: 'payout-cron-job',
            severity: 'INFO',
            success: true,
          },
        });
      } catch (error) {
        console.error('Failed to create audit log for payout creation:', error);
        // Don't fail the operation if audit log creation fails
      }

      createdCount++;
    } catch (error) {
      console.error(`Failed to create payout for schedule ${schedule.id}:`, error);
    }
  }

  console.log(`Created ${createdCount} pending payouts`);
  return createdCount;
}

/**
 * Complete a payout (called by DocAdmin after uploading receipt)
 */
export async function completePayout(
  payoutId: string,
  receiptDocumentId: string,
  processedById: string,
  notes?: string
): Promise<void> {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        client: {
          include: {
            user: true,
          },
        },
        productPurchaseRequest: {
          include: {
            investmentOption: true,
            investment: true,
          },
        },
      },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new Error('Payout is not in pending status');
    }

    // Create transaction for the payout
    const transaction = await prisma.transaction.create({
      data: {
        clientId: payout.clientId,
        type: 'INTEREST_PAYOUT',
        status: 'COMPLETED',
        amount: payout.amount,
        total: payout.amount,
        netAmount: payout.amount,
        currency: 'AED',
        completedAt: new Date(),
        notes: `Interest payout for period ${payout.periodStart.toISOString().split('T')[0]} to ${payout.periodEnd.toISOString().split('T')[0]}`,
      },
    });

    // Update payout with receipt and transaction
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        receiptDocumentId,
        transactionId: transaction.id,
        processedById,
        processedAt: new Date(),
        notes,
      },
    });

    // Create audit log for successful payout completion
    try {
      await prisma.auditLog.create({
        data: {
          userId: processedById,
          action: 'PAYOUT_COMPLETED',
          entityType: 'Payout',
          entityId: payoutId,
          description: `Completed payout for ${payout.client.user.firstName} ${payout.client.user.lastName} - ${payout.productPurchaseRequest.investment.name} (${payout.amount} AED)`,
          metadata: {
            payoutId,
            transactionId: transaction.id,
            receiptDocumentId,
            clientId: payout.clientId,
            clientName: `${payout.client.user.firstName} ${payout.client.user.lastName}`,
            clientEmail: payout.client.user.email,
            amount: payout.amount.toNumber(),
            currency: 'AED',
            periodStart: payout.periodStart.toISOString(),
            periodEnd: payout.periodEnd.toISOString(),
            scheduledDate: payout.scheduledDate.toISOString(),
            investmentName: payout.productPurchaseRequest.investment.name,
            notes: notes || null,
          },
          ipAddress: 'system',
          userAgent: 'payout-service',
          severity: 'INFO',
          success: true,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log for payout completion:', error);
      // Don't fail the operation if audit log creation fails
    }

    console.log(`Completed payout ${payoutId} with transaction ${transaction.id}`);
  } catch (error) {
    // Create audit log for failed payout completion
    try {
      await prisma.auditLog.create({
        data: {
          userId: processedById,
          action: 'PAYOUT_FAILED',
          entityType: 'Payout',
          entityId: payoutId,
          description: `Failed to complete payout ${payoutId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metadata: {
            payoutId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
          ipAddress: 'system',
          userAgent: 'payout-service',
          severity: 'ERROR',
          success: false,
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log for payout failure:', auditError);
    }

    // Re-throw the original error
    throw error;
  }
}

/**
 * Get pending payouts for a specific date range
 */
export async function getPendingPayouts(startDate?: Date, endDate?: Date) {
  const where: Prisma.PayoutWhereInput = {
    status: 'PENDING',
  };

  if (startDate || endDate) {
    where.scheduledDate = {};
    if (startDate) where.scheduledDate.gte = startDate;
    if (endDate) where.scheduledDate.lte = endDate;
  }

  return await prisma.payout.findMany({
    where,
    include: {
      client: {
        include: {
          user: true,
        },
      },
      productPurchaseRequest: {
        include: {
          investment: true,
          investmentOption: true,
        },
      },
    },
    orderBy: {
      scheduledDate: 'asc',
    },
  });
}

/**
 * Get payout history for a client
 */
export async function getClientPayouts(clientId: string) {
  return await prisma.payout.findMany({
    where: { clientId },
    include: {
      productPurchaseRequest: {
        include: {
          investment: true,
          investmentOption: true,
        },
      },
      receiptDocument: true,
      transaction: true,
    },
    orderBy: {
      scheduledDate: 'desc',
    },
  });
}

/**
 * Get total interest earned by a client
 */
export async function getClientTotalInterestEarned(clientId: string): Promise<number> {
  const completedPayouts = await prisma.payout.aggregate({
    where: {
      clientId,
      status: 'COMPLETED',
    },
    _sum: {
      amount: true,
    },
  });

  return completedPayouts._sum.amount?.toNumber() || 0;
}
