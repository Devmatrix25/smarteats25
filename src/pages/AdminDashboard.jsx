import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  TrendingUp, Store, Truck, ShoppingCart, Users,
  DollarSign, Clock, AlertCircle, CheckCircle, Activity, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showPrivateData, setShowPrivateData] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      if (userData.role !== 'admin') {
        navigate(createPageUrl("Home"));
        return;
      }
      setUser(userData);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const { data: restaurants = [], isLoading: loadingRestaurants } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: !!user,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: () => base44.entities.Driver.list(),
    enabled: !!user,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  const { data: orders = [], isLoading: loadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
    enabled: !!user,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  // Mask customer data for privacy
  const maskEmail = (email) => {
    if (!email || showPrivateData) return email;
    const [local, domain] = email.split('@');
    return `${local.charAt(0)}***@${domain}`;
  };

  const maskPhone = (phone) => {
    if (!phone || showPrivateData) return phone;
    return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
  };

  const maskAddress = (address) => {
    if (!address || showPrivateData) return address;
    const parts = address.split(',');
    if (parts.length > 1) {
      return `*****, ${parts[parts.length - 1].trim()}`;
    }
    return '*****';
  };

  const pendingRestaurants = restaurants.filter(r => r.status === 'pending');
  const pendingDrivers = drivers.filter(d => d.status === 'pending');
  const approvedRestaurants = restaurants.filter(r => r.status === 'approved');
  const approvedDrivers = drivers.filter(d => d.status === 'approved');

  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_date).toDateString() === today;
  });

  const todayRevenue = todayOrders
    .filter(o => o.order_status !== 'cancelled')
    .reduce((acc, o) => acc + (o.total_amount || 0), 0);

  const activeOrders = orders.filter(o =>
    !['delivered', 'cancelled'].includes(o.order_status)
  );

  if (isAuthLoading || !user) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user.full_name}</p>
        </div>

        {/* Privacy Toggle & Pending Approvals */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {(pendingRestaurants.length > 0 || pendingDrivers.length > 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Pending Approvals</p>
                  <p className="text-sm text-yellow-700">
                    {pendingRestaurants.length} restaurants and {pendingDrivers.length} drivers waiting for approval
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Toggle */}
          <Button
            variant={showPrivateData ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPrivateData(!showPrivateData)}
            className="rounded-xl"
          >
            {showPrivateData ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Showing Full Data
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Privacy Mode
              </>
            )}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Orders</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                  <p className="text-blue-100 text-sm">{todayOrders.length} today</p>
                </div>
                <ShoppingCart className="w-10 h-10 text-white/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Today's Revenue</p>
                  <p className="text-3xl font-bold">₹{todayRevenue}</p>
                  <div className="flex items-center gap-1 text-green-100 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    +12% from yesterday
                  </div>
                </div>
                <DollarSign className="w-10 h-10 text-white/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Restaurants</p>
                  <p className="text-3xl font-bold">{approvedRestaurants.length}</p>
                  {pendingRestaurants.length > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-700 mt-1">
                      {pendingRestaurants.length} pending
                    </Badge>
                  )}
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Drivers</p>
                  <p className="text-3xl font-bold">{approvedDrivers.length}</p>
                  {pendingDrivers.length > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-700 mt-1">
                      {pendingDrivers.length} pending
                    </Badge>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Restaurant Approvals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Pending Restaurant Approvals
              </CardTitle>
              <Link to={createPageUrl("AdminRestaurants")}>
                <Button variant="outline" size="sm" className="rounded-xl">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingRestaurants ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : pendingRestaurants.length > 0 ? (
                <div className="space-y-4">
                  {pendingRestaurants.slice(0, 5).map(rest => (
                    <div
                      key={rest.id}
                      className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium">{rest.name}</p>
                        <p className="text-sm text-gray-500">{rest.owner_email}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  No pending approvals
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Driver Approvals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Pending Driver Approvals
              </CardTitle>
              <Link to={createPageUrl("AdminDrivers")}>
                <Button variant="outline" size="sm" className="rounded-xl">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingDrivers ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : pendingDrivers.length > 0 ? (
                <div className="space-y-4">
                  {pendingDrivers.slice(0, 5).map(driver => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-gray-500">{driver.phone}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  No pending approvals
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Active Orders
              </CardTitle>
              <Link to={createPageUrl("AdminOrders")}>
                <Button variant="outline" size="sm" className="rounded-xl">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : activeOrders.length > 0 ? (
                <div className="space-y-4">
                  {activeOrders.slice(0, 5).map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium">#{order.order_number}</p>
                        <p className="text-sm text-gray-500">
                          {order.restaurant_name} → {showPrivateData ? order.customer_name : `${order.customer_name?.charAt(0)}***`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(order.created_date), "h:mm a")} • {maskAddress(order.delivery_address)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{order.total_amount}</p>
                        <Badge className={cn(
                          "mt-1",
                          order.order_status === 'placed' && "bg-blue-100 text-blue-700 animate-pulse",
                          order.order_status === 'confirmed' && "bg-blue-100 text-blue-700",
                          order.order_status === 'preparing' && "bg-yellow-100 text-yellow-700",
                          order.order_status === 'ready' && "bg-purple-100 text-purple-700",
                          ['picked_up', 'on_the_way'].includes(order.order_status) && "bg-orange-100 text-orange-700"
                        )}>
                          {order.order_status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active orders
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}