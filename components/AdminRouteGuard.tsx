'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

/**
 * AdminRouteGuard:
 * Ensures that when a user is logged in as an Admin (role === 'admin'),
 * they cannot browse public website pages (e.g. /, /properties, /about, /contact, etc.).
 * Any attempt to access public routes redirects them automatically to the Admin Dashboard (/admin).
 * To browse the public website, the admin must log out.
 */
export const AdminRouteGuard: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useApp();

  useEffect(() => {
    if (!pathname) return;

    // If the authenticated user is an admin and is navigating outside the /admin route tree
    if (user && user.role === 'admin' && !pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
      router.replace('/admin');
    }
  }, [user, pathname, router]);

  return null;
};
