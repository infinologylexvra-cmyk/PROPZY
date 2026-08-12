'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Heart, PlusCircle, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { wishlist, openAuthModal, openPidModal, user } = useApp();

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060a08]/95 backdrop-blur-xl border-t border-emerald-900/60 px-2 py-1.5 shadow-2xl shadow-emerald-950/80">
      <div className="grid grid-cols-5 items-center text-center">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 text-[10px] font-semibold transition-colors ${
            pathname === '/' ? 'text-emerald-400 font-extrabold' : 'text-gray-400 hover:text-emerald-300'
          }`}
        >
          <Home size={20} />
          <span className="mt-0.5">Home</span>
        </Link>

        {/* Search */}
        <Link
          href="/properties"
          className={`flex flex-col items-center justify-center py-1 text-[10px] font-semibold transition-colors ${
            pathname === '/properties' ? 'text-emerald-400 font-extrabold' : 'text-gray-400 hover:text-emerald-300'
          }`}
        >
          <Search size={20} />
          <span className="mt-0.5">Search</span>
        </Link>

        {/* Saved Properties */}
        <Link
          href="/dashboard?tab=wishlist"
          className={`flex flex-col items-center justify-center py-1 text-[10px] font-semibold transition-colors ${
            pathname.includes('wishlist') ? 'text-emerald-400 font-extrabold' : 'text-gray-400 hover:text-emerald-300'
          }`}
        >
          <div className="relative">
            <Heart size={20} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-500 text-black text-[9px] font-extrabold px-1 rounded-full">
                {wishlist.length}
              </span>
            )}
          </div>
          <span className="mt-0.5">Saved</span>
        </Link>

        {/* Post Property */}
        <Link
          href="/post-property"
          className={`flex flex-col items-center justify-center py-1 text-[10px] font-semibold transition-colors ${
            pathname === '/post-property' ? 'text-emerald-400 font-extrabold' : 'text-gray-400 hover:text-emerald-300'
          }`}
        >
          <PlusCircle size={20} className="text-emerald-400" />
          <span className="mt-0.5">Post</span>
        </Link>

        {/* Account / Login */}
        <button
          onClick={() => {
            if (user) {
              router.push('/dashboard?tab=account');
            } else {
              openAuthModal();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 text-[10px] font-semibold transition-colors ${
            pathname.includes('account') ? 'text-emerald-400 font-extrabold' : 'text-gray-400 hover:text-emerald-300'
          }`}
        >
          <User size={20} />
          <span className="mt-0.5">{user ? 'Account' : 'Login'}</span>
        </button>
      </div>
    </div>
  );
};
