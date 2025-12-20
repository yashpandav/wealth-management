/**
 * Dashboard Layout
 * Wrapper layout for all dashboard pages (admin, RM, client)
 */

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
