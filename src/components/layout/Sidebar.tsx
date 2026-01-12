/**
 * Sidebar Component
 * Side navigation with role-based menu items and responsive behavior
 * Dynamically shows/hides KYC Documents based on verification status
 */

'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { shouldShowKycUpload } from '@/lib/utils/client-utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  disabled?: boolean;
  /** If true, this item is only shown when KYC upload is needed */
  kycUploadOnly?: boolean;
}

import {
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart2,
  ShoppingCart,
  Wallet,
  ClipboardList,
  FileCheck,
  FileSignature,
  PieChart,
  BarChart,
  ShoppingBag,
  List,
  UserCheck,
  ShieldCheck,
  Inbox
} from 'lucide-react';

const navItems: NavItem[] = [
  // Admin routes
  {
    href: '/admin',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/users',
    label: 'User Management',
    icon: <Users className="h-5 w-5" />,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/assignments',
    label: 'Client Assignments',
    icon: <UserPlus className="h-5 w-5" />,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/rm-performance',
    label: 'RM Performance',
    icon: <BarChart2 className="h-5 w-5" />,
    roles: ['ADMIN'],
  },

  {
    href: '/admin/purchase-requests',
    label: 'Purchase Requests',
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/withdrawal-requests',
    label: 'Withdrawal Requests',
    icon: <Wallet className="h-5 w-5" />,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ['ADMIN'],
  },
  // DocAdmin routes
  {
    href: '/docadmin',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['DOCADMIN'],
  },
  {
    href: '/docadmin/documents',
    label: 'Document Verification',
    icon: <FileCheck className="h-5 w-5" />,
    roles: ['DOCADMIN'],
  },
  {
    href: '/docadmin/assign-rm',
    label: 'RM Assignment Pending',
    icon: <UserPlus className="h-5 w-5" />,
    roles: ['DOCADMIN'],
  },
  {
    href: '/docadmin/leads',
    label: 'New Enquiries',
    icon: <Inbox className="h-5 w-5" />,
    roles: ['DOCADMIN'],
  },
  {
    href: '/docadmin/product-requests',
    label: 'Plan Requests',
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ['DOCADMIN'],
  },
  {
    href: '/docadmin/contract-pending',
    label: 'Contract Pending',
    icon: <FileSignature className="h-5 w-5" />,
    roles: ['DOCADMIN'],
  },
  {
    href: '/docadmin/contract-created',
    label: 'Contract Created',
    icon: <FileCheck className="h-5 w-5" />,
    roles: ['DOCADMIN'],
  },
  // RM routes
  {
    href: '/rm',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['RM'],
  },
  {
    href: '/rm/leads',
    label: 'Leads',
    icon: <Inbox className="h-5 w-5" />,
    roles: ['RM'],
  },
  {
    href: '/rm/registered-clients',
    label: 'Registered (No KYC)',
    icon: <Users className="h-5 w-5" />,
    roles: ['RM'],
  },
  {
    href: '/rm/kyc-pending',
    label: 'KYC Pending',
    icon: <FileCheck className="h-5 w-5" />,
    roles: ['RM'],
  },
  {
    href: '/rm/active-clients',
    label: 'Active Clients',
    icon: <UserCheck className="h-5 w-5" />,
    roles: ['RM'],
  },
  {
    href: '/rm/product-requests',
    label: 'Plan Requests',
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ['RM'],
  },
  {
    href: '/rm/withdrawal-requests',
    label: 'Withdrawal Requests',
    icon: <Wallet className="h-5 w-5" />,
    roles: ['RM'],
  },
  // Client routes
  {
    href: '/client/portfolio',
    label: 'My Portfolio',
    icon: <PieChart className="h-5 w-5" />,
    roles: ['CLIENT'],
  },
  {
    href: '/client/analytics',
    label: 'Analytics',
    icon: <BarChart className="h-5 w-5" />,
    roles: ['CLIENT'],
  },
  {
    href: '/client/products',
    label: 'Investment Plans',
    icon: <ShoppingBag className="h-5 w-5" />,
    roles: ['CLIENT'],
  },
  {
    href: '/client/requests',
    label: 'My Requests',
    icon: <List className="h-5 w-5" />,
    roles: ['CLIENT'],
  },
  {
    href: '/client/withdrawal-requests',
    label: 'Withdrawals',
    icon: <Wallet className="h-5 w-5" />,
    roles: ['CLIENT'],
  },
  {
    href: '/client/my-rm',
    label: 'My Advisor',
    icon: <UserCheck className="h-5 w-5" />,
    roles: ['CLIENT'],
  },
  {
    href: '/client/documents',
    label: 'KYC Documents',
    icon: <ShieldCheck className="h-5 w-5" />,
    roles: ['CLIENT'],
  },
];

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userRole = session?.user?.role || '';
  const verificationStatus = session?.user?.verificationStatus || null;

  // Filter nav items based on role and KYC status
  const filteredNavItems = navItems.filter((item) => {
    // First check role
    if (!item.roles.includes(userRole)) {
      return false;
    }

    // For KYC-only items, hide if KYC is already verified
    if (item.kycUploadOnly && !shouldShowKycUpload(verificationStatus)) {
      return false;
    }

    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-white shadow-sm transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex h-full flex-col overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              // Find all matching items (exact or prefix match)
              const matchingItems = filteredNavItems.filter(
                (navItem) =>
                  pathname === navItem.href || pathname.startsWith(navItem.href + '/')
              );

              // Find the most specific match (longest href)
              const bestMatch = matchingItems.reduce(
                (best, current) =>
                  !best || current.href.length > best.href.length ? current : best,
                null as NavItem | null
              );

              // Only highlight if this item is the most specific match
              const isActive = bestMatch?.href === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium font-optima transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-1',
                    isActive
                      ? 'bg-brand-blue text-white'
                      : 'text-brand-grey hover:bg-brand-blue/10 hover:text-brand-blue active:bg-brand-blue/20'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
