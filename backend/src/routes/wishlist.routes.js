const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { wishlistService } = require('../lib/redis');
const { prisma } = require('../lib/prisma');

// Helper function to enrich product IDs into full product objects
const enrichWishlistItems = async (items = []) => {
  if (!items || items.length === 0) return [];
  const productIds = items.map((item) => (typeof item === 'string' ? item : item.id || item.productId)).filter(Boolean);
  if (productIds.length === 0) return [];

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    return products;
  } catch (err) {
    console.error('Error enriching wishlist products:', err);
    return [];
  }
};

// GET /api/wishlist - get user's wishlist
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);
  const enrichedProducts = await enrichWishlistItems(wishlist.items);
  res.json({ wishlist: { items: enrichedProducts } });
}));

// POST /api/wishlist/toggle - toggle item in wishlist
router.post('/toggle', authenticate, asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID required' });

  await wishlistService.toggleItem(req.user.id, productId);
  const wishlist = await wishlistService.getWishlist(req.user.id);
  const enrichedProducts = await enrichWishlistItems(wishlist.items);
  res.json({ wishlist: { items: enrichedProducts } });
}));

// POST /api/wishlist/sync - sync guest wishlist on login
router.post('/sync', authenticate, asyncHandler(async (req, res) => {
  const { productIds = [] } = req.body;
  const current = await wishlistService.getWishlist(req.user.id);
  const currentIds = current.items.map((i) => (typeof i === 'string' ? i : i.id || i.productId));

  const merged = Array.from(new Set([...currentIds, ...productIds]));
  await wishlistService.setWishlist(req.user.id, { items: merged });

  const enrichedProducts = await enrichWishlistItems(merged);
  res.json({ wishlist: { items: enrichedProducts } });
}));

// DELETE /api/wishlist/clear - clear wishlist
router.delete('/clear', authenticate, asyncHandler(async (req, res) => {
  await wishlistService.clearWishlist(req.user.id);
  res.json({ message: 'Wishlist cleared', wishlist: { items: [] } });
}));

module.exports = router;
