import React, { useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Bell, ShoppingBag } from "lucide-react";

export default function RestaurantOrderListener({ restaurantId, onNewOrder, onOrderUpdate }) {
  const prevOrdersRef = useRef([]);
  const pollIntervalRef = useRef(null);

  const checkForUpdates = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const orders = await base44.entities.Order.filter({
        restaurant_id: restaurantId
      }, '-created_date', 20);

      const prevOrderIds = prevOrdersRef.current.map(o => o.id);

      // Check for new orders
      const newOrders = orders.filter(o =>
        !prevOrderIds.includes(o.id) &&
        ['placed', 'scheduled'].includes(o.order_status)
      );

      if (newOrders.length > 0) {
        newOrders.forEach(order => {
          toast.success(`🔔 NEW ORDER #${order.order_number}!`, {
            description: `${order.customer_name} • ${order.items?.length || 0} items • ₹${order.total_amount}`,
            duration: 15000,
            action: {
              label: "Accept Now",
              onClick: () => onNewOrder?.(order)
            }
          });
        });

        if (onNewOrder) onNewOrder(newOrders[0]);
      }

      // Check for status changes on existing orders
      orders.forEach(order => {
        const prevOrder = prevOrdersRef.current.find(o => o.id === order.id);
        if (prevOrder && prevOrder.order_status !== order.order_status) {
          if (onOrderUpdate) onOrderUpdate(order);
        }
      });

      prevOrdersRef.current = orders;
    } catch (e) {
      console.log('Failed to check restaurant orders');
    }
  }, [restaurantId, onNewOrder, onOrderUpdate]);

  useEffect(() => {
    if (!restaurantId) return;

    // Initial load
    checkForUpdates();

    // Poll every 15 seconds (reduced from 2s to avoid rate limiting)
    pollIntervalRef.current = setInterval(checkForUpdates, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [restaurantId, checkForUpdates]);

  return null;
}