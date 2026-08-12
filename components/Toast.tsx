'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border border-gray-700">
        <CheckCircle2 size={16} className="text-emerald-400" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
