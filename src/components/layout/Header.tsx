/**
 * Header Component
 * Top navigation bar with logo, navigation menu, and user profile
 */

'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/shared';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  const userInitials = session?.user?.firstName && session?.user?.lastName
    ? `${session.user.firstName[0]}${session.user.lastName[0]}`.toUpperCase()
    : session?.user?.email
    ? session.user.email.substring(0, 2).toUpperCase()
    : 'U';

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="mr-4 inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <svg
            className="h-8 w-8 text-primary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="hidden font-bold text-foreground sm:inline-block">
            WealthCRM
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 items-center space-x-6 text-sm font-medium lg:flex">
          {session?.user?.role === 'ADMIN' && (
            <>
              <Link
                href="/admin/users"
                className="text-foreground/60 transition-colors hover:text-foreground"
              >
                Users
              </Link>
              <Link
                href="/admin/assignments"
                className="text-foreground/60 transition-colors hover:text-foreground"
              >
                Assignments
              </Link>
              <Link
                href="/admin/audit-logs"
                className="text-foreground/60 transition-colors hover:text-foreground"
              >
                Audit Logs
              </Link>
            </>
          )}
          {session?.user?.role === 'RM' && (
            <>
              <span className="text-foreground/60 transition-colors hover:text-foreground">
                My Clients
              </span>
              <span className="text-foreground/60 transition-colors hover:text-foreground">
                Requests
              </span>
            </>
          )}
          {session?.user?.role === 'CLIENT' && (
            <>
              <Link
                href="/client/portfolio"
                className="text-foreground/60 transition-colors hover:text-foreground"
              >
                Portfolio
              </Link>
            </>
          )}
        </nav>

        {/* Right side - Notifications & User menu */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          {session ? (
            <>
              <NotificationBell />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user?.firstName && session.user?.lastName
                        ? `${session.user.firstName} ${session.user.lastName}`
                        : session.user?.email || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Role: {session.user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
