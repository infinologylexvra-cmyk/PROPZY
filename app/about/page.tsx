'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Handshake, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Headphones 
} from 'lucide-react';
import { CallToActionBanner } from '@/components/CallToActionBanner';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#040806] text-white">
      {/* SECTION 1: HERO SECTION (SCREENSHOT 1) */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-emerald-950/60 bg-gradient-to-b from-[#06120b] via-[#040906] to-[#040806]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none " />

        {/* City Skyline Outline SVG Graphic */}
        <div className="absolute inset-x-0 bottom-0 opacity-20 pointer-events-none flex justify-center overflow-hidden">
          <svg className="w-full max-w-6xl h-48 sm:h-64 text-emerald-500 stroke-current fill-none" viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg">
            <path d="M50,300 L50,180 L90,180 L90,300 M90,300 L90,140 L150,140 L150,300 M150,300 L150,200 L200,200 L200,300 M250,300 L250,80 L350,80 L350,300 M350,300 L350,160 L420,160 L420,300 M450,300 L450,100 L520,100 L520,300 M520,300 L520,50 L650,50 L650,300 M650,300 L650,120 L730,120 L730,300 M750,300 L750,90 L850,90 L850,300 M850,300 L850,170 L920,170 L920,300 M950,300 L950,130 L1050,130 L1050,300 M1050,300 L1050,210 L1150,210 L1150,300" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="600" cy="80" r="3" fill="#10b981" />
            <circle cx="300" cy="110" r="3" fill="#10b981" />
            <circle cx="800" cy="120" r="3" fill="#10b981" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#081f13] border border-emerald-800/60 text-emerald-400 text-xs font-semibold shadow-inner">
            <span>★</span>
            <span>About Us</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
            Build on trust Driven <br />
            <span className="italic font-serif font-normal text-emerald-400">
              By Purpose
            </span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
            At Propzy, we believe finding a home should be simple, transparent, and stress-free. Every property is carefully verified so you can buy, rent, or sell with complete confidence.
          </p>
        </div>
      </section>

      {/* SECTION 2: BUILDING IMPACT STATS (SCREENSHOT 2) */}
      <section className="py-20 border-b border-emerald-950/60 bg-[#030604]">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-12">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#081f13] border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
              <span>★</span>
              <span>About Us</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Building <span className="text-emerald-400">impact</span>, one deal at a time
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 rounded-3xl bg-[#06120b] border border-emerald-950 hover:border-emerald-700/60 transition-all flex flex-col items-center justify-center space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white">10,000+</div>
              <div className="text-xs text-gray-400 font-medium">Verified Properties</div>
            </div>

            <div className="p-8 rounded-3xl bg-[#06120b] border border-emerald-950 hover:border-emerald-700/60 transition-all flex flex-col items-center justify-center space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white">5,000+</div>
              <div className="text-xs text-gray-400 font-medium">Happy Clients</div>
            </div>

            <div className="p-8 rounded-3xl bg-[#06120b] border border-emerald-950 hover:border-emerald-700/60 transition-all flex flex-col items-center justify-center space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Handshake size={24} />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white">15,000+</div>
              <div className="text-xs text-gray-400 font-medium">Deals Facilitated</div>
            </div>

            <div className="p-8 rounded-3xl bg-[#06120b] border border-emerald-950 hover:border-emerald-700/60 transition-all flex flex-col items-center justify-center space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white">50+</div>
              <div className="text-xs text-gray-400 font-medium">Cities Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: WHY CHOOSE US (SCREENSHOT 3) */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#081f13] border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
              <span>★</span>
              <span>Why Choose Us</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white leading-tight">
              Finding a home should be exciting,{' '}
              <span className="italic font-serif font-normal text-emerald-400">
                not exhausting.
              </span>
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
              <p>
                Searching for a property shouldn't mean scrolling through fake listings, dealing with hidden charges, or making endless phone calls.
              </p>
              <p>
                We created LetsRentz to simplify the entire journey with verified properties, transparent information, and direct owner connections—so every decision is backed by trust, not uncertainty.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-2xl bg-[#06120b] border border-emerald-900/60 hover:border-emerald-600/80 transition-all flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-[#092214] border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Verified Properties</h4>
                <p className="text-xs text-gray-400">Every property is carefully verified for authenticity and accuracy.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#06120b] border border-emerald-900/60 hover:border-emerald-600/80 transition-all flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-[#092214] border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Zero Brokerage</h4>
                <p className="text-xs text-gray-400">Connect directly with property owners and save on unnecessary brokerage fees.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#06120b] border border-emerald-900/60 hover:border-emerald-600/80 transition-all flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-[#092214] border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <FileText size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Transparent Information</h4>
                <p className="text-xs text-gray-400">Real photos, verified details, and honest property information.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#06120b] border border-emerald-900/60 hover:border-emerald-600/80 transition-all flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-[#092214] border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Headphones size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Dedicated Support</h4>
                <p className="text-xs text-gray-400">From your first search to the final decision, our team is here to guide you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CALL TO ACTION BANNER (SCREENSHOT 4 COMPONENT) */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <CallToActionBanner
          subTag="IS READY TO MOVE"
          titleMain="Let's find your"
          titleItalic="perfect space."
          description="Verified homes. Zero brokerage. Hassle-free renting."
          buttonText="Explore Properties"
          buttonHref="/properties"
        />
      </section>
    </div>
  );
}
