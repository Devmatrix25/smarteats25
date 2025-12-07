import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  User, Mail, Phone, MapPin, Clock, Heart, Settings,
  HelpCircle, LogOut, ChevronRight, Bell, Shield, 
  CreditCard, Gift, Star, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const menuItems = [
  { icon: Clock, label: "My Orders", page: "Orders", color: "text-blue-600 bg-blue-100" },
  { icon: MapPin, label: "Addresses", page: "Addresses", color: "text-green-600 bg-green-100" },
  { icon: Heart, label: "Favorites", page: "Favorites", color: "text-red-600 bg-red-100" },
  { icon: Gift, label: "Rewards & Points", page: "Rewards", color: "text-pink-600 bg-pink-100" },
  { icon: CreditCard, label: "Payment Methods", page: null, color: "text-purple-600 bg-purple-100" },
  { icon: Bell, label: "Notifications", page: null, color: "text-orange-600 bg-orange-100" },
];

const settingsItems = [
  { icon: Settings, label: "App Settings", page: "Settings" },
  { icon: HelpCircle, label: "Help & Support", page: null },
  { icon: Shield, label: "Privacy Policy", page: null },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "" });
  const [stats, setStats] = useState({ orders: 0, savings: 0 });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
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
      setEditForm({ 
        full_name: userData.full_name || "", 
        phone: userData.phone || "" 
      });
      loadStats(userData.email);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loadStats = async (email) => {
    try {
      const orders = await base44.entities.Order.filter({ customer_email: email });
      const totalSavings = orders.reduce((acc, o) => acc + (o.discount || 0), 0);
      setStats({ orders: orders.length, savings: totalSavings });
    } catch (e) {
      console.log('Stats not loaded');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await base44.auth.updateMe(editForm);
      setUser({ ...user, ...editForm });
      setShowEditDialog(false);
      toast.success("Profile updated!");
    } catch (e) {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = createPageUrl("Index");
  };

  if (isAuthLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-2" />
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#F25C23] to-[#D94A18] rounded-3xl p-6 text-white mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
            {user.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.full_name || "User"}</h1>
            <p className="text-white/80">{user.email}</p>
            {user.role === 'admin' && (
              <Badge className="mt-1 bg-white/20 text-white border-0">Admin</Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowEditDialog(true)}
            className="text-white hover:bg-white/20"
          >
            Edit
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{stats.orders}</p>
            <p className="text-sm text-white/70">Orders</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">₹{stats.savings}</p>
            <p className="text-sm text-white/70">Saved</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-5 h-5 fill-[#FFC043] text-[#FFC043]" />
              <p className="text-2xl font-bold">4.8</p>
            </div>
            <p className="text-sm text-white/70">Rating</p>
          </div>
        </div>
      </div>

      {/* SmartEats Plus Banner */}
      <div className="bg-gradient-to-r from-[#1D1D1F] to-[#2C2C2E] rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FFC043] to-[#F25C23] rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold">SmartEats Plus</h3>
            <p className="text-gray-400 text-sm">Free delivery on all orders</p>
          </div>
        </div>
        <Button className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
          Join Now
        </Button>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        {menuItems.map((item, idx) => (
          <React.Fragment key={idx}>
            {item.page ? (
              <Link 
                to={createPageUrl(item.page)}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ) : (
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            )}
            {idx < menuItems.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </div>

      {/* Partner Links */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <Link 
          to={createPageUrl("RestaurantDashboard")}
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <span className="font-medium block">Restaurant Partner</span>
              <span className="text-sm text-gray-500">Manage your restaurant</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Separator />
        <Link 
          to={createPageUrl("DriverDashboard")}
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <span className="font-medium block">Delivery Partner</span>
              <span className="text-sm text-gray-500">Start delivering</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        {settingsItems.map((item, idx) => (
          <React.Fragment key={idx}>
            {item.page ? (
              <Link 
                to={createPageUrl(item.page)}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <item.icon className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ) : (
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <item.icon className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            )}
            {idx < settingsItems.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </div>

      {/* Logout */}
      <Button 
        variant="outline"
        onClick={handleLogout}
        className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>

      <p className="text-center text-gray-400 text-sm mt-6">
        SmartEats v1.0.0
      </p>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editForm.full_name}
                onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email} disabled className="mt-1 rounded-xl bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}