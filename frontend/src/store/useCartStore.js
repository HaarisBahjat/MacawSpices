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

      fetchCart: async () => {
        try {
          const { data } = await cartAPI.get();
          set({ items: data.cart.items || [], subtotal: data.cart.subtotal || 0 });
        } catch (err) {
          // Not logged in - local cart only
        }
      },

      addItem: async (item) => {
        set({ isLoading: true });
        try {
          await cartAPI.add(item);
          await get().fetchCart();
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
          set({ items: [], subtotal: 0 });
        } catch {}
      },

      get totalItems() {
        return get().items.reduce((acc, item) => acc + (item.quantity || 1), 0);
      },
    }),
    {
      name: 'macawspice-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
