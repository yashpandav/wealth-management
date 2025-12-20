'use client';

/**
 * Instrument Creation/Edit Form
 * Comprehensive form for creating and editing investment instruments
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { InstrumentType } from '@prisma/client';
import {
  createInstrumentSchema,
  type CreateInstrumentInput,
} from '@/lib/validation/instrument.validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/shared/FileUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

interface InstrumentFormProps {
  mode?: 'create' | 'edit';
  initialData?: Partial<CreateInstrumentInput>;
  instrumentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InstrumentForm({
  mode = 'create',
  initialData,
  instrumentId,
  onSuccess,
  onCancel,
}: InstrumentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateInstrumentInput>({
    resolver: zodResolver(createInstrumentSchema),
    defaultValues: initialData || {
      currency: 'USD',
      isActive: true,
      isPublic: true,
    },
  });

  const isActive = watch('isActive');
  const isPublic = watch('isPublic');
  const prospectusUrl = watch('prospectusUrl');

  const onSubmit = async (data: CreateInstrumentInput) => {
    setIsSubmitting(true);

    try {
      const url =
        mode === 'edit' && instrumentId
          ? `/api/admin/instruments/${instrumentId}`
          : '/api/admin/instruments';

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to save instrument');
        return;
      }

      toast.success(
        mode === 'edit' ? 'Instrument updated successfully' : 'Instrument created successfully'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/instruments');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving instrument:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset(
      initialData || {
        currency: 'USD',
        isActive: true,
        isPublic: true,
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core details of the investment instrument</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Symbol */}
            <div className="space-y-2">
              <Label htmlFor="symbol">
                Symbol <span className="text-destructive">*</span>
              </Label>
              <Input
                id="symbol"
                {...register('symbol')}
                placeholder="AAPL"
                className="uppercase"
                aria-invalid={!!errors.symbol}
                aria-describedby={errors.symbol ? 'symbol-error' : undefined}
              />
              {errors.symbol && (
                <p id="symbol-error" className="text-sm text-destructive">
                  {errors.symbol.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Apple Inc."
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue('type', value as InstrumentType)}
                defaultValue={initialData?.type}
              >
                <SelectTrigger id="type" aria-invalid={!!errors.type}>
                  <SelectValue placeholder="Select instrument type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InstrumentType.STOCK}>Stock</SelectItem>
                  <SelectItem value={InstrumentType.BOND}>Bond</SelectItem>
                  <SelectItem value={InstrumentType.MUTUAL_FUND}>Mutual Fund</SelectItem>
                  <SelectItem value={InstrumentType.ETF}>ETF</SelectItem>
                  <SelectItem value={InstrumentType.COMMODITY}>Commodity</SelectItem>
                  <SelectItem value={InstrumentType.CRYPTOCURRENCY}>Cryptocurrency</SelectItem>
                  <SelectItem value={InstrumentType.REAL_ESTATE}>Real Estate</SelectItem>
                  <SelectItem value={InstrumentType.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* ISIN */}
            <div className="space-y-2">
              <Label htmlFor="isin">ISIN</Label>
              <Input
                id="isin"
                {...register('isin')}
                placeholder="US0378331005"
                className="uppercase"
                aria-invalid={!!errors.isin}
              />
              {errors.isin && <p className="text-sm text-destructive">{errors.isin.message}</p>}
              <p className="text-xs text-muted-foreground">
                International Securities Identification Number (optional)
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the instrument..."
              rows={4}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Upload prospectus and related documents</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            label="Prospectus Document"
            accept=".pdf"
            maxSize={10 * 1024 * 1024}
            currentFile={prospectusUrl || null}
            onFileUploaded={(url) => setValue('prospectusUrl', url)}
            onFileDeleted={() => setValue('prospectusUrl', null)}
            disabled={isSubmitting}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Upload the instrument prospectus in PDF format (max 10MB)
          </p>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Information</CardTitle>
          <CardDescription>Current price and currency details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Current Price */}
            <div className="space-y-2">
              <Label htmlFor="currentPrice">
                Current Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currentPrice"
                type="number"
                step="0.01"
                {...register('currentPrice', { valueAsNumber: true })}
                placeholder="150.00"
                aria-invalid={!!errors.currentPrice}
              />
              {errors.currentPrice && (
                <p className="text-sm text-destructive">{errors.currentPrice.message}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currency"
                {...register('currency')}
                placeholder="USD"
                maxLength={3}
                className="uppercase"
                aria-invalid={!!errors.currency}
              />
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency.message}</p>
              )}
              <p className="text-xs text-muted-foreground">3-letter currency code (e.g., USD, EUR)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Data */}
      <Card>
        <CardHeader>
          <CardTitle>Market Data</CardTitle>
          <CardDescription>Exchange, sector, and market metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Exchange */}
            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange</Label>
              <Input
                id="exchange"
                {...register('exchange')}
                placeholder="NASDAQ"
                aria-invalid={!!errors.exchange}
              />
              {errors.exchange && (
                <p className="text-sm text-destructive">{errors.exchange.message}</p>
              )}
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                {...register('sector')}
                placeholder="Technology"
                aria-invalid={!!errors.sector}
              />
              {errors.sector && <p className="text-sm text-destructive">{errors.sector.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Market Cap */}
            <div className="space-y-2">
              <Label htmlFor="marketCap">Market Cap</Label>
              <Input
                id="marketCap"
                type="number"
                step="0.01"
                {...register('marketCap', { valueAsNumber: true })}
                placeholder="2500000000000"
                aria-invalid={!!errors.marketCap}
              />
              {errors.marketCap && (
                <p className="text-sm text-destructive">{errors.marketCap.message}</p>
              )}
            </div>

            {/* P/E Ratio */}
            <div className="space-y-2">
              <Label htmlFor="peRatio">P/E Ratio</Label>
              <Input
                id="peRatio"
                type="number"
                step="0.01"
                {...register('peRatio', { valueAsNumber: true })}
                placeholder="25.5"
                aria-invalid={!!errors.peRatio}
              />
              {errors.peRatio && (
                <p className="text-sm text-destructive">{errors.peRatio.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Yearly High */}
            <div className="space-y-2">
              <Label htmlFor="yearlyHigh">52-Week High</Label>
              <Input
                id="yearlyHigh"
                type="number"
                step="0.01"
                {...register('yearlyHigh', { valueAsNumber: true })}
                placeholder="180.00"
                aria-invalid={!!errors.yearlyHigh}
              />
              {errors.yearlyHigh && (
                <p className="text-sm text-destructive">{errors.yearlyHigh.message}</p>
              )}
            </div>

            {/* Yearly Low */}
            <div className="space-y-2">
              <Label htmlFor="yearlyLow">52-Week Low</Label>
              <Input
                id="yearlyLow"
                type="number"
                step="0.01"
                {...register('yearlyLow', { valueAsNumber: true })}
                placeholder="120.00"
                aria-invalid={!!errors.yearlyLow}
              />
              {errors.yearlyLow && (
                <p className="text-sm text-destructive">{errors.yearlyLow.message}</p>
              )}
            </div>

            {/* Dividend Yield */}
            <div className="space-y-2">
              <Label htmlFor="dividendYield">Dividend Yield (%)</Label>
              <Input
                id="dividendYield"
                type="number"
                step="0.01"
                {...register('dividendYield', { valueAsNumber: true })}
                placeholder="2.5"
                aria-invalid={!!errors.dividendYield}
              />
              {errors.dividendYield && (
                <p className="text-sm text-destructive">{errors.dividendYield.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk and Investment */}
      <Card>
        <CardHeader>
          <CardTitle>Risk and Investment</CardTitle>
          <CardDescription>Risk rating and investment requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Risk Rating */}
            <div className="space-y-2">
              <Label htmlFor="riskRating">Risk Rating</Label>
              <Select
                onValueChange={(value) =>
                  setValue('riskRating', value as 'LOW' | 'MEDIUM' | 'HIGH')
                }
                defaultValue={initialData?.riskRating || undefined}
              >
                <SelectTrigger id="riskRating">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low Risk</SelectItem>
                  <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                  <SelectItem value="HIGH">High Risk</SelectItem>
                </SelectContent>
              </Select>
              {errors.riskRating && (
                <p className="text-sm text-destructive">{errors.riskRating.message}</p>
              )}
            </div>

            {/* Minimum Investment */}
            <div className="space-y-2">
              <Label htmlFor="minimumInvestment">Minimum Investment</Label>
              <Input
                id="minimumInvestment"
                type="number"
                step="0.01"
                {...register('minimumInvestment', { valueAsNumber: true })}
                placeholder="1000.00"
                aria-invalid={!!errors.minimumInvestment}
              />
              {errors.minimumInvestment && (
                <p className="text-sm text-destructive">{errors.minimumInvestment.message}</p>
              )}
            </div>
          </div>

          {/* Launch Date */}
          <div className="space-y-2">
            <Label htmlFor="launchDate">Launch Date</Label>
            <Input
              id="launchDate"
              type="datetime-local"
              {...register('launchDate')}
              aria-invalid={!!errors.launchDate}
            />
            {errors.launchDate && (
              <p className="text-sm text-destructive">{errors.launchDate.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>Instrument availability and visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Is Active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
            />
            <Label
              htmlFor="isActive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Active (available for trading)
            </Label>
          </div>

          {/* Is Public */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => setValue('isPublic', checked as boolean)}
            />
            <Label
              htmlFor="isPublic"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Public (visible to all users)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : mode === 'edit'
            ? 'Update Instrument'
            : 'Create Instrument'}
        </Button>
      </div>
    </form>
  );
}
