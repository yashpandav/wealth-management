'use client';

/**
 * Add Investment Option Dialog Component
 * Modal dialog for adding new investment plan options to existing investment ranges
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Investment {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  currency: string;
}

interface AddInvestmentOptionDialogProps {
  investments: Investment[];
}

export function AddInvestmentOptionDialog({
  investments,
}: AddInvestmentOptionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disable button if no investments available
  const hasInvestments = investments.length > 0;

  // Form state
  const [investmentId, setInvestmentId] = useState<string>('');
  const [durationYears, setDurationYears] = useState<string>(''); // Store numeric value
  const [withdrawalFrequency, setWithdrawalFrequency] = useState<string>('');
  const [roi, setRoi] = useState<string>('');
  const [annualReturn, setAnnualReturn] = useState<string>(''); // Auto-calculated

  // Calculate annual return based on ROI, duration, and payout frequency
  const calculateAnnualReturn = (
    roiValue: string,
    durationValue: string,
    frequency: string
  ): string => {
    const roiNum = parseFloat(roiValue);
    const durationNum = parseFloat(durationValue);

    if (isNaN(roiNum) || isNaN(durationNum) || !frequency || roiNum === 0) {
      return '';
    }

    let annualReturnValue = 0;

    switch (frequency) {
      case 'Monthly':
        annualReturnValue = roiNum * 12;
        break;
      case 'Quarterly':
        annualReturnValue = roiNum * 4;
        break;
      case 'Half-Yearly':
        annualReturnValue = roiNum * 2;
        break;
      case 'Yearly':
        annualReturnValue = roiNum * 1;
        break;
      case 'At Maturity':
        // For "At Maturity", annual return = total ROI divided by duration in years
        annualReturnValue = roiNum / durationNum;
        break;
      default:
        return '';
    }

    // Ensure it doesn't exceed 1000% and round to 2 decimal places
    annualReturnValue = Math.min(annualReturnValue, 1000);
    return annualReturnValue.toFixed(2);
  };

  // Auto-calculate annual return whenever ROI, duration, or frequency changes
  useEffect(() => {
    const calculated = calculateAnnualReturn(roi, durationYears, withdrawalFrequency);
    setAnnualReturn(calculated);
  }, [roi, durationYears, withdrawalFrequency]);

  const resetForm = () => {
    setInvestmentId('');
    setDurationYears('');
    setWithdrawalFrequency('');
    setRoi('');
    setAnnualReturn('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!investmentId || !durationYears || !withdrawalFrequency || !roi || !annualReturn) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate duration is a positive integer
    const durationNum = parseInt(durationYears);
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error('Duration must be a positive number');
      return;
    }

    if (durationNum > 100) {
      toast.error('Duration cannot exceed 100 years');
      return;
    }

    // Format duration as "X Year" or "X Years"
    const formattedDuration = `${durationNum} ${durationNum === 1 ? 'Year' : 'Years'}`;

    // Validate ROI
    const roiNum = parseFloat(roi);
    if (isNaN(roiNum) || !isFinite(roiNum)) {
      toast.error('ROI must be a valid number');
      return;
    }

    if (roiNum < 0 || roiNum > 100) {
      toast.error('ROI must be between 0 and 100');
      return;
    }

    // Check decimal places for ROI
    const roiDecimals = (roi.split('.')[1] || '').length;
    if (roiDecimals > 2) {
      toast.error('ROI can have at most 2 decimal places');
      return;
    }

    // Validate Annual Return
    const annualReturnNum = parseFloat(annualReturn);
    if (isNaN(annualReturnNum) || !isFinite(annualReturnNum)) {
      toast.error('Annual return must be a valid number');
      return;
    }

    if (annualReturnNum < 0 || annualReturnNum > 1000) {
      toast.error('Annual return must be between 0 and 1000');
      return;
    }

    // Check decimal places for Annual Return
    const annualReturnDecimals = (annualReturn.split('.')[1] || '').length;
    if (annualReturnDecimals > 2) {
      toast.error('Annual return can have at most 2 decimal places');
      return;
    }

    // Business logic validation
    if (roiNum === 0 && annualReturnNum > 0) {
      toast.error('Annual return cannot be positive when ROI is 0');
      return;
    }

    // Sanity check: Annual return should be reasonable relative to ROI
    if (annualReturnNum > 100 * roiNum) {
      toast.error('Annual return seems unrealistic relative to ROI. Please verify your calculations.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/investment-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          investmentId,
          duration: formattedDuration,
          withdrawalFrequency,
          roi: roiNum,
          annualReturn: annualReturnNum,
          displayOrder: 0,
          isActive: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          toast.error(result.error || 'This investment option already exists');
        } else if (response.status === 400) {
          toast.error(result.error || 'Invalid input data');
        } else if (response.status === 404) {
          toast.error('Investment range not found');
        } else if (response.status === 401) {
          toast.error('Unauthorized. Please log in again.');
        } else {
          toast.error(result.error || 'Failed to create investment plan option');
        }
        return;
      }

      toast.success('Investment plan option created successfully');
      resetForm();
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating investment plan option:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create investment plan option'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency || 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInvestmentLabel = (investment: Investment) => {
    const minFormatted = formatCurrency(investment.minAmount, investment.currency);
    if (investment.maxAmount) {
      const maxFormatted = formatCurrency(investment.maxAmount, investment.currency);
      return `${investment.name} (${minFormatted} - ${maxFormatted})`;
    }
    return `${investment.name} (${minFormatted} and Above)`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!hasInvestments} title={!hasInvestments ? 'No investment ranges available. Please create an investment range first.' : ''}>
          <Plus className="mr-2 h-4 w-4" />
          Add Investment Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Investment Plan Option</DialogTitle>
          <DialogDescription>
            Create a new investment plan option for an existing investment range.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Investment Range Selection */}
            <div className="grid gap-2">
              <Label htmlFor="investment">
                Investment Range <span className="text-red-500">*</span>
              </Label>
              <Select value={investmentId} onValueChange={setInvestmentId} required>
                <SelectTrigger id="investment">
                  <SelectValue placeholder="Select investment range" />
                </SelectTrigger>
                <SelectContent>
                  {investments.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No investment ranges available
                    </div>
                  ) : (
                    investments.map((investment) => (
                      <SelectItem key={investment.id} value={investment.id}>
                        {getInvestmentLabel(investment)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="grid gap-2">
              <Label htmlFor="duration">
                Duration (Years) <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 1, 2, 3, 5"
                  value={durationYears}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow positive integers
                    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
                      setDurationYears(value);
                    }
                  }}
                  disabled={isSubmitting}
                  min="1"
                  max="100"
                  required
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {durationYears && parseInt(durationYears) === 1 ? 'Year' : 'Years'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the number of years for the investment duration
              </p>
            </div>

            {/* Payout Frequency */}
            <div className="grid gap-2">
              <Label htmlFor="payoutFrequency">
                Payout Frequency <span className="text-red-500">*</span>
              </Label>
              <Select
                value={withdrawalFrequency}
                onValueChange={setWithdrawalFrequency}
                required
              >
                <SelectTrigger id="payoutFrequency">
                  <SelectValue placeholder="Select payout frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                  <SelectItem value="At Maturity">At Maturity</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often payouts are distributed to investors
              </p>
            </div>

            {/* ROI */}
            <div className="grid gap-2">
              <Label htmlFor="roi">
                ROI per Period (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="roi"
                type="number"
                placeholder="e.g., 2.00, 3.00, 10.00"
                value={roi}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or valid decimal numbers with max 2 decimal places
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                    setRoi(value);
                  }
                }}
                onBlur={(e) => {
                  // Format on blur to ensure 2 decimal places
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setRoi(value.toFixed(2));
                  }
                }}
                disabled={isSubmitting}
                step="0.01"
                min="0"
                max="100"
                required
              />
              <p className="text-xs text-muted-foreground">
                Return on Investment per payout period (0-100, max 2 decimals)
              </p>
            </div>

            {/* Annual Return (Auto-calculated) */}
            <div className="grid gap-2">
              <Label htmlFor="annualReturn">
                Annual Return (%) <span className="text-muted-foreground text-xs">(Auto-calculated)</span>
              </Label>
              <Input
                id="annualReturn"
                type="text"
                placeholder="Will be calculated automatically"
                value={annualReturn}
                disabled={true}
                className="bg-muted cursor-not-allowed"
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                Automatically calculated based on ROI, duration, and payout frequency
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Option'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
