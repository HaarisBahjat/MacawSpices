const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { prisma } = require('../lib/prisma');
const { sendShippingNotification } = require('../lib/email');

/**
 * POST /api/shipping/webhook
 * Automated listener for Shiprocket / Delhivery / Courier webhook events
 */
router.post('/webhook', asyncHandler(async (req, res) => {
  const { order_id, current_status, awb, courier_name, location, activity } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required in webhook payload' });
  }

  const order = await prisma.order.findUnique({
    where: { id: order_id },
    include: { user: { select: { name: true, email: true } } }
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const STATUS_MAP = {
    'PICKED UP': 'SHIPPED',
    'IN TRANSIT': 'SHIPPED',
    'OUT FOR DELIVERY': 'SHIPPED',
    'DELIVERED': 'DELIVERED',
    'CANCELED': 'CANCELLED',
    'RTO DELIVERED': 'REFUNDED',
  };

  const newStatus = STATUS_MAP[current_status?.toUpperCase()] || order.status;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        trackingNumber: awb || order.trackingNumber,
        courierName: courier_name || order.courierName,
        shippedAt: current_status === 'PICKED UP' && !order.shippedAt ? new Date() : order.shippedAt,
        deliveredAt: current_status === 'DELIVERED' && !order.deliveredAt ? new Date() : order.deliveredAt,
      },
    });

    await tx.orderTimelineEvent.create({
      data: {
        orderId: order.id,
        eventStatus: newStatus,
        title: `Shipment Update: ${current_status || 'In Transit'}`,
        description: activity || `Package status reported as ${current_status}`,
        location: location || 'Logistics Hub',
      }
    });

    return updated;
  });

  if (current_status === 'PICKED UP' || newStatus === 'SHIPPED') {
    sendShippingNotification(updatedOrder).catch((err) =>
      console.error('[Shipping Webhook] Email error:', err.message)
    );
  }

  res.json({ success: true, message: 'Webhook processed successfully' });
}));

/**
 * POST /api/shipping/simulate-dispatch/:orderId
 * Developer/Admin simulation to auto-progress order tracking through realistic checkpoints
 */
router.post('/simulate-dispatch/:orderId', requireAdmin, asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { name: true, email: true } } }
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const generatedAwb = order.trackingNumber || `AWB-${Math.floor(100000000 + Math.random() * 900000000)}`;
  const courierName = order.courierName || 'Delhivery Express';

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        trackingNumber: generatedAwb,
        courierName: courierName,
        shippedAt: new Date(),
      }
    });

    await tx.orderTimelineEvent.createMany({
      data: [
        {
          orderId: orderId,
          eventStatus: 'SHIPPED',
          title: 'Dispatched from Estate',
          description: `Handed over to ${courierName}. Waybill generated.`,
          location: 'MacawSpices Central Warehouse, Kochi, India',
        },
        {
          orderId: orderId,
          eventStatus: 'SHIPPED',
          title: 'In Transit - Sorting Hub',
          description: 'Package scanned and sorted for onward air transport.',
          location: 'Bengaluru Gateway Hub, Karnataka',
        },
        {
          orderId: orderId,
          eventStatus: 'SHIPPED',
          title: 'Out for Delivery',
          description: 'Package loaded into delivery vehicle for final destination.',
          location: 'Destination Delivery Hub',
        }
      ]
    });

    return updated;
  });

  sendShippingNotification(updatedOrder).catch((err) =>
    console.error('[Simulate Dispatch] Email notification error:', err.message)
  );

  res.json({
    success: true,
    message: 'Automated dispatch simulated successfully',
    order: updatedOrder,
  });
}));

/**
 * GET /api/shipping/track/:orderId
 * Public order tracking endpoint
 */
router.get('/track/:orderId', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: {
      timelineEvents: { orderBy: { createdAt: 'desc' } },
      items: { include: { product: { select: { name: true, images: true } } } },
      address: true,
    }
  });

  if (!order) {
    return res.status(404).json({ error: 'Order tracking details not found' });
  }

  res.json({
    tracking: {
      orderId: order.id,
      status: order.status,
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      events: order.timelineEvents,
      address: order.address,
    }
  });
}));

module.exports = router;
