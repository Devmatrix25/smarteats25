import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Camera, X, Loader2, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const quickTags = [
  "Great taste", "Fresh food", "Fast delivery", "Good packaging", 
  "Friendly driver", "Hot & fresh", "Value for money", "Generous portions"
];

export default function ReviewForm({ order, onSubmit, onClose }) {
  const [ratings, setRatings] = useState({
    overall: 0,
    food: 0,
    delivery: 0,
    driver: 0,
    packaging: 0
  });
  const [reviewText, setReviewText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (category, value) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (ratings.overall === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        order_id: order.id,
        restaurant_id: order.restaurant_id,
        driver_id: order.driver_id,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        overall_rating: ratings.overall,
        food_rating: ratings.food || ratings.overall,
        delivery_rating: ratings.delivery || ratings.overall,
        driver_rating: ratings.driver || ratings.overall,
        packaging_rating: ratings.packaging || ratings.overall,
        review_text: reviewText,
        tags: selectedTags,
        is_verified: true
      };

      await base44.entities.Review.create(reviewData);
      await base44.entities.Order.update(order.id, { is_reviewed: true });

      // Update restaurant average rating
      const allReviews = await base44.entities.Review.filter({ restaurant_id: order.restaurant_id });
      const avgRating = allReviews.reduce((acc, r) => acc + r.overall_rating, 0) / allReviews.length;
      await base44.entities.Restaurant.update(order.restaurant_id, { 
        average_rating: Math.round(avgRating * 10) / 10,
        total_reviews: allReviews.length
      });

      // Update driver rating if exists
      if (order.driver_id) {
        const driverReviews = await base44.entities.Review.filter({ driver_id: order.driver_id });
        const driverAvg = driverReviews.reduce((acc, r) => acc + (r.driver_rating || r.overall_rating), 0) / driverReviews.length;
        await base44.entities.Driver.update(order.driver_id, {
          average_rating: Math.round(driverAvg * 10) / 10
        });
      }

      toast.success("Thank you for your review!");
      onSubmit?.();
    } catch (e) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ category, label, value }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(star => (
          <button
            key={star}
            onClick={() => handleStarClick(category, star)}
            className="transition-transform hover:scale-110"
          >
            <Star className={cn(
              "w-6 h-6 transition-colors",
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Order Info */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          🍽️
        </div>
        <div>
          <p className="font-semibold">{order.restaurant_name}</p>
          <p className="text-sm text-gray-500">Order #{order.order_number}</p>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="text-center">
        <h3 className="font-semibold mb-3">How was your experience?</h3>
        <div className="flex justify-center gap-2">
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              onClick={() => handleStarClick('overall', star)}
              className="transition-transform hover:scale-125"
            >
              <Star className={cn(
                "w-10 h-10 transition-colors",
                star <= ratings.overall ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              )} />
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {ratings.overall === 5 ? "Excellent!" : 
           ratings.overall === 4 ? "Great!" :
           ratings.overall === 3 ? "Good" :
           ratings.overall === 2 ? "Fair" :
           ratings.overall === 1 ? "Poor" : "Tap to rate"}
        </p>
      </div>

      {/* Detailed Ratings */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
        <StarRating category="food" label="Food Quality" value={ratings.food} />
        <StarRating category="delivery" label="Delivery Time" value={ratings.delivery} />
        {order.driver_name && (
          <StarRating category="driver" label="Driver Professionalism" value={ratings.driver} />
        )}
        <StarRating category="packaging" label="Packaging" value={ratings.packaging} />
      </div>

      {/* Quick Tags */}
      <div>
        <h4 className="text-sm font-medium mb-2">What did you like?</h4>
        <div className="flex flex-wrap gap-2">
          {quickTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all",
                selectedTags.includes(tag)
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {selectedTags.includes(tag) && <ThumbsUp className="w-3 h-3 inline mr-1" />}
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Written Review */}
      <div>
        <h4 className="text-sm font-medium mb-2">Share more details (optional)</h4>
        <Textarea
          placeholder="Tell others about your experience..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="rounded-xl h-24"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
          Skip
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || ratings.overall === 0}
          className="flex-1 bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
          ) : (
            "Submit Review"
          )}
        </Button>
      </div>
    </div>
  );
}