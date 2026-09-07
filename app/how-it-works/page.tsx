'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  Percent,
  PhoneCall,
  Home,
  FileCheck,
  Key,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  Building,
  Lock,
  Clock,
  Check,
  X
} from 'lucide-react';
import { CallToActionBanner } from '@/components/CallToActionBanner';

export default function HowItWorksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tenant' | 'owner'>('tenant');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tenantSteps = [
    {
      step: '01',
      title: 'Discover Verified Properties',
      description: 'Filter by city (Mohali, Chandigarh, Zirakpur, Panchkula, Kharar), budget, BHK size, and furnishing. Every single listing is manually inspected and 100% verified with accurate photos and pricing.',
      icon: Search,
      highlight: '100% Real Photos & Pricing'
    },
    {
      step: '02',
      title: 'Connect Directly With Owners',
      description: 'No middleman and no pushy brokers. View owner contact details, send direct inquiries, or use unique Property IDs (PID) to quickly lookup listings and schedule property visits.',
      icon: PhoneCall,
      highlight: 'Direct Owner Connection'
    },
    {
      step: '03',
      title: 'Move In with 0% Brokerage',
      description: 'Inspect the property in person, finalize terms directly with the landlord, and finalize your rental agreement. Keep 100% of your money without paying a single rupee in commission.',
      icon: Key,
      highlight: 'Save ₹15,000 - ₹50,000 Brokerage'
    }
  ];

  const ownerSteps = [
    {
      step: '01',
      title: 'List Your Property in 2 Minutes',
      description: 'Upload high-resolution property photos, specify rent, security deposit, locality, and amenities. Listing is 100% free with zero hidden charges.',
      icon: Home,
      highlight: 'Free & Instant Listing'
    },
    {
      step: '02',
      title: 'Get Verified & Unique PID',
      description: 'Our team verifies property details and generates a unique Property ID (PID) that makes your property easily searchable and promoted across Tricity renters.',
      icon: ShieldCheck,
      highlight: 'High Visibility & Trust'
    },
    {
      step: '03',
      title: 'Close Deals with Verified Tenants',
      description: 'Receive direct inquiries, chats, and calls from serious, verified tenants. Schedule visits on your terms and rent out your property in record time.',
      icon: Users,
      highlight: 'Average Rent Out: 4.5 Days'
    }
  ];

  const comparisonRows = [
    { feature: 'Brokerage Fee', propzy: '0% (Always Free)', broker: '15 - 30 Days Rent' },
    { feature: 'Property Verification', propzy: '100% Manually Verified', broker: 'Often Unverified / Fake' },
    { feature: 'Direct Landlord Contact', propzy: 'Direct Phone & Chat', broker: 'Blocked by Brokers' },
    { feature: 'Instant Search by PID', propzy: 'Yes (Instant PID Search)', broker: 'No' },
    { feature: 'Pricing Transparency', propzy: 'Fixed & Zero Hidden Fees', broker: 'Negotiated Markups' },
  ];

  const faqs = [
    {
      q: 'Is PROPZY TRICITY really 100% free with 0% brokerage?',
      a: 'Yes! We never charge brokerage fees from tenants or standard listing fees from owners. You connect directly with each other and finalize deals without commission markups.'
    },
    {
      q: 'How does PROPZY TRICITY verify properties?',
      a: 'Our local field and verification team reviews ownership documentation, physically or digitally checks property photos, verifies amenities, and cross-checks location pins across Chandigarh, Mohali, Zirakpur, Panchkula, and Kharar.'
    },
    {
      q: 'What is a PID (Property ID) and how does it work?',
      a: 'Each property listed on PROPZY TRICITY receives a unique alphanumeric Property ID (PID). You can type this code into our global search bar or PID modal to immediately navigate directly to that exact verified listing.'
    },
    {
      q: 'Can I schedule in-person visits before making a decision?',
      a: 'Absolutely. Once you connect with the verified owner, you can coordinate visit timings directly at a time that works best for both parties.'
    },
    {
      q: 'How do landlords post a property?',
      a: 'Simply click "Post Property" in the top navbar, fill in the apartment/house details, upload photos, and submit. Your listing will go live after verification.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#040806] text-white">
      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-6 pb-16 overflow-hidden border-b border-emerald-950/60 bg-gradient-to-b from-[#06120b] via-[#040906] to-[#040806]">
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
              <span>Simple, Transparent & 0% Brokerage</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
              How{' '}
              <span className="text-emerald-400 font-sans italic ml-2 mr-3.5 sm:mr-5 inline-block">
                PROPZY TRICITY
              </span>
              Works
            </h1>

            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
              Say goodbye to fake listings, middlemen commissions, and endless broker calls. PROPZY TRICITY connects genuine tenants directly with property owners in three simple steps.
            </p>

            {/* TAB SELECTOR */}
            <div className="pt-4 flex justify-center">
              <div className="p-1.5 bg-[#07130b] border border-emerald-900/80 rounded-2xl inline-flex space-x-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('tenant')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'tenant'
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  For Tenants & Renters
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('owner')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'owner'
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  For Property Owners
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          STEPS BREAKDOWN SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-emerald-950/60 bg-[#030604]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <div className="text-xs font-bold uppercase text-emerald-400 tracking-widest">
              {activeTab === 'tenant' ? 'TENANT JOURNEY' : 'LANDLORD JOURNEY'}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              {activeTab === 'tenant'
                ? 'Your 3-Step Guide to Finding a Dream Home'
                : 'Rent Out Your Property with 100% Peace of Mind'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(activeTab === 'tenant' ? tenantSteps : ownerSteps).map((stepItem, idx) => {
              const IconComp = stepItem.icon;
              return (
                <div
                  key={idx}
                  className="relative p-8 rounded-3xl bg-[#06120b] border border-emerald-950 hover:border-emerald-700/60 transition-all duration-300 flex flex-col justify-between space-y-6 group hover:-translate-y-1 shadow-lg"
                >
                  {/* Top Badge & Number */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#0b2416] border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <IconComp size={22} />
                    </div>
                    <span className="text-4xl font-extrabold font-mono text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors">
                      {stepItem.step}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {stepItem.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      {stepItem.description}
                    </p>
                  </div>

                  {/* Bottom Highlight Tag */}
                  <div className="pt-2 border-t border-emerald-950/80">
                    <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span>{stepItem.highlight}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="text-center pt-4">
            {activeTab === 'tenant' ? (
              <Link
                href="/properties"
                className="inline-flex items-center space-x-2.5 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-extrabold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Browse Verified Properties</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                href="/post-property"
                className="inline-flex items-center space-x-2.5 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-extrabold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Post Your Property Free</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          COMPARISON TABLE SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-emerald-950/60 bg-[#061009]/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#081f13] border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
              <Percent size={13} />
              <span>The PROPZY TRICITY Difference</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Why PROPZY TRICITY Beats Traditional Real Estate
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
              Compare transparent, digital direct renting with outdated traditional broker networks.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-emerald-950 bg-[#06120b]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-950/80 bg-[#08190e]">
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-gray-400 tracking-wider">Features</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-emerald-400 tracking-wider bg-emerald-950/40">
                    PROPZY TRICITY
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-gray-500 tracking-wider">
                    Traditional Brokers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/60 text-xs sm:text-sm">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#08190f]/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-200">{row.feature}</td>
                    <td className="py-4 px-6 font-bold text-emerald-400 bg-emerald-950/20 flex items-center space-x-2">
                      <Check size={16} className="text-emerald-400 shrink-0" />
                      <span>{row.propzy}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      <div className="flex items-center space-x-2 text-rose-400/80">
                        <X size={15} className="shrink-0" />
                        <span className="text-gray-400">{row.broker}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FREQUENTLY ASKED QUESTIONS
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-emerald-950/60 bg-[#030604]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#081f13] border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
              <HelpCircle size={13} />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Everything you need to know about navigating PROPZY TRICITY.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-emerald-950 bg-[#06120b] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between space-x-4 hover:bg-emerald-950/30 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-emerald-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-emerald-950/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CALL TO ACTION BANNER
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
