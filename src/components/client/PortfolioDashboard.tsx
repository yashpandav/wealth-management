/**
 * Client - Portfolio Dashboard Component
 * Displays portfolio summary with key metrics
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Activity,
  AlertCircle,
  Loader2,
} from 'lucide-react';
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
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading portfolio data...</span>
      </div>
    );
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
        <h2 className="text-2xl font-semibold">
          Welcome back, {portfolio.client.user.firstName}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your investment portfolio
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Total Portfolio Value */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Portfolio Value
            </CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-brand-blue">
              ${portfolio.totalValue >= 1000000
                ? `${(portfolio.totalValue / 1000000).toFixed(2)}M`
                : portfolio.totalValue >= 1000
                ? `${(portfolio.totalValue / 1000).toFixed(1)}K`
                : portfolio.totalValue.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        {/* Total Invested */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Invested
            </CardTitle>
            <PiggyBank className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-brand-blue">
              ${portfolio.totalInvested >= 1000000
                ? `${(portfolio.totalInvested / 1000000).toFixed(2)}M`
                : portfolio.totalInvested >= 1000
                ? `${(portfolio.totalInvested / 1000).toFixed(1)}K`
                : portfolio.totalInvested.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        {/* Total Gain/Loss */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Gain/Loss
            </CardTitle>
            {isPositiveGain ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
            )}
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={`text-2xl font-bold ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveGain ? '+' : ''}${Math.abs(portfolio.totalGainLoss) >= 1000
                ? `${(portfolio.totalGainLoss / 1000).toFixed(1)}K`
                : portfolio.totalGainLoss.toFixed(0)}
            </div>
            <p className={`text-xs mt-0.5 font-medium ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveGain ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        {/* Today's Change */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Today
            </CardTitle>
            <Activity className="h-3.5 w-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={`text-2xl font-bold ${isPositiveDayChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveDayChange ? '+' : ''}${Math.abs(portfolio.dayChange) >= 1000
                ? `${(portfolio.dayChange / 1000).toFixed(1)}K`
                : portfolio.dayChange.toFixed(0)}
            </div>
            <p className={`text-xs mt-0.5 font-medium ${isPositiveDayChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveDayChange ? '+' : ''}{portfolio.dayChangePercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
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
        <h3 className="mb-4 text-lg font-semibold">Asset Allocation</h3>
        <AssetAllocationCharts holdings={portfolio.holdings} />
      </div>

      {/* Holdings Table */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold">Holdings</h3>
        <HoldingsTable holdings={portfolio.holdings} />
      </div>

      {/* Transaction History */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold">Transaction History</h3>
        <TransactionHistory />
      </div>
    </div>
  );
}
