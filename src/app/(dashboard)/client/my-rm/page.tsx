/**
 * Client - My Relationship Manager Page
 * View assigned RM details, track record, and contact information
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  MessageCircle,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface RMDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  trackRecord: {
    totalClients: number;
    totalAUM: number;
    approvedPurchases: number;
    approvedWithdrawals: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    rm: RMDetails;
  };
  error?: string;
}

export default function MyRMPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rm, setRM] = useState<RMDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  const fetchRMDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/client/my-rm');
      const data: ApiResponse = await response.json();
      if (data.success && data.data) {
        setRM(data.data.rm);
      } else {
        toast.error(data.error || 'Failed to fetch RM details');
      }
    } catch (error) {
      console.error('Error fetching RM details:', error);
      toast.error('Failed to fetch RM details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      fetchRMDetails();
    }
  }, [status, session]);

  const formatPhoneForWhatsApp = (phone: string | null): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  if (loading) {
    return <LoadingSpinner text="Loading advisor details..." className="min-h-screen" />;
  }

  if (!rm) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">My Advisor</h1>
          <p className="font-georgia mt-1 text-sm text-brand-grey">Your dedicated relationship manager</p>
        </div>
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-brand-grey/40 mb-4" />
            <p className="font-optima text-lg font-semibold text-brand-blue">No Advisor Assigned</p>
            <p className="font-georgia text-sm text-brand-grey mt-1">
              You don&apos;t have a Relationship Manager assigned yet. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = `${rm.firstName[0]}${rm.lastName[0]}`.toUpperCase();

  const stats = [
    {
      icon: Users,
      label: 'Clients Managed',
      value: rm.trackRecord.totalClients.toString(),
    },
    {
      icon: DirhamIcon,
      label: 'Total Investment Amount',
      value: `AED ${rm.trackRecord.totalAUM.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      icon: CheckCircle,
      label: 'Requests Approved',
      value: rm.trackRecord.approvedPurchases.toString(),
    },
    {
      icon: TrendingUp,
      label: 'Payouts Processed',
      value: rm.trackRecord.approvedWithdrawals.toString(),
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">My Advisor</h1>
        <p className="font-georgia mt-1 text-sm text-brand-grey">
          Your dedicated relationship manager
        </p>
      </div>

      {/* RM Profile Card */}
      <Card className="border-gray-200 mb-5 overflow-hidden">
        {/* Dark header strip */}
        <div className="bg-brand-blue px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 border-2 border-white/20 shrink-0">
            <span className="font-optima text-2xl font-bold text-white">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-optima text-2xl font-bold text-white leading-tight">
              {rm.firstName} {rm.lastName}
            </h2>
            {rm.specialization && (
              <Badge className="mt-2 bg-white/15 text-white border-white/20 font-optima text-xs hover:bg-white/20">
                {rm.specialization}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="px-6 py-6">
          <h3 className="font-optima text-xs font-semibold uppercase tracking-[0.18em] text-brand-grey mb-4">
            Contact Information
          </h3>

          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
              <Mail className="h-4 w-4 text-brand-grey shrink-0" />
              <a
                href={`mailto:${rm.email}`}
                className="font-georgia text-sm text-brand-blue hover:underline underline-offset-2 truncate"
              >
                {rm.email}
              </a>
            </div>

            {/* Phone */}
            {rm.phone && (
              <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
                <Phone className="h-4 w-4 text-brand-grey shrink-0" />
                <a
                  href={`tel:${rm.phone}`}
                  className="font-nums text-sm text-brand-blue hover:underline underline-offset-2"
                >
                  {rm.phone}
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {rm.phone && (
            <div className="flex gap-3 mt-5">
              <Button
                onClick={() => { window.location.href = `tel:${rm.phone}`; }}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-optima font-semibold flex-1 sm:flex-none"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call Now
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`https://wa.me/${formatPhoneForWhatsApp(rm.phone)}`, '_blank')}
                className="border-gray-300 hover:border-brand-blue hover:text-brand-blue font-optima flex-1 sm:flex-none"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Track Record */}
      <Card className="border-gray-200 mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="font-optima text-brand-blue flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-grey" />
            Track Record
          </CardTitle>
          <p className="font-georgia text-sm text-brand-grey">Performance and client management statistics</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="p-4 rounded-lg bg-brand-blue/5 border border-brand-blue/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-brand-grey" />
                  <span className="font-optima text-[0.65rem] uppercase tracking-wider text-brand-grey">{label}</span>
                </div>
                <p className="font-optima text-xl font-bold text-brand-blue font-nums">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info note */}
      <div className="flex items-start gap-3 px-5 py-4 bg-brand-blue/5 border border-brand-blue/10 rounded-lg">
        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-grey/50 shrink-0" />
        <p className="font-georgia text-sm text-brand-grey leading-relaxed">
          <span className="font-optima font-semibold text-brand-blue">{rm.firstName}</span> is your dedicated advisor for investment decisions, portfolio management, and financial planning. Feel free to reach out anytime.
        </p>
      </div>
    </div>
  );
}
