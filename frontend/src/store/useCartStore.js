import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

// ── Helper: check if user is authenticated ──────────────────────────────────
const isLoggedIn = () => !!localStorage.getItem('sw_token');

// ── Helper: compute subtotal from items (works for both guest & server items) ─
const computeSubtotal = (items) =>
  items.reduce((acc, item) => {
    if (item.type === 'product' && item.product) {
      return acc + item.product.pricePerGram * item.quantity;
    }
    if (item.type === 'blend' && item.price) {
      return acc + item.price * (item.quantity || 1);
    }
    // Guest items without enriched product data — use stored unitPrice
    if (item.unitPrice) {
      return acc + item.unitPrice * item.quantity;
    }
    return acc;
  }, 0);

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      isLoading: false,

      // ── Core: fetch cart from server and sync (only when authenticated) ──
      fetchCart: async () => {
        if (!isLoggedIn()) return; // guests keep local state
        try {
          const { data } = await cartAPI.get();
          const items = data.cart.items || [];
          set({ items, subtotal: data.cart.subtotal || computeSubtotal(items) });
        } catch (err) {
          // Server unreachable or session expired — keep local state
        }
      },

      // ── Add Item ──────────────────────────────────────────────────────────
      addItem: async (item) => {
        set({ isLoading: true });

        if (!isLoggedIn()) {
          // GUEST CART: store locally without API call
          const current = get().items;
          const existingIdx = current.findIndex(
            (i) => i.productId === item.productId && i.type === item.type
          );
          let updated;
          if (existingIdx > -1) {
            updated = current.map((i, idx) =>
              idx === existingIdx ? { ...i, quantity: i.quantity + item.quantity } : i
            );
          } else {
            updated = [...current, { ...item, addedAt: new Date().toISOString() }];
          }
          set({ items: updated, subtotal: computeSubtotal(updated), isLoading: false });
          toast.success('Added to cart!', {
            icon: '🌶️',
            style: { background: '#0e804f', color: '#fff' },
          });
          return;
        }

        // AUTHENTICATED CART: sync with server
        try {
          await cartAPI.add(item);
          await get().fetchCart();
          set({ isLoading: false });
          toast.success('Added to cart!', {
            icon: '🌶️',
            style: { background: '#0e804f', color: '#fff' },
          });
        } catch (err) {
          set({ isLoading: false });
          toast.error(err.response?.data?.error || 'Failed to add item');
        }
      },

      // ── Update Item ───────────────────────────────────────────────────────
      updateItem: async (productId, quantity) => {
        if (!isLoggedIn()) {
          const updated = get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          );
          set({ items: updated, subtotal: computeSubtotal(updated) });
          return;
        }
        try {
          await cartAPI.update({ productId, quantity });
          await get().fetchCart();
        } catch (err) {
          toast.error('Failed to update cart');
        }
      },

      // ── Remove Item ───────────────────────────────────────────────────────
      removeItem: async (productId) => {
        if (!isLoggedIn()) {
          const updated = get().items.filter((i) => i.productId !== productId);
          set({ items: updated, subtotal: computeSubtotal(updated) });
          toast.success('Removed from cart');
          return;
        }
        try {
          await cartAPI.remove(productId);
          await get().fetchCart();
          toast.success('Removed from cart');
        } catch (err) {
          toast.error('Failed to remove item');
        }
      },

      // ── Clear Cart ────────────────────────────────────────────────────────
      clearCart: async () => {
        if (isLoggedIn()) {
          try { await cartAPI.clear(); } catch {}
        }
        set({ items: [], subtotal: 0 });
      },

      // ── Sync guest cart → server on login ─────────────────────────────────
      // Call this right after a successful login/OAuth callback
      syncGuestCartToServer: async () => {
        const guestItems = get().items;
        if (!guestItems.length) return;

        // Push each guest item to server one by one
        const errors = [];
        for (const item of guestItems) {
          try {
            await cartAPI.add({
              productId: item.productId,
              quantity: item.quantity,
              type: item.type || 'product',
              blendData: item.blendData || null,
            });
          } catch (err) {
            errors.push(item.productId);
          }
        }
        // Replace local state with fresh server state
        await get().fetchCart();
        if (errors.length) {
          toast.error(`Some items could not be synced (out of stock?)`);
        } else if (guestItems.length) {
          toast.success('Your cart has been synced!', { icon: '🛒' });
        }
      },

      get totalItems() {
        return get().items.reduce((acc, item) => acc + (item.quantity || 1), 0);
      },
    }),
    {
      name: 'macawspice-cart',
      // Persist guest cart items so they survive page refresh / tab close
      partialize: (state) => ({
        items: state.items,
        subtotal: state.subtotal,
      }),
    }
  )
);

export default useCartStore;
