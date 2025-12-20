/**
 * Admin - Withdrawal Request Approval API
 * Final approval or rejection of withdrawal request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { WithdrawalStatus, AuditAction, TransactionType, TransactionStatus, Prisma } from '@prisma/client';
import { adminWithdrawalApprovalSchema } from '@/lib/validation/withdrawal-request.validation';
import {
  sendWithdrawalRequestApprovedEmail,
  sendWithdrawalRequestRejectedEmail,
} from '@/lib/email/email.service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin authorization
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Validate request body
    const validation = adminWithdrawalApprovalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Fetch the withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            portfolio: true,
          },
        },
      },
    });

    if (!withdrawalRequest) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Can only approve/reject requests in RM_APPROVED or ADMIN_REVIEW status
    if (
      withdrawalRequest.status !== WithdrawalStatus.RM_APPROVED &&
      withdrawalRequest.status !== WithdrawalStatus.ADMIN_REVIEW
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot process request with status: ${withdrawalRequest.status}`,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const clientName = `${withdrawalRequest.client.user.firstName} ${withdrawalRequest.client.user.lastName}`;
    const { trackingNumber, amount, clientId } = withdrawalRequest;

    // Prepare update data based on decision
    const updateData = {
      approvedByAdminId: session.user.id,
      adminProcessedAt: now,
      adminNotes: data.adminNotes,
      ...(data.decision === 'APPROVE'
        ? {
            status: WithdrawalStatus.ADMIN_APPROVED,
            adminApproved: true,
            paymentReference: data.paymentReference || null,
          }
        : {
            status: WithdrawalStatus.ADMIN_REJECTED,
            adminApproved: false,
            rejectionReason: data.adminNotes,
            rejectedBy: 'ADMIN',
            rejectedAt: now,
          }),
    };

    // If approved, create a transaction and update portfolio
    let transaction = null;
    if (data.decision === 'APPROVE') {
      // Check portfolio balance again
      if (!withdrawalRequest.client.portfolio) {
        return NextResponse.json(
          {
            success: false,
            error: 'Client has no portfolio',
          },
          { status: 400 }
        );
      }
      const portfolioValue = Number(withdrawalRequest.client.portfolio.totalValue);
      if (Number(amount) > portfolioValue) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient portfolio balance. Available: ${portfolioValue.toFixed(2)}, Requested: ${Number(amount).toFixed(2)}`,
          },
          { status: 400 }
        );
      }

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update withdrawal request
        await tx.withdrawalRequest.update({
          where: { id },
          data: updateData,
        });

        // Create transaction record
        const newTransaction = await tx.transaction.create({
          data: {
            clientId,
            type: TransactionType.WITHDRAWAL,
            amount: withdrawalRequest.amount,
            total: withdrawalRequest.amount,
            netAmount: withdrawalRequest.amount,
            status: TransactionStatus.COMPLETED,
            completedAt: now,
            metadata: JSON.stringify({
              withdrawalRequestId: id,
              trackingNumber,
              adminNotes: data.adminNotes,
              paymentReference: data.paymentReference,
              processedBy: session.user.id,
            }),
          },
        });

        // Update portfolio - deduct withdrawal amount
        await tx.portfolio.update({
          where: { clientId },
          data: {
            totalValue: {
              decrement: withdrawalRequest.amount,
            },
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: AuditAction.WITHDRAWAL_REQUEST_ADMIN_APPROVE,
            entityType: 'WithdrawalRequest',
            entityId: id,
            metadata: JSON.stringify({
              trackingNumber,
              clientId,
              clientName,
              amount: Number(amount),
              adminNotes: data.adminNotes,
              paymentReference: data.paymentReference,
              transactionId: newTransaction.id,
            }),
          },
        });

        return { newTransaction };
      });

      transaction = result.newTransaction;

      // Send approval email to client
      await sendWithdrawalRequestApprovedEmail(
        withdrawalRequest.client.user.email,
        withdrawalRequest.client.user.firstName,
        trackingNumber,
        Number(amount),
        'USD',
        withdrawalRequest.bankName,
        withdrawalRequest.bankAccountNumber
      );
    } else {
      // REJECT - just update the request and log
      await prisma.withdrawalRequest.update({
        where: { id },
        data: updateData,
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: AuditAction.WITHDRAWAL_REQUEST_ADMIN_REJECT,
          entityType: 'WithdrawalRequest',
          entityId: id,
          metadata: JSON.stringify({
            trackingNumber,
            clientId,
            clientName,
            amount: Number(amount),
            adminNotes: data.adminNotes,
          }),
        },
      });

      // Send rejection email to client
      await sendWithdrawalRequestRejectedEmail(
        withdrawalRequest.client.user.email,
        withdrawalRequest.client.user.firstName,
        trackingNumber,
        Number(amount),
        'USD',
        'Administrator',
        data.adminNotes
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message:
          data.decision === 'APPROVE'
            ? 'Withdrawal request approved and processed successfully'
            : 'Withdrawal request rejected',
        trackingNumber,
        transaction: transaction
          ? {
              id: transaction.id,
              amount: Number(transaction.amount),
              status: transaction.status,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error processing admin approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
