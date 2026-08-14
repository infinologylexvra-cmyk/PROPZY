'use client';

import { useEffect, useRef } from 'react';
import { subscribeAdminSync, AdminDataType } from '@/lib/adminCache';

interface UseAdminSyncOptions {
  dataType?: AdminDataType | 'all';
  onSync: (type: AdminDataType) => void;
  enablePolling?: boolean;
  pollIntervalMs?: number;
}

export function useAdminSync({
  dataType = 'all',
  onSync,
  enablePolling = true,
  pollIntervalMs = 12000,
}: UseAdminSyncOptions) {
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    // 1. Subscribe to BroadcastChannel & window storage events
    const unsubscribe = subscribeAdminSync((changedType) => {
      if (dataType === 'all' || dataType === changedType) {
        onSyncRef.current(changedType);
      }
    });

    // 2. Window focus listener: re-sync when tab gains focus
    const handleFocus = () => {
      onSyncRef.current(dataType === 'all' ? 'verifications' : dataType);
    };

    window.addEventListener('focus', handleFocus);

    // 3. Periodic background poll
    let pollTimer: NodeJS.Timeout | null = null;
    if (enablePolling) {
      pollTimer = setInterval(() => {
        onSyncRef.current(dataType === 'all' ? 'verifications' : dataType);
      }, pollIntervalMs);
    }

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [dataType, enablePolling, pollIntervalMs]);
}
