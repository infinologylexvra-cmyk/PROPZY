'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Lock, AlertTriangle, UserCheck, Key, 
  FileCheck, ShieldAlert, CheckCircle2, ArrowRight 
} from 'lucide-react';

export default function SafetySecurityPage() {
  const safetyPillars = [
    {
      icon: ShieldCheck,
      title: 'Electricity Bill Owner Verification',
      desc: 'To prevent fake listings, every property owner must submit an official Electricity Bill with Consumer Number matching their listing address.',
    },
    {
      icon: Key,
      title: 'Direct 0% Brokerage Guarantee',
      desc: 'Eliminating third-party brokers ensures transparent transactions directly between verified landlords and prospective tenants.',
    },
    {
      icon: Lock,
      title: 'Data & Privacy Protection',
      desc: 'All user identification documents, contact numbers, and bill uploads are stored using encrypted protocol systems.',
    },
    {
      icon: ShieldAlert,
      title: 'Scam Prevention & Moderation',
      desc: 'Our administrative team actively monitors listings, flagging suspicious activity, invalid numbers, or fraudulent deposit demands.',
    },
  ];

  const safetyGuidelines = [
    {
      title: 'Guidelines for Tenants',
      points: [
        'Always inspect the property in person before transferring security deposits or token money.',
        'Ensure rent terms and maintenance charges are clearly written in the rent agreement.',
        'Never transfer funds to unauthorized third-party bank accounts claiming to represent brokers.',
        'Report any user demanding brokerage fees on PROPZY verified listings.',
      ],
    },
    {
      title: 'Guidelines for Property Owners',
      points: [
        'Upload clear property photos and accurate monthly rent details.',
        'Verify tenant ID proofs (Aadhaar / Voter ID) prior to signing lease agreements.',
        'Ensure Electricity Consumer Number matches the property address during verification.',
        'Keep lease agreements updated and maintain clear receipts for security deposits.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#050806] text-gray-100 font-sans antialiased pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Trust & Safety</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Safety & <span className="text-emerald-400">Security</span> Standards
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Discover how PROPZY protects tenants and property owners through verified listings, document moderation, and secure 0% brokerage operations.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safetyPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="bg-[#0a110d] border border-emerald-950 p-6 rounded-3xl space-y-3 shadow-lg hover:border-emerald-800 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0e1d14] border border-emerald-900/60 text-emerald-400 flex items-center justify-center">
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-white">{p.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Safety Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {safetyGuidelines.map((g, idx) => (
            <div
              key={idx}
              className="bg-[#080d09] border border-emerald-950/80 p-8 rounded-3xl space-y-5 shadow-xl"
            >
              <h3 className="text-lg font-bold text-white tracking-tight border-b border-emerald-950 pb-3">
                {g.title}
              </h3>
              <ul className="space-y-3.5">
                {g.points.map((pt, i) => (
                  <li key={i} className="flex items-start space-x-3 text-xs text-gray-300 leading-relaxed">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Report Suspicious Listing Banner */}
        <div className="bg-[#120909] border border-red-900/40 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-red-400 font-bold text-sm">
              <AlertTriangle size={18} />
              <span>Report Fraudulent or Suspicious Activity</span>
            </div>
            <p className="text-xs text-gray-300 max-w-lg">
              Found a listing demanding brokerage fees or suspicious payments? Report it immediately to our administrative moderation queue.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3 bg-red-500 hover:bg-red-400 text-black font-extrabold text-xs rounded-full shadow-lg transition-all shrink-0"
          >
            Report an Issue
          </Link>
        </div>

      </div>
    </div>
  );
}
