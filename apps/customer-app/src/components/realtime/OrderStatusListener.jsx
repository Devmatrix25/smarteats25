import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Bell, CheckCircle, Truck, Package, ChefHat, Clock, MapPin } from "lucide-react";

const STATUS_MESSAGES = {
  confirmed: { title: "Order Confirmed! ✓", message: "Restaurant is preparing to cook your food", icon: CheckCircle, color: "bg-blue-500" },
  preparing: { title: "Cooking Started! 👨‍🍳", message: "Chef is preparing your delicious meal", icon: ChefHat, color: "bg-yellow-500" },
  ready: { title: "Order Ready! 📦", message: "Finding a delivery partner for you...", icon: Package, color: "bg-purple-500" },
  picked_up: { title: "Driver Assigned! 🛵", message: "Your delivery partner is picking up your order", icon: Truck, color: "bg-orange-500" },
  on_the_way: { title: "On The Way! 🚀", message: "Your food is racing towards you!", icon: MapPin, color: "bg-green-500" },
  delivered: { title: "Delivered! 🎉", message: "Enjoy your meal! Don't forget to rate!", icon: CheckCircle, color: "bg-green-600" },
  cancelled: { title: "Order Cancelled", message: "Your order has been cancelled", icon: Bell, color: "bg-red-500" }
};

export default function OrderStatusListener({ userEmail, onStatusChange }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const prevStatusRef = useRef({});
  const pollIntervalRef = useRef(null);

  const checkForUpdates = useCallback(async () => {
    if (!userEmail) return;

    try {
      const orders = await base44.entities.Order.filter({
        customer_email: userEmail
      }, '-created_date', 10);

      const active = orders.filter(o => 
        !['delivered', 'cancelled'].includes(o.order_status)
      );

      // Check for status changes
      active.forEach(order => {
        const prevStatus = prevStatusRef.current[order.id];
        if (prevStatus && prevStatus !== order.order_status) {
          // Status changed - show notification
          const statusInfo = STATUS_MESSAGES[order.order_status];
          if (statusInfo) {
            toast(statusInfo.title, {
              description: `Order #${order.order_number}: ${statusInfo.message}`,
              icon: <statusInfo.icon className="w-5 h-5" />,
              duration: 6000
            });
          }
          
          if (onStatusChange) onStatusChange(order);
        }
        prevStatusRef.current[order.id] = order.order_status;
      });

      // Also check recently delivered orders for notifications
      const recentlyDelivered = orders.filter(o => 
        o.order_status === 'delivered' && 
        !prevStatusRef.current[o.id]
      );
      
      recentlyDelivered.forEach(order => {
        prevStatusRef.current[order.id] = order.order_status;
      });

      setActiveOrders(active);
    } catch (e) {
      console.log('Failed to check order updates');
    }
  }, [userEmail, onStatusChange]);

  useEffect(() => {
    if (!userEmail) return;

    // Initial check
    checkForUpdates();

    // Poll every 2 seconds for true real-time feel
    pollIntervalRef.current = setInterval(checkForUpdates, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userEmail, checkForUpdates]);

  return null; // This is a listener component, no UI
}

// Export status messages for use in other components
export { STATUS_MESSAGES };