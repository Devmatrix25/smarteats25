import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Truck, Clock, DollarSign, Star, MapPin, Power,
  AlertCircle, CheckCircle, Navigation, Package, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import DriverOrderListener from "@/components/realtime/DriverOrderListener";
import NavigationPreference from "@/components/navigation/NavigationPreference";
import DriverAvailabilitySelector from "@/components/driver/DriverAvailabilitySelector";
import OrderBatching from "@/components/driver/OrderBatching";

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
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
      loadUser();
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleNewDelivery = (orders) => {
    queryClient.invalidateQueries(['available-orders']);
    refetchAvailable();
  };

  const handleOrderUpdate = (order) => {
    queryClient.invalidateQueries(['driver-orders']);
    refetch();
  };

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      loadDriver(userData.email);
    } catch (e) {
      navigate(createPageUrl("Index"));
    }
  };

  const loadDriver = async (email) => {
    try {
      const drivers = await base44.entities.Driver.filter({ email: email });
      if (drivers.length > 0) {
        setDriver(drivers[0]);
      }
    } catch (e) {
      console.log('No driver found');
    }
  };

  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['driver-orders', driver?.email],
    queryFn: () => base44.entities.Order.filter({ driver_email: driver.email }, '-created_date'),
    enabled: !!driver?.email,
    refetchInterval: 3000 // Real-time updates every 3 seconds
  });

  // Get available orders (ready for pickup, no driver assigned)
  const { data: availableOrders = [], refetch: refetchAvailable } = useQuery({
    queryKey: ['available-orders'],
    queryFn: async () => {
      const readyOrders = await base44.entities.Order.filter({ order_status: 'ready' });
      return readyOrders.filter(o => !o.driver_email);
    },
    enabled: !!driver && driver.status === 'approved' && driver.is_online,
    refetchInterval: 3000 // Real-time updates every 3 seconds
  });

  const toggleOnline = async () => {
    if (!driver) return;
    try {
      await base44.entities.Driver.update(driver.id, { is_online: !driver.is_online });
      setDriver({ ...driver, is_online: !driver.is_online });
      toast.success(driver.is_online ? "You're now offline" : "You're now online");
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const updateAvailability = async (status) => {
    if (!driver) return;
    try {
      await base44.entities.Driver.update(driver.id, { availability_status: status });
      setDriver({ ...driver, availability_status: status });
      const messages = {
        available: "You're now available for deliveries",
        on_break: "Taking a break - you won't receive new orders",
        unavailable: "You're now unavailable"
      };
      toast.success(messages[status]);
    } catch (e) {
      toast.error("Failed to update availability");
    }
  };

  const handleBatchAccept = () => {
    refetch();
    refetchAvailable();
  };

  const acceptDelivery = async (order) => {
    try {
      await base44.entities.Order.update(order.id, {
        driver_email: driver.email,
        driver_name: driver.name,
        driver_id: driver.id,
        order_status: 'picked_up'
      });
      await base44.entities.Driver.update(driver.id, { is_busy: true });
      setDriver({ ...driver, is_busy: true });
      toast.success("🎉 Delivery accepted! Go to Deliveries to start.");
      refetch();
      refetchAvailable();
      queryClient.invalidateQueries(['available-orders']);
    } catch (e) {
      toast.error("Failed to accept delivery");
    }
  };

  const todayDeliveries = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_date).toDateString() === today && o.order_status === 'delivered';
  });

  const todayEarnings = todayDeliveries.length * 50; // ₹50 per delivery
  const dailyTarget = 10;
  const dailyProgress = Math.min((todayDeliveries.length / dailyTarget) * 100, 100);

  const activeDelivery = orders.find(o => ['picked_up', 'on_the_way'].includes(o.order_status));

  // Show loading
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

  // Show registration form if no driver profile
  if (!driver) {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Become a Delivery Partner</h2>
          <p className="text-gray-500 mb-6">
            Join SmartEats and start earning by delivering food to customers
          </p>
          <Link to={createPageUrl("DriverDeliveries")}>
            <Button className="bg-green-600 hover:bg-green-700 rounded-xl">
              Register as Driver
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show pending approval - with auto-refresh to check status
  const { data: latestDriverData } = useQuery({
    queryKey: ['driver-status-check', driver?.email],
    queryFn: async () => {
      const drivers = await base44.entities.Driver.filter({ email: driver.email });
      return drivers[0];
    },
    enabled: !!driver?.email && driver?.status === 'pending',
    refetchInterval: 5000 // Check every 5 seconds if status changed
  });

  // Update driver state when status changes
  useEffect(() => {
    if (latestDriverData && latestDriverData.status !== driver?.status) {
      setDriver(latestDriverData);
      if (latestDriverData.status === 'approved') {
        toast.success("🎉 Your driver account has been approved!");
      }
    }
  }, [latestDriverData]);

  if (driver?.status === 'pending') {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Registration Under Review</h2>
          <p className="text-gray-500 mb-6">
            Your driver profile is being reviewed. This usually takes 24-48 hours.
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

  return (
    <div className="p-6">
      {/* Real-time order listener */}
      {driver?.email && (
        <DriverOrderListener 
          driverEmail={driver.email}
          isOnline={driver.is_online}
          onNewDelivery={handleNewDelivery}
          onOrderUpdate={handleOrderUpdate}
        />
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {driver.name}</h1>
            <p className="text-gray-500">Ready to deliver?</p>
          </div>
          <div className="flex items-center gap-4">
            {driver.is_online && (
              <DriverAvailabilitySelector
                currentStatus={driver.availability_status || 'available'}
                onStatusChange={updateAvailability}
                disabled={driver.is_busy}
              />
            )}
            <div className="flex items-center gap-2">
              <Power className={cn(
                "w-5 h-5",
                driver.is_online ? "text-green-600" : "text-gray-400"
              )} />
              <span className="text-sm font-medium">
                {driver.is_online ? "Online" : "Offline"}
              </span>
              <Switch
                checked={driver.is_online}
                onCheckedChange={toggleOnline}
              />
            </div>
          </div>
        </div>

        {/* Daily Challenge Card */}
        <Card className="mb-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Daily Challenge</h3>
                  <p className="text-sm text-gray-500">Complete {dailyTarget} deliveries</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{todayDeliveries.length}/{dailyTarget}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all"
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {dailyProgress >= 100 ? "🎉 Goal achieved! Bonus ₹200 earned!" : `${dailyTarget - todayDeliveries.length} more for ₹200 bonus`}
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Deliveries</p>
                  <p className="text-3xl font-bold">{todayDeliveries.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Earnings</p>
                  <p className="text-3xl font-bold">₹{todayEarnings}</p>
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
                  <p className="text-sm text-gray-500">Total Deliveries</p>
                  <p className="text-3xl font-bold">{driver.total_deliveries || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="text-3xl font-bold">{driver.average_rating?.toFixed(1) || "5.0"}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Delivery */}
        {activeDelivery && (
          <Card className="mb-8 border-2 border-green-500">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Truck className="w-5 h-5" />
                Active Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-lg">Order #{activeDelivery.order_number}</p>
                  <p className="text-gray-500">{activeDelivery.restaurant_name}</p>
                </div>
                <Badge className="bg-green-100 text-green-700">
                  {activeDelivery.order_status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Deliver to</p>
                    <p className="font-medium">{activeDelivery.customer_name}</p>
                    <p className="text-sm">{activeDelivery.delivery_address}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <NavigationPreference
                    latitude={activeDelivery.delivery_latitude || 12.9816}
                    longitude={activeDelivery.delivery_longitude || 77.6046}
                    address={activeDelivery.delivery_address}
                    driverEmail={driver?.email}
                  />
                </div>
                <Link to={`${createPageUrl("DriverDeliveries")}?active=${activeDelivery.id}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Batching - Smart grouping for multiple orders */}
        {driver.is_online && !activeDelivery && driver.availability_status !== 'on_break' && availableOrders.length > 0 && (
          <OrderBatching 
            orders={availableOrders}
            driver={driver}
            onAcceptBatch={handleBatchAccept}
            onAcceptSingle={acceptDelivery}
          />
        )}

        {/* Available Orders - Simple view when batching not applicable */}
        {driver.is_online && !activeDelivery && driver.availability_status !== 'on_break' && availableOrders.length === 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Available Deliveries</span>
                <Badge variant="outline">0 available</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No deliveries available right now</p>
                <p className="text-sm">New orders will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* On Break Message */}
        {driver.is_online && driver.availability_status === 'on_break' && !activeDelivery && (
          <Card className="mb-8 border-2 border-yellow-300">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                ☕
              </div>
              <h3 className="text-lg font-semibold mb-2">You're On Break</h3>
              <p className="text-gray-500 mb-4">You won't receive new delivery requests</p>
              <Button 
                className="bg-green-600 hover:bg-green-700 rounded-xl"
                onClick={() => updateAvailability('available')}
              >
                Resume Deliveries
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Offline Message */}
        {!driver.is_online && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Power className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">You're Offline</h3>
              <p className="text-gray-500 mb-4">Go online to start receiving delivery requests</p>
              <Button 
                className="bg-green-600 hover:bg-green-700 rounded-xl"
                onClick={toggleOnline}
              >
                Go Online
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Deliveries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Deliveries</CardTitle>
            <Link to={createPageUrl("DriverDeliveries")}>
              <Button variant="outline" size="sm" className="rounded-xl">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : orders.filter(o => o.order_status === 'delivered').length > 0 ? (
              <div className="space-y-4">
                {orders.filter(o => o.order_status === 'delivered').slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.created_date), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-700">Delivered</Badge>
                      <p className="text-sm text-gray-500 mt-1">+₹50</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No deliveries yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}