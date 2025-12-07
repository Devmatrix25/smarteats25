import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Package, MapPin, DollarSign, Layers, CheckCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Calculate distance between two coordinates (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Optimize delivery route using nearest neighbor algorithm
function optimizeRoute(orders, startLat = 12.9716, startLng = 77.5946) {
  if (orders.length <= 1) return orders;
  
  const optimized = [];
  const remaining = [...orders];
  let currentLat = startLat;
  let currentLng = startLng;
  
  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const order = remaining[i];
      const dist = getDistance(
        currentLat, currentLng,
        order.delivery_latitude || 12.9716,
        order.delivery_longitude || 77.5946
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    
    const nearest = remaining.splice(nearestIdx, 1)[0];
    optimized.push(nearest);
    currentLat = nearest.delivery_latitude || 12.9716;
    currentLng = nearest.delivery_longitude || 77.5946;
  }
  
  return optimized;
}

// Calculate estimated delivery time for an order in a batch
function calculateEstimatedTime(order, position, totalOrders) {
  const baseTime = 10; // Base pickup time in minutes
  const perOrderTime = 5; // Time per delivery in minutes
  const travelTime = 8; // Average travel time between stops
  return baseTime + (position * (perOrderTime + travelTime));
}

// Check if order can be batched based on time constraints
function canBatchWithTimeConstraint(order, batchOrders, maxDeliveryTime = 45) {
  const position = batchOrders.length;
  const estimatedTime = calculateEstimatedTime(order, position, batchOrders.length + 1);
  return estimatedTime <= maxDeliveryTime;
}

// Group orders by restaurant (same restaurant batching priority)
export function groupOrdersForBatching(orders, maxDistance = 2, maxBatchSize = 3) {
  const batches = [];
  const used = new Set();
  
  // First, group by same restaurant
  const restaurantGroups = {};
  orders.forEach(order => {
    const key = order.restaurant_id;
    if (!restaurantGroups[key]) {
      restaurantGroups[key] = [];
    }
    restaurantGroups[key].push(order);
  });

  // Process each restaurant group
  Object.values(restaurantGroups).forEach(restaurantOrders => {
    // Sort by creation time (oldest first for time constraints)
    const sorted = restaurantOrders.sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    );
    
    let currentBatch = [];
    
    for (const order of sorted) {
      if (used.has(order.id)) continue;
      
      if (currentBatch.length === 0) {
        currentBatch.push(order);
        used.add(order.id);
        continue;
      }
      
      // Check if can add to current batch
      const deliveryDist = getDistance(
        currentBatch[0].delivery_latitude || 12.9716,
        currentBatch[0].delivery_longitude || 77.5946,
        order.delivery_latitude || 12.9716,
        order.delivery_longitude || 77.5946
      );
      
      const canAdd = deliveryDist <= maxDistance && 
                     currentBatch.length < maxBatchSize &&
                     canBatchWithTimeConstraint(order, currentBatch);
      
      if (canAdd) {
        currentBatch.push(order);
        used.add(order.id);
      } else {
        // Save current batch and start new one
        if (currentBatch.length > 0) {
          batches.push(optimizeRoute(currentBatch));
        }
        currentBatch = [order];
        used.add(order.id);
      }
    }
    
    // Don't forget the last batch
    if (currentBatch.length > 0) {
      batches.push(optimizeRoute(currentBatch));
    }
  });

  return batches;
}

// Export helper for getting batch info
export function getBatchInfo(batch) {
  if (!batch || batch.length === 0) return null;
  
  const totalEarnings = batch.length * 50 + (batch.length > 1 ? (batch.length - 1) * 20 : 0);
  const totalItems = batch.reduce((acc, o) => acc + (o.items?.length || 0), 0);
  const restaurants = [...new Set(batch.map(o => o.restaurant_name))];
  const isSameRestaurant = restaurants.length === 1;
  const estimatedTime = calculateEstimatedTime(batch[batch.length - 1], batch.length - 1, batch.length);
  
  return {
    orderCount: batch.length,
    totalEarnings,
    totalItems,
    restaurants,
    isSameRestaurant,
    estimatedTime,
    bonus: batch.length > 1 ? (batch.length - 1) * 20 : 0
  };
}

export default function OrderBatching({ orders, driver, onAcceptBatch, onAcceptSingle }) {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [viewMode, setViewMode] = useState("smart"); // "smart" or "all"

  const batches = groupOrdersForBatching(orders, 2, driver.max_batch_orders || 3);
  const hasBatchableOrders = batches.some(b => b.length > 1);
  const sameRestaurantBatches = batches.filter(b => {
    const restaurants = [...new Set(b.map(o => o.restaurant_id))];
    return restaurants.length === 1 && b.length > 1;
  });

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : prev.length < (driver.max_batch_orders || 3) 
          ? [...prev, orderId]
          : prev
    );
  };

  const calculateBatchEarnings = (orderIds) => {
    const baseEarning = orderIds.length * 50;
    const batchBonus = orderIds.length > 1 ? (orderIds.length - 1) * 20 : 0; // ₹20 bonus per extra order
    return baseEarning + batchBonus;
  };

  const acceptSelectedOrders = async () => {
    if (selectedOrders.length === 0) return;
    
    setIsAccepting(true);
    try {
      // Update all selected orders
      for (const orderId of selectedOrders) {
        await base44.entities.Order.update(orderId, {
          driver_email: driver.email,
          driver_name: driver.name,
          driver_id: driver.id,
          order_status: 'picked_up',
          is_batched: selectedOrders.length > 1,
          batch_id: selectedOrders.length > 1 ? `batch_${Date.now()}` : null
        });
      }

      // Update driver
      await base44.entities.Driver.update(driver.id, { 
        is_busy: true,
        current_batch_count: selectedOrders.length
      });

      const earnings = calculateBatchEarnings(selectedOrders);
      toast.success(`🎉 ${selectedOrders.length} orders accepted!`, {
        description: `Potential earnings: ₹${earnings} (includes batch bonus!)`
      });

      onAcceptBatch?.(selectedOrders);
      setSelectedOrders([]);
    } catch (e) {
      toast.error("Failed to accept orders");
    } finally {
      setIsAccepting(false);
    }
  };

  if (orders.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <span>Smart Order Batching</span>
          </div>
          {selectedOrders.length > 0 && (
            <Badge className="bg-purple-100 text-purple-700">
              {selectedOrders.length} selected • ₹{calculateBatchEarnings(selectedOrders)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={viewMode === "smart" ? "default" : "outline"}
            size="sm"
            className={cn("rounded-xl", viewMode === "smart" && "bg-purple-600")}
            onClick={() => setViewMode("smart")}
          >
            <Layers className="w-4 h-4 mr-1" />
            Smart Batches
          </Button>
          <Button
            variant={viewMode === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            onClick={() => setViewMode("all")}
          >
            All Orders
          </Button>
        </div>

        {/* Same Restaurant Batch Highlight */}
        {sameRestaurantBatches.length > 0 && viewMode === "smart" && (
          <div className="p-3 bg-green-50 rounded-xl mb-4 flex items-start gap-3 border border-green-200">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">🏪 Same Restaurant Batches!</p>
              <p className="text-sm text-green-700">
                {sameRestaurantBatches.length} batch{sameRestaurantBatches.length > 1 ? 'es' : ''} from same restaurant - single pickup, optimized route!
              </p>
            </div>
          </div>
        )}

        {hasBatchableOrders && viewMode === "smart" && (
          <div className="p-3 bg-purple-50 rounded-xl mb-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-purple-900">Batch Bonus Available!</p>
              <p className="text-sm text-purple-700">
                Pick up multiple orders going the same direction for extra ₹20/order bonus
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {viewMode === "smart" ? (
            // Smart batch view - grouped by batches
            batches.map((batch, batchIdx) => {
              const batchInfo = getBatchInfo(batch);
              const isSameRestaurant = batchInfo?.isSameRestaurant;
              const allSelected = batch.every(o => selectedOrders.includes(o.id));
              
              return (
                <div key={batchIdx} className={cn(
                  "rounded-xl border-2 overflow-hidden",
                  batch.length > 1 
                    ? isSameRestaurant 
                      ? "border-green-300 bg-green-50/50" 
                      : "border-purple-300 bg-purple-50/50"
                    : "border-gray-200"
                )}>
                  {batch.length > 1 && (
                    <div className={cn(
                      "px-4 py-2 flex items-center justify-between",
                      isSameRestaurant ? "bg-green-100" : "bg-purple-100"
                    )}>
                      <div className="flex items-center gap-2">
                        <Package className={cn("w-4 h-4", isSameRestaurant ? "text-green-700" : "text-purple-700")} />
                        <span className={cn("font-medium text-sm", isSameRestaurant ? "text-green-800" : "text-purple-800")}>
                          {isSameRestaurant ? "Same Restaurant Batch" : "Route Optimized Batch"}
                        </span>
                        <Badge className={cn("text-xs", isSameRestaurant ? "bg-green-200 text-green-800" : "bg-purple-200 text-purple-800")}>
                          {batch.length} orders • +₹{batchInfo.bonus} bonus
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn("text-xs", isSameRestaurant ? "text-green-700" : "text-purple-700")}
                        onClick={() => {
                          const ids = batch.map(o => o.id);
                          if (allSelected) {
                            setSelectedOrders(prev => prev.filter(id => !ids.includes(id)));
                          } else {
                            setSelectedOrders(prev => [...new Set([...prev, ...ids])].slice(0, driver.max_batch_orders || 3));
                          }
                        }}
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    {batch.map((order, orderIdx) => {
                      const isSelected = selectedOrders.includes(order.id);
                      return (
                        <div 
                          key={order.id}
                          className={cn(
                            "p-3 rounded-lg border transition-all cursor-pointer",
                            isSelected 
                              ? "border-purple-500 bg-white shadow-sm" 
                              : "border-gray-200 bg-white hover:border-purple-300"
                          )}
                          onClick={() => toggleOrderSelection(order.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleOrderSelection(order.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <div className="flex items-center gap-2">
                                    {batch.length > 1 && (
                                      <span className="w-5 h-5 rounded-full bg-gray-200 text-xs flex items-center justify-center font-medium">
                                        {orderIdx + 1}
                                      </span>
                                    )}
                                    <p className="font-semibold">{order.restaurant_name}</p>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {order.items?.length} items • ₹{order.total_amount}
                                  </p>
                                </div>
                                <Badge className="bg-green-100 text-green-700">₹50</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{order.delivery_address}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            // All orders view - flat list
            orders.map((order) => {
              const isSelected = selectedOrders.includes(order.id);
              const batch = batches.find(b => b.some(o => o.id === order.id));
              const hasBatchmates = batch && batch.length > 1;

              return (
                <div 
                  key={order.id}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all cursor-pointer",
                    isSelected 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-gray-200 hover:border-purple-300"
                  )}
                  onClick={() => toggleOrderSelection(order.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{order.restaurant_name}</p>
                          <p className="text-sm text-gray-500">
                            {order.items?.length} items • ₹{order.total_amount}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className="bg-green-100 text-green-700">₹50</Badge>
                          {hasBatchmates && (
                            <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">
                              +₹20 batch bonus
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedOrders.length > 0 && (
          <div className="mt-4 flex gap-3">
            <Button 
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setSelectedOrders([])}
            >
              Clear Selection
            </Button>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-xl"
              onClick={acceptSelectedOrders}
              disabled={isAccepting}
            >
              {isAccepting ? "Accepting..." : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Accept {selectedOrders.length} Order{selectedOrders.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}