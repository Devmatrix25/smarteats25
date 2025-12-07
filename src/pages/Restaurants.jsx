import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Search, Filter, SlidersHorizontal, Star, Clock,
  MapPin, ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import RestaurantCard from "@/components/home/RestaurantCard";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const cuisineFilters = [
  "All", "Indian", "Chinese", "Italian", "Mexican", 
  "Thai", "Japanese", "American", "Mediterranean"
];

export default function Restaurants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [filters, setFilters] = useState({
    rating: false,
    fastDelivery: false,
    featured: false
  });

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.filter({ status: 'approved' })
  });

  // Filter and sort restaurants
  let filteredRestaurants = [...restaurants];

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredRestaurants = filteredRestaurants.filter(r => 
      r.name?.toLowerCase().includes(query) ||
      r.cuisine_type?.some(c => c.toLowerCase().includes(query))
    );
  }

  // Cuisine filter
  if (selectedCuisine !== "All") {
    filteredRestaurants = filteredRestaurants.filter(r =>
      r.cuisine_type?.some(c => c.toLowerCase().includes(selectedCuisine.toLowerCase()))
    );
  }

  // Quick filters
  if (filters.rating) {
    filteredRestaurants = filteredRestaurants.filter(r => (r.average_rating || 0) >= 4);
  }
  if (filters.fastDelivery) {
    filteredRestaurants = filteredRestaurants.filter(r => (r.delivery_time_mins || 30) <= 25);
  }
  if (filters.featured) {
    filteredRestaurants = filteredRestaurants.filter(r => r.is_featured);
  }

  // Sort
  if (sortBy === "rating") {
    filteredRestaurants.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
  } else if (sortBy === "delivery") {
    filteredRestaurants.sort((a, b) => (a.delivery_time_mins || 30) - (b.delivery_time_mins || 30));
  } else if (sortBy === "name") {
    filteredRestaurants.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">All Restaurants</h1>
        <p className="text-gray-500">{filteredRestaurants.length} restaurants found</p>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-16 z-10 bg-[#FFF7F2] pb-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl border-gray-200 bg-white"
          />
        </div>

        {/* Cuisine Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {cuisineFilters.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0",
                selectedCuisine === cuisine
                  ? "bg-[#1D1D1F] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-[#F25C23]"
              )}
            >
              {cuisine}
            </button>
          ))}
        </div>

        {/* Quick Filters & Sort */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Button
              variant={filters.rating ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(f => ({ ...f, rating: !f.rating }))}
              className={cn("rounded-xl flex-shrink-0", filters.rating && "bg-[#F25C23]")}
            >
              <Star className="w-4 h-4 mr-1" />
              4.0+
            </Button>
            <Button
              variant={filters.fastDelivery ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(f => ({ ...f, fastDelivery: !f.fastDelivery }))}
              className={cn("rounded-xl flex-shrink-0", filters.fastDelivery && "bg-[#F25C23]")}
            >
              <Clock className="w-4 h-4 mr-1" />
              Fast
            </Button>
            <Button
              variant={filters.featured ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(f => ({ ...f, featured: !f.featured }))}
              className={cn("rounded-xl flex-shrink-0", filters.featured && "bg-[#F25C23]")}
            >
              Featured
            </Button>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="delivery">Delivery Time</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Restaurant Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No restaurants found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
          <Button 
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCuisine("All");
              setFilters({ rating: false, fastDelivery: false, featured: false });
            }}
            className="rounded-xl"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}