import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from "sonner";
import { Phone, MessageCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom icons
const createIcon = (color, emoji) => new L.DivIcon({
  html: `<div style="width: 40px; height: 40px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white; font-size: 18px;">${emoji}</div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const driverIcon = createIcon('#F25C23', '🛵');
const restaurantIcon = createIcon('#FFC043', '🍽️');
const homeIcon = createIcon('#3BA55D', '🏠');

// Map bounds updater
function MapUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

// Bangalore area coordinates for simulation
const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 };
const SIMULATION_DURATION = 20000; // 20 seconds - Flash delivery!

export default function DeliverySimulation({ 
  order, 
  onDeliveryComplete,
  restaurantLocation = { lat: 12.9716, lng: 77.5946 },
  deliveryLocation = { lat: 12.9816, lng: 77.6046 }
}) {
  const [driverPosition, setDriverPosition] = useState(null);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(30);
  const [status, setStatus] = useState(order?.order_status || 'picked_up');
  const simulationRef = useRef(null);
  const startTimeRef = useRef(null);

  // Generate a realistic path between two points
  const generatePath = useCallback((start, end, steps = 50) => {
    const path = [];
    // Add some random waypoints for realistic movement
    const midLat = (start.lat + end.lat) / 2 + (Math.random() - 0.5) * 0.01;
    const midLng = (start.lng + end.lng) / 2 + (Math.random() - 0.5) * 0.01;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let lat, lng;
      
      if (t < 0.5) {
        // First half - from start to mid
        const t2 = t * 2;
        lat = start.lat + (midLat - start.lat) * t2;
        lng = start.lng + (midLng - start.lng) * t2;
      } else {
        // Second half - from mid to end
        const t2 = (t - 0.5) * 2;
        lat = midLat + (end.lat - midLat) * t2;
        lng = midLng + (end.lng - midLng) * t2;
      }
      
      // Add slight random variation for realistic movement
      lat += (Math.random() - 0.5) * 0.0005;
      lng += (Math.random() - 0.5) * 0.0005;
      
      path.push({ lat, lng });
    }
    return path;
  }, []);

  // Start simulation when component mounts and order is picked up
  useEffect(() => {
    if (!order || !['picked_up', 'on_the_way'].includes(order.order_status)) return;

    const path = generatePath(restaurantLocation, deliveryLocation);
    startTimeRef.current = Date.now();
    setDriverPosition(path[0]);

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progressPercent = Math.min(elapsed / SIMULATION_DURATION, 1);
      const pathIndex = Math.floor(progressPercent * (path.length - 1));
      
      setDriverPosition(path[pathIndex]);
      setProgress(Math.round(progressPercent * 100));
      setEta(Math.max(0, Math.round(20 - (progressPercent * 20))));

      // Update status based on progress
      if (progressPercent > 0.1 && status !== 'on_the_way') {
        setStatus('on_the_way');
        updateOrderStatus(order.id, 'on_the_way');
      }

      if (progressPercent >= 1) {
        setStatus('delivered');
        completeDelivery(order);
        if (onDeliveryComplete) onDeliveryComplete();
        toast.success("⚡ Flash Delivery Complete! 🎉", {
          description: "Delivered faster than expected! Rate your experience.",
          duration: 8000
        });
        return;
      }

      simulationRef.current = requestAnimationFrame(animate);
    };

    simulationRef.current = requestAnimationFrame(animate);

    return () => {
      if (simulationRef.current) {
        cancelAnimationFrame(simulationRef.current);
      }
    };
  }, [order?.id]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await base44.entities.Order.update(orderId, { 
        order_status: newStatus,
        ...(newStatus === 'delivered' ? { actual_delivery_time: new Date().toISOString() } : {})
      });
      
      // Send notification to customer
      if (order?.customer_email) {
        const statusMessages = {
          on_the_way: { title: "Driver is on the way! 🛵", message: "Your order will arrive soon" },
          delivered: { title: "Order Delivered! 🎉", message: "Enjoy your meal!" }
        };
        if (statusMessages[newStatus]) {
          await base44.entities.Notification.create({
            user_email: order.customer_email,
            title: statusMessages[newStatus].title,
            message: statusMessages[newStatus].message,
            type: "order",
            data: { order_id: orderId, status: newStatus }
          });
        }
      }
    } catch (e) {
      console.error('Failed to update order status');
    }
  };

  const completeDelivery = async (order) => {
    try {
      // Update order with flash delivery message
      await base44.entities.Order.update(order.id, { 
        order_status: 'delivered',
        actual_delivery_time: new Date().toISOString()
      });

      // Update driver stats if driver exists
      if (order.driver_email) {
        const drivers = await base44.entities.Driver.filter({ email: order.driver_email });
        if (drivers.length > 0) {
          const driver = drivers[0];
          await base44.entities.Driver.update(driver.id, {
            is_busy: false,
            total_deliveries: (driver.total_deliveries || 0) + 1,
            total_earnings: (driver.total_earnings || 0) + 50
          });
        }
      }

      // Create delivery notification for customer
      if (order.customer_email) {
        await base44.entities.Notification.create({
          user_email: order.customer_email,
          title: "⚡ Flash Delivery Complete! 🎉",
          message: `Your order #${order.order_number} arrived faster than expected! Enjoy your meal and don't forget to rate your experience.`,
          type: "order",
          data: { order_id: order.id, status: 'delivered' }
        });
      }

      // Create notification for driver
      if (order.driver_email) {
        await base44.entities.Notification.create({
          user_email: order.driver_email,
          title: "🎉 Delivery Completed!",
          message: `Order #${order.order_number} delivered successfully! +₹50 added to your earnings.`,
          type: "order",
          data: { order_id: order.id, earnings: 50 }
        });
      }
    } catch (e) {
      console.error('Failed to complete delivery');
    }
  };

  if (!order) return null;

  const restaurantPos = [restaurantLocation.lat, restaurantLocation.lng];
  const deliveryPos = [deliveryLocation.lat, deliveryLocation.lng];
  const driverPos = driverPosition ? [driverPosition.lat, driverPosition.lng] : restaurantPos;

  return (
    <div className="relative">
      {/* Map */}
      <div className="h-64 sm:h-80 rounded-2xl overflow-hidden">
        <MapContainer
          center={[BANGALORE_CENTER.lat, BANGALORE_CENTER.lng]}
          zoom={14}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <MapUpdater bounds={[restaurantPos, deliveryPos]} />
          
          {/* Restaurant Marker */}
          <Marker position={restaurantPos} icon={restaurantIcon}>
            <Popup>{order.restaurant_name || 'Restaurant'}</Popup>
          </Marker>
          
          {/* Delivery Location Marker */}
          <Marker position={deliveryPos} icon={homeIcon}>
            <Popup>Delivery Location</Popup>
          </Marker>
          
          {/* Driver Marker with animation */}
          {driverPosition && (
            <Marker position={driverPos} icon={driverIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{order.driver_name || 'Driver'}</p>
                  <p className="text-sm text-gray-500">On the way</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Route Line */}
          <Polyline 
            positions={[restaurantPos, deliveryPos]} 
            color="#F25C23" 
            weight={4}
            dashArray="10, 10"
            opacity={0.6}
          />
          
          {/* Completed Route */}
          {driverPosition && (
            <Polyline 
              positions={[restaurantPos, driverPos]} 
              color="#3BA55D" 
              weight={4}
            />
          )}
        </MapContainer>
      </div>

      {/* Progress Overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#F25C23] rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-lg">🛵</span>
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {status === 'delivered' ? 'Delivered!' : 
                   status === 'on_the_way' ? 'On the way' : 'Picked up'}
                </p>
                <p className="text-xs text-gray-500">{order.driver_name || 'Driver'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#F25C23]">{eta}</p>
              <p className="text-xs text-gray-500">mins left</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#F25C23] to-[#3BA55D] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Restaurant</span>
            <span>{progress}% complete</span>
            <span>Your location</span>
          </div>
        </div>
      </div>
    </div>
  );
}