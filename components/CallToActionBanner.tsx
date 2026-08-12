'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowRight } from 'lucide-react';

interface CallToActionBannerProps {
  subTag?: string;
  titleMain?: string;
  titleItalic?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
}

export const CallToActionBanner: React.FC<CallToActionBannerProps> = ({
  subTag = 'IS READY TO MOVE',
  titleMain = "Let's find your",
  titleItalic = 'perfect space.',
  description = 'Verified homes. Zero brokerage. Hassle-free renting.',
  buttonText = 'Explore Properties',
  buttonHref = '/properties',
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#06180e] via-[#0b2b1a] to-[#04120b] border border-emerald-800/40 p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 ${className}`}
    >
      {/* Background Subtle Glows */}
      <div className="absolute -left-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left Content */}
      <div className="flex items-start space-x-5 z-10">
        <div className="w-14 h-14 rounded-2xl bg-[#092214] border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
          <Home size={26} />
        </div>
        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold tracking-widest text-emerald-400 uppercase font-mono">
            {subTag}
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
            {titleMain}{' '}
            <span className="italic font-normal text-emerald-400 drop-shadow-sm">
              {titleItalic}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-medium max-w-xl">
            {description}
          </p>
        </div>
      </div>

      {/* Right Button */}
      <div className="z-10 shrink-0">
        <Link
          href={buttonHref}
          className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-95"
        >
          <span>{buttonText}</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};
