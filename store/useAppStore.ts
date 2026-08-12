import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BillingRecord {
  id: string;
  invoiceNo: string;
  planName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Failed';
  paymentMethod: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  role: 'tenant' | 'owner' | 'admin';
  city?: string;
  joinedDate?: string;
  activePlan?: string;
  wishlist?: string[];
  ownerVerified?: boolean;
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  electricityBillUrl?: string;
  consumerNumber?: string;
  billingHistory?: BillingRecord[];
}

export interface AppState {
  user: UserProfile | null;
  wishlist: string[];
  isAuthModalOpen: boolean;
  isPidModalOpen: boolean;
  toastMessage: string | null;

  // Actions
  setUser: (user: UserProfile | null) => void;
  logoutUser: () => void;
  toggleWishlist: (pidOrId: string) => void;
  isWishlisted: (pidOrId: string) => boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openPidModal: () => void;
  closePidModal: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const STORAGE_KEY = 'propzy_app_v1';

const normalizeWishlistKey = (key: string) => {
  if (key && key.startsWith('prop-')) {
    return `LR-${key.replace('prop-', '')}`;
  }
  return key;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      wishlist: [],
      isAuthModalOpen: false,
      isPidModalOpen: false,
      toastMessage: null,

      setUser: (user) => {
        if (user && Array.isArray(user.wishlist)) {
          const currentWishlist = get().wishlist || [];
          const normalized = user.wishlist.map(normalizeWishlistKey);
          const isSame = currentWishlist.length === normalized.length && 
            currentWishlist.every((val, idx) => val === normalized[idx]);
          
          if (isSame) {
            set({ user });
          } else {
            set({ user, wishlist: normalized });
          }
        } else {
          set({ user });
        }
      },

      logoutUser: () => {
        fetch('/api/auth/logout', { method: 'POST' }).catch((err) => console.warn('Logout API error:', err));
        set({ user: null, wishlist: [] });
        get().showToast('Logged out successfully');
      },

      toggleWishlist: (pidOrId) => {
        const normKey = normalizeWishlistKey(pidOrId);
        const currentWishlist = (get().wishlist || []).map(normalizeWishlistKey);
        const isPresent = currentWishlist.includes(normKey);

        const updated = isPresent
          ? currentWishlist.filter((id) => id !== normKey)
          : Array.from(new Set([...currentWishlist, normKey]));

        set({ wishlist: updated });
        get().showToast(isPresent ? 'Removed from Wishlist' : 'Saved to Wishlist!');

        // Persist updated wishlist array to MongoDB Atlas if user is logged in
        const currentUser = get().user;
        if (currentUser && (currentUser.email || currentUser.id)) {
          fetch('/api/user/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: currentUser.email,
              userId: currentUser.id,
              wishlist: updated
            })
          }).catch((err) => console.warn('Wishlist MongoDB sync error:', err));
        }
      },

      isWishlisted: (pidOrId) => {
        const normKey = normalizeWishlistKey(pidOrId);
        return (get().wishlist || []).some((id) => normalizeWishlistKey(id) === normKey);
      },

      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      openPidModal: () => set({ isPidModalOpen: true }),
      closePidModal: () => set({ isPidModalOpen: false }),

      showToast: (msg) => {
        set({ toastMessage: msg });
        setTimeout(() => {
          if (get().toastMessage === msg) {
            set({ toastMessage: null });
          }
        }, 3000);
      },

      clearToast: () => set({ toastMessage: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, wishlist: state.wishlist }),
    }

  )
);

// Backward Compatibility Hook Alias
export const useApp = useAppStore;
