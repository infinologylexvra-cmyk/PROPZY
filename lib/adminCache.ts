import { PropertyItem } from './seedData';

const CACHE_KEY = 'propzy_admin_data_v1';
const CHANNEL_NAME = 'propzy_admin_sync_channel';

export type AdminDataType = 'properties' | 'inquiries' | 'users' | 'verifications';

interface AdminCacheStore {
  properties: PropertyItem[] | null;
  inquiries: any[] | null;
  users: any[] | null;
  verifications: any[] | null;
}

let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    syncChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization failed:', e);
  }
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

export const notifyAdminSync = (type: AdminDataType): void => {
  if (typeof window === 'undefined') return;

  // 1. Post to BroadcastChannel for instant cross-tab sync
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, timestamp: Date.now() });
    } catch (e) {}
  }

  // 2. Dispatch custom event for current tab components
  try {
    window.dispatchEvent(new CustomEvent('admin_cache_updated', { detail: { type } }));
  } catch (e) {}
};

export const subscribeAdminSync = (callback: (type: AdminDataType) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.type) callback(detail.type);
  };
  window.addEventListener('admin_cache_updated', handleCustomEvent);

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === CACHE_KEY) {
      callback('properties');
      callback('verifications');
      callback('inquiries');
      callback('users');
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data?.type) {
      callback(e.data.type);
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener('admin_cache_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
};

export const getCachedProperties = (): PropertyItem[] | null => getStore().properties;
export const setCachedProperties = (data: PropertyItem[], notify = true): void => {
  saveStore({ properties: data });
  if (notify) notifyAdminSync('properties');
};

export const getCachedInquiries = (): any[] | null => getStore().inquiries;
export const setCachedInquiries = (data: any[], notify = true): void => {
  saveStore({ inquiries: data });
  if (notify) notifyAdminSync('inquiries');
};

export const getCachedUsers = (): any[] | null => getStore().users;
export const setCachedUsers = (data: any[], notify = true): void => {
  saveStore({ users: data });
  if (notify) notifyAdminSync('users');
};

export const getCachedVerifications = (): any[] | null => getStore().verifications;
export const setCachedVerifications = (data: any[], notify = true): void => {
  saveStore({ verifications: data });
  if (notify) notifyAdminSync('verifications');
};

export const clearAdminCache = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CACHE_KEY);
      notifyAdminSync('properties');
      notifyAdminSync('verifications');
      notifyAdminSync('inquiries');
      notifyAdminSync('users');
    } catch (e) {}
  }
};
