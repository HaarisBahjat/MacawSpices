const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { supabaseAdmin } = require('../lib/supabase');
const { prisma } = require('../lib/prisma');

// GET /api/auth/me - get current user profile
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      addresses: true,
      _count: { select: { orders: true, savedBlends: true } }
    }
  });
  res.json({ user });
}));

// PUT /api/auth/profile - update profile
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, phone }
  });
  res.json({ user });
}));

// POST /api/auth/addresses - add address
router.post('/addresses', authenticate, asyncHandler(async (req, res) => {
  const { label, line1, line2, city, state, pincode, isDefault } = req.body;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.create({
    data: { userId: req.user.id, label, line1, line2, city, state, pincode, isDefault: isDefault || false }
  });
  res.status(201).json({ address });
}));

// DELETE /api/auth/addresses/:id - delete address
router.delete('/addresses/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.address.deleteMany({
    where: { id: req.params.id, userId: req.user.id }
  });
  res.json({ message: 'Address deleted' });
}));

module.exports = router;
