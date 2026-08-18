'use client';

import React from 'react';
import { Building2, Loader2, Sparkles } from 'lucide-react';

export const BrandSpinner: React.FC<{ 
  message?: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({
  message = 'Loading verified data...',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 border-2',
    md: 'w-11 h-11 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-20 h-20 border-4'
  }[size];

  const iconSizes = {
    sm: 12,
    md: 18,
    lg: 26,
    xl: 32
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-6 sm:p-8 space-y-3.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Ambient glow background */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-pulse" />
        
        {/* Outer glowing ring spinner */}
        <div className={`${sizeClasses} border-emerald-950 border-t-emerald-400 border-r-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.3)]`} />
        
        {/* Inner static building / sparkles icon */}
        <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
          <Building2 size={iconSizes} className="animate-pulse" />
        </div>
      </div>

      {message && (
        <div className="flex items-center space-x-1.5 text-center">
          <p className="text-xs font-bold text-gray-300 tracking-wider animate-pulse font-mono uppercase">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

export const PageLoader: React.FC<{ 
  message?: string;
  subMessage?: string;
}> = ({
  message = 'Loading Propzy Platform...',
  subMessage = 'Fetching 0% brokerage verified properties & directory...'
}) => {
  return (
    <div className="min-h-[50vh] flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-[#091811] border border-emerald-800/80 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <Building2 size={36} className="text-emerald-400 animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
          <Loader2 size={16} className="animate-spin text-black" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
        {message}
      </h3>
      {subMessage && (
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          {subMessage}
        </p>
      )}
      
      {/* Animated pulsing bar */}
      <div className="w-48 h-1.5 bg-[#0a1811] rounded-full overflow-hidden mt-6 border border-emerald-950">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-400 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
};

export const TableSkeletonLoader: React.FC<{ 
  rows?: number; 
  cols?: number;
  message?: string;
}> = ({ 
  rows = 5, 
  cols = 5,
  message = 'Loading directory records...'
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-emerald-950/40 animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="p-4">
              {cIdx === 0 ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-900/50 shrink-0" />
                  <div className="space-y-1.5 flex-1 max-w-[140px]">
                    <div className="h-3.5 bg-emerald-950/70 rounded-md w-full" />
                    <div className="h-2.5 bg-emerald-950/40 rounded-md w-3/4" />
                  </div>
                </div>
              ) : cIdx === cols - 1 ? (
                <div className="flex justify-end">
                  <div className="h-7 w-20 bg-emerald-950/60 border border-emerald-900/50 rounded-xl" />
                </div>
              ) : (
                <div className="h-3.5 bg-emerald-950/60 rounded-md w-3/4" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export const SkeletonPropertyCard: React.FC = () => {
  return (
    <div className="bg-[#0a110d] rounded-3xl overflow-hidden border border-emerald-950/80 p-4 space-y-4 animate-pulse shadow-xl">
      {/* Image Placeholder */}
      <div className="h-48 bg-gradient-to-br from-[#0c1c14] to-[#06100b] rounded-2xl w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent animate-[shimmer_2s_infinite]" />
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-[#0d2217] rounded-md w-1/3" />
          <div className="h-4 bg-[#0d2217] rounded-md w-1/4" />
        </div>
        <div className="h-5 bg-[#0d2217] rounded-md w-3/4" />
        <div className="h-4 bg-[#0d2217]/70 rounded-md w-1/2" />
        
        {/* Footer */}
        <div className="pt-3 border-t border-emerald-950 flex items-center justify-between">
          <div className="h-4 bg-[#0d2217] rounded-md w-1/4" />
          <div className="h-8 bg-emerald-950/80 border border-emerald-900/60 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPropertyCard key={i} />
      ))}
    </div>
  );
};

export const InlineLoader: React.FC<{ 
  text?: string; 
  size?: number;
  className?: string;
}> = ({ 
  text = 'Loading...', 
  size = 14,
  className = ''
}) => {
  return (
    <span className={`inline-flex items-center space-x-2 text-emerald-400 font-bold text-xs ${className}`}>
      <Loader2 size={size} className="animate-spin text-emerald-400" />
      {text && <span>{text}</span>}
    </span>
  );
};
