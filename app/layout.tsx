import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Footer } from '@/components/Footer';
import { Toast } from '@/components/Toast';
import { ClientModals } from '@/components/ClientModals';
import { HideOnRoute } from '@/components/HideOnRoute';
import { AdminRouteGuard } from '@/components/AdminRouteGuard';
import { GlobalProgressBar } from '@/components/GlobalProgressBar';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  style: ['normal', 'italic'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Flats, Houses, PGs & Rooms for Rent, Buy & Sale | 0% Brokerage - Propzy',
  description: 'Search verified flats, PGs, houses & rooms for rent, buy & sale with Propzy. Explore real estate properties in Chandigarh, Mohali, Kharar, Zirakpur, Panchkula & more at 0% brokerage.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="bg-[#050806] text-gray-100 antialiased min-h-screen flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        <AppProvider>
          <GlobalProgressBar />
          <AdminRouteGuard />
          <HideOnRoute prefix="/admin">
            <Navbar />
          </HideOnRoute>
          <main className="flex-1">
            {children}
          </main>
          <HideOnRoute prefix="/admin">
            <Footer />
            <MobileBottomNav />
          </HideOnRoute>
          <ClientModals />
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
