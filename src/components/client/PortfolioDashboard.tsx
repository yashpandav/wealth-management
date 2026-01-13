/**
 * Client - Portfolio Dashboard Component
 * Displays portfolio summary with key metrics
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
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { HoldingsTable, Holding } from './HoldingsTable';
import { AssetAllocationCharts } from './AssetAllocationCharts';
import { TransactionHistory } from './TransactionHistory';
import { PerformanceChart } from './PerformanceChart';

interface PortfolioData {
  id: string;
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  client: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  holdings: Holding[];
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
  const isPositiveGain = portfolio.totalGainLoss >= 0;
  const isPositiveDayChange = portfolio.dayChange >= 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-georgia">
          Welcome back, {portfolio.client.user.firstName}
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
              {portfolio.totalValue >= 1000000
                ? `${(portfolio.totalValue / 1000000).toFixed(2)}M`
                : portfolio.totalValue >= 1000
                  ? `${(portfolio.totalValue / 1000).toFixed(1)}K`
                  : `${portfolio.totalValue.toFixed(0)}`
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
              {portfolio.totalInvested >= 1000000
                ? `${(portfolio.totalInvested / 1000000).toFixed(2)}M`
                : portfolio.totalInvested >= 1000
                  ? `${(portfolio.totalInvested / 1000).toFixed(1)}K`
                  : `${portfolio.totalInvested.toFixed(0)}`
              }
            </div>
          }
          icon={PiggyBank}
        />

        {/* Total Gain/Loss */}
        <StatCard
          title="Gain/Loss"
          value={
            <div className="flex items-center font-nums">
              {isPositiveGain ? '+' : ''}
              <DirhamIcon className="w-5 h-5 mx-1" />
              {Math.abs(portfolio.totalGainLoss) >= 1000
                ? `${(portfolio.totalGainLoss / 1000).toFixed(1)}K`
                : `${portfolio.totalGainLoss.toFixed(0)}`
              }
            </div>
          }
          icon={isPositiveGain ? TrendingUp : TrendingDown}
          status={isPositiveGain ? "success" : "danger"}
          trend={isPositiveGain ? "up" : "down"}
          trendValue={`${portfolio.totalGainLossPercent.toFixed(1)}%`}
        />

        {/* Today's Change */}
        <StatCard
          title="Today"
          value={
            <div className="flex items-center font-nums">
              {isPositiveDayChange ? '+' : ''}
              <DirhamIcon className="w-5 h-5 mx-1" />
              {Math.abs(portfolio.dayChange) >= 1000
                ? `${(portfolio.dayChange / 1000).toFixed(1)}K`
                : `${portfolio.dayChange.toFixed(0)}`
              }
            </div>
          }
          icon={Activity}
          status={isPositiveDayChange ? "success" : "danger"}
          trend={isPositiveDayChange ? "up" : "down"}
          trendValue={`${portfolio.dayChangePercent.toFixed(1)}%`}
        />
      </div>

      {/* Performance Over Time */}
      <div className="mt-8">
        <PerformanceChart
          currentValue={portfolio.totalValue}
          totalInvested={portfolio.totalInvested}
        />
      </div>

      {/* Asset Allocation Charts */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold font-optima text-gray-900">Asset Allocation</h3>
        <AssetAllocationCharts holdings={portfolio.holdings} />
      </div>

      {/* Holdings Table */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold font-optima text-gray-900">Holdings</h3>
        <HoldingsTable holdings={portfolio.holdings} />
      </div>

      {/* Transaction History */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold font-optima text-gray-900">Transaction History</h3>
        <TransactionHistory />
      </div>
    </div>
  );
}
