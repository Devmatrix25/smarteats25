import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus, Edit2, Trash2, Search, Leaf, Image as ImageIcon,
  MoreVertical, Eye, EyeOff, Star, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = ["Starters", "Main Course", "Rice & Biryani", "Breads", "Desserts", "Beverages", "Combos"];
const spiceLevels = ["mild", "medium", "hot", "extra_hot"];
const defaultSizes = [
  { name: "Small", price: 0 },
  { name: "Medium", price: 50 },
  { name: "Large", price: 100 },
  { name: "Family", price: 200 },
];
const defaultToppings = [
  { name: "Extra Cheese", price: 40 },
  { name: "Mushrooms", price: 35 },
  { name: "Olives", price: 30 },
  { name: "Jalapenos", price: 25 },
  { name: "Paneer", price: 50 },
  { name: "Chicken", price: 80 },
  { name: "Corn", price: 25 },
];
const defaultCustomizations = [
  { name: "Extra Spicy", price: 0 },
  { name: "Less Spicy", price: 0 },
  { name: "No Onion", price: 0 },
  { name: "No Garlic", price: 0 },
  { name: "Jain (No Onion/Garlic)", price: 0 },
  { name: "Extra Gravy", price: 30 },
];

export default function RestaurantMenu() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Main Course",
    is_vegetarian: false,
    is_bestseller: false,
    is_recommended: false,
    is_special_offer: false,
    offer_price: "",
    offer_label: "",
    is_available: true,
    spice_level: "medium",
    preparation_time_mins: 15,
    image_url: "",
    sizes: [],
    toppings: [],
    customizations: []
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

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menu-items', restaurant?.id],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingItem) {
        return base44.entities.MenuItem.update(editingItem.id, data);
      }
      return base44.entities.MenuItem.create({ ...data, restaurant_id: restaurant.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      setShowForm(false);
      setEditingItem(null);
      resetForm();
      toast.success(editingItem ? "Item updated!" : "Item added!");
    },
    onError: () => toast.error("Failed to save item")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success("Item deleted");
    }
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, is_available }) => base44.entities.MenuItem.update(id, { is_available }),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success("Availability updated");
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Main Course",
      is_vegetarian: false,
      is_bestseller: false,
      is_recommended: false,
      is_special_offer: false,
      offer_price: "",
      offer_label: "",
      is_available: true,
      spice_level: "medium",
      preparation_time_mins: 15,
      image_url: "",
      sizes: [],
      toppings: [],
      customizations: []
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category || "Main Course",
      is_vegetarian: item.is_vegetarian || false,
      is_bestseller: item.is_bestseller || false,
      is_recommended: item.is_recommended || false,
      is_special_offer: item.is_special_offer || false,
      offer_price: item.offer_price?.toString() || "",
      offer_label: item.offer_label || "",
      is_available: item.is_available !== false,
      spice_level: item.spice_level || "medium",
      preparation_time_mins: item.preparation_time_mins || 15,
      image_url: item.image_url || "",
      sizes: item.sizes || [],
      toppings: item.toppings || [],
      customizations: item.customizations || []
    });
    setShowForm(true);
  };

  const toggleOption = (type, option) => {
    const existing = formData[type].find(c => c.name === option.name);
    if (existing) {
      setFormData(f => ({
        ...f,
        [type]: f[type].filter(c => c.name !== option.name)
      }));
    } else {
      setFormData(f => ({
        ...f,
        [type]: [...f[type], option]
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }
    saveMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      offer_price: formData.offer_price ? parseFloat(formData.offer_price) : null,
      preparation_time_mins: parseInt(formData.preparation_time_mins)
    });
  };

  // Group by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const filteredCategories = selectedCategory === "all" 
    ? Object.keys(itemsByCategory) 
    : [selectedCategory];

  if (isAuthLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-gray-500">{menuItems.length} items</p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Menu Items */}
        {isLoading ? (
          <div className="space-y-8">
            {[1,2].map(i => (
              <div key={i}>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3].map(j => <Skeleton key={j} className="h-40 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : menuItems.length > 0 ? (
          <div className="space-y-8">
            {filteredCategories.map(category => {
              const items = itemsByCategory[category]?.filter(item =>
                searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
              );
              if (!items?.length) return null;

              return (
                <div key={category}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {category}
                    <Badge variant="outline">{items.length}</Badge>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map(item => (
                      <div 
                        key={item.id}
                        className={cn(
                          "bg-white rounded-xl p-4 shadow-sm border-2 transition-all",
                          !item.is_available && "opacity-60",
                          "hover:shadow-md"
                        )}
                      >
                        <div className="flex gap-4">
                          {/* Image */}
                          <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {item.is_vegetarian ? (
                                    <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
                                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center">
                                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                                    </div>
                                  )}
                                  <h3 className="font-semibold truncate">{item.name}</h3>
                                </div>
                                <p className="text-lg font-bold text-[#F25C23]">₹{item.price}</p>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(item)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => toggleAvailability.mutate({ id: item.id, is_available: !item.is_available })}
                                  >
                                    {item.is_available ? (
                                      <>
                                        <EyeOff className="w-4 h-4 mr-2" />
                                        Mark Unavailable
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Mark Available
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => deleteMutation.mutate(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {item.is_bestseller && (
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Bestseller
                                </Badge>
                              )}
                              {item.is_recommended && (
                                <Badge className="bg-amber-100 text-amber-700 text-xs">
                                  👨‍🍳 Recommended
                                </Badge>
                              )}
                              {item.is_special_offer && (
                                <Badge className="bg-red-100 text-red-700 text-xs">
                                  🏷️ {item.offer_label || 'Offer'}
                                </Badge>
                              )}
                              {!item.is_available && (
                                <Badge variant="outline" className="text-xs">Unavailable</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No menu items yet</h3>
            <p className="text-gray-500 mb-6">Start adding your delicious dishes</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Butter Chicken"
                className="mt-1 rounded-xl"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the dish"
                className="mt-1 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
                  placeholder="299"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Spice Level</Label>
                <Select 
                  value={formData.spice_level} 
                  onValueChange={(v) => setFormData(f => ({ ...f, spice_level: v }))}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {spiceLevels.map(level => (
                      <SelectItem key={level} value={level} className="capitalize">
                        {level.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prep Time (mins)</Label>
                <Input
                  type="number"
                  value={formData.preparation_time_mins}
                  onChange={(e) => setFormData(f => ({ ...f, preparation_time_mins: e.target.value }))}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
                className="mt-1 rounded-xl"
              />
            </div>

            {/* Size Options */}
            <div className="pt-4 border-t">
              <Label className="mb-2 block">Size Variations</Label>
              <p className="text-sm text-gray-500 mb-3">Add different sizes with price adjustments</p>
              <div className="flex flex-wrap gap-2">
                {defaultSizes.map(size => (
                  <button
                    key={size.name}
                    type="button"
                    onClick={() => toggleOption('sizes', size)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-sm transition-all",
                      formData.sizes.some(s => s.name === size.name)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-200 hover:border-blue-500"
                    )}
                  >
                    {size.name} {size.price > 0 && `(+₹${size.price})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Topping Options */}
            <div className="pt-4 border-t">
              <Label className="mb-2 block">Toppings / Add-ons</Label>
              <p className="text-sm text-gray-500 mb-3">Available toppings customers can add</p>
              <div className="flex flex-wrap gap-2">
                {defaultToppings.map(topping => (
                  <button
                    key={topping.name}
                    type="button"
                    onClick={() => toggleOption('toppings', topping)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-sm transition-all",
                      formData.toppings.some(t => t.name === topping.name)
                        ? "bg-green-500 text-white border-green-500"
                        : "border-gray-200 hover:border-green-500"
                    )}
                  >
                    {topping.name} (+₹{topping.price})
                  </button>
                ))}
              </div>
            </div>

            {/* Other Customizations */}
            <div className="pt-4 border-t">
              <Label className="mb-2 block">Other Customizations</Label>
              <p className="text-sm text-gray-500 mb-3">Spice preferences and special requests</p>
              <div className="flex flex-wrap gap-2">
                {defaultCustomizations.map(custom => (
                  <button
                    key={custom.name}
                    type="button"
                    onClick={() => toggleOption('customizations', custom)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-sm transition-all",
                      formData.customizations.some(c => c.name === custom.name)
                        ? "bg-[#F25C23] text-white border-[#F25C23]"
                        : "border-gray-200 hover:border-[#F25C23]"
                    )}
                  >
                    {custom.name} {custom.price > 0 && `(+₹${custom.price})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <label className="flex items-center justify-between">
                <span>Vegetarian</span>
                <Switch
                  checked={formData.is_vegetarian}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_vegetarian: v }))}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Mark as Bestseller</span>
                <Switch
                  checked={formData.is_bestseller}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_bestseller: v }))}
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  Chef's Recommendation
                </span>
                <Switch
                  checked={formData.is_recommended}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_recommended: v }))}
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Special Offer
                </span>
                <Switch
                  checked={formData.is_special_offer}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_special_offer: v }))}
                />
              </label>
              {formData.is_special_offer && (
                <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-red-200">
                  <div>
                    <Label className="text-xs">Offer Price</Label>
                    <Input
                      type="number"
                      value={formData.offer_price || ""}
                      onChange={(e) => setFormData(f => ({ ...f, offer_price: e.target.value }))}
                      placeholder="₹199"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Offer Label</Label>
                    <Input
                      value={formData.offer_label || ""}
                      onChange={(e) => setFormData(f => ({ ...f, offer_label: e.target.value }))}
                      placeholder="20% OFF"
                      className="mt-1 rounded-lg"
                    />
                  </div>
                </div>
              )}
              <label className="flex items-center justify-between">
                <span>Available for ordering</span>
                <Switch
                  checked={formData.is_available}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_available: v }))}
                />
              </label>
            </div>
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
              {saveMutation.isPending ? "Saving..." : (editingItem ? "Update Item" : "Add Item")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}