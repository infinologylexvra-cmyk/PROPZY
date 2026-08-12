'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, Bell, ShieldCheck, PlusCircle, Home 
} from 'lucide-react';
import { GlobalSearchBar } from '@/components/GlobalSearchBar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useApp } from '@/context/AppContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, openPidModal, openAuthModal, showToast } = useApp();
  const [pidQuickInput, setPidQuickInput] = useState('');

  // Automatic Authorization Guard & Silent Redirection
  React.useEffect(() => {
    if (pathname === '/admin/login') return;

    if (!user) {
      openAuthModal();
      router.replace('/');
    } else if (user.role !== 'admin') {
      showToast('Access restricted to Admin accounts');
      router.replace('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pathname]);

  // Bypass route guard for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Prevent rendering admin panel or restricted screen for non-admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      {/* Desktop-Only Blocker — visible on screens < 1024px */}
      <div className="fixed inset-0 z-[999] bg-[#050806] flex flex-col items-center justify-center text-center p-8 lg:hidden">
        <div className="w-20 h-20 rounded-3xl bg-[#0a2618] border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-6">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">Desktop Only</h2>
        <p className="text-sm text-gray-400 max-w-sm mb-6">
          The Propzy Admin Panel is optimized for desktop screens. Please open this page on a laptop or desktop computer for the best experience.
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition-all"
        >
          <Home size={16} />
          <span>Go to Homepage</span>
        </Link>
      </div>

      {/* Admin Panel — only usable on lg+ screens */}
      <div className="bg-[#050806] text-gray-100 min-h-screen flex font-sans antialiased">
        {/* Sidebar */}
        <div className="shrink-0">
          <AdminSidebar />
        </div>

        {/* Main Administrative Viewport Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 bg-[#060a08]/95 backdrop-blur-xl border-b border-emerald-950/80 px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <GlobalSearchBar mode="admin" className="w-80" />
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              {/* Post Property Quick Action */}
              <Link
                href="/post-property"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md transition-all"
              >
                <PlusCircle size={14} />
                <span>Add Property</span>
              </Link>

              {/* Notifications */}
              <button
                onClick={() => showToast('No new unread system alerts')}
                className="relative p-2 rounded-xl bg-[#0b140f] border border-emerald-900/80 text-gray-300 hover:text-emerald-400 transition-colors"
                title="System Alerts"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              </button>

              {/* Admin Profile Badge */}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0a1610] border border-emerald-900/80 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-xs">
                  {user ? user.name.charAt(0) : 'A'}
                </div>
                <span className="font-bold text-white">
                  {user ? user.name.split(' ')[0] : 'Admin'}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto pb-24">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
