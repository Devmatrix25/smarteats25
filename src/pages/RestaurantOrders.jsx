import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RestaurantOrderListener from "@/components/realtime/RestaurantOrderListener";
import {
  Clock, CheckCircle, Package, Truck, X, Phone,
  MapPin, User, ChevronDown, RefreshCw, AlertCircle, Navigation, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig = {
  scheduled: { label: "Scheduled", color: "bg-purple-500", actions: ["confirm", "reject"] },
  placed: { label: "New", color: "bg-blue-500", actions: ["confirm", "reject"] },
  confirmed: { label: "Confirmed", color: "bg-blue-500", actions: ["prepare"] },
  preparing: { label: "Preparing", color: "bg-yellow-500", actions: ["ready"] },
  ready: { label: "Ready", color: "bg-purple-500", actions: [] },
  picked_up: { label: "Picked Up", color: "bg-indigo-500", actions: [] },
  on_the_way: { label: "On The Way", color: "bg-orange-500", actions: [] },
  delivered: { label: "Delivered", color: "bg-green-500", actions: [] },
  cancelled: { label: "Cancelled", color: "bg-red-500", actions: [] },
};

export default function RestaurantOrders() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState("new");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl("Index"));
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
      loadRestaurant(userData.email);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loadRestaurant = async (email) => {
    try {
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
      } else if (email === 'restaurant@demo.com') {
        // Demo user: get first approved restaurant
        const allRestos = await base44.entities.Restaurant.filter({ status: 'approved' });
        if (allRestos.length > 0) setRestaurant(allRestos[0]);
      }
    } catch (e) {
      console.log('No restaurant');
    }
  };

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['restaurant-orders', restaurant?.id],
    queryFn: () => user?.email === 'restaurant@demo.com'
      ? base44.entities.Order.filter({}, '-created_date')
      : base44.entities.Order.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
    staleTime: 30000 // Cache for 30 seconds, use manual refresh button
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, order }) => {
      await base44.entities.Order.update(id, { order_status: status });

      // Send notification to customer
      const statusMessages = {
        confirmed: { title: "Order Confirmed! ✅", message: `${restaurant.name} has confirmed your order and will start preparing soon.` },
        preparing: { title: "Preparing Your Food 👨‍🍳", message: `${restaurant.name} is now preparing your delicious order!` },
        ready: { title: "Order Ready for Pickup 📦", message: `Your order from ${restaurant.name} is ready and waiting for a delivery partner.` },
        cancelled: { title: "Order Cancelled ❌", message: `Unfortunately, your order from ${restaurant.name} has been cancelled.` }
      };

      if (statusMessages[status] && order?.customer_email) {
        await base44.entities.Notification.create({
          user_email: order.customer_email,
          title: statusMessages[status].title,
          message: statusMessages[status].message,
          type: "order",
          data: { order_id: id, status }
        });
      }

      // When order is ready, notify all online drivers
      if (status === 'ready') {
        try {
          const onlineDrivers = await base44.entities.Driver.filter({ is_online: true, status: 'approved' });
          for (const driver of onlineDrivers) {
            await base44.entities.Notification.create({
              user_email: driver.email,
              title: "🔔 New Delivery Available!",
              message: `Order #${order?.order_number || id.slice(-6)} from ${restaurant.name} is ready for pickup! ₹${order?.total_amount || 0}`,
              type: "delivery",
              data: { order_id: id, restaurant_name: restaurant.name, total: order?.total_amount }
            });
          }
        } catch (e) {
          console.log('Driver notification error:', e.message);
        }
      }

      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['restaurant-orders']);
      toast.success(`Order ${data.status === 'cancelled' ? 'rejected' : 'updated'}! Customer notified.`);
      setSelectedOrder(null);
    },
    onError: () => toast.error("Failed to update order")
  });

  const handleUpdateStatus = (orderId, newStatus, order = null) => {
    updateOrderMutation.mutate({ id: orderId, status: newStatus, order: order || selectedOrder });
  };

  const scheduledOrders = orders.filter(o => o.order_status === 'scheduled');
  const newOrders = orders.filter(o => o.order_status === 'placed');
  const activeOrders = orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.order_status));
  const completedOrders = orders.filter(o => ['delivered', 'picked_up', 'on_the_way'].includes(o.order_status));
  const cancelledOrders = orders.filter(o => o.order_status === 'cancelled');

  const OrderCard = ({ order }) => {
    const config = statusConfig[order.order_status] || statusConfig.placed;

    return (
      <div
        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
        onClick={() => setSelectedOrder(order)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">#{order.order_number}</p>
              {order.order_status === 'placed' && (
                <Badge className="bg-red-500 text-white animate-pulse">NEW</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {order.is_scheduled ? (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(order.scheduled_date), "MMM d")} • {order.scheduled_time}
                </span>
              ) : (
                format(new Date(order.created_date), "h:mm a • MMM d")
              )}
            </p>
          </div>
          <Badge className={cn("text-white", config.color)}>
            {config.label}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          {order.items?.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.name}</span>
              <span className="text-gray-500">₹{item.price * item.quantity}</span>
            </div>
          ))}
          {order.items?.length > 3 && (
            <p className="text-sm text-gray-400">+{order.items.length - 3} more items</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User className="w-4 h-4" />
            <span>{order.customer_name}</span>
          </div>
          <p className="font-bold text-lg">₹{order.total_amount}</p>
        </div>

        {/* Quick Actions */}
        {config.actions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {config.actions.includes("confirm") && (
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(order.id, 'confirmed', order);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </Button>
            )}
            {config.actions.includes("reject") && (
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(order.id, 'cancelled', order);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            )}
            {config.actions.includes("prepare") && (
              <Button
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(order.id, 'preparing', order);
                }}
              >
                <Package className="w-4 h-4 mr-2" />
                Start Preparing
              </Button>
            )}
            {config.actions.includes("ready") && (
              <Button
                className="flex-1 bg-purple-500 hover:bg-purple-600 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(order.id, 'ready', order);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Ready
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleNewOrder = (order) => {
    queryClient.invalidateQueries(['restaurant-orders']);
    refetch();
    // Also show prominent new order alert
    if (order && order.order_status === 'placed') {
      toast.success("🔔 NEW ORDER!", {
        description: `${order.customer_name} - ${order.items?.length} items - ₹${order.total_amount}`,
        duration: 15000,
        action: {
          label: "Accept",
          onClick: () => handleUpdateStatus(order.id, 'confirmed', order)
        }
      });
    }
  };

  const handleOrderUpdate = (order) => {
    queryClient.invalidateQueries(['restaurant-orders']);
    refetch();
  };

  if (isAuthLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Real-time order listener */}
      <RestaurantOrderListener
        restaurantId={restaurant?.id}
        onNewOrder={handleNewOrder}
        onOrderUpdate={handleOrderUpdate}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Orders</h1>
          <Button variant="outline" size="icon" onClick={() => refetch()} className="rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="new" className="rounded-lg data-[state=active]:bg-white relative">
              New
              {newOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {newOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="rounded-lg data-[state=active]:bg-white relative">
              Scheduled
              {scheduledOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                  {scheduledOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-white">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-white">
              Cancelled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : newOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {newOrders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No new orders</h3>
                <p className="text-gray-500">New orders will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled">
            {scheduledOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scheduledOrders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No scheduled orders</h3>
                <p className="text-gray-500">Scheduled orders will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No active orders</h3>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedOrders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No completed orders</h3>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelledOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cancelledOrders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <X className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No cancelled orders</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.order_number}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Customer Info */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{selectedOrder.customer_name}</span>
                    </div>
                    <a href={`tel:${selectedOrder.customer_phone || '+919876543210'}`}>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-lg">
                        <Phone className="w-4 h-4 mr-1" />
                        Call Customer
                      </Button>
                    </a>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                </div>

                {/* Driver Info (when assigned) */}
                {selectedOrder.driver_name && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{selectedOrder.driver_name}</span>
                        <Badge className="bg-blue-100 text-blue-700 text-xs">Driver</Badge>
                      </div>
                      <a href={`tel:+919876543211`}>
                        <Button size="sm" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Phone className="w-4 h-4 mr-1" />
                          Call Driver
                        </Button>
                      </a>
                    </div>
                    {['picked_up', 'on_the_way'].includes(selectedOrder.order_status) && selectedOrder.driver_location_lat && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                          <Navigation className="w-4 h-4" />
                          <span>Live Location Tracking</span>
                        </div>
                        <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full" />
                            <div className="absolute w-px h-16 bg-blue-400 top-1/4 left-1/4 origin-top-left rotate-45" style={{ transform: 'rotate(45deg) translateX(20px)' }} />
                          </div>
                          <div className="text-center z-10">
                            <Truck className="w-8 h-8 text-blue-600 mx-auto mb-1 animate-bounce" />
                            <p className="text-xs text-blue-600 font-medium">Driver en route</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.quantity}x {item.name}</span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                        {item.customization_details && item.customization_details.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.customization_details.join(' • ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-lg font-bold pt-4 border-t">
                  <span>Total</span>
                  <span>₹{selectedOrder.total_amount}</span>
                </div>

                {/* Actions */}
                {statusConfig[selectedOrder.order_status]?.actions.length > 0 && (
                  <div className="flex gap-2 pt-4">
                    {statusConfig[selectedOrder.order_status].actions.includes("confirm") && (
                      <>
                        <Button
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                        >
                          Accept Order
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600"
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {statusConfig[selectedOrder.order_status].actions.includes("prepare") && (
                      <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                      >
                        Start Preparing
                      </Button>
                    )}
                    {statusConfig[selectedOrder.order_status].actions.includes("ready") && (
                      <Button
                        className="w-full bg-purple-500 hover:bg-purple-600"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'ready')}
                      >
                        Mark as Ready
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}