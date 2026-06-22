const { Redis } = require('@upstash/redis');

// Initialize Redis client using environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CART_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

const getCartKey = (userId) => `cart:${userId}`;

const cartService = {
  async getCart(userId) {
    try {
      const data = await redis.get(getCartKey(userId));
      return data ? (typeof data === 'string' ? JSON.parse(data) : data) : { items: [] };
    } catch (error) {
      console.error('Redis getCart error:', error);
      return { items: [] };
    }
  },

  async setCart(userId, cart) {
    try {
      await redis.set(getCartKey(userId), JSON.stringify(cart), { ex: CART_TTL });
    } catch (error) {
      console.error('Redis setCart error:', error);
    }
  },

  async clearCart(userId) {
    try {
      await redis.del(getCartKey(userId));
    } catch (error) {
      console.error('Redis clearCart error:', error);
    }
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

module.exports = { cartService, redis };
