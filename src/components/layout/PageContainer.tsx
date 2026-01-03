/**
 * PageContainer Component
 * Consistent page layout wrapper with proper spacing and responsive behavior
 */

import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export function PageContainer({
  children,
  className,
  maxWidth = '7xl',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
