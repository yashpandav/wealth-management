/**
 * DashboardLayout Component
 * Complete layout combining Header, Sidebar, and Footer
 * Used for authenticated dashboard pages
 */

'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { SkipLink } from './SkipLink';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Skip Link for Accessibility */}
      <SkipLink />

      {/* Header */}
      <Header onMenuClick={toggleSidebar} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Main Content */}
        <main id="main-content" className="flex-1 lg:ml-64 w-full max-w-[100vw] overflow-x-hidden" tabIndex={-1}>
          <div className="min-h-[calc(100vh-4rem-200px)]">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
