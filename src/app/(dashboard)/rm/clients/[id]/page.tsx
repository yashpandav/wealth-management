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
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RequestStatus, WithdrawalStatus } from '@prisma/client';

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

    return <Badge variant="outline">{statusLabels[status]}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const isPositiveGain = client.portfolio ? client.portfolio.totalGainLoss >= 0 : true;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Details</h1>
        <p className="text-gray-600">
          Comprehensive view of client profile and portfolio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Profile */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle>
                    {client.user.firstName} {client.user.lastName}
                  </CardTitle>
                  <Badge variant={client.kycVerified ? 'default' : 'secondary'} className="mt-2">
                    {client.kycVerified ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        KYC Verified
                      </>
                    ) : (
                      <>
                        <Clock className="mr-1 h-3 w-3" />
                        KYC Pending
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <a href={`mailto:${client.user.email}`} className="text-blue-600 hover:underline text-sm">
                  {client.user.email}
                </a>
              </div>

              {/* Phone */}
              {client.user.phone && (
                <>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <a href={`tel:${client.user.phone}`} className="text-blue-600 hover:underline text-sm">
                      {client.user.phone}
                    </a>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-3">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => window.location.href = `tel:${client.user.phone}`}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call Client
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(`https://wa.me/${formatPhoneForWhatsApp(client.user.phone)}`, '_blank')}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </>
              )}

              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p>Assigned: {format(new Date(client.assignedAt), 'MMM dd, yyyy')}</p>
                    <p>Joined: {format(new Date(client.user.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Summary Card */}
          {client.portfolio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Portfolio Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${client.portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Invested</p>
                  <p className="text-lg font-semibold">
                    ${client.portfolio.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gain/Loss</p>
                  <div className={`flex items-center gap-2 ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositiveGain ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    <span className="text-lg font-semibold">
                      {isPositiveGain ? '+' : ''}${client.portfolio.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm">
                      ({isPositiveGain ? '+' : ''}{client.portfolio.totalGainLossPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Holdings and Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Holdings */}
          {client.portfolio && client.portfolio.holdings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Holdings</CardTitle>
                <CardDescription>Current investment positions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instrument</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Avg Buy Price</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead className="text-right">Gain/Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.portfolio.holdings.map((holding) => {
                      const isGain = holding.gainLoss >= 0;
                      return (
                        <TableRow key={holding.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{holding.instrument.symbol}</div>
                              <div className="text-sm text-gray-500">{holding.instrument.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{holding.quantity}</TableCell>
                          <TableCell className="text-right">
                            {holding.instrument.currency} {holding.averageBuyPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {holding.instrument.currency} {holding.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className={`text-right ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="font-medium">
                              {isGain ? '+' : ''}{holding.instrument.currency} {holding.gainLoss.toFixed(2)}
                            </div>
                            <div className="text-xs">
                              ({isGain ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%)
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recent Withdrawal Requests */}
          {client.withdrawalRequests.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Withdrawal Requests</CardTitle>
                    <CardDescription>Last 10 withdrawal requests</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/rm/withdrawal-requests">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking #</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.withdrawalRequests.slice(0, 5).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">{request.trackingNumber}</TableCell>
                        <TableCell className="text-right">
                          ${request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <WithdrawalStatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/rm/withdrawal-requests/${request.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
