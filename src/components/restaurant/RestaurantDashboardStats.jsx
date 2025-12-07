import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, DollarSign, ShoppingBag, Users, Star,
    ArrowUp, ArrowDown, Sparkles, Calendar, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AnimatedCounter = ({ value, prefix = '', suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 1500;
        const steps = 30;
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
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <span>
            {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
    );
};

const StatCard = ({
    title,
    value,
    prefix = '',
    suffix = '',
    change,
    icon: Icon,
    gradient,
    delay = 0
}) => {
    const isPositive = change >= 0;

    return (
        <motion.div
            className={cn(
                "relative overflow-hidden rounded-3xl p-6",
                "bg-white shadow-xl border border-gray-100",
                "hover:shadow-2xl transition-shadow duration-500"
            )}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -5 }}
        >
            {/* Background Gradient */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 bg-gradient-to-br",
                gradient
            )} />

            {/* Icon */}
            <motion.div
                className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br text-white",
                    gradient
                )}
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
            >
                <Icon className="w-7 h-7" />
            </motion.div>

            {/* Title */}
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>

            {/* Value */}
            <motion.p
                className="text-3xl font-bold text-gray-800 mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, type: "spring" }}
            >
                <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
            </motion.p>

            {/* Change Indicator */}
            <div className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold",
                isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
                {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {Math.abs(change)}% vs last week
            </div>

            {/* Sparkle */}
            <motion.div
                className="absolute top-4 right-4"
                animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <Sparkles className="w-5 h-5 text-yellow-400" />
            </motion.div>
        </motion.div>
    );
};

const RestaurantDashboardStats = ({ stats }) => {
    const defaultStats = stats || {
        todayRevenue: 15750,
        todayOrders: 42,
        averageRating: 4.8,
        activeCustomers: 156,
        revenueChange: 12.5,
        ordersChange: 8.3,
        ratingChange: 2.1,
        customersChange: -3.2
    };

    return (
        <div className="mb-8">
            {/* Header */}
            <motion.div
                className="flex items-center justify-between mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        Dashboard Overview
                        <motion.span
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            📊
                        </motion.span>
                    </h2>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Last updated: Just now
                    </p>
                </div>

                <motion.div
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white"
                    whileHover={{ scale: 1.05 }}
                >
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">Today</span>
                </motion.div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Revenue"
                    value={defaultStats.todayRevenue}
                    prefix="₹"
                    change={defaultStats.revenueChange}
                    icon={DollarSign}
                    gradient="from-green-400 to-emerald-600"
                    delay={0}
                />
                <StatCard
                    title="Total Orders"
                    value={defaultStats.todayOrders}
                    change={defaultStats.ordersChange}
                    icon={ShoppingBag}
                    gradient="from-blue-400 to-indigo-600"
                    delay={0.1}
                />
                <StatCard
                    title="Average Rating"
                    value={defaultStats.averageRating}
                    suffix="/5"
                    change={defaultStats.ratingChange}
                    icon={Star}
                    gradient="from-yellow-400 to-orange-500"
                    delay={0.2}
                />
                <StatCard
                    title="Active Customers"
                    value={defaultStats.activeCustomers}
                    change={defaultStats.customersChange}
                    icon={Users}
                    gradient="from-pink-400 to-rose-600"
                    delay={0.3}
                />
            </div>

            {/* Live Activity Indicator */}
            <motion.div
                className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl flex items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-3 h-3 bg-green-500 rounded-full"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="font-medium text-gray-700">Live Dashboard</span>
                    <span className="text-gray-500">• Real-time updates enabled</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>Performance is <span className="text-green-600 font-semibold">excellent</span> today!</span>
                </div>
            </motion.div>
        </div>
    );
};

export default RestaurantDashboardStats;
