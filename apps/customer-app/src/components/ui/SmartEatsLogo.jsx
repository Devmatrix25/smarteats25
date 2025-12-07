import React from "react";

export default function SmartEatsLogo({ size = "md", showText = true, className = "" }) {
  const sizes = {
    sm: { icon: "w-8 h-8", text: "text-lg" },
    md: { icon: "w-10 h-10", text: "text-xl" },
    lg: { icon: "w-14 h-14", text: "text-2xl" },
    xl: { icon: "w-20 h-20", text: "text-4xl" }
  };

  const { icon, text } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon - Stylized S with food path */}
      <div className={`${icon} relative`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F25C23" />
              <stop offset="100%" stopColor="#D94A18" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F25C23" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Main Shape - Rounded Square */}
          <rect 
            x="5" y="5" 
            width="90" height="90" 
            rx="20" 
            fill="url(#logoGradient)"
            filter="url(#shadow)"
          />
          
          {/* Stylized S Path (like a delivery route) */}
          <path
            d="M 65 25 
               C 70 25, 75 30, 75 38
               C 75 48, 65 48, 50 50
               C 35 52, 25 52, 25 62
               C 25 70, 30 75, 35 75"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Start point (restaurant) */}
          <circle cx="65" cy="25" r="6" fill="white" />
          
          {/* End point (destination) - Pin shape */}
          <circle cx="35" cy="75" r="6" fill="white" />
          <circle cx="35" cy="75" r="3" fill="#F25C23" />
          
          {/* Small scooter silhouette on the path */}
          <ellipse cx="50" cy="50" rx="6" ry="4" fill="rgba(255,255,255,0.8)" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold ${text} leading-tight`}>
            <span className="text-[#1D1D1F]">Smart</span>
            <span className="text-[#F25C23]">Eats</span>
          </div>
        </div>
      )}
    </div>
  );
}