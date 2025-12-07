import React from "react";
import { Star, ThumbsUp, CheckCircle, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ReviewsList({ reviews, showRestaurantReply = true }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-100">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                {review.customer_name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{review.customer_name || "Customer"}</span>
                  {review.is_verified && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {format(new Date(review.created_date), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 fill-white" />
              <span className="font-bold">{review.overall_rating}</span>
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="flex flex-wrap gap-3 mb-3">
            {review.food_rating && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span>Food:</span>
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn(
                      "w-3 h-3",
                      s <= review.food_rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                    )} />
                  ))}
                </div>
              </div>
            )}
            {review.delivery_rating && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span>Delivery:</span>
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn(
                      "w-3 h-3",
                      s <= review.delivery_rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                    )} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {review.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {review.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Review Text */}
          {review.review_text && (
            <p className="text-gray-700 text-sm">{review.review_text}</p>
          )}

          {/* Restaurant Reply */}
          {showRestaurantReply && review.restaurant_reply && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
              <p className="text-xs font-medium text-orange-700 mb-1">Restaurant replied:</p>
              <p className="text-sm text-gray-700">{review.restaurant_reply}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}