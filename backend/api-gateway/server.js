// Full API Gateway implementation
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { createProxyMiddleware } from 'http-proxy-middleware';
import mongoose from 'mongoose';

dotenv.config();


// Log critical environment variables for debugging
console.log('🔧 ENV LOGGING:');
console.log('  API_GATEWAY_PORT =', process.env.API_GATEWAY_PORT);
console.log('  AUTH_SERVICE_URL =', process.env.AUTH_SERVICE_URL);
console.log('  ORDER_SERVICE_URL =', process.env.ORDER_SERVICE_URL);
console.log('  JWT_SECRET (first 8 chars) =', process.env.JWT_SECRET?.slice(0, 8) + '...');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 4000;

// Redis client for rate limiting / caching
let redisClient;
(async () => {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.warn('⚠️ Redis not available, rate limiting will use memory store');
  }
})();

// Middleware
// CORS - Allow Vercel frontend and handle preflight requests FIRST
const allowedOrigins = [
  'https://smarteats25.vercel.app',
  'https://smarteats25-customer-app.vercel.app',
  'https://smarteats-customer-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Handle preflight OPTIONS requests
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for demo
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Helmet security headers (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Trust proxy for Render deployment (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
    });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisClient?.isOpen ? 'connected' : 'disconnected',
    },
  });
});

// Service URLs from env
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:4002',
  restaurant: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:4003',
  delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:4004',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4005',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006',
};

console.log('DEBUG: Services config:', services);

// Proxy configuration shared options
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'debug',
  secure: true,
  timeout: 60000, // 60 second timeout for cold start
  proxyTimeout: 60000,
  onProxyReq: (proxyReq, req, res) => {
    // Add user headers if authenticated
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }

    // Fix: Re-stream body that was consumed by express.json()
    // This is required because body-parser consumes the stream
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Service unavailable', message: 'The requested service is currently unavailable' });
  },
};

// Proxy routes
app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  pathRewrite: { '^/api/auth': '' },
  ...proxyOptions,
}));

app.use('/api/restaurants', optionalAuth, createProxyMiddleware({
  target: services.restaurant,
  pathRewrite: { '^/api/restaurants': '' },
  ...proxyOptions,
}));

app.use('/api/orders', authenticateToken, createProxyMiddleware({
  target: services.order,
  pathRewrite: { '^/api/orders': '' },
  ...proxyOptions,
}));

app.use('/api/delivery', authenticateToken, createProxyMiddleware({
  target: services.delivery,
  pathRewrite: { '^/api/delivery': '' },
  ...proxyOptions,
}));

app.use('/api/payments', authenticateToken, createProxyMiddleware({
  target: services.payment,
  pathRewrite: { '^/api/payments': '' },
  ...proxyOptions,
}));

app.use('/api/notifications', authenticateToken, createProxyMiddleware({
  target: services.notification,
  pathRewrite: { '^/api/notifications': '' },
  ...proxyOptions,
}));

// ==============================================
// DIRECT MONGODB HANDLERS (for entities without dedicated services)
// ==============================================

// Connect to MongoDB if not already connected
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('✅ API Gateway connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
}

// Menu Items endpoint
app.get('/api/menuitems', async (req, res) => {
  try {
    const { restaurant_id, _limit = 100 } = req.query;
    const query = restaurant_id ? { restaurant_id } : {};
    const items = await mongoose.connection.db.collection('menuitems').find(query).limit(parseInt(_limit)).toArray();
    // Transform _id to id for frontend compatibility
    const transformedItems = items.map(item => ({ ...item, id: item._id.toString() }));
    res.json({ data: transformedItems });
  } catch (error) {
    console.error('Menu items error:', error);
    res.json({ data: [] });
  }
});

// Carts endpoint
app.get('/api/carts', optionalAuth, async (req, res) => {
  try {
    const { customer_email, _limit = 100 } = req.query;
    const query = customer_email ? { customer_email } : {};
    const carts = await mongoose.connection.db.collection('carts').find(query).limit(parseInt(_limit)).toArray();
    const transformedCarts = carts.map(cart => ({ ...cart, id: cart._id.toString() }));
    res.json({ data: transformedCarts });
  } catch (error) {
    console.error('Carts error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/carts', authenticateToken, async (req, res) => {
  try {
    const cartData = { ...req.body, created_date: new Date(), updated_date: new Date() };
    const result = await mongoose.connection.db.collection('carts').insertOne(cartData);
    res.json({ data: { ...cartData, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Create cart error:', error);
    res.status(500).json({ error: 'Failed to create cart' });
  }
});

app.patch('/api/carts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_date: new Date() };
    await mongoose.connection.db.collection('carts').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    res.json({ data: { id, ...updateData } });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.delete('/api/carts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('carts').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete cart error:', error);
    res.status(500).json({ error: 'Failed to delete cart' });
  }
});

// Reviews endpoint
app.get('/api/reviews', async (req, res) => {
  try {
    const { restaurant_id, _limit = 100 } = req.query;
    const query = restaurant_id ? { restaurant_id } : {};
    const reviews = await mongoose.connection.db.collection('reviews').find(query).limit(parseInt(_limit)).toArray();
    const transformedReviews = reviews.map(review => ({ ...review, id: review._id.toString() }));
    res.json({ data: transformedReviews });
  } catch (error) {
    console.error('Reviews error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const reviewData = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('reviews').insertOne(reviewData);
    res.json({ data: { ...reviewData, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔗 Service endpoints:');
  Object.entries(services).forEach(([name, url]) => console.log(`   - ${name}: ${url}`));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (redisClient) await redisClient.quit();
  process.exit(0);
});
