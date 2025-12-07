import React from "react";
import { Smartphone, Star, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppDownloadBanner() {
  return (
    <section className="py-16 bg-gradient-to-r from-[#1D1D1F] to-[#2C2C2E] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#F25C23] rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FFC043] rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
              <Star className="w-4 h-4 text-[#FFC043] fill-[#FFC043]" />
              <span className="text-sm font-medium">4.8 Rating on Play Store</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-6">
              Get the SmartEats App
              <br />
              <span className="text-[#F25C23]">For a Better Experience</span>
            </h2>
            
            <ul className="space-y-4 mb-8">
              {[
                "Exclusive app-only offers",
                "Faster checkout experience",
                "Real-time order tracking",
                "Easy reorder from history"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#3BA55D] rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg"
                className="bg-white text-[#1D1D1F] hover:bg-gray-100 rounded-xl h-14 px-6"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  className="h-8"
                />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-xl h-14 px-6"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="Download on App Store"
                  className="h-8"
                />
              </Button>
            </div>
          </div>

          {/* Right - Phone Mockup */}
          <div className="relative hidden lg:block">
            <div className="relative w-72 h-[580px] mx-auto">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl border border-gray-700">
                {/* Screen */}
                <div className="absolute inset-3 bg-[#FFF7F2] rounded-[2.5rem] overflow-hidden">
                  {/* Status Bar */}
                  <div className="h-8 bg-white flex items-center justify-center">
                    <div className="w-20 h-5 bg-black rounded-full" />
                  </div>
                  
                  {/* App Content Preview */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#F25C23] to-[#D94A18] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">SmartEats</p>
                        <p className="text-[10px] text-gray-500">Bangalore, KA</p>
                      </div>
                    </div>
                    
                    {/* Search */}
                    <div className="bg-white rounded-xl p-3 mb-4 shadow-sm">
                      <div className="h-2 w-32 bg-gray-200 rounded" />
                    </div>
                    
                    {/* Categories */}
                    <div className="flex gap-2 mb-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-14 h-14 bg-orange-100 rounded-xl" />
                      ))}
                    </div>
                    
                    {/* Restaurant Cards */}
                    <div className="space-y-3">
                      {[1,2].map(i => (
                        <div key={i} className="bg-white rounded-xl p-2 shadow-sm flex gap-2">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                          <div className="flex-1 py-1">
                            <div className="h-2 w-20 bg-gray-200 rounded mb-2" />
                            <div className="h-2 w-16 bg-gray-100 rounded mb-2" />
                            <div className="h-4 w-10 bg-green-100 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -right-8 top-1/4 bg-[#F25C23] text-white px-4 py-2 rounded-xl shadow-lg transform rotate-12">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="font-bold text-sm">1M+ Downloads</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}