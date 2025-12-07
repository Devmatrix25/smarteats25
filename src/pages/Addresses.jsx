import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  MapPin, Plus, Home, Briefcase, Edit2, Trash2,
  Check, Search, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function Addresses() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    label: "home",
    full_address: "",
    landmark: "",
    city: "Bangalore",
    pincode: "",
    latitude: null,
    longitude: null,
    is_default: false
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
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
      toast.success(editingAddress ? "Address updated" : "Address added", { duration: 2000 });
    },
    onError: () => toast.error("Failed to save address", { duration: 2000 })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Address.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      toast.success("Address deleted", { duration: 2000 });
    },
    onError: () => toast.error("Failed to delete address", { duration: 2000 })
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id) => {
      for (const addr of addresses) {
        if (addr.is_default) {
          await base44.entities.Address.update(addr.id, { is_default: false });
        }
      }
      return base44.entities.Address.update(id, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      toast.success("Default address updated", { duration: 2000 });
    }
  });

  const resetForm = () => {
    setFormData({
      label: "home",
      full_address: "",
      landmark: "",
      city: "Bangalore",
      pincode: "",
      latitude: null,
      longitude: null,
      is_default: false
    });
    setSearchQuery("");
    setSuggestions([]);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label || "home",
      full_address: address.full_address,
      landmark: address.landmark || "",
      city: address.city || "Bangalore",
      pincode: address.pincode || "",
      latitude: address.latitude,
      longitude: address.longitude,
      is_default: address.is_default
    });
    setSearchQuery(address.full_address);
    setShowForm(true);
  };

  // Search for address using Nominatim (OpenStreetMap)
  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: query + ", Bangalore, Karnataka, India",
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'in'
        })
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (e) {
      console.log('Address search failed');
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchAddress(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    setFormData(f => ({
      ...f,
      full_address: suggestion.display_name,
      latitude: lat,
      longitude: lng,
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.state_district || "Bangalore",
      pincode: suggestion.address?.postcode || ""
    }));
    setSearchQuery(suggestion.display_name);
    setSuggestions([]);
    toast.success("Address selected!", { duration: 2000 });
  };

  const handleSubmit = () => {
    if (!formData.full_address) {
      toast.error("Please enter an address", { duration: 2000 });
      return;
    }

    saveMutation.mutate({
      ...formData,
      user_email: user.email
    });
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
        {[1, 2].map(i => (
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

      <div className="space-y-4">
        {isLoading ? (
          [1, 2].map(i => (
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                      <RadioGroupItem value={type} id={`addr-${type}`} className="sr-only" />
                      <Label
                        htmlFor={`addr-${type}`}
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

            {/* Address Search */}
            <div className="relative">
              <Label className="mb-2 block">Search Address</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search for your address..."
                  className="pl-10 h-12 rounded-xl"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
                )}
              </div>

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b last:border-b-0"
                    >
                      <MapPin className="w-5 h-5 text-[#F25C23] mt-0.5 flex-shrink-0" />
                      <span className="text-sm line-clamp-2">{suggestion.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Address Display */}
            {formData.full_address && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm font-medium text-green-700 mb-1">✓ Selected Address:</p>
                <p className="text-sm text-green-800">{formData.full_address}</p>
                {formData.city && (
                  <p className="text-xs text-green-600 mt-1">City: {formData.city}</p>
                )}
              </div>
            )}

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

            {/* Default checkbox */}
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || !formData.full_address}
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