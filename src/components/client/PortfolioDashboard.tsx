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
    <div className="space-y-6">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Portfolio Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portfolio Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Current market value
            </p>
          </CardContent>
        </Card>

        {/* Total Invested */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invested
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolio.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount invested
            </p>
          </CardContent>
        </Card>

        {/* Total Gain/Loss */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Gain/Loss
            </CardTitle>
            {isPositiveGain ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveGain ? '+' : ''}${portfolio.totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={`text-xs ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveGain ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}% all time
            </p>
          </CardContent>
        </Card>

        {/* Today's Change */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Change
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPositiveDayChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveDayChange ? '+' : ''}${portfolio.dayChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={`text-xs ${isPositiveDayChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveDayChange ? '+' : ''}{portfolio.dayChangePercent.toFixed(2)}% today
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
