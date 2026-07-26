const crypto = require('crypto');
const { redis } = require('../lib/redis');

/**
 * Idempotency middleware for POST/PUT endpoints.
 * Prevents duplicate database mutations or double charges on retries.
 * @param {number} lockTtlSeconds - Lock duration in seconds (default 60s)
 */
const idempotencyMiddleware = (lockTtlSeconds = 60) => async (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const rawKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  let idempotencyKey;

  if (rawKey) {
    idempotencyKey = `idempotency:${String(rawKey).trim()}`;
  } else {
    // Generate key based on user/IP + route + stringified body
    const bodyHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex');
    const userIdentifier = req.user?.id || req.ip || 'anonymous';
    idempotencyKey = `idempotency:${userIdentifier}:${req.originalUrl}:${bodyHash}`;
  }

  try {
    const existing = await redis.get(idempotencyKey);
    if (existing) {
      const parsed = typeof existing === 'string' ? JSON.parse(existing) : existing;
      res.setHeader('X-Idempotency-Status', 'CACHED');
      return res.status(parsed.statusCode || 200).json(parsed.body);
    }
  } catch (err) {
    console.error('[Idempotency Middleware] Redis read error:', err.message);
  }

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const payloadToCache = {
          statusCode: res.statusCode,
          body,
          cachedAt: new Date().toISOString(),
        };
        redis.set(idempotencyKey, JSON.stringify(payloadToCache), { ex: lockTtlSeconds }).catch((err) =>
          console.error('[Idempotency Middleware] Redis set error:', err.message)
        );
      } catch (err) {
        console.error('[Idempotency Middleware] Stringify error:', err.message);
      }
    }
    res.setHeader('X-Idempotency-Status', 'EXECUTED');
    return originalJson(body);
  };

  next();
};

module.exports = { idempotencyMiddleware };
