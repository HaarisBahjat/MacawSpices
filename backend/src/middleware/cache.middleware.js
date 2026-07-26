const { redis } = require('../lib/redis');

/**
 * Cache middleware for Express routes using Upstash Redis.
 * @param {number} durationSeconds - Cache expiration time in seconds (default 300 = 5m)
 */
const cacheMiddleware = (durationSeconds = 300) => async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = `cache:${req.originalUrl || req.url}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      res.setHeader('X-Cache-Status', 'HIT');
      return res.json(parsed);
    }
  } catch (err) {
    console.error('[Redis Cache] Get error:', err.message);
  }

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode === 200 && body) {
      try {
        redis.set(cacheKey, JSON.stringify(body), { ex: durationSeconds }).catch((err) =>
          console.error('[Redis Cache] Set error:', err.message)
        );
      } catch (err) {
        console.error('[Redis Cache] JSON stringify error:', err.message);
      }
    }
    res.setHeader('X-Cache-Status', 'MISS');
    return originalJson(body);
  };

  next();
};

/**
 * Clears cached responses matching a prefix or pattern.
 * @param {string} pattern - Prefix pattern to match
 */
const clearCacheByPattern = async (pattern = 'cache:*') => {
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Redis Cache] Flushed ${keys.length} keys matching ${pattern}`);
    }
  } catch (err) {
    console.error('[Redis Cache] Clear error:', err.message);
  }
};

module.exports = { cacheMiddleware, clearCacheByPattern };
