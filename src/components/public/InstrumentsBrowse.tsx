/**
 * Public Instruments Browse Component
 * Grid/List view with filtering, search, and sorting
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Grid3x3,
  List,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Instrument {
  id: string;
  name: string;
  symbol: string;
  type: string;
  description: string | null;
  riskRating: string | null;
  minimumInvestment: number;
  dividendYield: number;
  currentPrice: number;
  isActive: boolean;
}

interface InstrumentsResponse {
  success: boolean;
  data: {
    instruments: Instrument[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

async function fetchInstruments(params: {
  page: number;
  search: string;
  type: string;
  riskRating: string;
  minInvestment: string;
  maxInvestment: string;
  sortBy: string;
  sortOrder: string;
}): Promise<InstrumentsResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: '12',
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  if (params.search) queryParams.append('search', params.search);
  if (params.type !== 'all') queryParams.append('type', params.type);
  if (params.riskRating !== 'all') queryParams.append('riskRating', params.riskRating);
  if (params.minInvestment) queryParams.append('minInvestment', params.minInvestment);
  if (params.maxInvestment) queryParams.append('maxInvestment', params.maxInvestment);

  const response = await fetch(`/api/public/instruments?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch instruments');
  }
  return response.json();
}

type ViewMode = 'grid' | 'list';

export function InstrumentsBrowse() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskRatingFilter, setRiskRatingFilter] = useState('all');
  const [minInvestment, setMinInvestment] = useState('');
  const [maxInvestment, setMaxInvestment] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'public-instruments',
      page,
      search,
      typeFilter,
      riskRatingFilter,
      minInvestment,
      maxInvestment,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchInstruments({
        page,
        search,
        type: typeFilter,
        riskRating: riskRatingFilter,
        minInvestment,
        maxInvestment,
        sortBy,
        sortOrder,
      }),
  });

  const getRiskBadgeColor = (risk: string | null) => {
    if (!risk) return 'bg-gray-500/10 text-gray-700 border-gray-200';

    const riskUpper = risk.toUpperCase();
    if (riskUpper.includes('LOW')) {
      return 'bg-green-500/10 text-green-700 border-green-200';
    } else if (riskUpper.includes('MEDIUM')) {
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    } else if (riskUpper.includes('HIGH')) {
      return 'bg-red-500/10 text-red-700 border-red-200';
    }
    return 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'STOCK':
        return 'bg-brand-blue/10 text-brand-blue border-blue-200';
      case 'BOND':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'MUTUAL_FUND':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-200';
      case 'ETF':
        return 'bg-cyan-500/10 text-cyan-700 border-cyan-200';
      case 'COMMODITY':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'REAL_ESTATE':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const formatType = (type: string) => {
    return type.replace('_', ' ');
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading instruments..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load instruments. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const instruments = data?.data.instruments || [];
  const pagination = data?.data.pagination;

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Browse Investment Instruments</h2>
          <p className="text-gray-600 mt-1">
            {pagination?.totalCount || 0} instruments available
          </p>
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

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search instruments..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Type Filter */}
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="STOCK">Stock</SelectItem>
            <SelectItem value="BOND">Bond</SelectItem>
            <SelectItem value="MUTUAL_FUND">Mutual Fund</SelectItem>
            <SelectItem value="ETF">ETF</SelectItem>
            <SelectItem value="COMMODITY">Commodity</SelectItem>
            <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
          </SelectContent>
        </Select>

        {/* Risk Filter */}
        <Select
          value={riskRatingFilter}
          onValueChange={(value) => {
            setRiskRatingFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Risk Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="Low">Low Risk</SelectItem>
            <SelectItem value="Medium">Medium Risk</SelectItem>
            <SelectItem value="High">High Risk</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="dividendYield">Dividend Yield</SelectItem>
            <SelectItem value="minimumInvestment">Min Investment</SelectItem>
            <SelectItem value="riskRating">Risk Rating</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Select
          value={sortOrder}
          onValueChange={(value: 'asc' | 'desc') => {
            setSortOrder(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Instruments Grid/List */}
      {instruments.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instruments.map((instrument) => (
                <Card
                  key={instrument.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className={getTypeBadgeColor(instrument.type)}>
                        {formatType(instrument.type)}
                      </Badge>
                      <Badge variant="outline" className={getRiskBadgeColor(instrument.riskRating)}>
                        {instrument.riskRating || 'N/A'}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{instrument.name}</CardTitle>
                    <p className="text-sm text-gray-600 font-mono">{instrument.symbol}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700 line-clamp-2">{instrument.description || 'No description available'}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <DirhamIcon className="h-3 w-3" />
                          <span>Current Price</span>
                        </div>
                        <p className="font-semibold text-green-600 flex items-center">
                          <DirhamIcon className="h-3 w-3 mr-1" />
                          {Number(instrument.currentPrice).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Min Investment</span>
                        </div>
                        <p className="font-semibold flex items-center">
                          <DirhamIcon className="h-3 w-3 mr-1" />
                          {instrument.minimumInvestment.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Link href={`/instruments/${instrument.id}`}>
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {instruments.map((instrument) => (
                <Card key={instrument.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{instrument.name}</h3>
                            <p className="text-sm text-gray-600 font-mono">{instrument.symbol}</p>
                          </div>
                          <Badge variant="outline" className={getTypeBadgeColor(instrument.type)}>
                            {formatType(instrument.type)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getRiskBadgeColor(instrument.riskRating)}
                          >
                            {instrument.riskRating || 'N/A'}
                          </Badge>
                        </div>
                        <p className="text-gray-700 text-sm">{instrument.description || 'No description available'}</p>
                      </div>

                      <div className="flex md:flex-col justify-between md:justify-start items-end gap-4 md:min-w-[200px]">
                        <div className="text-right">
                          <p className="text-xs text-gray-600 mb-1">Current Price</p>
                          <p className="font-semibold text-green-600 flex items-center justify-end">
                            <DirhamIcon className="h-3 w-3 mr-1" />
                            {Number(instrument.currentPrice).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600 mb-1">Min Investment</p>
                          <p className="font-semibold flex items-center justify-end">
                            <DirhamIcon className="h-3 w-3 mr-1" />
                            {instrument.minimumInvestment.toLocaleString()}
                          </p>
                        </div>
                        <Link href={`/instruments/${instrument.id}`}>
                          <Button size="sm">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No instruments found matching your filters.</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setRiskRatingFilter('all');
                setMinInvestment('');
                setMaxInvestment('');
                setPage(1);
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} instruments
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
