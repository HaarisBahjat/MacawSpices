const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { prisma } = require('../lib/prisma');
const { sendOrderConfirmation } = require('../lib/email');

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

  // FIX #1: Use atomic transaction — update order AND decrement stock together
  const order = await prisma.$transaction(async (tx) => {
    // 1. Mark order as paid + auto-advance to PROCESSING
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        isPaid: true,
        status: 'PROCESSING',
        processedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true, images: true } }
          }
        },
        address: true,
        user: { select: { name: true, email: true } }
      }
    });

    // 2. Decrement stock for each product item
    for (const item of updatedOrder.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // 3. Seed first timeline event automatically
    await tx.orderTimelineEvent.create({
      data: {
        orderId: updatedOrder.id,
        eventStatus: 'PROCESSING',
        title: 'Payment Confirmed & Apothecary Curing Begun',
        description: 'Your remittance was verified. Master blenders have begun milling & sealing your botanical reserve.',
        location: 'MacawSpices Estate, India',
      }
    });

    return updatedOrder;
  });

  // FIX #3: Send order confirmation email (non-fatal)
  sendOrderConfirmation(order).catch((err) =>
    console.error('[Email] sendOrderConfirmation failed:', err.message)
  );

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

  // FIX #4: Wrapped in try/catch — unhandled rejection cannot crash the server
  (async () => {
    try {
      if (event.event === 'payment.captured') {
        const paymentId = event.payload.payment.entity.id;
        const razorpayOrderId = event.payload.payment.entity.order_id;

        // Find the order by razorpay order ID
        const existingOrder = await prisma.order.findFirst({
          where: { razorpayOrderId },
          include: {
            items: true,
            user: { select: { name: true, email: true } },
            address: true,
          }
        });

        if (existingOrder && !existingOrder.isPaid) {
          // Atomic: mark paid + decrement stock + seed timeline
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: existingOrder.id },
              data: { isPaid: true, status: 'PROCESSING', processedAt: new Date(), razorpayPaymentId: paymentId },
            });

            for (const item of existingOrder.items) {
              if (item.productId) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { decrement: item.quantity } },
                });
              }
            }

            await tx.orderTimelineEvent.create({
              data: {
                orderId: existingOrder.id,
                eventStatus: 'PROCESSING',
                title: 'Payment Confirmed & Apothecary Curing Begun',
                description: 'Your remittance was verified. Master blenders have begun milling & sealing your botanical reserve.',
                location: 'MacawSpices Estate, India',
              }
            });
          });


          // Send confirmation email
          sendOrderConfirmation(existingOrder).catch((err) =>
            console.error('[Webhook Email] sendOrderConfirmation failed:', err.message)
          );
        }
      }

      if (event.event === 'payment.failed') {
        const razorpayOrderId = event.payload.payment.entity.order_id;
        await prisma.order.updateMany({
          where: { razorpayOrderId },
          data: { status: 'CANCELLED' }
        });
      }
    } catch (error) {
      // Non-fatal: log but never crash the process
      console.error('[Webhook] DB error handling event:', event.event, error);
    }
  })();

  res.json({ received: true });
});

module.exports = router;
