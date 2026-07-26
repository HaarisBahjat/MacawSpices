const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const blendRoutes = require('./routes/blend.routes');
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const shippingRoutes = require('./routes/shipping.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { cacheMiddleware } = require('./middleware/cache.middleware');

const app = express();

// Payload Compression (Gzip / Brotli)
app.use(compression());

// Security
app.use(helmet());

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://macawspices.vercel.app',
  'https://www.macawspices.com',
  'https://macawspices.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.macawspices.com') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Body parsing (skip for webhook route which needs raw body)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes with Redis catalog response caching (300s TTL)
app.use('/api/auth', authRoutes);
app.use('/api/products', cacheMiddleware(300), productRoutes);
app.use('/api/blends', cacheMiddleware(300), blendRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shipping', shippingRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
