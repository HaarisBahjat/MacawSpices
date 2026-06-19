const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { prisma } = require('../lib/prisma');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order - create Razorpay order
router.post('/create-order', authenticate, asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', notes } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const options = {
    amount: Math.round(amount * 100), // convert to paise
    currency,
    receipt: `receipt_${Date.now()}`,
    notes: notes || {},
  };

  const order = await razorpay.orders.create(options);

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}));

// POST /api/payments/verify - verify payment signature
router.post('/verify', authenticate, asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  // Verify signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature', success: false });
  }

  // Update order as paid
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      isPaid: true,
      status: 'CONFIRMED',
    }
  });

  res.json({ success: true, order });
}));

// POST /api/payments/webhook - Razorpay webhook
router.post('/webhook', (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = JSON.parse(req.body.toString());
  console.log('Razorpay webhook event:', event.event);

  // Handle events
  (async () => {
    if (event.event === 'payment.captured') {
      const paymentId = event.payload.payment.entity.id;
      const orderId = event.payload.payment.entity.order_id;
      await prisma.order.updateMany({
        where: { razorpayOrderId: orderId },
        data: { isPaid: true, status: 'CONFIRMED', razorpayPaymentId: paymentId }
      });
    }
    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      await prisma.order.updateMany({
        where: { razorpayOrderId: orderId },
        data: { status: 'CANCELLED' }
      });
    }
  })();

  res.json({ received: true });
});

module.exports = router;
