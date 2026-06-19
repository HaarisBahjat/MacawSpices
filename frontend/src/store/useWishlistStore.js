import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      toggleWishlist: (product) => {
        const currentItems = get().items;
        const exists = currentItems.find((item) => item.id === product.id);

        if (exists) {
          set({ items: currentItems.filter((item) => item.id !== product.id) });
          toast.success('Removed from wishlist');
        } else {
          set({ items: [...currentItems, product] });
          toast.success('Added to wishlist!', {
            icon: '❤️',
            style: { background: '#2D1B00', color: '#FFF8F0' }
          });
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      }
    }),
    {
      name: 'spicewallah-wishlist',
    }
  )
);

export default useWishlistStore;
