import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistAPI } from '../services/api';
import toast from 'react-hot-toast';

const isLoggedIn = () => !!localStorage.getItem('sw_token');

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      hasGuestItems: false,

      // ── Core: fetch wishlist from server when authenticated ─────────────
      fetchWishlist: async () => {
        if (!isLoggedIn()) return;
        try {
          const { data } = await wishlistAPI.get();
          const items = data?.wishlist?.items || [];
          set({ items, hasGuestItems: false });
        } catch (err) {
          // Keep local state if unreachable
        }
      },

      toggleWishlist: async (product) => {
        const currentItems = get().items;
        const exists = currentItems.find((item) => (item.id || item.productId) === product.id);

        if (!isLoggedIn()) {
          // GUEST WISHLIST: store locally
          if (exists) {
            const updated = currentItems.filter((item) => (item.id || item.productId) !== product.id);
            set({ items: updated, hasGuestItems: updated.length > 0 });
            toast.success('Removed from wishlist');
          } else {
            const updated = [...currentItems, product];
            set({ items: updated, hasGuestItems: true });
            toast.success('Added to wishlist!', {
              icon: '❤️',
              style: { background: '#2D1B00', color: '#FFF8F0' }
            });
          }
          return;
        }

        // AUTHENTICATED WISHLIST: sync with server
        try {
          // Optimistic UI update
          if (exists) {
            set({ items: currentItems.filter((item) => (item.id || item.productId) !== product.id) });
            toast.success('Removed from wishlist');
          } else {
            set({ items: [...currentItems, product] });
            toast.success('Added to wishlist!', {
              icon: '❤️',
              style: { background: '#2D1B00', color: '#FFF8F0' }
            });
          }
          await wishlistAPI.toggle(product.id);
          await get().fetchWishlist();
        } catch (err) {
          toast.error('Failed to update wishlist');
          await get().fetchWishlist(); // revert on error
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => (item.id || item.productId) === productId);
      },

      clearWishlist: async () => {
        if (isLoggedIn()) {
          try { await wishlistAPI.clear(); } catch {}
        }
        set({ items: [], hasGuestItems: false });
      },

      // ── Sync guest wishlist → server on login ─────────────────────────────
      syncGuestWishlistToServer: async () => {
        if (!get().hasGuestItems) {
          await get().fetchWishlist();
          return;
        }
        const guestItems = get().items;
        if (!guestItems.length) {
          set({ hasGuestItems: false });
          await get().fetchWishlist();
          return;
        }

        const productIds = guestItems.map((i) => i.id || i.productId).filter(Boolean);
        try {
          await wishlistAPI.sync(productIds);
        } catch (err) {}
        set({ hasGuestItems: false });
        await get().fetchWishlist();
      },
    }),
    {
      name: 'macawspice-wishlist',
      partialize: (state) => ({
        items: state.items,
        hasGuestItems: state.hasGuestItems,
      }),
    }
  )
);

export default useWishlistStore;
