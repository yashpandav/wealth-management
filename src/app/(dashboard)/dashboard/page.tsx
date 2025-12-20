/**
 * Dashboard Router Page
 * Redirects users to their role-specific dashboard
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  // Redirect based on user role
  const role = session.user.role;

  if (role === 'ADMIN') {
    redirect('/admin');
  } else if (role === 'RM') {
    redirect('/rm');
  } else if (role === 'DOCADMIN') {
    redirect('/docadmin');
  } else if (role === 'CLIENT') {
    redirect('/client/portfolio');
  } else {
    redirect('/login');
  }
}
