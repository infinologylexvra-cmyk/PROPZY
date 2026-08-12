'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050806] text-gray-100 font-sans min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-[#0a110d] border border-emerald-950 p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-900/80 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">System Encountered an Error</h1>
            <p className="text-xs text-gray-400">
              A critical layout error occurred. Click below to refresh and recover the application state.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg transition-all cursor-pointer"
          >
            Refresh Application
          </button>
        </div>
      </body>
    </html>
  );
}
