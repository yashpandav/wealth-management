/**
 * Client - Instruments Browse Page
 * Client-facing page for browsing and investing in instruments
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, TrendingUp, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { InstrumentType } from '@prisma/client';

interface Instrument {
  id: string;
  symbol: string;
  name: string;
  type: InstrumentType;
  currentPrice: number;
  currency: string;
  riskRating: string | null;
  description: string | null;
  minimumInvestment: number | null;
  isActive: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: {
    instruments: Instrument[];
  };
  error?: string;
}

export default function ClientInstrumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Redirect if not authenticated or not CLIENT
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch instruments
  const fetchInstruments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('query', search);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (riskFilter !== 'all') params.append('riskRating', riskFilter);

      const response = await fetch(`/api/client/instruments?${params.toString()}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setInstruments(data.data.instruments);
      } else {
        toast.error(data.error || 'Failed to fetch instruments');
      }
    } catch (error) {
      console.error('Error fetching instruments:', error);
      toast.error('Failed to fetch instruments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      fetchInstruments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, search, typeFilter, riskFilter]);

  if (loading && instruments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Investment Instruments</h1>
        <p className="text-gray-600">
          Explore available investment opportunities and view detailed information
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Instruments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or symbol..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Instrument Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={InstrumentType.STOCK}>Stock</SelectItem>
                  <SelectItem value={InstrumentType.BOND}>Bond</SelectItem>
                  <SelectItem value={InstrumentType.MUTUAL_FUND}>Mutual Fund</SelectItem>
                  <SelectItem value={InstrumentType.ETF}>ETF</SelectItem>
                  <SelectItem value={InstrumentType.COMMODITY}>Commodity</SelectItem>
                  <SelectItem value={InstrumentType.CRYPTOCURRENCY}>Cryptocurrency</SelectItem>
                  <SelectItem value={InstrumentType.REAL_ESTATE}>Real Estate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Risk Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Level</label>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="LOW">Low Risk</SelectItem>
                  <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                  <SelectItem value="HIGH">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruments Grid */}
      {instruments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No instruments found matching your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instruments.map((instrument) => (
            <Card key={instrument.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{instrument.symbol}</CardTitle>
                    <CardDescription className="text-sm">{instrument.name}</CardDescription>
                  </div>
                  {instrument.riskRating && (
                    <Badge
                      variant={
                        instrument.riskRating === 'HIGH'
                          ? 'destructive'
                          : instrument.riskRating === 'MEDIUM'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {instrument.riskRating}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline">{instrument.type.replace('_', ' ')}</Badge>
                </div>

                {/* Current Price */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Price:</span>
                  <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    {instrument.currency} {Number(instrument.currentPrice).toFixed(2)}
                  </div>
                </div>

                {/* Minimum Investment */}
                {instrument.minimumInvestment && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Min. Investment:</span>
                    <span className="font-semibold">
                      {instrument.currency} {Number(instrument.minimumInvestment).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Description */}
                {instrument.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{instrument.description}</p>
                )}

                {/* Action Button */}
                <Button className="w-full" asChild>
                  <Link href={`/client/instruments/${instrument.id}` as never}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
