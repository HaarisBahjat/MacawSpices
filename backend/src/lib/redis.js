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

const getWishlistKey = (userId) => `wishlist:${userId}`;

const wishlistService = {
  async getWishlist(userId) {
    try {
      const data = await redis.get(getWishlistKey(userId));
      return data ? (typeof data === 'string' ? JSON.parse(data) : data) : { items: [] };
    } catch (error) {
      console.error('Redis getWishlist error:', error);
      return { items: [] };
    }
  },

  async setWishlist(userId, wishlist) {
    try {
      // Store wishlist for 365 days
      await redis.set(getWishlistKey(userId), JSON.stringify(wishlist), { ex: 365 * 24 * 60 * 60 });
    } catch (error) {
      console.error('Redis setWishlist error:', error);
    }
  },

  async toggleItem(userId, productId) {
    const wishlist = await this.getWishlist(userId);
    const exists = wishlist.items.some((id) => id === productId || id?.id === productId || id?.productId === productId);
    if (exists) {
      wishlist.items = wishlist.items.filter((id) => (typeof id === 'string' ? id !== productId : id.id !== productId && id.productId !== productId));
    } else {
      wishlist.items.push(productId);
    }
    await this.setWishlist(userId, wishlist);
    return wishlist;
  },

  async clearWishlist(userId) {
    try {
      await redis.del(getWishlistKey(userId));
    } catch (error) {
      console.error('Redis clearWishlist error:', error);
    }
  },
};

module.exports = { cartService, wishlistService, redis };
