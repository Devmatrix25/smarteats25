import React from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  MapPin, Clock, Package, Truck, Star, Receipt, 
  ChevronRight, ShoppingCart, CheckCircle, XCircle, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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

export default function OrderDetailModal({ order, open, onClose, onReorder }) {
  if (!order) return null;

  const status = statusConfig[order.order_status] || statusConfig.placed;
  const StatusIcon = status.icon;

  const handleReorder = async () => {
    try {
      // Get or create cart
      const user = await base44.auth.me();
      const carts = await base44.entities.Cart.filter({ customer_email: user.email });
      
      // Map order items to cart items
      const cartItems = order.items?.map(item => ({
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url
      })) || [];

      if (carts.length > 0) {
        // Check if same restaurant
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
          onClick: () => window.location.href = createPageUrl("Cart")
        }
      });
      
      onReorder?.();
      onClose();
    } catch (e) {
      toast.error("Failed to add items to cart");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order #{order.order_number}</span>
            <Badge className={cn("flex items-center gap-1", status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Restaurant Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden">
              <img 
                src={order.restaurant_image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&q=80"}
                alt={order.restaurant_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{order.restaurant_name}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(order.created_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Items ({order.items?.length || 0})
            </h4>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Delivery Address */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </h4>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-xl">
              {order.delivery_address}
            </p>
            {order.delivery_instructions && (
              <p className="text-sm text-gray-500 mt-2 italic">
                Note: {order.delivery_instructions}
              </p>
            )}
          </div>

          {/* Driver Info (if delivered) */}
          {order.driver_name && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Delivered By
                </h4>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                  <div className="w-10 h-10 bg-[#F25C23] rounded-full flex items-center justify-center text-white font-bold">
                    {order.driver_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{order.driver_name}</p>
                    {order.actual_delivery_time && (
                      <p className="text-sm text-gray-500">
                        Delivered at {format(new Date(order.actual_delivery_time), "h:mm a")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Payment Summary */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Payment Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Fee</span>
                <span>₹{order.delivery_fee}</span>
              </div>
              {order.taxes > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxes</span>
                  <span>₹{order.taxes}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>₹{order.total_amount}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Payment Method</span>
                <span className="capitalize">{order.payment_method || 'COD'}</span>
              </div>
            </div>
          </div>

          {/* Review Section */}
          {order.is_reviewed && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Your Review
                </h4>
                <div className="bg-yellow-50 p-3 rounded-xl">
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(i => (
                      <Star 
                        key={i} 
                        className={cn(
                          "w-4 h-4",
                          i <= (order.overall_rating || 0) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        )} 
                      />
                    ))}
                  </div>
                  {order.review_text && (
                    <p className="text-sm text-gray-600">{order.review_text}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1 bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
              onClick={handleReorder}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Reorder
            </Button>
            {order.order_status === 'delivered' && !order.is_reviewed && (
              <Link to={`${createPageUrl("OrderTracking")}?id=${order.id}`} className="flex-1">
                <Button variant="outline" className="w-full rounded-xl border-[#F25C23] text-[#F25C23]">
                  <Star className="w-4 h-4 mr-2" />
                  Rate Order
                </Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}