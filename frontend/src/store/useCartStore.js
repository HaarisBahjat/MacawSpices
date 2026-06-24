import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      isLoading: false,

      // ── Core: fetch cart from server (enriches items with product data) ──
      fetchCart: async () => {
        try {
          const { data } = await cartAPI.get();
          set({ items: data.cart.items || [], subtotal: data.cart.subtotal || 0 });
        } catch (err) {
          // Not logged in — keep local state, but clear stale product data
          // so we don't show wrong prices
        }
      },

      addItem: async (item) => {
        set({ isLoading: true });
        try {
          await cartAPI.add(item);
          await get().fetchCart();     // always re-fetch so product data is fresh
          set({ isLoading: false });
          toast.success('Added to cart!', {
            icon: '🌶️',
            style: { background: '#2D1B00', color: '#FFF8F0' }
          });
        } catch (err) {
          set({ isLoading: false });
          toast.error(err.response?.data?.error || 'Failed to add item');
        }
      },

      updateItem: async (productId, quantity) => {
        try {
          await cartAPI.update({ productId, quantity });
          await get().fetchCart();
        } catch (err) {
          toast.error('Failed to update cart');
        }
      },

      removeItem: async (productId) => {
        try {
          await cartAPI.remove(productId);
          await get().fetchCart();
          toast.success('Removed from cart');
        } catch (err) {
          toast.error('Failed to remove item');
        }
      },

      clearCart: async () => {
        try {
          await cartAPI.clear();
        } catch {}
        // Always clear local state even if server call fails
        set({ items: [], subtotal: 0 });
      },

      get totalItems() {
        return get().items.reduce((acc, item) => acc + (item.quantity || 1), 0);
      },
    }),
    {
      name: 'macawspice-cart',
      // ⚠️  Do NOT persist items — they contain stale product data.
      // Cart is always re-fetched from server on login/mount.
      // We only persist nothing (or a minimal flag) to keep zustand happy.
      partialize: () => ({}),
    }
  )
);

export default useCartStore;
