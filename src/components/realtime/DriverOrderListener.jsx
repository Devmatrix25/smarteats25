import React, { useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { MapPin, Package, DollarSign } from "lucide-react";

export default function DriverOrderListener({ driverEmail, isOnline, onNewDelivery, onOrderUpdate }) {
  const prevOrdersRef = useRef([]);
  const prevAssignedRef = useRef({});
  const pollIntervalRef = useRef(null);

  const checkForAvailableOrders = useCallback(async () => {
    if (!isOnline) return;

    try {
      // Check driver availability status first
      const drivers = await base44.entities.Driver.filter({ email: driverEmail });
      const currentDriver = drivers[0];

      // Don't show orders if driver is on break or unavailable
      if (currentDriver?.availability_status === 'on_break' ||
        currentDriver?.availability_status === 'unavailable') {
        return;
      }

      // Get orders ready for pickup without assigned driver
      const readyOrders = await base44.entities.Order.filter({
        order_status: 'ready'
      }, '-created_date', 10);

      const availableOrders = readyOrders.filter(o => !o.driver_email);
      const prevIds = prevOrdersRef.current.map(o => o.id);

      // Check for new available orders
      const newOrders = availableOrders.filter(o => !prevIds.includes(o.id));

      if (newOrders.length > 0) {
        // Check for batch opportunities
        const hasBatchOpportunity = newOrders.length > 1 || availableOrders.length > 1;

        toast.success(`🚴 ${newOrders.length} New Delivery Available!`, {
          description: hasBatchOpportunity
            ? `${newOrders[0].restaurant_name} • Batch bonus available!`
            : `${newOrders[0].restaurant_name} • ₹50 earning`,
          duration: 10000,
          action: {
            label: "View",
            onClick: () => onNewDelivery?.(newOrders)
          }
        });

        if (onNewDelivery) onNewDelivery(newOrders);
      }

      prevOrdersRef.current = availableOrders;
    } catch (e) {
      console.log('Failed to check available orders');
    }
  }, [isOnline, driverEmail, onNewDelivery]);

  const checkAssignedOrders = useCallback(async () => {
    if (!driverEmail) return;

    try {
      const orders = await base44.entities.Order.filter({
        driver_email: driverEmail
      }, '-created_date', 5);

      orders.forEach(order => {
        const prevStatus = prevAssignedRef.current[order.id];
        if (prevStatus && prevStatus !== order.order_status) {
          // Order status changed - notify driver
          if (order.order_status === 'delivered') {
            toast.success("🎉 Delivery Completed!", {
              description: `Order #${order.order_number} delivered! +₹50 earned`,
              duration: 8000
            });
          }
        }
        prevAssignedRef.current[order.id] = order.order_status;
        if (onOrderUpdate) onOrderUpdate(order);
      });
    } catch (e) {
      console.log('Failed to check assigned orders');
    }
  }, [driverEmail, onOrderUpdate]);

  useEffect(() => {
    if (!driverEmail) return;

    checkForAvailableOrders();
    checkAssignedOrders();

    // Poll every 15 seconds (reduced from 2s to avoid rate limiting)
    pollIntervalRef.current = setInterval(() => {
      if (isOnline) checkForAvailableOrders();
      checkAssignedOrders();
    }, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [driverEmail, isOnline, checkForAvailableOrders, checkAssignedOrders]);

  return null;
}