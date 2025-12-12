import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DollarSign, TrendingUp, Trophy, Star, Award, Target,
  Calendar, ChevronDown, Zap, Gift, Medal, Crown, Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isThisWeek, isThisMonth } from "date-fns";

export default function DriverEarnings() {
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
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
      loadDriver(userData.email);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loadDriver = async (email) => {
    const isFlashman = email === 'flashman@smarteats.com';
    try {
      const drivers = await base44.entities.Driver.filter({ email });
      if (drivers.length > 0) {
        setDriver(drivers[0]);
      } else if (isFlashman) {
        // Fallback for Flashman
        setDriver({
          id: 'flashman-temp',
          name: 'Flashman',
          email: email,
          status: 'approved',
          is_online: true,
          total_deliveries: 150,
          total_earnings: 7500,
          average_rating: 4.9
        });
      }
    } catch (e) {
      console.log('No driver');
      if (isFlashman) {
        setDriver({
          id: 'flashman-temp',
          name: 'Flashman',
          email: email,
          status: 'approved',
          total_earnings: 7500,
          total_deliveries: 150
        });
      }
    }
  };

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['driver-orders-earnings', driver?.email],
    queryFn: () => base44.entities.Order.filter({ driver_email: driver.email, order_status: 'delivered' }),
    enabled: !!driver?.email,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  // Also refresh driver data for real-time earnings
  const { data: latestDriverData } = useQuery({
    queryKey: ['driver-data-earnings', driver?.id],
    queryFn: async () => {
      const drivers = await base44.entities.Driver.filter({ email: driver.email });
      return drivers[0];
    },
    enabled: !!driver?.email,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  // Update driver state when data changes
  useEffect(() => {
    if (latestDriverData && latestDriverData.total_earnings !== driver?.total_earnings) {
      setDriver(latestDriverData);
    }
  }, [latestDriverData]);

  const { data: allDrivers = [] } = useQuery({
    queryKey: ['all-drivers-leaderboard'],
    queryFn: () => base44.entities.Driver.filter({ status: 'approved' }),
    enabled: !!driver,
    staleTime: 120000,
    refetchOnWindowFocus: false
  });

  // Calculate earnings based on period
  const calculateEarnings = (orders, period) => {
    const now = new Date();
    let filteredOrders = orders;

    if (period === 'today') {
      filteredOrders = orders.filter(o => isToday(new Date(o.created_date)));
    } else if (period === 'week') {
      filteredOrders = orders.filter(o => isThisWeek(new Date(o.created_date)));
    } else if (period === 'month') {
      filteredOrders = orders.filter(o => isThisMonth(new Date(o.created_date)));
    }

    const deliveryFees = filteredOrders.length * 50; // ₹50 per delivery
    const tips = filteredOrders.length * 15; // Avg ₹15 tip
    const bonuses = filteredOrders.length >= 5 ? 100 : 0; // Bonus for 5+ deliveries
    const incentives = period === 'today' && filteredOrders.length >= 10 ? 200 : 0; // Daily target bonus

    return {
      deliveryFees,
      tips,
      bonuses,
      incentives,
      total: deliveryFees + tips + bonuses + incentives,
      count: filteredOrders.length,
      orders: filteredOrders
    };
  };

  const earnings = calculateEarnings(orders, selectedPeriod);

  // Leaderboard
  const leaderboard = allDrivers
    .map(d => ({
      ...d,
      score: (d.total_deliveries || 0) * 10 + (d.average_rating || 5) * 20
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const driverRank = leaderboard.findIndex(d => d.email === driver?.email) + 1;

  // Badges and achievements
  const achievements = [
    {
      id: 'first_delivery',
      name: 'First Delivery',
      icon: '🎉',
      earned: (driver?.total_deliveries || 0) >= 1,
      desc: 'Complete your first delivery'
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      icon: '⚡',
      earned: (driver?.total_deliveries || 0) >= 10,
      desc: 'Complete 10 deliveries'
    },
    {
      id: 'five_star',
      name: 'Five Star',
      icon: '⭐',
      earned: (driver?.average_rating || 0) >= 4.5,
      desc: 'Maintain 4.5+ rating'
    },
    {
      id: 'century',
      name: 'Century Club',
      icon: '💯',
      earned: (driver?.total_deliveries || 0) >= 100,
      desc: 'Complete 100 deliveries'
    },
    {
      id: 'streak',
      name: 'Weekly Streak',
      icon: '🔥',
      earned: calculateEarnings(orders, 'week').count >= 25,
      desc: 'Complete 25 deliveries in a week'
    },
    {
      id: 'top_earner',
      name: 'Top Earner',
      icon: '💰',
      earned: (driver?.total_earnings || 0) >= 10000,
      desc: 'Earn ₹10,000 total'
    },
  ];

  // Daily challenge
  const dailyTarget = 10;
  const todayDeliveries = calculateEarnings(orders, 'today').count;
  const dailyProgress = Math.min((todayDeliveries / dailyTarget) * 100, 100);

  // Incentive Programs
  const incentivePrograms = [
    {
      id: 'daily_hustle',
      name: 'Daily Hustle',
      type: 'daily',
      target: 10,
      current: todayDeliveries,
      reward: 200,
      icon: '🔥',
      color: 'from-orange-500 to-red-500',
      description: 'Complete 10 deliveries today'
    },
    {
      id: 'weekly_warrior',
      name: 'Weekly Warrior',
      type: 'weekly',
      target: 50,
      current: calculateEarnings(orders, 'week').count,
      reward: 1000,
      icon: '⚔️',
      color: 'from-blue-500 to-purple-500',
      description: 'Complete 50 deliveries this week'
    },
    {
      id: 'earnings_goal',
      name: 'Earnings Goal',
      type: 'weekly',
      target: 5000,
      current: calculateEarnings(orders, 'week').total,
      reward: 500,
      icon: '💰',
      color: 'from-green-500 to-emerald-500',
      description: 'Earn ₹5,000 this week',
      isCurrency: true
    },
    {
      id: 'rating_star',
      name: 'Rating Star',
      type: 'monthly',
      target: 4.8,
      current: driver?.average_rating || 5,
      reward: 1500,
      icon: '⭐',
      color: 'from-yellow-500 to-amber-500',
      description: 'Maintain 4.8+ rating this month',
      isRating: true
    },
    {
      id: 'monthly_champion',
      name: 'Monthly Champion',
      type: 'monthly',
      target: 200,
      current: calculateEarnings(orders, 'month').count,
      reward: 5000,
      icon: '🏆',
      color: 'from-purple-500 to-pink-500',
      description: 'Complete 200 deliveries this month'
    }
  ];

  const completedIncentives = incentivePrograms.filter(p =>
    p.isRating ? p.current >= p.target : p.current >= p.target
  );
  const totalIncentiveEarnings = completedIncentives.reduce((acc, p) => acc + p.reward, 0);

  if (isAuthLoading || !driver) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Skeleton className="h-48 rounded-xl mb-4" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Real-time Earnings */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 mb-1">Total Earnings</p>
              <h1 className="text-4xl font-bold">₹{driver.total_earnings || 0}</h1>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mb-4">
            {['today', 'week', 'month', 'all'].map(period => (
              <Button
                key={period}
                size="sm"
                variant={selectedPeriod === period ? "secondary" : "ghost"}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  "rounded-full capitalize",
                  selectedPeriod === period ? "bg-white text-green-700" : "text-white hover:bg-white/20"
                )}
              >
                {period === 'all' ? 'All Time' : period}
              </Button>
            ))}
          </div>

          {/* Period Earnings */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-green-100 text-sm">Delivery Fees</p>
                <p className="text-xl font-bold">₹{earnings.deliveryFees}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Tips</p>
                <p className="text-xl font-bold">₹{earnings.tips}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Bonuses</p>
                <p className="text-xl font-bold">₹{earnings.bonuses}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Incentives</p>
                <p className="text-xl font-bold">₹{earnings.incentives}</p>
              </div>
            </div>
            <div className="border-t border-white/20 mt-4 pt-4 flex items-center justify-between">
              <span className="text-green-100">Total ({selectedPeriod})</span>
              <span className="text-2xl font-bold">₹{earnings.total}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Incentive Programs */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Incentive Programs</h3>
                  <p className="text-sm text-slate-400">Complete targets to earn bonus rewards</p>
                </div>
              </div>
              {totalIncentiveEarnings > 0 && (
                <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                  +₹{totalIncentiveEarnings} Earned!
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {incentivePrograms.map(program => {
                const progress = program.isRating
                  ? (program.current / program.target) * 100
                  : Math.min((program.current / program.target) * 100, 100);
                const isCompleted = program.isRating
                  ? program.current >= program.target
                  : program.current >= program.target;

                return (
                  <div
                    key={program.id}
                    className={cn(
                      "relative p-4 rounded-2xl border transition-all",
                      isCompleted
                        ? "bg-green-500/20 border-green-500/50"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br",
                        program.color
                      )}>
                        {program.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold">{program.name}</h4>
                          <Badge variant="outline" className="text-xs border-white/30 text-white/70">
                            {program.type}
                          </Badge>
                          {isCompleted && (
                            <Badge className="bg-green-500 text-white text-xs">
                              ✓ Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{program.description}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full bg-gradient-to-r transition-all", program.color)}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-[80px] text-right">
                            {program.isCurrency ? `₹${program.current}` : program.isRating ? program.current.toFixed(1) : program.current}
                            /{program.isCurrency ? `₹${program.target}` : program.target}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-bold",
                          isCompleted ? "text-green-400" : "text-yellow-400"
                        )}>
                          +₹{program.reward}
                        </p>
                        <p className="text-xs text-slate-500">reward</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fuel Cost Calculator */}
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Fuel Cost Calculator</h3>
                <p className="text-sm text-gray-500">Track your net profit after fuel expenses</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Avg. Distance/Delivery</p>
                <p className="text-2xl font-bold">5 km</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Vehicle Mileage</p>
                <p className="text-2xl font-bold">45 km/L</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Fuel Price</p>
                <p className="text-2xl font-bold">₹105/L</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Est. Fuel Cost ({selectedPeriod})</p>
                <p className="text-2xl font-bold text-red-600">
                  -₹{Math.round((earnings.count * 5 / 45) * 105)}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit ({selectedPeriod})</p>
                  <p className="text-xs text-gray-500">Earnings - Fuel Cost</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">
                    ₹{Math.round(earnings.total - (earnings.count * 5 / 45) * 105)}
                  </p>
                  <p className="text-xs text-green-600">
                    {Math.round(((earnings.total - (earnings.count * 5 / 45) * 105) / earnings.total) * 100) || 0}% profit margin
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Leaderboard
                {driverRank > 0 && (
                  <Badge className="ml-auto bg-purple-100 text-purple-700">
                    Your Rank: #{driverRank}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((d, idx) => (
                  <div
                    key={d.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-xl transition-all",
                      d.email === driver?.email ? "bg-purple-50 border-2 border-purple-200" : "bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                      idx === 0 && "bg-yellow-400 text-yellow-900",
                      idx === 1 && "bg-gray-300 text-gray-700",
                      idx === 2 && "bg-orange-400 text-orange-900",
                      idx > 2 && "bg-gray-200 text-gray-600"
                    )}>
                      {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-sm text-gray-500">
                        {d.total_deliveries || 0} deliveries • ⭐ {(d.average_rating || 5).toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{d.total_earnings || 0}</p>
                      <p className="text-xs text-gray-400">{d.score} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all",
                      achievement.earned
                        ? "bg-purple-50 border border-purple-200"
                        : "bg-gray-50 opacity-60"
                    )}
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{achievement.name}</p>
                      <p className="text-xs text-gray-500">{achievement.desc}</p>
                    </div>
                    {achievement.earned && (
                      <Badge className="bg-green-100 text-green-700 text-xs">✓</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Earnings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : earnings.orders.length > 0 ? (
              <div className="space-y-3">
                {earnings.orders.slice(0, 10).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.created_date), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+₹50</p>
                      <p className="text-xs text-gray-400">+ tip</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No deliveries in this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}