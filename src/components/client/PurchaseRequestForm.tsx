'use client';

/**
 * Purchase Request Form Component
 * Form for clients to submit purchase requests for instruments
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  createPurchaseRequestSchema,
  type CreatePurchaseRequestInput,
} from '@/lib/validation/purchase-request.validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { checkTransactionEligibility } from '@/lib/utils/client-utils';

interface Instrument {
  id: string;
  symbol: string;
  name: string;
  type: string;
  currentPrice: number;
  currency: string;
  minimumInvestment: number | null;
  riskRating: string | null;
}

interface PurchaseRequestFormProps {
  onSuccess?: (trackingNumber: string) => void;
}

export function PurchaseRequestForm({ onSuccess }: PurchaseRequestFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [isLoadingInstruments, setIsLoadingInstruments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRM, setHasRM] = useState<boolean | null>(null);
  const [canTransact, setCanTransact] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePurchaseRequestInput>({
    resolver: zodResolver(createPurchaseRequestSchema),
  });

  const instrumentId = watch('instrumentId');
  const amount = watch('amount');

  // Check client eligibility for transactions
  useEffect(() => {
    if (session?.user?.role === 'CLIENT') {
      const fetchClientStatus = async () => {
        try {
          const response = await fetch('/api/client/my-rm');
          const data = await response.json();
          setHasRM(!!data.data);
        } catch (error) {
          console.error('Error fetching client RM status:', error);
          setHasRM(false);
        }
      };

      fetchClientStatus();
    }
  }, [session]);

  // Update canTransact based on RM assignment and verification status
  useEffect(() => {
    if (hasRM !== null && session?.user?.verificationStatus) {
      const eligibility = checkTransactionEligibility(hasRM, session.user.verificationStatus);
      setCanTransact(eligibility.canTransact);
    }
  }, [hasRM, session?.user?.verificationStatus]);

  // Fetch available instruments
  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const response = await fetch('/api/client/instruments?isActive=true&limit=1000');
        const result = await response.json();

        if (result.success) {
          setInstruments(result.data.instruments || []);
        } else {
          toast.error('Failed to load instruments');
        }
      } catch (error) {
        console.error('Error fetching instruments:', error);
        toast.error('Failed to load instruments');
      } finally {
        setIsLoadingInstruments(false);
      }
    };

    fetchInstruments();
  }, []);

  // Update selected instrument when instrumentId changes
  useEffect(() => {
    if (instrumentId) {
      const instrument = instruments.find((i) => i.id === instrumentId);
      setSelectedInstrument(instrument || null);
    } else {
      setSelectedInstrument(null);
    }
  }, [instrumentId, instruments]);

  // Validate amount against minimum investment
  const getAmountValidationError = () => {
    if (!amount || !selectedInstrument) return null;

    if (selectedInstrument.minimumInvestment && amount < selectedInstrument.minimumInvestment) {
      return `Minimum investment is ${selectedInstrument.currency} ${selectedInstrument.minimumInvestment.toFixed(2)}`;
    }

    return null;
  };

  const amountError = getAmountValidationError();

  const onSubmit = async (data: CreatePurchaseRequestInput) => {
    // Client-side validation for minimum investment
    if (amountError) {
      toast.error(amountError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/client/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to submit purchase request');
        return;
      }

      toast.success('Purchase request submitted successfully');

      if (onSuccess && result.data?.trackingNumber) {
        onSuccess(result.data.trackingNumber);
      } else {
        // Redirect to confirmation page with tracking number
        router.push(`/client/purchase-requests/confirmation?tracking=${result.data.trackingNumber}`);
      }
    } catch (error) {
      console.error('Error submitting purchase request:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      {/* Instrument Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Instrument</CardTitle>
          <CardDescription>Choose the investment instrument you want to purchase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instrumentId">
              Instrument <span className="text-destructive">*</span>
            </Label>
            {isLoadingInstruments ? (
              <div className="text-sm text-muted-foreground">Loading instruments...</div>
            ) : (
              <Select
                onValueChange={(value) => setValue('instrumentId', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="instrumentId" aria-invalid={!!errors.instrumentId}>
                  <SelectValue placeholder="Select an instrument" />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((instrument) => (
                    <SelectItem key={instrument.id} value={instrument.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{instrument.symbol}</span>
                        <span>-</span>
                        <span>{instrument.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {instrument.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.instrumentId && (
              <p className="text-sm text-destructive">{errors.instrumentId.message}</p>
            )}
          </div>

          {/* Selected Instrument Details */}
          {selectedInstrument && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{selectedInstrument.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedInstrument.symbol}</p>
                </div>
                {selectedInstrument.riskRating && (
                  <Badge
                    variant={
                      selectedInstrument.riskRating === 'HIGH'
                        ? 'destructive'
                        : selectedInstrument.riskRating === 'MEDIUM'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {selectedInstrument.riskRating} Risk
                  </Badge>
                )}
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="font-medium">
                    {selectedInstrument.currency} {selectedInstrument.currentPrice.toFixed(2)}
                  </span>
                </div>
                {selectedInstrument.minimumInvestment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Investment:</span>
                    <span className="font-medium">
                      {selectedInstrument.currency}{' '}
                      {selectedInstrument.minimumInvestment.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Amount */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Amount</CardTitle>
          <CardDescription>Enter the amount you want to invest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount {selectedInstrument && `(${selectedInstrument.currency})`}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="10000.00"
              {...register('amount', { valueAsNumber: true })}
              disabled={!selectedInstrument || isSubmitting}
              aria-invalid={!!errors.amount || !!amountError}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
            {amountError && <p className="text-sm text-destructive">{amountError}</p>}
            {selectedInstrument && amount && !amountError && (
              <p className="text-sm text-muted-foreground">
                Estimated quantity:{' '}
                {(amount / selectedInstrument.currentPrice).toFixed(4)} units
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes (Optional)</CardTitle>
          <CardDescription>Add any notes or special instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="clientNotes"
            {...register('clientNotes')}
            placeholder="Enter any additional information or instructions..."
            rows={4}
            disabled={isSubmitting}
          />
          {errors.clientNotes && (
            <p className="text-sm text-destructive">{errors.clientNotes.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!canTransact || !selectedInstrument || isSubmitting || !!amountError}
          title={!canTransact ? 'You must have an assigned RM and verified KYC to submit purchase requests' : undefined}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Purchase Request'}
        </Button>
      </div>
    </form>
  );
}
