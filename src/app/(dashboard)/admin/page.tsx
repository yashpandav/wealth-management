import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard | Wealth Management CRM',
  description: 'Comprehensive analytics and system-wide insights for administrators',
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="container px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 space-y-6">
      <div className="mb-4">
        <h1 className="font-optima text-2xl font-bold text-brand-blue">Admin Dashboard</h1>
        <p className="font-georgia text-brand-grey mt-1 text-sm">System-wide analytics and insights</p>
      </div>

      <AdminDashboard />
    </div>
  );
}
