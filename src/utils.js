// Utility function to create page URLs
export function createPageUrl(pageName) {
  const routes = {
    Index: '/',
    Home: '/home',
    Search: '/search',
    Restaurant: '/restaurant',
    Restaurants: '/restaurants',
    Cart: '/cart',
    Orders: '/orders',
    OrderTracking: '/order-tracking',
    Profile: '/profile',
    Settings: '/settings',
    Addresses: '/addresses',
    Favorites: '/favorites',
    Rewards: '/rewards',
    FlavorLens: '/flavor-lens',
    Support: '/support',
    AdminDashboard: '/admin',
    AdminRestaurants: '/admin/restaurants',
    AdminDrivers: '/admin/drivers',
    AdminOrders: '/admin/orders',
    AdminSupport: '/admin/support',
    RestaurantDashboard: '/restaurant/dashboard',
    RestaurantOrders: '/restaurant/orders',
    RestaurantMenu: '/restaurant/menu',
    RestaurantSettings: '/restaurant/settings',
    RestaurantAnalytics: '/restaurant/analytics',
    RestaurantPromotions: '/restaurant/promotions',
    RestaurantSupport: '/restaurant/support',
    DriverDashboard: '/driver',
    DriverDeliveries: '/driver/deliveries',
    DriverEarnings: '/driver/earnings',
    DriverSupport: '/driver/support',
  };

  return routes[pageName] || '/';
}
