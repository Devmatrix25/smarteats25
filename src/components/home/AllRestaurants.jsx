import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ChevronRight, Filter, SlidersHorizontal, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PremiumRestaurantCard from "./PremiumRestaurantCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const filters = [
  { id: "all", label: "All" },
  { id: "rating", label: "Rating 4.0+" },
  { id: "fast", label: "Fast Delivery" },
  { id: "offers", label: "Offers" },
  { id: "pure_veg", label: "Pure Veg" },
  { id: "non_veg", label: "Non-Veg" },
];

export default function AllRestaurants({ restaurants, isLoading }) {
  const [activeFilter, setActiveFilter] = useState("all");

  // Ensure restaurants is always an array
  const safeRestaurants = Array.isArray(restaurants) ? restaurants : [];

  const filteredRestaurants = safeRestaurants.filter(r => {
    if (activeFilter === "all") return true;
    if (activeFilter === "rating") return (r.average_rating || 0) >= 4;
    if (activeFilter === "fast") return (r.delivery_time_mins || 30) <= 25;
    if (activeFilter === "offers") return r.is_featured;
    return true;
  });

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1D1D1F]">All Restaurants</h2>
            <p className="text-gray-500 text-sm mt-1">
              {filteredRestaurants.length} restaurants near you
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-gray-200 flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>

          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0",
                activeFilter === filter.id
                  ? "bg-[#1D1D1F] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-[#F25C23] hover:text-[#F25C23]"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {filteredRestaurants.map((restaurant, index) => (
              <PremiumRestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mt-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters</p>
            <Button
              variant="outline"
              onClick={() => setActiveFilter("all")}
              className="rounded-xl"
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Load More */}
        {filteredRestaurants.length >= 8 && (
          <div className="text-center mt-10">
            <Link to={createPageUrl("Restaurants")}>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl border-[#F25C23] text-[#F25C23] hover:bg-[#F25C23] hover:text-white"
              >
                View All Restaurants
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}