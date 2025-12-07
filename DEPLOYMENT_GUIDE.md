# 🚀 SMART-EATS Deployment Guide

## Quick Deployment Steps

### Frontend → Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Configure deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com) → New Project
   - Import your GitHub repository
   - Vercel auto-detects `vercel.json` settings
   - Add Environment Variables:
     | Variable | Value |
     |----------|-------|
     | `VITE_API_URL` | `https://smarteats-api.onrender.com/api` |
     | `VITE_MISTRAL_API_KEY` | Your Mistral key |
     | `VITE_GEMINI_API_KEY` | Your Gemini key |
   - Click **Deploy**

---

### Backend → Render

1. **Deploy on Render**
   - Go to [render.com](https://render.com) → Dashboard
   - Click **New** → **Blueprint**
   - Connect your GitHub repository
   - Render reads `render.yaml` automatically
   - Set Environment Variables for **each service**:

2. **Required Environment Variables** (set in Render Dashboard):

   **All Services:**
   | Variable | Value (from your .env) |
   |----------|------------------------|
   | `MONGODB_URI` | `mongodb+srv://SmartEatsTeam:...` |
   | `JWT_SECRET` | Your JWT secret |
   | `JWT_REFRESH_SECRET` | Your refresh secret |

   **API Gateway (additional):**
   | Variable | Value |
   |----------|-------|
   | `REDIS_URL` | Your Redis URL |
   | `CORS_ORIGIN` | Your Vercel URL |

   **Payment Service (additional):**
   | Variable | Value |
   |----------|-------|
   | `STRIPE_SECRET_KEY` | Your Stripe key |

3. Click **Apply** → Wait for all services to deploy

---

## After Deployment

1. **Update Frontend**: Change `VITE_API_URL` to your actual Render API Gateway URL
2. **Test**: Visit your Vercel URL and test login/registration
3. **CORS**: Update `CORS_ORIGIN` in API Gateway with your Vercel URL

---

## Deployed URLs (Example)

| Service | URL |
|---------|-----|
| Frontend | `https://smarteats-xxx.vercel.app` |
| API Gateway | `https://smarteats-api.onrender.com` |
