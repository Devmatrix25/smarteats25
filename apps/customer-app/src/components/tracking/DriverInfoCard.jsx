import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Phone, MessageCircle, Star, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DriverStatusBadge from "./DriverStatusBadge";

export default function DriverInfoCard({ order }) {
  // Fetch full driver details
  const { data: driver } = useQuery({
    queryKey: ['driver-details', order?.driver_id],
    queryFn: async () => {
      if (!order?.driver_id) return null;
      const drivers = await base44.entities.Driver.filter({ id: order.driver_id });
      return drivers[0];
    },
    enabled: !!order?.driver_id
  });

  if (!order?.driver_name) return null;

  const vehicleIcons = {
    bicycle: '🚴',
    scooter: '🛵',
    motorcycle: '🏍️',
    car: '🚗'
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <div className="flex items-center gap-4">
        {/* Driver Photo */}
        <div className="relative">
          {driver?.profile_image ? (
            <img 
              src={driver.profile_image} 
              alt={order.driver_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#F25C23]"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-[#F25C23] to-[#FFC043] rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-white shadow-lg">
              {order.driver_name.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-sm">
            {vehicleIcons[driver?.vehicle_type] || '🛵'}
          </div>
        </div>

        {/* Driver Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg">{order.driver_name}</h3>
            <Badge className="bg-green-100 text-green-700 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
            <DriverStatusBadge 
              status={driver?.availability_status} 
              isBusy={true}
              size="sm"
            />
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{driver?.average_rating?.toFixed(1) || '5.0'}</span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">
              {driver?.total_deliveries || 0} deliveries
            </span>
          </div>

          {driver?.vehicle_number && (
            <p className="text-sm text-gray-500 mt-1">
              {driver.vehicle_type?.charAt(0).toUpperCase() + driver.vehicle_type?.slice(1)} • {driver.vehicle_number}
            </p>
          )}
        </div>

        {/* Contact Buttons */}
        <div className="flex flex-col gap-2">
          <Button 
            size="icon" 
            className="rounded-full bg-green-500 hover:bg-green-600 h-10 w-10"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="rounded-full h-10 w-10"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Delivery Status */}
      <div className="mt-4 p-3 bg-orange-50 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 bg-[#F25C23] rounded-full flex items-center justify-center animate-pulse">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-medium text-[#1D1D1F]">
            {order.order_status === 'picked_up' ? 'Picking up your order' : 'On the way to you'}
          </p>
          <p className="text-sm text-gray-500">
            {order.order_status === 'picked_up' 
              ? 'Driver is at the restaurant' 
              : 'Your food will arrive soon!'}
          </p>
        </div>
      </div>
    </div>
  );
}