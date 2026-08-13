/**
 * Form Input Validation Helpers for PROPZY
 */

// Name validation: letters, spaces, dots, hyphens only. No digits. Max 50 chars.
export const sanitizeName = (val: string): string => {
  return val.replace(/[^a-zA-Z\s.-]/g, '').slice(0, 50);
};

export const isValidName = (val: string): boolean => {
  const trimmed = val.trim();
  return trimmed.length >= 2 && /^[a-zA-Z\s.-]+$/.test(trimmed);
};

// Phone validation: digits only (0-9). Max 10 digits.
export const sanitizePhone = (val: string): string => {
  return val.replace(/\D/g, '').slice(0, 10);
};

export const isValidPhone = (val: string): boolean => {
  const trimmed = val.trim();
  // Validates a 10-digit mobile number
  return /^\d{10}$/.test(trimmed);
};

// Email validation: requires valid user@domain.tld structure with at least 2-char TLD (.com, .in, etc.)
export const isValidEmail = (val: string): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
};
