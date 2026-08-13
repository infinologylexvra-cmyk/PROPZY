'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, XCircle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, toastType } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border ${
        toastType === 'success'
          ? 'bg-[#0a1810] text-emerald-50 border-emerald-800'
          : 'bg-[#1a0a0a] text-rose-50 border-rose-800'
      }`} role="alert">
        {toastType === 'success' ? (
          <CheckCircle2 size={16} className="text-emerald-400" />
        ) : (
          <XCircle size={16} className="text-rose-400" />
        )}
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
