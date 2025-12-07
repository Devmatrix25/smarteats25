import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Star, Navigation, MessageCircle, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const PremiumDriverCard = ({ driver, order, onCall, onMessage }) => {
    // Mock driver data if not provided
    const driverData = driver || {
        name: order?.driver_name || 'Rajesh Kumar',
        phone: '+91 98765 43210',
        rating: 4.8,
        trips: 1247,
        vehicle: 'Honda Activa',
        vehicleNumber: 'KA 01 AB 1234',
        avatar: null,
        eta: '8 mins',
        distance: '2.3 km'
    };

    return (
        <motion.div
            className={cn(
                "relative overflow-hidden",
                "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
                "rounded-3xl p-6 shadow-2xl"
            )}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
        >
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl"
                    animate={{
                        x: [0, -50, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
            </div>

            {/* Header - ETA Badge */}
            <motion.div
                className="absolute top-4 right-4 z-20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl text-white">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">{driverData.eta}</span>
                </div>
            </motion.div>

            {/* Driver Info */}
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    {/* Avatar */}
                    <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1 }}
                    >
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 p-0.5">
                            <div className="w-full h-full rounded-[14px] bg-slate-800 flex items-center justify-center">
                                <span className="text-3xl">🧑‍✈️</span>
                            </div>
                        </div>
                        {/* Online Indicator */}
                        <motion.div
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-900"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </motion.div>

                    {/* Name & Rating */}
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{driverData.name}</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-yellow-400 font-semibold">{driverData.rating}</span>
                            </div>
                            <span className="text-gray-400 text-sm">{driverData.trips} trips</span>
                        </div>
                    </div>
                </div>

                {/* Vehicle Info */}
                <motion.div
                    className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-lg rounded-2xl mb-4 border border-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🏍️</span>
                    </div>
                    <div>
                        <p className="text-white font-medium">{driverData.vehicle}</p>
                        <p className="text-gray-400 text-sm font-mono">{driverData.vehicleNumber}</p>
                    </div>
                </motion.div>

                {/* Live Distance */}
                <motion.div
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl mb-6 border border-blue-500/20"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                            <Navigation className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                            <p className="text-gray-400 text-sm">Distance</p>
                            <motion.p
                                className="text-white font-bold text-lg"
                                animate={{ opacity: [1, 0.7, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                {driverData.distance} away
                            </motion.p>
                        </div>
                    </div>

                    {/* Live Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full">
                        <motion.div
                            className="w-2 h-2 bg-red-500 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-red-400 text-sm font-medium">LIVE</span>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <motion.button
                        className="flex-1 py-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCall}
                    >
                        <Phone className="w-5 h-5" />
                        Call Driver
                    </motion.button>
                    <motion.button
                        className="py-4 px-6 bg-white/10 backdrop-blur-lg rounded-2xl text-white font-bold flex items-center justify-center gap-2 border border-white/20"
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.15)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onMessage}
                    >
                        <MessageCircle className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* Safety Badge */}
                <motion.div
                    className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Verified Driver • Trip Insurance Active</span>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default PremiumDriverCard;
