/**
 * Admin - Investment Plans List Page
 * View and manage all investment plans (Investment ranges and their options)
 */

import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { InvestmentPlansList } from '@/components/admin/InvestmentPlansList';
import { AddInvestmentOptionDialog } from '@/components/admin/AddInvestmentOptionDialog';

export const metadata: Metadata = {
  title: 'Investment Plans | Admin',
  description: 'Manage investment plans',
};

export default async function InvestmentPlansPage() {
  // Ensure user is admin
  await requireAdmin();

  // Fetch investment plans with their options
  const investments = await prisma.investment.findMany({
    orderBy: {
      displayOrder: 'asc',
    },
    include: {
      options: {
        orderBy: {
          displayOrder: 'asc',
        },
      },
      purchaseRequests: {
        where: {
          status: 'COMPLETED',
        },
        select: {
          id: true,
        },
      },
    },
  });

  // Serialize data for client component
  const serializedInvestments = investments.map((investment) => ({
    id: investment.id,
    name: investment.name,
    description: investment.description,
    minAmount: Number(investment.minAmount),
    maxAmount: investment.maxAmount ? Number(investment.maxAmount) : null,
    currency: investment.currency,
    displayOrder: investment.displayOrder,
    isActive: investment.isActive,
    createdAt: investment.createdAt.toISOString(),
    updatedAt: investment.updatedAt.toISOString(),
    completedPurchases: investment.purchaseRequests.length,
    options: investment.options.map((option) => ({
      ...option,
      roi: Number(option.roi),
      annualReturn: Number(option.annualReturn),
      createdAt: option.createdAt.toISOString(),
      updatedAt: option.updatedAt.toISOString(),
    })),
  }));

  // Prepare data for dialog
  const investmentsForDialog = serializedInvestments.map((inv) => ({
    id: inv.id,
    name: inv.name,
    minAmount: inv.minAmount,
    maxAmount: inv.maxAmount,
    currency: inv.currency,
  }));

  return (
    <div className="container px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">
              Investment Plans
            </h1>
            <p className="font-georgia mt-2 text-brand-grey">
              Manage investment plans and their options available on the platform
            </p>
          </div>
          {/* Add Investment Plan Button - Top Right */}
          <AddInvestmentOptionDialog investments={investmentsForDialog} />
        </div>
      </div>

      {/* Investment Plans List */}
      <InvestmentPlansList initialData={serializedInvestments} />
    </div>
  );
}
