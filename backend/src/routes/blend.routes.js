const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { prisma } = require('../lib/prisma');

// GET /api/blends - list all blend templates
router.get('/', asyncHandler(async (req, res) => {
  const blends = await prisma.blendTemplate.findMany({
    where: { isActive: true },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, pricePerGram: true, images: true } }
        }
      }
    }
  });

  // Calculate price for each blend
  const blendsWithPrice = blends.map((blend) => ({
    ...blend,
    totalWeight: blend.items.reduce((acc, i) => acc + i.weightGrams, 0),
    estimatedPrice: blend.items.reduce(
      (acc, i) => acc + i.weightGrams * i.product.pricePerGram,
      0
    ),
  }));

  res.json({ blends: blendsWithPrice });
}));

// GET /api/blends/:id - single blend template
router.get('/:id', asyncHandler(async (req, res) => {
  const blend = await prisma.blendTemplate.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, slug: true, pricePerGram: true,
              images: true, flavorProfile: true, origin: true
            }
          }
        }
      }
    }
  });
  if (!blend) return res.status(404).json({ error: 'Blend not found' });

  const totalWeight = blend.items.reduce((acc, i) => acc + i.weightGrams, 0);
  const estimatedPrice = blend.items.reduce(
    (acc, i) => acc + i.weightGrams * i.product.pricePerGram,
    0
  );

  res.json({ blend: { ...blend, totalWeight, estimatedPrice } });
}));

// POST /api/blends/price-estimate - calculate blend price
router.post('/price-estimate', asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ productId, weightGrams }]
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'items array is required' });
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, name: true, pricePerGram: true }
  });

  const breakdown = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;
    return {
      productId: item.productId,
      name: product.name,
      weightGrams: item.weightGrams,
      unitPrice: product.pricePerGram,
      subtotal: item.weightGrams * product.pricePerGram,
    };
  }).filter(Boolean);

  const totalWeight = breakdown.reduce((acc, i) => acc + i.weightGrams, 0);
  const totalPrice = breakdown.reduce((acc, i) => acc + i.subtotal, 0);

  res.json({ breakdown, totalWeight, totalPrice });
}));

// POST /api/blends/save - save a blend to user's account
router.post('/save', authenticate, asyncHandler(async (req, res) => {
  const { blendTemplateId, customName } = req.body;
  const saved = await prisma.savedBlend.create({
    data: { userId: req.user.id, blendTemplateId, customName }
  });
  res.status(201).json({ saved });
}));

// GET /api/blends/mine - user's saved blends
router.get('/user/mine', authenticate, asyncHandler(async (req, res) => {
  const saved = await prisma.savedBlend.findMany({
    where: { userId: req.user.id },
    include: {
      blendTemplate: {
        include: {
          items: {
            include: { product: { select: { id: true, name: true, pricePerGram: true, images: true } } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ savedBlends: saved });
}));

// DELETE /api/blends/save/:id - unsave a blend
router.delete('/save/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.savedBlend.deleteMany({
    where: { id: req.params.id, userId: req.user.id }
  });
  res.json({ message: 'Blend removed from saved' });
}));

module.exports = router;
