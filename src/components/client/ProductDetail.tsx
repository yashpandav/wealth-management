/**
 * Client Product Detail Component
 * Professional product view with manual amount entry and slider
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  TrendingUp,
  DollarSign,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowRight,
} from 'lucide-react';
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
  addressProofVerified: boolean;
  canSubmitRequests: boolean;
  identityProofStatus?: string;
  addressProofStatus?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FAQ[] = [
  {
    question: 'How does the investment process work?',
    answer:
      'After selecting your preferred investment plan and amount, submit a product request. Your Relationship Manager will review your request and verify the bank transfer. Once approved, your investment will be activated in your portfolio.',
  },
  {
    question: 'When will I receive my returns?',
    answer:
      'Returns are calculated based on the annual percentage specified in your selected plan. The withdrawal frequency determines how often you can access your returns - either monthly, quarterly, semi-annually, or at maturity.',
  },
  {
    question: 'Can I withdraw my principal amount early?',
    answer:
      'Early withdrawal terms depend on your selected investment plan. Please review the specific terms of your chosen plan or contact your Relationship Manager for details.',
  },
  {
    question: 'What documents do I need to submit?',
    answer:
      'You need to complete KYC verification by submitting Identity Proof and Address Proof documents. These must be verified before you can submit any investment requests.',
  },
];

export function ProductDetail({ product, clientRM, rmLoading }: ProductDetailProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null);
  const [amount, setAmount] = useState<string>(product.minAmount.toString());
  const [notes, setNotes] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

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
      const documents = result.data?.documents || [];

      const identityProof = documents.find((d: any) => d.documentType === 'IDENTITY_PROOF');
      const addressProof = documents.find((d: any) => d.documentType === 'ADDRESS_PROOF');

      const identityProofVerified = identityProof?.verificationStatus === 'VERIFIED';
      const addressProofVerified = addressProof?.verificationStatus === 'VERIFIED';

      setKycStatus({
        identityProofVerified,
        addressProofVerified,
        canSubmitRequests: identityProofVerified && addressProofVerified,
        identityProofStatus: identityProof?.verificationStatus,
        addressProofStatus: addressProof?.verificationStatus,
      });
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      setKycStatus({
        identityProofVerified: false,
        addressProofVerified: false,
        canSubmitRequests: false,
      });
    } finally {
      setKycLoading(false);
    }
  };

  const getProductBadgeColor = (name: string) => {
    if (name.includes('A')) {
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    } else if (name.includes('B')) {
      return 'bg-purple-500/10 text-purple-700 border-purple-200';
    } else if (name.includes('C')) {
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    }
    return 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const formatAmountRange = (prod: Product) => {
    const min = prod.minAmount.toLocaleString();
    if (prod.maxAmount) {
      const max = prod.maxAmount.toLocaleString();
      return `${prod.currency} ${min} – ${max}`;
    }
    return `${prod.currency} ${min} and Above`;
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
      toast.error('You must have an assigned Relationship Manager to request a product');
      return;
    }
    if (!kycStatus?.canSubmitRequests) {
      toast.error(
        'Your KYC documents must be verified before submitting product requests. Please upload and verify your documents.'
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
          productId: product.id,
          productOptionId: selectedOption.id,
          amount: parseFloat(amount),
          clientNotes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product purchase request submitted successfully!');
        setShowConfirmDialog(false);
        router.push(`/client/product-requests?tracking=${data.data.trackingNumber}`);
      } else {
        if (data.code === 'NO_RM_ASSIGNED') {
          toast.error('You must have an assigned Relationship Manager to request a product');
        } else if (data.code === 'IDENTITY_PROOF_NOT_VERIFIED') {
          toast.error(
            'Your Identity Proof document must be verified. Please upload and verify your documents.'
          );
        } else if (data.code === 'ADDRESS_PROOF_NOT_VERIFIED') {
          toast.error(
            'Your Address Proof document must be verified. Please upload and verify your documents.'
          );
        } else {
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
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/client/portfolio" className="hover:text-gray-900">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/client/products" className="hover:text-gray-900">
              Products
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* RM Warning */}
        {!rmLoading && !clientRM?.hasRM && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">No Relationship Manager Assigned</p>
              <p className="text-sm text-yellow-700">
                You must have an assigned RM to request product purchases. Please contact support.
              </p>
            </div>
          </div>
        )}

        {/* KYC Verification Warning */}
        {!kycLoading && kycStatus && !kycStatus.canSubmitRequests && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">KYC Verification Required</p>
                <p className="text-sm text-orange-700 mt-1">
                  You must complete your KYC verification before submitting product requests.
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  {!kycStatus.identityProofVerified && (
                    <div className="flex items-center gap-2">
                      <span className="text-orange-700">
                        Identity Proof{' '}
                        {kycStatus.identityProofStatus === 'REJECTED'
                          ? 'rejected - please re-upload'
                          : 'not verified'}
                      </span>
                    </div>
                  )}
                  {!kycStatus.addressProofVerified && (
                    <div className="flex items-center gap-2">
                      <span className="text-orange-700">
                        Address Proof{' '}
                        {kycStatus.addressProofStatus === 'REJECTED'
                          ? 'rejected - please re-upload'
                          : 'not verified'}
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  href="/upload-documents"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Upload & Verify Documents
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-3">
                <p className="text-xl text-gray-600 font-mono flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {formatAmountRange(product)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getProductBadgeColor(product.name)}>
                {product.name}
              </Badge>
              {highestReturn && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                  Up to {highestReturn}% Annual Return
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && <p className="text-gray-700 text-lg">{product.description}</p>}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column - Product Options & FAQ */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Options */}
            <Card>
              <CardHeader>
                <CardTitle>Select Investment Option</CardTitle>
                <p className="text-sm text-gray-600">
                  Choose your preferred duration and withdrawal frequency
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedOption?.id === option.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedOption(option)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedOption?.id === option.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-400'
                          }`}
                        >
                          {selectedOption?.id === option.id && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              {option.duration}
                            </span>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="flex items-center gap-1 text-gray-600">
                              <Clock className="h-4 w-4" />
                              {option.withdrawalFrequency} Withdrawal
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-semibold">
                          ROI: {option.roi}%
                        </Badge>
                        <Badge className="bg-green-600 font-semibold">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {option.annualReturn}% Annual
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Key Information */}
            <Card>
              <CardHeader>
                <CardTitle>Key Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Minimum Investment</span>
                    </div>
                    <p className="font-semibold text-lg">
                      {product.currency} {product.minAmount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Maximum Investment</span>
                    </div>
                    <p className="font-semibold text-lg">
                      {product.maxAmount
                        ? `${product.currency} ${product.maxAmount.toLocaleString()}`
                        : 'No Limit'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Available Durations</span>
                    </div>
                    <p className="font-semibold text-lg">
                      {[...new Set(product.options.map((o) => o.duration))].join(', ')}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Return Range</span>
                    </div>
                    <p className="font-semibold text-lg text-green-600">
                      {Math.min(...product.options.map((o) => o.annualReturn))}% -{' '}
                      {Math.max(...product.options.map((o) => o.annualReturn))}% Annual
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-gray-700" />
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {DEFAULT_FAQS.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      {expandedFAQ === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFAQ === index && (
                      <div className="p-4 bg-white border-t border-gray-200">
                        <p className="text-gray-700 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Investment Form */}
          <div className="space-y-6">
            {/* Investment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Request Investment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">Investment Amount ({product.currency})</Label>
                  <Input
                    id="amount"
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder={`Min: ${product.minAmount.toLocaleString()}`}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: {formatAmountRange(product)}</p>

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
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{product.currency} {product.minAmount.toLocaleString()}</span>
                      <span>{product.currency} {(product.maxAmount || product.minAmount * 10).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes for your RM..."
                    rows={3}
                    maxLength={1000}
                    className="mt-1"
                  />
                </div>

                <Separator />

                {/* Selected Option Summary */}
                {selectedOption && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-sm">Selected Plan</p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedOption.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Withdrawal:</span>
                        <span className="font-medium">{selectedOption.withdrawalFrequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ROI:</span>
                        <span className="font-medium text-blue-600">{selectedOption.roi}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual Return:</span>
                        <span className="font-medium text-green-600">
                          {selectedOption.annualReturn}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Projected Returns */}
                {selectedOption && projectedReturns && parseFloat(amount) > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Projected Returns
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Annual Return:</span>
                        <span className="font-semibold text-green-600">
                          {product.currency} {Math.round(projectedReturns.annualReturn).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Total Return ({projectedReturns.years}{' '}
                          {projectedReturns.years > 1 ? 'years' : 'year'}):
                        </span>
                        <span className="font-semibold text-green-600">
                          {product.currency} {Math.round(projectedReturns.totalReturn).toLocaleString()}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total at Maturity:</span>
                        <span className="font-bold text-green-600 text-base">
                          {product.currency} {Math.round(projectedReturns.totalAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white group"
                  size="lg"
                  onClick={handleRequestPurchase}
                  disabled={
                    !selectedOption ||
                    !validateAmount() ||
                    !clientRM?.hasRM ||
                    !kycStatus?.canSubmitRequests ||
                    rmLoading ||
                    kycLoading
                  }
                >
                  <span>Request Purchase</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>

                {!clientRM?.hasRM && !rmLoading && (
                  <p className="text-xs text-center text-red-600">RM assignment required to proceed</p>
                )}

                {!kycStatus?.canSubmitRequests && !kycLoading && (
                  <p className="text-xs text-center text-red-600">
                    KYC verification required to proceed
                  </p>
                )}

                <p className="text-xs text-gray-500 text-center">
                  Your request will be reviewed by your Relationship Manager
                </p>
              </CardContent>
            </Card>

            {/* Important Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Important Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>Your request will be reviewed by your assigned Relationship Manager.</p>
                <p>You will receive email notifications about the status of your request.</p>
                <p>
                  Investment returns are subject to market conditions and company performance.
                </p>
              </CardContent>
            </Card>

            {/* RM Info */}
            {clientRM?.hasRM && clientRM.rm && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Relationship Manager</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-gray-900">
                    {clientRM.rm.firstName} {clientRM.rm.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{clientRM.rm.email}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase Request</DialogTitle>
            <DialogDescription>
              Please review your investment details before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Product</p>
                <p className="font-semibold">{product.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-semibold">
                  {product.currency} {parseFloat(amount).toLocaleString()}
                </p>
              </div>
              {selectedOption && (
                <>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-semibold">{selectedOption.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Withdrawal</p>
                    <p className="font-semibold">{selectedOption.withdrawalFrequency}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">ROI</p>
                    <p className="font-semibold text-blue-600">{selectedOption.roi}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Annual Return</p>
                    <p className="font-semibold text-green-600">{selectedOption.annualReturn}%</p>
                  </div>
                </>
              )}
            </div>

            {notes && (
              <div className="text-sm">
                <p className="text-gray-600">Your Notes</p>
                <p className="bg-gray-50 p-2 rounded mt-1">{notes}</p>
              </div>
            )}

            {projectedReturns && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Projected Returns
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Total at Maturity</span>
                  <span className="text-lg font-bold text-green-600">
                    {product.currency} {Math.round(projectedReturns.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
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
