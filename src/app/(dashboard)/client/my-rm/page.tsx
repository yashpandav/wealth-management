/**
 * Client - My Relationship Manager Page
 * View assigned RM details, track record, and contact information
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  MessageCircle,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
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

  // Redirect if not authenticated or not CLIENT
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
      router.push('/error?error=AccessDenied');
    }
  }, [status, session, router]);

  // Fetch RM details
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

  // Format phone number for WhatsApp (remove non-digits)
  const formatPhoneForWhatsApp = (phone: string | null): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  if (loading) {
    return <LoadingSpinner text="Loading advisor details..." className="min-h-screen" />;
  }

  if (!rm) {
    return (
      <div className="container mx-auto py-4 md:py-6 lg:py-8 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-optima text-brand-blue">No Relationship Manager Assigned</CardTitle>
            <CardDescription className="font-georgia text-brand-grey">
              You don&apos;t have a Relationship Manager assigned yet. Please contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="font-optima text-2xl md:text-3xl font-bold text-brand-blue">My Relationship Manager</h1>
        <p className="font-georgia text-brand-grey mt-2">
          Your dedicated advisor for all investment needs
        </p>
      </div>

      {/* RM Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {rm.firstName} {rm.lastName}
                </CardTitle>
                {rm.specialization && (
                  <Badge variant="secondary" className="mt-2">
                    {rm.specialization}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>

              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <a
                  href={`mailto:${rm.email}`}
                  className="text-brand-blue hover:underline"
                >
                  {rm.email}
                </a>
              </div>

              {/* Phone */}
              {rm.phone && (
                <>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <a
                      href={`tel:${rm.phone}`}
                      className="text-brand-blue hover:underline font-nums"
                    >
                      {rm.phone}
                    </a>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-3">
                    <Button
                      variant="default"
                      onClick={() => window.location.href = `tel:${rm.phone}`}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://wa.me/${formatPhoneForWhatsApp(rm.phone)}`, '_blank')}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track Record Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Track Record
          </CardTitle>
          <CardDescription>
            Performance and client management statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Total Clients */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-brand-blue/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-brand-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Clients Managed</p>
                <p className="text-2xl font-bold text-gray-900 font-nums">{rm.trackRecord.totalClients}</p>
              </div>
            </div>

            {/* Total AUM */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Investment Amount</p>
                <p className="text-2xl font-bold text-gray-900 font-nums">
                  ${rm.trackRecord.totalAUM.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
            </div>

            {/* Approved Purchases */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Investment Requests Approved</p>
                <p className="text-2xl font-bold text-gray-900 font-nums">{rm.trackRecord.approvedPurchases}</p>
              </div>
            </div>

            {/* Payouts Processed */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-orange-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Payouts Processed</p>
                <p className="text-2xl font-bold text-gray-900 font-nums">{rm.trackRecord.approvedWithdrawals}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="mt-6 bg-brand-blue/10 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-brand-blue">
                <strong>Your Dedicated Advisor:</strong> {rm.firstName} is here to help you with all your investment decisions,
                portfolio management, and financial goals. Feel free to reach out anytime for assistance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
