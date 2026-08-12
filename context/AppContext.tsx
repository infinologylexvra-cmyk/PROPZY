'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';

export type { BillingRecord, UserProfile, AppState } from '@/store/useAppStore';
export { useAppStore } from '@/store/useAppStore';

export const useApp = useAppStore;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
