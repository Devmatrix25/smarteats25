import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight, Sparkles } from "lucide-react";
import RestaurantCard from "./RestaurantCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedRestaurants({ restaurants, isLoading }) {
  const featuredRestaurants = restaurants.filter(r => r.is_featured).slice(0, 4);
  const displayRestaurants = featuredRestaurants.length > 0 ? featuredRestaurants : restaurants.slice(0, 4);

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFC043] to-[#F25C23] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1D1D1F]">Featured Restaurants</h2>
              <p className="text-gray-500 text-sm">Handpicked just for you</p>
            </div>
          </div>
          <Link 
            to={createPageUrl("Restaurants")}
            className="flex items-center gap-1 text-[#F25C23] font-medium hover:underline"
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-500">No restaurants available yet</p>
          </div>
        )}
      </div>
    </section>
  );
}