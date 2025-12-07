import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, MapPin, Clock, Star, ArrowRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${createPageUrl("Search")}?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(createPageUrl("Search"));
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF7F2] via-white to-[#FFF7F2]">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#F25C23]/10 to-[#FFC043]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#F25C23]/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F25C23]/10 rounded-full mb-6">
              <Clock className="w-4 h-4 text-[#F25C23]" />
              <span className="text-sm font-medium text-[#F25C23]">Delivery in 30 mins</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1D1D1F] leading-tight mb-6">
              Delicious Food,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F25C23] to-[#D94A18]">
                Delivered Fast
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Order from your favorite restaurants and get it delivered to your doorstep. 
              Fresh, hot, and on time — every single time.
            </p>

            {/* Search Bar */}
            <form 
              onSubmit={handleSearch}
              className="flex items-center gap-2 w-full max-w-lg p-2 bg-white rounded-2xl shadow-xl shadow-orange-100/50 border border-gray-100 hover:border-[#F25C23]/30 transition-all group"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl flex-1">
                <Search className="w-5 h-5 text-gray-400" />
                <Input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for restaurants or dishes..."
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-gray-400"
                />
              </div>
              <Link 
                to={createPageUrl("FlavorLens")}
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform"
                title="Flavor Lens - Search by Image"
              >
                <Camera className="w-5 h-5" />
              </Link>
              <Button 
                type="submit"
                className="bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl h-12 px-6 group-hover:scale-105 transition-transform"
              >
                <span className="hidden sm:inline mr-2">Search</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-10">
              {[
                { value: "500+", label: "Restaurants" },
                { value: "50K+", label: "Happy Customers" },
                { value: "30min", label: "Avg Delivery" },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Hero Image */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square">
              {/* Main Food Image */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
                  alt="Delicious food"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Floating Cards */}
              <div className="absolute -left-8 top-1/4 bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80"
                      alt="Burger"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Classic Burger</p>
                    <p className="text-[#F25C23] font-bold">₹249</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-1/4 bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 animate-float-delayed">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F25C23] to-[#FFC043] border-2 border-white" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#FFC043] text-[#FFC043]" />
                      <span className="font-bold">4.8</span>
                    </div>
                    <p className="text-xs text-gray-500">2.5k reviews</p>
                  </div>
                </div>
              </div>

              {/* Delivery Partner Badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#1D1D1F] text-white rounded-full px-6 py-3 flex items-center gap-3 shadow-xl">
                <div className="w-10 h-10 rounded-full bg-[#F25C23] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Live Tracking</p>
                  <p className="text-xs text-gray-400">Track your order in real-time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 3s ease-in-out infinite 0.5s;
        }
      `}</style>
    </section>
  );
}