'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Building, MessageSquare, Users, FileText, 
  ArrowLeft, Home, ShieldCheck, Sparkles, ChevronRight, LogOut
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = true, onClose }) => {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Property Manager', href: '/admin/properties', icon: Building, badge: 'All PID' },
    { label: 'Inquiries & Leads', href: '/admin/inquiries', icon: MessageSquare },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Owner Verifications', href: '/admin/verifications', icon: ShieldCheck, badge: 'Verify' },
  ];

  return (
    <aside className="w-64 bg-[#070d09] border-r border-emerald-950/80 flex flex-col justify-between h-screen sticky top-0 z-40 text-gray-200 select-none shrink-0">
      <div className="p-5 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-emerald-950/80 pb-4">
          <Link href="/admin" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-black shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Home size={20} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-wider uppercase text-white font-sans">
                PROP<span className="text-emerald-400">ZY</span>
              </span>
              <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase -mt-1">
                Admin Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-3 mb-2">
            Main Management
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-md font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#0b1610]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-gray-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Quick Links & Main Site Return */}
      <div className="p-4 border-t border-emerald-950/80 space-y-3 bg-[#050906]">
        <div className="p-3 bg-[#0a140f] rounded-2xl border border-emerald-900/60 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-800/60 flex items-center justify-center font-bold text-xs">
            ★
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">System Status</div>
            <div className="text-[10px] text-emerald-400 font-medium">100% Operational</div>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-emerald-400 bg-[#08100b] hover:bg-[#0d1c13] border border-emerald-950 transition-all"
        >
          <div className="flex items-center space-x-2">
            <ArrowLeft size={16} />
            <span>Back to Website</span>
          </div>
          <ChevronRight size={14} />
        </Link>
      </div>
    </aside>
  );
};
