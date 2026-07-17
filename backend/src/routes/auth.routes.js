const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { supabaseAdmin } = require('../lib/supabase');
const { prisma } = require('../lib/prisma');
const { redis } = require('../lib/redis');
const { sendPasswordResetEmail } = require('../lib/email');

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

// POST /api/auth/forgot-password - initiate password reset OTP & link
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user) {
    // Return success message anyway to prevent user enumeration
    return res.json({ message: 'If an account exists for this email, a password reset code has been sent.' });
  }

  // Generate 6-digit verification OTP and secure hex token
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString('hex');

  // Store in Redis with 15 minutes expiration (900 seconds)
  try {
    await redis.set(`reset_otp:${cleanEmail}`, JSON.stringify({ otp, token, userId: user.id }), { ex: 900 });
    await redis.set(`reset_token:${token}`, JSON.stringify({ email: cleanEmail, otp, userId: user.id }), { ex: 900 });
  } catch (err) {
    console.error('Redis error storing reset token:', err);
  }

  // Send email and output OTP to server console for testing
  await sendPasswordResetEmail(user, { token, otp });

  res.json({ message: 'If an account exists for this email, a password reset code has been sent.' });
}));

// POST /api/auth/verify-reset-otp - verify 6-digit OTP
router.post('/verify-reset-otp', asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const rawData = await redis.get(`reset_otp:${cleanEmail}`);
  if (!rawData) {
    return res.status(400).json({ error: 'Verification code has expired or is invalid. Please request a new one.' });
  }

  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  if (data.otp !== String(otp).trim()) {
    return res.status(400).json({ error: 'Invalid verification code.' });
  }

  res.json({ valid: true, token: data.token, message: 'Code verified successfully.' });
}));

// POST /api/auth/reset-password - execute password reset
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { email, token, otp, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  let targetEmail = email ? email.toLowerCase().trim() : null;
  let resetData = null;

  if (token) {
    const raw = await redis.get(`reset_token:${token}`);
    if (raw) resetData = typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  if (!resetData && targetEmail && otp) {
    const raw = await redis.get(`reset_otp:${targetEmail}`);
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed.otp === String(otp).trim()) {
        resetData = parsed;
      }
    }
  }

  if (!resetData) {
    return res.status(400).json({ error: 'Password reset link or verification code has expired. Please request a new one.' });
  }

  targetEmail = resetData.email;

  // Update password in Supabase Auth via Admin SDK
  try {
    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) throw listErr;

    const supabaseUser = users?.find(u => u.email?.toLowerCase() === targetEmail);
    if (!supabaseUser) {
      return res.status(404).json({ error: 'User authentication profile not found.' });
    }

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
      password: newPassword
    });

    if (updateErr) throw updateErr;

    // Clean up recovery tokens
    await redis.del(`reset_otp:${targetEmail}`);
    if (resetData.token) await redis.del(`reset_token:${resetData.token}`);

    res.json({ success: true, message: 'Password has been reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Password reset update error:', error);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
}));

// POST /api/auth/google - sync Google login profile with DB
router.post('/google', asyncHandler(async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid Google authentication token' });
  }

  let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        avatarUrl: user.user_metadata?.avatar_url || null,
      }
    });
  } else if (!dbUser.avatarUrl && user.user_metadata?.avatar_url) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { avatarUrl: user.user_metadata.avatar_url }
    });
  }

  res.json({ user });
}));

module.exports = router;
