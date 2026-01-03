/**
 * Client Analytics Page
 * Comprehensive analytics dashboard with interactive charts
 */

'use client';

import { ClientAnalyticsDashboard } from '@/components/client/ClientAnalyticsDashboard';

export default function ClientAnalyticsPage() {
  return (
    <div className="container px-8 py-8">
      <h1 className="font-optima text-3xl font-bold text-brand-blue">Portfolio Analytics</h1>
      <p className="font-georgia text-brand-grey mt-2 mb-6">
        Comprehensive insights into your investment performance
      </p>

      <ClientAnalyticsDashboard />
    </div>
  );
}
