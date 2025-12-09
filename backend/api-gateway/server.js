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

// ==============================================
// CONNECT TO MONGODB FIRST (before any handlers)
// ==============================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://SmartEatsTeam:Devmatrix123@smarteats25.lypxox6.mongodb.net/smarteats?retryWrites=true&w=majority&appName=smarteats25';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('✅ API Gateway connected to MongoDB');

  // Auto-create Flashman driver if not exists
  try {
    const db = mongoose.connection.db;
    const existingDriver = await db.collection('drivers').findOne({ email: 'flashman@smarteats.com' });
    if (!existingDriver) {
      // Create Flashman user
      const hashedPassword = await bcrypt.hash('flashman123', 10);
      await db.collection('users').insertOne({
        email: 'flashman@smarteats.com',
        password: hashedPassword,
        role: 'driver',
        profile: { firstName: 'Flash', lastName: 'Man' },
        isEmailVerified: true,
        isActive: true,
        approvalStatus: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create Flashman driver record
      await db.collection('drivers').insertOne({
        email: 'flashman@smarteats.com',
        name: 'Flashman',
        phone: '+91 99999 88888',
        vehicle_type: 'Motorcycle',
        vehicle_number: 'KA-01-FL-0001',
        license_number: 'DL-FLASH-2024',
        status: 'approved',
        is_online: true,
        is_available: true,
        current_latitude: 12.9716,
        current_longitude: 77.5946,
        total_deliveries: 0,
        total_earnings: 0,
        average_rating: 0,
        created_date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Flashman driver created: flashman@smarteats.com / flashman123');
    }
  } catch (err) {
    console.log('Flashman setup skipped:', err.message);
  }
})
  .catch(err => console.error('❌ MongoDB connection error:', err));

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Trust proxy for Render deployment (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting - very high limit for real-time app
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100000, // Very high for real-time features
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
    version: '2.0.3', // Debug logging for order POST
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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

// ==============================================
// RESTAURANT HANDLERS (Direct MongoDB for better control)
// ==============================================

// GET all restaurants
app.get('/api/restaurants', optionalAuth, async (req, res) => {
  try {
    const { owner_email, status, is_featured, id, _limit = 100 } = req.query;
    let query = {};

    // Filter by specific ID if provided
    if (id) {
      try {
        query._id = new mongoose.Types.ObjectId(id);
      } catch (e) {
        // If not a valid ObjectId, return empty
        res.json({ data: [] });
        return;
      }
    }

    // Default to approved/active status for customers
    if (status) {
      query.status = status;
    } else if (!owner_email && !id) {
      query.status = { $in: ['approved', 'active'] };
    }

    if (owner_email) {
      query.owner_email = owner_email;
    }

    if (is_featured === 'true') {
      query.is_featured = true;
    }

    const restaurants = await mongoose.connection.db.collection('restaurants')
      .find(query).limit(parseInt(_limit)).toArray();

    // Transform _id to id for frontend
    const transformed = restaurants.map(r => ({ ...r, id: r._id.toString() }));
    res.json({ data: transformed, restaurants: transformed });
  } catch (error) {
    console.error('Restaurants error:', error);
    res.json({ data: [], restaurants: [] });
  }
});

// GET single restaurant by ID
app.get('/api/restaurants/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let restaurant;

    // Try ObjectId first, then string ID
    try {
      restaurant = await mongoose.connection.db.collection('restaurants')
        .findOne({ _id: new mongoose.Types.ObjectId(id) });
    } catch (e) {
      restaurant = await mongoose.connection.db.collection('restaurants')
        .findOne({ id: id });
    }

    if (restaurant) {
      res.json({ ...restaurant, id: restaurant._id.toString() });
    } else {
      res.status(404).json({ error: 'Restaurant not found' });
    }
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Failed to get restaurant' });
  }
});

// PATCH restaurant (for status updates, open/close toggle)
app.patch('/api/restaurants/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_date: new Date() };

    await mongoose.connection.db.collection('restaurants').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );

    const updated = await mongoose.connection.db.collection('restaurants')
      .findOne({ _id: new mongoose.Types.ObjectId(id) });

    res.json({ data: { ...updated, id: updated._id.toString() } });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// POST create restaurant
app.post('/api/restaurants', authenticateToken, async (req, res) => {
  try {
    const restaurantData = {
      ...req.body,
      status: 'pending',
      created_date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongoose.connection.db.collection('restaurants').insertOne(restaurantData);
    res.json({ data: { ...restaurantData, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// NOTE: Order endpoints moved below carts section - using optionalAuth for better compatibility

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

// ==============================================
// NOTIFICATION HANDLERS (Direct MongoDB)
// ==============================================

// GET notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { user_email, _limit = 50 } = req.query;
    const query = user_email ? { user_email } : {};

    const notifications = await mongoose.connection.db.collection('notifications')
      .find(query).sort({ created_date: -1 }).limit(parseInt(_limit)).toArray();

    const transformed = notifications.map(n => ({ ...n, id: n._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Notifications error:', error);
    res.json({ data: [] });
  }
});

// POST create notification
app.post('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notificationData = {
      ...req.body,
      is_read: false,
      created_date: new Date(),
      createdAt: new Date()
    };

    const result = await mongoose.connection.db.collection('notifications').insertOne(notificationData);
    res.json({ data: { ...notificationData, id: result.insertedId.toString() } });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// PATCH update notification (mark as read)
app.patch('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('notifications').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ==============================================
// DIRECT MONGODB HANDLERS (for entities without dedicated services)
// ==============================================

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

// ==============================================
// ORDERS ENDPOINTS (Direct MongoDB - order-service not deployed on Render)
// ==============================================
app.get('/api/orders', optionalAuth, async (req, res) => {
  try {
    const { customer_email, restaurant_id, driver_email, order_status, id, _sort = '-created_date', _limit = 100 } = req.query;
    let query = {};

    if (id) {
      try { query._id = new mongoose.Types.ObjectId(id); } catch (e) { return res.json({ data: [] }); }
    }
    if (customer_email) query.customer_email = customer_email;
    if (restaurant_id) query.restaurant_id = restaurant_id;
    if (driver_email) query.driver_email = driver_email;
    if (order_status) query.order_status = order_status;

    const sortField = _sort.startsWith('-') ? _sort.substring(1) : _sort;
    const sortOrder = _sort.startsWith('-') ? -1 : 1;

    const orders = await mongoose.connection.db.collection('orders')
      .find(query)
      .sort({ [sortField]: sortOrder })
      .limit(parseInt(_limit))
      .toArray();

    const transformed = orders.map(o => ({ ...o, id: o._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Orders GET error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/orders', async (req, res) => {
  console.log('=== ORDER POST STARTED ===');
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Customer:', req.body?.customer_email);

  try {
    // Check if MongoDB is connected
    if (!mongoose.connection.db) {
      console.error('MongoDB not connected!');
      return res.status(503).json({ error: 'Database not available, please try again' });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Empty request body!');
      return res.status(400).json({ error: 'Empty request body' });
    }

    console.log('Creating order for:', req.body.customer_email);

    // Generate order number if not provided
    const orderNumber = req.body.order_number || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const orderData = {
      ...req.body,
      order_number: orderNumber,
      created_date: new Date(),
      updated_date: new Date(),
      order_status: req.body.order_status || 'placed',
      payment_status: req.body.payment_status || 'pending'
    };

    console.log('Inserting order with number:', orderNumber);
    const result = await mongoose.connection.db.collection('orders').insertOne(orderData);
    console.log('✅ Order created:', orderNumber, result.insertedId.toString());

    res.json({ data: { ...orderData, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('=== ORDER POST ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

app.patch('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_date: new Date() };
    await mongoose.connection.db.collection('orders').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    const updated = await mongoose.connection.db.collection('orders').findOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ data: { ...updated, id: updated._id.toString() } });
  } catch (error) {
    console.error('Orders PATCH error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('orders').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Orders DELETE error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ==============================================
// NOTIFICATIONS ENDPOINTS
// ==============================================
app.get('/api/notifications', async (req, res) => {
  try {
    const { user_email, _limit = 50 } = req.query;
    const query = user_email ? { user_email } : {};
    const notifications = await mongoose.connection.db.collection('notifications')
      .find(query).sort({ created_date: -1 }).limit(parseInt(_limit)).toArray();
    const transformed = notifications.map(n => ({ ...n, id: n._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Notifications GET error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const notifData = { ...req.body, created_date: new Date(), is_read: false };
    const result = await mongoose.connection.db.collection('notifications').insertOne(notifData);
    res.json({ data: { ...notifData, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Notifications POST error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// ==============================================
// LOYALTY POINTS ENDPOINTS
// ==============================================
app.get('/api/loyaltypoints', async (req, res) => {
  try {
    const { user_email, _limit = 100 } = req.query;
    const query = user_email ? { user_email } : {};
    const points = await mongoose.connection.db.collection('loyaltypoints')
      .find(query).limit(parseInt(_limit)).toArray();
    const transformed = points.map(p => ({ ...p, id: p._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('LoyaltyPoints GET error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/loyaltypoints', async (req, res) => {
  try {
    const data = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('loyaltypoints').insertOne(data);
    res.json({ data: { ...data, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('LoyaltyPoints POST error:', error);
    res.status(500).json({ error: 'Failed to create loyalty points' });
  }
});

app.patch('/api/loyaltypoints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_date: new Date() };
    await mongoose.connection.db.collection('loyaltypoints').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    const updated = await mongoose.connection.db.collection('loyaltypoints').findOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ data: { ...updated, id: updated._id.toString() } });
  } catch (error) {
    console.error('LoyaltyPoints PATCH error:', error);
    res.status(500).json({ error: 'Failed to update loyalty points' });
  }
});

// ==============================================
// POINTS TRANSACTIONS ENDPOINTS
// ==============================================
app.get('/api/pointstransactions', async (req, res) => {
  try {
    const { user_email, _limit = 100 } = req.query;
    const query = user_email ? { user_email } : {};
    const transactions = await mongoose.connection.db.collection('pointstransactions')
      .find(query).sort({ created_date: -1 }).limit(parseInt(_limit)).toArray();
    const transformed = transactions.map(t => ({ ...t, id: t._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('PointsTransactions GET error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/pointstransactions', async (req, res) => {
  try {
    const data = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('pointstransactions').insertOne(data);
    res.json({ data: { ...data, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('PointsTransactions POST error:', error);
    res.status(500).json({ error: 'Failed to create points transaction' });
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

// ==============================================
// FAVORITES ENDPOINTS (Fix for 500 error)
// ==============================================
app.get('/api/favorites', optionalAuth, async (req, res) => {
  try {
    const { user_email, _limit = 100 } = req.query;
    const query = user_email ? { user_email } : {};
    const favorites = await mongoose.connection.db.collection('favorites')
      .find(query).limit(parseInt(_limit)).toArray();
    const transformed = favorites.map(f => ({ ...f, id: f._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Favorites GET error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const favoriteData = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('favorites').insertOne(favoriteData);
    res.json({ data: { ...favoriteData, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Favorites POST error:', error);
    res.status(500).json({ error: 'Failed to create favorite' });
  }
});

app.delete('/api/favorites/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('favorites').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Favorites DELETE error:', error);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
});

// ==============================================
// ADDRESS ENDPOINTS
// ==============================================
app.get('/api/addresss', authenticateToken, async (req, res) => {
  try {
    const { user_email, _limit = 50 } = req.query;
    const query = user_email ? { user_email } : {};
    const addresses = await mongoose.connection.db.collection('addresses')
      .find(query).limit(parseInt(_limit)).toArray();
    const transformed = addresses.map(a => ({ ...a, id: a._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Addresses error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/addresss', authenticateToken, async (req, res) => {
  try {
    const addressData = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('addresses').insertOne(addressData);
    res.json({ data: { ...addressData, id: result.insertedId.toString() } });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

app.patch('/api/addresss/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('addresses').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { ...req.body, updated_date: new Date() } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

app.delete('/api/addresss/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('addresses').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// ==============================================
// LOYALTY POINTS ENDPOINTS
// ==============================================
app.get('/api/loyaltypointss', authenticateToken, async (req, res) => {
  try {
    const { user_email, _limit = 50 } = req.query;
    const query = user_email ? { user_email } : {};
    const points = await mongoose.connection.db.collection('loyaltypoints')
      .find(query).limit(parseInt(_limit)).toArray();
    const transformed = points.map(p => ({ ...p, id: p._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Loyalty points error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/loyaltypointss', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('loyaltypoints').insertOne(data);
    res.json({ data: { ...data, id: result.insertedId.toString() } });
  } catch (error) {
    console.error('Create loyalty points error:', error);
    res.status(500).json({ error: 'Failed to create loyalty points' });
  }
});

app.patch('/api/loyaltypointss/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('loyaltypoints').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: req.body }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Update loyalty points error:', error);
    res.status(500).json({ error: 'Failed to update loyalty points' });
  }
});

// ==============================================
// POINTS TRANSACTION ENDPOINTS
// ==============================================
app.get('/api/pointstransactions', authenticateToken, async (req, res) => {
  try {
    const { user_email, _limit = 50 } = req.query;
    const query = user_email ? { user_email } : {};
    const txns = await mongoose.connection.db.collection('pointstransactions')
      .find(query).sort({ created_date: -1 }).limit(parseInt(_limit)).toArray();
    const transformed = txns.map(t => ({ ...t, id: t._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Points transactions error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/pointstransactions', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('pointstransactions').insertOne(data);
    res.json({ data: { ...data, id: result.insertedId.toString() } });
  } catch (error) {
    console.error('Create points transaction error:', error);
    res.status(500).json({ error: 'Failed to create points transaction' });
  }
});

// ==============================================
// FAVORITES ENDPOINTS
// ==============================================
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { user_email, _limit = 50 } = req.query;
    const query = user_email ? { user_email } : {};
    const favorites = await mongoose.connection.db.collection('favorites')
      .find(query).limit(parseInt(_limit)).toArray();
    const transformed = favorites.map(f => ({ ...f, id: f._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Favorites error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('favorites').insertOne(data);
    res.json({ data: { ...data, id: result.insertedId.toString() } });
  } catch (error) {
    console.error('Create favorite error:', error);
    res.status(500).json({ error: 'Failed to create favorite' });
  }
});

app.delete('/api/favorites/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('favorites').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
});

// Delete favorite by restaurant_id and user_email
app.delete('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { restaurant_id, user_email } = req.query;
    await mongoose.connection.db.collection('favorites').deleteOne({ restaurant_id, user_email });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
});

// ==============================================
// SEARCH ENDPOINT (Restaurants + Menu Items)
// ==============================================
app.get('/api/search', optionalAuth, async (req, res) => {
  try {
    const { q, _limit = 50 } = req.query;
    if (!q || q.length < 2) {
      res.json({ restaurants: [], menuItems: [] });
      return;
    }

    const searchRegex = { $regex: q, $options: 'i' };

    // Search restaurants
    const restaurants = await mongoose.connection.db.collection('restaurants')
      .find({
        status: { $in: ['approved', 'active'] },
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { cuisine_type: searchRegex }
        ]
      }).limit(parseInt(_limit)).toArray();

    // Search menu items
    const menuItems = await mongoose.connection.db.collection('menuitems')
      .find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ]
      }).limit(parseInt(_limit)).toArray();

    res.json({
      restaurants: restaurants.map(r => ({ ...r, id: r._id.toString() })),
      menuItems: menuItems.map(m => ({ ...m, id: m._id.toString() }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.json({ restaurants: [], menuItems: [] });
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
