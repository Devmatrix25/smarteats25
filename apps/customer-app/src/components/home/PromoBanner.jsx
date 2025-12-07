import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Percent, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const promos = [
  {
    title: "50% OFF",
    subtitle: "on your first order",
    code: "FIRST50",
    bg: "from-[#F25C23] to-[#D94A18]",
    icon: Percent
  },
  {
    title: "FREE DELIVERY",
    subtitle: "on orders above ₹499",
    code: "FREEDEL",
    bg: "from-[#3BA55D] to-emerald-600",
    icon: Truck
  },
  {
    title: "20% OFF",
    subtitle: "Late night orders (10PM-6AM)",
    code: "NIGHT20",
    bg: "from-[#1D1D1F] to-[#2C2C2E]",
    icon: Clock
  }
];

export default function PromoBanner() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3">
          {promos.map((promo, idx) => (
            <div 
              key={idx}
              className={`flex-shrink-0 w-72 sm:w-full bg-gradient-to-r ${promo.bg} rounded-2xl p-5 text-white relative overflow-hidden`}
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-bold">{promo.title}</p>
                    <p className="text-white/80 mt-1">{promo.subtitle}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <promo.icon className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="font-mono font-bold tracking-wider">{promo.code}</span>
                  </div>
                  <Link to={createPageUrl("Restaurants")}>
                    <Button size="sm" className="bg-white text-[#1D1D1F] hover:bg-white/90 rounded-lg">
                      Order Now
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}