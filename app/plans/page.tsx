'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Check,
  ShieldCheck,
  PhoneCall,
  ArrowRight,
  ArrowLeft,
  Lock,
  Headphones,
  Zap,
  HelpCircle,
  Clock,
  Star,
  Users
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CallToActionBanner } from '@/components/CallToActionBanner';

export default function ExplorePlansPage() {
  const router = useRouter();
  const { user, openAuthModal, showToast } = useApp();

  const handleSubscribe = (planName: string, amount: number) => {
    if (!user) {
      showToast(`Please login to subscribe to the ${planName}`);
      openAuthModal();
      return;
    }
    showToast(`Redirecting to payment gateway for ${planName} (₹${amount})...`);
  };

  return (
    <div className="min-h-screen bg-[#040806] text-white">
      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 overflow-hidden border-b border-emerald-950/60 bg-gradient-to-b from-[#06120b] via-[#040906] to-[#040806]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/');
                }
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#0a140f] border border-emerald-900/80 hover:border-emerald-500 hover:bg-[#0f2219] text-gray-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 group cursor-pointer"
            >
              <ArrowLeft size={15} className="text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
          </div>

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#081f13] border border-emerald-800/60 text-emerald-400 text-xs font-semibold shadow-inner">
              <Sparkles size={14} />
              <span>Exclusively for Tenants • 0% Brokerage</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
              Tenant <span className="text-emerald-400 font-sans italic">Credit Plans</span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
              Directly connect with verified property owners across Chandigarh, Mohali, Zirakpur, Panchkula & Kharar. Zero middleman fees, unlock direct owner contacts using credits.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          PLANS PRICING CARDS
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-emerald-950/60 bg-[#030604]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* PLAN 1: ₹399 - 20 Contact Credits */}
            <div className="bg-[#06120b] border border-emerald-950 hover:border-emerald-700/60 transition-all rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#0a1f14] text-emerald-400 border border-emerald-800/60">
                    Standard Plan
                  </span>
                  <span className="text-xs font-bold text-gray-400 flex items-center space-x-1">
                    <Clock size={13} className="text-emerald-400" />
                    <span>30 Days Validity</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">20 Credits</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Perfect for renters looking to unlock up to 20 verified owner contacts in specific localities.
                  </p>
                </div>

                <div className="py-2 border-y border-emerald-950">
                  <div className="text-4xl font-extrabold text-white font-mono">
                    ₹399 <span className="text-xs text-gray-400 font-sans font-normal">/ 30 days</span>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span className="font-semibold text-white">20 Credits</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span>Direct Phone Call & WhatsApp Connect</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span>100% Zero Brokerage Guarantee</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span>Instant Property ID (PID) Unlock</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span>Standard Support & Advice</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSubscribe('Standard Plan (20 Credits)', 399)}
                className="w-full py-4 bg-[#0b2416] hover:bg-emerald-500 hover:text-black border border-emerald-700/60 text-emerald-400 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Subscribe Now • ₹399
              </button>
            </div>

            {/* PLAN 2: ₹999 - 100 Credits / 90 Days */}
            <div className="bg-[#06150d] border-2 border-emerald-500 hover:border-emerald-400 transition-all rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xl shadow-emerald-950/80 relative">
              {/* Popular Ribbon */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[11px] font-extrabold uppercase px-4 py-1 rounded-full shadow-lg tracking-wider flex items-center space-x-1">
                <Star size={12} className="fill-black stroke-black" />
                <span>Most Popular • Best Value</span>
              </div>

              <div className="space-y-5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Premium Plan
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                    <Clock size={13} className="text-emerald-400" />
                    <span>90 Days Validity</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">100 Credits</h3>
                  <p className="text-xs text-gray-300 mt-1">
                    Get 100 credits with 90 days validity & dedicated Relationship Manager support.
                  </p>
                </div>

                <div className="py-2 border-y border-emerald-900/60">
                  <div className="text-4xl font-extrabold text-emerald-400 font-mono">
                    ₹999 <span className="text-xs text-gray-400 font-sans font-normal">/ 90 days</span>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-gray-200">
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-sm">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span className="font-bold text-emerald-400">100 Credits</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-sm">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span className="font-semibold text-white">Direct Phone Call & WhatsApp Unlock</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-sm">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span className="font-semibold text-white">90 Days Extended Validity</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-sm">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span>Personal Relationship Manager (RM) Assistance</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-sm">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span>Priority Alerts on Fresh Verified Listings</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-sm">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span>Price Negotiation Guidance on Your Behalf</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-sm">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span>100% Zero Brokerage Guarantee</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSubscribe('Premium Plan (100 Credits)', 999)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
              >
                Subscribe Now • ₹999
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          WHY CHOOSE PROPZY PLANS
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-emerald-950/60 bg-[#061009]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Why Tenants Choose PROPZY TRICITY Contact Plans
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
              Save thousands on brokerage while getting direct access to genuine property owners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#06120b] border border-emerald-950 space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0a2315] border border-emerald-800 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={22} />
              </div>
              <h4 className="text-base font-bold text-white">100% Verified Owners</h4>
              <p className="text-xs text-gray-400">Every contact number is verified against property documentation.</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#06120b] border border-emerald-950 space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0a2315] border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Zap size={22} />
              </div>
              <h4 className="text-base font-bold text-white">0% Commission</h4>
              <p className="text-xs text-gray-400">Never pay 15-30 days of rent to a middleman. Save ₹15k - ₹50k.</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#06120b] border border-emerald-950 space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0a2315] border border-emerald-800 flex items-center justify-center text-emerald-400">
                <PhoneCall size={22} />
              </div>
              <h4 className="text-base font-bold text-white">Direct Connect</h4>
              <p className="text-xs text-gray-400">Call, chat, or WhatsApp landlords directly on your schedule.</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#06120b] border border-emerald-950 space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0a2315] border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Headphones size={22} />
              </div>
              <h4 className="text-base font-bold text-white">Dedicated Support</h4>
              <p className="text-xs text-gray-400">Our local Tricity support team is always ready to guide your search.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CALL TO ACTION
      ───────────────────────────────────────────────────────────── */}
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
