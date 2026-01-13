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
    <header className="sticky top-0 left-0 right-0 z-50 w-full border-b border-border bg-white shadow-sm">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="mr-4 inline-flex items-center justify-center rounded-md p-2 text-brand-grey hover:bg-brand-blue hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 lg:hidden"
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

        {/* EMDEE VENTURES Logo */}
        <Link href="/" className="mr-6 flex items-center">
          <div className="flex h-9 items-center">
            <img
              src="/images/logo/primary-logo-1.png"
              alt="EMDEE VENTURES"
              className="
              w-[90px]
              h-auto
              object-contain
            "
            />
          </div>
        </Link>



        {/* Desktop Navigation */}
        <nav className="hidden flex-1 items-center space-x-6 text-sm font-medium font-optima lg:flex">
          {session?.user?.role === 'ADMIN' && (
            <>
              <Link
                href="/admin/users"
                className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue"
              >
                Users
              </Link>
              <Link
                href="/admin/assignments"
                className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue"
              >
                Assignments
              </Link>
              <Link
                href="/admin/audit-logs"
                className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue"
              >
                Audit Logs
              </Link>
            </>
          )}
          {session?.user?.role === 'RM' && (
            <>
              <span className="text-brand-grey transition-colors duration-200 hover:text-brand-blue cursor-pointer">
                My Clients
              </span>
              <span className="text-brand-grey transition-colors duration-200 hover:text-brand-blue cursor-pointer">
                Requests
              </span>
            </>
          )}
          {session?.user?.role === 'CLIENT' && (
            <>
              <Link
                href="/client/portfolio"
                className="text-brand-grey transition-colors duration-200 hover:text-brand-blue focus:outline-none focus:text-brand-blue"
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
                    className="relative h-9 w-9 rounded-full hover:bg-brand-blue/10 transition-colors duration-200"
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
                  <DropdownMenuItem className="font-optima transition-colors duration-200 hover:text-primary-foreground focus:text-primary-foreground hover:bg-primary focus:bg-primary">
                    <Link href="/profile" >
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer font-optima text-destructive transition-colors duration-200 hover:bg-destructive hover:text-white focus:bg-destructive focus:text-white"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium font-optima text-brand-blue transition-colors duration-200 hover:text-brand-blue/80 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium font-optima text-white transition-colors duration-200 hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
