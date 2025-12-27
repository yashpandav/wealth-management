'use client';

/**
 * Client Status Banner - Client Component Version
 * Fetches client data on the client side and displays the appropriate banner
 */

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ClientStatusBanner } from './ClientStatusBanner';
import { VerificationStatus } from '@prisma/client';

interface ClientStatusBannerClientProps {
  className?: string;
}

/**
 * Render a client status banner for authenticated users with role "CLIENT" once session and RM assignment are resolved.
 *
 * @returns A JSX element containing the ClientStatusBanner populated with the client's RM assignment and verification status, or `null` while loading, when the user is not an authenticated CLIENT, or when the RM state is undetermined.
 */
export function ClientStatusBannerClient({ className = '' }: ClientStatusBannerClientProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [hasRM, setHasRM] = useState<boolean | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'CLIENT') {
      // Verification status is in the session
      setVerificationStatus(session.user.verificationStatus);

      // Fetch assignedRMId from API
      fetchClientStatus();
    } else {
      setLoading(false);
    }
  }, [sessionStatus, session]);

  const fetchClientStatus = async () => {
    try {
      const response = await fetch('/api/client/my-rm');
      const data = await response.json();

      if (data.success) {
        setHasRM(!!data.data);
      } else {
        setHasRM(false);
      }
    } catch (error) {
      console.error('Error fetching client RM status:', error);
      setHasRM(false);
    } finally {
      setLoading(false);
    }
  };

  // Don't render while loading or if not a client
  if (loading || sessionStatus !== 'authenticated' || session?.user?.role !== 'CLIENT' || hasRM === null) {
    return null;
  }

  return (
    <ClientStatusBanner
      hasRM={hasRM}
      verificationStatus={verificationStatus}
      className={className}
    />
  );
}