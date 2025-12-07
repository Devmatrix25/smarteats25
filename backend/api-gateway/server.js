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
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Role', req.user.role);
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
