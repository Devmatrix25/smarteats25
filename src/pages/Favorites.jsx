import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PremiumRestaurantCard from "@/components/home/PremiumRestaurantCard";

export default function Favorites() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
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
      setUser(userData);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Fetch user's favorites
  const { data: favorites = [], isLoading: favoritesLoading, refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  // Fetch all restaurants to map favorites
  const { data: allRestaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.filter({ status: 'approved' }),
    enabled: !!user?.email
  });

  // Get favorite restaurants
  const favoriteRestaurants = allRestaurants.filter(r =>
    favorites.some(f => f.restaurant_id === r.id)
  );

  const handleFavoriteChange = () => {
    refetchFavorites();
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7F2]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#F25C23] mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const isLoading = favoritesLoading || restaurantsLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Favorites</h1>
          <p className="text-gray-500 mt-1">
            {favoriteRestaurants.length} saved restaurant{favoriteRestaurants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to={createPageUrl("Home")}>
          <Button variant="outline" className="rounded-xl">
            <Search className="w-4 h-4 mr-2" />
            Explore More
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : favoriteRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteRestaurants.map((restaurant, index) => (
            <PremiumRestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              index={index}
              user={user}
              favorites={favorites}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-red-300" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Tap the heart icon on any restaurant to save it here for quick access
          </p>
          <Link to={createPageUrl("Home")}>
            <Button className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
              <Search className="w-4 h-4 mr-2" />
              Explore Restaurants
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}