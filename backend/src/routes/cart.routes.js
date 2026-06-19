const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { cartService } = require('../lib/redis');
const { prisma } = require('../lib/prisma');

// GET /api/cart - get cart
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);

  // Enrich cart items with current product data
  if (cart.items && cart.items.length > 0) {
    const productIds = cart.items
      .filter((i) => i.type === 'product')
      .map((i) => i.productId);

    const products = productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true, pricePerGram: true, images: true, stock: true }
        })
      : [];

    cart.items = cart.items.map((item) => {
      if (item.type === 'product') {
        const product = products.find((p) => p.id === item.productId);
        return { ...item, product };
      }
      return item;
    });
  }

  const subtotal = cart.items.reduce((acc, item) => {
    if (item.type === 'product' && item.product) {
      return acc + item.product.pricePerGram * item.quantity;
    }
    if (item.type === 'blend') {
      return acc + item.price * (item.quantity || 1);
    }
    return acc;
  }, 0);

  res.json({ cart: { ...cart, subtotal } });
}));

// POST /api/cart/add - add item to cart
router.post('/add', authenticate, asyncHandler(async (req, res) => {
  const { productId, quantity, type = 'product', blendData } = req.body;

  // Validate product exists
  if (type === 'product') {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });
  }

  const cart = await cartService.addItem(req.user.id, {
    productId,
    quantity,
    type,
    blendData: blendData || null,
    price: blendData?.totalPrice || null,
  });

  res.json({ cart, message: 'Item added to cart' });
}));

// PUT /api/cart/update - update item quantity
router.put('/update', authenticate, asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  if (quantity <= 0) {
    const cart = await cartService.removeItem(req.user.id, productId);
    return res.json({ cart, message: 'Item removed' });
  }
  const cart = await cartService.updateItem(req.user.id, productId, quantity);
  res.json({ cart });
}));

// DELETE /api/cart/remove/:productId - remove item
router.delete('/remove/:productId', authenticate, asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user.id, req.params.productId);
  res.json({ cart, message: 'Item removed' });
}));

// DELETE /api/cart/clear - clear cart
router.delete('/clear', authenticate, asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user.id);
  res.json({ message: 'Cart cleared' });
}));

module.exports = router;
