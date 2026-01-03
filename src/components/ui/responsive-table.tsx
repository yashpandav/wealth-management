/**
 * Responsive Table Wrapper
 * Provides horizontal scroll on mobile devices
 */

import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="inline-block min-w-full align-middle">
        {children}
      </div>
    </div>
  );
}
