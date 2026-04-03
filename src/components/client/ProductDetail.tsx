/**
 * Client Product Detail Component
 * Professional plan view with manual amount entry and slider
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  TrendingUp,
  Shield,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

interface ProductOption {
  id: string;
  duration: string;
  withdrawalFrequency: string;
  roi: number;
  annualReturn: number;
  displayOrder: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  minAmount: number;
  maxAmount: number | null;
  currency: string;
  displayOrder: number;
  options: ProductOption[];
}

interface ClientRM {
  hasRM: boolean;
  rm?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ProductDetailProps {
  product: Product;
  clientRM: ClientRM | null;
  rmLoading: boolean;
}

interface KYCStatus {
  identityProofVerified: boolean;
  canSubmitRequests: boolean;
  identityProofStatus?: string;
  kycStatus?: string;
}



export function ProductDetail({ product, clientRM, rmLoading }: ProductDetailProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null);
  const [amount, setAmount] = useState<string>(product.minAmount.toString());
  const [notes, setNotes] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [kycLoading, setKycLoading] = useState(true);

  // Fetch KYC status on component mount
  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      setKycLoading(true);
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch KYC status');
      }
      const result = await response.json();

      // API structure: { identityProof, kycStatus }
      const identityProof = result.data?.identityProof;
      const kycStatus = result.data?.kycStatus; // Overall client verification status
      const identityProofVerified = identityProof?.verificationStatus === 'VERIFIED';

      // Client can submit requests if overall KYC status is VERIFIED
      const canSubmitRequests = kycStatus === 'VERIFIED';

      setKycStatus({
        identityProofVerified,
        canSubmitRequests,
        identityProofStatus: identityProof?.verificationStatus,
        kycStatus,
      });
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      setKycStatus({
        identityProofVerified: false,
        canSubmitRequests: false,
      });
    } finally {
      setKycLoading(false);
    }
  };

  const formatAmountRange = (prod: Product) => {
    const min = prod.minAmount.toLocaleString();
    if (prod.maxAmount) {
      const max = prod.maxAmount.toLocaleString();
      return `${min} – ${max}`;
    }
    return `${min} and Above`;
  };

  const getHighestReturn = (options: ProductOption[]) => {
    if (options.length === 0) return null;
    return Math.max(...options.map((o) => o.annualReturn));
  };

  const validateAmount = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    if (amountNum < product.minAmount) {
      toast.error(
        `Minimum investment amount is ${product.currency} ${product.minAmount.toLocaleString()}`
      );
      return false;
    }
    if (product.maxAmount && amountNum > product.maxAmount) {
      toast.error(
        `Maximum investment amount is ${product.currency} ${product.maxAmount.toLocaleString()}`
      );
      return false;
    }
    return true;
  };

  const handleRequestPurchase = () => {
    if (!selectedOption) {
      toast.error('Please select a product option');
      return;
    }
    if (!validateAmount()) {
      return;
    }
    if (!clientRM?.hasRM) {
      toast.error('You must have an assigned Relationship Manager to request a plan');
      return;
    }
    if (!kycStatus?.canSubmitRequests) {
      toast.error(
        'Your KYC documents must be verified before submitting plan requests. Please upload and verify your documents.'
      );
      return;
    }
    setShowConfirmDialog(true);
  };

  const submitRequest = async () => {
    if (!selectedOption) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/client/product-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentId: product.id,
          investmentOptionId: selectedOption.id,
          amount: parseFloat(amount),
          clientNotes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Plan investment request submitted successfully!');
        setShowConfirmDialog(false);
        router.push(`/client/requests?tracking=${data.data.trackingNumber}`);
      } else {
        if (data.code === 'NO_RM_ASSIGNED') {
          toast.error('You must have an assigned Relationship Manager to request a plan');
        } else if (data.code === 'IDENTITY_PROOF_NOT_VERIFIED') {
          toast.error(
            'Your Identity Proof document must be verified. Please upload and verify your documents.'
          );
          toast.error(data.error || 'Failed to submit request');
        }
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSliderChange = (values: number[]) => {
    setAmount(values[0].toString());
  };

  const calculateProjectedReturns = () => {
    if (!selectedOption) return null;
    const amountNum = parseFloat(amount) || 0;

    const annualReturn = (amountNum * selectedOption.annualReturn) / 100;

    // Parse duration to extract years
    const durationMatch = selectedOption.duration.match(/(\d+)\s*Year/i);
    const years = durationMatch ? parseInt(durationMatch[1]) : 1;

    const totalReturn = annualReturn * years;
    const totalAmount = amountNum + totalReturn;

    return {
      annualReturn,
      totalReturn,
      totalAmount,
      years,
    };
  };

  const projectedReturns = calculateProjectedReturns();
  const highestReturn = getHighestReturn(product.options);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-brand-grey">
            <Link href="/client/portfolio" className="hover:text-brand-blue transition-colors duration-200">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-brand-grey/40" />
            <Link href="/client/products" className="hover:text-brand-blue transition-colors duration-200">
              Plans
            </Link>
            <ChevronRight className="h-4 w-4 text-brand-grey/40" />
            <span className="text-brand-blue font-medium font-optima">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 lg:py-8">
        {/* RM Warning */}
        {!rmLoading && !clientRM?.hasRM && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">No Relationship Manager Assigned</p>
              <p className="text-sm text-yellow-700">
                You must have an assigned RM to request plan investments. Please contact support.
              </p>
            </div>
          </div>
        )}

        {/* KYC Verification Warning */}
        {!kycLoading && kycStatus && !kycStatus.canSubmitRequests && (() => {
          const isPending =
            kycStatus.kycStatus === 'PENDING' ||
            kycStatus.kycStatus === 'UNDER_REVIEW' ||
            kycStatus.identityProofStatus === 'PENDING' ||
            kycStatus.identityProofStatus === 'UNDER_REVIEW';

          if (isPending) {
            return (
              <div className="mb-6 p-5 bg-blue-50 border border-blue-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-optima text-base font-semibold text-blue-800 mb-2">
                      Verification In Progress
                    </h3>
                    <p className="font-optima text-comments text-blue-700 mb-3">
                      Please wait while we verify your documents. You will be notified once complete.
                    </p>
                    {!kycStatus.identityProofVerified && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                        <span className="font-optima text-sm text-blue-700">
                          Identity Proof (under review)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="mb-6 p-5 bg-orange-50 border border-orange-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-900 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-optima text-base font-semibold text-orange-900 mb-2">
                    KYC Verification Required
                  </h3>
                  <p className="font-optima text-comments text-orange-900 mb-3">
                    You must complete your KYC verification before submitting plan requests.
                  </p>

                  {!kycStatus.identityProofVerified && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-900"></div>
                        <span className="font-optima text-sm text-orange-900">
                          Identity Proof{' '}
                          {kycStatus.identityProofStatus === 'REJECTED'
                            ? '(rejected)'
                            : '(not verified)'}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link
                    href="/client/documents"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-6 py-2.5 font-optima text-comments font-semibold text-white shadow-md transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Documents
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Header Section */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue mb-2">{product.name}</h1>
              <div className="flex items-center gap-2">
                <p className="font-georgia text-brand-grey flex items-center gap-1.5">
                  <DirhamIcon className="h-4 w-4 text-brand-grey" />
                  {formatAmountRange(product)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {highestReturn && (
                <Badge variant="outline" className="bg-brand-blue/5 text-brand-blue border-brand-blue/20 font-optima">
                  Up to {highestReturn}% Annual Return
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="font-georgia text-brand-grey leading-relaxed">{product.description}</p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column - Product Options & FAQ */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Product Options */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="font-optima text-brand-blue">Select Investment Option</CardTitle>
                <p className="font-georgia text-sm text-brand-grey">
                  Choose your preferred duration and withdrawal frequency
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedOption?.id === option.id
                      ? 'border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue/30'
                      : 'border-gray-200 hover:border-brand-blue/40 hover:bg-brand-blue/5'
                      }`}
                    onClick={() => setSelectedOption(option)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <div
                          className={`mt-1 sm:mt-0 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedOption?.id === option.id
                            ? 'border-brand-blue bg-brand-blue'
                            : 'border-gray-300'
                            }`}
                        >
                          {selectedOption?.id === option.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="font-optima font-semibold flex items-center gap-2 text-brand-blue">
                            <Calendar className="h-4 w-4 text-brand-grey flex-shrink-0" />
                            {option.duration}
                          </span>
                          <span className="hidden sm:block text-gray-200">|</span>
                          <span className="font-georgia flex items-center gap-2 text-brand-grey text-sm sm:text-base">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            {option.withdrawalFrequency} Withdrawal
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
                        <span className="font-optima text-xs font-semibold text-brand-grey border border-gray-200 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                          ROI {option.roi}%
                        </span>
                        <span className="font-optima text-xs font-semibold bg-brand-blue text-white rounded-full px-2.5 py-0.5 whitespace-nowrap flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {option.annualReturn}% Annual
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Key Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="font-optima text-brand-blue">Key Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
                    <div className="flex items-center gap-2 text-brand-grey mb-1.5">
                      <DirhamIcon className="h-4 w-4" />
                      <span className="font-optima text-xs uppercase tracking-wide">Minimum Investment</span>
                    </div>
                    <div className="font-optima font-bold text-lg text-brand-blue flex items-center gap-1 font-nums">
                      {product.currency} {product.minAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
                    <div className="flex items-center gap-2 text-brand-grey mb-1.5">
                      <DirhamIcon className="h-4 w-4" />
                      <span className="font-optima text-xs uppercase tracking-wide">Maximum Investment</span>
                    </div>
                    <div className="font-optima font-bold text-lg text-brand-blue font-nums">
                      {product.maxAmount ? `${product.currency} ${product.maxAmount.toLocaleString()}` : 'No Limit'}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
                    <div className="flex items-center gap-2 text-brand-grey mb-1.5">
                      <Calendar className="h-4 w-4" />
                      <span className="font-optima text-xs uppercase tracking-wide">Available Durations</span>
                    </div>
                    <p className="font-optima font-bold text-lg text-brand-blue font-nums">
                      {[...new Set(product.options.map((o) => o.duration))].join(', ')}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
                    <div className="flex items-center gap-2 text-brand-grey mb-1.5">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-optima text-xs uppercase tracking-wide">Return Range</span>
                    </div>
                    <p className="font-optima font-bold text-lg text-brand-blue font-nums">
                      {Math.min(...product.options.map((o) => o.annualReturn))}%{' – '}
                      {Math.max(...product.options.map((o) => o.annualReturn))}% p.a.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Sidebar - Investment Form */}
          <div className="space-y-4 sm:space-y-5">
            {/* Investment Form Card */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="font-optima text-brand-blue flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-grey" />
                  Request Investment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="font-optima text-sm text-brand-blue font-medium">
                    Investment Amount ({product.currency})
                  </Label>
                  <Input
                    id="amount"
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder={`Min: ${product.minAmount.toLocaleString()}`}
                    className="mt-1 border-gray-300 focus:border-brand-blue font-nums"
                  />
                  <div className="font-georgia text-xs text-brand-grey mt-1.5 flex items-center gap-1 font-nums">
                    Range: {product.currency} {formatAmountRange(product)}
                  </div>

                  {/* Slider */}
                  <div className="mt-4">
                    <Slider
                      value={[parseFloat(amount) || product.minAmount]}
                      onValueChange={handleSliderChange}
                      min={product.minAmount}
                      max={product.maxAmount || product.minAmount * 10}
                      step={1000}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-brand-grey items-center font-nums">
                      <span>{product.currency} {product.minAmount.toLocaleString()}</span>
                      <span>{product.currency} {(product.maxAmount || product.minAmount * 10).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="font-optima text-sm text-brand-blue font-medium">
                    Notes <span className="font-georgia text-brand-grey font-normal">(Optional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes for your RM..."
                    rows={3}
                    maxLength={1000}
                    className="mt-1 border-gray-300 focus:border-brand-blue font-georgia text-sm"
                  />
                </div>

                <Separator className="bg-gray-100" />

                {/* Selected Option Summary */}
                {selectedOption && (
                  <div className="bg-brand-blue/5 border border-brand-blue/10 p-4 rounded-lg space-y-2">
                    <p className="font-optima text-xs font-semibold text-brand-blue uppercase tracking-wider">Selected Plan</p>
                    <div className="text-sm space-y-1.5">
                      <div className="flex justify-between">
                        <span className="font-georgia text-brand-grey">Duration</span>
                        <span className="font-optima font-medium text-brand-blue font-nums">{selectedOption.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-georgia text-brand-grey">Withdrawal</span>
                        <span className="font-optima font-medium text-brand-blue font-nums">{selectedOption.withdrawalFrequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-georgia text-brand-grey">ROI</span>
                        <span className="font-optima font-semibold text-brand-blue font-nums">{selectedOption.roi}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-georgia text-brand-grey">Annual Return</span>
                        <span className="font-optima font-semibold text-brand-blue font-nums">
                          {selectedOption.annualReturn}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Projected Returns */}
                {selectedOption && projectedReturns && parseFloat(amount) > 0 && (
                  <div className="bg-[#002369] rounded-lg p-4">
                    <p className="font-optima text-[0.6rem] tracking-[0.2em] text-white/50 uppercase mb-3">
                      Projected Returns
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-georgia text-white/70">Annual Return</span>
                        <span className="font-optima font-semibold text-white font-nums">
                          {product.currency} {Math.round(projectedReturns.annualReturn).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-georgia text-white/70">
                          Total ({projectedReturns.years}{' '}
                          {projectedReturns.years > 1 ? 'yrs' : 'yr'})
                        </span>
                        <span className="font-optima font-semibold text-white font-nums">
                          {product.currency} {Math.round(projectedReturns.totalReturn).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between">
                        <span className="font-optima font-semibold text-white/80">At Maturity</span>
                        <span className="font-optima font-bold text-white text-base font-nums">
                          {product.currency} {Math.round(projectedReturns.totalAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white group transition-colors duration-200 font-optima font-semibold"
                  size="lg"
                  onClick={handleRequestPurchase}
                  disabled={
                    !selectedOption ||
                    !clientRM?.hasRM ||
                    !kycStatus?.canSubmitRequests ||
                    rmLoading ||
                    kycLoading
                  }
                >
                  <span>Request Investment</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>

                {!clientRM?.hasRM && !rmLoading && (
                  <p className="font-georgia text-xs text-center text-red-500">RM assignment required to proceed</p>
                )}

                {!kycStatus?.canSubmitRequests && !kycLoading && (
                  <p className="font-georgia text-xs text-center text-red-500">
                    KYC verification required to proceed
                  </p>
                )}

                <p className="font-georgia text-xs text-brand-grey text-center">
                  Your request will be reviewed by your Relationship Manager
                </p>
              </CardContent>
            </Card>

            {/* Important Info */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="font-optima text-brand-blue text-base">Important Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  'Your request will be reviewed by your assigned Relationship Manager.',
                  'You will receive email notifications about the status of your request.',
                  'Investment returns are subject to market conditions and company performance.',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-grey/40 shrink-0" />
                    <p className="font-georgia text-sm text-brand-grey">{text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* RM Info */}
            {clientRM?.hasRM && clientRM.rm && (
              <Card className="border-gray-200 bg-brand-blue/5">
                <CardHeader className="pb-3">
                  <CardTitle className="font-optima text-brand-blue text-base">Your Relationship Manager</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-optima font-semibold text-brand-blue">
                    {clientRM.rm.firstName} {clientRM.rm.lastName}
                  </p>
                  <p className="font-georgia text-sm text-brand-grey mt-0.5">{clientRM.rm.email}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-optima text-brand-blue text-xl">Confirm Investment Request</DialogTitle>
            <DialogDescription className="font-georgia text-brand-grey">
              Please review your investment details before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Plan', value: product.name },
                { label: 'Amount', value: `${product.currency} ${parseFloat(amount).toLocaleString()}` },
                ...(selectedOption ? [
                  { label: 'Duration', value: selectedOption.duration },
                  { label: 'Withdrawal', value: selectedOption.withdrawalFrequency },
                  { label: 'ROI', value: `${selectedOption.roi}%` },
                  { label: 'Annual Return', value: `${selectedOption.annualReturn}%` },
                ] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-optima text-xs uppercase tracking-wide text-brand-grey">{label}</p>
                  <p className="font-optima font-semibold text-brand-blue mt-0.5 font-nums">{value}</p>
                </div>
              ))}
            </div>

            {notes && (
              <div className="text-sm">
                <p className="font-optima text-xs uppercase tracking-wide text-brand-grey mb-1">Your Notes</p>
                <p className="font-georgia bg-brand-blue/5 border border-brand-blue/10 p-3 rounded-lg text-brand-grey">{notes}</p>
              </div>
            )}

            {projectedReturns && (
              <div className="bg-brand-blue rounded-lg p-4">
                <p className="font-optima text-[0.6rem] tracking-[0.2em] text-white/50 uppercase mb-2">
                  Projected Returns
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-georgia text-sm text-white/70">Total at Maturity</span>
                  <span className="font-optima font-bold text-white text-lg font-nums">
                    {product.currency} {Math.round(projectedReturns.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
              className="font-optima border-gray-300 hover:border-brand-blue hover:text-brand-blue"
            >
              Cancel
            </Button>
            <Button
              onClick={submitRequest}
              disabled={submitting}
              className="font-optima bg-brand-blue hover:bg-brand-blue/90 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Confirm Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
