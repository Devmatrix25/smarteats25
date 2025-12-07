import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, PartyPopper, Sparkles, Star, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

const OrderConfirmationCelebration = ({ isVisible, orderNumber, onClose }) => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // Trigger confetti explosion
            const duration = 3000;
            const end = Date.now() + duration;

            const colors = ['#FF6B35', '#F7C548', '#2EC4B6', '#E91E63', '#9C27B0'];

            (function frame() {
                confetti({
                    particleCount: 3,
                    spread: 80,
                    origin: { x: Math.random(), y: Math.random() * 0.5 },
                    colors: colors,
                    shapes: ['circle', 'square'],
                    gravity: 0.8,
                    scalar: 1.2,
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());

            // Star burst from center
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 360,
                    startVelocity: 30,
                    origin: { x: 0.5, y: 0.5 },
                    colors: colors,
                    shapes: ['star'],
                    gravity: 0.5,
                });
            }, 500);

            setShowContent(true);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={onClose}
                />

                {/* Content */}
                <motion.div
                    className="relative z-10 w-full max-w-md mx-4"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                    {/* Floating Elements */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-4xl"
                            style={{
                                left: `${15 + i * 15}%`,
                                top: `${-20 + Math.sin(i) * 10}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                rotate: [0, 360],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 3,
                                delay: i * 0.2,
                                repeat: Infinity,
                            }}
                        >
                            {['🍕', '🍔', '🌮', '🍜', '🍣', '🧁'][i]}
                        </motion.div>
                    ))}

                    {/* Main Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                        {/* Animated Background */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100"
                            animate={{
                                background: [
                                    'linear-gradient(135deg, #FFF3E0 0%, #FCE4EC 50%, #F3E5F5 100%)',
                                    'linear-gradient(135deg, #F3E5F5 0%, #E3F2FD 50%, #E8F5E9 100%)',
                                    'linear-gradient(135deg, #FFF3E0 0%, #FCE4EC 50%, #F3E5F5 100%)',
                                ],
                            }}
                            transition={{ duration: 5, repeat: Infinity }}
                        />

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Check Animation */}
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 relative"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                            >
                                {/* Outer Ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                />

                                {/* Inner Circle */}
                                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                    >
                                        <Check className="w-12 h-12 text-green-500" strokeWidth={3} />
                                    </motion.div>
                                </div>

                                {/* Sparkles around */}
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute"
                                        style={{
                                            left: '50%',
                                            top: '50%',
                                        }}
                                        animate={{
                                            x: Math.cos(i * 45 * Math.PI / 180) * 60 - 8,
                                            y: Math.sin(i * 45 * Math.PI / 180) * 60 - 8,
                                            scale: [0, 1, 0],
                                            opacity: [0, 1, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            delay: 0.8 + i * 0.1,
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                        }}
                                    >
                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                className="text-3xl font-bold text-center mb-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                    Order Confirmed!
                                </span>
                            </motion.h2>

                            {/* Order Number */}
                            <motion.div
                                className="text-center mb-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <p className="text-gray-500 mb-1">Your order number is</p>
                                <motion.p
                                    className="text-2xl font-mono font-bold text-gray-800 bg-gray-100 inline-block px-4 py-2 rounded-xl"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    #{orderNumber || 'SM1234'}
                                </motion.p>
                            </motion.div>

                            {/* Party Elements */}
                            <motion.div
                                className="flex justify-center gap-4 mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <motion.div
                                    animate={{ rotate: [-10, 10, -10] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                >
                                    <PartyPopper className="w-8 h-8 text-pink-500" />
                                </motion.div>
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                                </motion.div>
                                <motion.div
                                    animate={{ rotate: [10, -10, 10] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                >
                                    <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                                </motion.div>
                            </motion.div>

                            {/* Message */}
                            <motion.p
                                className="text-center text-gray-600 mb-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                            >
                                Sit back and relax! We're preparing your delicious order with love ❤️
                            </motion.p>

                            {/* Track Order Button */}
                            <motion.button
                                className="w-full py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-bold text-lg rounded-2xl shadow-lg relative overflow-hidden"
                                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                            >
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <span className="relative z-10">Track Your Order 🚀</span>
                            </motion.button>

                            {/* ETA */}
                            <motion.div
                                className="mt-4 text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                            >
                                <p className="text-sm text-gray-500">
                                    Estimated delivery: <span className="font-semibold text-orange-500">25-30 mins</span>
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OrderConfirmationCelebration;
