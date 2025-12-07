# 🚀 SmartEats Deployment Guide

## Quick Start (5 Minutes)

### Prerequisites
- Docker Desktop installed
- Git installed
- Text editor

### Steps

1. **Navigate to project**
```powershell
cd c:\Users\USER\Desktop\final-submission\SMART-EATS
```

2. **Create environment file**
```powershell
Copy-Item .env.template .env
```

3. **Edit .env file** (IMPORTANT!)
Open `.env` in your text editor and fill in these REQUIRED values:
```env
# Minimum required for local testing:
JWT_SECRET=your_random_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_random_refresh_secret_key_here_min_32_chars

# Optional but recommended:
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. **Start the entire stack**
```powershell
docker-compose -f infrastructure/docker/docker-compose.yml up
```

5. **Access the applications**
- **Customer App:** http://localhost:3000
- **API Gateway:** http://localhost:4000
- **RabbitMQ Management:** http://localhost:15672 (guest/guest)

---

## What Gets Started

When you run `docker-compose up`, the following services start:

### Infrastructure (3 services)
- **MongoDB** (Port 27017) - Database
- **Redis** (Port 6379) - Cache & Sessions
- **RabbitMQ** (Ports 5672, 15672) - Message Queue

### Backend Services (7 services)
- **API Gateway** (Port 4000) - Entry point
- **Auth Service** (Port 4001) - Authentication
- **Order Service** (Port 4002) - Orders
- **Restaurant Service** (Port 4003) - Restaurants
- **Delivery Service** (Port 4004) - Drivers
- **Payment Service** (Port 4005) - Payments
- **Notification Service** (Port 4006) - Notifications

### Supporting Services (2 services)
- **WebSocket Server** (Port 4100) - Real-time updates
- **Celery Worker** - Async tasks

### Frontend (1 service)
- **Customer App** (Port 3000) - React app

**Total: 13 services running**

---

## Verify Everything is Running

### Check Docker Containers
```powershell
docker-compose -f infrastructure/docker/docker-compose.yml ps
```

You should see all 13 services with status "Up".

### Health Checks
Open these URLs in your browser:

```
http://localhost:4000/health  # API Gateway
http://localhost:4001/health  # Auth Service
http://localhost:4002/health  # Order Service
http://localhost:4003/health  # Restaurant Service
http://localhost:4004/health  # Delivery Service
http://localhost:4005/health  # Payment Service
http://localhost:4006/health  # Notification Service
```

All should return:
```json
{
  "status": "healthy",
  "service": "service-name",
  "timestamp": "..."
}
```

---

## Test the System

### 1. Register a User
```powershell
curl -X POST http://localhost:4000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#",
    "role": "customer"
  }'
```

### 2. Login
```powershell
curl -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

Save the `accessToken` from the response.

### 3. Get Restaurants
```powershell
curl http://localhost:4000/api/restaurants `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Create an Order
```powershell
curl -X POST http://localhost:4000/api/orders `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "restaurantId": "RESTAURANT_ID",
    "items": [
      {
        "menuItemId": "ITEM_ID",
        "name": "Burger",
        "price": 10.99,
        "quantity": 2
      }
    ],
    "deliveryAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      }
    },
    "pricing": {
      "subtotal": 21.98,
      "tax": 1.98,
      "deliveryFee": 3.99,
      "total": 27.95
    },
    "paymentMethod": "card"
  }'
```

---

## View Logs

### All Services
```powershell
docker-compose -f infrastructure/docker/docker-compose.yml logs -f
```

### Specific Service
```powershell
docker-compose -f infrastructure/docker/docker-compose.yml logs -f api-gateway
docker-compose -f infrastructure/docker/docker-compose.yml logs -f auth-service
docker-compose -f infrastructure/docker/docker-compose.yml logs -f order-service
```

---

## Stop the System

### Stop all services
```powershell
docker-compose -f infrastructure/docker/docker-compose.yml down
```

### Stop and remove volumes (clean slate)
```powershell
docker-compose -f infrastructure/docker/docker-compose.yml down -v
```

---

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port
netstat -ano | findstr "4000"

# Kill process
taskkill /PID <PID> /F
```

### Service Won't Start
```powershell
# Check logs
docker-compose -f infrastructure/docker/docker-compose.yml logs service-name

# Restart specific service
docker-compose -f infrastructure/docker/docker-compose.yml restart service-name
```

### MongoDB Connection Issues
```powershell
# Check MongoDB is running
docker ps | findstr mongodb

# View MongoDB logs
docker-compose -f infrastructure/docker/docker-compose.yml logs mongodb
```

### RabbitMQ Issues
```powershell
# Access RabbitMQ Management UI
http://localhost:15672
# Username: guest
# Password: guest

# Check queues and exchanges
```

---

## Development Mode

### Run Services Individually

If you want to run services outside Docker for development:

1. **Start infrastructure only**
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:7.0
docker run -d -p 6379:6379 --name redis redis:7-alpine
docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq rabbitmq:3-management-alpine
```

2. **Install dependencies**
```powershell
npm install
```

3. **Start services** (separate terminals)
```powershell
# Terminal 1
npm run dev:gateway

# Terminal 2
npm run dev:auth

# Terminal 3
npm run dev:order

# Terminal 4
npm run dev:restaurant-service

# Terminal 5
npm run dev:delivery-service

# Terminal 6
npm run dev:payment

# Terminal 7
npm run dev:notification

# Terminal 8
npm run dev:sockets

# Terminal 9 (Celery)
cd backend/celery-worker
pip install -r requirements.txt
celery -A celery_app worker --loglevel=info

# Terminal 10 (Customer App)
npm run dev:customer
```

---

## Production Deployment

### Environment Variables

For production, update `.env` with:

```env
NODE_ENV=production

# Use strong secrets
JWT_SECRET=<generate-strong-secret-64-chars>
JWT_REFRESH_SECRET=<generate-strong-secret-64-chars>

# Production database
MONGODB_URI=mongodb://your-production-db:27017/smarteats

# Production Redis
REDIS_URL=redis://your-production-redis:6379

# Production RabbitMQ
RABBITMQ_URL=amqp://your-production-rabbitmq:5672

# Real Stripe keys
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key

# Real OAuth credentials
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Build for Production
```powershell
# Build all Docker images
docker-compose -f infrastructure/docker/docker-compose.yml build

# Start in production mode
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

---

## Monitoring

### Check Service Health
```powershell
# Create a health check script
$services = @(
  "http://localhost:4000/health",
  "http://localhost:4001/health",
  "http://localhost:4002/health",
  "http://localhost:4003/health",
  "http://localhost:4004/health",
  "http://localhost:4005/health",
  "http://localhost:4006/health"
)

foreach ($service in $services) {
  try {
    $response = Invoke-RestMethod -Uri $service
    Write-Host "✅ $($response.service): $($response.status)"
  } catch {
    Write-Host "❌ $service: FAILED"
  }
}
```

### View Resource Usage
```powershell
docker stats
```

---

## Backup & Restore

### Backup MongoDB
```powershell
docker exec mongodb mongodump --out /backup
docker cp mongodb:/backup ./mongodb-backup
```

### Restore MongoDB
```powershell
docker cp ./mongodb-backup mongodb:/backup
docker exec mongodb mongorestore /backup
```

---

## Scaling

### Scale Specific Services
```powershell
# Scale order service to 3 instances
docker-compose -f infrastructure/docker/docker-compose.yml up -d --scale order-service=3

# Scale delivery service to 2 instances
docker-compose -f infrastructure/docker/docker-compose.yml up -d --scale delivery-service=2
```

---

## Security Checklist

Before deploying to production:

- [ ] Change all default secrets in `.env`
- [ ] Use strong JWT secrets (64+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Enable Redis password
- [ ] Configure RabbitMQ users
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Review CORS origins
- [ ] Enable security headers
- [ ] Set up logging aggregation

---

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Check health endpoints
3. Review `QUICKSTART.md`
4. Review `README.md`
5. Check RabbitMQ management UI

---

**🎉 Your SmartEats ecosystem is ready to run!**
