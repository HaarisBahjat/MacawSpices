const express = require('express');
const router = express.Router();
const { optionalAuth, authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { prisma } = require('../lib/prisma');

// GET /api/products - list products with filters
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    category,
    search,
    featured,
    page = 1,
    limit = 12,
    sortBy = 'createdAt',
    order = 'desc',
    minPrice,
    maxPrice,
  } = req.query;

  const where = { isActive: true };

  if (category) {
    where.category = { slug: category };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { flavorProfile: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (featured === 'true') {
    where.featured = true;
  }
  if (minPrice || maxPrice) {
    where.pricePerGram = {};
    if (minPrice) where.pricePerGram.gte = parseFloat(minPrice);
    if (maxPrice) where.pricePerGram.lte = parseFloat(maxPrice);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { [sortBy]: order },
      skip,
      take: parseInt(limit),
    }),
    prisma.product.count({ where }),
  ]);

  const productsWithRating = products.map((p) => ({
    ...p,
    avgRating: p.reviews.length
      ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length
      : 0,
  }));

  res.json({
    products: productsWithRating,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  });
}));

// GET /api/products/categories - list all categories
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } }
  });
  res.json({ categories });
}));

// GET /api/products/:slug - single product
router.get('/:slug', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      reviews: {
        include: { user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!product) return res.status(404).json({ error: 'Product not found' });

  const avgRating = product.reviews.length
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0;

  res.json({ product: { ...product, avgRating } });
}));

// POST /api/products/:id/reviews - add or update product review
router.post('/:id/reviews', authenticate, asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  const parsedRating = parseInt(rating);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const review = await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId,
      },
    },
    update: {
      rating: parsedRating,
      comment: comment ? String(comment).trim() : null,
    },
    create: {
      userId: req.user.id,
      productId,
      rating: parsedRating,
      comment: comment ? String(comment).trim() : null,
    },
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
  });

  res.status(201).json({ review, message: 'Review submitted successfully' });
}));

module.exports = router;
