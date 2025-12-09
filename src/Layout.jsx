import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useAuth } from "./contexts/AuthContext";
import {
  Home, Search, ShoppingCart, User, Clock, MapPin,
  ChevronDown, Bell, Menu, X, LogOut, Settings,
  Store, Truck, Shield, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import OrderStatusListener from "@/components/realtime/OrderStatusListener";

export default function Layout({ children, currentPageName }) {
  const { user, logout: authLogout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadCart();
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user]);

  const loadCart = async () => {
    try {
      if (user?.email) {
        const carts = await base44.entities.Cart.filter({ customer_email: user.email });
        if (carts.length > 0 && carts[0].items) {
          setCartCount(carts[0].items.reduce((acc, item) => acc + item.quantity, 0));
        }
      }
    } catch (e) {
      console.log('Cart not loaded');
    }
  };

  const handleLogout = async () => {
    await authLogout();
  };

  // Admin pages
  const adminPages = ['AdminDashboard', 'AdminRestaurants', 'AdminDrivers', 'AdminOrders'];
  const restaurantPages = ['RestaurantDashboard', 'RestaurantOrders', 'RestaurantMenu', 'RestaurantSettings', 'RestaurantAnalytics', 'RestaurantPromotions'];
  const driverPages = ['DriverDashboard', 'DriverDeliveries', 'DriverEarnings'];

  const isAdminPage = adminPages.includes(currentPageName);
  const isRestaurantPage = restaurantPages.includes(currentPageName);
  const isDriverPage = driverPages.includes(currentPageName);

  // Hide layout for auth pages and landing page
  const hideLayout = ['Login', 'Register', 'RegisterRestaurant', 'RegisterDriver', 'Index'].includes(currentPageName);
  if (hideLayout) return children;

  // Dashboard Navigation Component
  const DashboardNav = ({ type }) => {
    const navItems = {
      admin: [
        { name: 'Dashboard', page: 'AdminDashboard', icon: Home },
        { name: 'Restaurants', page: 'AdminRestaurants', icon: Store },
        { name: 'Drivers', page: 'AdminDrivers', icon: Truck },
        { name: 'Orders', page: 'AdminOrders', icon: ShoppingCart },
      ],
      restaurant: [
        { name: 'Dashboard', page: 'RestaurantDashboard', icon: Home },
        { name: 'Orders', page: 'RestaurantOrders', icon: ShoppingCart },
        { name: 'Menu', page: 'RestaurantMenu', icon: Menu },
        { name: 'Analytics', page: 'RestaurantAnalytics', icon: Settings },
        { name: 'Promotions', page: 'RestaurantPromotions', icon: Settings },
      ],
      driver: [
        { name: 'Dashboard', page: 'DriverDashboard', icon: Home },
        { name: 'Deliveries', page: 'DriverDeliveries', icon: Truck },
        { name: 'Earnings', page: 'DriverEarnings', icon: Clock },
      ]
    };

    const items = navItems[type] || [];
    const titles = { admin: 'Admin Panel', restaurant: 'Restaurant Partner', driver: 'Delivery Partner' };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#F25C23] to-[#D94A18] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                  <span className="font-bold text-xl text-[#1D1D1F]">Smart</span>
                  <span className="font-bold text-xl text-[#F25C23]">Eats</span>
                  <p className="text-xs text-gray-500 -mt-1">{titles[type]}</p>
                </div>
              </Link>

              {/* Nav Items - Desktop */}
              <nav className="hidden md:flex items-center gap-1">
                {items.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                      currentPageName === item.page
                        ? "bg-[#F25C23] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>

              {/* Right Side */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF4D4F] rounded-full text-[10px] text-white flex items-center justify-center">3</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F25C23] to-[#FFC043] flex items-center justify-center text-white font-medium">
                        {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium">{user?.profile?.firstName} {user?.profile?.lastName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around py-2">
            {items.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg",
                  currentPageName === item.page ? "text-[#F25C23]" : "text-gray-500"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="pb-20 md:pb-0">
          {children}
        </main>
      </div>
    );
  };

  // Return dashboard layout for partner/admin pages
  if (isAdminPage) return <DashboardNav type="admin">{children}</DashboardNav>;
  if (isRestaurantPage) return <DashboardNav type="restaurant">{children}</DashboardNav>;
  if (isDriverPage) return <DashboardNav type="driver">{children}</DashboardNav>;

  // Customer App Layout
  return (
    <div className="min-h-screen bg-[#FFF7F2]">
      {/* Real-time order status listener for customers */}
      {user?.email && (
        <OrderStatusListener
          userEmail={user.email}
          onStatusChange={(order) => {
            // Could navigate to tracking or show modal
          }}
        />
      )}

      <style>{`
        :root {
          --primary: #F25C23;
          --primary-dark: #D94A18;
          --accent-yellow: #FFC043;
          --success: #3BA55D;
          --error: #FF4D4F;
          --charcoal: #1D1D1F;
          --slate: #2C2C2E;
          --soft-white: #F7F7F7;
          --cream: #FFF7F2;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Top Header */}
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white shadow-md" : "bg-[#FFF7F2]"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#F25C23] to-[#D94A18] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-[#1D1D1F]">Smart</span>
                <span className="font-bold text-xl text-[#F25C23]">Eats</span>
              </div>
            </Link>

            {/* Location Selector - Desktop */}
            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-[#F25C23] transition-all">
              <MapPin className="w-4 h-4 text-[#F25C23]" />
              <span className="text-sm font-medium text-gray-700 max-w-[200px] truncate">
                Bangalore, Karnataka
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Search Bar - Desktop */}
            <Link
              to={createPageUrl("Search")}
              className="hidden lg:flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-[#F25C23] transition-all w-96"
            >
              <Search className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">Search for restaurants or dishes...</span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search - Mobile */}
              <Link to={createPageUrl("Search")} className="lg:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-orange-50">
                  <Search className="w-5 h-5 text-gray-600" />
                </Button>
              </Link>

              {user ? (
                <>
                  {/* Cart */}
                  <Link to={createPageUrl("Cart")}>
                    <Button variant="ghost" size="icon" className="relative hover:bg-orange-50">
                      <ShoppingCart className="w-5 h-5 text-gray-600" />
                      {cartCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-[#F25C23] text-white text-xs">
                          {cartCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 hover:bg-orange-50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F25C23] to-[#FFC043] flex items-center justify-center text-white font-medium">
                          {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <span className="hidden sm:inline text-sm font-medium text-gray-700">
                          {user?.profile?.firstName || 'User'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b">
                        <p className="font-medium text-gray-900">{user?.profile?.firstName} {user?.profile?.lastName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Orders")} className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          My Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Favorites")} className="flex items-center">
                          <Heart className="w-4 h-4 mr-2" />
                          Favorites
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Addresses")} className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          Addresses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.role === 'admin' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("AdminDashboard")} className="flex items-center text-purple-600">
                              <Shield className="w-4 h-4 mr-2" />
                              Admin Panel
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 md:pb-8">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-pb">
        <div className="flex justify-around py-2">
          {[
            { icon: Home, label: 'Home', page: 'Home' },
            { icon: Search, label: 'Search', page: 'Search' },
            { icon: ShoppingCart, label: 'Cart', page: 'Cart', badge: cartCount },
            { icon: Clock, label: 'Orders', page: 'Orders' },
            { icon: User, label: 'Profile', page: 'Profile' },
          ].map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative",
                currentPageName === item.page
                  ? "text-[#F25C23]"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  "w-6 h-6 transition-all",
                  currentPageName === item.page && "scale-110"
                )} />
                {item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-4 h-4 p-0 flex items-center justify-center bg-[#F25C23] text-white text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {currentPageName === item.page && (
                <div className="absolute -bottom-2 w-1 h-1 bg-[#F25C23] rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}