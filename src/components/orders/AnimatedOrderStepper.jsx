import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, ChefHat, Package, Truck, MapPin, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
    { id: 'placed', label: 'Order Placed', icon: Check, description: 'Your order has been received', color: 'from-emerald-400 to-emerald-600' },
    { id: 'confirmed', label: 'Confirmed', icon: Clock, description: 'Restaurant is preparing', color: 'from-blue-400 to-blue-600' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Chef is cooking your food', color: 'from-amber-400 to-orange-500' },
    { id: 'ready', label: 'Ready', icon: Package, description: 'Order is packed & ready', color: 'from-purple-400 to-purple-600' },
    { id: 'picked_up', label: 'Picked Up', icon: Truck, description: 'Driver has your order', color: 'from-pink-400 to-rose-500' },
    { id: 'on_the_way', label: 'On The Way', icon: MapPin, description: 'Heading to your location', color: 'from-cyan-400 to-teal-500' },
    { id: 'delivered', label: 'Delivered', icon: Home, description: 'Enjoy your meal!', color: 'from-green-400 to-green-600' },
];

const AnimatedOrderStepper = ({ currentStatus, className }) => {
    const currentIndex = steps.findIndex(s => s.id === currentStatus);
    const [celebrateStep, setCelebrateStep] = useState(null);

    useEffect(() => {
        if (currentIndex >= 0) {
            setCelebrateStep(currentIndex);
            const timer = setTimeout(() => setCelebrateStep(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [currentStatus]);

    return (
        <div className={cn("relative p-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20", className)}>
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <motion.div
                    className={cn("absolute inset-0 opacity-10 bg-gradient-to-r", steps[currentIndex]?.color || 'from-gray-400 to-gray-600')}
                    animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Header with Current Status */}
            <motion.div
                className="relative text-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    className={cn(
                        "inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r text-white font-bold text-lg shadow-lg",
                        steps[currentIndex]?.color || 'from-gray-500 to-gray-600'
                    )}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    {steps[currentIndex]?.label || 'Processing'}
                    <Sparkles className="w-5 h-5 animate-pulse" />
                </motion.div>
                <p className="text-gray-500 mt-2">{steps[currentIndex]?.description}</p>
            </motion.div>

            {/* Progress Line */}
            <div className="relative mb-8">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full -translate-y-1/2" />
                <motion.div
                    className={cn("absolute top-1/2 left-0 h-1 rounded-full -translate-y-1/2 bg-gradient-to-r", steps[currentIndex]?.color)}
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10">
                            {/* Step Circle */}
                            <motion.div
                                className={cn(
                                    "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                    isCompleted
                                        ? cn("bg-gradient-to-br text-white shadow-lg", step.color)
                                        : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                                )}
                                initial={false}
                                animate={isCurrent ? {
                                    scale: [1, 1.15, 1],
                                    rotate: [0, 5, -5, 0],
                                } : { scale: 1 }}
                                transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                            >
                                <Icon className={cn("w-6 h-6", isCompleted && "drop-shadow-md")} />

                                {/* Celebration Particles */}
                                <AnimatePresence>
                                    {celebrateStep === index && (
                                        <>
                                            {[...Array(8)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                                                    initial={{ scale: 0, x: 0, y: 0 }}
                                                    animate={{
                                                        scale: [0, 1, 0],
                                                        x: Math.cos(i * 45 * Math.PI / 180) * 40,
                                                        y: Math.sin(i * 45 * Math.PI / 180) * 40,
                                                    }}
                                                    exit={{ scale: 0 }}
                                                    transition={{ duration: 0.6, delay: i * 0.05 }}
                                                />
                                            ))}
                                        </>
                                    )}
                                </AnimatePresence>

                                {/* Pulse Ring for Current */}
                                {isCurrent && (
                                    <motion.div
                                        className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-30", step.color)}
                                        animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}

                                {/* Checkmark Overlay */}
                                {isCompleted && !isCurrent && (
                                    <motion.div
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                    >
                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Label */}
                            <motion.span
                                className={cn(
                                    "mt-3 text-xs font-medium text-center max-w-[60px] leading-tight",
                                    isCompleted ? "text-gray-800" : "text-gray-400"
                                )}
                                initial={false}
                                animate={{ opacity: isCompleted ? 1 : 0.5 }}
                            >
                                {step.label}
                            </motion.span>
                        </div>
                    );
                })}
            </div>

            {/* ETA Bar */}
            {currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
                <motion.div
                    className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Clock className="w-5 h-5" />
                            </motion.div>
                            <div>
                                <p className="font-semibold text-gray-800">Estimated Arrival</p>
                                <p className="text-sm text-gray-500">Your order is on track!</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <motion.p
                                className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                15-20 min
                            </motion.p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Delivered Celebration */}
            {currentStatus === 'delivered' && (
                <motion.div
                    className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-5xl mb-3"
                    >
                        🎉
                    </motion.div>
                    <h3 className="text-xl font-bold text-green-800">Order Delivered!</h3>
                    <p className="text-green-600">Enjoy your delicious meal</p>
                </motion.div>
            )}
        </div>
    );
};

export default AnimatedOrderStepper;
