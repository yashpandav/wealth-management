'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  TrendingUp,
  Users,
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
      console.error(error);
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
    return <LoadingSpinner className="min-h-[60vh]" />;
  }

  if (!rm) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-brand-grey">No RM assigned</p>
      </div>
    );
  }

  const initials = `${rm.firstName[0]}${rm.lastName[0]}`.toUpperCase();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl">

      {/* HEADER (same as RM page) */}
      <Card className="border-gray-200 mb-6 overflow-hidden">
        <div className="bg-brand-blue px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            {/* Identity */}
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  {rm.firstName} {rm.lastName}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mt-1 text-white/70">
                  <span className="flex items-center gap-1 text-sm">
                    <Mail className="h-3.5 w-3.5" />
                    {rm.email}
                  </span>

                  {rm.phone && (
                    <span className="flex items-center gap-1 text-sm">
                      <Phone className="h-3.5 w-3.5" />
                      {rm.phone}
                    </span>
                  )}
                </div>

                {rm.specialization && (
                  <Badge className="mt-2 bg-white/15 text-white border-white/20 text-xs">
                    {rm.specialization}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            {rm.phone && (
              <div className="flex gap-2">
                <button
                  onClick={() => (window.location.href = `tel:${rm.phone}`)}
                  className="px-4 py-2 bg-white/15 text-white rounded-md"
                >
                  Call
                </button>

                <button
                  onClick={() =>
                    window.open(
                      `https://wa.me/${formatPhoneForWhatsApp(rm.phone)}`,
                      '_blank'
                    )
                  }
                  className="px-4 py-2 bg-green-500 text-white rounded-md"
                >
                  WhatsApp
                </button>

                <button
                  onClick={() => (window.location.href = `mailto:${rm.email}`)}
                  className="px-4 py-2 bg-white/15 text-white rounded-md"
                >
                  Email
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            icon: Users,
            label: 'Clients Managed',
            value: rm.trackRecord.totalClients,
          },
          {
            icon: DirhamIcon,
            label: 'Total AUM',
            value: rm.trackRecord.totalAUM,
          },
          {
            icon: TrendingUp,
            label: 'Payouts',
            value: rm.trackRecord.approvedWithdrawals,
          },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase">
                  {label}
                </span>
              </div>

              <p className="text-2xl font-bold text-brand-blue">
                {typeof value === 'number'
                  ? value.toLocaleString()
                  : value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* INFO CARD */}
      <Card className="border-gray-200">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-brand-blue">
              {rm.firstName}
            </span>{' '}
            manages{' '}
            <span className="font-semibold text-brand-blue">
              {rm.trackRecord.totalClients}
            </span>{' '}
            clients with total AUM of{' '}
            <span className="font-semibold text-brand-blue">
              AED {rm.trackRecord.totalAUM.toLocaleString()}
            </span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}