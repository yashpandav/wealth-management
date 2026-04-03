/**
 * Sidebar Component
 * Side navigation with role-based menu items, section groups, and responsive behavior
 */

'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { shouldShowKycUpload } from '@/lib/utils/client-utils';

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
  Inbox,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  group?: string;
  disabled?: boolean;
  kycUploadOnly?: boolean;
  badgeKey?: 'documentVerification' | 'rmAssignment';
}

const navItems: NavItem[] = [
  // ── Admin ──────────────────────────────────────────────
  { href: '/admin',                    label: 'Dashboard',          icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, roles: ['ADMIN'], group: '' },
  { href: '/admin/users',              label: 'User Management',    icon: <Users className="h-4 w-4 shrink-0" />,          roles: ['ADMIN'], group: 'Management' },
  { href: '/admin/assignments',        label: 'Client Assignments', icon: <UserPlus className="h-4 w-4 shrink-0" />,       roles: ['ADMIN'], group: 'Management' },
  { href: '/admin/rm-performance',     label: 'RM Performance',     icon: <BarChart2 className="h-4 w-4 shrink-0" />,      roles: ['ADMIN'], group: 'Management' },
  { href: '/admin/investment-plans',   label: 'Investment Plans',   icon: <TrendingUp className="h-4 w-4 shrink-0" />,     roles: ['ADMIN'], group: 'Finance' },
  { href: '/admin/purchase-requests',  label: 'Investment Requests',icon: <ShoppingCart className="h-4 w-4 shrink-0" />,   roles: ['ADMIN'], group: 'Finance' },
  { href: '/admin/audit-logs',         label: 'Audit Logs',         icon: <ClipboardList className="h-4 w-4 shrink-0" />,  roles: ['ADMIN'], group: 'System' },

  // ── DocAdmin ────────────────────────────────────────────
  { href: '/docadmin',                   label: 'Dashboard',              icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, roles: ['DOCADMIN'], group: '' },
  { href: '/docadmin/documents',         label: 'Document Verification',  icon: <FileCheck className="h-4 w-4 shrink-0" />,      roles: ['DOCADMIN'], group: 'Documents', badgeKey: 'documentVerification' },
  { href: '/docadmin/assign-rm',         label: 'RM Assignment Pending',  icon: <UserPlus className="h-4 w-4 shrink-0" />,       roles: ['DOCADMIN'], group: 'Documents', badgeKey: 'rmAssignment' },
  { href: '/docadmin/leads',             label: 'New Enquiries',          icon: <Inbox className="h-4 w-4 shrink-0" />,          roles: ['DOCADMIN'], group: 'Documents' },
  { href: '/docadmin/product-requests',  label: 'Plan Requests',          icon: <ShoppingCart className="h-4 w-4 shrink-0" />,   roles: ['DOCADMIN'], group: 'Contracts' },
  { href: '/docadmin/contract-pending',  label: 'Contract Pending',       icon: <FileSignature className="h-4 w-4 shrink-0" />,  roles: ['DOCADMIN'], group: 'Contracts' },
  { href: '/docadmin/contract-created',  label: 'Contract Created',       icon: <FileCheck className="h-4 w-4 shrink-0" />,      roles: ['DOCADMIN'], group: 'Contracts' },
  { href: '/docadmin/payouts',           label: 'Payouts',                icon: <Wallet className="h-4 w-4 shrink-0" />,         roles: ['DOCADMIN'], group: 'Finance' },

  // ── RM ──────────────────────────────────────────────────
  { href: '/rm',                      label: 'Dashboard',           icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, roles: ['RM'], group: '' },
  { href: '/rm/leads',                label: 'Leads',               icon: <Inbox className="h-4 w-4 shrink-0" />,          roles: ['RM'], group: 'Pipeline' },
  { href: '/rm/registered-clients',   label: 'Registered (No KYC)',icon: <Users className="h-4 w-4 shrink-0" />,           roles: ['RM'], group: 'Pipeline' },
  { href: '/rm/kyc-pending',          label: 'KYC Pending',         icon: <FileCheck className="h-4 w-4 shrink-0" />,      roles: ['RM'], group: 'Pipeline' },
  { href: '/rm/active-clients',       label: 'Active Clients',      icon: <UserCheck className="h-4 w-4 shrink-0" />,      roles: ['RM'], group: 'Clients' },
  { href: '/rm/product-requests',     label: 'Plan Requests',       icon: <ShoppingCart className="h-4 w-4 shrink-0" />,   roles: ['RM'], group: 'Clients' },

  // ── Client ──────────────────────────────────────────────
  { href: '/client/portfolio',  label: 'My Portfolio',     icon: <PieChart className="h-4 w-4 shrink-0" />,    roles: ['CLIENT'], group: 'Portfolio' },
  { href: '/client/analytics',  label: 'Analytics',        icon: <BarChart className="h-4 w-4 shrink-0" />,    roles: ['CLIENT'], group: 'Portfolio' },
  { href: '/client/products',   label: 'Investment Plans', icon: <ShoppingBag className="h-4 w-4 shrink-0" />, roles: ['CLIENT'], group: 'Investments' },
  { href: '/client/requests',   label: 'My Requests',      icon: <List className="h-4 w-4 shrink-0" />,        roles: ['CLIENT'], group: 'Investments' },
  { href: '/client/payouts',    label: 'My Payouts',       icon: <Wallet className="h-4 w-4 shrink-0" />,      roles: ['CLIENT'], group: 'Investments' },
  { href: '/client/my-rm',      label: 'My Advisor',       icon: <UserCheck className="h-4 w-4 shrink-0" />,   roles: ['CLIENT'], group: 'Account' },
  { href: '/client/documents',  label: 'KYC Documents',    icon: <ShieldCheck className="h-4 w-4 shrink-0" />, roles: ['CLIENT'], group: 'Account' },
];

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userRole = session?.user?.role || '';
  const verificationStatus = session?.user?.verificationStatus || null;

  const userInitials =
    session?.user?.firstName && session?.user?.lastName
      ? `${session.user.firstName[0]}${session.user.lastName[0]}`.toUpperCase()
      : session?.user?.email
        ? session.user.email.substring(0, 2).toUpperCase()
        : 'U';

  const fullName =
    session?.user?.firstName && session?.user?.lastName
      ? `${session.user.firstName} ${session.user.lastName}`
      : session?.user?.email || 'User';

  const [pendingCounts, setPendingCounts] = useState({
    documentVerification: 0,
    rmAssignment: 0,
  });

  useEffect(() => {
    if (userRole === 'DOCADMIN') {
      fetch('/api/docadmin/pending-counts')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setPendingCounts(data.data);
        })
        .catch((err) => console.error('Error fetching pending counts:', err));
    }
  }, [userRole]);

  // Filter by role and KYC conditions
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles.includes(userRole)) return false;
    if (item.kycUploadOnly && !shouldShowKycUpload(verificationStatus)) return false;
    return true;
  });

  // Pre-compute best active match (most specific path)
  const bestMatch = filteredNavItems.reduce<NavItem | null>((best, item) => {
    const matches = pathname === item.href || pathname.startsWith(item.href + '/');
    if (!matches) return best;
    if (!best || item.href.length > best.href.length) return item;
    return best;
  }, null);

  // Group items preserving order
  const grouped = filteredNavItems.reduce<{ group: string; items: NavItem[] }[]>((acc, item) => {
    const g = item.group ?? '';
    const existing = acc.find((x) => x.group === g);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ group: g, items: [item] });
    }
    return acc;
  }, []);

  const getBadgeCount = (badgeKey?: 'documentVerification' | 'rmAssignment'): number | null => {
    if (!badgeKey || userRole !== 'DOCADMIN') return null;
    const count = pendingCounts[badgeKey];
    return count > 0 ? count : null;
  };

  const formatBadgeCount = (count: number) => (count > 99 ? '99+' : count.toString());

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

          {/* Nav groups */}
          <div className="flex-1">
            {grouped.map(({ group, items }) => (
              <div key={group || '_root'} className="mb-1">

                {/* Group label */}
                {group && (
                  <p className="px-3 pt-4 pb-1.5 text-[0.6rem] tracking-[0.22em] uppercase font-optima text-brand-grey/50 select-none">
                    {group}
                  </p>
                )}

                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive = bestMatch?.href === item.href;
                    const badgeCount = getBadgeCount(item.badgeKey);

                    return (
                      <Link
                        key={item.href}
                        href={item.href as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                        onClick={onClose}
                        className={cn(
                          'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium font-optima transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-1',
                          isActive
                            ? 'bg-brand-blue text-white'
                            : 'text-brand-grey hover:bg-brand-blue/10 hover:text-brand-blue active:bg-brand-blue/20'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                        {badgeCount !== null && (
                          <span
                            className={cn(
                              'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold font-nums shrink-0',
                              isActive ? 'bg-white text-brand-blue' : 'bg-red-500 text-white'
                            )}
                            aria-label={`${badgeCount} pending items`}
                          >
                            {formatBadgeCount(badgeCount)}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* User card */}
          {session && (
            <div className="shrink-0 mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-brand-blue/5 transition-colors cursor-default">
                <div className="h-8 w-8 rounded-full bg-brand-blue flex items-center justify-center shrink-0">
                  <span className="text-[0.6rem] font-bold text-white font-nums">{userInitials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold font-optima text-brand-blue truncate">{fullName}</p>
                  <p className="text-[0.65rem] font-optima text-brand-grey capitalize">{userRole.toLowerCase()}</p>
                </div>
              </div>
            </div>
          )}

        </nav>
      </aside>
    </>
  );
}
