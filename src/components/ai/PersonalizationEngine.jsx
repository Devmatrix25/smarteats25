import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, TrendingUp, Clock, Heart, Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import RestaurantCard from "@/components/home/RestaurantCard";

export default function PersonalizationEngine({ user, restaurants = [], orders = [] }) {
  const [recommendations, setRecommendations] = useState({
    forYou: [],
    reorder: [],
    trending: [],
    newArrivals: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState(null);

  // Fetch reviews to power recommendations based on ratings
  const { data: reviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: () => base44.entities.Review.filter({}, '-created_date', 100),
    staleTime: 60000
  });

  useEffect(() => {
    if (restaurants.length > 0) {
      analyzeAndRecommend();
    }
  }, [user, restaurants, orders, reviews]);

  const analyzeAndRecommend = async () => {
    setIsLoading(true);
    
    // Analyze user order history
    const preferences = analyzeOrderHistory(orders);
    setUserPreferences(preferences);
    
    // Generate personalized recommendations
    const personalized = generatePersonalizedRecommendations(restaurants, preferences);
    
    // Get reorder suggestions (past ordered restaurants)
    const reorderSuggestions = getReorderSuggestions(orders, restaurants);
    
    // Get trending (highest rated, most orders)
    const trending = restaurants
      .filter(r => (r.average_rating || 0) >= 4)
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, 6);
    
    // New arrivals (most recently created)
    const newArrivals = [...restaurants]
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 6);

    setRecommendations({
      forYou: personalized,
      reorder: reorderSuggestions,
      trending,
      newArrivals
    });
    
    setIsLoading(false);
  };

  const analyzeOrderHistory = (orders) => {
    if (!orders || orders.length === 0) {
      return {
        favoriteCuisines: [],
        avgOrderValue: 0,
        preferredTime: 'anytime',
        vegetarianPreference: false,
        frequentRestaurants: []
      };
    }

    // Analyze cuisines from restaurant data
    const cuisineCounts = {};
    const restaurantCounts = {};
    let totalValue = 0;
    let vegOrders = 0;
    const orderTimes = [];

    orders.forEach(order => {
      totalValue += order.total_amount || 0;
      
      // Track restaurant frequency
      if (order.restaurant_id) {
        restaurantCounts[order.restaurant_id] = (restaurantCounts[order.restaurant_id] || 0) + 1;
      }
      
      // Track order times
      const orderHour = new Date(order.created_date).getHours();
      orderTimes.push(orderHour);
      
      // Track cuisines
      const restaurant = restaurants.find(r => r.id === order.restaurant_id);
      if (restaurant?.cuisine_type) {
        restaurant.cuisine_type.forEach(cuisine => {
          cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
        });
      }
    });

    // Determine favorite cuisines
    const favoriteCuisines = Object.entries(cuisineCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cuisine]) => cuisine);

    // Determine frequent restaurants
    const frequentRestaurants = Object.entries(restaurantCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    // Determine preferred time
    const avgHour = orderTimes.reduce((a, b) => a + b, 0) / orderTimes.length;
    let preferredTime = 'anytime';
    if (avgHour < 11) preferredTime = 'breakfast';
    else if (avgHour < 15) preferredTime = 'lunch';
    else if (avgHour < 19) preferredTime = 'snacks';
    else preferredTime = 'dinner';

    return {
      favoriteCuisines,
      avgOrderValue: Math.round(totalValue / orders.length),
      preferredTime,
      vegetarianPreference: vegOrders > orders.length / 2,
      frequentRestaurants
    };
  };

  const generatePersonalizedRecommendations = (restaurants, preferences) => {
    if (!preferences.favoriteCuisines.length) {
      // New user - show featured and high-rated
      return restaurants
        .filter(r => r.is_featured || (r.average_rating || 0) >= 4)
        .slice(0, 8);
    }

    // Score each restaurant based on user preferences and reviews
    const scoredRestaurants = restaurants.map(restaurant => {
      let score = 0;
      
      // Cuisine match
      const cuisineMatch = restaurant.cuisine_type?.some(c => 
        preferences.favoriteCuisines.includes(c)
      );
      if (cuisineMatch) score += 30;
      
      // Rating bonus
      score += (restaurant.average_rating || 0) * 5;
      
      // Recent positive reviews bonus
      const restaurantReviews = reviews.filter(r => r.restaurant_id === restaurant.id);
      const recentPositive = restaurantReviews.filter(r => r.overall_rating >= 4).length;
      score += recentPositive * 3;
      
      // Food quality rating bonus
      const avgFoodRating = restaurantReviews.length > 0 
        ? restaurantReviews.reduce((acc, r) => acc + (r.food_rating || r.overall_rating), 0) / restaurantReviews.length
        : 0;
      score += avgFoodRating * 4;
      
      // Fast delivery bonus if user orders frequently
      if ((restaurant.delivery_time_mins || 30) < 25) score += 10;
      
      // Featured bonus
      if (restaurant.is_featured) score += 15;
      
      // Avoid recently ordered restaurants for variety
      if (!preferences.frequentRestaurants.includes(restaurant.id)) {
        score += 5;
      }
      
      return { ...restaurant, score };
    });

    return scoredRestaurants
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  };

  const getReorderSuggestions = (orders, restaurants) => {
    const restaurantIds = [...new Set(orders.map(o => o.restaurant_id))];
    return restaurants.filter(r => restaurantIds.includes(r.id)).slice(0, 4);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* For You Section */}
      {recommendations.forYou.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">Picked for You</h2>
                {userPreferences?.favoriteCuisines.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Based on your love for {userPreferences.favoriteCuisines.slice(0, 2).join(' & ')}
                  </p>
                )}
              </div>
            </div>
            <Link 
              to={createPageUrl("Restaurants")}
              className="text-[#F25C23] font-medium text-sm flex items-center hover:underline"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.forYou.slice(0, 4).map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      )}

      {/* Reorder Section */}
      {recommendations.reorder.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">Order Again</h2>
                <p className="text-sm text-gray-500">Your favorites are just a tap away</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recommendations.reorder.map(restaurant => (
              <Link 
                key={restaurant.id}
                to={`${createPageUrl("Restaurant")}?id=${restaurant.id}`}
                className="flex-shrink-0 w-72"
              >
                <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all flex items-center gap-4">
                  <img 
                    src={restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&q=80"}
                    alt={restaurant.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{restaurant.name}</h3>
                    <p className="text-sm text-gray-500 truncate">
                      {restaurant.cuisine_type?.slice(0, 2).join(', ')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        {restaurant.average_rating?.toFixed(1) || '4.0'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {restaurant.delivery_time_mins || 30} mins
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Section */}
      {recommendations.trending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#F25C23] to-[#FFC043] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">Trending Now</h2>
                <p className="text-sm text-gray-500">Popular in your area</p>
              </div>
            </div>
            <Link 
              to={createPageUrl("Restaurants")}
              className="text-[#F25C23] font-medium text-sm flex items-center hover:underline"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.trending.slice(0, 3).map((restaurant, idx) => (
              <div key={restaurant.id} className="relative">
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#F25C23] rounded-full flex items-center justify-center text-white font-bold z-10 shadow-lg">
                  #{idx + 1}
                </div>
                <RestaurantCard restaurant={restaurant} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Personalized Promo Banner */}
      {userPreferences && (
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">
                🎉 Special Offer for You!
              </h3>
              <p className="text-white/80 mb-4">
                Get 20% off on your next {userPreferences.favoriteCuisines[0] || 'food'} order
              </p>
              <Badge className="bg-white text-purple-600 hover:bg-white/90">
                Use code: FORYOU20
              </Badge>
            </div>
            <div className="hidden md:block text-6xl">
              🍽️
            </div>
          </div>
        </section>
      )}
    </div>
  );
}