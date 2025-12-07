import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Star, Clock, MapPin, Heart, Share2, ChevronLeft, 
  Plus, Minus, Search, Leaf, Flame, Award, Info,
  ShoppingCart, X, Percent, ChefHat, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import SpecialItemsSection from "@/components/restaurant/SpecialItemsSection";
import ReviewsList from "@/components/reviews/ReviewsList";

export default function Restaurant() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState({ items: [], restaurant_id: null });
  const [user, setUser] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizeItem, setCustomizeItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState([]);
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
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
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

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => base44.entities.Restaurant.filter({ id: restaurantId }),
    select: (data) => data[0],
    enabled: !!restaurantId
  });

  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurantId, is_available: true }),
    enabled: !!restaurantId
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurant-reviews', restaurantId],
    queryFn: () => base44.entities.Review.filter({ restaurant_id: restaurantId }, '-created_date', 10),
    enabled: !!restaurantId
  });

  // Group menu items by category
  const categories = [...new Set(menuItems.map(item => item.category || 'Other'))];
  const filteredItems = searchQuery 
    ? menuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : menuItems;

  const openCustomization = (item) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    // If item has customizations, show dialog
    if ((item.sizes && item.sizes.length > 0) || (item.toppings && item.toppings.length > 0) || (item.customizations && item.customizations.length > 0)) {
      setCustomizeItem(item);
      setSelectedSize(item.sizes?.[0] || null);
      setSelectedToppings([]);
      setSelectedCustomizations([]);
    } else {
      addToCart(item);
    }
  };

  const addToCart = async (item, customizations = null) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    // Check if adding from different restaurant
    if (cart.restaurant_id && cart.restaurant_id !== restaurantId && cart.items?.length > 0) {
      const confirm = window.confirm("Your cart contains items from another restaurant. Clear cart and add this item?");
      if (!confirm) return;
    }

    // Calculate total price with customizations
    let itemPrice = item.price;
    let customizationDetails = [];
    
    if (customizations) {
      if (customizations.size) {
        itemPrice += customizations.size.price || 0;
        customizationDetails.push(`Size: ${customizations.size.name}`);
      }
      if (customizations.toppings?.length > 0) {
        customizations.toppings.forEach(t => {
          itemPrice += t.price || 0;
          customizationDetails.push(`+ ${t.name}`);
        });
      }
      if (customizations.customizations?.length > 0) {
        customizations.customizations.forEach(c => {
          itemPrice += c.price || 0;
          if (c.price > 0) customizationDetails.push(`+ ${c.name}`);
          else customizationDetails.push(c.name);
        });
      }
    }

    // Check if exact same item with same customizations exists
    const customKey = customizationDetails.sort().join('|');
    const existingIndex = cart.items?.findIndex(i => 
      i.menu_item_id === item.id && (i.customization_key || '') === customKey
    ) ?? -1;
    
    let newItems;
    
    if (existingIndex >= 0) {
      newItems = [...cart.items];
      newItems[existingIndex].quantity += 1;
    } else {
      newItems = [...(cart.items || []), {
        menu_item_id: item.id,
        name: item.name,
        price: itemPrice,
        base_price: item.price,
        quantity: 1,
        image_url: item.image_url,
        customization_key: customKey,
        customization_details: customizationDetails,
        size: customizations?.size?.name,
        toppings: customizations?.toppings?.map(t => t.name),
        other_customizations: customizations?.customizations?.map(c => c.name)
      }];
    }

    const subtotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const cartData = {
      customer_email: user.email,
      restaurant_id: restaurantId,
      restaurant_name: restaurant.name,
      items: newItems,
      subtotal
    };

    try {
      if (cart.id) {
        await base44.entities.Cart.update(cart.id, cartData);
      } else {
        const newCart = await base44.entities.Cart.create(cartData);
        cartData.id = newCart.id;
      }
      setCart({ ...cart, ...cartData });
      setCustomizeItem(null);
      toast.success(`Added ${item.name} to cart`);
    } catch (e) {
      toast.error("Failed to add item");
    }
  };

  const handleAddCustomizedItem = () => {
    if (!customizeItem) return;
    addToCart(customizeItem, {
      size: selectedSize,
      toppings: selectedToppings,
      customizations: selectedCustomizations
    });
  };

  const calculateCustomizedPrice = () => {
    if (!customizeItem) return 0;
    let price = customizeItem.price;
    if (selectedSize) price += selectedSize.price || 0;
    selectedToppings.forEach(t => price += t.price || 0);
    selectedCustomizations.forEach(c => price += c.price || 0);
    return price;
  };

  const updateQuantity = async (itemId, delta) => {
    const existingIndex = cart.items?.findIndex(i => i.menu_item_id === itemId);
    if (existingIndex < 0) return;

    let newItems = [...cart.items];
    newItems[existingIndex].quantity += delta;
    
    if (newItems[existingIndex].quantity <= 0) {
      newItems = newItems.filter(i => i.menu_item_id !== itemId);
    }

    const subtotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const cartData = { ...cart, items: newItems, subtotal };

    if (newItems.length === 0) {
      await base44.entities.Cart.delete(cart.id);
      setCart({ items: [], restaurant_id: null });
    } else {
      await base44.entities.Cart.update(cart.id, cartData);
      setCart(cartData);
    }
  };

  const getItemQuantity = (itemId) => {
    return cart.items?.find(i => i.menu_item_id === itemId)?.quantity || 0;
  };

  const cartTotal = cart.items?.reduce((acc, i) => acc + (i.price * i.quantity), 0) || 0;
  const cartItemCount = cart.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;

  if (isAuthLoading || restaurantLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full rounded-2xl mb-6" />
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Restaurant not found</h2>
        <Link to={createPageUrl("Home")}>
          <Button className="bg-[#F25C23] hover:bg-[#D94A18]">Go Back Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80">
        <img 
          src={restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <Link 
          to={createPageUrl("Home")}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all">
            <Heart className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Restaurant Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-white/80 mb-3">
              {restaurant.cuisine_type?.join(", ") || "Multi-cuisine"}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 bg-[#3BA55D] px-3 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-white" />
                <span className="font-bold">{restaurant.average_rating?.toFixed(1) || "4.2"}</span>
                <span className="text-white/80 text-sm">({restaurant.total_reviews || 500}+ ratings)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{restaurant.delivery_time_mins || 30} mins</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{restaurant.city || "Bangalore"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Info Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-500">Minimum Order</p>
              <p className="font-semibold">₹{restaurant.minimum_order || 200}</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-sm text-gray-500">Delivery Fee</p>
              <p className="font-semibold">₹{restaurant.delivery_fee || 30}</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-sm text-gray-500">Reviews</p>
              <p className="font-semibold">{reviews.length} reviews</p>
            </div>
          </div>
          {restaurant.is_open ? (
            <Badge className="bg-[#3BA55D]/10 text-[#3BA55D] border-[#3BA55D]/20">
              Open Now
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-600 border-red-200">
              Closed
            </Badge>
          )}
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Customer Reviews ({reviews.length})
            </h3>
            <ReviewsList reviews={reviews.slice(0, 3)} />
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-gray-200"
            />
          </div>
        </div>

        {/* Special Items Section - Recommended & Offers */}
        {menuItems.length > 0 && (
          <SpecialItemsSection 
            menuItems={menuItems}
            onAddToCart={openCustomization}
            getItemQuantity={getItemQuantity}
          />
        )}

        {/* Menu */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Categories Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl p-4 sticky top-20 shadow-sm">
              <h3 className="font-semibold mb-4">Menu Categories</h3>
              <div className="space-y-1">
                {categories.map((category, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-[#F25C23] transition-all"
                  >
                    {category}
                    <span className="text-gray-400 text-sm ml-2">
                      ({filteredItems.filter(i => (i.category || 'Other') === category).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-2">
            {menuLoading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="space-y-8">
                {categories.map(category => {
                  const categoryItems = filteredItems.filter(i => (i.category || 'Other') === category);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h3 className="text-xl font-bold mb-4 text-[#1D1D1F]">{category}</h3>
                      <div className="space-y-4">
                        {categoryItems.map(item => (
                          <div 
                            key={item.id}
                            className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 hover:shadow-md transition-all"
                          >
                            {/* Item Image */}
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                              <img 
                                src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80"}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                              {item.is_bestseller && (
                                <Badge className="absolute -top-2 -left-2 bg-[#FFC043] text-[#1D1D1F] border-0">
                                  <Award className="w-3 h-3 mr-1" />
                                  Bestseller
                                </Badge>
                              )}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    {item.is_vegetarian && (
                                      <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                                      </div>
                                    )}
                                    {!item.is_vegetarian && (
                                      <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                                      </div>
                                    )}
                                    <h4 className="font-semibold text-[#1D1D1F]">{item.name}</h4>
                                  </div>
                                  <p className="text-lg font-bold text-[#F25C23] mb-2">
                                    ₹{item.price}
                                  </p>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                {item.description || "Delicious dish prepared with fresh ingredients"}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {item.spice_level && (
                                    <Badge variant="outline" className="text-xs">
                                      <Flame className="w-3 h-3 mr-1 text-red-500" />
                                      {item.spice_level}
                                    </Badge>
                                  )}
                                </div>

                                {/* Add to Cart */}
                                {getItemQuantity(item.id) > 0 ? (
                                  <div className="flex items-center gap-2 bg-[#F25C23] rounded-xl">
                                    <button 
                                      onClick={() => updateQuantity(item.id, -1)}
                                      className="w-10 h-10 flex items-center justify-center text-white hover:bg-[#D94A18] rounded-l-xl transition-colors"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="text-white font-bold min-w-[24px] text-center">
                                      {getItemQuantity(item.id)}
                                    </span>
                                    <button 
                                      onClick={() => openCustomization(item)}
                                      className="w-10 h-10 flex items-center justify-center text-white hover:bg-[#D94A18] rounded-r-xl transition-colors"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <Button 
                                    onClick={() => openCustomization(item)}
                                    className="bg-white border-2 border-[#F25C23] text-[#F25C23] hover:bg-[#F25C23] hover:text-white rounded-xl"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {(item.sizes?.length > 0 || item.toppings?.length > 0) ? 'Customize' : 'Add'}
                                  </Button>
                                )}
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
              <div className="text-center py-16 bg-white rounded-2xl">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No dishes found</h3>
                <p className="text-gray-500">Try searching for something else</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-24 md:bottom-8 left-4 right-4 z-50">
          <div className="max-w-7xl mx-auto">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <button className="w-full bg-[#F25C23] text-white rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-orange-200/50 hover:bg-[#D94A18] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{cartItemCount} items</p>
                      <p className="text-sm text-white/80">{restaurant.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">₹{cartTotal}</p>
                    <p className="text-sm text-white/80">View Cart →</p>
                  </div>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="flex items-center justify-between">
                    <span>Your Cart</span>
                    <Badge variant="outline">{cartItemCount} items</Badge>
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4 overflow-y-auto max-h-[50vh]">
                  {cart.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <img 
                        src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-[#F25C23] font-bold">₹{item.price * item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white border rounded-xl">
                        <button 
                          onClick={() => updateQuantity(item.menu_item_id, -1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-l-xl"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold min-w-[24px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart({ id: item.menu_item_id, name: item.name, price: item.price, image_url: item.image_url })}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-r-xl"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span>₹{restaurant.delivery_fee || 30}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>₹{cartTotal + (restaurant.delivery_fee || 30)}</span>
                  </div>
                  <Link to={createPageUrl("Cart")}>
                    <Button className="w-full h-14 bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl text-lg font-semibold">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  </div>
                  </SheetContent>
                  </Sheet>
                  </div>
                  </div>
                  )}

                  {/* Customization Dialog */}
                  <Dialog open={!!customizeItem} onOpenChange={() => setCustomizeItem(null)}>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  {customizeItem && (
                  <>
                  <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                  <img 
                    src={customizeItem.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"}
                    alt={customizeItem.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <p>{customizeItem.name}</p>
                    <p className="text-[#F25C23] font-bold">₹{customizeItem.price}</p>
                  </div>
                  </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                  {/* Size Selection */}
                  {customizeItem.sizes && customizeItem.sizes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Choose Size</h4>
                    <RadioGroup 
                      value={selectedSize?.name} 
                      onValueChange={(v) => setSelectedSize(customizeItem.sizes.find(s => s.name === v))}
                    >
                      <div className="space-y-2">
                        {customizeItem.sizes.map(size => (
                          <div key={size.name} className="flex items-center justify-between p-3 border rounded-xl hover:border-[#F25C23] cursor-pointer">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={size.name} id={size.name} />
                              <Label htmlFor={size.name} className="cursor-pointer font-medium">
                                {size.name}
                              </Label>
                            </div>
                            <span className="text-gray-500">
                              {size.price > 0 ? `+₹${size.price}` : 'Base price'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  )}

                  {/* Toppings */}
                  {customizeItem.toppings && customizeItem.toppings.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Add Toppings</h4>
                    <div className="space-y-2">
                      {customizeItem.toppings.map(topping => (
                        <div key={topping.name} className="flex items-center justify-between p-3 border rounded-xl hover:border-green-500 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              id={topping.name}
                              checked={selectedToppings.some(t => t.name === topping.name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedToppings([...selectedToppings, topping]);
                                } else {
                                  setSelectedToppings(selectedToppings.filter(t => t.name !== topping.name));
                                }
                              }}
                            />
                            <Label htmlFor={topping.name} className="cursor-pointer">
                              {topping.name}
                            </Label>
                          </div>
                          <span className="text-green-600 font-medium">+₹{topping.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Other Customizations */}
                  {customizeItem.customizations && customizeItem.customizations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Preferences</h4>
                    <div className="space-y-2">
                      {customizeItem.customizations.map(custom => (
                        <div key={custom.name} className="flex items-center justify-between p-3 border rounded-xl hover:border-[#F25C23] cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              id={custom.name}
                              checked={selectedCustomizations.some(c => c.name === custom.name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCustomizations([...selectedCustomizations, custom]);
                                } else {
                                  setSelectedCustomizations(selectedCustomizations.filter(c => c.name !== custom.name));
                                }
                              }}
                            />
                            <Label htmlFor={custom.name} className="cursor-pointer">
                              {custom.name}
                            </Label>
                          </div>
                          {custom.price > 0 && (
                            <span className="text-[#F25C23] font-medium">+₹{custom.price}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                  </div>

                  {/* Footer with Total and Add Button */}
                  <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Item Total</span>
                  <span className="text-xl font-bold text-[#F25C23]">₹{calculateCustomizedPrice()}</span>
                  </div>
                  <Button 
                  onClick={handleAddCustomizedItem}
                  className="w-full h-12 bg-[#F25C23] hover:bg-[#D94A18] rounded-xl text-lg font-semibold"
                  >
                  Add to Cart
                  </Button>
                  </div>
                  </>
                  )}
                  </DialogContent>
                  </Dialog>
                  </div>
                  );
                  }