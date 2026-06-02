import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { PageVisibilityProvider } from '@/components/layout/PageVisibilityProvider';
import { UserSessionProvider } from '@/features/auth/hooks/useUserSession';
import { BannedUserGate } from '@/features/auth/components/BannedUserGate';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ACertain — Online Marketplace (COD)',
  description:
    'Shop thousands of products from verified sellers. Cash on Delivery, flat ₱100 shipping, order tracking, and seller dashboards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <PageVisibilityProvider>
          <UserSessionProvider>
            <BannedUserGate>
              <Navbar />
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {children}
              </main>
              <Footer />
            </BannedUserGate>
          </UserSessionProvider>
        </PageVisibilityProvider>
      </body>
    </html>
  );
}
