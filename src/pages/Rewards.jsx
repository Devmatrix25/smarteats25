import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Gift, Star, History, ChevronRight, Sparkles, 
  Trophy, Zap, Crown, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import LoyaltyCard from "@/components/loyalty/LoyaltyCard";
import RewardCard from "@/components/loyalty/RewardCard";

const tierBenefits = {
  bronze: ["Earn 1 point per ₹10 spent", "Birthday bonus 50 points", "Access to basic rewards"],
  silver: ["Earn 1.5 points per ₹10 spent", "Birthday bonus 100 points", "Free delivery on orders over ₹500", "Early access to offers"],
  gold: ["Earn 2 points per ₹10 spent", "Birthday bonus 200 points", "Free delivery on all orders", "Priority customer support", "Exclusive gold rewards"],
  platinum: ["Earn 3 points per ₹10 spent", "Birthday bonus 500 points", "Free delivery + priority dispatch", "Dedicated support line", "Exclusive platinum rewards", "Surprise gifts"]
};

export default function Rewards() {
  const [user, setUser] = useState(null);
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
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const { data: loyalty, isLoading: loyaltyLoading } = useQuery({
    queryKey: ['loyalty', user?.email],
    queryFn: async () => {
      const records = await base44.entities.LoyaltyPoints.filter({ user_email: user.email });
      if (records.length === 0) {
        // Create new loyalty account
        return await base44.entities.LoyaltyPoints.create({
          user_email: user.email,
          total_points: 0,
          available_points: 0,
          lifetime_points: 0,
          tier: "bronze"
        });
      }
      return records[0];
    },
    enabled: !!user?.email
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.filter({ is_active: true })
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['points-transactions', user?.email],
    queryFn: () => base44.entities.PointsTransaction.filter({ user_email: user.email }, '-created_date', 20),
    enabled: !!user?.email
  });

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      // Deduct points
      const newAvailable = loyalty.available_points - reward.points_required;
      await base44.entities.LoyaltyPoints.update(loyalty.id, {
        available_points: newAvailable
      });
      
      // Record transaction
      await base44.entities.PointsTransaction.create({
        user_email: user.email,
        points: -reward.points_required,
        type: "redeemed",
        description: `Redeemed: ${reward.name}`
      });
      
      return reward;
    },
    onSuccess: (reward) => {
      queryClient.invalidateQueries(['loyalty']);
      queryClient.invalidateQueries(['points-transactions']);
      toast.success(`🎉 ${reward.name} redeemed! Use it on your next order.`);
    },
    onError: () => toast.error("Failed to redeem reward")
  });

  if (isAuthLoading || loyaltyLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-48 rounded-2xl mb-6" />
        <Skeleton className="h-32 rounded-xl mb-4" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">SmartEats Rewards</h1>

      {/* Loyalty Card */}
      <div className="mb-6">
        <LoyaltyCard loyalty={loyalty} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
          <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Earn Points</p>
          <p className="text-xs text-gray-500">₹10 = 1 point</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
          <Gift className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Redeem</p>
          <p className="text-xs text-gray-500">{rewards.length} rewards</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
          <Trophy className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-sm font-medium capitalize">{loyalty?.tier}</p>
          <p className="text-xs text-gray-500">Current tier</p>
        </div>
      </div>

      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1">
          <TabsTrigger value="rewards" className="rounded-lg">Rewards</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
          <TabsTrigger value="benefits" className="rounded-lg">Benefits</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          {rewards.length > 0 ? (
            rewards.map(reward => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userPoints={loyalty?.available_points || 0}
                userTier={loyalty?.tier || "bronze"}
                onRedeem={(r) => redeemMutation.mutate(r)}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No rewards available</h3>
              <p className="text-gray-500">Check back soon for exciting rewards!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    tx.points > 0 ? "bg-green-100" : "bg-red-100"
                  )}>
                    {tx.points > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <Gift className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(tx.created_date), "MMM d, yyyy • h:mm a")}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "font-bold text-lg",
                  tx.points > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {tx.points > 0 ? "+" : ""}{tx.points}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No transactions yet</h3>
              <p className="text-gray-500">Your points history will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="benefits" className="space-y-4">
          {Object.entries(tierBenefits).map(([tier, benefits]) => (
            <Card key={tier} className={cn(
              "border-2",
              tier === loyalty?.tier ? "border-orange-400 bg-orange-50/50" : "border-gray-200"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 capitalize">
                  {tier === "bronze" && "🥉"}
                  {tier === "silver" && "🥈"}
                  {tier === "gold" && "🥇"}
                  {tier === "platinum" && "💎"}
                  {tier} Tier
                  {tier === loyalty?.tier && (
                    <Badge className="bg-orange-500 ml-2">Current</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}