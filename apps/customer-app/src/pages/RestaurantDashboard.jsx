import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  TrendingUp, ShoppingCart, Clock, DollarSign,
  AlertCircle, CheckCircle, Package, Star, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import RestaurantOrderListener from "@/components/realtime/RestaurantOrderListener";

export default function RestaurantDashboard() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl("Index"));
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
      loadRestaurant(userData.email);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleNewOrder = () => {
    queryClient.invalidateQueries(['restaurant-orders']);
    refetch();
  };

  const loadRestaurant = async (email) => {
    try {
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
      }
    } catch (e) {
      console.log('No restaurant found');
    }
  };

  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['restaurant-orders', restaurant?.id],
    queryFn: () => base44.entities.Order.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
    refetchInterval: 3000 // Real-time updates every 3 seconds
  });

  // Check for restaurant status updates (pending -> approved)
  const { data: latestRestaurantData } = useQuery({
    queryKey: ['restaurant-status-check', restaurant?.id],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: user?.email });
      return restaurants[0];
    },
    enabled: !!restaurant?.id && restaurant?.status === 'pending',
    refetchInterval: 5000
  });

  useEffect(() => {
    if (latestRestaurantData && latestRestaurantData.status !== restaurant?.status) {
      setRestaurant(latestRestaurantData);
      if (latestRestaurantData.status === 'approved') {
        toast.success("🎉 Your restaurant has been approved!");
      }
    }
  }, [latestRestaurantData]);

  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_date).toDateString() === today;
  });

  const pendingOrders = orders.filter(o => ['placed', 'confirmed'].includes(o.order_status));
  const preparingOrders = orders.filter(o => o.order_status === 'preparing');
  const completedToday = todayOrders.filter(o => o.order_status === 'delivered');

  const todayRevenue = todayOrders
    .filter(o => o.order_status !== 'cancelled')
    .reduce((acc, o) => acc + (o.total_amount || 0), 0);

  // Show loading or registration form if no restaurant
  if (isAuthLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-[#F25C23]" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Become a Restaurant Partner</h2>
          <p className="text-gray-500 mb-6">
            Register your restaurant to start receiving orders from SmartEats customers
          </p>
          <Link to={createPageUrl("RestaurantSettings")}>
            <Button className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
              Register Your Restaurant
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show pending approval message with auto-refresh
  if (restaurant.status === 'pending') {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Registration Under Review</h2>
          <p className="text-gray-500 mb-6">
            Your restaurant "{restaurant.name}" is being reviewed by our team. 
            This usually takes 24-48 hours.
          </p>
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            Pending Approval
          </Badge>
          <p className="text-sm text-gray-400 mt-4">
            This page will update automatically when approved
          </p>
        </div>
      </div>
    );
  }

  if (restaurant.status === 'rejected') {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Registration Rejected</h2>
          <p className="text-gray-500 mb-6">
            Unfortunately, your registration was not approved. Please contact support for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Real-time order listener */}
      {restaurant?.id && (
        <RestaurantOrderListener 
          restaurantId={restaurant.id}
          onNewOrder={handleNewOrder}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p className="text-gray-500">Welcome back! Here's your dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(
              restaurant.is_open 
                ? "bg-green-100 text-green-700" 
                : "bg-gray-100 text-gray-700"
            )}>
              {restaurant.is_open ? "Open" : "Closed"}
            </Badge>
            <Badge className="bg-blue-100 text-blue-700">
              <Star className="w-3 h-3 mr-1" />
              {restaurant.average_rating?.toFixed(1) || "4.0"}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Orders</p>
                  <p className="text-3xl font-bold">{todayOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Revenue</p>
                  <p className="text-3xl font-bold">₹{todayRevenue}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Orders</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Preparing</p>
                  <p className="text-3xl font-bold text-purple-600">{preparingOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link to={createPageUrl("RestaurantOrders")}>
              <Button variant="outline" size="sm" className="rounded-xl">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map(order => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-500">
                        {order.items?.length} items • {format(new Date(order.created_date), "h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{order.total_amount}</p>
                      <Badge className={cn(
                        "mt-1",
                        order.order_status === 'placed' && "bg-blue-100 text-blue-700",
                        order.order_status === 'confirmed' && "bg-blue-100 text-blue-700",
                        order.order_status === 'preparing' && "bg-yellow-100 text-yellow-700",
                        order.order_status === 'ready' && "bg-purple-100 text-purple-700",
                        order.order_status === 'delivered' && "bg-green-100 text-green-700",
                        order.order_status === 'cancelled' && "bg-red-100 text-red-700"
                      )}>
                        {order.order_status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No orders yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}