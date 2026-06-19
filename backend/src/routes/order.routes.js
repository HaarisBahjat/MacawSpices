const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { prisma } = require('../lib/prisma');
const { cartService } = require('../lib/redis');

// GET /api/orders/mine - user's orders
router.get('/mine', authenticate, asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: {
      items: {
        include: { product: { select: { name: true, images: true } } }
      },
      address: true,
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ orders });
}));

// GET /api/orders/:id - single order
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: {
      items: {
        include: { product: { select: { name: true, slug: true, images: true } } }
      },
      address: true,
    }
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
}));

// POST /api/orders - create order (called after payment verification)
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { addressId, items, totalAmount, razorpayOrderId, notes } = req.body;

  if (!addressId || !items?.length) {
    return res.status(400).json({ error: 'addressId and items are required' });
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: req.user.id }
  });
  if (!address) return res.status(404).json({ error: 'Address not found' });

  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      addressId,
      totalAmount,
      razorpayOrderId: razorpayOrderId || null,
      notes,
      items: {
        create: items.map((item) => ({
          productId: item.productId || null,
          blendName: item.blendName || null,
          blendData: item.blendData || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }))
      }
    },
    include: { items: true, address: true }
  });

  // Clear cart after order created
  await cartService.clearCart(req.user.id);

  res.status(201).json({ order });
}));

module.exports = router;
