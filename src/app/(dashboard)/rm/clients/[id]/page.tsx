/**
 * RM - Client Detail Page
 * View detailed information about a specific assigned client
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Mail,
  Phone,
  MessageCircle,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Wallet,
  PieChart,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { toast } from 'react-hot-toast';
import { RequestStatus } from '@prisma/client';
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
  investmentSummary: {
    totalValue: number;
    totalInvested: number;
    totalInterestEarned: number;
    activeInvestmentsCount: number;
  };
  productPurchaseRequests: Array<{
    id: string;
    trackingNumber: string;
    status: RequestStatus;
    amount: number;
    createdAt: string;
    investment: {
      name: string;
      description: string | null;
    };
    investmentOption: {
      duration: string;
      withdrawalFrequency: string;
      roi: number;
      annualReturn: number;
    } | null;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    status: string;
    scheduledDate: string;
    processedAt: string | null;
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

const statusBadgeClass = (status: RequestStatus) => {
  switch (status) {
    case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200';
    case 'PROCESSING': return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
    default: return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

export default function RMClientDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'RM') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

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

  const formatPhoneForWhatsApp = (phone: string | null): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  if (loading) {
    return <LoadingSpinner className="min-h-[60vh]" />;
  }

  if (!client) return null;

  const { investmentSummary: summary } = client;
  const initials = `${client.user.firstName[0]}${client.user.lastName[0]}`.toUpperCase();

  const statCards = [
    {
      icon: Wallet,
      label: 'Portfolio Value',
      value: `AED ${summary.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      highlight: true,
    },
    {
      icon: DirhamIcon,
      label: 'Total Invested',
      value: `AED ${summary.totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      icon: TrendingUp,
      label: 'Interest Earned',
      value: `AED ${summary.totalInterestEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      positive: summary.totalInterestEarned >= 0,
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 font-georgia text-sm text-brand-grey hover:text-brand-blue transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </button>

      {/* Profile Header */}
      <Card className="border-gray-200 mb-6 overflow-hidden">
        <div className="bg-brand-blue px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            {/* Identity */}
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0">
                <span className="font-optima text-2xl font-bold text-white">{initials}</span>
              </div>
              <div>
                <h1 className="font-optima text-2xl font-bold text-white leading-tight">
                  {client.user.firstName} {client.user.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-white/70">
                  <span className="font-georgia text-sm flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {client.user.email}
                  </span>
                  {client.user.phone && (
                    <span className="font-nums text-sm flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {client.user.phone}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="font-georgia text-xs text-white/50 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined {format(new Date(client.user.createdAt), 'MMM d, yyyy')}
                  </span>
                  <Badge
                    className={`text-[10px] font-optima border ${
                      client.kycVerified
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                    }`}
                  >
                    {client.kycVerified ? (
                      <><CheckCircle className="h-2.5 w-2.5 mr-1" />KYC Verified</>
                    ) : (
                      <><XCircle className="h-2.5 w-2.5 mr-1" />KYC Pending</>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            {client.user.phone && (
              <div className="flex gap-2 shrink-0">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/15 hover:bg-white/25 text-white border border-white/25 font-optima text-sm font-semibold transition-colors"
                  onClick={() => { window.location.href = `tel:${client.user.phone}`; }}
                >
                  <Phone className="h-4 w-4" />
                  Call
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#25D366] hover:bg-[#1DAA55] text-white font-optima text-sm font-semibold transition-colors"
                  onClick={() => window.open(`https://wa.me/${formatPhoneForWhatsApp(client.user.phone)}`, '_blank')}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/15 hover:bg-white/25 text-white border border-white/25 font-optima text-sm font-semibold transition-colors"
                  onClick={() => { window.location.href = `mailto:${client.user.email}`; }}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {statCards.map(({ icon: Icon, label, value, highlight, positive }) => (
          <Card
            key={label}
            className={`border-gray-200 ${highlight ? 'bg-brand-blue text-white' : 'bg-white'}`}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${highlight ? 'text-white/60' : 'text-brand-grey'}`} />
                <span className={`font-optima text-xs uppercase tracking-wide ${highlight ? 'text-white/60' : 'text-brand-grey'}`}>
                  {label}
                </span>
              </div>
              <p className={`font-optima text-2xl font-bold font-nums ${
                highlight
                  ? 'text-white'
                  : positive === false
                    ? 'text-red-600'
                    : 'text-brand-blue'
              }`}>
                {positive === false ? '−' : ''}{value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active investments note */}
      {summary.activeInvestmentsCount === 0 ? (
        <Card className="border-gray-200 mb-6">
          <CardContent className="py-10 text-center">
            <PieChart className="h-10 w-10 text-brand-grey/30 mx-auto mb-3" />
            <p className="font-optima text-base font-semibold text-brand-blue">No Active Investments</p>
            <p className="font-georgia text-sm text-brand-grey mt-1">This client has not made any investments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="font-optima text-brand-blue flex items-center gap-2">
              <PieChart className="h-4 w-4 text-brand-grey" />
              Active Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-georgia text-sm text-brand-grey">
              {client.user.firstName} has{' '}
              <span className="font-optima font-semibold text-brand-blue">
                {summary.activeInvestmentsCount} active investment{summary.activeInvestmentsCount !== 1 ? 's' : ''}
              </span>{' '}
              with a total portfolio value of{' '}
              <span className="font-optima font-semibold text-brand-blue">
                AED {summary.totalValue.toLocaleString()}.
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Investment Requests */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="font-optima text-brand-blue flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-grey" />
            Recent Investment Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {client.productPurchaseRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-brand-blue/5 hover:bg-brand-blue/5">
                  <TableHead className="font-optima text-[0.65rem] uppercase tracking-wider text-brand-grey">Plan</TableHead>
                  <TableHead className="font-optima text-[0.65rem] uppercase tracking-wider text-brand-grey text-right">Amount</TableHead>
                  <TableHead className="font-optima text-[0.65rem] uppercase tracking-wider text-brand-grey">Date</TableHead>
                  <TableHead className="font-optima text-[0.65rem] uppercase tracking-wider text-brand-grey">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.productPurchaseRequests.slice(0, 6).map((req) => (
                  <TableRow key={req.id} className="hover:bg-brand-blue/5">
                    <TableCell>
                      <p className="font-optima font-medium text-brand-blue">{req.investment.name}</p>
                      {req.investmentOption && (
                        <p className="font-georgia text-xs text-brand-grey mt-0.5">
                          {req.investmentOption.duration} · {req.investmentOption.withdrawalFrequency}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-optima font-semibold text-brand-blue text-right font-nums">
                      AED {req.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-georgia text-sm text-brand-grey font-nums">
                      {format(new Date(req.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-optima text-[10px] ${statusBadgeClass(req.status)}`}>
                        {req.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-10 text-center">
              <p className="font-optima text-base font-semibold text-brand-blue">No Requests Yet</p>
              <p className="font-georgia text-sm text-brand-grey mt-1">This client has not submitted any investment requests.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
