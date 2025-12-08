# 🚀 SmartEats Deployment Checklist

## Production URLs

| Service | URL | Platform |
|---------|-----|----------|
| **Frontend** | https://smarteats25.vercel.app | Vercel |
| **Frontend** | https://smarteats25-customer-app.vercel.app | Vercel |
| **API Gateway** | https://smarteats12.onrender.com | Render |
| **Auth Service** | https://smarteats-auth.onrender.com | Render |
| **Database** | MongoDB Atlas (smarteats25 cluster) | Cloud |
| **Cache** | Redis Cloud | Cloud |

---

## ✅ Deployment Status

### Vercel (Frontend)
- [x] smarteats25.vercel.app deployed
- [x] smarteats25-customer-app.vercel.app deployed
- [x] VITE_API_URL configured
- [x] VITE_GOOGLE_CLIENT_ID configured

### Render (Backend)
- [x] API Gateway (smarteats12) deployed
- [x] Auth Service (smarteats-auth) deployed
- [x] CORS configured for Vercel domains
- [x] JWT secrets configured
- [x] MongoDB connection configured
- [x] Redis connection configured

### UptimeRobot (Keep Awake)
- [x] Monitor for API Gateway: `https://smarteats12.onrender.com/health`
- [x] Monitor for Auth Service: `https://smarteats-auth.onrender.com/health`
- [x] Interval: 5 minutes

---

## 🔧 Environment Variables

### Vercel Environment Variables
```
VITE_API_URL=https://smarteats12.onrender.com/api
VITE_GOOGLE_CLIENT_ID=293796254086-i14b1kkqu7gmkl4os0muo8vhnicdl18i.apps.googleusercontent.com
```

### Render - API Gateway (smarteats12)
```
PORT=4000
AUTH_SERVICE_URL=https://smarteats-auth.onrender.com
ORDER_SERVICE_URL=http://localhost:4002
RESTAURANT_SERVICE_URL=http://localhost:4003
DELIVERY_SERVICE_URL=http://localhost:4004
PAYMENT_SERVICE_URL=http://localhost:4005
NOTIFICATION_SERVICE_URL=http://localhost:4006
CORS_ORIGIN=https://smarteats25.vercel.app,https://smarteats25-customer-app.vercel.app,http://localhost:5173,http://localhost:3000
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-jwt-refresh-secret>
REDIS_URL=<your-redis-url>
```

### Render - Auth Service (smarteats-auth)
```
PORT=4001
NODE_ENV=production
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-jwt-refresh-secret>
```

---

## 📱 Features Working in Production

| Feature | Status | Notes |
|---------|--------|-------|
| Demo Login (all 4 roles) | ✅ Works | Uses mock data |
| Real Registration | ✅ Works | Auth Service deployed |
| Real Login | ✅ Works | Auth Service deployed |
| Google OAuth | ✅ Works | VITE_GOOGLE_CLIENT_ID set |
| Browse Restaurants | ✅ Works | Mock data fallback |
| View Menu Items | ✅ Works | Mock data fallback |
| FlavorLens AI | ✅ Works | Direct Gemini API |
| AI Chat Assistant | ✅ Works | Direct Mistral API |
| Real Order Placement | ⚠️ Demo Only | Order Service not deployed |
| Real-time Tracking | ⚠️ Demo Only | WebSocket simulated |

---

## 🆓 Free Tier Services Used

| Service | Free Tier Limits |
|---------|------------------|
| **Vercel** | Unlimited deployments, 100GB bandwidth/month |
| **Render** | 750 hours/month, sleeps after 15min inactivity |
| **MongoDB Atlas** | 512MB storage, M0 cluster |
| **Redis Cloud** | 30MB, 1 database |
| **UptimeRobot** | 50 monitors, 5-min intervals |

---

## 🛠️ How to Redeploy

### Frontend (Vercel)
Push to GitHub → Auto-deploys

### Backend (Render)
Push to GitHub → Auto-deploys

---

## 📝 Last Updated
December 8, 2025
