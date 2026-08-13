'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, ShieldCheck, Menu, ChevronDown, LayoutDashboard, ClipboardCheck, Users, LogOut
} from 'lucide-react';
import { GlobalSearchBar } from '@/components/GlobalSearchBar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useApp, useAppStore } from '@/context/AppContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logoutUser, showToast } = useApp();
  const [pidQuickInput, setPidQuickInput] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

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
              {/* Admin Portal Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAdminMenuOpen((open) => !open)}
                  aria-expanded={isAdminMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0a1610] border border-emerald-900/80 hover:border-emerald-500/70 text-xs min-w-0 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-bold text-white truncate max-w-28 sm:max-w-none">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="hidden sm:inline text-[10px] font-extrabold text-emerald-400 bg-emerald-950 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    ADMIN
                  </span>
                  <ChevronDown size={14} className={`text-emerald-400 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAdminMenuOpen && (
                  <div role="menu" className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0a110d] border border-emerald-900/80 shadow-2xl p-2 z-50">
                    <div className="px-3 py-2.5 border-b border-emerald-950 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={13} /> Admin Portal
                    </div>
                    <div className="py-1.5 space-y-0.5">
                      <Link href="/admin" role="menuitem" onClick={() => setIsAdminMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors">
                        <LayoutDashboard size={15} /> Admin Overview
                      </Link>
                      <Link href="/admin/verifications" role="menuitem" onClick={() => setIsAdminMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors">
                        <ClipboardCheck size={15} /> Verification Queue
                      </Link>
                      <Link href="/admin/inquiries" role="menuitem" onClick={() => setIsAdminMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors">
                        <Users size={15} /> Tenant Leads
                      </Link>
                    </div>
                    <div className="pt-1.5 border-t border-emerald-950">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          logoutUser();
                          router.push('/');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-bold text-rose-400 rounded-xl hover:bg-rose-950/50 transition-colors"
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </div>
                )}
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
