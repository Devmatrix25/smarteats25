import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Clock, MapPin, ChevronLeft, ChevronRight,
  Plus, Minus, Search, Flame, ShoppingCart, ChefHat, Heart, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


export default function Restaurant() {
  const { id: urlParamId } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const queryStringId = urlParams.get('id');
  const restaurantId = urlParamId || queryStringId;
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState({ items: [], restaurant_id: null });
  const [user, setUser] = useState(null);
  const [customizeItem, setCustomizeItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
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
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurantId }),
    enabled: !!restaurantId
  });

  const categories = [...new Set(menuItems.map(item => item.category || 'Main Course'))];
  const filteredItems = searchQuery
    ? menuItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : menuItems;

  const openCustomization = (item) => {
    if (!user) {
      toast.error("Please login first", { duration: 2000 });
      return;
    }
    if ((item.sizes && item.sizes.length > 0) || (item.toppings && item.toppings.length > 0)) {
      setCustomizeItem(item);
      setSelectedSize(item.sizes?.[0] || null);
      setSelectedToppings([]);
    } else {
      addToCart(item);
    }
  };

  const addToCart = async (item, customizations = null) => {
    if (!user) {
      toast.error("Please login first", { duration: 2000 });
      return;
    }
    if (cart.restaurant_id && cart.restaurant_id !== restaurantId && cart.items?.length > 0) {
      const confirm = window.confirm("Your cart contains items from another restaurant. Clear cart and add this item?");
      if (!confirm) return;
    }

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
    }

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
        toppings: customizations?.toppings?.map(t => t.name)
      }];
    }

    const subtotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const cartData = {
      customer_email: user.email,
      restaurant_id: restaurantId,
      restaurant_name: restaurant?.name || 'Restaurant',
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
      toast.success(`Added ${item.name} to cart! 🛒`, { duration: 2000 });
    } catch (e) {
      toast.error("Failed to add item", { duration: 2000 });
    }
  };

  const handleAddCustomizedItem = () => {
    if (!customizeItem) return;
    addToCart(customizeItem, { size: selectedSize, toppings: selectedToppings });
  };

  const calculateCustomizedPrice = () => {
    if (!customizeItem) return 0;
    let price = customizeItem.price;
    if (selectedSize) price += selectedSize.price || 0;
    selectedToppings.forEach(t => price += t.price || 0);
    return price;
  };

  const updateQuantity = async (index, delta) => {
    let newItems = [...cart.items];
    newItems[index].quantity += delta;
    if (newItems[index].quantity <= 0) {
      newItems.splice(index, 1);
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
    return cart.items?.filter(i => i.menu_item_id === itemId).reduce((acc, i) => acc + i.quantity, 0) || 0;
  };

  const cartTotal = cart.items?.reduce((acc, i) => acc + (i.price * i.quantity), 0) || 0;
  const cartItemCount = cart.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;

  if (isAuthLoading || restaurantLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full rounded-2xl mb-6" />
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
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
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Premium Animated Hero Banner */}
      <motion.div
        className="relative h-64 md:h-80 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.img
          src={restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Floating Sparkles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{ left: `${20 + i * 15}%`, top: `${30 + Math.sin(i) * 20}%` }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        <Link to={createPageUrl("Home")} className="absolute top-4 left-4 z-10">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button variant="ghost" size="icon" className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>
        </Link>

        {/* Favorite Button */}
        <motion.button
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" />
        </motion.button>

        <motion.div
          className="absolute bottom-0 left-0 right-0 p-6 text-white"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1
            className="text-2xl md:text-3xl font-bold mb-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {restaurant.name}
          </motion.h1>
          <motion.p
            className="text-white/80 mb-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {restaurant.cuisine_type?.join(", ")}
          </motion.p>
          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 rounded-xl shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <Star className="w-4 h-4 fill-white" />
              <span className="font-bold">{restaurant.average_rating?.toFixed(1) || "4.2"}</span>
              <Sparkles className="w-3 h-3 ml-1" />
            </motion.div>
            <motion.div
              className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl"
              whileHover={{ backgroundColor: "rgba(255,255,255,0.3)" }}
            >
              <Clock className="w-4 h-4" />
              <span>{restaurant.delivery_time || "30-40"} mins</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl"
              whileHover={{ backgroundColor: "rgba(255,255,255,0.3)" }}
            >
              <MapPin className="w-4 h-4" />
              <span>{restaurant.distance || "2.5"} km</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu */}
          <div className="flex-1">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-white"
              />
            </div>

            {categories.length > 0 && (
              <Tabs defaultValue={categories[0]} className="mb-6">
                <TabsList className="bg-white p-1 rounded-xl overflow-x-auto flex-nowrap w-full justify-start">
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="rounded-lg data-[state=active]:bg-[#F25C23] data-[state=active]:text-white whitespace-nowrap">
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map(cat => (
                  <TabsContent key={cat} value={cat} className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredItems.filter(item => (item.category || 'Main Course') === cat).map(item => (
                        <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
                          <div className="flex gap-4">
                            <div className="relative flex-shrink-0">
                              <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80"} alt={item.name} className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover" />
                              {item.is_bestseller && (
                                <Badge className="absolute -top-2 -left-2 bg-[#F25C23]">
                                  <Flame className="w-3 h-3 mr-1" />Best
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={cn("w-4 h-4 border-2 rounded-sm flex items-center justify-center", item.is_veg ? "border-green-600" : "border-red-600")}>
                                  <div className={cn("w-2 h-2 rounded-full", item.is_veg ? "bg-green-600" : "bg-red-600")} />
                                </div>
                                <h3 className="font-semibold truncate">{item.name}</h3>
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-lg">₹{item.price}</span>
                                {getItemQuantity(item.id) > 0 ? (
                                  <div className="flex items-center gap-2 bg-[#F25C23] text-white rounded-lg px-2 py-1">
                                    <button onClick={() => { const idx = cart.items?.findIndex(i => i.menu_item_id === item.id); if (idx >= 0) updateQuantity(idx, -1); }} className="w-6 h-6 flex items-center justify-center">
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="font-bold min-w-[20px] text-center">{getItemQuantity(item.id)}</span>
                                    <button onClick={() => openCustomization(item)} className="w-6 h-6 flex items-center justify-center">
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <Button size="sm" onClick={() => openCustomization(item)} className="bg-white text-[#F25C23] border-2 border-[#F25C23] hover:bg-[#F25C23] hover:text-white rounded-lg">
                                    <Plus className="w-4 h-4 mr-1" />Add
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {menuItems.length === 0 && !menuLoading && (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No menu items yet</h3>
                <p className="text-gray-500">This restaurant hasn't added their menu yet.</p>
              </div>
            )}
          </div>

          {/* Desktop Cart Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-4">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />Your Cart
              </h3>
              {cart.items?.length > 0 ? (
                <>
                  <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                    {cart.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-sm text-gray-500">₹{item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(idx, -1)} className="p-1"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-medium min-w-[16px] text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(idx, 1)} className="p-1"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-4">
                      <span className="font-medium">Subtotal</span>
                      <span className="font-bold">₹{cartTotal}</span>
                    </div>
                    <Link to={createPageUrl("Cart")}>
                      <Button className="w-full bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">Checkout</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Add items to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Swiggy-style Floating Cart Bar */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out transform",
        cartItemCount > 0 ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="bg-gradient-to-t from-white via-white to-transparent pt-4 pb-4 px-4">
          <div className="max-w-7xl mx-auto">
            <Link to={createPageUrl("Cart")}>
              <div className="bg-[#F25C23] text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-orange-300/50 hover:bg-[#D94A18] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center relative">
                    <ShoppingCart className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#F25C23] rounded-full text-xs font-bold flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</p>
                    <p className="text-sm text-white/80">{restaurant?.name || 'Restaurant'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-2xl">₹{cartTotal}</p>
                    <p className="text-sm text-white/80">plus taxes</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Customization Dialog */}
      <Dialog open={!!customizeItem} onOpenChange={() => setCustomizeItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{customizeItem?.name}</DialogTitle>
          </DialogHeader>
          {customizeItem && (
            <div className="space-y-6 py-4">
              {customizeItem.sizes?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Size</h4>
                  <RadioGroup value={selectedSize?.name} onValueChange={(val) => setSelectedSize(customizeItem.sizes.find(s => s.name === val))}>
                    {customizeItem.sizes.map(size => (
                      <div key={size.name} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={size.name} id={size.name} />
                          <Label htmlFor={size.name}>{size.name}</Label>
                        </div>
                        {size.price > 0 && <span className="text-gray-500">+₹{size.price}</span>}
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              {customizeItem.toppings?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Add-ons</h4>
                  {customizeItem.toppings.map(topping => (
                    <div key={topping.name} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={topping.name}
                          checked={selectedToppings.some(t => t.name === topping.name)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedToppings([...selectedToppings, topping]);
                            else setSelectedToppings(selectedToppings.filter(t => t.name !== topping.name));
                          }}
                        />
                        <Label htmlFor={topping.name}>{topping.name}</Label>
                      </div>
                      <span className="text-gray-500">+₹{topping.price}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">₹{calculateCustomizedPrice()}</span>
                </div>
                <Button className="w-full bg-[#F25C23] hover:bg-[#D94A18] rounded-xl" onClick={handleAddCustomizedItem}>
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}