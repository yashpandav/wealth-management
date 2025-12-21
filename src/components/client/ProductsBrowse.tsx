/**
 * Client Products Browse Component
 * Grid/List view for investment products (Venture A, B, C)
 * Styled to match InstrumentsBrowse component
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
  DollarSign,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

type ViewMode = 'grid' | 'list';

export function ProductsBrowse() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-products'],
    queryFn: fetchProducts,
  });

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

  const formatAmountRange = (product: Product) => {
    const min = product.minAmount.toLocaleString();
    if (product.maxAmount) {
      const max = product.maxAmount.toLocaleString();
      return `${product.currency} ${min} – ${max}`;
    }
    return `${product.currency} ${min} and Above`;
  };

  const getHighestReturn = (options: ProductOption[]) => {
    if (options.length === 0) return null;
    return Math.max(...options.map((o) => o.annualReturn));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load products. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const products = data?.data.products || [];

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investment Products</h2>
          <p className="text-gray-600 mt-1">{products.length} products available</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products Grid/List */}
      {products.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const highestReturn = getHighestReturn(product.options);

                return (
                  <Card
                    key={product.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={getProductBadgeColor(product.name)}>
                          {product.name}
                        </Badge>
                        {highestReturn && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                            Up to {highestReturn}% Annual
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-mono">{formatAmountRange(product)}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {product.description || 'Premium investment opportunity with competitive returns'}
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <Calendar className="h-3 w-3" />
                            <span>Options</span>
                          </div>
                          <p className="font-semibold">{product.options.length} Plans</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Best Return</span>
                          </div>
                          <p className="font-semibold text-green-600">
                            {highestReturn ? `${highestReturn}%` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Options Preview */}
                      <div className="space-y-2">
                        {product.options.slice(0, 2).map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm"
                          >
                            <span className="text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {option.duration} / {option.withdrawalFrequency}
                            </span>
                            <span className="font-semibold text-green-600">
                              {option.annualReturn}% Annual
                            </span>
                          </div>
                        ))}
                        {product.options.length > 2 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{product.options.length - 2} more options
                          </p>
                        )}
                      </div>

                      <Link href={`/client/products/${product.id}`}>
                        <Button className="w-full">View Details</Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                const highestReturn = getHighestReturn(product.options);

                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                              <p className="text-sm text-gray-600 font-mono flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {formatAmountRange(product)}
                              </p>
                            </div>
                            <Badge variant="outline" className={getProductBadgeColor(product.name)}>
                              {product.name}
                            </Badge>
                            {highestReturn && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                                Up to {highestReturn}% Annual
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm">
                            {product.description || 'Premium investment opportunity with competitive returns'}
                          </p>

                          {/* Options in list view */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {product.options.map((option) => (
                              <Badge key={option.id} variant="secondary" className="text-xs">
                                {option.duration} / {option.withdrawalFrequency}: {option.annualReturn}%
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex md:flex-col justify-between md:justify-start items-end gap-4 md:min-w-[200px]">
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">Options Available</p>
                            <p className="font-semibold">{product.options.length} Plans</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">Best Annual Return</p>
                            <p className="font-semibold text-green-600">
                              {highestReturn ? `${highestReturn}%` : 'N/A'}
                            </p>
                          </div>
                          <Link href={`/client/products/${product.id}`}>
                            <Button size="sm">View Details</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No products available at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
