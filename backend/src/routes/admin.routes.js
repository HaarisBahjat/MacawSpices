const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { prisma } = require('../lib/prisma');
const { sendShippingNotification } = require('../lib/email');

// All admin routes require admin role
router.use(requireAdmin);

// =================== PRODUCTS ===================

// GET /api/admin/products
router.get('/products', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true, _count: { select: { reviews: true, orderItems: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ products });
}));

// POST /api/admin/products
router.post('/products', asyncHandler(async (req, res) => {
  const { name, slug, description, categoryId, pricePerGram, stock, minOrderGram, images, featured, flavorProfile, origin } = req.body;
  const product = await prisma.product.create({
    data: { name, slug, description, categoryId, pricePerGram, stock, minOrderGram, images: images || [], featured: featured || false, flavorProfile, origin }
  });
  res.status(201).json({ product });
}));

// PUT /api/admin/products/:id
router.put('/products/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json({ product });
}));

// DELETE /api/admin/products/:id
router.delete('/products/:id', asyncHandler(async (req, res) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false }
  });
  res.json({ message: 'Product deactivated' });
}));

// =================== CATEGORIES ===================

// POST /api/admin/categories
router.post('/categories', asyncHandler(async (req, res) => {
  const { name, slug, imageUrl } = req.body;
  const category = await prisma.category.create({ data: { name, slug, imageUrl } });
  res.status(201).json({ category });
}));

// =================== BLEND TEMPLATES ===================

// POST /api/admin/blends
router.post('/blends', asyncHandler(async (req, res) => {
  const { name, slug, description, imageUrl, tags, items } = req.body;
  const blend = await prisma.blendTemplate.create({
    data: {
      name, slug, description, imageUrl, tags: tags || [],
      items: { create: items.map((i) => ({ productId: i.productId, weightGrams: i.weightGrams })) }
    },
    include: { items: { include: { product: true } } }
  });
  res.status(201).json({ blend });
}));

// PUT /api/admin/blends/:id
router.put('/blends/:id', asyncHandler(async (req, res) => {
  const { name, description, imageUrl, tags, isActive } = req.body;
  const blend = await prisma.blendTemplate.update({
    where: { id: req.params.id },
    data: { name, description, imageUrl, tags, isActive }
  });
  res.json({ blend });
}));

// =================== ORDERS ===================

// GET /api/admin/orders
router.get('/orders', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = status ? { status } : {};
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        address: true,
        items: { include: { product: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.order.count({ where })
  ]);
  res.json({ orders, total, page: parseInt(page) });
}));

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', asyncHandler(async (req, res) => {
  const { status, trackingNumber, courierName } = req.body;

  const updateData = { status };

  // Auto-set timestamps when status changes
  if (status === 'SHIPPED') {
    updateData.shippedAt = new Date();
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (courierName) updateData.courierName = courierName;
  }
  if (status === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      user: { select: { name: true, email: true } },
      address: true,
      items: { include: { product: { select: { name: true } } } }
    }
  });

  // Send shipping notification email (non-fatal)
  if (status === 'SHIPPED') {
    sendShippingNotification(order).catch((err) =>
      console.error('[Admin] sendShippingNotification failed:', err.message)
    );
  }

  res.json({ order });
}));

// =================== ANALYTICS ===================

// GET /api/admin/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const [totalOrders, totalRevenue, totalProducts, totalUsers, recentOrders] = await Promise.all([
    prisma.order.count({ where: { isPaid: true } }),
    prisma.order.aggregate({ where: { isPaid: true }, _sum: { totalAmount: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    })
  ]);

  res.json({
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    totalProducts,
    totalUsers,
    recentOrders
  });
}));

module.exports = router;
