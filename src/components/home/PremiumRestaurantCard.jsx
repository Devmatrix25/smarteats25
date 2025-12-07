import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Heart, Sparkles, Flame, Leaf, Percent } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

const PremiumRestaurantCard = ({ restaurant, index = 0 }) => {
    const [isLiked, setIsLiked] = React.useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className="group"
        >
            <Link to={`${createPageUrl("Restaurant")}?id=${restaurant.id}`}>
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
                    {/* Image Container */}
                    <div className="relative h-48 overflow-hidden">
                        <motion.img
                            src={restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80"}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                            {restaurant.is_promoted && (
                                <motion.span
                                    className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Featured
                                </motion.span>
                            )}
                            {restaurant.has_offer && (
                                <motion.span
                                    className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white text-xs font-bold shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Percent className="w-3 h-3" />
                                    40% OFF
                                </motion.span>
                            )}
                            {restaurant.pure_veg && (
                                <motion.span
                                    className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white text-xs font-bold shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Leaf className="w-3 h-3" />
                                    Pure Veg
                                </motion.span>
                            )}
                        </div>

                        {/* Favorite Button */}
                        <motion.button
                            className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg z-10"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.preventDefault();
                                setIsLiked(!isLiked);
                            }}
                        >
                            <motion.div
                                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                                transition={{ duration: 0.3 }}
                            >
                                <Heart
                                    className={cn(
                                        "w-5 h-5 transition-colors",
                                        isLiked ? "text-red-500 fill-red-500" : "text-gray-400"
                                    )}
                                />
                            </motion.div>
                        </motion.button>

                        {/* Bottom Info on Image */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <motion.div
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-gray-800">{restaurant.average_rating?.toFixed(1) || "4.2"}</span>
                                <span className="text-gray-400 text-sm">({restaurant.reviews_count || 120})</span>
                            </motion.div>

                            <motion.div
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-xl text-white text-sm"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Clock className="w-4 h-4" />
                                {restaurant.delivery_time || "30-40"} min
                            </motion.div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        {/* Restaurant Name */}
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-1">
                                {restaurant.name}
                            </h3>
                            {restaurant.is_new && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                                    NEW
                                </span>
                            )}
                        </div>

                        {/* Cuisines */}
                        <p className="text-gray-500 text-sm line-clamp-1 mb-3">
                            {restaurant.cuisine_type?.join(" • ") || "Multi-Cuisine"}
                        </p>

                        {/* Location & Price */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>{restaurant.distance || "2.5"} km</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-gray-400 text-sm">₹{restaurant.average_cost || 300} for two</span>
                            </div>
                        </div>

                        {/* Offer Strip */}
                        {restaurant.offer_text && (
                            <motion.div
                                className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl flex items-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                    <Percent className="w-3 h-3 text-white" />
                                </div>
                                <p className="text-sm text-blue-700 font-medium">{restaurant.offer_text}</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Hover Glow Effect */}
                    <motion.div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"
                    />
                </div>
            </Link>
        </motion.div>
    );
};

export default PremiumRestaurantCard;
