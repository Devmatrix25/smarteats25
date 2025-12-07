import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Store, MapPin, Clock, Phone, Mail, Image as ImageIcon,
  Save, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const cuisineOptions = [
  "Indian", "Chinese", "Italian", "Mexican", "Thai", "Japanese",
  "American", "Mediterranean", "Korean", "Vietnamese", "Continental"
];

export default function RestaurantSettings() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cuisine_type: [],
    address: "",
    city: "Bangalore",
    phone: "",
    image_url: "",
    logo_url: "",
    opening_time: "09:00",
    closing_time: "22:00",
    minimum_order: 200,
    delivery_fee: 30,
    delivery_time_mins: 30,
    is_open: true,
    latitude: 12.9716,
    longitude: 77.5946
  });
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
        const rest = restaurants[0];
        setRestaurant(rest);
        setFormData({
          name: rest.name || "",
          description: rest.description || "",
          cuisine_type: rest.cuisine_type || [],
          address: rest.address || "",
          city: rest.city || "Bangalore",
          phone: rest.phone || "",
          image_url: rest.image_url || "",
          logo_url: rest.logo_url || "",
          opening_time: rest.opening_time || "09:00",
          closing_time: rest.closing_time || "22:00",
          minimum_order: rest.minimum_order || 200,
          delivery_fee: rest.delivery_fee || 30,
          delivery_time_mins: rest.delivery_time_mins || 30,
          is_open: rest.is_open !== false,
          latitude: rest.latitude || 12.9716,
          longitude: rest.longitude || 77.5946
        });
      }
    } catch (e) {
      console.log('No restaurant');
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (restaurant) {
        return base44.entities.Restaurant.update(restaurant.id, data);
      }
      return base44.entities.Restaurant.create({
        ...data,
        owner_email: user.email,
        status: 'pending'
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['restaurant']);
      if (!restaurant) {
        setRestaurant(result);
      }
      toast.success(restaurant ? "Settings saved!" : "Restaurant registered! Awaiting approval.");
    },
    onError: () => toast.error("Failed to save")
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      toast.error("Name and address are required");
      return;
    }
    saveMutation.mutate({
      ...formData,
      minimum_order: parseFloat(formData.minimum_order),
      delivery_fee: parseFloat(formData.delivery_fee),
      delivery_time_mins: parseInt(formData.delivery_time_mins)
    });
  };

  const toggleCuisine = (cuisine) => {
    setFormData(f => ({
      ...f,
      cuisine_type: f.cuisine_type.includes(cuisine)
        ? f.cuisine_type.filter(c => c !== cuisine)
        : [...f.cuisine_type, cuisine]
    }));
  };

  if (isAuthLoading) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-64 rounded-xl mb-4" />
          <Skeleton className="h-48 rounded-xl mb-4" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {restaurant ? "Restaurant Settings" : "Register Your Restaurant"}
        </h1>

        {restaurant?.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Pending Approval</p>
              <p className="text-sm text-yellow-700">Your restaurant is being reviewed. You can update settings while waiting.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Restaurant Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your Restaurant Name"
                  className="mt-1 rounded-xl"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Tell customers about your restaurant..."
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label>Cuisine Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cuisineOptions.map(cuisine => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => toggleCuisine(cuisine)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        formData.cuisine_type.includes(cuisine)
                          ? "bg-[#F25C23] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Address *</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))}
                  placeholder="Complete restaurant address"
                  className="mt-1 rounded-xl"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Opening Time</Label>
                  <Input
                    type="time"
                    value={formData.opening_time}
                    onChange={(e) => setFormData(f => ({ ...f, opening_time: e.target.value }))}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label>Closing Time</Label>
                  <Input
                    type="time"
                    value={formData.closing_time}
                    onChange={(e) => setFormData(f => ({ ...f, closing_time: e.target.value }))}
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium">Currently Open</p>
                  <p className="text-sm text-gray-500">Toggle to accept orders</p>
                </div>
                <Switch
                  checked={formData.is_open}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_open: v }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Min Order (₹)</Label>
                  <Input
                    type="number"
                    value={formData.minimum_order}
                    onChange={(e) => setFormData(f => ({ ...f, minimum_order: e.target.value }))}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label>Delivery Fee (₹)</Label>
                  <Input
                    type="number"
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData(f => ({ ...f, delivery_fee: e.target.value }))}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label>Delivery Time (mins)</Label>
                  <Input
                    type="number"
                    value={formData.delivery_time_mins}
                    onChange={(e) => setFormData(f => ({ ...f, delivery_time_mins: e.target.value }))}
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cover Image URL</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1 rounded-xl"
                />
                {formData.image_url && (
                  <img src={formData.image_url} alt="Cover" className="mt-2 h-32 rounded-xl object-cover" />
                )}
              </div>
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData(f => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button 
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full h-14 bg-[#F25C23] hover:bg-[#D94A18] rounded-xl text-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {saveMutation.isPending ? "Saving..." : (restaurant ? "Save Settings" : "Register Restaurant")}
          </Button>
        </form>
      </div>
    </div>
  );
}