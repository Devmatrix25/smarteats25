# 🍔 SmartEats - Full-Stack Food Delivery Ecosystem

A production-ready, microservices-based food delivery platform with separate applications for customers, restaurants, delivery partners, and administrators.

![SmartEats](https://img.shields.io/badge/SmartEats-Microservices-orange)
![MERN](https://img.shields.io/badge/Stack-MERN-green)
![WebSockets](https://img.shields.io/badge/Real--time-WebSockets-blue)
![RabbitMQ](https://img.shields.io/badge/Queue-RabbitMQ-red)

## 🏗️ Architecture Overview

SmartEats is built using a modern microservices architecture with:

- **4 Frontend Applications**: Customer, Restaurant, Delivery Partner, and Admin
- **7 Backend Microservices**: Auth, Order, Restaurant, Delivery, Payment, Notification, and API Gateway
- **Real-time Communication**: WebSocket server for live updates
- **Message Queue**: RabbitMQ for event-driven architecture
- **Async Workers**: Celery for heavy background tasks
- **Caching & Sessions**: Redis
- **Database**: MongoDB

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND APPS                          │
│  Customer App  │  Restaurant App  │  Delivery App  │  Admin │
└────────┬────────────────┬────────────────┬─────────────┬────┘
         │                │                │             │
         └────────────────┴────────────────┴─────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   API GATEWAY      │
                    │  (Port 4000)       │
                    └─────────┬──────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │  Auth   │         │  Order  │         │Restaurant│
    │ Service │         │ Service │         │ Service  │
    └─────────┘         └────┬────┘         └──────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐         ┌───▼────┐         ┌───▼────┐
    │Delivery │         │Payment │         │Notif.  │
    │ Service │         │Service │         │Service │
    └─────────┘         └────────┘         └────────┘
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                    ┌────────▼─────────┐
                    │    RabbitMQ      │
                    │  Message Queue   │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐         ┌───▼────┐         ┌───▼────┐
    │WebSocket│         │ Celery │         │ Redis  │
    │ Server  │         │ Worker │         │ Cache  │
    └─────────┘         └────────┘         └────────┘
                             │
                    ┌────────▼─────────┐
                    │     MongoDB      │
                    │    Database      │
                    └──────────────────┘
```

## ✨ Features

### 🛍️ Customer App (Port 3000)
- Browse restaurants by cuisine, rating, and delivery time
- AI-powered food recommendations (FlavorLens)
- Real-time order tracking with driver location
- Loyalty points and rewards system
- Schedule orders for later
- Multiple payment methods
- Favorites and order history
- AI chat assistant

### 🍽️ Restaurant Partner App (Port 3001)
- Menu management with customizable items
- Real-time order notifications
- Revenue analytics and insights
- Promotional campaigns
- Order status updates
- Customer reviews management

### 🚗 Delivery Partner App (Port 3002)
- Available deliveries with order batching
- Navigation integration
- Live location tracking
- Earnings tracking
- Real-time order assignments
- Delivery history

### 👨‍💼 Admin Dashboard (Port 3003)
- Restaurant approval workflow
- Driver management and verification
- Order monitoring
- Platform analytics
- Dispute management
- Coupon management
- System metrics

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Redux Toolkit / Zustand
- **Real-time**: Socket.io Client
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Maps**: Leaflet

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Real-time**: Socket.io
- **Authentication**: JWT + OAuth
- **Payments**: Stripe
- **Async Workers**: Celery (Python)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx (optional)

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** 18+ and npm 9+
- **Python** 3.9+ (for Celery workers)
- **Docker Desktop** (recommended) or:
  - MongoDB 7+
  - Redis 7+
  - RabbitMQ 3+

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
```bash
cd c:\Users\USER\Desktop\final-submission\SMART-EATS
```

2. **Create environment file**
```bash
cp .env.template .env
# Edit .env and fill in your actual values
```

3. **Start all services**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml up
```

4. **Access the applications**
- Customer App: http://localhost:3000
- Restaurant App: http://localhost:3001
- Delivery App: http://localhost:3002
- Admin Dashboard: http://localhost:3003
- API Gateway: http://localhost:4000
- RabbitMQ Management: http://localhost:15672 (guest/guest)

### Option 2: Manual Setup

1. **Install dependencies**
```bash
npm install
```

2. **Start infrastructure services**
```bash
# Start MongoDB
mongod --dbpath ./data/db

# Start Redis
redis-server

# Start RabbitMQ
rabbitmq-server
```

3. **Start backend services**
```bash
# Terminal 1: API Gateway
npm run dev:gateway

# Terminal 2: Auth Service
npm run dev:auth

# Terminal 3: Order Service
npm run dev:order

# Terminal 4: Restaurant Service
npm run dev:restaurant-service

# Terminal 5: Delivery Service
npm run dev:delivery-service

# Terminal 6: Payment Service
npm run dev:payment

# Terminal 7: Notification Service
npm run dev:notification

# Terminal 8: WebSocket Server
npm run dev:sockets

# Terminal 9: Celery Worker (Python)
cd backend/celery-worker
pip install -r requirements.txt
celery -A celery_app worker --loglevel=info
```

4. **Start frontend apps**
```bash
# Terminal 10: Customer App
npm run dev:customer

# Terminal 11: Restaurant App
npm run dev:restaurant

# Terminal 12: Delivery App
npm run dev:delivery

# Terminal 13: Admin App
npm run dev:admin
```

## 📁 Project Structure

```
smarteats/
├── apps/
│   ├── customer-app/          # Customer-facing React app
│   ├── restaurant-app/        # Restaurant partner React app
│   ├── delivery-app/          # Delivery partner React app
│   └── admin-app/             # Admin dashboard React app
├── backend/
│   ├── api-gateway/           # API Gateway (Port 4000)
│   ├── services/
│   │   ├── auth-service/      # Authentication (Port 4001)
│   │   ├── order-service/     # Order management (Port 4002)
│   │   ├── restaurant-service/# Restaurant management (Port 4003)
│   │   ├── delivery-service/  # Delivery management (Port 4004)
│   │   ├── payment-service/   # Payment processing (Port 4005)
│   │   └── notification-service/ # Notifications (Port 4006)
│   ├── sockets/               # WebSocket server (Port 4100)
│   ├── queue/                 # RabbitMQ utilities
│   └── celery-worker/         # Python async workers
├── infrastructure/
│   ├── docker/
│   │   └── docker-compose.yml # Full stack orchestration
│   └── configs/               # Shared configurations
├── .env.template              # Environment variables template
├── package.json               # Root workspace config
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables

Copy `.env.template` to `.env` and configure:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/smarteats

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# JWT
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microservices URLs
API_GATEWAY_URL=http://localhost:4000
AUTH_SERVICE_URL=http://localhost:4001
# ... etc
```

## 🔄 Order Lifecycle

Orders flow through the following states:

```
pending → paid → restaurant_accepted → preparing → ready_for_pickup 
→ assigned → picked_up → out_for_delivery → delivered → completed
```

Cancellations and refunds can occur at various stages with appropriate business logic.

## 🔌 API Endpoints

### Authentication Service (Port 4001)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh access token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `GET /verify-email/:token` - Verify email
- `GET /me` - Get current user
- `POST /oauth/google` - Google OAuth

### Order Service (Port 4002)
- `POST /orders` - Create order
- `GET /orders/:id` - Get order details
- `GET /orders` - List orders
- `PATCH /orders/:id/status` - Update order status
- `POST /orders/:id/cancel` - Cancel order

### Restaurant Service (Port 4003)
- `GET /restaurants` - List restaurants
- `GET /restaurants/:id` - Get restaurant details
- `POST /restaurants` - Create restaurant
- `PATCH /restaurants/:id` - Update restaurant
- `GET /restaurants/:id/menu` - Get menu
- `POST /restaurants/:id/menu` - Add menu item

### Delivery Service (Port 4004)
- `GET /drivers` - List drivers
- `POST /drivers` - Register driver
- `POST /drivers/:id/location` - Update location
- `GET /deliveries/available` - Get available deliveries
- `POST /deliveries/:id/accept` - Accept delivery

### Payment Service (Port 4005)
- `POST /payments` - Create payment intent
- `POST /payments/:id/confirm` - Confirm payment
- `POST /payments/:id/refund` - Process refund

### Notification Service (Port 4006)
- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark as read

## 🔌 WebSocket Events

### Client → Server
- `join:order` - Join order room
- `join:restaurant` - Join restaurant room
- `join:driver` - Join driver room
- `driver:location` - Update driver location

### Server → Client
- `order:status_updated` - Order status changed
- `driver:location_updated` - Driver location updated
- `order:assigned` - Order assigned to driver
- `notification:new` - New notification

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific service
npm test --workspace=backend/services/auth-service

# Test frontend app
npm test --workspace=apps/customer-app
```

## 🐛 Troubleshooting

### Services won't start
```bash
# Check if ports are available
netstat -ano | findstr "4000 4001 4002 4003 4004 4005 4006 4100"

# Check Docker containers
docker ps -a

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f
```

### MongoDB connection issues
```bash
# Verify MongoDB is running
docker ps | grep mongodb

# Check connection string in .env
echo $MONGODB_URI
```

### RabbitMQ not connecting
```bash
# Access RabbitMQ management UI
http://localhost:15672
# Default credentials: guest/guest
```

## 📚 Documentation

- [API Documentation](./docs/API.md) - Complete API reference
- [Architecture Guide](./docs/ARCHITECTURE.md) - System architecture details
- [Development Guide](./docs/DEVELOPMENT.md) - Development workflow
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment

## 🤝 Contributing

This is a complete ecosystem project. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary. All rights reserved.

---

**Built with ❤️ using MERN Stack + Microservices**

🚀 Happy Coding!
