# 🍔 SMART-EATS: Complete Project Documentation

> **A Full-Stack Food Delivery Platform with Microservices Architecture**

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Microservices Explained](#4-microservices-explained)
5. [Demo Mode vs Real Mode](#5-demo-mode-vs-real-mode)
6. [User Flows with Examples](#6-user-flows-with-examples)
7. [AI Features](#7-ai-features)
8. [Database Schema](#8-database-schema)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Viva Q&A Preparation](#10-viva-qa-preparation)

---

## 1. Project Overview

**SMART-EATS** is a food delivery platform similar to Zomato/Swiggy with:

- **4 User Roles**: Customer, Restaurant, Driver, Admin
- **7 Microservices**: Auth, Order, Restaurant, Delivery, Payment, Notification, API Gateway
- **2 AI Features**: FlavorLens (food recognition) + AI Chat Assistant
- **Real-time Updates**: WebSocket for live order tracking

### Key Features
| Feature | Description |
|---------|-------------|
| Multi-role Authentication | Different dashboards for each user type |
| Restaurant Management | Menu CRUD, order acceptance, analytics |
| Order Management | Cart → Payment → Tracking → Delivery |
| Driver Assignment | Auto-assign nearest available driver |
| AI Food Recognition | Upload food image → Get dish suggestions |
| Live Tracking | Real-time driver location on map |

---

## 2. Technology Stack

### Frontend
```
React 18          → UI Framework (component-based)
Vite              → Build tool (fast dev server)
Tailwind CSS      → Utility-first styling
shadcn/ui         → Pre-built UI components
React Router v6   → Client-side routing
React Query       → Server state management
Axios             → HTTP requests
Leaflet           → Interactive maps
Socket.io Client  → Real-time communication
```

### Backend
```
Node.js 20        → JavaScript runtime
Express.js        → Web framework
MongoDB           → NoSQL database (stores users, orders, restaurants)
Mongoose          → MongoDB ODM (schema validation)
Redis             → In-memory cache (rate limiting, sessions)
JWT               → Authentication tokens
Socket.io         → WebSocket server
```

### AI Services
```
Gemini API        → FlavorLens (image recognition)
Mistral API       → AI Chat Assistant (food recommendations)
```

### Deployment
```
Vercel            → Frontend hosting (CDN, auto-deploy)
Render            → Backend hosting (Docker-free)
MongoDB Atlas     → Cloud database
Redis Cloud       → Managed Redis
```

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │  Customer   │ │ Restaurant  │ │   Driver    │ │   Admin     │    │
│  │    App      │ │    App      │ │    App      │ │    App      │    │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘    │
└─────────┼───────────────┼───────────────┼───────────────┼───────────┘
          │               │               │               │
          └───────────────┴───────────────┴───────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Render)                            │
│                    https://smarteats12.onrender.com                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  • Rate Limiting  • JWT Validation  • Request Routing       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────┬───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │  Auth   │ │  Order  │ │Restaurant│ │Delivery │ │ Payment │
   │ Service │ │ Service │ │ Service │ │ Service │ │ Service │
   │  :4001  │ │  :4002  │ │  :4003  │ │  :4004  │ │  :4005  │
   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
        │           │           │           │           │
        └───────────┴───────────┴───────────┴───────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              ┌──────────┐           ┌──────────┐
              │ MongoDB  │           │  Redis   │
              │  Atlas   │           │  Cloud   │
              └──────────┘           └──────────┘
```

---

## 4. Microservices Explained

### 4.1 API Gateway (Port 4000)
**Purpose**: Single entry point for all client requests

```javascript
// What it does:
1. Receives ALL requests from frontend
2. Validates JWT token (authentication)
3. Applies rate limiting (prevent abuse)
4. Routes to appropriate microservice

// Example:
POST /api/auth/register → Forwards to Auth Service
GET /api/restaurants    → Forwards to Restaurant Service
POST /api/orders        → Forwards to Order Service
```

**Key Code** (`backend/api-gateway/server.js`):
```javascript
// Rate limiting - max 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Proxy to Auth Service
app.use('/api/auth', createProxyMiddleware({
  target: 'http://localhost:4001',
  changeOrigin: true
}));
```

---

### 4.2 Auth Service (Port 4001)
**Purpose**: User registration, login, JWT tokens

```javascript
// Endpoints:
POST /register     → Create new user
POST /login        → Authenticate user, return JWT
POST /oauth/google → Google sign-in
GET  /me           → Get current user from token
POST /logout       → Invalidate tokens
```

**Example Flow - User Registration**:
```
1. User fills form: { email, password, role: "customer" }
2. Frontend → POST /api/auth/register
3. API Gateway → Forwards to Auth Service
4. Auth Service:
   - Validates email format
   - Checks if email exists in MongoDB
   - Hashes password with bcrypt
   - Creates user document
   - Generates JWT tokens
5. Returns: { user, accessToken, refreshToken }
6. Frontend stores tokens in localStorage
```

**Password Hashing** (`models/User.js`):
```javascript
userSchema.pre('save', async function(next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

---

### 4.3 Restaurant Service (Port 4003)
**Purpose**: Restaurant and menu management

```javascript
// Endpoints:
GET    /              → List all restaurants
GET    /:id           → Get restaurant details
POST   /              → Create restaurant (owner only)
PUT    /:id           → Update restaurant
GET    /:id/menu      → Get menu items
POST   /:id/menu      → Add menu item
```

**Example - Get Restaurants**:
```javascript
// MongoDB Query
Restaurant.find({ status: 'approved', isOpen: true })
  .sort({ 'ratings.average': -1 })
  .limit(20);
```

---

### 4.4 Order Service (Port 4002)
**Purpose**: Order lifecycle management

```javascript
// Order Status Flow:
pending → paid → restaurant_accepted → preparing → 
ready_for_pickup → picked_up → out_for_delivery → delivered
```

**Order Creation Example**:
```javascript
// Customer places order
const order = {
  orderNumber: "ORD17336789450001",
  customerId: "user123",
  restaurantId: "rest456",
  items: [
    { name: "Butter Chicken", price: 350, quantity: 2 }
  ],
  pricing: {
    subtotal: 700,
    tax: 35,
    deliveryFee: 40,
    total: 775
  },
  status: "pending"
};
```

---

### 4.5 Delivery Service (Port 4004)
**Purpose**: Driver management and order assignment

```javascript
// Features:
- Track driver location (GPS coordinates)
- Find nearest available driver
- Assign driver to order
- Update delivery status
```

**Driver Assignment Algorithm**:
```javascript
// Find nearest driver
const nearestDriver = await Driver.findOne({
  status: 'approved',
  is_online: true,
  is_busy: false,
  city: order.deliveryAddress.city
}).sort({ 'location.distance': 1 });
```

---

### 4.6 Payment Service (Port 4005)
**Purpose**: Payment processing (simulated)

```javascript
// Payment Methods:
- Card (Stripe - simulated)
- Cash on Delivery (COD)
- UPI (simulated)
```

> **Note**: Real Stripe integration is configured but uses test mode for demo.

---

### 4.7 Notification Service (Port 4006)
**Purpose**: Email and SMS notifications

```javascript
// Notification Types:
- Order confirmation email
- Order status updates
- Driver assignment SMS
- Delivery completion
```

---

## 5. Demo Mode vs Real Mode

### Demo Mode (Current Deployment)
When you click **"Demo Customer"** button:

```javascript
// frontend/src/contexts/AuthContext.jsx
const loginAsDemo = async (role) => {
  // Creates FAKE user without backend
  const demoUser = {
    _id: 'demo-customer-id',
    email: 'customer@demo.com',
    role: 'customer',
    profile: { firstName: 'Demo', lastName: 'Customer' }
  };
  
  // Store in localStorage (no MongoDB)
  localStorage.setItem('user', JSON.stringify(demoUser));
  setUser(demoUser);
};
```

**What happens**:
1. ❌ No API call to backend
2. ❌ No MongoDB query
3. ❌ No JWT token generated
4. ✅ User object created in browser memory
5. ✅ Can browse mock restaurants
6. ✅ Can use AI features

---

### Real Mode (With All Microservices)
When you fill registration form and submit:

```
Frontend                 API Gateway              Auth Service           MongoDB
   │                         │                        │                    │
   │ POST /api/auth/register │                        │                    │
   │ {email, password}       │                        │                    │
   │────────────────────────►│                        │                    │
   │                         │ Forward to :4001       │                    │
   │                         │───────────────────────►│                    │
   │                         │                        │ db.users.insertOne │
   │                         │                        │───────────────────►│
   │                         │                        │     {user doc}     │
   │                         │                        │◄───────────────────│
   │                         │    { user, tokens }    │                    │
   │                         │◄───────────────────────│                    │
   │    { user, tokens }     │                        │                    │
   │◄────────────────────────│                        │                    │
```

---

## 6. User Flows with Examples

### 6.1 Customer Registration Flow

**Step 1: Frontend Form**
```jsx
// src/pages/Register.jsx
<form onSubmit={handleSubmit}>
  <Input name="firstName" value="Rahul" />
  <Input name="email" value="rahul@example.com" />
  <Input name="password" value="password123" type="password" />
  <Select name="role" value="customer" />
  <Button type="submit">Register</Button>
</form>
```

**Step 2: API Call**
```javascript
// src/api/base44Client.js
const response = await axios.post('/api/auth/register', {
  email: 'rahul@example.com',
  password: 'password123',
  role: 'customer',
  profile: { firstName: 'Rahul' }
});
```

**Step 3: Auth Service Processing**
```javascript
// backend/services/auth-service/routes/auth.js
router.post('/register', async (req, res) => {
  // 1. Validate input
  const { email, password, role } = req.body;
  
  // 2. Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email already registered');
  
  // 3. Create user (password auto-hashed by mongoose pre-save)
  const user = await User.create({ email, password, role });
  
  // 4. Generate tokens
  const { accessToken, refreshToken } = user.generateTokens();
  
  // 5. Return response
  res.json({ user, accessToken, refreshToken });
});
```

**Step 4: MongoDB Document Created**
```javascript
// Document in 'users' collection
{
  _id: ObjectId("6754a1b2c3d4e5f6a7b8c9d0"),
  email: "rahul@example.com",
  password: "$2a$10$...", // bcrypt hashed
  role: "customer",
  profile: {
    firstName: "Rahul"
  },
  isActive: true,
  isEmailVerified: false,
  createdAt: ISODate("2025-12-07T12:00:00Z")
}
```

---

### 6.2 Complete Order Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│ CUSTOMER                                                              │
├──────────────────────────────────────────────────────────────────────┤
│ 1. Browse restaurants → GET /api/restaurants                         │
│ 2. View menu → GET /api/restaurants/:id/menu                         │
│ 3. Add to cart → Local state (Redux/useState)                        │
│ 4. Place order → POST /api/orders                                    │
│ 5. Make payment → POST /api/payments/initiate                        │
│ 6. Track order → WebSocket subscription                              │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ RESTAURANT                                                            │
├──────────────────────────────────────────────────────────────────────┤
│ 7. Receive order notification → WebSocket event                       │
│ 8. Accept order → PUT /api/orders/:id/status (restaurant_accepted)   │
│ 9. Prepare food → PUT /api/orders/:id/status (preparing)             │
│ 10. Mark ready → PUT /api/orders/:id/status (ready_for_pickup)       │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ DRIVER                                                                │
├──────────────────────────────────────────────────────────────────────┤
│ 11. Auto-assigned by system → Delivery Service                       │
│ 12. Pick up order → PUT /api/orders/:id/status (picked_up)           │
│ 13. Update location → WebSocket emit (every 10 seconds)              │
│ 14. Deliver → PUT /api/orders/:id/status (delivered)                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. AI Features

### 7.1 FlavorLens (Gemini API)
**Purpose**: Upload food photo → AI identifies dishes → Shows matching restaurants

```javascript
// src/pages/FlavorLens.jsx
const analyzeImage = async (imageBase64) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Identify the dishes in this food image..." },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 }}
          ]
        }]
      })
    }
  );
  // Returns: ["Butter Chicken", "Naan", "Biryani"]
};
```

**User Flow**:
```
1. Customer clicks "FlavorLens" in navbar
2. Uploads or captures food image
3. Image converted to base64
4. Sent to Gemini API
5. AI returns dish names
6. App searches mock data for matching restaurants
7. Shows recommendations
```

---

### 7.2 AI Chat Assistant (Mistral API)
**Purpose**: Natural language food search and recommendations

```javascript
// src/api/base44Client.js
InvokeLLM: async (prompt) => {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: 'You are a food recommendation assistant...' },
        { role: 'user', content: prompt }
      ]
    })
  });
  return response.choices[0].message.content;
}
```

**Example Conversation**:
```
User: "I want something spicy under ₹300"
AI: "Based on your preferences, I recommend:
    1. Chicken 65 (₹250) - Spicy, crispy fried chicken
    2. Szechuan Noodles (₹280) - Fiery Chinese noodles
    3. Andhra Biryani (₹299) - Extra spicy South Indian rice"
```

---

## 8. Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  role: "customer" | "restaurant" | "driver" | "admin",
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },
  isActive: Boolean,
  isEmailVerified: Boolean,
  approvalStatus: "pending" | "approved" | "rejected",
  createdAt: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique, e.g., "ORD17336789450001"),
  customerId: ObjectId (ref: Users),
  restaurantId: ObjectId (ref: Restaurants),
  driverId: ObjectId (ref: Users),
  items: [{
    menuItemId: ObjectId,
    name: String,
    price: Number,
    quantity: Number
  }],
  pricing: {
    subtotal: Number,
    tax: Number,
    deliveryFee: Number,
    total: Number
  },
  status: "pending" | "paid" | "preparing" | "delivered",
  deliveryAddress: {
    street: String,
    city: String,
    coordinates: { lat: Number, lng: Number }
  },
  createdAt: Date
}
```

### Restaurants Collection
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId (ref: Users),
  name: String,
  cuisine: [String],
  address: { street, city, coordinates },
  menu: [{
    name: String,
    price: Number,
    category: String,
    isVegetarian: Boolean
  }],
  ratings: {
    average: Number,
    count: Number
  },
  isOpen: Boolean,
  status: "pending" | "approved"
}
```

---

## 9. Deployment Architecture

### Current Deployment (Free Tier)
```
┌────────────────────────────────────┐
│           VERCEL (Free)            │
│    Frontend: React + Vite          │
│    URL: *.vercel.app               │
│    Features:                       │
│    - CDN for fast loading          │
│    - Auto SSL certificate          │
│    - Auto-deploy on git push       │
└────────────────────────────────────┘
               │
               ▼ HTTPS API calls
┌────────────────────────────────────┐
│           RENDER (Free)            │
│    Backend: API Gateway            │
│    URL: smarteats12.onrender.com   │
│    Features:                       │
│    - Node.js runtime               │
│    - Auto-deploy on git push       │
│    - 15min sleep on inactivity     │
└────────────────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│ MongoDB Atlas│ │ Redis Cloud  │
│   (Free)     │ │   (Free)     │
│ 512MB storage│ │ Rate limiting│
└──────────────┘ └──────────────┘
```

### Production Deployment (Paid)
```
- Deploy ALL 7 microservices on Render
- Each service as separate Docker container
- Load balancer for high availability
- Dedicated MongoDB cluster
- Dedicated Redis cluster
```

---

## 10. Viva Q&A Preparation

### Q1: What is microservices architecture?
**A**: Instead of one big application (monolith), we split into small independent services:
- Each service does ONE thing (Auth handles login, Order handles orders)
- Each has its own database/table
- They communicate via HTTP/REST APIs
- Can scale independently (if orders increase, only scale Order Service)

### Q2: Why use JWT for authentication?
**A**: JWT (JSON Web Token) is stateless authentication:
```javascript
// Token structure: header.payload.signature
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.  // Header
eyJ1c2VySWQiOiIxMjM0NTYifQ.              // Payload (userId)
SIGNATURE                                  // Verification
```
- Server doesn't store sessions (scalable)
- Token contains user info (no DB lookup needed)
- Has expiry time (security)

### Q3: How does the API Gateway work?
**A**: It's the "front door" to all microservices:
```
Client → API Gateway → [Auth Service, Order Service, ...]
```
- Single URL for all services (simplifies frontend)
- Handles authentication (validates JWT)
- Rate limiting (prevents abuse)
- Request routing (forwards to correct service)

### Q4: What is Redis used for?
**A**: In-memory database for:
1. **Rate Limiting**: Track requests per IP
2. **Session Cache**: Store user sessions
3. **Token Blacklist**: Track logged out tokens
4. **Real-time Data**: Fast reads for live tracking

### Q5: How does real-time order tracking work?
**A**: Using WebSockets (Socket.io):
```javascript
// Driver sends location every 10 seconds
socket.emit('driver:location', { orderId, lat, lng });

// Customer receives update
socket.on('order:tracking', (location) => {
  updateMapMarker(location.lat, location.lng);
});
```

### Q6: Explain the Gemini AI integration
**A**: FlavorLens feature:
1. User uploads food image
2. Convert to base64 string
3. Send to Gemini API with prompt: "Identify dishes"
4. Gemini returns dish names
5. Search restaurants matching those dishes

### Q7: Why MongoDB instead of MySQL?
**A**: MongoDB is NoSQL:
- **Flexible schema**: Restaurant can have 5 menu items, another can have 500
- **JSON-like documents**: Matches JavaScript objects
- **Easy to scale**: Horizontal sharding
- **Good for**: E-commerce, real-time apps, catalogs

### Q8: How is password security handled?
**A**: Using bcrypt hashing:
```javascript
// Never store plain password
password: "mypassword"     // ❌ WRONG
password: "$2a$10$xyz..."  // ✅ bcrypt hash

// Verification
bcrypt.compare("mypassword", hashedPassword) // true/false
```

### Q9: What happens if a microservice fails?
**A**: Only that feature fails, rest works:
- Payment Service down → Can't pay (but can browse)
- Auth Service down → Can't login (but logged-in users work)
- All services independent (fault isolation)

### Q10: How would you scale this for 1 million users?
**A**:
1. **Horizontal Scaling**: Multiple instances of each service
2. **Load Balancer**: Distribute traffic (Nginx/AWS ALB)
3. **Database Sharding**: Split data across servers
4. **Caching**: Redis for frequent reads
5. **CDN**: Cloudflare for static assets
6. **Queue**: RabbitMQ for async tasks (order processing)

---

## 📎 Quick Reference URLs

| Service | Local URL | Production URL |
|---------|-----------|----------------|
| Frontend | http://localhost:5173 | *.vercel.app |
| API Gateway | http://localhost:4000 | smarteats12.onrender.com |
| Auth Service | http://localhost:4001 | (via gateway) |
| Order Service | http://localhost:4002 | (via gateway) |
| Restaurant Service | http://localhost:4003 | (via gateway) |

---

## 📚 Files to Study

| File | Purpose |
|------|---------|
| `src/App.jsx` | All frontend routes |
| `src/contexts/AuthContext.jsx` | Authentication logic |
| `src/api/base44Client.js` | API calls + AI integration |
| `backend/api-gateway/server.js` | Gateway configuration |
| `backend/services/auth-service/models/User.js` | User schema |

---

## 11. 🎯 Complete Practical Example: Sunny's Journey

> **This section uses a real example to explain EXACTLY what happens at each step**

---

### Scenario: Sunny Orders Butter Chicken

**Characters:**
- 👤 **Sunny** - Customer
- 🍽️ **Spice Garden** - Restaurant
- 🚗 **Ravi** - Delivery Driver
- 👨‍💼 **Admin** - System Administrator

---

### PART 1: Sunny Registers as a Customer

#### Step 1: Sunny Opens the App
```
📱 Browser: https://smarteats-customer-app.vercel.app
```

**What happens in the system:**
```
1. Browser requests Vercel CDN
2. Vercel serves index.html + JavaScript bundles
3. React app loads in browser
4. React Router renders Login page
```

---

#### Step 2: Sunny Fills Registration Form

```
First Name: Sunny
Last Name: Kumar
Email: sunny@gmail.com
Password: Sunny@123
Phone: 9876543210
Role: Customer
```

**Frontend Code** (`src/pages/Register.jsx`):
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Collect form data
  const userData = {
    email: 'sunny@gmail.com',
    password: 'Sunny@123',
    role: 'customer',
    profile: {
      firstName: 'Sunny',
      lastName: 'Kumar',
      phone: '9876543210'
    }
  };
  
  // Call registration API
  await register(userData);
};
```

---

#### Step 3: Frontend Sends Request to Backend

**HTTP Request:**
```http
POST https://smarteats12.onrender.com/api/auth/register
Content-Type: application/json

{
  "email": "sunny@gmail.com",
  "password": "Sunny@123",
  "role": "customer",
  "profile": {
    "firstName": "Sunny",
    "lastName": "Kumar",
    "phone": "9876543210"
  }
}
```

---

#### Step 4: API Gateway Receives Request

**What API Gateway does** (`backend/api-gateway/server.js`):

```javascript
// 1. CORS Check - Is this origin allowed?
app.use(cors({
  origin: 'https://smarteats-customer-app.vercel.app', // ✅ Allowed
  credentials: true
}));

// 2. Rate Limiting - Has this IP made too many requests?
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // Max 100 requests
});
// Sunny's IP: 103.xx.xx.xx - First request ✅ Allowed

// 3. Route to Auth Service
app.use('/api/auth', createProxyMiddleware({
  target: 'http://localhost:4001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' }
}));
// Request forwarded to Auth Service at port 4001
```

---

#### Step 5: Auth Service Processes Registration

**Auth Service** (`backend/services/auth-service/routes/auth.js`):

```javascript
router.post('/register', async (req, res) => {
  try {
    // Extract data from request body
    const { email, password, role, profile } = req.body;
    
    // === STEP 5a: Validate Input ===
    if (!email || !password) {
      throw new Error('Email and password required');
    }
    // sunny@gmail.com ✅ Valid email format
    // Sunny@123 ✅ Password meets requirements (8+ chars)
    
    // === STEP 5b: Check if User Exists ===
    const existingUser = await User.findOne({ email });
    // MongoDB Query: db.users.findOne({ email: 'sunny@gmail.com' })
    // Result: null (no existing user) ✅
    
    // === STEP 5c: Create User Document ===
    const user = new User({
      email: 'sunny@gmail.com',
      password: 'Sunny@123',  // Will be hashed
      role: 'customer',
      profile: {
        firstName: 'Sunny',
        lastName: 'Kumar',
        phone: '9876543210'
      }
    });
    
    // === STEP 5d: Mongoose Pre-Save Hook (Password Hashing) ===
    // Before saving, this runs automatically:
    userSchema.pre('save', async function(next) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      // 'Sunny@123' → '$2a$10$xyzABC123...' (60 char hash)
      next();
    });
    
    await user.save();
    // MongoDB: db.users.insertOne({...})
    
    // === STEP 5e: Generate JWT Tokens ===
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: 'customer' },
      process.env.JWT_SECRET,  // 'c2669dfc...'
      { expiresIn: '15m' }     // Expires in 15 minutes
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }      // Expires in 7 days
    );
    
    // === STEP 5f: Send Response ===
    res.status(201).json({
      user: {
        _id: '675abc123def456',
        email: 'sunny@gmail.com',
        role: 'customer',
        profile: { firstName: 'Sunny', lastName: 'Kumar' }
      },
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5...'
    });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

#### Step 6: MongoDB Document Created

**Document in `users` collection:**
```javascript
{
  _id: ObjectId("675abc123def456"),
  email: "sunny@gmail.com",
  password: "$2a$10$xyzABC123hashedPasswordHere",  // Hashed!
  role: "customer",
  profile: {
    firstName: "Sunny",
    lastName: "Kumar",
    phone: "9876543210"
  },
  isActive: true,
  isEmailVerified: false,
  approvalStatus: "none",  // Customers don't need approval
  createdAt: ISODate("2025-12-07T12:00:00Z"),
  updatedAt: ISODate("2025-12-07T12:00:00Z")
}
```

---

#### Step 7: Frontend Receives Response & Stores Tokens

**Frontend** (`src/contexts/AuthContext.jsx`):
```javascript
const register = async (userData) => {
  // API response received
  const response = await api.auth.register(userData);
  
  // Store tokens in browser's localStorage
  localStorage.setItem('accessToken', response.accessToken);
  localStorage.setItem('refreshToken', response.refreshToken);
  
  // Update React state
  setUser(response.user);
  // This triggers re-render, showing logged-in UI
  
  // Navigate to home page
  navigate('/home');
};
```

**Browser localStorage after registration:**
```javascript
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### PART 2: Sunny Browses Restaurants

#### Step 8: Home Page Loads Restaurants

**Frontend makes API call:**
```javascript
// src/pages/Home.jsx
useEffect(() => {
  const fetchRestaurants = async () => {
    const restaurants = await api.entities.Restaurant.list();
    setRestaurants(restaurants);
  };
  fetchRestaurants();
}, []);
```

**API Request:**
```http
GET https://smarteats12.onrender.com/api/restaurants
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
```

**API Gateway:**
```javascript
// Validates JWT token first
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded = { userId: '675abc123def456', email: 'sunny@gmail.com', role: 'customer' }
// ✅ Token valid, forward request
```

**Restaurant Service Response:**
```javascript
[
  {
    _id: "rest001",
    name: "Spice Garden",
    cuisine: ["Indian", "North Indian"],
    ratings: { average: 4.5, count: 128 },
    isOpen: true,
    menu: [
      { name: "Butter Chicken", price: 350, isVeg: false },
      { name: "Dal Makhani", price: 250, isVeg: true }
    ]
  },
  // ... more restaurants
]
```

---

### PART 3: Sunny Uses FlavorLens AI

#### Step 9: Sunny Uploads a Food Image

Sunny sees a dish and takes a photo. He wants to find where to order it.

**Frontend** (`src/pages/FlavorLens.jsx`):
```javascript
const handleImageUpload = async (file) => {
  // Convert image to base64
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64Image = reader.result.split(',')[1];
    
    // Send to Gemini AI
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { 
                text: "Identify all the food dishes visible in this image. Return as JSON array of dish names." 
              },
              { 
                inline_data: { 
                  mime_type: "image/jpeg", 
                  data: base64Image 
                }
              }
            ]
          }]
        })
      }
    );
    
    const result = await response.json();
    // Gemini returns: ["Butter Chicken", "Naan", "Raita"]
    
    // Search restaurants with these dishes
    const matchingRestaurants = mockRestaurants.filter(r => 
      r.menu.some(item => 
        result.includes(item.name)
      )
    );
    
    setRecommendations(matchingRestaurants);
  };
};
```

**Result:** Sunny sees "Spice Garden" has Butter Chicken!

---

### PART 4: Sunny Places an Order

#### Step 10: Sunny Adds Items to Cart

**Frontend Cart State:**
```javascript
const [cart, setCart] = useState({
  restaurantId: 'rest001',
  restaurantName: 'Spice Garden',
  items: [
    { 
      menuItemId: 'menu001',
      name: 'Butter Chicken',
      price: 350,
      quantity: 2
    },
    {
      menuItemId: 'menu002',
      name: 'Naan',
      price: 40,
      quantity: 4
    }
  ],
  // Calculated values
  subtotal: 860,    // (350*2) + (40*4)
  tax: 43,          // 5% of subtotal
  deliveryFee: 40,
  total: 943
});
```

---

#### Step 11: Sunny Confirms Order

**API Request:**
```http
POST https://smarteats12.onrender.com/api/orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
Content-Type: application/json

{
  "restaurantId": "rest001",
  "items": [
    { "menuItemId": "menu001", "name": "Butter Chicken", "price": 350, "quantity": 2 },
    { "menuItemId": "menu002", "name": "Naan", "price": 40, "quantity": 4 }
  ],
  "deliveryAddress": {
    "street": "123 MG Road",
    "city": "Hyderabad",
    "zipCode": "500001",
    "coordinates": { "latitude": 17.385, "longitude": 78.486 }
  },
  "paymentMethod": "cod"
}
```

---

#### Step 12: Order Service Creates Order

**Order Service** (`backend/services/order-service/routes/orders.js`):
```javascript
router.post('/', async (req, res) => {
  // Create order document
  const order = new Order({
    orderNumber: `ORD${Date.now()}0001`,  // "ORD17336789430001"
    customerId: req.user.userId,           // From JWT: "675abc123def456"
    restaurantId: req.body.restaurantId,
    items: req.body.items,
    pricing: {
      subtotal: 860,
      tax: 43,
      deliveryFee: 40,
      total: 943
    },
    deliveryAddress: req.body.deliveryAddress,
    paymentMethod: 'cod',
    status: 'pending'
  });
  
  await order.save();
  
  // Emit WebSocket event to restaurant
  io.to(`restaurant_${order.restaurantId}`).emit('new_order', order);
  
  res.json(order);
});
```

**MongoDB Order Document:**
```javascript
{
  _id: ObjectId("order123abc"),
  orderNumber: "ORD17336789430001",
  customerId: ObjectId("675abc123def456"),  // Sunny
  restaurantId: ObjectId("rest001"),         // Spice Garden
  items: [
    { name: "Butter Chicken", price: 350, quantity: 2 },
    { name: "Naan", price: 40, quantity: 4 }
  ],
  pricing: { subtotal: 860, tax: 43, deliveryFee: 40, total: 943 },
  status: "pending",
  createdAt: ISODate("2025-12-07T12:30:00Z")
}
```

---

### PART 5: Restaurant Accepts Order

#### Step 13: Spice Garden Receives Notification

**Restaurant Dashboard receives WebSocket event:**
```javascript
// Restaurant's browser
socket.on('new_order', (order) => {
  // Play notification sound
  playSound('/notification.mp3');
  
  // Show order in dashboard
  setNewOrders([...newOrders, order]);
  
  // Show toast notification
  toast.success('New Order Received!', {
    description: `Order #${order.orderNumber} - ₹${order.pricing.total}`
  });
});
```

---

#### Step 14: Restaurant Accepts and Prepares

**Restaurant clicks "Accept Order":**
```http
PUT https://smarteats12.onrender.com/api/orders/order123abc/status
Authorization: Bearer eyJrestaurant-token...
Content-Type: application/json

{ "status": "restaurant_accepted" }
```

**Order status updates:**
```javascript
// Status progression:
"pending" → "restaurant_accepted" → "preparing" → "ready_for_pickup"
```

**Each status change triggers WebSocket:**
```javascript
// Customer's browser receives update
socket.on('order:status', (data) => {
  // data = { orderId: 'order123abc', status: 'preparing' }
  updateOrderStatus(data.status);
  // UI shows: "Your order is being prepared 👨‍🍳"
});
```

---

### PART 6: Driver Delivers the Order

#### Step 15: System Assigns Driver

**Delivery Service auto-assigns:**
```javascript
// backend/services/delivery-service/routes/delivery.js
const assignDriver = async (orderId) => {
  // Find nearest available driver
  const driver = await Driver.findOne({
    status: 'approved',
    is_online: true,
    is_busy: false,
    city: 'Hyderabad'
  }).sort({ 'location.distance': 1 });
  
  // Driver found: Ravi
  await Order.findByIdAndUpdate(orderId, {
    driverId: driver._id,
    status: 'assigned'
  });
  
  // Mark driver as busy
  await Driver.findByIdAndUpdate(driver._id, { is_busy: true });
  
  // Notify driver via WebSocket
  io.to(`driver_${driver._id}`).emit('order:assigned', order);
};
```

---

#### Step 16: Driver Updates Location (Real-time Tracking)

**Driver's app sends location every 10 seconds:**
```javascript
// Driver's app
setInterval(() => {
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('driver:location', {
      orderId: 'order123abc',
      latitude: position.coords.latitude,   // 17.390
      longitude: position.coords.longitude  // 78.492
    });
  });
}, 10000);
```

**Customer's app receives and shows on map:**
```javascript
// Sunny's browser
socket.on('order:tracking', (location) => {
  // Update Leaflet map marker
  driverMarker.setLatLng([location.latitude, location.longitude]);
  
  // Calculate ETA
  const eta = calculateETA(location, deliveryAddress);
  setEstimatedTime(eta);  // "Arriving in 8 minutes"
});
```

---

#### Step 17: Order Delivered

**Driver marks as delivered:**
```http
PUT https://smarteats12.onrender.com/api/orders/order123abc/status
Authorization: Bearer eyJdriver-token...
Content-Type: application/json

{ "status": "delivered" }
```

**Final MongoDB Order Document:**
```javascript
{
  _id: ObjectId("order123abc"),
  orderNumber: "ORD17336789430001",
  customerId: ObjectId("675abc123def456"),
  restaurantId: ObjectId("rest001"),
  driverId: ObjectId("driver789xyz"),   // Ravi
  items: [...],
  pricing: { total: 943 },
  status: "delivered",                   // Final status
  createdAt: ISODate("2025-12-07T12:30:00Z"),
  actualDeliveryTime: ISODate("2025-12-07T13:15:00Z")
}
```

---

### PART 7: Demo Mode (What's Different)

#### When Sunny Clicks "Demo Customer" Button:

```javascript
// src/contexts/AuthContext.jsx
const loginAsDemo = async (role) => {
  // ❌ NO API CALL - Everything happens in browser!
  
  const demoUser = {
    _id: 'demo-customer-id',
    email: 'customer@demo.com',
    role: 'customer',
    profile: { firstName: 'Demo', lastName: 'Customer' },
    isDemoUser: true
  };
  
  // Store in browser (not in MongoDB!)
  localStorage.setItem('accessToken', 'demo-token-12345');
  localStorage.setItem('user', JSON.stringify(demoUser));
  
  setUser(demoUser);  // Update React state
  navigate('/home');   // Go to home page
};
```

**Key Differences:**

| Aspect | Real Mode | Demo Mode |
|--------|-----------|-----------|
| User stored in | MongoDB | Browser localStorage |
| JWT Token | Real, signed by server | Fake string |
| API Calls | Go to backend | Use mock data |
| Restaurants | From database | From `mockData.js` |
| Orders | Saved in MongoDB | Not saved anywhere |

---

## 📊 Visual Summary: Data Flow for Sunny's Order

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         SUNNY'S ORDER JOURNEY                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   👤 SUNNY (Customer)                                                       │
│   Browser: Chrome                                                           │
│   Location: Hyderabad                                                       │
│                                                                             │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                │
│   │  Register   │ ───► │   Browse    │ ───► │   Order     │                │
│   │  Account    │      │ Restaurants │      │   Food      │                │
│   └─────────────┘      └─────────────┘      └──────┬──────┘                │
│                                                     │                       │
│   ════════════════════════════════════════════════ │ ════════════════════  │
│                                                     ▼                       │
│   🌐 VERCEL (Frontend)                                                      │
│   URL: smarteats-customer-app.vercel.app                                    │
│   - Serves React app                                                        │
│   - Makes API calls to Render                                               │
│                                                                             │
│   ════════════════════════════════════════════════════════════════════════  │
│                                                     │                       │
│                                                     ▼                       │
│   🔀 RENDER (API Gateway)                                                   │
│   URL: smarteats12.onrender.com                                             │
│   - Validates JWT tokens                                                    │
│   - Rate limits requests (100/15min)                                        │
│   - Routes to microservices                                                 │
│                                                                             │
│   ════════════════════════════════════════════════════════════════════════  │
│         │              │              │              │                      │
│         ▼              ▼              ▼              ▼                      │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│   │   Auth   │   │  Order   │   │Restaurant│   │ Delivery │                │
│   │  :4001   │   │  :4002   │   │  :4003   │   │  :4004   │                │
│   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘                │
│        │              │              │              │                       │
│   ════ │ ═════════════│══════════════│══════════════│════════════════════  │
│        │              │              │              │                       │
│        └──────────────┴──────────────┴──────────────┘                       │
│                              │                                              │
│                              ▼                                              │
│   💾 MONGODB ATLAS                                                          │
│   Cluster: smarteats25                                                      │
│   Collections:                                                              │
│   - users     → Sunny's account                                             │
│   - orders    → Sunny's order                                               │
│   - restaurants → Spice Garden                                              │
│                                                                             │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│   ⚡ REDIS CLOUD                                                            │
│   - Rate limiting counters                                                  │
│   - Session cache                                                           │
│   - Real-time data                                                          │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎤 How to Explain in Viva (Quick Script)

> **Examiner:** Explain your project architecture.

**Your Answer:**

"SMART-EATS is a food delivery platform built with **microservices architecture**.

When a user like **Sunny** opens our app on his phone:

1. The **frontend** loads from **Vercel** - it's a React app built with Vite

2. When Sunny **registers**, the frontend sends a POST request to our **API Gateway** on **Render**

3. The API Gateway **validates** the request and **forwards** it to the **Auth Service**

4. Auth Service **hashes Sunny's password** using bcrypt and stores it in **MongoDB Atlas**

5. It generates **JWT tokens** - one for authentication (15 min expiry) and one for refresh (7 days)

6. When Sunny **browses restaurants**, the request goes through the same flow to the **Restaurant Service**

7. For **AI features**, we use **Gemini API** for food image recognition and **Mistral API** for the chat assistant

8. When Sunny **places an order**, the **Order Service** creates a record in MongoDB and notifies the restaurant via **WebSocket**

9. The restaurant accepts, and **Delivery Service** assigns the nearest available driver

10. The driver's **real-time location** is sent via WebSocket, and Sunny can track on a **Leaflet map**

This separation allows each service to **scale independently** - if orders increase, we only scale the Order Service, not the entire app."

---

**Document Created**: December 7, 2025  
**Project**: SMART-EATS Food Delivery Platform  
**Author**: SmartEats Team

