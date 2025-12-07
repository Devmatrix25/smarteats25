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
    AdminDashboard: '/admin',
    AdminRestaurants: '/admin/restaurants',
    AdminDrivers: '/admin/drivers',
    AdminOrders: '/admin/orders',
    RestaurantDashboard: '/restaurant/dashboard',
    RestaurantOrders: '/restaurant/orders',
    RestaurantMenu: '/restaurant/menu',
    RestaurantSettings: '/restaurant/settings',
    RestaurantAnalytics: '/restaurant/analytics',
    RestaurantPromotions: '/restaurant/promotions',
    DriverDashboard: '/driver',
    DriverDeliveries: '/driver/deliveries',
    DriverEarnings: '/driver/earnings',
  };

  return routes[pageName] || '/';
}
