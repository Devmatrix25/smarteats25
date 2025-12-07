import React, { useState } from "react";
import { 
  Filter, Star, Clock, DollarSign, Leaf, Award, 
  Percent, X, ChevronDown, Check 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥬', color: 'bg-green-100 text-green-700' },
  { id: 'vegan', label: 'Vegan', icon: '🌱', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'gluten_free', label: 'Gluten Free', icon: '🌾', color: 'bg-amber-100 text-amber-700' },
  { id: 'halal', label: 'Halal', icon: '☪️', color: 'bg-blue-100 text-blue-700' },
  { id: 'jain', label: 'Jain', icon: '🕉️', color: 'bg-orange-100 text-orange-700' },
];

const DELIVERY_TIME_OPTIONS = [
  { id: 'fast', label: 'Under 20 mins', value: 20 },
  { id: 'medium', label: 'Under 30 mins', value: 30 },
  { id: 'any', label: 'Any time', value: 999 },
];

const RATING_OPTIONS = [
  { id: '4.5', label: '4.5+', stars: 4.5 },
  { id: '4.0', label: '4.0+', stars: 4.0 },
  { id: '3.5', label: '3.5+', stars: 3.5 },
  { id: 'any', label: 'Any rating', stars: 0 },
];

export default function AdvancedFilters({ filters, onFiltersChange, menuItems = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {
    dietary: [],
    deliveryTime: 'any',
    rating: 'any',
    priceRange: [0, 1000],
    hasOffers: false,
    sortBy: 'relevance'
  });

  const activeFilterCount = 
    localFilters.dietary.length + 
    (localFilters.deliveryTime !== 'any' ? 1 : 0) + 
    (localFilters.rating !== 'any' ? 1 : 0) + 
    (localFilters.hasOffers ? 1 : 0) +
    (localFilters.priceRange[1] < 1000 ? 1 : 0);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultFilters = {
      dietary: [],
      deliveryTime: 'any',
      rating: 'any',
      priceRange: [0, 1000],
      hasOffers: false,
      sortBy: 'relevance'
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const toggleDietary = (id) => {
    setLocalFilters(f => ({
      ...f,
      dietary: f.dietary.includes(id) 
        ? f.dietary.filter(d => d !== id)
        : [...f.dietary, id]
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-xl relative">
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-[#F25C23] text-white text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-[#F25C23]">
              Reset All
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-8 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Sort By */}
          <div>
            <h3 className="font-semibold mb-3">Sort By</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'relevance', label: 'Relevance' },
                { id: 'rating', label: 'Rating' },
                { id: 'delivery_time', label: 'Delivery Time' },
                { id: 'price_low', label: 'Price: Low to High' },
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => setLocalFilters(f => ({ ...f, sortBy: option.id }))}
                  className={cn(
                    "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                    localFilters.sortBy === option.id
                      ? "border-[#F25C23] bg-orange-50 text-[#F25C23]"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Dietary Preferences
            </h3>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => toggleDietary(option.id)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 flex items-center gap-2 transition-all",
                    localFilters.dietary.includes(option.id)
                      ? "border-[#F25C23] bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <span>{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                  {localFilters.dietary.includes(option.id) && (
                    <Check className="w-4 h-4 text-[#F25C23]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Time */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Delivery Time
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {DELIVERY_TIME_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setLocalFilters(f => ({ ...f, deliveryTime: option.id }))}
                  className={cn(
                    "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                    localFilters.deliveryTime === option.id
                      ? "border-[#F25C23] bg-orange-50 text-[#F25C23]"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Minimum Rating
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {RATING_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setLocalFilters(f => ({ ...f, rating: option.id }))}
                  className={cn(
                    "p-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-1",
                    localFilters.rating === option.id
                      ? "border-[#F25C23] bg-orange-50 text-[#F25C23]"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {option.stars > 0 && <Star className="w-4 h-4 fill-current" />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Price Range
            </h3>
            <div className="px-2">
              <Slider
                value={localFilters.priceRange}
                onValueChange={(value) => setLocalFilters(f => ({ ...f, priceRange: value }))}
                max={1000}
                step={50}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm">
                <span>₹{localFilters.priceRange[0]}</span>
                <span>₹{localFilters.priceRange[1] >= 1000 ? '1000+' : localFilters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Has Offers */}
          <div>
            <button
              onClick={() => setLocalFilters(f => ({ ...f, hasOffers: !f.hasOffers }))}
              className={cn(
                "w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all",
                localFilters.hasOffers
                  ? "border-[#F25C23] bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <Percent className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium">Offers & Discounts</p>
                  <p className="text-sm text-gray-500">Show restaurants with active offers</p>
                </div>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                localFilters.hasOffers ? "bg-[#F25C23] border-[#F25C23]" : "border-gray-300"
              )}>
                {localFilters.hasOffers && <Check className="w-4 h-4 text-white" />}
              </div>
            </button>
          </div>
        </div>

        <SheetFooter className="border-t pt-4">
          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              className="flex-1 bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
            >
              Apply Filters
              {activeFilterCount > 0 && ` (${activeFilterCount})`}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Helper function to apply filters to restaurants
export function applyAdvancedFilters(restaurants, menuItems, filters) {
  if (!filters) return restaurants;

  return restaurants.filter(restaurant => {
    // Delivery time filter
    if (filters.deliveryTime !== 'any') {
      const maxTime = DELIVERY_TIME_OPTIONS.find(o => o.id === filters.deliveryTime)?.value || 999;
      if ((restaurant.delivery_time_mins || 30) > maxTime) return false;
    }

    // Rating filter
    if (filters.rating !== 'any') {
      const minRating = parseFloat(filters.rating) || 0;
      if ((restaurant.average_rating || 0) < minRating) return false;
    }

    // Dietary filter - check menu items
    if (filters.dietary.length > 0) {
      const restaurantItems = menuItems.filter(i => i.restaurant_id === restaurant.id);
      const hasDietary = filters.dietary.every(diet => {
        if (diet === 'vegetarian') return restaurantItems.some(i => i.is_vegetarian);
        if (diet === 'vegan') return restaurantItems.some(i => i.is_vegan);
        return true;
      });
      if (!hasDietary) return false;
    }

    // Price range - check average item price
    if (filters.priceRange[1] < 1000) {
      const restaurantItems = menuItems.filter(i => i.restaurant_id === restaurant.id);
      const avgPrice = restaurantItems.length > 0
        ? restaurantItems.reduce((acc, i) => acc + i.price, 0) / restaurantItems.length
        : 500;
      if (avgPrice > filters.priceRange[1]) return false;
    }

    // Has offers filter
    if (filters.hasOffers) {
      const restaurantItems = menuItems.filter(i => i.restaurant_id === restaurant.id);
      const hasOffers = restaurantItems.some(i => i.is_special_offer);
      if (!hasOffers) return false;
    }

    return true;
  }).sort((a, b) => {
    // Sorting
    switch (filters.sortBy) {
      case 'rating':
        return (b.average_rating || 0) - (a.average_rating || 0);
      case 'delivery_time':
        return (a.delivery_time_mins || 30) - (b.delivery_time_mins || 30);
      case 'price_low':
        return (a.minimum_order || 0) - (b.minimum_order || 0);
      default:
        return 0;
    }
  });
}