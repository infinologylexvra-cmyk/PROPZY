'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function GlobalProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsVisible(true);
    setProgress(15);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        const diff = Math.random() * 15;
        return Math.min(prev + diff, 85);
      });
    }, 150);
  };

  const finishProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setProgress(0), 200);
    }, 250);
  };

  // Complete progress on pathname or query change
  useEffect(() => {
    finishProgress();
  }, [pathname, searchParams]);

  // Intercept internal link clicks to immediately trigger top progress bar
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        targetAttr !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // Only trigger if destination is different from current page
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          startProgress();
        }
      }
    };

    const handleCustomStart = () => startProgress();
    const handleCustomStop = () => finishProgress();

    document.addEventListener('click', handleAnchorClick, true);
    window.addEventListener('propzy:loading:start', handleCustomStart);
    window.addEventListener('propzy:loading:stop', handleCustomStop);

    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
      window.removeEventListener('propzy:loading:start', handleCustomStart);
      window.removeEventListener('propzy:loading:stop', handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9),0_0_24px_rgba(16,185,129,0.5)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: isVisible ? 1 : 0,
          transition: progress === 100 ? 'width 0.2s ease-out, opacity 0.3s ease-out' : 'width 0.25s ease-out'
        }}
      />
    </div>
  );
}

export function GlobalProgressBar() {
  return (
    <Suspense fallback={null}>
      <GlobalProgressBarContent />
    </Suspense>
  );
}
