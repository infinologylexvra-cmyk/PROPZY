import { PropertyItem } from './seedData';

const CACHE_KEY = 'propzy_admin_data_v1';

interface AdminCacheStore {
  properties: PropertyItem[] | null;
  inquiries: any[] | null;
  users: any[] | null;
  verifications: any[] | null;
}

const getStore = (): AdminCacheStore => {
  if (typeof window === 'undefined') {
    return { properties: null, inquiries: null, users: null, verifications: null };
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { properties: null, inquiries: null, users: null, verifications: null };
};

const saveStore = (data: Partial<AdminCacheStore>) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getStore();
    const updated = { ...current, ...data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch (e) {}
};

export const getCachedProperties = (): PropertyItem[] | null => getStore().properties;
export const setCachedProperties = (data: PropertyItem[]): void => saveStore({ properties: data });

export const getCachedInquiries = (): any[] | null => getStore().inquiries;
export const setCachedInquiries = (data: any[]): void => saveStore({ inquiries: data });

export const getCachedUsers = (): any[] | null => getStore().users;
export const setCachedUsers = (data: any[]): void => saveStore({ users: data });

export const getCachedVerifications = (): any[] | null => getStore().verifications;
export const setCachedVerifications = (data: any[]): void => saveStore({ verifications: data });

export const clearAdminCache = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {}
  }
};
