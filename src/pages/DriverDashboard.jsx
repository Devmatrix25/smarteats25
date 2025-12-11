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
import DriverStats from "@/components/driver/DriverStats";


export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ALL HOOKS MUST BE AT TOP - before any conditional returns
  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['driver-orders', driver?.email],
    queryFn: () => base44.entities.Order.filter({ driver_email: driver.email }, '-created_date'),
    enabled: !!driver?.email,
    staleTime: 30000 // Cache for 30 seconds
  });

  const { data: availableOrders = [], refetch: refetchAvailable } = useQuery({
    queryKey: ['available-orders'],
    queryFn: async () => {
      const readyOrders = await base44.entities.Order.filter({ order_status: 'ready' });
      return readyOrders.filter(o => !o.driver_email);
    },
    enabled: !!driver && driver.status === 'approved' && driver.is_online,
    staleTime: 30000
  });

  const { data: latestDriverData } = useQuery({
    queryKey: ['driver-status-check', driver?.email],
    queryFn: async () => {
      const drivers = await base44.entities.Driver.filter({ email: driver.email });
      return drivers[0];
    },
    enabled: !!driver?.email && driver?.status === 'pending',
    staleTime: 30000
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (latestDriverData && latestDriverData.status !== driver?.status) {
      setDriver(latestDriverData);
      if (latestDriverData.status === 'approved') {
        toast.success("🎉 Your driver account has been approved!");
      }
    }
  }, [latestDriverData]);

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

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      loadDriver(userData);
    } catch (e) {
      navigate(createPageUrl("Index"));
    }
  };

  const loadDriver = async (userData) => {
    const email = userData.email;
    const isFlashman = email === 'flashman@smarteats.com';

    try {
      // Try to find existing driver record
      const drivers = await base44.entities.Driver.filter({ email: email });

      if (drivers.length > 0) {
        const existingDriver = drivers[0];

        // For Flashman, ensure status is always approved
        if (isFlashman && existingDriver.status !== 'approved') {
          const updatedDriver = await base44.entities.Driver.update(existingDriver.id, {
            status: 'approved',
            is_online: true,
            is_available: true
          });
          setDriver({ ...existingDriver, ...updatedDriver, status: 'approved', is_online: true });
          toast.success(`Welcome back Flashman! ⚡🚀`);
        } else {
          setDriver(existingDriver);
        }
      } else {
        // Create new driver record
        console.log('Creating new driver record for:', email);

        const newDriver = await base44.entities.Driver.create({
          name: isFlashman ? 'Flashman' : (userData.full_name || userData.profile?.firstName || email.split('@')[0]),
          email: email,
          phone: isFlashman ? '+91 99999 88888' : (userData.phone || ''),
          vehicle_type: isFlashman ? 'Motorcycle' : 'bike',
          vehicle_number: isFlashman ? 'KA-01-FL-0001' : '',
          license_number: isFlashman ? 'DL-FLASH-2024' : '',
          city: 'Bangalore',
          status: isFlashman ? 'approved' : 'pending',
          is_online: isFlashman,
          is_available: isFlashman,
          is_busy: false,
          average_rating: isFlashman ? 4.9 : 0,
          total_deliveries: isFlashman ? 150 : 0,
          total_earnings: isFlashman ? 7500 : 0,
          current_latitude: 12.9716,
          current_longitude: 77.5946
        });

        setDriver(newDriver);

        if (isFlashman) {
          toast.success(`Welcome Flashman! ⚡🚀 Ready to deliver!`);
        } else {
          toast.info("Your driver profile has been created and is pending admin approval.");
        }
      }
    } catch (e) {
      console.error('Driver load error:', e.message);

      // For Flashman, create a fallback driver object so dashboard still works
      if (isFlashman) {
        setDriver({
          id: 'flashman-temp',
          name: 'Flashman',
          email: email,
          phone: '+91 99999 88888',
          vehicle_type: 'Motorcycle',
          status: 'approved',
          is_online: true,
          is_available: true,
          is_busy: false,
          average_rating: 4.9,
          total_deliveries: 150,
          total_earnings: 7500
        });
        toast.success(`Welcome Flashman! ⚡🚀`);
      } else {
        toast.error("Failed to load driver profile. Please try again.");
      }
    }
  };

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
      toast.success(status === 'available' ? "You're now available" : "Taking a break");
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const acceptDelivery = async (order) => {
    // Prevent accepting if driver already has an active delivery
    if (driver.is_busy || activeDelivery) {
      toast.error("You already have an active delivery. Complete it first!");
      return;
    }

    try {
      // Mark driver as busy FIRST to prevent race conditions
      await base44.entities.Driver.update(driver.id, { is_busy: true });

      // Update order with driver info
      await base44.entities.Order.update(order.id, {
        driver_email: driver.email,
        driver_name: driver.name,
        driver_id: driver.id,
        order_status: 'picked_up'
      });

      setDriver({ ...driver, is_busy: true });
      toast.success("🎉 Delivery accepted! Head to the restaurant for pickup.");
      refetch();
      refetchAvailable();
    } catch (e) {
      // Revert driver status on error
      await base44.entities.Driver.update(driver.id, { is_busy: false });
      toast.error("Failed to accept delivery. Please try again.");
    }
  };

  // Calculate stats
  const todayDeliveries = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_date).toDateString() === today && o.order_status === 'delivered';
  });
  const todayEarnings = todayDeliveries.length * 50;
  const dailyTarget = 10;
  const dailyProgress = Math.min((todayDeliveries.length / dailyTarget) * 100, 100);
  const activeDelivery = orders.find(o => ['picked_up', 'on_the_way'].includes(o.order_status));

  // CONDITIONAL RETURNS - after all hooks
  if (isAuthLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Truck className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Setting up your dashboard...</h2>
          <p className="text-gray-500 mb-6">Please wait while we load your driver profile</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (driver?.status === 'pending') {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Registration Under Review</h2>
          <p className="text-gray-500 mb-6">Your profile is being reviewed. Usually 24-48 hours.</p>
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending Approval</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {driver.name}</h1>
            <p className="text-gray-500">Ready to deliver?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Power className={cn("w-5 h-5", driver.is_online ? "text-green-600" : "text-gray-400")} />
              <span className="text-sm font-medium">{driver.is_online ? "Online" : "Offline"}</span>
              <Switch checked={driver.is_online} onCheckedChange={toggleOnline} />
            </div>
          </div>
        </div>

        {/* Premium Animated Driver Stats */}
        <div className="mb-8">
          <DriverStats
            todayDeliveries={todayDeliveries.length}
            todayEarnings={todayEarnings}
            totalDeliveries={driver.total_deliveries || 0}
            rating={driver.average_rating || 4.8}
            dailyTarget={dailyTarget}
            isOnline={driver.is_online}
          />
        </div>

        {/* Active Delivery */}
        {activeDelivery && (
          <Card className="mb-8 border-2 border-green-500">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Truck className="w-5 h-5" /> Active Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-lg">Order #{activeDelivery.order_number}</p>
                  <p className="text-gray-500">{activeDelivery.restaurant_name}</p>
                </div>
                <Badge className="bg-green-100 text-green-700">{activeDelivery.order_status.replace('_', ' ')}</Badge>
              </div>
              <div className="flex items-start gap-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Deliver to</p>
                  <p className="font-medium">{activeDelivery.customer_name}</p>
                  <p className="text-sm">{activeDelivery.delivery_address}</p>
                </div>
              </div>
              <Link to={`${createPageUrl("DriverDeliveries")}?active=${activeDelivery.id}`}>
                <Button className="w-full bg-green-600 hover:bg-green-700 rounded-xl">View Delivery Details</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Available Orders */}
        {driver.is_online && !activeDelivery && availableOrders.length > 0 && (
          <Card className="mb-8 border-2 border-orange-300">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center justify-between">
                <span>📦 Available Orders</span>
                <Badge className="bg-orange-500 text-white">{availableOrders.length} new</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {availableOrders.slice(0, 3).map(order => (
                <div key={order.id} className="p-4 bg-white border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold">#{order.order_number}</p>
                    <p className="text-sm text-gray-500">{order.restaurant_name}</p>
                    <p className="text-xs text-gray-400">{order.delivery_address?.substring(0, 30)}...</p>
                  </div>
                  <Button onClick={() => acceptDelivery(order)} className="bg-green-600 hover:bg-green-700 rounded-xl">
                    Accept ₹50
                  </Button>
                </div>
              ))}
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
              <Button className="bg-green-600 hover:bg-green-700 rounded-xl" onClick={toggleOnline}>Go Online</Button>
            </CardContent>
          </Card>
        )}

        {/* No Orders Available */}
        {driver.is_online && !activeDelivery && availableOrders.length === 0 && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No deliveries available</h3>
              <p className="text-gray-500">New orders will appear here automatically</p>
            </CardContent>
          </Card>
        )}

        {/* Recent Deliveries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Deliveries</CardTitle>
            <Link to={createPageUrl("DriverDeliveries")}>
              <Button variant="outline" size="sm" className="rounded-xl">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : orders.filter(o => o.order_status === 'delivered').length > 0 ? (
              <div className="space-y-4">
                {orders.filter(o => o.order_status === 'delivered').slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-sm text-gray-500">{format(new Date(order.created_date), "MMM d, h:mm a")}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-700">Delivered</Badge>
                      <p className="text-sm text-gray-500 mt-1">+₹50</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No deliveries yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}