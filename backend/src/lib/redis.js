// Simple in-memory fallback since Redis is disabled for now
const memoryCache = new Map();

const CART_TTL = 7 * 24 * 60 * 60; // Just for reference, not used in memory

const getCartKey = (userId) => `cart:${userId}`;

const cartService = {
  async getCart(userId) {
    const data = memoryCache.get(getCartKey(userId));
    return data ? JSON.parse(data) : { items: [] };
  },

  async setCart(userId, cart) {
    memoryCache.set(getCartKey(userId), JSON.stringify(cart));
  },

  async clearCart(userId) {
    memoryCache.delete(getCartKey(userId));
  },

  async addItem(userId, item) {
    const cart = await this.getCart(userId);
    const existingIdx = cart.items.findIndex(
      (i) => i.productId === item.productId && i.type === item.type
    );
    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += item.quantity;
    } else {
      cart.items.push({ ...item, addedAt: new Date().toISOString() });
    }
    await this.setCart(userId, cart);
    return cart;
  },

  async updateItem(userId, productId, quantity) {
    const cart = await this.getCart(userId);
    cart.items = cart.items.map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );
    await this.setCart(userId, cart);
    return cart;
  },

  async removeItem(userId, productId) {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((i) => i.productId !== productId);
    await this.setCart(userId, cart);
    return cart;
  },
};

module.exports = { cartService };
