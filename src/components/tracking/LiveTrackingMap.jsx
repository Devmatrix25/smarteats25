import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Clock, Phone, Truck, Home, ChefHat, Store, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simulated route coordinates (Bangalore area)
const generateRoute = (start, end, steps = 20) => {
    const route = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Add some randomness to make it look like real roads
        const jitter = (Math.random() - 0.5) * 0.002;
        route.push({
            lat: start.lat + (end.lat - start.lat) * t + jitter,
            lng: start.lng + (end.lng - start.lng) * t + jitter,
        });
    }
    return route;
};

const LiveTrackingMap = ({
    order,
    restaurantLocation = { lat: 12.9716, lng: 77.5946, name: 'Restaurant' },
    customerLocation = { lat: 12.9816, lng: 77.6046, name: 'Your Location' },
    driverLocation,
    onDriverArrival
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [route, setRoute] = useState([]);
    const [eta, setEta] = useState(15);
    const [isPaused, setIsPaused] = useState(false);

    // Generate route on mount
    useEffect(() => {
        const newRoute = generateRoute(restaurantLocation, customerLocation, 30);
        setRoute(newRoute);
    }, []);

    // Simulate driver movement
    useEffect(() => {
        if (!route.length || isPaused) return;

        const interval = setInterval(() => {
            setCurrentStep(prev => {
                if (prev >= route.length - 1) {
                    clearInterval(interval);
                    onDriverArrival?.();
                    return prev;
                }
                return prev + 1;
            });
            setEta(prev => Math.max(0, prev - 0.5));
        }, 1000);

        return () => clearInterval(interval);
    }, [route, isPaused]);

    const progress = (currentStep / (route.length - 1)) * 100;
    const currentDriverPos = route[currentStep] || restaurantLocation;

    return (
        <motion.div
            className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            {/* Simulated Map Background */}
            <div className="relative h-[350px] overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-30">
                    <svg className="w-full h-full">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Animated Road */}
                <svg className="absolute inset-0 w-full h-full">
                    {/* Route Path */}
                    <motion.path
                        d={`M 80 280 Q 150 200 200 180 Q 280 150 320 120 Q 360 100 400 80`}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="20"
                        strokeLinecap="round"
                    />
                    <motion.path
                        d={`M 80 280 Q 150 200 200 180 Q 280 150 320 120 Q 360 100 400 80`}
                        fill="none"
                        stroke="url(#routeGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="12 8"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: progress / 100 }}
                        transition={{ duration: 0.5 }}
                    />
                    <defs>
                        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Restaurant Marker */}
                <motion.div
                    className="absolute"
                    style={{ left: '60px', top: '260px' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                >
                    <div className="relative">
                        <motion.div
                            className="absolute inset-0 bg-orange-400 rounded-full blur-lg opacity-50"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="relative w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Store className="w-7 h-7 text-white" />
                        </div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow text-xs font-medium">
                            Restaurant
                        </div>
                    </div>
                </motion.div>

                {/* Moving Driver */}
                <motion.div
                    className="absolute"
                    style={{
                        left: `${60 + (progress / 100) * 340}px`,
                        top: `${260 - (progress / 100) * 180}px`,
                    }}
                    transition={{ type: "spring", stiffness: 100 }}
                >
                    <div className="relative">
                        {/* Pulse Effect */}
                        <motion.div
                            className="absolute -inset-4 bg-green-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        {/* Driver Icon */}
                        <motion.div
                            className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span className="text-3xl">🏍️</span>
                        </motion.div>
                        {/* Speed Lines */}
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute h-0.5 bg-gradient-to-l from-transparent to-green-400"
                                style={{
                                    width: 20 + i * 10,
                                    left: -30 - i * 10,
                                    top: 28 + i * 4,
                                }}
                                animate={{ opacity: [0, 1, 0], scaleX: [0.5, 1, 0.5] }}
                                transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Customer Location */}
                <motion.div
                    className="absolute"
                    style={{ left: '380px', top: '60px' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                >
                    <div className="relative">
                        <motion.div
                            className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-50"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="relative w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Home className="w-7 h-7 text-white" />
                        </div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow text-xs font-medium">
                            Your Location
                        </div>
                    </div>
                </motion.div>

                {/* Floating Particles */}
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full"
                        style={{
                            left: `${100 + i * 80}px`,
                            top: `${50 + Math.sin(i) * 50}px`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                            duration: 3,
                            delay: i * 0.3,
                            repeat: Infinity,
                        }}
                    />
                ))}
            </div>

            {/* Bottom Info Panel */}
            <div className="p-5 bg-white rounded-t-3xl -mt-6 relative z-10">
                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                            <Store className="w-4 h-4 text-orange-500" />
                            Restaurant
                        </span>
                        <span className="flex items-center gap-1">
                            <Home className="w-4 h-4 text-blue-500" />
                            Your Location
                        </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 rounded-full relative"
                            style={{ width: `${progress}%` }}
                        >
                            <motion.div
                                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-green-500"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* ETA & Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center text-white"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Clock className="w-7 h-7" />
                        </motion.div>
                        <div>
                            <p className="text-sm text-gray-500">Arriving in</p>
                            <motion.p
                                className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent"
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {Math.ceil(eta)} mins
                            </motion.p>
                        </div>
                    </div>

                    <motion.button
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl text-white font-semibold shadow-lg shadow-green-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Phone className="w-5 h-5" />
                        Call Driver
                    </motion.button>
                </div>

                {/* Status Text */}
                <motion.div
                    className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl flex items-center gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <Navigation className="w-5 h-5 text-green-500" />
                    </motion.div>
                    <p className="text-sm text-green-700">
                        <span className="font-semibold">Rajesh</span> is on the way with your order!
                    </p>
                    <Sparkles className="w-4 h-4 text-yellow-500 ml-auto" />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default LiveTrackingMap;
