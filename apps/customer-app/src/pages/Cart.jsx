import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2 as PageLoader } from "lucide-react";
import { 
  Plus, Minus, Trash2, MapPin, CreditCard, Wallet, 
  Banknote, ChevronRight, Tag, Clock, AlertCircle,
  CheckCircle, Loader2, Percent, Gift, Star, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ScheduleOrder from "@/components/cart/ScheduleOrder";
import LoyaltyCard from "@/components/loyalty/LoyaltyCard";
import { format } from "date-fns";

export default function Cart() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newOrderId, setNewOrderId] = useState(null);
  const [schedule, setSchedule] = useState({ isScheduled: false, date: null, time: null });
  const [loyalty, setLoyalty] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);

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
      const userData = await base44.auth.me();
      setUser(userData);
      loadCart(userData.email);
      loadAddresses(userData.email);
      loadLoyalty(userData.email);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loadLoyalty = async (email) => {
    try {
      const records = await base44.entities.LoyaltyPoints.filter({ user_email: email });
      if (records.length > 0) {
        setLoyalty(records[0]);
      }
    } catch (e) {
      console.log('No loyalty found');
    }
  };

  const loadCart = async (email) => {
    try {
      const carts = await base44.entities.Cart.filter({ customer_email: email });
      if (carts.length > 0) {
        setCart(carts[0]);
      }
    } catch (e) {
      console.log('No cart found');
    }
  };

  const loadAddresses = async (email) => {
    try {
      const addrs = await base44.entities.Address.filter({ user_email: email });
      setAddresses(addrs);
      const defaultAddr = addrs.find(a => a.is_default) || addrs[0];
      if (defaultAddr) setSelectedAddress(defaultAddr);
    } catch (e) {
      console.log('No addresses found');
    }
  };

  const updateQuantity = async (itemId, delta, customizationKey = '') => {
    if (!cart) return;
    
    const existingIndex = cart.items?.findIndex(i => 
      i.menu_item_id === itemId && (i.customization_key || '') === customizationKey
    );
    if (existingIndex < 0) return;

    let newItems = [...cart.items];
    newItems[existingIndex].quantity += delta;
    
    if (newItems[existingIndex].quantity <= 0) {
      newItems = newItems.filter((i, idx) => idx !== existingIndex);
    }

    const subtotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    if (newItems.length === 0) {
      await base44.entities.Cart.delete(cart.id);
      setCart(null);
    } else {
      const updatedCart = { ...cart, items: newItems, subtotal };
      await base44.entities.Cart.update(cart.id, updatedCart);
      setCart(updatedCart);
    }
  };

  const applyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    
    if (code === "VIRUPAKSHA99") {
      const discountAmount = Math.round((subtotal + deliveryFee + taxes) * 0.99);
      setDiscount(discountAmount);
      toast.success("🎉 MEGA DISCOUNT! 99% off applied!");
    } else if (code === "FIRST50") {
      setDiscount(Math.min(subtotal * 0.5, 100));
      toast.success("Promo code applied! 50% off (max ₹100)");
    } else if (code === "FREEDEL") {
      setDiscount(deliveryFee);
      toast.success("Free delivery applied!");
    } else if (code === "SAVE20") {
      setDiscount(Math.min(subtotal * 0.2, 80));
      toast.success("20% off applied (max ₹80)");
    } else if (code === "FORYOU20") {
      setDiscount(Math.min(subtotal * 0.2, 100));
      toast.success("Personalized offer applied! 20% off");
    } else {
      toast.error("Invalid promo code");
      setDiscount(0);
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderNumber = `SE${Date.now().toString().slice(-8)}`;
      const finalPointsEarned = Math.floor(total / 10); // 1 point per ₹10
      
      const orderData = {
        order_number: orderNumber,
        customer_email: user.email,
        customer_name: user.full_name,
        restaurant_id: cart.restaurant_id,
        restaurant_name: cart.restaurant_name,
        items: cart.items,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        taxes: taxes,
        discount: discount + pointsDiscount,
        points_earned: finalPointsEarned,
        points_redeemed: pointsToRedeem,
        total_amount: total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cod" ? "pending" : "paid",
        order_status: schedule.isScheduled ? "scheduled" : "placed",
        is_scheduled: schedule.isScheduled,
        scheduled_date: schedule.isScheduled ? schedule.date : null,
        scheduled_time: schedule.isScheduled ? schedule.time : null,
        delivery_address: selectedAddress.full_address,
        delivery_latitude: selectedAddress.latitude || 12.9716,
        delivery_longitude: selectedAddress.longitude || 77.5946,
        delivery_instructions: deliveryInstructions,
        estimated_delivery_time: schedule.isScheduled 
          ? new Date(schedule.date).toISOString()
          : new Date(Date.now() + 45 * 60 * 1000).toISOString()
      };

      const order = await base44.entities.Order.create(orderData);

      // Notify restaurant immediately about new order
      await base44.entities.Notification.create({
        user_email: cart.restaurant_id, // Restaurant notification
        title: "🔔 New Order Received!",
        message: `New order #${orderNumber} from ${user.full_name} - ${cart.items?.length} items - ₹${total}`,
        type: "order",
        data: { order_id: order.id }
      });
      
      // Update loyalty points
      if (loyalty) {
        const newAvailable = loyalty.available_points - pointsToRedeem + finalPointsEarned;
        const newLifetime = loyalty.lifetime_points + finalPointsEarned;
        
        // Calculate tier
        let newTier = 'bronze';
        if (newLifetime >= 5000) newTier = 'platinum';
        else if (newLifetime >= 2000) newTier = 'gold';
        else if (newLifetime >= 500) newTier = 'silver';
        
        await base44.entities.LoyaltyPoints.update(loyalty.id, {
          available_points: newAvailable,
          lifetime_points: newLifetime,
          tier: newTier
        });

        // Record transactions
        if (pointsToRedeem > 0) {
          await base44.entities.PointsTransaction.create({
            user_email: user.email,
            order_id: order.id,
            points: -pointsToRedeem,
            type: "redeemed",
            description: `Redeemed for Order #${orderNumber}`
          });
        }
        await base44.entities.PointsTransaction.create({
          user_email: user.email,
          order_id: order.id,
          points: finalPointsEarned,
          type: "earned",
          description: `Earned from Order #${orderNumber}`
        });
      } else {
        // Create new loyalty account
        await base44.entities.LoyaltyPoints.create({
          user_email: user.email,
          available_points: finalPointsEarned,
          lifetime_points: finalPointsEarned,
          tier: "bronze"
        });
        await base44.entities.PointsTransaction.create({
          user_email: user.email,
          order_id: order.id,
          points: finalPointsEarned,
          type: "earned",
          description: `Earned from Order #${orderNumber}`
        });
      }
      
      // Clear cart
      await base44.entities.Cart.delete(cart.id);
      setCart(null);
      
      // Create notification
      await base44.entities.Notification.create({
        user_email: user.email,
        title: schedule.isScheduled ? "Order Scheduled! 📅" : "Order Placed! 🎉",
        message: schedule.isScheduled 
          ? `Your order #${orderNumber} is scheduled for ${format(new Date(schedule.date), "MMM d")} at ${schedule.time}`
          : `Your order #${orderNumber} has been placed successfully!`,
        type: "order",
        data: { order_id: order.id }
      });

      setPointsEarned(finalPointsEarned);
      setNewOrderId(order.id);
      setShowSuccessDialog(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7F2]">
        <div className="text-center">
          <PageLoader className="w-12 h-12 animate-spin text-[#F25C23] mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <img 
            src="https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=200&q=80" 
            alt="Empty cart"
            className="w-16 h-16 object-contain opacity-50"
          />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some delicious food to get started</p>
        <Link to={createPageUrl("Home")}>
          <Button className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
            Browse Restaurants
          </Button>
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const deliveryFee = 30;
  const taxes = Math.round(subtotal * 0.05);
  const pointsDiscount = Math.floor(pointsToRedeem / 10); // 10 points = ₹1
  const total = subtotal + deliveryFee + taxes - discount - pointsDiscount;
  const estimatedPointsEarned = Math.floor(total / 10);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant Info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🍽️</span>
              </div>
              <div>
                <h3 className="font-semibold">{cart.restaurant_name}</h3>
                <p className="text-sm text-gray-500">
                  {schedule.isScheduled 
                    ? `Scheduled: ${format(new Date(schedule.date), "EEE, MMM d")} • ${schedule.time}`
                    : "Estimated delivery: 35-45 mins"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Schedule Order */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Delivery Time
            </h3>
            <ScheduleOrder schedule={schedule} onScheduleChange={setSchedule} />
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold">Order Items</h3>
            {cart.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <img 
                  src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  {/* Show customizations */}
                  {item.customization_details && item.customization_details.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.customization_details.join(' • ')}
                    </p>
                  )}
                  <p className="text-[#F25C23] font-bold">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2 bg-white border rounded-xl">
                  <button 
                    onClick={() => updateQuantity(item.menu_item_id, -1, item.customization_key)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-l-xl"
                  >
                    {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                  </button>
                  <span className="font-bold min-w-[24px] text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.menu_item_id, 1, item.customization_key)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-r-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-bold min-w-[60px] text-right">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#F25C23]" />
                Delivery Address
              </h3>
              <Link to={createPageUrl("Addresses")}>
                <Button variant="ghost" size="sm" className="text-[#F25C23]">
                  Change
                </Button>
              </Link>
            </div>
            
            {addresses.length > 0 ? (
              <RadioGroup value={selectedAddress?.id} onValueChange={(id) => setSelectedAddress(addresses.find(a => a.id === id))}>
                {addresses.map((addr) => (
                  <div 
                    key={addr.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      selectedAddress?.id === addr.id 
                        ? "border-[#F25C23] bg-orange-50" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                    <Label htmlFor={addr.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">{addr.label}</Badge>
                        {addr.is_default && <Badge className="bg-[#3BA55D] text-white text-xs">Default</Badge>}
                      </div>
                      <p className="text-gray-700">{addr.full_address}</p>
                      {addr.landmark && <p className="text-sm text-gray-500">Landmark: {addr.landmark}</p>}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Link to={createPageUrl("Addresses")}>
                <Button variant="outline" className="w-full rounded-xl border-dashed">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Address
                </Button>
              </Link>
            )}
          </div>

          {/* Delivery Instructions */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold mb-3">Delivery Instructions (Optional)</h3>
            <Textarea 
              placeholder="E.g., Leave at door, Ring the bell twice..."
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold mb-4">Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              {[
                { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when you receive" },
                { id: "card", label: "Credit/Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
                { id: "upi", label: "UPI", icon: Wallet, desc: "GPay, PhonePe, Paytm" },
              ].map((method) => (
                <div 
                  key={method.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    paymentMethod === method.id 
                      ? "border-[#F25C23] bg-orange-50" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <method.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <p className="font-medium">{method.label}</p>
                    <p className="text-sm text-gray-500">{method.desc}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-20">
            <h3 className="font-semibold mb-4">Order Summary</h3>

            {/* Promo Code */}
            <div className="flex gap-2 mb-6">
              <div className="flex-1 relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
              <Button 
                onClick={applyPromo}
                variant="outline" 
                className="rounded-xl border-[#F25C23] text-[#F25C23] hover:bg-[#F25C23] hover:text-white"
              >
                Apply
              </Button>
            </div>

            {/* Loyalty Points Section */}
            {loyalty && loyalty.available_points > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">Use Reward Points</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">
                    {loyalty.available_points} pts
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max={Math.min(loyalty.available_points, total * 10)}
                    step="10"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(parseInt(e.target.value))}
                    className="flex-1 accent-purple-600"
                  />
                  <span className="text-sm font-medium min-w-[80px] text-right">
                    {pointsToRedeem} pts = ₹{Math.floor(pointsToRedeem / 10)}
                  </span>
                </div>
              </div>
            )}

            {/* Bill Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Item Total</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxes & Charges</span>
                <span>₹{taxes}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-[#3BA55D]">
                  <span className="flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    Promo Discount
                  </span>
                  <span>-₹{discount}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-sm text-purple-600">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Points Discount
                  </span>
                  <span>-₹{pointsDiscount}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span>₹{total}</span>
              </div>
              
              {/* Points to earn */}
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700 flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  Points you'll earn
                </span>
                <span className="font-bold text-green-700">+{estimatedPointsEarned} pts</span>
              </div>
            </div>

            <Button 
              onClick={placeOrder}
              disabled={isPlacingOrder || !selectedAddress}
              className="w-full h-14 bg-[#F25C23] hover:bg-[#D94A18] rounded-xl text-lg font-semibold"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                `Pay ₹${total}`
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By placing this order, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-6">
            <div className="w-20 h-20 bg-[#3BA55D] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">
              {schedule.isScheduled ? "Order Scheduled! 📅" : "Order Placed! 🎉"}
            </DialogTitle>
            <p className="text-gray-500 mb-4">
              {schedule.isScheduled 
                ? `Your order is scheduled for ${format(new Date(schedule.date), "EEE, MMM d")} at ${schedule.time}`
                : "Your order has been placed successfully and is being prepared."
              }
            </p>
            
            {/* Points Earned */}
            {pointsEarned > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <span className="font-bold text-lg text-green-700">+{pointsEarned} points earned!</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={() => navigate(createPageUrl("Home"))}
              >
                Continue Shopping
              </Button>
              <Button 
                className="flex-1 bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
                onClick={() => navigate(`${createPageUrl("OrderTracking")}?id=${newOrderId}`)}
              >
                {schedule.isScheduled ? "View Order" : "Track Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}