/**
 * RM - Client Detail Page
 * View detailed information about a specific assigned client
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  User,
  Mail,
  Phone,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ArrowLeft,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RequestStatus, WithdrawalStatus } from '@prisma/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ClientDetail {
  id: string;
  kycVerified: boolean;
  assignedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    createdAt: string;
  };
  portfolio: {
    id: string;
    totalValue: number;
    totalInvested: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    holdings: Array<{
      id: string;
      quantity: number;
      averageBuyPrice: number;
      currentValue: number;
      gainLoss: number;
      gainLossPercent: number;
      instrument: {
        symbol: string;
        name: string;
        type: string;
        currentPrice: number;
        currency: string;
      };
    }>;
  } | null;
  purchaseRequests: Array<{
    id: string;
    trackingNumber: string;
    status: RequestStatus;
    amount: number;
    quantity: number | null;
    createdAt: string;
    instrument: {
      symbol: string;
      name: string;
    };
  }>;
  withdrawalRequests: Array<{
    id: string;
    trackingNumber: string;
    status: WithdrawalStatus;
    amount: number;
    createdAt: string;
  }>;
}

interface ApiResponse {
  success: boolean;
  data?: {
    client: ClientDetail;
  };
  error?: string;
}

export default function RMClientDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated or not RM
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'RM') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch client details
  const fetchClientDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rm/clients/${clientId}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setClient(data.data.client);
      } else {
        toast.error(data.error || 'Failed to fetch client details');
        router.push('/rm/clients');
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast.error('Failed to fetch client details');
      router.push('/rm/clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'RM' && clientId) {
      fetchClientDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, clientId]);

  // Format phone number for WhatsApp (remove non-digits)
  const formatPhoneForWhatsApp = (phone: string | null): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  // Status badge component for withdrawal requests
  const WithdrawalStatusBadge = ({ status }: { status: WithdrawalStatus }) => {
    const statusLabels: Record<WithdrawalStatus, string> = {
      PENDING: 'Pending',
      RM_REVIEW: 'RM Review',
      RM_APPROVED: 'RM Approved',
      RM_REJECTED: 'RM Rejected',
      ADMIN_REVIEW: 'Admin Review',
      ADMIN_APPROVED: 'Admin Approved',
      ADMIN_REJECTED: 'Admin Rejected',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };

    const variants: Record<WithdrawalStatus, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "secondary",
      RM_REVIEW: "default",
      RM_APPROVED: "default",
      RM_REJECTED: "destructive",
      ADMIN_REVIEW: "default",
      ADMIN_APPROVED: "default",
      ADMIN_REJECTED: "destructive",
      COMPLETED: "default",
      CANCELLED: "secondary"
    };

    return <Badge variant={variants[status]}>{statusLabels[status]}</Badge>;
  };

  if (loading) {
    return <LoadingSpinner className="min-h-[60vh]" />;
  }

  if (!client) {
    return null;
  }

  const isPositiveGain = client.portfolio ? client.portfolio.totalGainLoss >= 0 : true;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 max-w-7xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-muted-foreground hover:bg-transparent hover:text-brand-blue pl-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-brand-blue text-white flex items-center justify-center text-2xl font-optima shadow-lg">
              {client.user.firstName[0]}{client.user.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold font-optima text-brand-blue">
                  {client.user.firstName} {client.user.lastName}
                </h1>
              </div>
              <p className="text-gray-500 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {client.user.email}
                </span>
                {client.user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> <span className="font-nums">{client.user.phone}</span>
                  </span>
                )}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Joined: <span className="font-nums">{format(new Date(client.user.createdAt), 'MMM dd, yyyy')}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {client.user.phone && (
              <>
                <Button
                  variant="outline"
                  className="gap-2 border-brand-blue text-brand-blue hover:text-brand-blue hover:bg-brand-blue/10 bg-white"
                  onClick={() => window.location.href = `tel:${client.user.phone}`}
                >
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
                <Button
                  className="gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
                  onClick={() => window.open(`https://wa.me/${formatPhoneForWhatsApp(client.user.phone)}`, '_blank')}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </>
            )}
            <Button className="gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white">
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </div>
      </div>

      {/* Portfolio Stats Grid */}
      {client.portfolio ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-brand-blue to-[#003399] text-white border-none rounded-xl shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <Badge variant="outline" className="text-white border-white/20 bg-white/10">
                  Total Equity
                </Badge>
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">Portfolio Value</p>
                <h3 className="text-3xl font-bold font-nums tracking-tight">
                  ${client.portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-brand-blue" />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Total Invested</p>
                <h3 className="text-3xl font-bold font-nums tracking-tight text-gray-900">
                  ${client.portfolio.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${isPositiveGain ? 'bg-green-50' : 'bg-red-50'}`}>
                  {isPositiveGain
                    ? <ArrowUpRight className="h-6 w-6 text-green-600" />
                    : <ArrowDownRight className="h-6 w-6 text-red-600" />
                  }
                </div>
                <Badge variant={isPositiveGain ? 'default' : 'destructive'} className={isPositiveGain ? 'bg-green-600' : ''}>
                  {isPositiveGain ? '+' : ''}{client.portfolio.totalGainLossPercent.toFixed(2)}%
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Total Gain/Loss</p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-3xl font-bold font-nums tracking-tight ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositiveGain ? '+' : ''}${client.portfolio.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="md:col-span-3 mb-8 bg-gray-50 border-dashed">
          <CardContent className="py-8 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-gray-200 rounded-full mb-3">
              <PieChart className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No Portfolio Data</h3>
            <p className="text-gray-500 max-w-sm mt-1">
              This client has not made any investments yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Holdings Section */}
      <div className="space-y-6 mb-8">
        {client.portfolio && client.portfolio.holdings.length > 0 ? (
          <Card className="rounded-xl border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="font-optima text-brand-blue text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" /> Current Holdings
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.portfolio.holdings.map((holding) => {
                    const isGain = holding.gainLoss >= 0;
                    return (
                      <TableRow key={holding.id} className="hover:bg-gray-50/50 group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                              {holding.instrument.symbol.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{holding.instrument.symbol}</div>
                              <div className="text-xs text-gray-500">{holding.instrument.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-nums text-gray-700">{holding.quantity}</TableCell>
                        <TableCell className="text-right font-nums text-gray-600">
                          {holding.instrument.currency} {holding.averageBuyPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold font-nums text-gray-900">
                          {holding.instrument.currency} {holding.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`font-bold font-nums ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                            {isGain ? '+' : ''}{holding.instrument.currency} {holding.gainLoss.toFixed(2)}
                          </div>
                          <div className={`text-xs font-nums ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                            {isGain ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
            <PieChart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active holdings available.</p>
          </div>
        )}
      </div>

      {/* Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Purchase Requests */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="font-optima text-brand-blue text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Recent Purchase Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {client.purchaseRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.purchaseRequests.slice(0, 5).map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">{req.instrument.symbol}</div>
                        <div className="text-xs text-gray-500">{format(new Date(req.createdAt), 'MMM dd')}</div>
                      </TableCell>
                      <TableCell className="text-right font-nums font-medium">
                        ${req.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={req.status === 'COMPLETED' ? 'default' : 'outline'} className="text-[10px]">
                          {req.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">No purchase history</div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Requests */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="font-optima text-brand-blue text-lg flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5" /> Recent Withdrawals
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs h-8">
                <Link href="/rm/withdrawal-requests">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {client.withdrawalRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.withdrawalRequests.slice(0, 5).map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-nums text-sm">
                        {format(new Date(req.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right font-nums font-medium">
                        ${req.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <WithdrawalStatusBadge status={req.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">No withdrawal history</div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
