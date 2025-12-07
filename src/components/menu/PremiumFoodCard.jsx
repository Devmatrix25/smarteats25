import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, Heart, Plus, Minus, ShoppingBag, Flame, Leaf,
    Clock, Sparkles, Award, ChefHat, BadgePercent
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PremiumFoodCard = ({
    item,
    onAddToCart,
    onToggleFavorite,
    isFavorite = false,
    showQuickAdd = true
}) => {
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [showQuantity, setShowQuantity] = useState(false);
    const [isLiked, setIsLiked] = useState(isFavorite);

    const handleAddToCart = async () => {
        setIsAdding(true);
        await new Promise(r => setTimeout(r, 600));
        onAddToCart?.({ ...item, quantity });
        setIsAdding(false);
        setShowQuantity(false);
        setQuantity(1);
    };

    const handleLike = (e) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        onToggleFavorite?.(!isLiked);
    };

    return (
        <motion.div
            className={cn(
                "group relative bg-white rounded-3xl overflow-hidden",
                "shadow-lg hover:shadow-2xl transition-all duration-500",
                "border border-gray-100"
            )}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            layout
        >
            {/* Image Container */}
            <div className="relative h-48 overflow-hidden">
                <motion.img
                    src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {item.is_bestseller && (
                        <motion.span
                            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white text-xs font-bold shadow-lg"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Flame className="w-3 h-3" />
                            Bestseller
                        </motion.span>
                    )}
                    {item.is_vegetarian && (
                        <motion.span
                            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white text-xs font-bold shadow-lg"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Leaf className="w-3 h-3" />
                            Veg
                        </motion.span>
                    )}
                    {item.discount && (
                        <motion.span
                            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <BadgePercent className="w-3 h-3" />
                            {item.discount}% OFF
                        </motion.span>
                    )}
                </div>

                {/* Favorite Button */}
                <motion.button
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
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
                    {isLiked && (
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.5, 0] }}
                            transition={{ duration: 0.5 }}
                        >
                            {[...Array(6)].map((_, i) => (
                                <motion.span
                                    key={i}
                                    className="absolute text-xs"
                                    initial={{ scale: 0, x: 0, y: 0 }}
                                    animate={{
                                        scale: [0, 1, 0],
                                        x: Math.cos(i * 60 * Math.PI / 180) * 20,
                                        y: Math.sin(i * 60 * Math.PI / 180) * 20,
                                    }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    ❤️
                                </motion.span>
                            ))}
                        </motion.div>
                    )}
                </motion.button>

                {/* Rating Badge */}
                <motion.div
                    className="absolute bottom-3 left-3 flex items-center gap-1 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-gray-800">{item.rating || 4.5}</span>
                    <span className="text-gray-400 text-sm">({item.review_count || 120})</span>
                </motion.div>

                {/* Prep Time */}
                <motion.div
                    className="absolute bottom-3 right-3 flex items-center gap-1 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-xl text-white text-sm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Clock className="w-4 h-4" />
                    {item.prep_time || '15-20'} min
                </motion.div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Category */}
                <span className="text-xs font-medium text-orange-500 uppercase tracking-wider">
                    {item.category || 'Main Course'}
                </span>

                {/* Name */}
                <h3 className="font-bold text-lg text-gray-800 mt-1 mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors">
                    {item.name}
                </h3>

                {/* Description */}
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    {item.description || 'Delicious food prepared with love and fresh ingredients'}
                </p>

                {/* Price & Add Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                            ₹{item.price}
                        </span>
                        {item.original_price && item.original_price > item.price && (
                            <span className="text-sm text-gray-400 line-through">
                                ₹{item.original_price}
                            </span>
                        )}
                    </div>

                    {/* Add to Cart Button */}
                    <AnimatePresence mode="wait">
                        {!showQuantity ? (
                            <motion.button
                                key="add"
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-semibold shadow-lg shadow-orange-200 hover:shadow-xl transition-shadow"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowQuantity(true)}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </motion.button>
                        ) : (
                            <motion.div
                                key="quantity"
                                className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-1"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <motion.button
                                    className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30"
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Minus className="w-4 h-4" />
                                </motion.button>
                                <motion.span
                                    className="w-8 text-center font-bold text-white"
                                    key={quantity}
                                    initial={{ scale: 1.3 }}
                                    animate={{ scale: 1 }}
                                >
                                    {quantity}
                                </motion.span>
                                <motion.button
                                    className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30"
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    <Plus className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                    className="w-11 h-9 bg-white rounded-xl flex items-center justify-center text-orange-500 font-bold ml-1"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAddToCart}
                                >
                                    {isAdding ? (
                                        <motion.div
                                            className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                        />
                                    ) : (
                                        <ShoppingBag className="w-4 h-4" />
                                    )}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Chef's Special Indicator */}
                {item.is_chef_special && (
                    <motion.div
                        className="mt-4 flex items-center gap-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <ChefHat className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-amber-700">Chef's Special</span>
                        <Sparkles className="w-4 h-4 text-amber-400 ml-auto" />
                    </motion.div>
                )}
            </div>

            {/* Hover Glow */}
            <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"
            />
        </motion.div>
    );
};

export default PremiumFoodCard;
