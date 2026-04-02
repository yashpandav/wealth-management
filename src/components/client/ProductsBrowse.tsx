/**
 * Client Products Browse Component
 * Professional investment plans showcase
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Grid3x3,
  List,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
  };
  error?: string;
}

async function fetchProducts(): Promise<ProductsResponse> {
  const response = await fetch('/api/client/products');
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}

async function fetchKYCStatus(): Promise<{
  success: boolean;
  data: {
    canSubmitRequests: boolean;
    identityProofVerified: boolean;
    identityProofStatus?: string;
    kycStatus?: string;
  };
}> {
  const response = await fetch('/api/documents');
  if (!response.ok) {
    throw new Error('Failed to fetch KYC status');
  }
  const result = await response.json();

  const identityProof = result.data?.identityProof;
  const kycStatus = result.data?.kycStatus; // Overall client verification status
  const identityProofVerified = identityProof?.verificationStatus === 'VERIFIED';

  // Client can submit requests if overall KYC status is VERIFIED
  const canSubmitRequests = kycStatus === 'VERIFIED';

  return {
    success: true,
    data: {
      identityProofVerified,
      canSubmitRequests,
      identityProofStatus: identityProof?.verificationStatus,
      kycStatus,
    },
  };
}

type ViewMode = 'grid' | 'list';

export function ProductsBrowse() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-products'],
    queryFn: fetchProducts,
  });

  const { data: kycStatus } = useQuery({
    queryKey: ['client-kyc-status'],
    queryFn: fetchKYCStatus,
  });

  const getProductAccentColor = (name: string) => {
    // Use brand colors consistently - subtle variations for each venture
    if (name.includes('A')) {
      return {
        gradient: 'bg-brand-blue',
        text: 'text-brand-blue',
        bg: 'bg-brand-blue/5',
        border: 'border-brand-blue/20',
        hover: 'hover:border-brand-blue/40 hover:shadow-lg',
        badge: 'bg-brand-blue/10 text-brand-blue border-brand-blue/30',
      };
    } else if (name.includes('B')) {
      return {
        gradient: 'bg-brand-blue',
        text: 'text-brand-blue',
        bg: 'bg-brand-blue/5',
        border: 'border-brand-blue/20',
        hover: 'hover:border-brand-blue/40 hover:shadow-lg',
        badge: 'bg-brand-blue/10 text-brand-blue border-brand-blue/30',
      };
    } else if (name.includes('C')) {
      return {
        gradient: 'bg-brand-blue',
        text: 'text-brand-blue',
        bg: 'bg-brand-blue/5',
        border: 'border-brand-blue/20',
        hover: 'hover:border-brand-blue/40 hover:shadow-lg',
        badge: 'bg-brand-blue/10 text-brand-blue border-brand-blue/30',
      };
    }
    return {
      gradient: 'bg-brand-blue',
      text: 'text-brand-blue',
      bg: 'bg-brand-blue/5',
      border: 'border-brand-blue/20',
      hover: 'hover:border-brand-blue/40 hover:shadow-lg',
      badge: 'bg-brand-blue/10 text-brand-blue border-brand-blue/30',
    };
  };

  const formatAmountRange = (product: Product) => {
    const min = product.minAmount.toLocaleString();
    if (product.maxAmount) {
      const max = product.maxAmount.toLocaleString();
      return `${min} - ${max}`;
    }
    return `${min}+`;
  };

  const getHighestReturn = (options: ProductOption[]) => {
    if (options.length === 0) return null;
    return Math.max(...options.map((o) => o.annualReturn));
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading plans..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl border-red-200 bg-red-50">
        <AlertCircle className="h-5 w-5" />
        <AlertDescription className="font-georgia text-comments">
          Failed to load plans. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const products = data?.data.products || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-brand-grey/20">
        <div>
          <h1 className="font-optima text-2xl font-bold text-brand-blue">Available Plans</h1>
          <p className="font-georgia text-comments text-brand-grey mt-1 font-nums">
            {products.length} {products.length === 1 ? 'plan' : 'plans'} available
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-brand-grey/20 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-brand-grey hover:text-brand-blue'
              }`}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-brand-grey hover:text-brand-blue'
              }`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KYC Status Alert */}
      {kycStatus && !kycStatus.data.canSubmitRequests && (() => {
        const isPending =
          kycStatus.data.kycStatus === 'PENDING' ||
          kycStatus.data.kycStatus === 'UNDER_REVIEW' ||
          kycStatus.data.identityProofStatus === 'PENDING' ||
          kycStatus.data.identityProofStatus === 'UNDER_REVIEW';

        if (isPending) {
          return (
            <Alert className="border-l-4 border-l-blue-500 bg-blue-50 border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-700" />
              <AlertDescription className="text-blue-700">
                <div className="font-optima font-semibold mb-3 text-lg">Verification In Progress</div>
                <p className="font-georgia text-comments mb-4 text-blue-600">
                  Your documents are under review. You will be notified once verification is complete.
                </p>
                <div className="space-y-2 text-comments">
                  {!kycStatus.data.identityProofVerified && (
                    <div className="flex items-center gap-2 font-georgia text-blue-600">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>Identity Proof (under review)</span>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          );
        }

        return (
          <Alert className="border-l-4 border-l-brand-blue bg-brand-blue/5 border-brand-blue/30">
            <AlertCircle className="h-5 w-5 text-brand-blue" />
            <AlertDescription className="text-brand-blue">
              <div className="font-optima font-semibold mb-3 text-lg">KYC Verification Required</div>
              <p className="font-georgia text-comments mb-4 text-brand-grey">
                Complete your KYC verification to submit plan requests and begin investing.
              </p>
              <div className="space-y-2 text-comments mb-5">
                {!kycStatus.data.identityProofVerified && (
                  <div className="flex items-center gap-2 font-georgia text-brand-grey">
                    <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
                    <span>
                      Identity Proof{' '}
                      {kycStatus.data.identityProofStatus === 'REJECTED'
                        ? '(rejected - please re-upload)'
                        : '(not verified)'}
                    </span>
                  </div>
                )}
              </div>
              <Link href="/client/documents">
                <Button className="bg-brand-blue hover:bg-brand-blue/90 text-white font-optima shadow-lg">
                  Upload Documents
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        );
      })()}

      {/* Products Display */}
      {products.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const highestReturn = getHighestReturn(product.options);
                const colors = getProductAccentColor(product.name);

                return (
                  <div
                    key={product.id}
                    className={`bg-white border-2 ${colors.border} rounded-xl overflow-hidden ${colors.hover} transition-all duration-300`}
                  >
                    {/* Product Header */}
                    <div className={`${colors.gradient} px-6 py-6 text-white`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold font-nums">{product.name}</h3>
                        {highestReturn && (
                          <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                            <p className="font-nums text-xs font-semibold text-brand-blue font-nums">Up to {highestReturn}%</p>
                          </div>
                        )}
                      </div>
                      <p className="text-white/95 font-nums text-comments font-medium font-nums">
                        <span className="flex items-center gap-1">
                          <DirhamIcon className="h-4 w-4 text-white" />
                          {formatAmountRange(product)}
                        </span>
                      </p>
                    </div>

                    {/* Product Body */}
                    <div className="px-6 py-5">
                      <p className="font-nums text-brand-grey text-comments mb-5 min-h-[50px] leading-relaxed">
                        {product.description ||
                          'Secure investment opportunity with competitive returns and flexible terms'}
                      </p>

                      {/* Investment Options */}
                      <div className="space-y-2 mb-5">
                        <p className="font-optima text-xs font-semibold text-brand-blue uppercase tracking-wider mb-3">
                          Investment Plans
                        </p>
                        {product.options.slice(0, 3).map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between py-2.5 px-3 bg-brand-blue/5 rounded-lg border border-brand-blue/10"
                          >
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-3.5 w-3.5 text-brand-blue" />
                              <span className="text-comments text-brand-blue font-medium font-nums">{option.duration}</span>
                              <span className="text-xs text-brand-grey font-nums">
                                {option.withdrawalFrequency}
                              </span>
                            </div>
                            <span className="text-comments font-bold text-brand-blue font-nums">
                              {option.annualReturn}%
                            </span>
                          </div>
                        ))}
                        {product.options.length > 3 && (
                          <p className="font-georgia text-xs text-brand-grey text-center pt-1 font-nums">
                            +{product.options.length - 3} more plan
                            {product.options.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <Link href={`/client/products/${product.id}`}>
                        <Button
                          className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white group font-optima shadow-lg hover:shadow-xl transition-all"
                          size="default"
                        >
                          <span>View Details</span>
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5">
              {products.map((product) => {
                const highestReturn = getHighestReturn(product.options);
                const colors = getProductAccentColor(product.name);

                return (
                  <div
                    key={product.id}
                    className={`bg-white border-2 ${colors.border} rounded-xl overflow-hidden ${colors.hover} transition-all duration-300`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Left Section - Product Info */}
                      <div className={`${colors.gradient} text-white p-4 w-full md:w-60 flex-shrink-0 flex flex-col justify-center`}>
                        <h3 className="text-xl font-bold mb-1 font-nums">{product.name}</h3>
                        <p className="text-white/90 font-georgia text-sm font-medium mb-3 font-nums">
                          <span className="flex items-center gap-1">
                            <DirhamIcon className="h-3.5 w-3.5 text-white" />
                            {formatAmountRange(product)}
                          </span>
                        </p>
                        {highestReturn && (
                          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                            <TrendingUp className="h-3 w-3 text-white" />
                            <span className="font-georgia text-xs font-semibold text-white font-nums">
                              Up to {highestReturn}% Annual
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Details & Options */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <p className="font-nums text-brand-grey text-sm mb-3 leading-relaxed line-clamp-2">
                            {product.description ||
                              'Secure investment opportunity with competitive returns and flexible terms'}
                          </p>

                          <div className="mb-3">
                            <p className="font-optima text-[10px] font-bold text-brand-grey/70 uppercase tracking-widest mb-2">
                              {product.options.length} Available Plans
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {product.options.map((option) => (
                                <div
                                  key={option.id}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-blue/5 border border-brand-blue/10 rounded-md font-georgia text-sm hover:bg-brand-blue/10 transition-colors"
                                >
                                  <span className="text-brand-blue font-semibold font-nums">{option.duration}</span>
                                  <span className="text-brand-grey/40 text-[10px]">•</span>
                                  <span className="text-brand-grey text-xs font-nums">
                                    {option.withdrawalFrequency}
                                  </span>
                                  <span className="text-brand-grey/40 text-[10px]">•</span>
                                  <span className="font-nums font-bold text-brand-blue text-sm">
                                    {option.annualReturn}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Link href={`/client/products/${product.id}`}>
                            <Button
                              className="bg-brand-blue hover:bg-brand-blue/90 text-white font-optima shadow-md hover:shadow-lg transition-all h-9 text-sm"
                              size="sm"
                            >
                              <span>View Details</span>
                              <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-brand-grey/20">
          <div className="max-w-md mx-auto">
            <div className="mx-auto h-14 w-14 bg-brand-blue/10 rounded-full flex items-center justify-center mb-5 border-2 border-brand-blue/20">
              <TrendingUp className="h-7 w-7 text-brand-blue" />
            </div>
            <h3 className="font-optima text-lg font-semibold text-brand-blue mb-2">No Plans Available</h3>
            <p className="font-georgia text-brand-grey text-comments leading-relaxed">
              No investment plans are currently available. Please check back later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
