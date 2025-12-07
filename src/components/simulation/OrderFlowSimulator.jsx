import React, { useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { CheckCircle, ChefHat, Package, Truck, MapPin, Home, Sparkles } from "lucide-react";

// Order status progression timing (in milliseconds)
const STATUS_TIMING = {
    placed: 2000,      // 2 seconds then → confirmed
    confirmed: 3000,   // 3 seconds then → preparing  
    preparing: 5000,   // 5 seconds then → ready
    ready: 2000,       // 2 seconds then → picked_up
    picked_up: 0,      // Handled by delivery simulation (10 seconds)
};

// Status messages for notifications
const STATUS_MESSAGES = {
    confirmed: {
        title: "✅ Order Confirmed!",
        message: "Restaurant is preparing to cook your food",
        icon: CheckCircle
    },
    preparing: {
        title: "👨‍🍳 Cooking in Progress!",
        message: "Your delicious meal is being prepared",
        icon: ChefHat
    },
    ready: {
        title: "📦 Order Ready!",
        message: "Finding a delivery partner for you...",
        icon: Package
    },
    picked_up: {
        title: "🛵 Driver Assigned!",
        message: "Your delivery partner is picking up your order",
        icon: Truck
    },
    on_the_way: {
        title: "🚀 On The Way!",
        message: "Your food is racing towards you!",
        icon: MapPin
    },
    delivered: {
        title: "🎉 Delivered!",
        message: "Enjoy your meal! Bon appetit!",
        icon: Home
    }
};

// Available demo drivers
const DEMO_DRIVERS = [
    { name: "Rahul Kumar", phone: "+91 98765 43210", rating: 4.8, vehicle: "Honda Activa", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
    { name: "Priya Sharma", phone: "+91 98765 43211", rating: 4.9, vehicle: "TVS Jupiter", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" },
    { name: "Amit Patel", phone: "+91 98765 43212", rating: 4.7, vehicle: "Bajaj Pulsar", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" },
    { name: "Neha Singh", phone: "+91 98765 43213", rating: 4.9, vehicle: "Honda Dio", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" }
];

export default function OrderFlowSimulator({ orderId, onStatusChange }) {
    const timeoutRef = useRef(null);
    const currentStatusRef = useRef(null);

    const simulateOrderFlow = useCallback(async () => {
        if (!orderId) return;

        try {
            // Get current order
            const orders = await base44.entities.Order.filter({ id: orderId });
            const order = orders[0];

            if (!order) return;

            const currentStatus = order.order_status;
            currentStatusRef.current = currentStatus;

            // Skip if already delivered or cancelled
            if (['delivered', 'cancelled'].includes(currentStatus)) return;

            // Determine next status
            const statusOrder = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered'];
            const currentIndex = statusOrder.indexOf(currentStatus);

            if (currentIndex < 0 || currentIndex >= statusOrder.length - 1) return;

            const nextStatus = statusOrder[currentIndex + 1];
            const delay = STATUS_TIMING[currentStatus] || 3000;

            // Skip automatic progression for picked_up → on_the_way → delivered (handled by DeliverySimulation)
            if (currentStatus === 'picked_up') return;

            // Schedule next status update
            timeoutRef.current = setTimeout(async () => {
                try {
                    // Special handling for ready → picked_up (assign driver)
                    if (currentStatus === 'ready') {
                        const driver = DEMO_DRIVERS[Math.floor(Math.random() * DEMO_DRIVERS.length)];

                        await base44.entities.Order.update(orderId, {
                            order_status: nextStatus,
                            driver_name: driver.name,
                            driver_phone: driver.phone,
                            driver_email: `driver-${Date.now()}@demo.com`,
                            driver_rating: driver.rating,
                            driver_vehicle: driver.vehicle,
                            driver_image: driver.image
                        });
                    } else {
                        await base44.entities.Order.update(orderId, {
                            order_status: nextStatus
                        });
                    }

                    // Show notification
                    const statusInfo = STATUS_MESSAGES[nextStatus];
                    if (statusInfo) {
                        const Icon = statusInfo.icon;
                        toast.success(statusInfo.title, {
                            description: statusInfo.message,
                            icon: <Icon className="w-5 h-5" />,
                            duration: 5000
                        });
                    }

                    // Also create notification in database
                    if (order.customer_email) {
                        await base44.entities.Notification.create({
                            user_email: order.customer_email,
                            title: statusInfo?.title || `Order ${nextStatus}`,
                            message: statusInfo?.message || `Your order status changed to ${nextStatus}`,
                            type: "order",
                            data: { order_id: orderId, status: nextStatus }
                        });
                    }

                    // Notify callback
                    if (onStatusChange) {
                        onStatusChange(nextStatus);
                    }

                    // Continue simulation
                    simulateOrderFlow();
                } catch (error) {
                    console.error('Error updating order status:', error);
                }
            }, delay);
        } catch (error) {
            console.error('Error in order simulation:', error);
        }
    }, [orderId, onStatusChange]);

    useEffect(() => {
        // Start simulation
        simulateOrderFlow();

        // Cleanup on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [simulateOrderFlow]);

    return null; // This is a background component
}

// Export for use in other components
export { STATUS_MESSAGES, DEMO_DRIVERS };
