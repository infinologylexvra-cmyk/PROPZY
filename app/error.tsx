'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, RefreshCw, Home, PhoneCall } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled App Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-[#050806] text-gray-100 font-sans">
      <div className="max-w-md w-full space-y-6 bg-[#0a110d] border border-emerald-950 p-8 rounded-3xl shadow-2xl">
        {/* Error Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-900/60 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Something Went Wrong</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            An unexpected application error occurred while rendering this page.
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-gray-500 bg-[#050806] py-1 px-2 rounded-lg inline-block border border-emerald-950">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Recovery Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0b1610] border border-emerald-900/80 text-emerald-400 hover:bg-emerald-950 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Home size={14} />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
