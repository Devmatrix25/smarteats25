import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, Sparkles, Wand2, Stars } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FlavorLensBanner() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to={createPageUrl("FlavorLens")}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-1">
            {/* Inner content */}
            <div className="relative bg-gradient-to-r from-purple-900/90 via-pink-900/90 to-orange-900/90 rounded-[22px] p-6 md:p-8 overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-500" />
                
                {/* Floating stars */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      opacity: Math.random() * 0.7 + 0.3
                    }}
                  />
                ))}
              </div>

              <div className="relative flex flex-col md:flex-row items-center gap-6">
                {/* Icon */}
                <div className="relative">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                    <div className="relative">
                      <Camera className="w-12 h-12 md:w-16 md:h-16 text-white" />
                      <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
                    </div>
                  </div>
                  {/* Orbiting elements */}
                  <div className="absolute -inset-4 animate-spin-slow">
                    <Stars className="absolute top-0 left-1/2 w-4 h-4 text-yellow-300" />
                  </div>
                  <div className="absolute -inset-6 animate-spin-slower">
                    <Wand2 className="absolute bottom-0 right-0 w-4 h-4 text-pink-300" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white border border-white/20">
                      ✨ AI-Powered
                    </span>
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm rounded-full text-xs font-medium text-yellow-200 border border-yellow-400/30">
                      NEW
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Flavor Lens
                    <span className="inline-block ml-2 animate-bounce">🔮</span>
                  </h2>
                  <p className="text-white/80 text-sm md:text-base mb-4 max-w-md">
                    Snap a photo of any food and let our AI magic identify it instantly. 
                    Discover similar dishes and restaurants near you!
                  </p>
                  <Button 
                    className="bg-white text-purple-700 hover:bg-white/90 rounded-xl font-semibold shadow-lg shadow-purple-900/30 group"
                  >
                    <Camera className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Try Flavor Lens
                    <Sparkles className="w-4 h-4 ml-2 text-purple-500" />
                  </Button>
                </div>

                {/* Preview images */}
                <div className="hidden lg:flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&q=80" 
                      alt="Pizza"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-xl transform rotate-6 hover:rotate-0 transition-transform"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      ✓
                    </div>
                  </div>
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=150&q=80" 
                      alt="Biryani"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-white/30 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform"
                    />
                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-yellow-400 rounded-lg text-xs font-bold text-yellow-900 shadow-lg">
                      98% match
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slower {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        .animate-spin-slower {
          animation: spin-slower 15s linear infinite;
        }
      `}</style>
    </section>
  );
}