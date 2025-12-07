import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Flame } from "lucide-react";
import PremiumRestaurantCard from "./PremiumRestaurantCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedRestaurants({ restaurants, isLoading }) {
  const featuredRestaurants = restaurants.filter(r => r.is_featured).slice(0, 4);
  const displayRestaurants = featuredRestaurants.length > 0 ? featuredRestaurants : restaurants.slice(0, 4);

  return (
    <section className="py-12 bg-gradient-to-b from-white to-orange-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="w-12 h-12 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                Featured Restaurants
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Flame className="w-6 h-6 text-orange-500" />
                </motion.span>
              </h2>
              <p className="text-gray-500">Handpicked just for you ✨</p>
            </div>
          </div>
          <motion.div whileHover={{ x: 5 }}>
            <Link
              to={createPageUrl("Restaurants")}
              className="flex items-center gap-1 px-4 py-2 bg-orange-100 text-orange-600 font-semibold rounded-xl hover:bg-orange-200 transition-colors"
            >
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-xl" />
                    <Skeleton className="h-6 w-16 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayRestaurants.map((restaurant, index) => (
              <PremiumRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                index={index}
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-16 bg-gradient-to-br from-orange-50 to-pink-50 rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles className="w-12 h-12 text-orange-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No restaurants available yet</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for delicious options!</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}