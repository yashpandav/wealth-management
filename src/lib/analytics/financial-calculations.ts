/**
 * Financial Calculations Engine
 * Core calculations for portfolio analytics, ROI, returns, and performance metrics
 */

/**
 * Calculate Return on Investment (ROI) percentage
 * @param currentValue - Current value of investment
 * @param initialInvestment - Initial investment amount
 * @returns ROI as percentage (e.g., 15.5 for 15.5% return)
 */
export function calculateROI(currentValue: number, initialInvestment: number): number {
  if (initialInvestment === 0) return 0;
  return ((currentValue - initialInvestment) / initialInvestment) * 100;
}

/**
 * Calculate absolute gain/loss
 * @param currentValue - Current value
 * @param initialInvestment - Initial investment
 * @returns Absolute gain or loss amount
 */
export function calculateGainLoss(currentValue: number, initialInvestment: number): number {
  return currentValue - initialInvestment;
}

/**
 * Calculate Year-to-Date (YTD) Returns
 * @param currentValue - Current portfolio value
 * @param ytdStartValue - Portfolio value at the start of the year
 * @returns YTD return as percentage
 */
export function calculateYTDReturn(currentValue: number, ytdStartValue: number): number {
  if (ytdStartValue === 0) return 0;
  return ((currentValue - ytdStartValue) / ytdStartValue) * 100;
}

/**
 * Calculate annualized return (CAGR - Compound Annual Growth Rate)
 * @param endValue - Ending value
 * @param beginValue - Beginning value
 * @param years - Number of years
 * @returns Annualized return as percentage
 */
export function calculateAnnualizedReturn(
  endValue: number,
  beginValue: number,
  years: number
): number {
  if (beginValue === 0 || years === 0) return 0;
  return (Math.pow(endValue / beginValue, 1 / years) - 1) * 100;
}

/**
 * Calculate time-weighted return for periods with cash flows
 * @param periods - Array of period returns as decimals (0.10 for 10%)
 * @returns Time-weighted return as percentage
 */
export function calculateTimeWeightedReturn(periods: number[]): number {
  if (periods.length === 0) return 0;

  let totalReturn = 1;
  for (const periodReturn of periods) {
    totalReturn *= (1 + periodReturn);
  }

  return (totalReturn - 1) * 100;
}

/**
 * Calculate portfolio volatility (standard deviation of returns)
 * @param returns - Array of periodic returns as percentages
 * @returns Annualized volatility as percentage
 */
export function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((sum, sd) => sum + sd, 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  // Annualize assuming monthly returns
  return stdDev * Math.sqrt(12);
}

/**
 * Calculate Sharpe Ratio (risk-adjusted return)
 * @param portfolioReturn - Portfolio return as percentage
 * @param riskFreeRate - Risk-free rate as percentage (e.g., Treasury yield)
 * @param volatility - Portfolio volatility as percentage
 * @returns Sharpe ratio
 */
export function calculateSharpeRatio(
  portfolioReturn: number,
  riskFreeRate: number,
  volatility: number
): number {
  if (volatility === 0) return 0;
  return (portfolioReturn - riskFreeRate) / volatility;
}

/**
 * Calculate portfolio beta (volatility relative to market)
 * @param portfolioReturns - Array of portfolio returns
 * @param marketReturns - Array of market benchmark returns
 * @returns Beta coefficient
 */
export function calculateBeta(
  portfolioReturns: number[],
  marketReturns: number[]
): number {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) {
    return 1; // Default beta of 1 (market neutral)
  }

  const n = portfolioReturns.length;
  const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / n;
  const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / n;

  let covariance = 0;
  let marketVariance = 0;

  for (let i = 0; i < n; i++) {
    const portfolioDiff = portfolioReturns[i] - portfolioMean;
    const marketDiff = marketReturns[i] - marketMean;
    covariance += portfolioDiff * marketDiff;
    marketVariance += marketDiff * marketDiff;
  }

  if (marketVariance === 0) return 1;
  return covariance / marketVariance;
}

/**
 * Calculate maximum drawdown (largest peak-to-trough decline)
 * @param values - Array of portfolio values over time
 * @returns Maximum drawdown as percentage
 */
export function calculateMaxDrawdown(values: number[]): number {
  if (values.length === 0) return 0;

  let maxDrawdown = 0;
  let peak = values[0];

  for (const value of values) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Calculate percentage allocation of each holding
 * @param holdings - Array of holdings with currentValue
 * @returns Array of holdings with allocation percentage
 */
export function calculateAllocationPercentages<T extends { currentValue: number }>(
  holdings: T[]
): (T & { allocationPercent: number })[] {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  if (totalValue === 0) {
    return holdings.map(h => ({ ...h, allocationPercent: 0 }));
  }

  return holdings.map(h => ({
    ...h,
    allocationPercent: (h.currentValue / totalValue) * 100,
  }));
}

/**
 * Calculate diversification score based on allocation concentration
 * @param allocations - Array of allocation percentages
 * @returns Diversification score (0-100, higher is more diversified)
 */
export function calculateDiversificationScore(allocations: number[]): number {
  if (allocations.length === 0) return 0;
  if (allocations.length === 1) return 0;

  // Calculate Herfindahl-Hirschman Index (HHI)
  const hhi = allocations.reduce((sum, a) => sum + Math.pow(a, 2), 0);

  // Convert HHI to a 0-100 scale (lower HHI = more diversified)
  // Perfect diversification would have HHI = 10000 / n
  const n = allocations.length;
  const perfectHHI = 10000 / n;
  const maxHHI = 10000; // All in one asset

  const score = ((maxHHI - hhi) / (maxHHI - perfectHHI)) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate goal progress
 * @param currentValue - Current portfolio value
 * @param targetValue - Target goal value
 * @returns Progress as percentage (0-100+)
 */
export function calculateGoalProgress(currentValue: number, targetValue: number): number {
  if (targetValue === 0) return 0;
  return (currentValue / targetValue) * 100;
}

/**
 * Calculate projected future value with compound growth
 * @param presentValue - Current value
 * @param annualReturnRate - Expected annual return rate as percentage
 * @param years - Number of years
 * @param monthlyContribution - Optional monthly contribution amount
 * @returns Projected future value
 */
export function calculateFutureValue(
  presentValue: number,
  annualReturnRate: number,
  years: number,
  monthlyContribution: number = 0
): number {
  const monthlyRate = annualReturnRate / 100 / 12;
  const months = years * 12;

  // Future value of present amount
  const fvPresent = presentValue * Math.pow(1 + monthlyRate, months);

  // Future value of monthly contributions (annuity)
  const fvContributions = monthlyContribution > 0
    ? monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    : 0;

  return fvPresent + fvContributions;
}

/**
 * Calculate required monthly contribution to reach goal
 * @param currentValue - Current portfolio value
 * @param targetValue - Target goal value
 * @param years - Years to reach goal
 * @param annualReturnRate - Expected annual return rate as percentage
 * @returns Required monthly contribution amount
 */
export function calculateRequiredContribution(
  currentValue: number,
  targetValue: number,
  years: number,
  annualReturnRate: number
): number {
  const monthlyRate = annualReturnRate / 100 / 12;
  const months = years * 12;

  // Future value of current amount
  const fvCurrent = currentValue * Math.pow(1 + monthlyRate, months);

  // Remaining amount needed from contributions
  const remainingNeeded = targetValue - fvCurrent;

  if (remainingNeeded <= 0) return 0;

  // Calculate monthly payment using annuity formula
  const monthlyPayment = remainingNeeded / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return Math.max(0, monthlyPayment);
}

/**
 * Round number to specified decimal places
 * @param value - Number to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 */
export function roundToDecimals(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Format currency value
 * @param value - Number value
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 * @param value - Percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${roundToDecimals(value, decimals)}%`;
}
