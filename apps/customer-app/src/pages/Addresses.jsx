import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  MapPin, Plus, Home, Briefcase, Edit2, Trash2,
  Check, X, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import AddressValidator from "@/components/address/AddressValidator";

export default function Addresses() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    label: "home",
    full_address: "",
    landmark: "",
    city: "",
    pincode: "",
    latitude: null,
    longitude: null,
    is_default: false
  });
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
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', user?.email],
    queryFn: () => base44.entities.Address.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingAddress) {
        return base44.entities.Address.update(editingAddress.id, data);
      }
      return base44.entities.Address.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      setShowForm(false);
      setEditingAddress(null);
      resetForm();
      toast.success(editingAddress ? "Address updated" : "Address added");
    },
    onError: () => toast.error("Failed to save address")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Address.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      toast.success("Address deleted");
    },
    onError: () => toast.error("Failed to delete address")
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id) => {
      // Remove default from all addresses
      for (const addr of addresses) {
        if (addr.is_default) {
          await base44.entities.Address.update(addr.id, { is_default: false });
        }
      }
      // Set new default
      return base44.entities.Address.update(id, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      toast.success("Default address updated");
    }
  });

  const resetForm = () => {
    setFormData({
      label: "home",
      full_address: "",
      landmark: "",
      city: "",
      pincode: "",
      latitude: null,
      longitude: null,
      is_default: false
    });
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      full_address: address.full_address,
      landmark: address.landmark || "",
      city: address.city,
      pincode: address.pincode || "",
      latitude: address.latitude,
      longitude: address.longitude,
      is_default: address.is_default
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.full_address || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    saveMutation.mutate({
      ...formData,
      user_email: user.email
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(f => ({
            ...f,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          toast.success("Location captured!");
        },
        (error) => {
          toast.error("Unable to get location");
        }
      );
    }
  };

  const labelIcons = {
    home: Home,
    work: Briefcase,
    other: MapPin
  };

  if (isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="h-10 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
        {[1,2].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 mb-4 animate-pulse">
            <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <Button 
          onClick={() => {
            resetForm();
            setEditingAddress(null);
            setShowForm(true);
          }}
          className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Address List */}
      <div className="space-y-4">
        {isLoading ? (
          [1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
          ))
        ) : addresses.length > 0 ? (
          addresses.map((address) => {
            const LabelIcon = labelIcons[address.label] || MapPin;
            return (
              <div 
                key={address.id}
                className={cn(
                  "bg-white rounded-2xl p-6 shadow-sm border-2 transition-all",
                  address.is_default ? "border-[#F25C23]" : "border-transparent"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      address.label === "home" && "bg-blue-100",
                      address.label === "work" && "bg-purple-100",
                      address.label === "other" && "bg-gray-100"
                    )}>
                      <LabelIcon className={cn(
                        "w-6 h-6",
                        address.label === "home" && "text-blue-600",
                        address.label === "work" && "text-purple-600",
                        address.label === "other" && "text-gray-600"
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold capitalize">{address.label}</h3>
                        {address.is_default && (
                          <Badge className="bg-[#F25C23]/10 text-[#F25C23] border-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700">{address.full_address}</p>
                      {address.landmark && (
                        <p className="text-sm text-gray-500">Landmark: {address.landmark}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {address.city}{address.pincode ? `, ${address.pincode}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(address)}
                      className="text-gray-500 hover:text-[#F25C23]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteMutation.mutate(address.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultMutation.mutate(address.id)}
                    className="mt-4 rounded-xl"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Set as Default
                  </Button>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No addresses saved</h3>
            <p className="text-gray-500 mb-6">Add an address to get started</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Label Selection */}
            <div>
              <Label className="mb-2 block">Address Type</Label>
              <RadioGroup 
                value={formData.label} 
                onValueChange={(value) => setFormData(f => ({ ...f, label: value }))}
                className="flex gap-4"
              >
                {['home', 'work', 'other'].map((type) => {
                  const Icon = labelIcons[type];
                  return (
                    <div key={type} className="flex items-center">
                      <RadioGroupItem value={type} id={type} className="sr-only" />
                      <Label
                        htmlFor={type}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all capitalize",
                          formData.label === type 
                            ? "border-[#F25C23] bg-orange-50 text-[#F25C23]" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {type}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Address Validator with Map */}
            <AddressValidator
              value={formData}
              onChange={(addressData) => {
                setFormData(f => ({
                  ...f,
                  full_address: addressData.full_address,
                  latitude: addressData.latitude,
                  longitude: addressData.longitude,
                  city: addressData.city || f.city,
                  pincode: addressData.pincode || f.pincode
                }));
              }}
              onValidAddress={(addressData) => {
                // Address is validated within delivery area
              }}
              showMap={true}
            />

            {/* Landmark */}
            <div>
              <Label htmlFor="landmark">Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="Nearby landmark for easy delivery"
                value={formData.landmark}
                onChange={(e) => setFormData(f => ({ ...f, landmark: e.target.value }))}
                className="mt-1 rounded-xl"
              />
            </div>

            {/* Default Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData(f => ({ ...f, is_default: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-[#F25C23] focus:ring-[#F25C23]"
              />
              <span>Set as default address</span>
            </label>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
            >
              {saveMutation.isPending ? "Saving..." : "Save Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}