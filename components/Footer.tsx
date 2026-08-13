'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, ShieldCheck, Phone, Mail, MapPin, Smartphone, ArrowRight, 
  Globe, Instagram, Linkedin, Twitter, Facebook, UserCheck, Percent, Heart
} from 'lucide-react';

import { isValidEmail } from '@/lib/validation';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(emailInput)) {
      alert('Please enter a valid email address (e.g., name@example.com)');
      return;
    }
    setSubscribed(true);
    setEmailInput('');
  };

  const majorCities = [
    { name: 'Mohali', href: '/properties?city=Mohali' },
    { name: 'Chandigarh', href: '/properties?city=Chandigarh' },
    { name: 'Zirakpur', href: '/properties?city=Zirakpur' },
    { name: 'Panchkula', href: '/properties?city=Panchkula' },
    { name: 'Kharar', href: '/properties?city=Kharar' },
    { name: '+ More', href: '/localities' },
  ];


  // Hide Footer on Admin portal routes (called after all hook declarations)
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-[#030604] text-gray-300 pt-12 sm:pt-16 pb-28 lg:pb-20 border-t border-emerald-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ─────────────────────────────────────────────────────────────
            TOP GRID: LOGO, LINKS & NEWSLETTER
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8">
          {/* Col 1: Brand & Socials */}
          <div className="lg:col-span-3 space-y-4">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
                <Home size={20} className="stroke-[2.5]" />
              </div>
              <span className="text-xl font-extrabold tracking-wider uppercase text-white font-sans">
                PROP<span className="text-emerald-400">ZY</span>
              </span>
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed">
              Your trusted platform for verified rental properties. 0% brokerage. 100% transparency.
            </p>

            {/* Social Icons Row */}
            <div className="flex items-center space-x-2 pt-2">
              {[Globe, Instagram, Linkedin, Twitter, Facebook].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-8 h-8 rounded-full border border-emerald-900/80 bg-[#07110a] hover:bg-emerald-500 hover:text-black hover:border-emerald-500 flex items-center justify-center text-emerald-400 transition-all"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: EXPLORE */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-white tracking-widest">EXPLORE</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="/properties?category=rent" className="hover:text-emerald-400 transition-colors">Rent</Link></li>
              <li><Link href="/properties?category=buy" className="hover:text-emerald-400 transition-colors">Buy</Link></li>
              <li><Link href="/properties?category=pg" className="hover:text-emerald-400 transition-colors">PG</Link></li>
              <li><Link href="/properties" className="hover:text-emerald-400 transition-colors">All Properties</Link></li>
              <li><Link href="/properties?category=commercial" className="hover:text-emerald-400 transition-colors">New Projects</Link></li>
            </ul>
          </div>

          {/* Col 3: COMPANY */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-white tracking-widest">COMPANY</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="/tenant/relaxplan" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link href="/tenant/relaxplan" className="hover:text-emerald-400 transition-colors">How It Works</Link></li>
              <li><Link href="/tenant/relaxplan" className="hover:text-emerald-400 transition-colors">Careers</Link></li>
              <li><Link href="/localities" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
              <li><Link href="/tenant/relaxplan" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Col 4: SUPPORT */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-white tracking-widest">SUPPORT</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="/help" className="hover:text-emerald-400 transition-colors">Help Center</Link></li>
              <li><Link href="/safety" className="hover:text-emerald-400 transition-colors">Safety & Security</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/faq" className="hover:text-emerald-400 transition-colors">FAQ</Link></li>
            </ul>

          </div>

          {/* Col 5: NEWSLETTER */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-white tracking-widest">NEWSLETTER</h4>
            <p className="text-xs text-gray-400">
              Get the latest property updates and rental insights straight to your inbox.
            </p>
            {subscribed ? (
              <div className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 p-2.5 rounded-xl">
                ✓ Thank you for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center space-x-2">
                <input
                  type="email"
                  required
                  suppressHydrationWarning
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="bg-[#09110c] border border-emerald-950 text-xs text-white placeholder-gray-500 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 flex-1"
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center font-extrabold shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  →
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MIDDLE HIGHLIGHT BAR (Dotted Border)
        ───────────────────────────────────────────────────────────── */}
        <div className="border-y border-dashed border-emerald-900/60 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {/* Highlight 1 */}
          <div className="flex items-center justify-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#0a1e14] border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Percent size={16} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">0% Brokerage</div>
              <div className="text-[10px] text-gray-400">Direct zero brokerage platform</div>
            </div>
          </div>

          {/* Highlight 2 */}
          <div className="flex items-center justify-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#0a1e14] border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={16} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">100% Verified</div>
              <div className="text-[10px] text-gray-400">Every property, manually verified</div>
            </div>
          </div>

          {/* Highlight 3 */}
          <div className="flex items-center justify-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#0a1e14] border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <UserCheck size={16} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Direct Owner</div>
              <div className="text-[10px] text-gray-400">Connect directly with owners</div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            APP DOWNLOAD & SERVING MAJOR CITIES
        ───────────────────────────────────────────────────────────── */}
        <div className="border-b border-dashed border-emerald-900/60 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* App Store Buttons */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider">
              GET THE PROPZY APP
            </div>
            <p className="text-xs text-gray-400">
              Find, shortlist & manage properties on the go.
            </p>
            <div className="flex items-center space-x-3 pt-1">
              <a
                href="#"
                className="px-4 py-2 bg-[#09110c] hover:bg-[#121c16] border border-emerald-950 rounded-2xl text-xs font-bold text-white flex items-center space-x-2 transition-colors"
              >
                <Smartphone size={16} className="text-emerald-400" />
                <span>Get it on App Store</span>
              </a>
              <a
                href="#"
                className="px-4 py-2 bg-[#09110c] hover:bg-[#121c16] border border-emerald-950 rounded-2xl text-xs font-bold text-white flex items-center space-x-2 transition-colors"
              >
                <Smartphone size={16} className="text-emerald-400" />
                <span>Get it on Google Play</span>
              </a>
            </div>
          </div>

          {/* Serving Major Cities */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider">
              SERVING MAJOR CITIES
            </div>
            <div className="flex flex-wrap justify-center md:justify-start  gap-4">
              {majorCities.map((c, idx) => (
                <Link key={idx} href={c.href} className="flex flex-col items-center space-y-1 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-[#0a1b12] border border-emerald-900/60 group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-black text-emerald-400 flex items-center justify-center transition-all">
                    <Home size={16} />
                  </div>
                  <span className="text-[10px] text-gray-400 group-hover:text-white font-medium transition-colors">
                    {c.name}
                  </span>
                </Link>
              ))}

            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            BOTTOM COPYRIGHT ROW 
        ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4 pt-2">
          <p>© 2026 PROPZY. All rights reserved.</p>
          <div className="flex flex-wrap items-center space-x-4">
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Use</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>

            <span>•</span>
            <Link href="/localities" className="hover:text-emerald-400 transition-colors">Sitemap</Link>
            <span>•</span>
            <span className="text-gray-400 flex items-center space-x-1">
              <span>Made with</span>
              <Heart size={12} className="text-emerald-400 fill-emerald-400" />
              <span>for finding your home</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
