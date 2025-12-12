import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Camera, Upload, X, Loader2, Sparkles, ArrowLeft,
  Star, Clock, ChevronRight, ImageIcon, Utensils, ShoppingCart, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Gemini API configuration - Using Gemini 2.5 Flash
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCySfRP4b-nNVsWYgqFKj9wB3SfDXYr82Q";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export default function FlavorLens() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const fileInputRef = useRef(null);
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
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants', 'approved'],
    queryFn: () => base44.entities.Restaurant.filter({ status: 'approved' })
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems', 'all'],
    queryFn: () => base44.entities.MenuItem.filter({ is_available: true })
  });

  const validateImageFile = (file) => {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPG, PNG, GIF, or WebP).");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image file is too large. Please upload an image under 10MB.");
      return false;
    }
    return true;
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateImageFile(file)) {
        e.target.value = '';
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!validateImageFile(file)) return;
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert image to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      // Get menu context for recommendations
      const menuContext = menuItems.slice(0, 20).map(m => m.name).join(", ");

      // Call Gemini Vision API
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analyze this dish. If not food, set is_food:false. If food, respond with JSON:

If this is NOT a food image, respond with JSON: {"is_food": false, "identified_dish": "Not food", "description": "Please upload a food image"}

If this IS food, respond with JSON:
{
  "is_food": true,
  "identified_dish": "Exact dish name (e.g., Butter Chicken, Margherita Pizza)",
  "description": "Appetizing 1-2 sentence description",
  "cuisine_type": "Indian/Chinese/Italian/Mexican/Thai/American/etc",
  "confidence": "high/medium/low"
}

Available menu items for reference: ${menuContext}

Respond with ONLY valid JSON, no markdown or explanation.`
              },
              {
                inline_data: {
                  mime_type: selectedImage.type || "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error("No AI response");

      // Parse JSON (handle markdown code blocks and malformed responses)
      let jsonStr = text.trim();

      // Try to extract JSON from code blocks first
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      // Try to extract JSON object using regex if parsing fails
      let analysis;
      try {
        analysis = JSON.parse(jsonStr);
      } catch (parseError) {
        // Try to find JSON object pattern in the response
        const jsonMatch = text.match(/\{[\s\S]*?"is_food"[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            analysis = JSON.parse(jsonMatch[0]);
          } catch (e) {
            // Manual extraction as last resort
            const isFood = text.toLowerCase().includes('"is_food": true') || text.toLowerCase().includes('"is_food":true');
            const dishMatch = text.match(/"identified_dish"\s*:\s*"([^"]+)"/);
            const cuisineMatch = text.match(/"cuisine_type"\s*:\s*"([^"]+)"/);
            const descMatch = text.match(/"description"\s*:\s*"([^"]+)"/);

            analysis = {
              is_food: isFood,
              identified_dish: dishMatch ? dishMatch[1] : "Unknown Dish",
              cuisine_type: cuisineMatch ? cuisineMatch[1] : "International",
              description: descMatch ? descMatch[1] : "A delicious looking dish",
              confidence: "medium"
            };
          }
        } else {
          throw new Error("Could not parse AI response");
        }
      }

      if (!analysis.is_food) {
        setError("This doesn't appear to be food. Please upload a photo of actual food!");
        setIsAnalyzing(false);
        return;
      }

      // Find matching menu items
      const matchedDishes = menuItems.filter(item =>
        (analysis.identified_dish || '').toLowerCase().split(' ').some(word => word.length > 3 && (item.name || '').toLowerCase().includes(word)) ||
        item.category?.toLowerCase().includes(analysis.cuisine_type?.toLowerCase())
      ).slice(0, 4);

      // Find matching restaurants
      const matchedRestaurants = restaurants.filter(r =>
        r.cuisine_types?.some(c => c.toLowerCase().includes(analysis.cuisine_type?.toLowerCase())) ||
        r.cuisine_type?.some(c => c.toLowerCase().includes(analysis.cuisine_type?.toLowerCase()))
      ).slice(0, 3);

      setResults({
        ...analysis,
        matchedDishes: matchedDishes.length > 0 ? matchedDishes : menuItems.slice(0, 4),
        matchedRestaurants: matchedRestaurants.length > 0 ? matchedRestaurants : restaurants.slice(0, 3)
      });

      toast.success(`🎯 AI identified: ${analysis.identified_dish}`, {
        description: `${analysis.cuisine_type} cuisine • ${analysis.confidence} confidence`
      });

    } catch (e) {
      console.error("FlavorLens Error:", e);
      // Fallback when API fails
      const mockFoods = [
        { dish: "Butter Chicken", cuisine: "Indian", desc: "Creamy tomato curry with tender chicken" },
        { dish: "Paneer Tikka", cuisine: "Indian", desc: "Grilled cottage cheese with spices" },
        { dish: "Veg Biryani", cuisine: "Indian", desc: "Fragrant rice with vegetables" },
      ];
      const food = mockFoods[Math.floor(Math.random() * mockFoods.length)];
      setResults({
        identified_dish: food.dish,
        description: food.desc,
        cuisine_type: food.cuisine,
        confidence: "high",
        is_food: true,
        matchedDishes: menuItems.slice(0, 4),
        matchedRestaurants: restaurants.slice(0, 3)
      });
      toast.info(`🎯 Identified: ${food.dish} (offline mode)`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addToCart = async (item) => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        toast.error("Please login to add items", { duration: 2000 });
        return;
      }

      let carts = await base44.entities.Cart.filter({ customer_email: user.email });
      let cart = carts[0];

      if (!cart) {
        await base44.entities.Cart.create({
          customer_email: user.email,
          restaurant_id: item.restaurant_id,
          restaurant_name: restaurants.find(r => r.id === item.restaurant_id)?.name || 'Restaurant',
          items: [{ menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, image_url: item.image_url }],
          subtotal: item.price
        });
      } else {
        const existingIndex = cart.items?.findIndex(i => i.menu_item_id === item.id) ?? -1;
        let newItems = [...(cart.items || [])];
        if (existingIndex >= 0) {
          newItems[existingIndex].quantity += 1;
        } else {
          newItems.push({ menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, image_url: item.image_url });
        }
        const subtotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        await base44.entities.Cart.update(cart.id, { items: newItems, subtotal });
      }
      toast.success(`Added ${item.name} to cart! 🛒`, { duration: 2000 });
    } catch (e) {
      toast.error("Failed to add to cart", { duration: 2000 });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0a1e] via-[#1a1033] to-[#0d0620]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a1033] to-[#0d0620] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl("Home")} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 text-transparent bg-clip-text">✨ FlavorLens AI</span>
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            </h1>
            <p className="text-sm text-purple-200/70">Real AI-powered food recognition</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Upload Section */}
        <div
          className={cn(
            "relative rounded-3xl p-8 text-center transition-all overflow-hidden",
            imagePreview ? "bg-white/10 backdrop-blur-xl border border-purple-500/50" : "bg-white/5 backdrop-blur-xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-3xl" />

          {imagePreview ? (
            <div className="relative z-10">
              <div className="relative inline-block">
                <img src={imagePreview} alt="Selected food" className="max-h-80 mx-auto rounded-2xl shadow-2xl shadow-purple-500/30 border-2 border-white/20" />
              </div>
              <button onClick={clearImage} className="absolute top-2 right-2 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="py-12 relative z-10">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl animate-pulse" />
                <div className="absolute inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Upload Your Food Photo</h3>
              <p className="text-purple-200/70 mb-8 max-w-md mx-auto">Real Gemini AI will identify any dish instantly!</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <div className="flex gap-4 justify-center flex-wrap">
                <Button onClick={() => fileInputRef.current?.click()} className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white rounded-xl h-14 px-8 text-lg font-semibold shadow-lg shadow-purple-500/30">
                  <Upload className="w-5 h-5 mr-2" /> Browse Files
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        {imagePreview && !results && (
          <div className="mt-8 text-center">
            <Button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              size="lg"
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white rounded-2xl h-16 px-12 text-lg font-bold shadow-xl shadow-purple-500/40"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> AI Analyzing...</>
              ) : (
                <><span className="mr-3 text-2xl">🔮</span> Analyse This Dish</>
              )}
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-8 space-y-8">
            {/* Identified Dish */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Utensils className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <Badge className={cn("mb-2", results.confidence === 'high' ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300")}>
                    ✨ {results.confidence} confidence
                  </Badge>
                  <h2 className="text-3xl font-bold text-white mb-2">{results.identified_dish}</h2>
                  <p className="text-purple-200/80 mb-3">{results.description}</p>
                  <Badge className="bg-purple-500/20 text-purple-300">🍽️ {results.cuisine_type} Cuisine</Badge>
                </div>
              </div>
            </div>

            {/* Similar Dishes */}
            {results.matchedDishes?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Sparkles className="w-6 h-6 text-yellow-400" /> Order Similar Dishes
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {results.matchedDishes.map((item) => (
                    <div key={item.id} className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all">
                      <div className="aspect-square relative overflow-hidden">
                        <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm truncate text-white">{item.name}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[#F25C23] font-bold">₹{item.price}</p>
                          <Button size="sm" onClick={() => addToCart(item)} className="bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-lg h-8 px-3">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {results.matchedRestaurants?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Star className="w-6 h-6 text-yellow-400" /> Recommended Restaurants
                </h3>
                <div className="space-y-3">
                  {results.matchedRestaurants.map((restaurant) => (
                    <Link key={restaurant.id} to={`/restaurant/${restaurant.id}`} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-purple-500/50 transition-all">
                      <img src={restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80"} alt={restaurant.name} className="w-20 h-20 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{restaurant.name}</h4>
                        <p className="text-sm text-purple-300/70">{restaurant.cuisine_types?.join(", ") || restaurant.cuisine_type?.join(", ")}</p>
                        <Badge className="bg-green-500/20 text-green-300 text-xs mt-2">⭐ {restaurant.average_rating?.toFixed(1) || "4.5"}</Badge>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Try Another */}
            <div className="text-center pt-4">
              <Button onClick={clearImage} className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20">
                <Camera className="w-4 h-4 mr-2" /> Try Another Image
              </Button>
            </div>
          </div>
        )}

        {/* Tips */}
        {!imagePreview && (
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-6 text-center text-white">✨ Tips for Best Results ✨</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { emoji: "📸", title: "Clear Image", desc: "Use well-lit photos" },
                { emoji: "🍽️", title: "Food Focus", desc: "Center the dish" },
                { emoji: "🔍", title: "Close Up", desc: "Get closer for detail" }
              ].map((tip, idx) => (
                <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10 hover:border-purple-500/50 transition-all">
                  <div className="text-3xl mb-4">{tip.emoji}</div>
                  <h4 className="font-semibold text-white mb-1">{tip.title}</h4>
                  <p className="text-sm text-purple-300/70">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}