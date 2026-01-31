/**
 * Client - Portfolio Dashboard Component (Updated for Investment Product Model)
 * Displays investment portfolio summary with key metrics
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/dashboard/StatCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Activity,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionHistory } from './TransactionHistory';

interface InvestmentData {
  id: string;
  trackingNumber: string;
  investmentName: string;
  investmentDescription: string | null;
  amount: number;
  currency: string;
  duration: string;
  withdrawalFrequency: string;
  roi: number;
  annualReturn: number;
  status: string;
  contractStartDate: string | null;
  completedAt: string | null;
  createdAt: string;
  expectedAnnualInterest: number;
  expectedMonthlyInterest: number;
}

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  totalInterestEarned: number;
  expectedAnnualReturn: number;
  dayChange: number;
  dayChangePercent: number;
  activeInvestmentsCount: number;
}

interface PortfolioData {
  summary: PortfolioSummary;
  investments: InvestmentData[];
  client: {
    firstName: string;
    lastName: string;
  };
}

interface PortfolioResponse {
  success: boolean;
  data: {
    portfolio: PortfolioData | null;
    message?: string;
  };
  error?: string;
}

async function fetchPortfolio(): Promise<PortfolioResponse> {
  const response = await fetch('/api/client/portfolio');
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio data');
  }
  return response.json();
}

export function PortfolioDashboard() {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading portfolio data..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load portfolio data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.success || !data.data.portfolio) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {data?.data.message || 'No portfolio found. Make your first investment to create a portfolio.'}
        </AlertDescription>
      </Alert>
    );
  }

  const portfolio = data.data.portfolio;
  const summary = portfolio.summary;
  const isPositiveGain = summary.totalGainLoss >= 0;
  const isPositiveDayChange = summary.dayChange >= 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-georgia">
          Welcome back, {portfolio.client.firstName}
        </h2>
        <p className="text-muted-foreground font-georgia mt-1">
          Here&apos;s an overview of your investment portfolio
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Portfolio Value */}
        <StatCard
          title="Portfolio Value"
          value={
            <div className="flex items-center font-nums">
              <DirhamIcon className="w-5 h-5 mr-1" />
              {summary.totalValue >= 1000000
                ? `${(summary.totalValue / 1000000).toFixed(2)}M`
                : summary.totalValue >= 1000
                  ? `${(summary.totalValue / 1000).toFixed(1)}K`
                  : `${summary.totalValue.toFixed(0)}`
              }
            </div>
          }
          icon={DirhamIcon}
        />

        {/* Total Invested */}
        <StatCard
          title="Invested"
          value={
            <div className="flex items-center font-nums">
              <DirhamIcon className="w-5 h-5 mr-1" />
              {summary.totalInvested >= 1000000
                ? `${(summary.totalInvested / 1000000).toFixed(2)}M`
                : summary.totalInvested >= 1000
                  ? `${(summary.totalInvested / 1000).toFixed(1)}K`
                  : `${summary.totalInvested.toFixed(0)}`
              }
            </div>
          }
          icon={PiggyBank}
        />

        {/* Total Interest Earned */}
        <StatCard
          title="Interest Earned"
          value={
            <div className="flex items-center font-nums">
              {isPositiveGain ? '+' : ''}
              <DirhamIcon className="w-5 h-5 mx-1" />
              {Math.abs(summary.totalInterestEarned) >= 1000
                ? `${(summary.totalInterestEarned / 1000).toFixed(1)}K`
                : `${summary.totalInterestEarned.toFixed(0)}`
              }
            </div>
          }
          icon={isPositiveGain ? TrendingUp : TrendingDown}
          status={isPositiveGain ? "success" : "danger"}
          trend={isPositiveGain ? "up" : "down"}
          trendValue={`${summary.totalGainLossPercent.toFixed(1)}%`}
        />

        {/* Recent Payout */}
        <StatCard
          title="Latest Payout"
          value={
            <div className="flex items-center font-nums">
              {isPositiveDayChange ? '+' : ''}
              <DirhamIcon className="w-5 h-5 mx-1" />
              {Math.abs(summary.dayChange) >= 1000
                ? `${(summary.dayChange / 1000).toFixed(1)}K`
                : `${summary.dayChange.toFixed(0)}`
              }
            </div>
          }
          icon={Activity}
          status={isPositiveDayChange ? "success" : "info"}
          trend={isPositiveDayChange ? "up" : "down"}
          trendValue={`${summary.dayChangePercent.toFixed(2)}%`}
        />
      </div>

      {/* Expected Returns Card */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Expected Annual Returns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600 flex items-center font-nums">
              <DirhamIcon className="w-6 h-6 mr-2" />
              {summary.expectedAnnualReturn >= 1000
                ? `${(summary.expectedAnnualReturn / 1000).toFixed(1)}K`
                : summary.expectedAnnualReturn.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground">per year</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-nums">
            Based on {summary.activeInvestmentsCount} active investment{summary.activeInvestmentsCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Active Investments Table */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold font-optima text-gray-900 font-nums">
          Active Investments ({portfolio.investments.length})
        </h3>
        <Card className="border-gray-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Investment Plan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      ROI
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Annual Return
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Expected Interest
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolio.investments.map((investment) => (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm text-gray-900">
                          {investment.investmentName}
                        </div>
                        <div className="text-xs text-gray-500 font-nums">
                          {investment.trackingNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-nums flex items-center">
                          <DirhamIcon className="w-3 h-3 mr-1" />
                          {investment.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 font-nums">{investment.duration}</div>
                        <div className="text-xs text-gray-500 font-nums">{investment.withdrawalFrequency}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-blue-600 font-nums">
                          {investment.roi.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-green-600 font-nums">
                          {investment.annualReturn.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-nums flex items-center">
                          <DirhamIcon className="w-3 h-3 mr-1" />
                          {investment.expectedAnnualInterest.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </div>
                        <div className="text-xs text-gray-500">per year</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${investment.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                          {investment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold font-optima text-gray-900">Transaction History</h3>
        <TransactionHistory />
      </div>
    </div>
  );
}
