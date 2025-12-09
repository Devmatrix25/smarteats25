import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Clock, MapPin, Phone, MessageCircle, ChevronLeft,
  CheckCircle, Package, Truck, Home, Star, User,
  Navigation, Calendar, Gift, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import DeliverySimulation from "@/components/delivery/DeliverySimulation";
import CustomerTrackingMap from "@/components/delivery/CustomerTrackingMap";
import ReviewForm from "@/components/reviews/ReviewForm";
import DriverInfoCard from "@/components/tracking/DriverInfoCard";
// Premium Components
import AnimatedOrderStepper from "@/components/orders/AnimatedOrderStepper";
import LiveTrackingMap from "@/components/tracking/LiveTrackingMap";
import PremiumDriverCard from "@/components/tracking/PremiumDriverCard";
import PremiumReviewForm from "@/components/reviews/PremiumReviewForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



const statusSteps = [
  { key: "placed", label: "Order Placed", icon: CheckCircle },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "ready", label: "Ready", icon: Package },
  { key: "picked_up", label: "Picked Up", icon: Truck },
  { key: "on_the_way", label: "On The Way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];



export default function OrderTracking() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const prevStatusRef = useRef(null);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => base44.entities.Order.filter({ id: orderId }),
    select: (data) => data[0],
    enabled: !!orderId && !isAuthLoading,
    staleTime: 30000 // Cache for 30 seconds, use manual refresh or status listener
  });

  // Real-time status change notifications
  useEffect(() => {
    if (order && prevStatusRef.current && prevStatusRef.current !== order.order_status) {
      const statusMessages = {
        confirmed: { title: "Order Confirmed! ✅", desc: "Restaurant is getting ready to prepare your food" },
        preparing: { title: "Cooking Started! 👨‍🍳", desc: "Your delicious meal is being prepared" },
        ready: { title: "Ready for Pickup! 📦", desc: "Finding a delivery partner for you..." },
        picked_up: { title: "Driver Assigned! 🛵", desc: "Your delivery partner is picking up your order" },
        on_the_way: { title: "On The Way! 🚀", desc: "Your food is racing towards you!" },
        delivered: { title: "Delivered! 🎊", desc: "Enjoy your meal! Delivered faster than expected!" }
      };

      const statusInfo = statusMessages[order.order_status];
      if (statusInfo) {
        toast.success(statusInfo.title, {
          description: statusInfo.desc,
          duration: 6000
        });
      }
    }
    prevStatusRef.current = order?.order_status;
  }, [order?.order_status]);

  const handleDeliveryComplete = () => {
    refetch();
    queryClient.invalidateQueries(['orders']);
  };

  const handleReviewSubmit = () => {
    setShowReviewDialog(false);
    refetch();
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-64 rounded-2xl mb-6" />
        <Skeleton className="h-32 rounded-2xl mb-4" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Link to={createPageUrl("Orders")}>
          <Button className="bg-[#F25C23] hover:bg-[#D94A18]">View All Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.order_status);
  const progress = ((currentStepIndex + 1) / statusSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl("Orders")}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">Order #{order.order_number}</h1>
            <p className="text-sm text-gray-500">
              {format(new Date(order.created_date), "MMM d, yyyy • h:mm a")}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Live Tracking Map - Always visible for active orders */}
        {!['delivered', 'cancelled'].includes(order.order_status) && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {['picked_up', 'on_the_way'].includes(order.order_status) ? (
              <DeliverySimulation
                order={order}
                onDeliveryComplete={handleDeliveryComplete}
                restaurantLocation={{ lat: 12.9716, lng: 77.5946 }}
                deliveryLocation={{
                  lat: order.delivery_latitude || 12.9816,
                  lng: order.delivery_longitude || 77.6046
                }}
              />
            ) : (
              <CustomerTrackingMap
                order={order}
                restaurantLocation={{ lat: 12.9716, lng: 77.5946 }}
                deliveryLocation={{
                  lat: order.delivery_latitude || 12.9816,
                  lng: order.delivery_longitude || 77.6046
                }}
              />
            )}
          </div>
        )}

        {/* Driver Info Card - when driver assigned */}
        {order.driver_name && ['picked_up', 'on_the_way'].includes(order.order_status) && (
          <DriverInfoCard order={order} />
        )}

        {/* Scheduled Order Notice */}
        {order.is_scheduled && order.order_status === 'scheduled' && (
          <div className="bg-purple-50 rounded-2xl p-6 shadow-sm border-2 border-purple-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Scheduled Delivery</h3>
                <p className="text-purple-700">
                  {format(new Date(order.scheduled_date), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-purple-600 font-medium">{order.scheduled_time}</p>
              </div>
            </div>
            <p className="text-sm text-purple-600 mt-3">
              We'll start preparing your order closer to the scheduled time.
            </p>
          </div>
        )}

        {/* Order Status - Premium Animated Stepper */}
        <AnimatedOrderStepper
          currentStatus={order.order_status}
          className="shadow-lg"
        />

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Order Details</h3>

          {/* Restaurant */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              🍽️
            </div>
            <div>
              <p className="font-medium">{order.restaurant_name}</p>
              <p className="text-sm text-gray-500">Restaurant</p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded text-sm flex items-center justify-center font-medium">
                    {item.quantity}x
                  </span>
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Bill */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span>₹{order.delivery_fee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxes</span>
              <span>₹{order.taxes}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{order.total_amount}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#F25C23] mt-0.5" />
              <div>
                <p className="font-medium">Delivery Address</p>
                <p className="text-sm text-gray-600">{order.delivery_address}</p>
                {order.delivery_instructions && (
                  <p className="text-sm text-gray-500 mt-1">
                    Note: {order.delivery_instructions}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Points Earned */}
        {order.points_earned > 0 && order.order_status === 'delivered' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <Gift className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Points Earned!</h3>
                <p className="text-2xl font-bold text-green-700">+{order.points_earned} points</p>
              </div>
            </div>
          </div>
        )}

        {/* Rating Section - Show for delivered orders without review */}
        {order.order_status === 'delivered' && !order.is_reviewed && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">How was your experience?</h3>
              <p className="text-gray-500 mb-4">Your feedback helps us improve</p>
              <Button
                onClick={() => setShowReviewDialog(true)}
                className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
              >
                <Star className="w-4 h-4 mr-2" />
                Rate & Review
              </Button>
            </div>
          </div>
        )}

        {/* Rating Display - Show for reviewed orders */}
        {order.is_reviewed && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">Your Review</h3>
              <Badge className="bg-green-100 text-green-700">Submitted</Badge>
            </div>
            <p className="text-gray-500 text-sm">Thank you for your feedback!</p>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rate Your Order</DialogTitle>
          </DialogHeader>
          <ReviewForm
            order={order}
            onSubmit={handleReviewSubmit}
            onClose={() => setShowReviewDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}