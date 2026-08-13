'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, Bell, ShieldCheck, PlusCircle, Home, Menu, X
} from 'lucide-react';
import { GlobalSearchBar } from '@/components/GlobalSearchBar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useApp, useAppStore } from '@/context/AppContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, openPidModal, openAuthModal, showToast } = useApp();
  const [pidQuickInput, setPidQuickInput] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  React.useEffect(() => {
    const checkHydration = () => {
      if (useAppStore.persist?.hasHydrated?.()) {
        setIsHydrated(true);
      } else {
        setTimeout(checkHydration, 50);
      }
    };
    checkHydration();
  }, []);

  // Automatic Authorization Guard & Silent Redirection
  React.useEffect(() => {
    if (!isHydrated || pathname === '/admin/login') return;

    if (!user || user.role !== 'admin') {
      if (user && user.role !== 'admin') {
        showToast('Access restricted to Admin accounts');
      }
      router.replace('/admin/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pathname, isHydrated]);

  // Bypass route guard for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Prevent rendering admin panel or restricted screen before hydration or for non-admin users
  if (!isHydrated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <div className="bg-[#050806] text-gray-100 min-h-screen flex flex-col lg:flex-row font-sans antialiased overflow-x-hidden">
        {/* Sidebar */}
        <div className="hidden lg:block shrink-0">
          <AdminSidebar />
        </div>

        {isMobileSidebarOpen && (
          <>
            <button
              type="button"
              aria-label="Close admin navigation"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
            />
            <div className="fixed left-0 top-0 z-50 h-dvh w-[86vw] max-w-sm lg:hidden shadow-2xl">
              <AdminSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
            </div>
          </>
        )}

        {/* Main Administrative Viewport Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 bg-[#060a08]/95 backdrop-blur-xl border-b border-emerald-950/80 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0a1610] border border-emerald-900/80 text-emerald-400"
                aria-label="Open admin navigation"
              >
                <Menu size={18} />
              </button>
              <GlobalSearchBar mode="admin" className="w-full md:w-md md:max-w-[42vw]" />
            </div>

            {/* Right Controls */}
            <div className="flex items-center justify-between lg:justify-end gap-3 sm:gap-4 w-full lg:w-auto flex-wrap">
              {/* Admin Profile Badge */}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0a1610] border border-emerald-900/80 text-xs min-w-0">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-xs">
                  {user ? user.name.charAt(0) : 'A'}
                </div>
                <span className="font-bold text-white truncate max-w-28 sm:max-w-none">
                  {user ? user.name.split(' ')[0] : 'Admin'}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              </div>
            </div>

          </header>

          {/* Main Content Area */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-7xl w-full mx-auto pb-24">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
