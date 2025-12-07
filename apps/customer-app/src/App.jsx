import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';

// Import customer pages only
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout currentPageName="Index"><Index /></Layout>} />
        <Route path="/home" element={<Layout currentPageName="Home"><Home /></Layout>} />
        <Route path="/search" element={<Layout currentPageName="Search"><Search /></Layout>} />
        <Route path="/restaurant/:id" element={<Layout currentPageName="Restaurant"><Restaurant /></Layout>} />
        <Route path="/restaurants" element={<Layout currentPageName="Restaurants"><Restaurants /></Layout>} />
        <Route path="/cart" element={<Layout currentPageName="Cart"><Cart /></Layout>} />
        <Route path="/orders" element={<Layout currentPageName="Orders"><Orders /></Layout>} />
        <Route path="/order-tracking/:id" element={<Layout currentPageName="OrderTracking"><OrderTracking /></Layout>} />
        <Route path="/profile" element={<Layout currentPageName="Profile"><Profile /></Layout>} />
        <Route path="/settings" element={<Layout currentPageName="Settings"><Settings /></Layout>} />
        <Route path="/addresses" element={<Layout currentPageName="Addresses"><Addresses /></Layout>} />
        <Route path="/favorites" element={<Layout currentPageName="Favorites"><Favorites /></Layout>} />
        <Route path="/rewards" element={<Layout currentPageName="Rewards"><Rewards /></Layout>} />
        <Route path="/flavor-lens" element={<Layout currentPageName="FlavorLens"><FlavorLens /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
