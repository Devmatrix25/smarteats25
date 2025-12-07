import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from "sonner";
import { Clock, Truck, MapPin, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
const waitingIcon = createIcon('#9CA3AF', '⏳');

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

const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 };

export default function CustomerTrackingMap({ 
  order,
  restaurantLocation = { lat: 12.9716, lng: 77.5946 },
  deliveryLocation = { lat: 12.9816, lng: 77.6046 }
}) {
  const [driverPosition, setDriverPosition] = useState(null);
  const [eta, setEta] = useState(null);
  const [status, setStatus] = useState(order?.order_status || 'placed');

  // Calculate ETA based on status
  useEffect(() => {
    const statusETAs = {
      placed: 45,
      confirmed: 40,
      preparing: 30,
      ready: 25,
      picked_up: 20,
      on_the_way: 10,
      delivered: 0
    };
    setEta(statusETAs[order?.order_status] || 45);
    setStatus(order?.order_status);
  }, [order?.order_status]);

  // Only show driver position when order is picked up or on the way
  const showDriver = ['picked_up', 'on_the_way'].includes(order?.order_status);

  // Simulate driver position when on the way
  useEffect(() => {
    if (!showDriver) {
      setDriverPosition(null);
      return;
    }

    // Start from restaurant
    if (order?.order_status === 'picked_up') {
      setDriverPosition(restaurantLocation);
    } else if (order?.order_status === 'on_the_way') {
      // Simulate movement towards delivery
      const progress = Math.random() * 0.7 + 0.1; // 10% to 80% progress
      const lat = restaurantLocation.lat + (deliveryLocation.lat - restaurantLocation.lat) * progress;
      const lng = restaurantLocation.lng + (deliveryLocation.lng - restaurantLocation.lng) * progress;
      setDriverPosition({ lat, lng });
    }
  }, [order?.order_status, showDriver]);

  const restaurantPos = [restaurantLocation.lat, restaurantLocation.lng];
  const deliveryPos = [deliveryLocation.lat, deliveryLocation.lng];
  const driverPos = driverPosition ? [driverPosition.lat, driverPosition.lng] : null;

  // Status-based messaging
  const getStatusMessage = () => {
    switch (order?.order_status) {
      case 'placed':
        return { text: "Waiting for restaurant to confirm...", color: "text-blue-600" };
      case 'confirmed':
        return { text: "Restaurant confirmed! Preparing soon...", color: "text-blue-600" };
      case 'preparing':
        return { text: "Chef is preparing your delicious meal! 👨‍🍳", color: "text-yellow-600" };
      case 'ready':
        return { text: "Finding a delivery partner for you...", color: "text-purple-600" };
      case 'picked_up':
        return { text: "Driver picked up your order! 🛵", color: "text-orange-600" };
      case 'on_the_way':
        return { text: "Your food is racing towards you! 🚀", color: "text-green-600" };
      case 'delivered':
        return { text: "Delivered! Enjoy your meal! 🎉", color: "text-green-700" };
      default:
        return { text: "Processing your order...", color: "text-gray-600" };
    }
  };

  const statusMessage = getStatusMessage();

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
            <Popup>{order?.restaurant_name || 'Restaurant'}</Popup>
          </Marker>
          
          {/* Delivery Location Marker */}
          <Marker position={deliveryPos} icon={homeIcon}>
            <Popup>Your Location</Popup>
          </Marker>
          
          {/* Driver Marker - Only when assigned and picked up */}
          {showDriver && driverPos && (
            <Marker position={driverPos} icon={driverIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{order?.driver_name || 'Delivery Partner'}</p>
                  <p className="text-sm text-gray-500">On the way!</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Waiting indicator at restaurant when preparing/ready */}
          {['preparing', 'ready'].includes(order?.order_status) && (
            <Marker position={restaurantPos} icon={waitingIcon}>
              <Popup>Order being prepared...</Popup>
            </Marker>
          )}
          
          {/* Route Line */}
          <Polyline 
            positions={[restaurantPos, deliveryPos]} 
            color={showDriver ? "#3BA55D" : "#F25C23"}
            weight={4}
            dashArray={showDriver ? undefined : "10, 10"}
            opacity={0.7}
          />
          
          {/* Driver trail when on the way */}
          {showDriver && driverPos && (
            <Polyline 
              positions={[restaurantPos, driverPos]} 
              color="#3BA55D" 
              weight={5}
            />
          )}
        </MapContainer>
      </div>

      {/* Status Overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                showDriver ? "bg-[#F25C23] animate-pulse" : "bg-gray-100"
              )}>
                {showDriver ? "🛵" : ['preparing', 'ready'].includes(order?.order_status) ? "👨‍🍳" : "📍"}
              </div>
              <div>
                <p className={cn("font-semibold text-sm", statusMessage.color)}>
                  {statusMessage.text}
                </p>
                {order?.driver_name && showDriver && (
                  <p className="text-xs text-gray-500">{order.driver_name}</p>
                )}
              </div>
            </div>
            {eta !== null && eta > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-[#F25C23]">{eta}</p>
                <p className="text-xs text-gray-500">mins</p>
              </div>
            )}
          </div>
          
          {/* Progress steps */}
          <div className="flex items-center gap-1">
            {['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered'].map((step, idx) => {
              const currentIdx = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered'].indexOf(order?.order_status);
              const isComplete = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              
              return (
                <div key={step} className="flex-1">
                  <div className={cn(
                    "h-1.5 rounded-full transition-all",
                    isComplete ? "bg-green-500" : "bg-gray-200",
                    isCurrent && "animate-pulse"
                  )} />
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Order Placed</span>
            <span>Delivered</span>
          </div>
        </div>
      </div>

      {/* Driver Contact - Only when driver assigned */}
      {showDriver && order?.driver_name && (
        <div className="absolute top-4 right-4">
          <div className="bg-white rounded-xl shadow-lg p-3 flex gap-2">
            <Button size="icon" variant="outline" className="rounded-full h-10 w-10">
              <Phone className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" className="rounded-full h-10 w-10">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}