import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";

const categories = [
  { 
    name: "Pizza", 
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80",
    color: "from-red-500/20 to-orange-500/20"
  },
  { 
    name: "Biryani", 
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80",
    color: "from-yellow-500/20 to-amber-500/20"
  },
  { 
    name: "Burger", 
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80",
    color: "from-amber-500/20 to-yellow-500/20"
  },
  { 
    name: "Chinese", 
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&q=80",
    color: "from-red-500/20 to-pink-500/20"
  },
  { 
    name: "South Indian", 
    image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=200&q=80",
    color: "from-green-500/20 to-emerald-500/20"
  },
  { 
    name: "North Indian", 
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80",
    color: "from-orange-500/20 to-red-500/20"
  },
  { 
    name: "Desserts", 
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&q=80",
    color: "from-pink-500/20 to-rose-500/20"
  },
  { 
    name: "Healthy", 
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80",
    color: "from-green-500/20 to-teal-500/20"
  }
];

export default function CategorySection() {
  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1D1D1F]">What's on your mind?</h2>
            <p className="text-gray-500 mt-1">Explore cuisines</p>
          </div>
          <Link 
            to={createPageUrl("Search")}
            className="flex items-center gap-1 text-[#F25C23] font-medium hover:underline"
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category, idx) => (
            <Link
              key={idx}
              to={`${createPageUrl("Search")}?cuisine=${encodeURIComponent(category.name)}`}
              className="flex-shrink-0 group"
            >
              <div className={`w-24 sm:w-full aspect-square rounded-2xl bg-gradient-to-br ${category.color} p-2 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg overflow-hidden`}>
                <img 
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <p className="text-center mt-2 font-medium text-sm text-gray-700 group-hover:text-[#F25C23] transition-colors">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}