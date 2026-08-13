import type { JWTPayload } from '@/lib/auth';

export const normalizeEmail = (email?: string | null) => (email || '').toLowerCase().trim();

export const isAdminUser = (authUser?: JWTPayload | null) => authUser?.role === 'admin';

export const isOwnedByUser = (ownerEmail: string | undefined, authUser?: JWTPayload | null) => {
  const normalizedOwnerEmail = normalizeEmail(ownerEmail);
  const normalizedAuthEmail = normalizeEmail(authUser?.email);

  return Boolean(normalizedOwnerEmail && normalizedAuthEmail && normalizedOwnerEmail === normalizedAuthEmail);
};

const toPlainObject = (value: any) => {
  if (value && typeof value.toObject === 'function') {
    return value.toObject();
  }

  return { ...value };
};

export const serializeProperty = (property: any, includeSensitive = false) => {
  const plain = toPlainObject(property || {});
  const serialized: Record<string, any> = {
    ...plain,
    _id: plain._id?.toString?.() || plain._id,
  };

  if (serialized.createdAt instanceof Date) {
    serialized.createdAt = serialized.createdAt.toISOString();
  }

  if (!includeSensitive) {
    delete serialized.ownerEmail;
    delete serialized.ownerPhone;
  }

  delete serialized.__v;
  return serialized;
};