import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, Sparkles, Send, Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PremiumReviewForm = ({
    restaurantName = 'Restaurant',
    orderNumber,
    onSubmit,
    onClose
}) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [review, setReview] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const tags = [
        { label: 'Delicious 😋', color: 'from-orange-400 to-red-500' },
        { label: 'Fast Delivery 🚀', color: 'from-blue-400 to-purple-500' },
        { label: 'Good Packaging 📦', color: 'from-green-400 to-teal-500' },
        { label: 'Fresh Food 🥗', color: 'from-emerald-400 to-green-600' },
        { label: 'Value for Money 💰', color: 'from-yellow-400 to-orange-500' },
        { label: 'Will Order Again ❤️', color: 'from-pink-400 to-rose-500' },
    ];

    const ratingLabels = {
        1: 'Terrible 😞',
        2: 'Poor 😕',
        3: 'Okay 😐',
        4: 'Good 😊',
        5: 'Excellent 🤩'
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsSubmitted(true);
        setTimeout(() => {
            onSubmit?.({ rating, review, tags: selectedTags });
        }, 2000);
    };

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    if (isSubmitted) {
        return (
            <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <motion.div
                    className="w-24 h-24 mx-auto mb-6 relative"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full" />
                    <motion.div
                        className="absolute inset-2 bg-white rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                    >
                        <Heart className="w-10 h-10 text-red-500 fill-red-500" />
                    </motion.div>
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-lg"
                            style={{ left: '50%', top: '50%' }}
                            initial={{ x: 0, y: 0, scale: 0 }}
                            animate={{
                                x: Math.cos(i * 45 * Math.PI / 180) * 60,
                                y: Math.sin(i * 45 * Math.PI / 180) * 60,
                                scale: [0, 1, 0],
                            }}
                            transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                        >
                            ✨
                        </motion.div>
                    ))}
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Thank You! 🎉</h3>
                <p className="text-gray-500">Your review helps us serve you better</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="text-center mb-8">
                <motion.div
                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <Star className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800">Rate Your Experience</h2>
                <p className="text-gray-500 mt-1">How was your order from {restaurantName}?</p>
            </div>

            {/* Star Rating */}
            <div className="flex flex-col items-center mb-8">
                <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                            key={star}
                            className="relative"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                className={cn(
                                    "w-12 h-12 transition-colors duration-200",
                                    (hoveredRating || rating) >= star
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                )}
                            />
                            {rating === star && (
                                <motion.div
                                    className="absolute inset-0"
                                    initial={{ scale: 1.5, opacity: 0.5 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </div>
                <AnimatePresence mode="wait">
                    {(hoveredRating || rating) > 0 && (
                        <motion.span
                            key={hoveredRating || rating}
                            className={cn(
                                "text-lg font-semibold px-4 py-1 rounded-full",
                                (hoveredRating || rating) >= 4 ? "bg-green-100 text-green-700" :
                                    (hoveredRating || rating) >= 3 ? "bg-yellow-100 text-yellow-700" :
                                        "bg-red-100 text-red-700"
                            )}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            {ratingLabels[hoveredRating || rating]}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Tags */}
            <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">What did you like?</p>
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <motion.button
                            key={tag.label}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                selectedTags.includes(tag.label)
                                    ? `bg-gradient-to-r ${tag.color} text-white shadow-lg`
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleTag(tag.label)}
                        >
                            {tag.label}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Review Text */}
            <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Share more details (optional)
                </label>
                <div className="relative">
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Tell us about your experience..."
                        className="w-full h-28 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl resize-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all outline-none"
                    />
                    <span className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {review.length}/500
                    </span>
                </div>
            </div>

            {/* Submit Button */}
            <motion.button
                className={cn(
                    "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
                    rating > 0
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-200 hover:shadow-xl"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
                disabled={rating === 0 || isSubmitting}
                whileHover={rating > 0 ? { scale: 1.02 } : {}}
                whileTap={rating > 0 ? { scale: 0.98 } : {}}
                onClick={handleSubmit}
            >
                {isSubmitting ? (
                    <motion.div
                        className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        Submit Review
                        <Sparkles className="w-5 h-5" />
                    </>
                )}
            </motion.button>
        </motion.div>
    );
};

export default PremiumReviewForm;
