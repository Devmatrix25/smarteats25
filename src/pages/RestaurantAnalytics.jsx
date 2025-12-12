import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  TrendingUp, DollarSign, ShoppingCart, Users, Star,
  Calendar, ChevronDown, ArrowUp, ArrowDown, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#F25C23', '#FFC043', '#3BA55D', '#8B5CF6', '#EC4899'];

export default function RestaurantAnalytics() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [period, setPeriod] = useState("week");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
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

  const loadRestaurant = async (email) => {
    try {
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: email });
      if (restaurants.length > 0) setRestaurant(restaurants[0]);
    } catch (e) {
      console.log('No restaurant');
    }
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['restaurant-analytics', restaurant?.id],
    queryFn: () => base44.entities.Order.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurant-reviews', restaurant?.id],
    queryFn: () => base44.entities.Review.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['restaurant-menu-analytics', restaurant?.id],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  // Calculate date ranges
  const getDateRange = (period) => {
    const now = new Date();
    if (period === 'today') return { start: startOfDay(now), end: endOfDay(now) };
    if (period === 'week') return { start: startOfWeek(now), end: endOfWeek(now) };
    if (period === 'month') return { start: startOfMonth(now), end: endOfMonth(now) };
    return { start: subDays(now, 365), end: now };
  };

  const dateRange = getDateRange(period);

  // Filter orders by period
  const periodOrders = orders.filter(o =>
    isWithinInterval(new Date(o.created_date), dateRange)
  );

  const completedOrders = periodOrders.filter(o => o.order_status === 'delivered');
  const cancelledOrders = periodOrders.filter(o => o.order_status === 'cancelled');

  // Calculate metrics
  const totalRevenue = completedOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;
  const orderCount = periodOrders.length;
  const cancellationRate = orderCount > 0 ? ((cancelledOrders.length / orderCount) * 100).toFixed(1) : 0;

  // Previous period comparison
  const prevRange = {
    start: subDays(dateRange.start, period === 'week' ? 7 : period === 'month' ? 30 : 1),
    end: subDays(dateRange.end, period === 'week' ? 7 : period === 'month' ? 30 : 1)
  };

  const prevOrders = orders.filter(o =>
    isWithinInterval(new Date(o.created_date), prevRange)
  );
  const prevRevenue = prevOrders.filter(o => o.order_status === 'delivered')
    .reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const revenueChange = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0;

  // Daily data for charts
  const getDailyData = () => {
    const days = eachDayOfInterval(dateRange);
    return days.map(day => {
      const dayOrders = completedOrders.filter(o =>
        format(new Date(o.created_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      return {
        date: format(day, 'MMM d'),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0)
      };
    });
  };

  // Top selling items
  const getTopItems = () => {
    const itemCounts = {};
    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  };

  // Order status distribution
  const statusDistribution = [
    { name: 'Delivered', value: completedOrders.length, color: '#3BA55D' },
    { name: 'Cancelled', value: cancelledOrders.length, color: '#FF4D4F' },
    { name: 'Pending', value: periodOrders.filter(o => !['delivered', 'cancelled'].includes(o.order_status)).length, color: '#FFC043' }
  ];

  if (isAuthLoading || !restaurant) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Skeleton className="h-32 rounded-xl mb-4" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-gray-500">{restaurant.name}</p>
          </div>
          <div className="flex gap-2">
            {['today', 'week', 'month'].map(p => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-xl capitalize",
                  period === p && "bg-[#F25C23] hover:bg-[#D94A18]"
                )}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                  <div className={cn(
                    "flex items-center gap-1 text-sm mt-1",
                    revenueChange >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {revenueChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {Math.abs(revenueChange)}% vs prev
                  </div>
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
                  <p className="text-sm text-gray-500">Orders</p>
                  <p className="text-2xl font-bold">{orderCount}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {completedOrders.length} completed
                  </p>
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
                  <p className="text-sm text-gray-500">Avg Order Value</p>
                  <p className="text-2xl font-bold">₹{avgOrderValue}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Per order
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="text-2xl font-bold">{restaurant.average_rating?.toFixed(1) || '4.0'}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {reviews.length} reviews
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getDailyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#F25C23"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDailyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#F25C23" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopItems().map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white",
                      idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-orange-400" : "bg-gray-300"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.count} sold</p>
                    </div>
                  </div>
                ))}
                {getTopItems().length === 0 && (
                  <p className="text-gray-500 text-center py-4">No sales data</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {statusDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '12:00 - 14:00', label: 'Lunch', percent: 35 },
                  { time: '19:00 - 21:00', label: 'Dinner', percent: 45 },
                  { time: '15:00 - 17:00', label: 'Snacks', percent: 15 },
                  { time: '09:00 - 11:00', label: 'Breakfast', percent: 5 },
                ].map((slot, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{slot.label}</span>
                      <span className="text-gray-500">{slot.time}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#F25C23] h-2 rounded-full"
                        style={{ width: `${slot.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}