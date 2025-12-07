import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  MessageCircle, X, Send, Sparkles, Loader2, 
  ChevronDown, Bot, User, Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! 👋 I'm your SmartEats AI assistant. I can help you find restaurants, recommend dishes, or answer any questions about your orders. What are you craving today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setRecommendations([]);

    try {
      // Get user context
      let userContext = "";
      try {
        const user = await base44.auth.me();
        const orders = await base44.entities.Order.filter({ customer_email: user.email }, '-created_date', 5);
        if (orders.length > 0) {
          const recentRestaurants = [...new Set(orders.map(o => o.restaurant_name))].join(", ");
          userContext = `User's recent orders from: ${recentRestaurants}. `;
        }
      } catch (e) {
        // Not logged in
      }

      // Get restaurants for context
      const restaurants = await base44.entities.Restaurant.filter({ status: 'approved' });
      const restaurantContext = restaurants.map(r => `${r.name} (${r.cuisine_type?.join(", ")}, Rating: ${r.average_rating})`).join("; ");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are SmartEats AI assistant - a friendly, helpful food delivery assistant for Bangalore, India.

Available restaurants: ${restaurantContext}

${userContext}

User query: "${userMessage}"

Respond naturally and helpfully. If recommending restaurants, include specific ones from the available list. Keep responses concise and friendly. Use emojis sparingly. Format any lists nicely.

If the user asks about ordering or tracking, explain that they can browse restaurants on the app, add items to cart, and track orders in real-time.

If you recommend specific restaurants, include them in your response naturally.`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string", description: "The assistant's response to the user" },
            recommended_restaurants: { 
              type: "array", 
              items: { type: "string" },
              description: "Names of recommended restaurants if any"
            }
          }
        }
      });

      const assistantResponse = response.response || "I'm sorry, I couldn't process that request. Please try again!";
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: assistantResponse
      }]);

      // Set restaurant recommendations if any
      if (response.recommended_restaurants?.length > 0) {
        const matchedRestaurants = restaurants.filter(r => 
          response.recommended_restaurants.some(name => 
            r.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(r.name.toLowerCase())
          )
        );
        setRecommendations(matchedRestaurants);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Oops! Something went wrong. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-28 right-4 md:bottom-8 md:right-8 z-50",
          "w-14 h-14 bg-gradient-to-br from-[#F25C23] to-[#D94A18] rounded-full",
          "flex items-center justify-center shadow-lg shadow-orange-200/50",
          "hover:scale-110 transition-transform",
          isOpen && "hidden"
        )}
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed z-50",
          "bottom-0 right-0 left-0 h-[85vh]",
          "md:bottom-8 md:right-8 md:left-auto md:h-[600px] md:w-[400px]",
          "bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col",
          "border border-gray-200"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#F25C23] to-[#D94A18] rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <p className="font-semibold">SmartEats AI</p>
                <p className="text-xs text-white/70">Your food assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-[#F25C23]" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl",
                  msg.role === "user" 
                    ? "bg-[#F25C23] text-white rounded-br-md" 
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                )}>
                  <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-p:my-1">
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Recommended for you:</p>
                {recommendations.map(rest => (
                  <Link 
                    key={rest.id}
                    to={`${createPageUrl("Restaurant")}?id=${rest.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    <img 
                      src={rest.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&q=80"}
                      alt={rest.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{rest.name}</p>
                      <p className="text-xs text-gray-500">{rest.cuisine_type?.slice(0, 2).join(", ")}</p>
                    </div>
                    <Badge className="bg-[#3BA55D] text-white text-xs">
                      ⭐ {rest.average_rating?.toFixed(1)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#F25C23]" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-md p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[#F25C23]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {["🍕 Best pizza nearby", "🍛 Recommend biryani", "🍰 Desserts under ₹200"].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(suggestion);
                }}
                className="flex-shrink-0 px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything about food..."
                className="rounded-full"
              />
              <Button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="rounded-full bg-[#F25C23] hover:bg-[#D94A18] w-10 h-10 p-0"
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