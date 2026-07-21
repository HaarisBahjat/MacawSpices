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

// GET /api/orders/:id - single order (includes timeline events)
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: {
      items: {
        include: { product: { select: { name: true, slug: true, images: true } } }
      },
      address: true,
      timelineEvents: {
        orderBy: { createdAt: 'desc' },
      },
    }
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
}));

// POST /api/orders - create order before payment with stock validation & server pricing
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { addressId, items, notes } = req.body;

  if (!addressId || !items?.length) {
    return res.status(400).json({ error: 'addressId and items are required' });
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: req.user.id }
  });
  if (!address) return res.status(404).json({ error: 'Address not found' });

  // 1. Stock validation & server-side price calculation
  const productIds = items
    .map((i) => i.productId)
    .filter(Boolean);

  const dbProducts = productIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: productIds } }
      })
    : [];

  let calculatedSubtotal = 0;
  const processedItems = [];

  for (const item of items) {
    if (item.productId) {
      const product = dbProducts.find((p) => p.id === item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ error: `Product not available` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}g, requested: ${item.quantity}g`
        });
      }
      const unitPrice = product.pricePerGram;
      const totalPrice = unitPrice * item.quantity;
      calculatedSubtotal += totalPrice;

      processedItems.push({
        productId: product.id,
        blendName: null,
        blendData: null,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    } else if (item.blendName || item.blendData) {
      const totalPrice = item.totalPrice || item.unitPrice || 0;
      calculatedSubtotal += totalPrice;
      processedItems.push({
        productId: null,
        blendName: item.blendName || 'Custom Blend',
        blendData: item.blendData || null,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || totalPrice,
        totalPrice,
      });
    }
  }

  const shipping = calculatedSubtotal >= 499 ? 0 : 60;
  const verifiedTotal = calculatedSubtotal + shipping;

  // 2. Create Razorpay order
  let razorpayOrder = null;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      razorpayOrder = await rzp.orders.create({
        amount: Math.round(verifiedTotal * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now().toString().slice(-8)}`,
      });
    } catch (err) {
      console.error('Razorpay order creation error:', err);
    }
  }

  // 3. Create DB order in PENDING status
  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      addressId,
      totalAmount: verifiedTotal,
      status: 'PENDING',
      isPaid: false,
      razorpayOrderId: razorpayOrder?.id || req.body.razorpayOrderId || null,
      notes,
      items: {
        create: processedItems,
      }
    },
    include: { items: true, address: true }
  });

  // 4. Clear user cart in Redis
  await cartService.clearCart(req.user.id);

  res.status(201).json({
    order,
    razorpayOrder,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}));

// DELETE /api/orders/:id/cancel — customer self-cancel (only pre-dispatch statuses)
router.delete('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const cancellable = ['PENDING', 'CONFIRMED', 'PROCESSING'];
  if (!cancellable.includes(order.status)) {
    return res.status(400).json({
      error: `Order cannot be cancelled once it is ${order.status}. Please contact support.`
    });
  }

  // Restore stock for product items
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });
    // Create timeline event for cancellation
    await tx.orderTimelineEvent.create({
      data: {
        orderId: order.id,
        eventStatus: 'CANCELLED',
        title: 'Order Cancelled by Customer',
        description: 'The customer requested cancellation of this botanical allocation.',
      }
    });
    // Restore stock
    for (const item of items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  res.json({ success: true, message: 'Order cancelled successfully.' });
}));

// POST /api/orders/:id/return — customer return/replacement request (only within 7 days of delivery)
router.post('/:id/return', authenticate, asyncHandler(async (req, res) => {
  const { reason, notes: returnNotes } = req.body;
  if (!reason) return res.status(400).json({ error: 'Please provide a reason for the return.' });

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.status !== 'DELIVERED') {
    return res.status(400).json({ error: 'Return requests can only be raised for delivered orders.' });
  }

  // 7-day return window
  const deliveredAt = order.deliveredAt || order.updatedAt;
  const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 7) {
    return res.status(400).json({ error: 'Return window has expired (7 days from delivery).' });
  }

  const returnNote = `[RETURN REQUEST] Reason: ${reason}. ${returnNotes ? 'Notes: ' + returnNotes : ''}`.trim();
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        notes: order.notes ? `${order.notes}\n${returnNote}` : returnNote,
      },
    });
    await tx.orderTimelineEvent.create({
      data: {
        orderId: order.id,
        eventStatus: 'REFUNDED',
        title: 'Return / Replacement Requested',
        description: `Reason: ${reason}${returnNotes ? ' — ' + returnNotes : ''}`,
      }
    });
  });

  res.json({ success: true, message: 'Return request submitted. Our team will contact you within 24 hours.' });
}));

module.exports = router;

