'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, Heart, User, ChevronDown, Home, Menu, X, ShieldCheck } from 'lucide-react';
import { GlobalSearchBar } from '@/components/GlobalSearchBar';
import { useApp } from '@/context/AppContext';

function NavbarContent() {
  const { user, logoutUser, openAuthModal, openPidModal, wishlist } = useApp();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLElement>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  // Track active navbar selection
  const [activeItem, setActiveItem] = useState<string>('');
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    if (pathname === '/post-property') {
      setActiveItem('sell');
    } else if (pathname === '/tenant/relaxplan') {
      setActiveItem('about');
    } else if (pathname === '/properties') {
      if (categoryParam === 'buy') setActiveItem('buy');
      else if (categoryParam === 'rent') setActiveItem('rent');
      else setActiveItem('properties');
    } else if (pathname === '/') {
      setActiveItem('home');
    }
  }, [pathname, categoryParam]);

  // Update sliding underline position when activeItem changes or window resizes
  useEffect(() => {
    const updateUnderline = () => {
      if (navContainerRef.current) {
        const activeEl = navContainerRef.current.querySelector(`[data-nav-key="${activeItem}"]`) as HTMLElement;
        if (activeEl) {
          setIndicatorStyle({
            left: activeEl.offsetLeft,
            width: activeEl.offsetWidth,
            opacity: 1,
          });
        } else {
          setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
        }
      }
    };

    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [activeItem]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { key: 'properties', label: 'All Properties', href: '/properties' },
    { key: 'buy', label: 'Buy', href: '/properties?category=buy' },
    { key: 'rent', label: 'Rent', href: '/properties?category=rent' },
    { key: 'sell', label: 'Sell', href: '/post-property' },
    { key: 'about', label: 'About', href: '/about' },
    { key: 'contact', label: 'Contact', href: '/contact' },
  ];

  // Hide Navbar completely on Admin portal routes (called after all hook declarations)
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#060907]/95 backdrop-blur-xl border-b border-emerald-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link
            href="/"
            onClick={() => setActiveItem('home')}
            className="flex items-center space-x-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-black shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Home size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-xl font-extrabold tracking-wider uppercase text-white font-sans">
              PROP<span className="text-emerald-400">ZY</span>
            </span>
          </Link>

          {/* Center Navigation Links with Smooth Sliding Animated Underline */}
          <nav
            ref={navContainerRef}
            className="relative hidden xl:flex items-center space-x-6 lg:space-x-7 text-xs font-semibold tracking-wide py-2"
          >
            {navItems.map((item) => {
              const isActive = activeItem === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  data-nav-key={item.key}
                  onClick={() => setActiveItem(item.key)}
                  className={`py-1 transition-colors duration-200 ${
                    isActive
                      ? 'text-emerald-400 font-extrabold'
                      : 'text-gray-300 hover:text-emerald-400'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Smooth Sliding Emerald Underline Indicator */}
            <span
              className="absolute bottom-0 h-[2.5px] bg-emerald-400 rounded-full transition-all duration-300 ease-out shadow-sm shadow-emerald-400/50"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
            />
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3.5">
            {/* Global Search Bar with Auto-Suggestions */}
            <GlobalSearchBar mode="public" className="hidden lg:block w-64 md:w-72" />

            {/* Post Property Button */}
            {user?.role === 'owner' && <Link
              href="/post-property"
              onClick={() => setActiveItem('sell')}
              className="hidden sm:flex items-center space-x-1 px-4 sm:px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
            >
              <span>Post Property</span>
              <span className="text-sm font-bold ml-1">→</span>
            </Link>}

            {/* Saved Wishlist Icon */}
            <Link
              href="/dashboard?tab=wishlist"
              className="relative p-2 text-gray-300 hover:text-emerald-400 transition-colors hidden sm:block"
              title="Saved Properties"
            >
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 text-black text-[10px] font-extrabold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Profile Dropdown or Login Link */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0d1612] border border-emerald-900/80 hover:border-emerald-500/60 transition-all text-xs font-medium text-gray-200"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline font-semibold">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className={`text-emerald-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-[#0a110d] rounded-2xl shadow-2xl border border-emerald-900/70 p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {user.role === 'admin' ? (
                      <>
                        <div className="px-4 py-2 border-b border-emerald-950 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          🛡️ Admin Portal
                        </div>
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          Admin Overview
                        </Link>
                        <Link
                          href="/admin/properties"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          Verification Queue
                        </Link>
                        <Link
                          href="/admin/inquiries"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          Tenant Leads
                        </Link>
                      </>
                    ) : user.role === 'owner' ? (
                      <>
                        <div className="px-4 py-2 border-b border-emerald-950 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          🔑 Owner Dashboard
                        </div>
                        <Link
                          href="/dashboard?tab=account"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          Account Details
                        </Link>
                        <Link
                          href="/dashboard?tab=my-properties"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          My Properties
                        </Link>
                        <Link
                          href="/dashboard?tab=billing"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          Billing History
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2 border-b border-emerald-950 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          🏠 Tenant Profile
                        </div>
                        <Link
                          href="/dashboard?tab=account"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          Account
                        </Link>
                        <Link
                          href="/dashboard?tab=wishlist"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          Saved Property
                        </Link>
                        <Link
                          href="/dashboard?tab=billing"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          Billing History
                        </Link>
                        <Link
                          href="/dashboard?tab=explore-plans"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-200 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-400 transition-colors"
                        >
                          Explore Plans
                        </Link>
                      </>
                    )}
                    <div className="pt-1 border-t border-emerald-950">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logoutUser();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-400 rounded-xl hover:bg-emerald-950/80 transition-colors cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={openAuthModal}
                  className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all cursor-pointer shadow-md"
                >
                  Login / Sign Up
                </button>
              </div>
            )}

            {/* Mobile/Tablet Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-emerald-950 focus:outline-none transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-950 bg-[#070c09] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="space-y-1">
              <Link
                href="/properties?category=rent"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-gray-200 hover:text-emerald-400"
              >
                Rent Homes
              </Link>
              <Link
                href="/properties?category=buy"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-gray-200 hover:text-emerald-400"
              >
                Buy / Sale
              </Link>
              <Link
                href="/properties?category=pg"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-gray-200 hover:text-emerald-400"
              >
                PG / Co-Living
              </Link>
              <Link
                href="/properties?category=commercial"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-gray-200 hover:text-emerald-400"
              >
                Commercial
              </Link>

              <Link
                href="/localities"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-gray-200 hover:text-emerald-400"
              >
                Top Localities
              </Link>
            </div>

            {user?.role === 'owner' && <div className="pt-3 border-t border-emerald-950 space-y-2">
              <Link
                href="/post-property"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold text-center block shadow-lg transition-all"
              >
                Post Property →
              </Link>
            </div>}
          </div>
        )}

        {/* Second Line Action Bar for Mobile View Only (< sm) */}
        <div className="flex sm:hidden items-center justify-between gap-2.5 pb-3.5 pt-1 px-1 border-t border-emerald-950/40">
          <GlobalSearchBar mode="public" placeholder="Search PID, City, Title..." className="flex-1" />

          {user?.role === 'owner' && <Link
            href="/post-property"
            onClick={() => setActiveItem('sell')}
            className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>Post Property</span>
            <span className="text-sm font-bold ml-0.5">→</span>
          </Link>}
        </div>
      </div>

      {/* Mobile/Tablet Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-[#070d09] border-b border-emerald-950/80 px-4 pt-3 pb-5 space-y-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-emerald-950">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => {
                  setActiveItem(item.key);
                  setIsMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeItem === item.key
                    ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/60'
                    : 'bg-[#0b140f] text-gray-300 hover:text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="pt-2 flex flex-col space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openPidModal();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0a1e14] text-emerald-400 border border-emerald-800/80 text-xs font-semibold flex items-center justify-center space-x-1.5"
              >
                <Search size={14} />
                <span>Search PID</span>
              </button>

              {user?.role === 'owner' && <Link
                href="/post-property"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setActiveItem('sell');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-black text-xs font-extrabold text-center"
              >
                Post Property →
              </Link>}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export const Navbar: React.FC = () => {
  return (
    <Suspense fallback={<header className="h-20 bg-[#060907]" />}>
      <NavbarContent />
    </Suspense>
  );
};
