import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './Layout.jsx';

// Import all pages
import Index from './pages/Index';
import Home from './pages/Home';
import Search from './pages/Search';
import Restaurant from './pages/Restaurant';
import Restaurants from './pages/Restaurants';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Addresses from './pages/Addresses';
import Favorites from './pages/Favorites';
import Rewards from './pages/Rewards';
import FlavorLens from './pages/FlavorLens';
import Support from './pages/Support';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterRestaurant from './pages/RegisterRestaurant';
import RegisterDriver from './pages/RegisterDriver';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminRestaurants from './pages/AdminRestaurants';
import AdminDrivers from './pages/AdminDrivers';
import AdminOrders from './pages/AdminOrders';
import AdminSupport from './pages/AdminSupport';

// Restaurant Pages
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantOrders from './pages/RestaurantOrders';
import RestaurantMenu from './pages/RestaurantMenu';
import RestaurantSettings from './pages/RestaurantSettings';
import RestaurantAnalytics from './pages/RestaurantAnalytics';
import RestaurantPromotions from './pages/RestaurantPromotions';
import RestaurantSupport from './pages/RestaurantSupport';

// Driver Pages
import DriverDashboard from './pages/DriverDashboard';
import DriverDeliveries from './pages/DriverDeliveries';
import DriverEarnings from './pages/DriverEarnings';
import DriverSupport from './pages/DriverSupport';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WebSocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout currentPageName="Index"><Index /></Layout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/restaurant" element={<RegisterRestaurant />} />
            <Route path="/register/driver" element={<RegisterDriver />} />

            {/* Protected Customer Routes */}
            <Route path="/home" element={<ProtectedRoute><Layout currentPageName="Home"><Home /></Layout></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Layout currentPageName="Search"><Search /></Layout></ProtectedRoute>} />
            <Route path="/restaurant/:id" element={<ProtectedRoute><Layout currentPageName="Restaurant"><Restaurant /></Layout></ProtectedRoute>} />
            <Route path="/restaurant" element={<ProtectedRoute><Layout currentPageName="Restaurant"><Restaurant /></Layout></ProtectedRoute>} />
            <Route path="/restaurants" element={<ProtectedRoute><Layout currentPageName="Restaurants"><Restaurants /></Layout></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Layout currentPageName="Cart"><Cart /></Layout></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Layout currentPageName="Orders"><Orders /></Layout></ProtectedRoute>} />
            <Route path="/order-tracking/:id" element={<ProtectedRoute><Layout currentPageName="OrderTracking"><OrderTracking /></Layout></ProtectedRoute>} />
            <Route path="/order-tracking" element={<ProtectedRoute><Layout currentPageName="OrderTracking"><OrderTracking /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout currentPageName="Profile"><Profile /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout currentPageName="Settings"><Settings /></Layout></ProtectedRoute>} />
            <Route path="/addresses" element={<ProtectedRoute><Layout currentPageName="Addresses"><Addresses /></Layout></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Layout currentPageName="Favorites"><Favorites /></Layout></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><Layout currentPageName="Rewards"><Rewards /></Layout></ProtectedRoute>} />
            <Route path="/flavor-lens" element={<ProtectedRoute><Layout currentPageName="FlavorLens"><FlavorLens /></Layout></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Layout currentPageName="Support"><Support /></Layout></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><Layout currentPageName="AdminDashboard"><AdminDashboard /></Layout></ProtectedRoute>} />
            <Route path="/admin/restaurants" element={<ProtectedRoute role="admin"><Layout currentPageName="AdminRestaurants"><AdminRestaurants /></Layout></ProtectedRoute>} />
            <Route path="/admin/drivers" element={<ProtectedRoute role="admin"><Layout currentPageName="AdminDrivers"><AdminDrivers /></Layout></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute role="admin"><Layout currentPageName="AdminOrders"><AdminOrders /></Layout></ProtectedRoute>} />
            <Route path="/admin/support" element={<ProtectedRoute role="admin"><Layout currentPageName="AdminSupport"><AdminSupport /></Layout></ProtectedRoute>} />

            {/* Restaurant Routes */}
            <Route path="/restaurant/dashboard" element={<ProtectedRoute role="restaurant"><Layout currentPageName="RestaurantDashboard"><RestaurantDashboard /></Layout></ProtectedRoute>} />
            <Route path="/restaurant/orders" element={<ProtectedRoute role="restaurant"><Layout currentPageName="RestaurantOrders"><RestaurantOrders /></Layout></ProtectedRoute>} />
            <Route path="/restaurant/menu" element={<ProtectedRoute role="restaurant"><Layout currentPageName="RestaurantMenu"><RestaurantMenu /></Layout></ProtectedRoute>} />
            <Route path="/restaurant/settings" element={<ProtectedRoute role="restaurant"><Layout currentPageName="RestaurantSettings"><RestaurantSettings /></Layout></ProtectedRoute>} />
            <Route path="/restaurant/analytics" element={<ProtectedRoute role="restaurant"><Layout currentPageName="RestaurantAnalytics"><RestaurantAnalytics /></Layout></ProtectedRoute>} />
            <Route path="/restaurant/promotions" element={<ProtectedRoute role="restaurant"><Layout currentPageName="RestaurantPromotions"><RestaurantPromotions /></Layout></ProtectedRoute>} />
            <Route path="/restaurant/support" element={<ProtectedRoute role="restaurant"><Layout currentPageName="RestaurantSupport"><RestaurantSupport /></Layout></ProtectedRoute>} />

            {/* Driver Routes */}
            <Route path="/driver" element={<ProtectedRoute role="driver"><Layout currentPageName="DriverDashboard"><DriverDashboard /></Layout></ProtectedRoute>} />
            <Route path="/driver/deliveries" element={<ProtectedRoute role="driver"><Layout currentPageName="DriverDeliveries"><DriverDeliveries /></Layout></ProtectedRoute>} />
            <Route path="/driver/earnings" element={<ProtectedRoute role="driver"><Layout currentPageName="DriverEarnings"><DriverEarnings /></Layout></ProtectedRoute>} />
            <Route path="/driver/support" element={<ProtectedRoute role="driver"><Layout currentPageName="DriverSupport"><DriverSupport /></Layout></ProtectedRoute>} />
          </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
