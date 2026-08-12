'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

export const BrandSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading verified properties...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring spinner */}
        <div className={`${sizeClasses} border-4 border-emerald-950 border-t-emerald-500 rounded-full animate-spin`} />
        
        {/* Inner static building icon */}
        <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
          <Building2 size={size === 'lg' ? 24 : size === 'md' ? 18 : 14} className="animate-pulse" />
        </div>
      </div>

      {message && (
        <p className="text-xs font-bold text-gray-400 tracking-wider animate-pulse font-mono uppercase text-center">
          {message}
        </p>
      )}
    </div>
  );
};

export const SkeletonPropertyCard: React.FC = () => {
  return (
    <div className="bg-[#0a110d] rounded-3xl overflow-hidden border border-emerald-950/80 p-4 space-y-4 animate-pulse">
      {/* Image Placeholder */}
      <div className="h-48 bg-[#0d1c14] rounded-2xl w-full" />

      {/* Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-[#0d1c14] rounded-md w-1/3" />
          <div className="h-4 bg-[#0d1c14] rounded-md w-1/4" />
        </div>
        <div className="h-5 bg-[#0d1c14] rounded-md w-3/4" />
        <div className="h-4 bg-[#0d1c14] rounded-md w-1/2" />
        
        {/* Footer */}
        <div className="pt-3 border-t border-emerald-950 flex items-center justify-between">
          <div className="h-4 bg-[#0d1c14] rounded-md w-1/4" />
          <div className="h-8 bg-[#0d1c14] rounded-full w-24" />
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
