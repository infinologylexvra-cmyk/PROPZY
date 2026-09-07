'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

/**
 * Conditionally renders children only when the current route
 * does NOT start with the given prefix. Used to hide Navbar/Footer
 * on admin pages where they are replaced by AdminSidebar/header.
 */
export function HideOnRoute({
  prefix,
  prefixes,
  children,
}: {
  prefix?: string;
  prefixes?: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (prefix && pathname.startsWith(prefix)) return null;
  if (prefixes && prefixes.some((p) => pathname.startsWith(p))) return null;
  return <>{children}</>;
}
