# Frontend Migration Guide

This guide explains how to migrate the existing React frontend into 4 separate applications.

## Overview

The current `src/` directory contains all UI for customer, restaurant, driver, and admin interfaces. We need to split this into 4 separate apps while preserving the existing UI design.

## Migration Strategy

### 1. Customer App (`apps/customer-app/`)

**Pages to migrate:**
- Index.jsx (landing page)
- Home.jsx
- Search.jsx
- Restaurants.jsx
- Restaurant.jsx
- Cart.jsx
- Orders.jsx
- OrderTracking.jsx
- Profile.jsx
- Settings.jsx
- Addresses.jsx
- Favorites.jsx
- Rewards.jsx
- FlavorLens.jsx

**Components to migrate:**
- All from `components/ui/` (shared UI components)
- All from `components/home/`
- All from `components/cart/`
- All from `components/orders/`
- All from `components/tracking/`
- All from `components/ai/`
- All from `components/loyalty/`
- All from `components/reviews/`
- All from `components/search/`
- All from `components/address/`
- All from `components/navigation/`
- All from `components/chat/`
- All from `components/realtime/`

**Steps:**
1. Copy the entire `src/` directory to `apps/customer-app/src/`
2. Remove admin, restaurant, and driver pages
3. Update `App.jsx` to only include customer routes
4. Update API calls to use new backend endpoints
5. Add WebSocket integration
6. Add state management (Zustand)

### 2. Restaurant App (`apps/restaurant-app/`)

**Pages to migrate:**
- RestaurantDashboard.jsx
- RestaurantOrders.jsx
- RestaurantMenu.jsx
- RestaurantSettings.jsx
- RestaurantAnalytics.jsx
- RestaurantPromotions.jsx

**Components to migrate:**
- `components/ui/` (shared)
- `components/restaurant/`

**Steps:**
1. Create new React app structure
2. Copy restaurant pages and components
3. Copy shared UI components
4. Create new `App.jsx` with restaurant routes
5. Implement authentication flow
6. Add WebSocket for real-time order notifications

### 3. Delivery App (`apps/delivery-app/`)

**Pages to migrate:**
- DriverDashboard.jsx
- DriverDeliveries.jsx
- DriverEarnings.jsx

**Components to migrate:**
- `components/ui/` (shared)
- `components/driver/`
- `components/delivery/`

**Steps:**
1. Create new React app structure
2. Copy driver pages and components
3. Copy shared UI components
4. Implement live location tracking
5. Add WebSocket for real-time assignments

### 4. Admin App (`apps/admin-app/`)

**Pages to migrate:**
- AdminDashboard.jsx
- AdminRestaurants.jsx
- AdminDrivers.jsx
- AdminOrders.jsx

**Components to migrate:**
- `components/ui/` (shared)

**New features to add:**
- Disputes management module
- Coupon management
- System metrics dashboard

## Shared Dependencies

All apps will share:
- Tailwind CSS configuration
- shadcn/ui components
- Common utilities
- API client configuration

## API Integration Changes

### Before (Base44):
```javascript
import { base44Client } from './api/base44Client';
const restaurants = await base44Client.query('Restaurant').find();
```

### After (New Backend):
```javascript
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_GATEWAY_URL;
const restaurants = await axios.get(`${API_URL}/api/restaurants`);
```

## WebSocket Integration

Add to each app:

```javascript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_SERVER_URL, {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

// Join rooms
socket.emit('join:order', orderId);

// Listen for updates
socket.on('order:status_updated', (data) => {
  // Update UI
});
```

## State Management

Use Zustand for simple, scalable state management:

```javascript
import create from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null })
}));
```

## Migration Checklist

### Customer App
- [ ] Copy source files
- [ ] Remove non-customer pages
- [ ] Update routes
- [ ] Replace Base44 API calls
- [ ] Add WebSocket integration
- [ ] Add state management
- [ ] Test all flows

### Restaurant App
- [ ] Create app structure
- [ ] Copy restaurant pages
- [ ] Copy shared components
- [ ] Update routes
- [ ] Replace API calls
- [ ] Add WebSocket
- [ ] Test all flows

### Delivery App
- [ ] Create app structure
- [ ] Copy driver pages
- [ ] Copy shared components
- [ ] Update routes
- [ ] Replace API calls
- [ ] Add location tracking
- [ ] Add WebSocket
- [ ] Test all flows

### Admin App
- [ ] Create app structure
- [ ] Copy admin pages
- [ ] Copy shared components
- [ ] Add new features
- [ ] Update routes
- [ ] Replace API calls
- [ ] Add WebSocket
- [ ] Test all flows

## Important Notes

1. **DO NOT** change the UI design, styling, or user flows
2. **DO** preserve all existing components exactly as they are
3. **DO** update only the data fetching logic
4. **DO** add real-time features where appropriate
5. **DO** ensure all apps use the same Tailwind configuration

## Testing Strategy

For each app:
1. Verify all pages render correctly
2. Test authentication flow
3. Test data fetching from new APIs
4. Test real-time updates
5. Test responsive design
6. Test all user interactions

## Next Steps

1. Start with Customer App (largest and most complex)
2. Then Restaurant App
3. Then Delivery App
4. Finally Admin App

Each app should be fully functional before moving to the next.
