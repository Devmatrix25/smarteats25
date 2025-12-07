import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, AlertCircle, Info, X, Sparkles,
    ShoppingBag, Truck, Bell, PartyPopper
} from 'lucide-react';
import { cn } from '@/lib/utils';

const toastVariants = {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: {
        opacity: 0,
        y: -30,
        scale: 0.9,
        transition: { duration: 0.2 }
    }
};

const AnimatedToast = ({
    type = 'success',
    title,
    message,
    isVisible,
    onClose,
    actionLabel,
    onAction
}) => {
    const config = {
        success: {
            icon: CheckCircle,
            bgGradient: 'from-green-500 to-emerald-600',
            bgLight: 'bg-green-50',
            iconColor: 'text-green-500',
            borderColor: 'border-green-200'
        },
        error: {
            icon: AlertCircle,
            bgGradient: 'from-red-500 to-rose-600',
            bgLight: 'bg-red-50',
            iconColor: 'text-red-500',
            borderColor: 'border-red-200'
        },
        info: {
            icon: Info,
            bgGradient: 'from-blue-500 to-indigo-600',
            bgLight: 'bg-blue-50',
            iconColor: 'text-blue-500',
            borderColor: 'border-blue-200'
        },
        order: {
            icon: ShoppingBag,
            bgGradient: 'from-orange-500 to-pink-500',
            bgLight: 'bg-orange-50',
            iconColor: 'text-orange-500',
            borderColor: 'border-orange-200'
        },
        delivery: {
            icon: Truck,
            bgGradient: 'from-purple-500 to-violet-600',
            bgLight: 'bg-purple-50',
            iconColor: 'text-purple-500',
            borderColor: 'border-purple-200'
        },
        celebration: {
            icon: PartyPopper,
            bgGradient: 'from-yellow-400 to-orange-500',
            bgLight: 'bg-yellow-50',
            iconColor: 'text-yellow-500',
            borderColor: 'border-yellow-200'
        },
        notification: {
            icon: Bell,
            bgGradient: 'from-cyan-500 to-teal-500',
            bgLight: 'bg-cyan-50',
            iconColor: 'text-cyan-500',
            borderColor: 'border-cyan-200'
        }
    };

    const currentConfig = config[type] || config.success;
    const Icon = currentConfig.icon;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed top-6 right-6 z-50 max-w-md"
                    variants={toastVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    <div className={cn(
                        "relative overflow-hidden rounded-2xl shadow-2xl",
                        "bg-white border-2",
                        currentConfig.borderColor
                    )}>
                        {/* Top Gradient Bar */}
                        <div className={cn(
                            "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                            currentConfig.bgGradient
                        )} />

                        {/* Content */}
                        <div className="p-4 pt-5">
                            <div className="flex gap-4">
                                {/* Icon */}
                                <motion.div
                                    className={cn(
                                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white",
                                        currentConfig.bgGradient
                                    )}
                                    initial={{ rotate: -10, scale: 0.8 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Icon className="w-6 h-6" />

                                    {/* Sparkle Effect */}
                                    <motion.div
                                        className="absolute -top-1 -right-1"
                                        animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Sparkles className="w-4 h-4 text-yellow-300" />
                                    </motion.div>
                                </motion.div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <motion.h4
                                        className="font-bold text-gray-900 text-lg mb-0.5"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        {title}
                                    </motion.h4>
                                    <motion.p
                                        className="text-gray-600 text-sm"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {message}
                                    </motion.p>

                                    {/* Action Button */}
                                    {actionLabel && (
                                        <motion.button
                                            className={cn(
                                                "mt-3 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r",
                                                currentConfig.bgGradient
                                            )}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={onAction}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            {actionLabel}
                                        </motion.button>
                                    )}
                                </div>

                                {/* Close Button */}
                                <motion.button
                                    className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <motion.div
                            className={cn("h-1 bg-gradient-to-r", currentConfig.bgGradient)}
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 5, ease: "linear" }}
                            onAnimationComplete={onClose}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Toast Container for multiple toasts
export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast, index) => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <AnimatedToast
                            {...toast}
                            isVisible={true}
                            onClose={() => removeToast(toast.id)}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default AnimatedToast;
