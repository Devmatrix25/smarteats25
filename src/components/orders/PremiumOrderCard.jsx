import React from 'react';
import { motion } from 'framer-motion';
import {
    Clock, CheckCircle, ChefHat, Package, Truck, Home,
    AlertCircle, Calendar, User, Phone, MapPin, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusConfig = {
    scheduled: {
        icon: Calendar,
        color: 'from-purple-400 to-purple-600',
        bgColor: 'bg-purple-50',
        pulseColor: 'bg-purple-400',
        label: 'Scheduled'
    },
    placed: {
        icon: Sparkles,
        color: 'from-blue-400 to-blue-600',
        bgColor: 'bg-blue-50',
        pulseColor: 'bg-blue-400',
        label: 'New Order'
    },
    confirmed: {
        icon: CheckCircle,
        color: 'from-cyan-400 to-cyan-600',
        bgColor: 'bg-cyan-50',
        pulseColor: 'bg-cyan-400',
        label: 'Confirmed'
    },
    preparing: {
        icon: ChefHat,
        color: 'from-amber-400 to-orange-500',
        bgColor: 'bg-amber-50',
        pulseColor: 'bg-amber-400',
        label: 'Preparing'
    },
    ready: {
        icon: Package,
        color: 'from-violet-400 to-violet-600',
        bgColor: 'bg-violet-50',
        pulseColor: 'bg-violet-400',
        label: 'Ready'
    },
    picked_up: {
        icon: Truck,
        color: 'from-indigo-400 to-indigo-600',
        bgColor: 'bg-indigo-50',
        pulseColor: 'bg-indigo-400',
        label: 'Picked Up'
    },
    on_the_way: {
        icon: MapPin,
        color: 'from-teal-400 to-teal-600',
        bgColor: 'bg-teal-50',
        pulseColor: 'bg-teal-400',
        label: 'On The Way'
    },
    delivered: {
        icon: Home,
        color: 'from-green-400 to-green-600',
        bgColor: 'bg-green-50',
        pulseColor: 'bg-green-400',
        label: 'Delivered'
    },
    cancelled: {
        icon: AlertCircle,
        color: 'from-red-400 to-red-600',
        bgColor: 'bg-red-50',
        pulseColor: 'bg-red-400',
        label: 'Cancelled'
    },
};

const PremiumOrderCard = ({
    order,
    onAccept,
    onReject,
    onPrepare,
    onReady,
    onClick,
    isNew = false
}) => {
    const config = statusConfig[order.order_status] || statusConfig.placed;
    const StatusIcon = config.icon;

    return (
        <motion.div
            className={cn(
                "relative group cursor-pointer",
                "bg-white rounded-3xl overflow-hidden",
                "shadow-lg hover:shadow-2xl transition-all duration-500",
                "border border-gray-100 hover:border-transparent"
            )}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={onClick}
            layout
        >
            {/* Gradient Border on Hover */}
            <motion.div
                className={cn(
                    "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    "bg-gradient-to-r p-[2px]",
                    config.color
                )}
                style={{ margin: -2 }}
            >
                <div className="absolute inset-[2px] bg-white rounded-[22px]" />
            </motion.div>

            {/* New Order Pulse */}
            {isNew && (
                <motion.div
                    className="absolute -top-1 -right-1 z-20"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    <span className="flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center text-white text-xs font-bold">
                            !
                        </span>
                    </span>
                </motion.div>
            )}

            {/* Content */}
            <div className="relative z-10 p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-gray-800">#{order.order_number}</span>
                            {order.is_scheduled && (
                                <motion.span
                                    className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    Scheduled
                                </motion.span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">
                            {order.is_scheduled
                                ? `${format(new Date(order.scheduled_date), "MMM d")} • ${order.scheduled_time}`
                                : format(new Date(order.created_date), "h:mm a • MMM d")
                            }
                        </p>
                    </div>

                    {/* Status Badge */}
                    <motion.div
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-white text-sm font-medium bg-gradient-to-r",
                            config.color
                        )}
                        animate={order.order_status === 'placed' ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        <StatusIcon className="w-4 h-4" />
                        {config.label}
                    </motion.div>
                </div>

                {/* Customer Info */}
                <div className={cn("p-3 rounded-2xl mb-4", config.bgColor)}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br",
                            config.color
                        )}>
                            <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{order.customer_name}</p>
                            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {order.delivery_address?.substring(0, 30)}...
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Preview */}
                <div className="space-y-2 mb-4">
                    {order.items?.slice(0, 2).map((item, idx) => (
                        <motion.div
                            key={idx}
                            className="flex justify-between items-center text-sm"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold">
                                    {item.quantity}
                                </span>
                                <span className="text-gray-700">{item.name}</span>
                            </span>
                            <span className="font-medium text-gray-800">₹{item.price * item.quantity}</span>
                        </motion.div>
                    ))}
                    {order.items?.length > 2 && (
                        <p className="text-xs text-gray-400 pl-8">+{order.items.length - 2} more items</p>
                    )}
                </div>

                {/* Divider with gradient */}
                <div className={cn("h-px bg-gradient-to-r mb-4 opacity-30", config.color)} />

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                            {order.estimated_time || '25-30 min'}
                        </span>
                    </div>
                    <motion.p
                        className={cn(
                            "text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                            config.color
                        )}
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        ₹{order.total_amount}
                    </motion.p>
                </div>

                {/* Action Buttons */}
                {['placed', 'scheduled'].includes(order.order_status) && (
                    <div className="flex gap-2 mt-4">
                        <motion.button
                            className="flex-1 py-2.5 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => { e.stopPropagation(); onAccept?.(order.id); }}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                        </motion.button>
                        <motion.button
                            className="flex-1 py-2.5 bg-white border-2 border-red-200 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => { e.stopPropagation(); onReject?.(order.id); }}
                        >
                            <AlertCircle className="w-4 h-4" />
                            Reject
                        </motion.button>
                    </div>
                )}

                {order.order_status === 'confirmed' && (
                    <motion.button
                        className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(251, 146, 60, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => { e.stopPropagation(); onPrepare?.(order.id); }}
                    >
                        <ChefHat className="w-4 h-4" />
                        Start Preparing
                    </motion.button>
                )}

                {order.order_status === 'preparing' && (
                    <motion.button
                        className="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-400 to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => { e.stopPropagation(); onReady?.(order.id); }}
                    >
                        <Package className="w-4 h-4" />
                        Mark Ready
                    </motion.button>
                )}
            </div>

            {/* Bottom Glow Effect */}
            <motion.div
                className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity blur-sm",
                    config.color
                )}
            />
        </motion.div>
    );
};

export default PremiumOrderCard;
