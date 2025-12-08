import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, Send, Sparkles, Loader2, Bot, User, Store, ShoppingCart, Plus, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Mistral API for Chat Assistant (NOT Gemini)
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || "dEUygL0Regq13V1p2md6SlUTznrdcUHc";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! 👋 I'm your SmartEats food assistant. I can help you find restaurants and recommend dishes from our menu. What are you craving today? ✨"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [menuRecommendations, setMenuRecommendations] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Smart response with dynamic menu search
  const getSmartResponse = (message, restaurants, menuItems) => {
    const lower = message.toLowerCase();
    let response = "";
    let matchedRestaurants = [];
    let matchedItems = [];

    // Extract food keywords from the message (remove common words)
    const stopWords = ['the', 'and', 'for', 'are', 'you', 'have', 'any', 'want', 'looking',
      'craving', 'need', 'get', 'give', 'show', 'find', 'what', 'which', 'where', 'how',
      'can', 'could', 'would', 'like', 'some', 'please', 'thanks', 'hello', 'hey', 'hi',
      'menu', 'food', 'dish', 'dishes', 'item', 'items', 'eat', 'order', 'want', 'give', 'me'];

    const foodKeywords = lower.split(/\s+/).filter(word =>
      word.length > 2 && !stopWords.includes(word)
    );

    // Search menu items by keyword match
    matchedItems = menuItems.filter(m => {
      const itemName = m.name.toLowerCase();
      const itemDesc = (m.description || '').toLowerCase();
      const itemCategory = (m.category || '').toLowerCase();
      return foodKeywords.some(keyword =>
        itemName.includes(keyword) || itemDesc.includes(keyword) || itemCategory.includes(keyword)
      );
    });

    // Search restaurants by cuisine type or name
    matchedRestaurants = restaurants.filter(r => {
      const cuisines = (r.cuisine_type || []).join(' ').toLowerCase();
      const name = r.name.toLowerCase();
      return foodKeywords.some(keyword =>
        cuisines.includes(keyword) || name.includes(keyword)
      );
    });

    // Generate appropriate response based on matches
    if (matchedItems.length > 0) {
      const itemNames = matchedItems.slice(0, 3).map(m => m.name).join(', ');
      response = `🍽️ Great choice! I found these dishes for you: **${itemNames}**. Would you like to order any of these?`;
    } else if (matchedRestaurants.length > 0) {
      const restoNames = matchedRestaurants.slice(0, 2).map(r => r.name).join(' and ');
      response = `🏪 I found **${restoNames}** that might have what you're looking for! Check out their menu.`;
    } else if (foodKeywords.length > 0) {
      // Item NOT found - polite "not available" message
      const searchTerm = foodKeywords.join(' ');
      response = `😔 Sorry! "${searchTerm}" is **not available** in our menu right now. We'll try to add it soon! 🙏\n\nIn the meantime, here are some popular dishes you might enjoy:`;

      // Show popular alternatives
      matchedItems = menuItems.filter(m => m.is_popular || m.is_featured).slice(0, 4);
      if (matchedItems.length === 0) matchedItems = menuItems.slice(0, 4);
      matchedRestaurants = restaurants.filter(r => r.is_featured).slice(0, 2);
      if (matchedRestaurants.length === 0) matchedRestaurants = restaurants.slice(0, 2);
    } else {
      // General greeting/query
      response = "👋 Welcome to SmartEats! What would you like to eat today?\n\nYou can ask me about:\n🍚 Biryani\n🍕 Pizza\n🍔 Burgers\n🥡 Chinese food\n🍰 Desserts\n\nOr just type any dish name!";
      matchedRestaurants = restaurants.filter(r => r.is_featured).slice(0, 3);
      matchedItems = menuItems.filter(m => m.is_popular).slice(0, 4);
      if (matchedItems.length === 0) matchedItems = menuItems.slice(0, 4);
    }

    return {
      response,
      matchedRestaurants: matchedRestaurants.slice(0, 3),
      matchedItems: matchedItems.slice(0, 4)
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setRecommendations([]);
    setMenuRecommendations([]);

    try {
      const restaurantsData = await base44.entities.Restaurant.filter({});
      const menuItemsData = await base44.entities.MenuItem.filter({});

      // Ensure arrays
      const restaurants = Array.isArray(restaurantsData) ? restaurantsData : [];
      const menuItems = Array.isArray(menuItemsData) ? menuItemsData : [];

      let aiResponse = null;

      // Use Mistral AI for chat (NOT Gemini - Gemini is for FlavorLens only)
      try {
        const menuList = menuItems.slice(0, 50).map(m => m.name).join(', ');
        const restaurantList = restaurants.map(r => r.name).join(', ');

        const systemPrompt = `You are SmartEats food delivery assistant. Be helpful, friendly and use emojis.

AVAILABLE MENU ITEMS: ${menuList}
AVAILABLE RESTAURANTS: ${restaurantList}

IMPORTANT RULES:
1. If user asks for a dish that IS in our menu → Show matching dishes with 🍽️ emoji
2. If user asks for dish NOT in our menu → Say "Sorry! [dish] is not available in our menu right now. We'll add it soon! 🙏" and suggest alternatives
3. If user asks about mutton/chicken/paneer dishes → Search and show ALL matching dishes from menu
4. Be concise (2-3 sentences max)
5. NEVER recommend items not in the menu list above

Respond ONLY with this JSON format:
{"response": "your message here", "found_in_menu": true/false, "recommended_dishes": ["dish names from menu"], "recommended_restaurants": ["restaurant names"]}`;

        const response = await fetch(MISTRAL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 512
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            let jsonStr = text;
            if (text.includes('```json')) jsonStr = text.split('```json')[1].split('```')[0].trim();
            else if (text.includes('```')) jsonStr = text.split('```')[1].split('```')[0].trim();
            aiResponse = JSON.parse(jsonStr);
          }
        }
      } catch (e) {
        console.log('Mistral AI unavailable, using smart fallback');
      }

      if (aiResponse && aiResponse.response) {
        setMessages(prev => [...prev, { role: "assistant", content: aiResponse.response }]);

        // Match restaurants from AI response
        if (aiResponse.recommended_restaurants?.length > 0) {
          const matched = restaurants.filter(r =>
            aiResponse.recommended_restaurants.some(name =>
              r.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(r.name.toLowerCase())
            )
          );
          setRecommendations(matched.slice(0, 3));
        }

        // Match dishes from AI response
        if (aiResponse.recommended_dishes?.length > 0) {
          const matched = menuItems.filter(m =>
            aiResponse.recommended_dishes.some(name =>
              m.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(m.name.toLowerCase())
            )
          );
          setMenuRecommendations(matched.slice(0, 4));
        }
      } else {
        // Fallback to smart local search
        const smart = getSmartResponse(userMessage, restaurants, menuItems);
        setMessages(prev => [...prev, { role: "assistant", content: smart.response }]);
        setRecommendations(smart.matchedRestaurants);
        setMenuRecommendations(smart.matchedItems);
      }

    } catch (e) {
      console.error('Error:', e);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again! 🍕"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (menuItem) => {
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
          restaurant_id: menuItem.restaurant_id,
          restaurant_name: 'Restaurant',
          items: [{ menu_item_id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1, image_url: menuItem.image_url }],
          subtotal: menuItem.price
        });
      } else {
        const existingIndex = cart.items?.findIndex(i => i.menu_item_id === menuItem.id) ?? -1;
        let newItems = [...(cart.items || [])];
        if (existingIndex >= 0) newItems[existingIndex].quantity += 1;
        else newItems.push({ menu_item_id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1, image_url: menuItem.image_url });
        const subtotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        await base44.entities.Cart.update(cart.id, { items: newItems, subtotal });
      }
      toast.success(`Added ${menuItem.name} to cart! 🛒`, { duration: 2000 });
    } catch (e) {
      toast.error("Failed to add to cart", { duration: 2000 });
    }
  };

  const quickSuggestions = ["Biryani 🍚", "Pizza 🍕", "Mutton dishes 🍖", "Chinese 🥡", "Desserts 🍰"];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-28 right-4 md:bottom-8 md:right-8 z-50",
          "w-16 h-16 bg-gradient-to-br from-[#F25C23] to-[#FF8A50] rounded-full",
          "flex items-center justify-center shadow-2xl shadow-[#F25C23]/30",
          "hover:scale-110 transition-all duration-300 group",
          isOpen && "hidden"
        )}
      >
        <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </span>
      </button>

      {isOpen && (
        <div className={cn(
          "fixed z-50",
          "bottom-0 right-0 left-0 h-[85vh]",
          "md:bottom-8 md:right-8 md:left-auto md:h-[600px] md:w-[400px]",
          "bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col",
          "border border-gray-200 overflow-hidden"
        )}>
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#F25C23] to-[#FF8A50]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <p className="font-bold flex items-center gap-1">
                  SmartEats Assistant
                  <Sparkles className="w-4 h-4 text-yellow-200" />
                </p>
                <p className="text-xs text-white/80">Ask me anything about food!</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-9 h-9 bg-gradient-to-br from-[#F25C23] to-[#FF8A50] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl shadow-sm",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-[#F25C23] to-[#FF8A50] text-white rounded-br-md"
                    : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                )}>
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-9 h-9 bg-gray-300 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#F25C23] font-semibold flex items-center gap-1">
                  <Store className="w-3 h-3" /> Recommended restaurants:
                </p>
                {recommendations.map(rest => (
                  <Link key={rest.id} to={`/restaurant/${rest.id}`} onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-orange-50 transition-colors border border-gray-100 shadow-sm">
                    <img src={rest.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&q=80"} alt={rest.name} className="w-14 h-14 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{rest.name}</p>
                      <p className="text-xs text-gray-500">{rest.cuisine_type?.slice(0, 2).join(", ")}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-xs">⭐ {rest.average_rating?.toFixed(1) || '4.2'}</Badge>
                  </Link>
                ))}
              </div>
            )}

            {menuRecommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#F25C23] font-semibold flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> Available dishes:
                </p>
                {menuRecommendations.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-sm font-bold text-[#F25C23]">₹{item.price}</p>
                    </div>
                    <Button size="sm" onClick={() => addToCart(item)} className="bg-[#F25C23] hover:bg-[#D94A18] rounded-lg">
                      <Plus className="w-4 h-4 mr-1" />Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-[#F25C23] to-[#FF8A50] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-[#F25C23]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-white border-t">
              {quickSuggestions.map((suggestion, idx) => (
                <button key={idx} onClick={() => { setInput(suggestion); }}
                  className="px-3 py-1.5 text-xs bg-orange-100 text-[#F25C23] rounded-full hover:bg-orange-200 whitespace-nowrap transition-colors font-medium">
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about food, restaurants..."
                className="flex-1 rounded-xl border-gray-200 focus:border-[#F25C23] focus:ring-[#F25C23]"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl w-12 h-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}