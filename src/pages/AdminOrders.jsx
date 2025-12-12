import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ShoppingCart, Search, Filter, Clock, CheckCircle,
  Package, Truck, XCircle, MapPin, User, Store, Eye, EyeOff, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig = {
  placed: { label: "Placed", color: "bg-blue-100 text-blue-700", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  preparing: { label: "Preparing", color: "bg-yellow-100 text-yellow-700", icon: Package },
  ready: { label: "Ready", color: "bg-purple-100 text-purple-700", icon: Package },
  picked_up: { label: "Picked Up", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  on_the_way: { label: "On The Way", color: "bg-orange-100 text-orange-700", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AdminOrders() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showPrivateData, setShowPrivateData] = useState(false);
  const navigate = useNavigate();

  // Privacy masking functions
  const maskEmail = (email) => {
    if (!email || showPrivateData) return email;
    const [local, domain] = email.split('@');
    return `${local.charAt(0)}***@${domain}`;
  };

  const maskName = (name) => {
    if (!name || showPrivateData) return name;
    return `${name.charAt(0)}***`;
  };

  const maskAddress = (address) => {
    if (!address || showPrivateData) return address;
    const parts = address.split(',');
    if (parts.length > 1) {
      return `*****, ${parts[parts.length - 1].trim()}`;
    }
    return '*****';
  };

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
      if (userData.role !== 'admin') {
        navigate(createPageUrl("Home"));
        return;
      }
      setUser(userData);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
    enabled: !!user,
    staleTime: Infinity,
  });

  const filteredOrders = orders.filter(order => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!order.order_number?.toLowerCase().includes(query) &&
        !order.customer_name?.toLowerCase().includes(query) &&
        !order.restaurant_name?.toLowerCase().includes(query)) {
        return false;
      }
    }
    // Status filter
    if (statusFilter !== "all" && order.order_status !== statusFilter) {
      return false;
    }
    return true;
  });

  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_date).toDateString() === today;
  });

  const todayRevenue = todayOrders
    .filter(o => o.order_status !== 'cancelled')
    .reduce((acc, o) => acc + (o.total_amount || 0), 0);

  if (isAuthLoading || !user) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">All Orders</h1>
            <p className="text-gray-500">
              {todayOrders.length} orders today • ₹{todayRevenue} revenue
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showPrivateData ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPrivateData(!showPrivateData)}
              className="rounded-xl"
            >
              {showPrivateData ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              {showPrivateData ? "Full Data" : "Privacy Mode"}
            </Button>
            <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by order #, customer, restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-500">Order</th>
                    <th className="text-left p-4 font-medium text-gray-500">Customer</th>
                    <th className="text-left p-4 font-medium text-gray-500">Restaurant</th>
                    <th className="text-left p-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left p-4 font-medium text-gray-500">Status</th>
                    <th className="text-left p-4 font-medium text-gray-500">Time</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const status = statusConfig[order.order_status] || statusConfig.placed;
                    const StatusIcon = status.icon;

                    return (
                      <tr key={order.id} className="border-t hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-medium">#{order.order_number}</p>
                          <p className="text-xs text-gray-500">{order.items?.length} items</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{maskName(order.customer_name)}</p>
                          <p className="text-xs text-gray-500">{maskEmail(order.customer_email)}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{order.restaurant_name}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold">₹{order.total_amount}</p>
                          <p className="text-xs text-gray-500 capitalize">{order.payment_method}</p>
                        </td>
                        <td className="p-4">
                          <Badge className={cn("flex items-center gap-1 w-fit", status.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{format(new Date(order.created_date), "h:mm a")}</p>
                          <p className="text-xs text-gray-500">{format(new Date(order.created_date), "MMM d")}</p>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No orders found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.order_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status */}
                <Badge className={cn(
                  "text-lg py-2 px-4",
                  statusConfig[selectedOrder.order_status]?.color
                )}>
                  {statusConfig[selectedOrder.order_status]?.label}
                </Badge>

                {/* Customer */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Customer {!showPrivateData && "(Privacy Protected)"}</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{maskName(selectedOrder.customer_name)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{maskEmail(selectedOrder.customer_email)}</p>
                </div>

                {/* Restaurant */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Restaurant</p>
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{selectedOrder.restaurant_name}</span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Delivery Area</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{maskAddress(selectedOrder.delivery_address)}</span>
                  </div>
                </div>

                {/* Driver */}
                {selectedOrder.driver_name && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">Delivery Partner</p>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{selectedOrder.driver_name}</span>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span>₹{selectedOrder.delivery_fee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Taxes</span>
                    <span>₹{selectedOrder.taxes}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{selectedOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>₹{selectedOrder.total_amount}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Payment</span>
                  <div className="text-right">
                    <Badge variant="outline" className="capitalize">{selectedOrder.payment_method}</Badge>
                    <Badge className={cn(
                      "ml-2",
                      selectedOrder.payment_status === 'paid' && "bg-green-100 text-green-700",
                      selectedOrder.payment_status === 'pending' && "bg-yellow-100 text-yellow-700"
                    )}>
                      {selectedOrder.payment_status}
                    </Badge>
                  </div>
                </div>

                {/* Timestamps */}
                <p className="text-xs text-gray-400">
                  Order placed on {format(new Date(selectedOrder.created_date), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}