import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Clock, MapPin, ChevronRight, Package, Truck,
  CheckCircle, XCircle, RefreshCw, Star, Filter, Eye, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, isWithinInterval } from "date-fns";
import OrderFilters from "@/components/orders/OrderFilters";
import OrderDetailModal from "@/components/orders/OrderDetailModal";
import { toast } from "sonner";

const statusConfig = {
  placed: { label: "Order Placed", color: "bg-blue-100 text-blue-700", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  preparing: { label: "Preparing", color: "bg-yellow-100 text-yellow-700", icon: Package },
  ready: { label: "Ready", color: "bg-purple-100 text-purple-700", icon: Package },
  picked_up: { label: "Picked Up", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  on_the_way: { label: "On The Way", color: "bg-orange-100 text-orange-700", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

const defaultFilters = {
  status: 'all',
  restaurant: 'all',
  dateRange: { from: null, to: null },
  sortBy: 'date_desc'
};

export default function Orders() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }, '-created_date'),
    enabled: !!user?.email
  });

  // Get unique restaurants for filter dropdown
  const restaurants = useMemo(() => {
    const names = [...new Set(orders.map(o => o.restaurant_name).filter(Boolean))];
    return names.sort();
  }, [orders]);

  // Apply filters and sorting
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        result = result.filter(o => !['delivered', 'cancelled'].includes(o.order_status));
      } else {
        result = result.filter(o => o.order_status === filters.status);
      }
    }

    // Restaurant filter
    if (filters.restaurant !== 'all') {
      result = result.filter(o => o.restaurant_name === filters.restaurant);
    }

    // Date range filter
    if (filters.dateRange.from) {
      result = result.filter(o => {
        const orderDate = new Date(o.created_date);
        if (filters.dateRange.to) {
          return isWithinInterval(orderDate, {
            start: filters.dateRange.from,
            end: filters.dateRange.to
          });
        }
        return orderDate >= filters.dateRange.from;
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date_asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'amount_desc':
          return b.total_amount - a.total_amount;
        case 'amount_asc':
          return a.total_amount - b.total_amount;
        case 'date_desc':
        default:
          return new Date(b.created_date) - new Date(a.created_date);
      }
    });

    return result;
  }, [orders, filters]);

  const activeOrders = filteredOrders.filter(o => !['delivered', 'cancelled'].includes(o.order_status));
  const pastOrders = filteredOrders.filter(o => ['delivered', 'cancelled'].includes(o.order_status));

  const handleReorder = async (order) => {
    try {
      const carts = await base44.entities.Cart.filter({ customer_email: user.email });
      // Filter out items with invalid quantities
      const cartItems = (order.items || [])
        .filter(item => item.quantity > 0)
        .map(item => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          price: Math.abs(item.price || 0),
          quantity: Math.max(1, item.quantity),
          image_url: item.image_url
        }));

      if (cartItems.length === 0) {
        toast.error("No valid items to reorder");
        return;
      }

      if (carts.length > 0) {
        if (carts[0].restaurant_id && carts[0].restaurant_id !== order.restaurant_id) {
          const confirm = window.confirm(
            `Your cart has items from ${carts[0].restaurant_name}. Replace with items from ${order.restaurant_name}?`
          );
          if (!confirm) return;
        }
        await base44.entities.Cart.update(carts[0].id, {
          restaurant_id: order.restaurant_id,
          restaurant_name: order.restaurant_name,
          items: cartItems,
          subtotal: order.subtotal
        });
      } else {
        await base44.entities.Cart.create({
          customer_email: user.email,
          restaurant_id: order.restaurant_id,
          restaurant_name: order.restaurant_name,
          items: cartItems,
          subtotal: order.subtotal
        });
      }

      toast.success("Items added to cart!", {
        description: `${cartItems.length} items from ${order.restaurant_name}`,
        action: {
          label: "View Cart",
          onClick: () => navigate(createPageUrl("Cart"))
        }
      });
      queryClient.invalidateQueries(['cart']);
    } catch (e) {
      toast.error("Failed to add items to cart");
    }
  };

  const OrderCard = ({ order }) => {
    const status = statusConfig[order.order_status] || statusConfig.placed;
    const StatusIcon = status.icon;

    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{order.restaurant_name}</h3>
            <p className="text-sm text-gray-500">
              Order #{order.order_number} • {format(new Date(order.created_date), "MMM d, h:mm a")}
            </p>
          </div>
          <Badge className={cn("flex items-center gap-1", status.color)}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>

        {/* Items */}
        <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {order.items?.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex-shrink-0">
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
          {order.items?.length > 3 && (
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-gray-500">+{order.items.length - 3}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{order.items?.reduce((acc, i) => acc + i.quantity, 0)} items</span>
          <span className="font-semibold text-[#1D1D1F]">₹{order.total_amount}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'].includes(order.order_status) && (
            <Link to={`${createPageUrl("OrderTracking")}?id=${order.id}`} className="flex-1 min-w-[120px]">
              <Button className="w-full bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
                <Truck className="w-4 h-4 mr-2" />
                Track
              </Button>
            </Link>
          )}
          {order.order_status === 'delivered' && !order.is_reviewed && (
            <Link to={`${createPageUrl("OrderTracking")}?id=${order.id}`} className="flex-1 min-w-[120px]">
              <Button variant="outline" className="w-full rounded-xl border-[#F25C23] text-[#F25C23]">
                <Star className="w-4 h-4 mr-2" />
                Rate
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setSelectedOrder(order)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Details
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => handleReorder(order)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Reorder
          </Button>
        </div>
      </div>
    );
  };

  if (isAuthLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className={cn("rounded-xl", showFilters && "bg-[#F25C23]")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <OrderFilters
          filters={filters}
          onFilterChange={setFilters}
          restaurants={restaurants}
          onClearFilters={() => setFilters(defaultFilters)}
        />
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onReorder={() => queryClient.invalidateQueries(['cart'])}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-xl p-1">
          <TabsTrigger
            value="active"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Active ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Past ({pastOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            [1, 2].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))
          ) : activeOrders.length > 0 ? (
            activeOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No active orders</h3>
              <p className="text-gray-500 mb-6">Your active orders will appear here</p>
              <Link to={createPageUrl("Home")}>
                <Button className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
                  Order Now
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))
          ) : pastOrders.length > 0 ? (
            pastOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No past orders</h3>
              <p className="text-gray-500">Your order history will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}