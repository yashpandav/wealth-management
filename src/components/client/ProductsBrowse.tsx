/**
 * Client Products Browse Component
 * Professional investment products showcase
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Grid3x3,
  List,
  Loader2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
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
    identityProofVerified: boolean;
    addressProofVerified: boolean;
    canSubmitRequests: boolean;
    identityProofStatus?: string;
    addressProofStatus?: string;
  };
}> {
  const response = await fetch('/api/documents');
  if (!response.ok) {
    throw new Error('Failed to fetch KYC status');
  }
  const result = await response.json();

  const documents = result.data?.documents || [];
  const identityProof = documents.find((d: { documentType: string; verificationStatus: string }) => d.documentType === 'IDENTITY_PROOF');
  const addressProof = documents.find((d: { documentType: string; verificationStatus: string }) => d.documentType === 'ADDRESS_PROOF');

  const identityProofVerified = identityProof?.verificationStatus === 'VERIFIED';
  const addressProofVerified = addressProof?.verificationStatus === 'VERIFIED';

  return {
    success: true,
    data: {
      identityProofVerified,
      addressProofVerified,
      canSubmitRequests: identityProofVerified && addressProofVerified,
      identityProofStatus: identityProof?.verificationStatus,
      addressProofStatus: addressProof?.verificationStatus,
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
    if (name.includes('A')) {
      return {
        gradient: 'from-blue-500 to-blue-600',
        text: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        hover: 'hover:border-blue-300',
      };
    } else if (name.includes('B')) {
      return {
        gradient: 'from-purple-500 to-purple-600',
        text: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        hover: 'hover:border-purple-300',
      };
    } else if (name.includes('C')) {
      return {
        gradient: 'from-emerald-500 to-emerald-600',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        hover: 'hover:border-emerald-300',
      };
    }
    return {
      gradient: 'from-gray-500 to-gray-600',
      text: 'text-gray-700',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      hover: 'hover:border-gray-300',
    };
  };

  const formatAmountRange = (product: Product) => {
    const min = product.minAmount.toLocaleString();
    if (product.maxAmount) {
      const max = product.maxAmount.toLocaleString();
      return `${product.currency} ${min} - ${max}`;
    }
    return `${product.currency} ${min}+`;
  };

  const getHighestReturn = (options: ProductOption[]) => {
    if (options.length === 0) return null;
    return Math.max(...options.map((o) => o.annualReturn));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-600">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load products. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const products = data?.data.products || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Products</h1>
          <p className="text-sm text-gray-600 mt-1">
            {products.length} {products.length === 1 ? 'product' : 'products'} available
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KYC Status Alert */}
      {kycStatus && !kycStatus.data.canSubmitRequests && (
        <Alert className="border-l-4 border-l-amber-500 bg-amber-50 border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <div className="font-semibold mb-2">KYC Verification Required</div>
            <p className="text-sm mb-3">
              Complete your KYC verification to submit product requests and start investing.
            </p>
            <div className="space-y-1 text-sm mb-4">
              {!kycStatus.data.identityProofVerified && (
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  <span>
                    Identity Proof{' '}
                    {kycStatus.data.identityProofStatus === 'REJECTED'
                      ? '(rejected - please re-upload)'
                      : '(not verified)'}
                  </span>
                </div>
              )}
              {!kycStatus.data.addressProofVerified && (
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  <span>
                    Address Proof{' '}
                    {kycStatus.data.addressProofStatus === 'REJECTED'
                      ? '(rejected - please re-upload)'
                      : '(not verified)'}
                  </span>
                </div>
              )}
            </div>
            <Link href="/upload-documents">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Upload Documents
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

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
                    className={`bg-white border ${colors.border} rounded-xl overflow-hidden ${colors.hover} transition-all duration-200 shadow-sm hover:shadow-md`}
                  >
                    {/* Product Header with Gradient */}
                    <div className={`bg-gradient-to-r ${colors.gradient} px-6 py-5 text-white`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold">{product.name}</h3>
                        {highestReturn && (
                          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <p className="text-xs font-semibold">Up to {highestReturn}%</p>
                          </div>
                        )}
                      </div>
                      <p className="text-white/90 text-sm font-medium">
                        {formatAmountRange(product)}
                      </p>
                    </div>

                    {/* Product Body */}
                    <div className="px-6 py-5">
                      <p className="text-gray-700 text-sm mb-5 min-h-[40px]">
                        {product.description ||
                          'Secure investment opportunity with competitive returns and flexible terms'}
                      </p>

                      {/* Investment Options */}
                      <div className="space-y-2 mb-5">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                          Investment Plans
                        </p>
                        {product.options.slice(0, 3).map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                              <span className="text-sm text-gray-700">{option.duration}</span>
                              <span className="text-xs text-gray-500">
                                {option.withdrawalFrequency}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              {option.annualReturn}%
                            </span>
                          </div>
                        ))}
                        {product.options.length > 3 && (
                          <p className="text-xs text-gray-500 text-center pt-1">
                            +{product.options.length - 3} more plan
                            {product.options.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <Link href={`/client/products/${product.id}`}>
                        <Button
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white group"
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
            <div className="space-y-4">
              {products.map((product) => {
                const highestReturn = getHighestReturn(product.options);
                const colors = getProductAccentColor(product.name);

                return (
                  <div
                    key={product.id}
                    className={`bg-white border ${colors.border} rounded-xl overflow-hidden ${colors.hover} transition-all duration-200 shadow-sm hover:shadow-md`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Left Section - Product Info */}
                      <div className={`bg-gradient-to-br ${colors.gradient} text-white p-6 md:w-64 flex-shrink-0`}>
                        <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                        <p className="text-white/90 text-sm font-medium mb-4">
                          {formatAmountRange(product)}
                        </p>
                        {highestReturn && (
                          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-semibold">
                              Up to {highestReturn}% Annual
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Details & Options */}
                      <div className="flex-1 p-6">
                        <p className="text-gray-700 text-sm mb-5">
                          {product.description ||
                            'Secure investment opportunity with competitive returns and flexible terms'}
                        </p>

                        <div className="mb-5">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                            Available Investment Plans ({product.options.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {product.options.map((option) => (
                              <div
                                key={option.id}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                              >
                                <span className="text-gray-700">{option.duration}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600 text-xs">
                                  {option.withdrawalFrequency}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="font-semibold text-green-600">
                                  {option.annualReturn}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Link href={`/client/products/${product.id}`}>
                          <Button
                            className="bg-gray-900 hover:bg-gray-800 text-white group"
                            size="default"
                          >
                            <span>View Full Details & Apply</span>
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="mx-auto h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-600 text-sm">
              No investment products are currently available. Please check back later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
