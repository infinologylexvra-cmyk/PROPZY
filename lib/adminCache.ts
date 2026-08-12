import { PropertyItem } from './seedData';

interface AdminCacheStore {
  properties: PropertyItem[] | null;
  inquiries: any[] | null;
  users: any[] | null;
  verifications: any[] | null;
}

const cache: AdminCacheStore = {
  properties: null,
  inquiries: null,
  users: null,
  verifications: null,
};

export const getCachedProperties = (): PropertyItem[] | null => cache.properties;
export const setCachedProperties = (data: PropertyItem[]): void => {
  cache.properties = data;
};

export const getCachedInquiries = (): any[] | null => cache.inquiries;
export const setCachedInquiries = (data: any[]): void => {
  cache.inquiries = data;
};

export const getCachedUsers = (): any[] | null => cache.users;
export const setCachedUsers = (data: any[]): void => {
  cache.users = data;
};

export const getCachedVerifications = (): any[] | null => cache.verifications;
export const setCachedVerifications = (data: any[]): void => {
  cache.verifications = data;
};

export const clearAdminCache = (): void => {
  cache.properties = null;
  cache.inquiries = null;
  cache.users = null;
  cache.verifications = null;
};
