import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Search as SearchIcon, X, Filter, Star, Clock, 
  MapPin, TrendingUp, History, Sparkles, Camera, Leaf, Percent
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import RestaurantCard from "@/components/home/RestaurantCard";
import AdvancedFilters, { applyAdvancedFilters } from "@/components/search/AdvancedFilters";
import { cn } from "@/lib/utils";

const popularSearches = [
  "Biryani", "Pizza", "Burger", "Chinese", "North Indian", 
  "South Indian", "Desserts", "Ice Cream", "Coffee", "Healthy"
];

export default function Search() {
  const urlParams = new URLSearchParams(window.location.search);
  const cuisineParam = urlParams.get('cuisine');
  const queryParam = urlParams.get('q');
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState(queryParam || cuisineParam || "");
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    cuisine: cuisineParam || null,
    rating: null,
    delivery: null
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    dietary: [],
    deliveryTime: 'any',
    rating: 'any',
    priceRange: [0, 1000],
    hasOffers: false,
    sortBy: 'relevance'
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
      // Load recent searches from localStorage
      const saved = localStorage.getItem('recentSearches');
      if (saved) setRecentSearches(JSON.parse(saved));
      
      // If query param exists, add to recent searches
      if (queryParam) {
        handleSearch(queryParam);
      }
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants', 'search'],
    queryFn: () => base44.entities.Restaurant.filter({ status: 'approved' })
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems', 'search'],
    queryFn: () => base44.entities.MenuItem.filter({ is_available: true })
  });

  // Filter restaurants based on search and filters
  const baseFiltered = restaurants.filter(restaurant => {
    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = restaurant.name?.toLowerCase().includes(query);
      const matchesCuisine = restaurant.cuisine_type?.some(c => c.toLowerCase().includes(query));
      const matchesMenu = menuItems.some(
        item => item.restaurant_id === restaurant.id && 
        (item.name?.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query))
      );
      if (!matchesName && !matchesCuisine && !matchesMenu) return false;
    }

    // Quick rating filter
    if (selectedFilters.rating === '4+' && (restaurant.average_rating || 0) < 4) return false;

    // Quick delivery time filter
    if (selectedFilters.delivery === 'fast' && (restaurant.delivery_time_mins || 30) > 25) return false;

    return true;
  });

  // Apply advanced filters
  const filteredRestaurants = applyAdvancedFilters(baseFiltered, menuItems, advancedFilters);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      const updated = [query, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedFilters({ cuisine: null, rating: null, delivery: null });
  };

  if (isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="sticky top-16 z-10 bg-[#FFF7F2] pb-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search for restaurants, cuisines, dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            className="pl-12 pr-24 h-14 rounded-2xl border-gray-200 text-lg bg-white shadow-sm"
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Link
              to={createPageUrl("FlavorLens")}
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
              title="Flavor Lens - Search by Image"
            >
              <Camera className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedFilters.rating === '4+' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilters(f => ({ ...f, rating: f.rating === '4+' ? null : '4+' }))}
            className={cn(
              "rounded-xl flex-shrink-0",
              selectedFilters.rating === '4+' && "bg-[#F25C23] hover:bg-[#D94A18]"
            )}
          >
            <Star className="w-4 h-4 mr-1" />
            Rating 4.0+
          </Button>
          <Button
            variant={selectedFilters.delivery === 'fast' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilters(f => ({ ...f, delivery: f.delivery === 'fast' ? null : 'fast' }))}
            className={cn(
              "rounded-xl flex-shrink-0",
              selectedFilters.delivery === 'fast' && "bg-[#F25C23] hover:bg-[#D94A18]"
            )}
          >
            <Clock className="w-4 h-4 mr-1" />
            Fast Delivery
          </Button>
          <Button
            variant={advancedFilters.dietary.includes('vegetarian') ? "default" : "outline"}
            size="sm"
            onClick={() => setAdvancedFilters(f => ({
              ...f,
              dietary: f.dietary.includes('vegetarian') 
                ? f.dietary.filter(d => d !== 'vegetarian')
                : [...f.dietary, 'vegetarian']
            }))}
            className={cn(
              "rounded-xl flex-shrink-0",
              advancedFilters.dietary.includes('vegetarian') && "bg-green-600 hover:bg-green-700"
            )}
          >
            <Leaf className="w-4 h-4 mr-1" />
            Vegetarian
          </Button>
          <Button
            variant={advancedFilters.hasOffers ? "default" : "outline"}
            size="sm"
            onClick={() => setAdvancedFilters(f => ({ ...f, hasOffers: !f.hasOffers }))}
            className={cn(
              "rounded-xl flex-shrink-0",
              advancedFilters.hasOffers && "bg-purple-600 hover:bg-purple-700"
            )}
          >
            <Percent className="w-4 h-4 mr-1" />
            Offers
          </Button>
          <AdvancedFilters 
            filters={advancedFilters} 
            onFiltersChange={setAdvancedFilters}
            menuItems={menuItems}
          />
        </div>
      </div>

      {/* Content */}
      {!searchQuery ? (
        <div className="mt-6 space-y-8">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-400" />
                  Recent Searches
                </h3>
                <button 
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('recentSearches');
                  }}
                  className="text-sm text-[#F25C23]"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(search)}
                    className="px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-[#F25C23] hover:text-[#F25C23] transition-all"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#F25C23]" />
              Popular Right Now
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(search)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100 hover:border-[#F25C23] hover:shadow-md transition-all"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Restaurants */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#FFC043]" />
              Explore Restaurants
            </h3>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurants.slice(0, 6).map(restaurant => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          {/* Results Count */}
          <p className="text-gray-500 mb-4">
            {filteredRestaurants.length} results for "{searchQuery}"
          </p>

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRestaurants.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl">
              <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-gray-500 mb-6">Try searching for something else</p>
              <Button onClick={clearSearch} variant="outline" className="rounded-xl">
                Clear Search
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}