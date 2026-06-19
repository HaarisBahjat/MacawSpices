const { supabaseAdmin } = require('../lib/supabase');
const { prisma } = require('../lib/prisma');

/**
 * Verifies Supabase JWT and attaches user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch or create user in our DB
    let dbUser = await prisma.user.findUnique({ where: { email: user.email } });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          avatarUrl: user.user_metadata?.avatar_url || null,
        }
      });
    }

    req.user = dbUser;
    req.supabaseUser = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Requires user to be authenticated AND be an admin
 */
const requireAdmin = async (req, res, next) => {
  await authenticate(req, res, async () => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

/**
 * Optional auth - attaches user if token present, but doesnt block
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      req.user = dbUser;
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, requireAdmin, optionalAuth };
