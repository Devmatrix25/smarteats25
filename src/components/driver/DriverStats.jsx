import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Truck, DollarSign, Star, Package, Target, Zap, TrendingUp, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AnimatedCounter = ({ value, prefix = '', suffix = '', duration = 1.5 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const steps = 25;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, (duration * 1000) / steps);
        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const DriverStats = ({
    todayDeliveries = 0,
    todayEarnings = 0,
    totalDeliveries = 0,
    rating = 4.8,
    dailyTarget = 10,
    isOnline = false
}) => {
    const progress = Math.min((todayDeliveries / dailyTarget) * 100, 100);
    const bonusEarned = progress >= 100;

    const stats = [
        {
            label: "Today's Deliveries",
            value: todayDeliveries,
            icon: Truck,
            gradient: 'from-blue-400 to-indigo-600',
            suffix: ''
        },
        {
            label: "Today's Earnings",
            value: todayEarnings,
            icon: DollarSign,
            gradient: 'from-green-400 to-emerald-600',
            prefix: '₹'
        },
        {
            label: 'Total Deliveries',
            value: totalDeliveries,
            icon: Package,
            gradient: 'from-purple-400 to-violet-600',
            suffix: ''
        },
        {
            label: 'Rating',
            value: rating,
            icon: Star,
            gradient: 'from-yellow-400 to-orange-500',
            suffix: '/5',
            isRating: true
        }
    ];

    return (
        <div className="space-y-6">
            {/* Daily Challenge Card */}
            <motion.div
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 p-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Background Animation */}
                <div className="absolute inset-0">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-32 h-32 bg-white/10 rounded-full"
                            style={{
                                left: `${i * 25}%`,
                                top: `${Math.sin(i) * 50 + 50}%`,
                            }}
                            animate={{
                                y: [0, -20, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 3 + i,
                                repeat: Infinity,
                                delay: i * 0.5,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center"
                                animate={{ rotate: bonusEarned ? [0, 360] : 0 }}
                                transition={{ duration: 1, repeat: bonusEarned ? Infinity : 0, repeatDelay: 2 }}
                            >
                                <Target className="w-6 h-6" />
                            </motion.div>
                            <div>
                                <h3 className="text-xl font-bold">Daily Challenge</h3>
                                <p className="text-white/80 text-sm">Complete {dailyTarget} deliveries</p>
                            </div>
                        </div>
                        <motion.div
                            className="text-right"
                            animate={bonusEarned ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            <p className="text-4xl font-bold">{todayDeliveries}/{dailyTarget}</p>
                            {bonusEarned && <p className="text-yellow-300 text-sm font-medium">🎉 Bonus Earned!</p>}
                        </motion.div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-xl">
                        <motion.div
                            className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        >
                            {progress > 20 && (
                                <motion.div
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                >
                                    <Zap className="w-3 h-3 text-orange-600" />
                                </motion.div>
                            )}
                        </motion.div>
                    </div>

                    <p className="text-white/80 text-sm mt-2">
                        {bonusEarned
                            ? "🔥 Amazing! You've earned ₹200 bonus today!"
                            : `${dailyTarget - todayDeliveries} more deliveries for ₹200 bonus`}
                    </p>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            className="relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            {/* Background Gradient */}
                            <div className={cn(
                                "absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 bg-gradient-to-br",
                                stat.gradient
                            )} />

                            {/* Icon */}
                            <motion.div
                                className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br text-white",
                                    stat.gradient
                                )}
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Icon className="w-5 h-5" />
                            </motion.div>

                            {/* Label */}
                            <p className="text-gray-500 text-xs font-medium mb-1">{stat.label}</p>

                            {/* Value */}
                            <motion.p
                                className="text-2xl font-bold text-gray-800"
                                initial={{ scale: 0.5 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                            >
                                {stat.isRating ? (
                                    <span>{stat.value.toFixed(1)}{stat.suffix}</span>
                                ) : (
                                    <AnimatedCounter
                                        value={stat.value}
                                        prefix={stat.prefix || ''}
                                        suffix={stat.suffix || ''}
                                    />
                                )}
                            </motion.p>

                            {/* Hover Glow */}
                            <motion.div
                                className={cn(
                                    "absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-sm bg-gradient-to-r",
                                    stat.gradient
                                )}
                            />
                        </motion.div>
                    );
                })}
            </div>

            {/* Online Status */}
            <motion.div
                className={cn(
                    "flex items-center justify-between p-4 rounded-2xl",
                    isOnline
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        className={cn(
                            "w-3 h-3 rounded-full",
                            isOnline ? "bg-green-500" : "bg-gray-400"
                        )}
                        animate={isOnline ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className={cn(
                        "font-medium",
                        isOnline ? "text-green-700" : "text-gray-500"
                    )}>
                        {isOnline ? "You're Online" : "You're Offline"}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Updated just now</span>
                </div>
            </motion.div>
        </div>
    );
};

export default DriverStats;
