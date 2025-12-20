/**
 * Client Analytics Page
 * Comprehensive analytics dashboard with interactive charts
 */

'use client';

import { ClientAnalyticsDashboard } from '@/components/client/ClientAnalyticsDashboard';

export default function ClientAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive insights into your investment performance
        </p>
      </div>

      <ClientAnalyticsDashboard />
    </div>
  );
}
