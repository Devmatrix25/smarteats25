import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Camera, Upload, X, Loader2, Sparkles, ArrowLeft,
  Star, Clock, ChevronRight, ImageIcon, Utensils
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
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
      // Upload image first
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedImage });

      // Get restaurant and menu context
      const menuContext = menuItems.slice(0, 50).map(m => `${m.name} (₹${m.price}, ${m.category || 'Food'})`).join("; ");
      const restaurantContext = restaurants.map(r => `${r.name}: ${r.cuisine_type?.join(", ")}`).join("; ");

      // Analyze with AI
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this food image and identify what dish/food it is.

Available menu items in our platform: ${menuContext}

Available restaurants: ${restaurantContext}

Based on the image:
1. Identify the dish name (be specific, e.g., "Butter Chicken", "Margherita Pizza", "Veg Biryani")
2. Describe the dish briefly
3. Suggest 3-5 similar dishes from our menu
4. Recommend restaurants that might serve this type of food

Be accurate and helpful. If you can't identify the food clearly, make your best guess based on visual cues.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            identified_dish: { type: "string", description: "Name of the identified dish" },
            description: { type: "string", description: "Brief description of the dish" },
            cuisine_type: { type: "string", description: "Type of cuisine (Indian, Chinese, Italian, etc.)" },
            similar_dishes: { 
              type: "array", 
              items: { type: "string" },
              description: "Similar dish names from our menu"
            },
            recommended_restaurants: {
              type: "array",
              items: { type: "string" },
              description: "Restaurant names that serve this type of food"
            },
            confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence level" }
          }
        }
      });

      // Match results with actual data
      const matchedDishes = menuItems.filter(item => 
        analysis.similar_dishes?.some(dish => 
          item.name.toLowerCase().includes(dish.toLowerCase()) ||
          dish.toLowerCase().includes(item.name.toLowerCase())
        ) ||
        item.name.toLowerCase().includes(analysis.identified_dish?.toLowerCase()) ||
        item.category?.toLowerCase().includes(analysis.cuisine_type?.toLowerCase())
      ).slice(0, 6);

      const matchedRestaurants = restaurants.filter(r =>
        analysis.recommended_restaurants?.some(name =>
          r.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(r.name.toLowerCase())
        ) ||
        r.cuisine_type?.some(c => c.toLowerCase().includes(analysis.cuisine_type?.toLowerCase()))
      ).slice(0, 4);

      setResults({
        ...analysis,
        matchedDishes,
        matchedRestaurants
      });
    } catch (e) {
      console.error(e);
      setError("Failed to analyze image. Please try again.");
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0a1e] via-[#1a1033] to-[#0d0620]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a1033] to-[#0d0620] relative overflow-hidden">
      {/* Magical background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            to={createPageUrl("Home")}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 text-transparent bg-clip-text">
                ✨ Flavor Lens
              </span>
              <div className="relative">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                <Sparkles className="w-5 h-5 text-yellow-400 absolute inset-0 animate-ping opacity-50" />
              </div>
            </h1>
            <p className="text-sm text-purple-200/70">AI-powered food discovery magic</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Upload Section */}
        <div 
          className={cn(
            "relative rounded-3xl p-8 text-center transition-all overflow-hidden",
            imagePreview 
              ? "bg-white/10 backdrop-blur-xl border border-purple-500/50" 
              : "bg-white/5 backdrop-blur-xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-3xl" />
          
          {imagePreview ? (
            <div className="relative z-10">
              <div className="relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Selected food" 
                  className="max-h-80 mx-auto rounded-2xl shadow-2xl shadow-purple-500/30 border-2 border-white/20"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl blur opacity-30 -z-10" />
              </div>
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors backdrop-blur-sm border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="py-12 relative z-10">
              {/* Magical camera icon */}
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl animate-pulse" />
                <div className="absolute inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce" />
                </div>
                {/* Orbiting sparkles */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
                  <div className="absolute -top-3 left-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
                  <div className="absolute top-1/2 -right-3 w-2 h-2 bg-pink-400 rounded-full" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-2 text-white">
                Upload Your Food Photo
              </h3>
              <p className="text-purple-200/70 mb-8 max-w-md mx-auto">
                Our AI will magically identify any dish and find similar items near you
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white rounded-xl h-14 px-8 text-lg font-semibold shadow-lg shadow-purple-500/30 group"
                >
                  <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Browse Files
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl h-14 px-8 text-lg border-purple-500/50 text-purple-200 hover:bg-purple-500/20 hover:text-white"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Take Photo
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
              className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white rounded-2xl h-16 px-12 text-lg font-bold shadow-xl shadow-purple-500/40 overflow-hidden group"
            >
              {isAnalyzing ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 animate-gradient-x" />
                  <span className="relative flex items-center">
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    AI Magic in Progress...
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex items-center">
                    <span className="mr-3 text-2xl">🔮</span>
                    Discover This Dish
                    <Sparkles className="w-5 h-5 ml-3 group-hover:rotate-12 transition-transform" />
                  </span>
                </>
              )}
            </Button>
            <style>{`
              @keyframes gradient-x {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .animate-gradient-x { animation: gradient-x 1.5s ease infinite; }
            `}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-8 space-y-8">
            {/* Identified Dish - Magical reveal */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
              <div className="relative flex items-start gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl animate-pulse" />
                  <div className="absolute inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Utensils className="w-10 h-10 text-white" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <Badge className={cn(
                    "mb-2",
                    results.confidence === 'high' ? "bg-green-500/20 text-green-300 border-green-500/30" :
                    results.confidence === 'medium' ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                    "bg-gray-500/20 text-gray-300 border-gray-500/30"
                  )}>
                    ✨ {results.confidence} confidence
                  </Badge>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {results.identified_dish}
                  </h2>
                  <p className="text-purple-200/80 mb-3">{results.description}</p>
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    🍽️ {results.cuisine_type} Cuisine
                  </Badge>
                </div>
              </div>
            </div>

            {/* Similar Dishes */}
            {results.matchedDishes?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  Similar Dishes Available
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {results.matchedDishes.map((item) => {
                    const restaurant = restaurants.find(r => r.id === item.restaurant_id);
                    return (
                      <Link
                        key={item.id}
                        to={`${createPageUrl("Restaurant")}?id=${item.restaurant_id}`}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 hover:bg-white/20 transition-all group"
                      >
                        <div className="aspect-square relative overflow-hidden">
                          <img 
                            src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {item.is_vegetarian && (
                            <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded border-2 border-green-600 flex items-center justify-center">
                              <div className="w-2 h-2 bg-green-600 rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-sm truncate text-white">{item.name}</h4>
                          <p className="text-xs text-purple-300/70 truncate">{restaurant?.name}</p>
                          <p className="text-[#F25C23] font-bold mt-1">₹{item.price}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Restaurants */}
            {results.matchedRestaurants?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Star className="w-6 h-6 text-yellow-400" />
                  Restaurants Serving This Cuisine
                </h3>
                <div className="space-y-3">
                  {results.matchedRestaurants.map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      to={`${createPageUrl("Restaurant")}?id=${restaurant.id}`}
                      className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-purple-500/50 hover:bg-white/20 transition-all group"
                    >
                      <img 
                        src={restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80"}
                        alt={restaurant.name}
                        className="w-20 h-20 rounded-xl object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate text-white">{restaurant.name}</h4>
                        <p className="text-sm text-purple-300/70 truncate">
                          {restaurant.cuisine_type?.join(", ")}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs">
                            ⭐ {restaurant.average_rating?.toFixed(1) || "4.0"}
                          </Badge>
                          <span className="text-xs text-purple-300/70 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {restaurant.delivery_time_mins || 30} min
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Try Another */}
            <div className="text-center pt-4">
              <Button
                onClick={clearImage}
                className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <Camera className="w-4 h-4 mr-2" />
                Try Another Image
              </Button>
            </div>
          </div>
        )}

        {/* Tips */}
        {!imagePreview && (
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-6 text-center text-white flex items-center justify-center gap-2">
              <span>✨</span> Tips for Best Results <span>✨</span>
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: ImageIcon, title: "Clear Image", desc: "Use well-lit, focused photos", emoji: "📸" },
                { icon: Utensils, title: "Food Focus", desc: "Center the dish in frame", emoji: "🍽️" },
                { icon: Camera, title: "Close Up", desc: "Get closer for better detail", emoji: "🔍" }
              ].map((tip, idx) => (
                <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">{tip.emoji}</span>
                  </div>
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