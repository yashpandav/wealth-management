'use client';

/**
 * Investment Plans List Component
 * Displays all investment plans with their options in an organized view
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvestmentOption {
  id: string;
  duration: string;
  withdrawalFrequency: string;
  roi: number;
  annualReturn: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Investment {
  id: string;
  name: string;
  description: string | null;
  minAmount: number;
  maxAmount: number | null;
  currency: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completedPurchases: number;
  options: InvestmentOption[];
}

interface InvestmentPlansListProps {
  initialData: Investment[];
}

export function InvestmentPlansList({ initialData }: InvestmentPlansListProps) {
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  const toggleExpand = (planId: string) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency || 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAmountRange = (investment: Investment) => {
    const minFormatted = formatCurrency(investment.minAmount, investment.currency);
    if (investment.maxAmount) {
      const maxFormatted = formatCurrency(investment.maxAmount, investment.currency);
      return `${minFormatted} - ${maxFormatted}`;
    }
    return `${minFormatted} and Above`;
  };

  if (initialData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No investment plans found. Create your first investment plan to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {initialData.filter((p) => p.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {initialData.reduce((sum, p) => sum + p.completedPurchases, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Plans List */}
      <div className="space-y-4">
        {initialData.map((investment) => (
          <Card key={investment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(investment.id)}
                    className="h-8 w-8 p-0"
                  >
                    {expandedPlans.has(investment.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <CardTitle className="text-lg">{investment.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getAmountRange(investment)}
                    </p>
                    {investment.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {investment.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={investment.isActive ? 'default' : 'secondary'}>
                    {investment.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    {investment.completedPurchases} Completed
                  </Badge>
                  <Badge variant="outline">{investment.options.length} Options</Badge>
                </div>
              </div>
            </CardHeader>

            {/* Expandable Options Table */}
            {expandedPlans.has(investment.id) && (
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Duration</TableHead>
                        <TableHead>Payout Frequency</TableHead>
                        <TableHead>ROI (%)</TableHead>
                        <TableHead>Annual Return (%)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investment.options.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No options configured for this investment plan
                          </TableCell>
                        </TableRow>
                      ) : (
                        investment.options.map((option) => (
                          <TableRow key={option.id}>
                            <TableCell className="font-medium">{option.duration}</TableCell>
                            <TableCell>{option.withdrawalFrequency}</TableCell>
                            <TableCell>{option.roi}%</TableCell>
                            <TableCell>{option.annualReturn}%</TableCell>
                            <TableCell>
                              <Badge
                                variant={option.isActive ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {option.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
