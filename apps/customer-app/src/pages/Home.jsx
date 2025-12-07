import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import FeaturedRestaurants from "@/components/home/FeaturedRestaurants";
import PromoBanner from "@/components/home/PromoBanner";
import AllRestaurants from "@/components/home/AllRestaurants";
import AppDownloadBanner from "@/components/home/AppDownloadBanner";
import AIAssistant from "@/components/chat/AIAssistant";
import PersonalizationEngine from "@/components/ai/PersonalizationEngine";
import FlavorLensBanner from "@/components/home/FlavorLensBanner";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(false);
    }
  };

  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['restaurants', 'approved'],
    queryFn: async () => {
      const data = await base44.entities.Restaurant.filter({ status: 'approved' });
      return data;
    }
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }),
    enabled: !!user?.email
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7F2]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#F25C23] mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeroSection />
      <CategorySection />
      
      {/* Magical Flavor Lens Banner */}
      <FlavorLensBanner />
      
      {/* AI-Powered Personalized Recommendations */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PersonalizationEngine 
            user={user} 
            restaurants={restaurants} 
            orders={orders} 
          />
        </div>
      )}
      
      <FeaturedRestaurants restaurants={restaurants} isLoading={restaurantsLoading} />
      <PromoBanner />
      <AllRestaurants restaurants={restaurants} isLoading={restaurantsLoading} />
      
      <AppDownloadBanner />
      <AIAssistant />
    </div>
  );
}