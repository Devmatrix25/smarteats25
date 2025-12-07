import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Truck, MapPin, Phone, Navigation, CheckCircle,
  Package, Clock, User, ChevronRight, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DeliverySimulation from "@/components/delivery/DeliverySimulation";
import DriverOrderListener from "@/components/realtime/DriverOrderListener";
import NavigationPreference from "@/components/navigation/NavigationPreference";

export default function DriverDeliveries() {
  const urlParams = new URLSearchParams(window.location.search);
  const activeOrderId = urlParams.get('active');
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [activeTab, setActiveTab] = useState("current");
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    vehicle_type: "scooter",
    vehicle_number: "",
    city: "Bangalore"
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
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
      loadDriver(userData.email);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loadDriver = async (email) => {
    try {
      const drivers = await base44.entities.Driver.filter({ email: email });
      if (drivers.length > 0) {
        setDriver(drivers[0]);
      } else if (email === 'driver@demo.com') {
        const d = await base44.entities.Driver.create({ name: 'Demo Driver', email, phone: '9876543210', vehicle_type: 'bike', vehicle_number: 'KA-01-AB-1234', city: 'Bangalore', status: 'approved', is_online: true, is_busy: false, average_rating: 0, total_deliveries: 0, total_earnings: 0 });
        setDriver(d);
      } else {
        setShowRegisterDialog(true);
      }
    } catch (e) {
      setShowRegisterDialog(true);
    }
  };

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['driver-deliveries', driver?.email],
    queryFn: () => base44.entities.Order.filter({ driver_email: driver.email }, '-created_date'),
    enabled: !!driver?.email,
    refetchInterval: 2000 // Real-time updates every 2 seconds
  });

  const registerMutation = useMutation({
    mutationFn: (data) => base44.entities.Driver.create({ ...data, email: user.email, status: 'pending' }),
    onSuccess: (result) => {
      setDriver(result);
      setShowRegisterDialog(false);
      toast.success("Registration submitted! Awaiting approval.");
    },
    onError: () => toast.error("Registration failed")
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { order_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['driver-deliveries']);
      toast.success("Status updated!");
    }
  });

  const handleRegister = () => {
    if (!registerForm.name || !registerForm.phone || !registerForm.vehicle_number) {
      toast.error("Please fill all required fields");
      return;
    }
    registerMutation.mutate(registerForm);
  };

  const markOnTheWay = async (order) => {
    await updateOrderMutation.mutateAsync({ id: order.id, status: 'on_the_way' });
    toast.success("Status updated! Starting delivery simulation...");
  };

  const markDelivered = async (order) => {
    await updateOrderMutation.mutateAsync({ id: order.id, status: 'delivered' });
    // Update driver stats
    await base44.entities.Driver.update(driver.id, {
      is_busy: false,
      total_deliveries: (driver.total_deliveries || 0) + 1,
      total_earnings: (driver.total_earnings || 0) + 50
    });
    setDriver({
      ...driver,
      is_busy: false,
      total_deliveries: (driver.total_deliveries || 0) + 1
    });
    toast.success("🎉 Delivery completed! +₹50 earned");
  };

  // Auto-simulate delivery when order is picked up
  const startDeliverySimulation = async (order) => {
    // Mark as on the way
    await markOnTheWay(order);

    // After 30 seconds, auto-complete the delivery
    setTimeout(async () => {
      await base44.entities.Order.update(order.id, {
        order_status: 'delivered',
        actual_delivery_time: new Date().toISOString()
      });
      await base44.entities.Driver.update(driver.id, {
        is_busy: false,
        total_deliveries: (driver.total_deliveries || 0) + 1,
        total_earnings: (driver.total_earnings || 0) + 50
      });
      setDriver(d => ({
        ...d,
        is_busy: false,
        total_deliveries: (d.total_deliveries || 0) + 1
      }));
      refetch();
      toast.success("🎉 Delivery completed automatically! +₹50 earned");
    }, 10000); // 10 seconds fast simulation
  };

  const activeOrders = orders.filter(o => ['picked_up', 'on_the_way'].includes(o.order_status));
  const completedOrders = orders.filter(o => o.order_status === 'delivered');

  // Show registration dialog
  if (showRegisterDialog && !driver && !isAuthLoading) {
    return (
      <div className="p-6">
        <Dialog open={showRegisterDialog} onOpenChange={(open) => {
          if (!open) {
            navigate(createPageUrl("Home"));
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register as Delivery Partner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Select
                  value={registerForm.vehicle_type}
                  onValueChange={(v) => setRegisterForm(f => ({ ...f, vehicle_type: v }))}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle Number *</Label>
                <Input
                  value={registerForm.vehicle_number}
                  onChange={(e) => setRegisterForm(f => ({ ...f, vehicle_number: e.target.value }))}
                  placeholder="KA01AB1234"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={registerForm.city}
                  onChange={(e) => setRegisterForm(f => ({ ...f, city: e.target.value }))}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                onClick={handleRegister}
                disabled={registerMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 rounded-xl"
              >
                {registerMutation.isPending ? "Submitting..." : "Register"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (driver?.status === 'pending') {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Registration Under Review</h2>
          <p className="text-gray-500 mb-6">
            Your driver profile is being reviewed by our team.
          </p>
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            Pending Approval
          </Badge>
        </div>
      </div>
    );
  }

  const handleNewDelivery = () => {
    refetch();
  };

  return (
    <div className="p-6">
      {/* Real-time listener */}
      {driver?.email && (
        <DriverOrderListener
          driverEmail={driver.email}
          isOnline={driver.is_online}
          onNewDelivery={handleNewDelivery}
          onOrderUpdate={() => refetch()}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Deliveries</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="current" className="rounded-lg data-[state=active]:bg-white">
              Current ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white">
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : activeOrders.length > 0 ? (
              <div className="space-y-4">
                {activeOrders.map(order => (
                  <Card key={order.id} className="border-2 border-green-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-semibold text-lg">Order #{order.order_number}</p>
                          <p className="text-gray-500">{order.restaurant_name}</p>
                        </div>
                        <Badge className={cn(
                          order.order_status === 'picked_up' && "bg-indigo-100 text-indigo-700",
                          order.order_status === 'on_the_way' && "bg-orange-100 text-orange-700"
                        )}>
                          {order.order_status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Customer Info */}
                      <div className="p-4 bg-gray-50 rounded-xl mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{order.customer_name}</span>
                          </div>
                          <Button size="icon" variant="ghost">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                          <span className="text-sm">{order.delivery_address}</span>
                        </div>
                        {order.delivery_instructions && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            Note: {order.delivery_instructions}
                          </p>
                        )}
                      </div>

                      {/* Items */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Items:</p>
                        <div className="space-y-1">
                          {order.items?.map((item, idx) => (
                            <p key={idx} className="text-sm">{item.quantity}x {item.name}</p>
                          ))}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl mb-4">
                        <span className="font-medium">Collect Amount (COD)</span>
                        <span className="text-xl font-bold">₹{order.total_amount}</span>
                      </div>

                      {/* Live Delivery Map */}
                      {['picked_up', 'on_the_way'].includes(order.order_status) && (
                        <div className="mt-4 rounded-xl overflow-hidden">
                          <DeliverySimulation
                            order={order}
                            onDeliveryComplete={() => {
                              refetch();
                              toast.success("🎉 Delivery completed! +₹50 earned");
                            }}
                            restaurantLocation={{ lat: 12.9716, lng: 77.5946 }}
                            deliveryLocation={{
                              lat: order.delivery_latitude || 12.9816,
                              lng: order.delivery_longitude || 77.6046
                            }}
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 mt-4">
                        <div className="flex-1">
                          <NavigationPreference
                            latitude={order.delivery_latitude || 12.9816}
                            longitude={order.delivery_longitude || 77.6046}
                            address={order.delivery_address}
                            driverEmail={driver?.email}
                          />
                        </div>
                        {order.order_status === 'picked_up' && (
                          <Button
                            className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl"
                            onClick={() => startDeliverySimulation(order)}
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Start Delivery
                          </Button>
                        )}
                        {order.order_status === 'on_the_way' && (
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl"
                            onClick={() => markDelivered(order)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Delivery
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active deliveries</h3>
                <p className="text-gray-500">Accept a delivery from the dashboard to get started</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedOrders.length > 0 ? (
              <div className="space-y-4">
                {completedOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">#{order.order_number}</p>
                          <p className="text-sm text-gray-500">{order.restaurant_name}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(order.created_date), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-700">Delivered</Badge>
                          <p className="text-sm font-medium mt-1 text-green-600">+₹50</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No completed deliveries</h3>
                <p className="text-gray-500">Your delivery history will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}