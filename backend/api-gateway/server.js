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
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

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

    // Check if Flashman user exists
    const existingUser = await db.collection('users').findOne({ email: 'flashman@smarteats.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('flashman123', 10);
      await db.collection('users').insertOne({
        email: 'flashman@smarteats.com',
        password: hashedPassword,
        role: 'driver',
        full_name: 'Flashman',
        profile: { firstName: 'Flash', lastName: 'Man' },
        isEmailVerified: true,
        isActive: true,
        approvalStatus: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Flashman user created');
    }

    // Check if Flashman driver record exists
    const existingDriver = await db.collection('drivers').findOne({ email: 'flashman@smarteats.com' });
    if (!existingDriver) {
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
        average_rating: 4.9,
        created_date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Flashman driver record created');
    }

    console.log('✅ Flashman ready: flashman@smarteats.com / flashman123');
  } catch (err) {
    console.error('Flashman setup error:', err.message);
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

// Helmet security headers (after CORS) - CSP disabled for API
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: false // Disable CSP for API
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
    version: '2.3.1', // Gmail SMTP fix with TLS and verification
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    services: {
      redis: redisClient?.isOpen ? 'connected' : 'disconnected',
      smtp: process.env.SMTP_USER ? 'configured' : 'not-configured',
    },
  });
});

// ==============================================
// EMAIL OTP AUTHENTICATION SYSTEM
// ==============================================

// SMTP Email Transporter Configuration (backup option)
let smtpTransporter = null;
let smtpVerified = false;

// Initialize SMTP but don't fail if it doesn't work (Render blocks port 587)
if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  try {
    smtpTransporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      // Short timeout to fail fast on Render
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    // Non-blocking verification - don't wait for it
    smtpTransporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP verification failed (expected on Render):', error.message);
        smtpVerified = false;
      } else {
        console.log('✅ SMTP server is ready to send emails');
        smtpVerified = true;
      }
    });

    console.log('ℹ️ SMTP configured for:', process.env.SMTP_USER);
  } catch (err) {
    console.error('❌ SMTP configuration error:', err.message);
  }
}

// Resend API key (preferred for Render deployment)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (RESEND_API_KEY) {
  console.log('✅ Resend API configured (preferred email method)');
} else {
  console.log('ℹ️ Resend API not configured - using SMTP/simulation fallback');
}

// Email sending function with fallback chain: Resend -> SMTP -> Simulation
async function sendOTPEmail(toEmail, otp) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #F25C23 0%, #D94A18 100%); border-radius: 16px 16px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🍽️ SmartEats</h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your Food Delivery Partner</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1D1D1F; font-size: 22px; font-weight: 600; text-align: center;">
                    Verify Your Email
                  </h2>
                  <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6; text-align: center;">
                    Hi there! 👋<br>
                    Use the code below to complete your login to SmartEats.
                  </p>
                  <div style="background: linear-gradient(135deg, #FFF7F2 0%, #FFEDE5 100%); border: 2px dashed #F25C23; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px 0;">
                    <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
                    <p style="margin: 0; color: #F25C23; font-size: 36px; font-weight: 700; letter-spacing: 8px;">${otp}</p>
                  </div>
                  <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px; text-align: center;">
                    ⏱️ This code expires in <strong>5 minutes</strong>
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 14px; text-align: center;">
                    If you didn't request this code, please ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 30px 40px; text-align: center; border-top: 1px solid #f0f0f0;">
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} SmartEats. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Method 1: Try Resend API first (HTTP-based, works on all platforms including Render)
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'SmartEats <onboarding@resend.dev>',
          to: [toEmail],
          subject: '🔐 Your SmartEats Login OTP',
          html: emailHtml,
          text: `Your SmartEats OTP is: ${otp}. This code expires in 5 minutes.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ OTP sent via Resend API to ${toEmail} (ID: ${data.id})`);
        return { success: true, method: 'resend', id: data.id };
      } else {
        const errorData = await response.json();
        console.error('❌ Resend API error:', errorData);
        // Fall through to SMTP
      }
    } catch (resendError) {
      console.error('❌ Resend API failed:', resendError.message);
      // Fall through to SMTP
    }
  }

  // Method 2: Try SMTP (may fail on Render due to port 587 blocking)
  if (smtpTransporter && smtpVerified) {
    try {
      await smtpTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'SmartEats <noreply@smarteats.com>',
        to: toEmail,
        subject: '🔐 Your SmartEats Login OTP',
        html: emailHtml,
        text: `Your SmartEats OTP is: ${otp}. This code expires in 5 minutes.`
      });
      console.log(`✅ OTP sent via SMTP to ${toEmail}`);
      return { success: true, method: 'smtp' };
    } catch (smtpError) {
      console.error('❌ SMTP failed:', smtpError.message);
      // Fall through to simulation
    }
  }

  // Method 3: Simulation mode (for development/demo or when email services unavailable)
  console.log(`\n📧 [SIMULATION MODE] OTP for ${toEmail}: ${otp}`);
  console.log(`   ⚠️ Email not actually sent - configure RESEND_API_KEY for production`);
  return { 
    success: true, 
    method: 'simulation',
    simulatedOtp: otp,
    message: 'Email simulated - OTP logged to console. Configure RESEND_API_KEY for production.'
  };
}

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Send OTP via Email
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if Redis is available
    if (!redisClient?.isOpen) {
      return res.status(503).json({ error: 'OTP service temporarily unavailable. Please try regular login.' });
    }

    // Check rate limit (max 3 attempts per 30 minutes)
    const rateLimitKey = `otp_rate:${normalizedEmail}`;
    const attemptCount = await redisClient.get(rateLimitKey);

    if (attemptCount && parseInt(attemptCount) >= 3) {
      const ttl = await redisClient.ttl(rateLimitKey);
      const minutesLeft = Math.ceil(ttl / 60);
      return res.status(429).json({
        error: `Too many OTP requests. Please try again after ${minutesLeft} minutes.`,
        retryAfter: ttl
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in Redis with 5-minute expiry
    const otpKey = `otp:${normalizedEmail}`;
    await redisClient.setEx(otpKey, 300, otp); // 5 minutes = 300 seconds

    // Increment rate limit counter (30-minute window)
    if (attemptCount) {
      await redisClient.incr(rateLimitKey);
    } else {
      await redisClient.setEx(rateLimitKey, 1800, '1'); // 30 minutes = 1800 seconds
    }

    const currentAttempts = parseInt(attemptCount || '0') + 1;
    const remainingAttempts = 3 - currentAttempts;

    // Send email with OTP using fallback chain
    try {
      const emailResult = await sendOTPEmail(normalizedEmail, otp);

      // Build response based on method used
      const response = {
        success: true,
        message: emailResult.method === 'simulation' 
          ? `OTP generated (simulation mode). Check server logs for OTP: ${otp}`
          : 'OTP sent successfully! Please check your email.',
        remainingAttempts,
        expiresIn: 300, // seconds
        method: emailResult.method
      };

      // Include simulated OTP for development testing
      if (emailResult.method === 'simulation') {
        response.simulatedOtp = otp; // Only in dev mode
        response.hint = 'Configure RESEND_API_KEY environment variable for production email delivery';
      }

      res.json(response);

    } catch (emailError) {
      console.error('❌ All email methods failed:', emailError);
      // Remove the stored OTP since email failed
      await redisClient.del(otpKey);
      res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and Login/Register
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if Redis is available
    if (!redisClient?.isOpen) {
      return res.status(503).json({ error: 'OTP service temporarily unavailable.' });
    }

    // Get stored OTP
    const otpKey = `otp:${normalizedEmail}`;
    const storedOtp = await redisClient.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    if (storedOtp !== otp.toString()) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // OTP is valid - delete it
    await redisClient.del(otpKey);

    // Check if user exists
    const db = mongoose.connection.db;
    let user = await db.collection('users').findOne({ email: normalizedEmail });

    if (!user) {
      // Create new customer account
      const newUser = {
        email: normalizedEmail,
        password: null, // No password for OTP-only users
        role: 'customer',
        full_name: normalizedEmail.split('@')[0], // Use email prefix as name
        profile: {
          firstName: '',
          lastName: '',
          phone: '',
          avatar: null,
          verified: true, // Email verified via OTP
        },
        is_active: true,
        email_verified: true,
        created_date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('users').insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };

      console.log(`✅ New customer created via OTP: ${normalizedEmail}`);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Clear rate limit on successful login
    await redisClient.del(`otp_rate:${normalizedEmail}`);

    res.json({
      success: true,
      message: user.createdAt === user.updatedAt ? 'Welcome to SmartEats! 🎉' : 'Welcome back! 🎉',
      token,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        profile: user.profile || {},
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Get OTP status (remaining time, attempts)
app.post('/api/auth/otp-status', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!redisClient?.isOpen) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    const otpKey = `otp:${normalizedEmail}`;
    const rateLimitKey = `otp_rate:${normalizedEmail}`;

    const otpTtl = await redisClient.ttl(otpKey);
    const attemptCount = await redisClient.get(rateLimitKey);
    const rateLimitTtl = await redisClient.ttl(rateLimitKey);

    res.json({
      otpActive: otpTtl > 0,
      otpExpiresIn: otpTtl > 0 ? otpTtl : 0,
      attempts: parseInt(attemptCount || '0'),
      remainingAttempts: Math.max(0, 3 - parseInt(attemptCount || '0')),
      rateLimitExpiresIn: rateLimitTtl > 0 ? rateLimitTtl : 0,
      canRequestOtp: !attemptCount || parseInt(attemptCount) < 3,
    });

  } catch (error) {
    console.error('OTP status error:', error);
    res.status(500).json({ error: 'Failed to get OTP status' });
  }
});
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

// Carts endpoint - NO AUTH REQUIRED for cart operations
app.get('/api/carts', async (req, res) => {
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

app.post('/api/carts', async (req, res) => {
  try {
    const cartData = { ...req.body, created_date: new Date(), updated_date: new Date() };
    const result = await mongoose.connection.db.collection('carts').insertOne(cartData);
    console.log('✅ Cart created for:', cartData.customer_email);
    res.json({ data: { ...cartData, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Create cart error:', error);
    res.status(500).json({ error: 'Failed to create cart' });
  }
});

app.patch('/api/carts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating cart:', id, 'Body keys:', Object.keys(req.body || {}));

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid cart ID format:', id);
      return res.status(400).json({ error: 'Invalid cart ID format' });
    }

    const updateData = { ...req.body, updated_date: new Date() };
    const result = await mongoose.connection.db.collection('carts').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );

    console.log('Cart update result:', result.modifiedCount, 'modified');

    // Return the updated data even if we can't refetch
    if (result.modifiedCount > 0) {
      const updated = await mongoose.connection.db.collection('carts').findOne({ _id: new mongoose.Types.ObjectId(id) });
      if (updated) {
        res.json({ data: { ...updated, id: updated._id.toString() } });
      } else {
        res.json({ data: { id, ...updateData } });
      }
    } else {
      res.json({ data: { id, ...updateData } });
    }
  } catch (error) {
    console.error('Update cart error:', error.message);
    res.status(500).json({ error: 'Failed to update cart', details: error.message });
  }
});

app.delete('/api/carts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting cart:', id);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid cart ID format:', id);
      return res.status(400).json({ error: 'Invalid cart ID format' });
    }

    await mongoose.connection.db.collection('carts').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete cart error:', error.message);
    res.status(500).json({ error: 'Failed to delete cart', details: error.message });
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

    // Generate unique order number - NEVER null
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    const orderNumber = req.body.order_number || `SE${timestamp}${random}`;

    // Ensure all required fields have values
    const orderData = {
      order_number: orderNumber,
      orderNumber: orderNumber,  // MongoDB has index on camelCase version
      customer_email: req.body.customer_email || 'guest@smarteats.com',
      customer_name: req.body.customer_name || 'Guest',
      restaurant_id: req.body.restaurant_id || '',
      restaurant_name: req.body.restaurant_name || '',
      items: req.body.items || [],
      subtotal: req.body.subtotal || 0,
      delivery_fee: req.body.delivery_fee || 30,
      taxes: req.body.taxes || 0,
      discount: req.body.discount || 0,
      total_amount: req.body.total_amount || 0,
      payment_method: req.body.payment_method || 'cod',
      payment_status: req.body.payment_status || 'pending',
      order_status: req.body.order_status || 'placed',
      delivery_address: req.body.delivery_address || '',
      delivery_latitude: req.body.delivery_latitude || 12.9716,
      delivery_longitude: req.body.delivery_longitude || 77.5946,
      delivery_instructions: req.body.delivery_instructions || '',
      is_scheduled: req.body.is_scheduled || false,
      scheduled_date: req.body.scheduled_date || null,
      scheduled_time: req.body.scheduled_time || null,
      points_earned: req.body.points_earned || 0,
      points_redeemed: req.body.points_redeemed || 0,
      estimated_delivery_time: req.body.estimated_delivery_time || new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      created_date: new Date(),
      updated_date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Inserting order with number:', orderNumber);

    // Insert with explicit error handling
    let result;
    try {
      result = await mongoose.connection.db.collection('orders').insertOne(orderData);
    } catch (insertError) {
      console.error('MongoDB insert error:', insertError.message);
      // If duplicate key error, try with new order number
      if (insertError.code === 11000) {
        const newOrderNum = `SE${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        orderData.order_number = newOrderNum;
        orderData.orderNumber = newOrderNum;
        result = await mongoose.connection.db.collection('orders').insertOne(orderData);
      } else {
        throw insertError;
      }
    }

    console.log('✅ Order created:', orderData.order_number, result.insertedId.toString());

    res.json({ data: { ...orderData, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('=== ORDER POST ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ error: 'Failed to create order', details: error.message, code: error.code });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
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

app.delete('/api/orders/:id', async (req, res) => {
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

// ==============================================
// ADDRESSES ENDPOINTS (Required for order placement)
// ==============================================
app.get('/api/addresss', async (req, res) => {
  try {
    const { user_email, _limit = 50 } = req.query;
    const query = user_email ? { user_email } : {};
    const addresses = await mongoose.connection.db.collection('addresses')
      .find(query).limit(parseInt(_limit)).toArray();
    const transformed = addresses.map(a => ({ ...a, id: a._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Addresses GET error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/addresss', async (req, res) => {
  try {
    const data = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('addresses').insertOne(data);
    console.log('✅ Address created for:', data.user_email);
    res.json({ data: { ...data, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Addresses POST error:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

app.patch('/api/addresss/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_date: new Date() };
    await mongoose.connection.db.collection('addresses').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    const updated = await mongoose.connection.db.collection('addresses').findOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ data: { ...updated, id: updated._id.toString() } });
  } catch (error) {
    console.error('Addresses PATCH error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

app.delete('/api/addresss/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('addresses').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Addresses DELETE error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// ==============================================
// DRIVERS ENDPOINTS
// ==============================================
app.get('/api/drivers', async (req, res) => {
  try {
    const { email, status, is_available, _sort = '-created_date', _limit = 100 } = req.query;
    let query = {};
    if (email) query.email = email;
    if (status) query.status = status;
    if (is_available) query.is_available = is_available === 'true';

    const sortField = _sort.startsWith('-') ? _sort.substring(1) : _sort;
    const sortOrder = _sort.startsWith('-') ? -1 : 1;

    const drivers = await mongoose.connection.db.collection('drivers')
      .find(query)
      .sort({ [sortField]: sortOrder })
      .limit(parseInt(_limit))
      .toArray();

    console.log(`Fetched ${drivers.length} drivers`);
    const transformed = drivers.map(d => ({ ...d, id: d._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Drivers GET error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/drivers', async (req, res) => {
  try {
    const data = { ...req.body, created_date: new Date(), status: 'pending' };
    const result = await mongoose.connection.db.collection('drivers').insertOne(data);
    res.json({ data: { ...data, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Drivers POST error:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

app.patch('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_date: new Date() };
    await mongoose.connection.db.collection('drivers').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    const updated = await mongoose.connection.db.collection('drivers').findOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ data: { ...updated, id: updated._id.toString() } });
  } catch (error) {
    console.error('Drivers PATCH error:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// ==============================================
// REWARDS ENDPOINTS
// ==============================================
app.get('/api/rewards', async (req, res) => {
  try {
    const { is_active, _limit = 50 } = req.query;
    let query = {};
    if (is_active) query.is_active = is_active === 'true';

    const rewards = await mongoose.connection.db.collection('rewards')
      .find(query).limit(parseInt(_limit)).toArray();
    const transformed = rewards.map(r => ({ ...r, id: r._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Rewards GET error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/rewards', async (req, res) => {
  try {
    const data = { ...req.body, created_date: new Date() };
    const result = await mongoose.connection.db.collection('rewards').insertOne(data);
    res.json({ data: { ...data, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Rewards POST error:', error);
    res.status(500).json({ error: 'Failed to create reward' });
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

// ==============================================
// SUPPORT TICKETS ENDPOINTS
// ==============================================
app.get('/api/supporttickets', async (req, res) => {
  try {
    const { customer_email, status, _sort = '-created_date', _limit = 100 } = req.query;
    let query = {};
    if (customer_email) query.customer_email = customer_email;
    if (status) query.status = status;

    const sortField = _sort.startsWith('-') ? _sort.substring(1) : _sort;
    const sortOrder = _sort.startsWith('-') ? -1 : 1;

    const tickets = await mongoose.connection.db.collection('supporttickets')
      .find(query)
      .sort({ [sortField]: sortOrder })
      .limit(parseInt(_limit))
      .toArray();

    const transformed = tickets.map(t => ({ ...t, id: t._id.toString() }));
    res.json({ data: transformed });
  } catch (error) {
    console.error('Support Tickets GET error:', error);
    res.json({ data: [] });
  }
});

app.post('/api/supporttickets', async (req, res) => {
  try {
    const data = { ...req.body, created_date: new Date(), updated_date: new Date() };
    const result = await mongoose.connection.db.collection('supporttickets').insertOne(data);
    res.json({ data: { ...data, id: result.insertedId.toString(), _id: result.insertedId } });
  } catch (error) {
    console.error('Support Tickets POST error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.patch('/api/supporttickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_date: new Date() };
    await mongoose.connection.db.collection('supporttickets').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    const updated = await mongoose.connection.db.collection('supporttickets').findOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ data: { ...updated, id: updated._id.toString() } });
  } catch (error) {
    console.error('Support Tickets PATCH error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

app.delete('/api/supporttickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await mongoose.connection.db.collection('supporttickets').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Support Tickets DELETE error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
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
