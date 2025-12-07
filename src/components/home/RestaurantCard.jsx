import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Star, Clock, MapPin, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RestaurantCard({ restaurant, variant = "default" }) {
  const isCompact = variant === "compact";

  return (
    <Link 
      to={`${createPageUrl("Restaurant")}?id=${restaurant.id}`}
      className={cn(
        "group block bg-white rounded-2xl overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:shadow-orange-100/50 hover:-translate-y-1",
        "border border-gray-100 hover:border-[#F25C23]/20",
        isCompact ? "flex gap-4 p-3" : ""
      )}
    >
      {/* Image */}
      <div className={cn(
        "relative overflow-hidden",
        isCompact ? "w-24 h-24 rounded-xl flex-shrink-0" : "aspect-[4/3]"
      )}>
        <img 
          src={restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80"}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Offer Badge */}
        {restaurant.is_featured && !isCompact && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-[#F25C23] text-white border-0 px-3 py-1">
              Featured
            </Badge>
          </div>
        )}
        
        {/* Favorite Button */}
        {!isCompact && (
          <button 
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Heart className="w-4 h-4 text-gray-600 hover:text-[#FF4D4F] hover:fill-[#FF4D4F]" />
          </button>
        )}

        {/* Delivery Time */}
        {!isCompact && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg">
            <Clock className="w-3 h-3 text-[#1D1D1F]" />
            <span className="text-xs font-semibold text-[#1D1D1F]">
              {restaurant.delivery_time_mins || 30} mins
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        isCompact ? "flex-1 py-1" : "p-4"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-[#1D1D1F] truncate group-hover:text-[#F25C23] transition-colors",
              isCompact ? "text-sm" : "text-lg"
            )}>
              {restaurant.name}
            </h3>
            <p className={cn(
              "text-gray-500 truncate",
              isCompact ? "text-xs mt-0.5" : "text-sm mt-1"
            )}>
              {restaurant.cuisine_type?.join(", ") || "Multi-cuisine"}
            </p>
          </div>
          
          {/* Rating */}
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0",
            (restaurant.average_rating || 4.2) >= 4 
              ? "bg-[#3BA55D] text-white" 
              : "bg-[#FFC043] text-[#1D1D1F]"
          )}>
            <Star className={cn("fill-current", isCompact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            <span className={cn("font-bold", isCompact ? "text-xs" : "text-sm")}>
              {restaurant.average_rating?.toFixed(1) || "4.2"}
            </span>
          </div>
        </div>

        {!isCompact && (
          <>
            {/* Meta Info */}
            <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {restaurant.city || "Bangalore"}
              </span>
              <span>•</span>
              <span>₹{restaurant.minimum_order || 200} min order</span>
            </div>

            {/* Tags */}
            {restaurant.cuisine_type?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {restaurant.cuisine_type.slice(0, 3).map((cuisine, idx) => (
                  <span 
                    key={idx}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {isCompact && (
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{restaurant.delivery_time_mins || 30} mins</span>
            <span>•</span>
            <span>₹{restaurant.delivery_fee || 30} delivery</span>
          </div>
        )}
      </div>
    </Link>
  );
}