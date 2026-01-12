import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'EMDEE VENTURES | Wealth Management',
  description: 'EMDEE VENTURES - For a Better Tomorrow. Investment and Holding Company.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
