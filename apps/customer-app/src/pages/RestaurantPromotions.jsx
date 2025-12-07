import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Tag, Percent, Gift, Plus, Edit2, Trash2, Calendar,
  Clock, Users, TrendingUp, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
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

export default function RestaurantPromotions() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "",
    max_discount: "",
    usage_limit: "",
    valid_from: format(new Date(), "yyyy-MM-dd"),
    valid_until: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    is_active: true
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
      if (restaurants.length > 0) setRestaurant(restaurants[0]);
    } catch (e) {
      console.log('No restaurant');
    }
  };

  // For now, store promotions in restaurant's data
  const promotions = restaurant?.promotions || [];

  const savePromotion = async () => {
    if (!formData.code || !formData.discount_value) {
      toast.error("Please fill required fields");
      return;
    }

    const newPromo = {
      ...formData,
      id: editingPromo?.id || Date.now().toString(),
      discount_value: parseFloat(formData.discount_value),
      min_order_value: parseFloat(formData.min_order_value) || 0,
      max_discount: parseFloat(formData.max_discount) || null,
      usage_limit: parseInt(formData.usage_limit) || null,
      usage_count: editingPromo?.usage_count || 0,
      created_at: editingPromo?.created_at || new Date().toISOString()
    };

    let updatedPromos;
    if (editingPromo) {
      updatedPromos = promotions.map(p => p.id === editingPromo.id ? newPromo : p);
    } else {
      updatedPromos = [...promotions, newPromo];
    }

    try {
      await base44.entities.Restaurant.update(restaurant.id, { promotions: updatedPromos });
      setRestaurant({ ...restaurant, promotions: updatedPromos });
      setShowForm(false);
      setEditingPromo(null);
      resetForm();
      toast.success(editingPromo ? "Promotion updated!" : "Promotion created!");
    } catch (e) {
      toast.error("Failed to save promotion");
    }
  };

  const deletePromotion = async (id) => {
    const updatedPromos = promotions.filter(p => p.id !== id);
    try {
      await base44.entities.Restaurant.update(restaurant.id, { promotions: updatedPromos });
      setRestaurant({ ...restaurant, promotions: updatedPromos });
      toast.success("Promotion deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const togglePromoStatus = async (promo) => {
    const updatedPromos = promotions.map(p => 
      p.id === promo.id ? { ...p, is_active: !p.is_active } : p
    );
    await base44.entities.Restaurant.update(restaurant.id, { promotions: updatedPromos });
    setRestaurant({ ...restaurant, promotions: updatedPromos });
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_value: "",
      max_discount: "",
      usage_limit: "",
      valid_from: format(new Date(), "yyyy-MM-dd"),
      valid_until: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      is_active: true
    });
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      min_order_value: promo.min_order_value?.toString() || "",
      max_discount: promo.max_discount?.toString() || "",
      usage_limit: promo.usage_limit?.toString() || "",
      valid_from: promo.valid_from,
      valid_until: promo.valid_until,
      is_active: promo.is_active
    });
    setShowForm(true);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = restaurant?.name?.substring(0, 3).toUpperCase() || 'PROMO';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(f => ({ ...f, code }));
  };

  if (isAuthLoading || !restaurant) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Skeleton className="h-32 rounded-xl mb-6" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const activePromos = promotions.filter(p => p.is_active);
  const inactivePromos = promotions.filter(p => !p.is_active);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Promotions & Offers</h1>
            <p className="text-gray-500">{promotions.length} total promotions</p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setEditingPromo(null);
              setShowForm(true);
            }}
            className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Promotion
          </Button>
        </div>

        {/* Quick Templates */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Percent, title: "Percentage Off", desc: "10-50% discount", template: { discount_type: 'percentage', discount_value: '20' } },
            { icon: Tag, title: "Flat Discount", desc: "Fixed amount off", template: { discount_type: 'flat', discount_value: '100' } },
            { icon: Gift, title: "Free Delivery", desc: "Zero delivery fee", template: { discount_type: 'flat', discount_value: '50', description: 'Free Delivery' } },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFormData(f => ({ ...f, ...item.template }));
                setShowForm(true);
              }}
              className="p-4 bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-[#F25C23] transition-all text-left group"
            >
              <item.icon className="w-8 h-8 text-gray-400 group-hover:text-[#F25C23] mb-2" />
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </button>
          ))}
        </div>

        {/* Active Promotions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Active Promotions ({activePromos.length})
          </h2>
          
          {activePromos.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {activePromos.map(promo => (
                <Card key={promo.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg font-mono font-bold hover:bg-gray-200"
                          >
                            {promo.code}
                            {copiedCode === promo.code ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                        <p className="text-gray-600">{promo.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#F25C23]">
                          {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `₹${promo.discount_value}`}
                        </p>
                        <p className="text-sm text-gray-500">OFF</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Min Order</p>
                        <p className="font-medium">₹{promo.min_order_value || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Max Discount</p>
                        <p className="font-medium">{promo.max_discount ? `₹${promo.max_discount}` : 'No limit'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Used</p>
                        <p className="font-medium">{promo.usage_count || 0}{promo.usage_limit ? `/${promo.usage_limit}` : ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        Valid till {format(new Date(promo.valid_until), "MMM d, yyyy")}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(promo)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => togglePromoStatus(promo)}>
                          Pause
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deletePromotion(promo.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No active promotions</h3>
              <p className="text-gray-500 mb-4">Create your first promotion to attract more customers</p>
              <Button onClick={() => setShowForm(true)} className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
                Create Promotion
              </Button>
            </div>
          )}
        </div>

        {/* Inactive Promotions */}
        {inactivePromos.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              Inactive ({inactivePromos.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {inactivePromos.map(promo => (
                <Card key={promo.id} className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold">{promo.code}</span>
                        <p className="text-sm text-gray-500">
                          {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `₹${promo.discount_value}`} off
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => togglePromoStatus(promo)}>
                          Activate
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deletePromotion(promo.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Promo Code *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20"
                  className="font-mono rounded-xl"
                />
                <Button variant="outline" onClick={generateCode} className="rounded-xl">
                  Generate
                </Button>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Get 20% off on your order"
                className="mt-1 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Select 
                  value={formData.discount_type}
                  onValueChange={(v) => setFormData(f => ({ ...f, discount_type: v }))}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value *</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData(f => ({ ...f, discount_value: e.target.value }))}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Order Value (₹)</Label>
                <Input
                  type="number"
                  value={formData.min_order_value}
                  onChange={(e) => setFormData(f => ({ ...f, min_order_value: e.target.value }))}
                  placeholder="199"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>Max Discount (₹)</Label>
                <Input
                  type="number"
                  value={formData.max_discount}
                  onChange={(e) => setFormData(f => ({ ...f, max_discount: e.target.value }))}
                  placeholder="100"
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData(f => ({ ...f, valid_from: e.target.value }))}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData(f => ({ ...f, valid_until: e.target.value }))}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label>Usage Limit (leave empty for unlimited)</Label>
              <Input
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData(f => ({ ...f, usage_limit: e.target.value }))}
                placeholder="100"
                className="mt-1 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span>Active</span>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData(f => ({ ...f, is_active: v }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={savePromotion} className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
              {editingPromo ? 'Update' : 'Create'} Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}