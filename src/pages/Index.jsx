import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, Sparkles, Star, Clock, MapPin, Users,
  ChefHat, Truck, Store, Shield, Play, CheckCircle,
  Smartphone, Zap, Heart, Award, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SmartEatsLogo from "@/components/ui/SmartEatsLogo";

export default function Index() {
  const navigate = useNavigate();

  // Check if already authenticated and redirect based on role
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        redirectBasedOnRole(userData);
      }
    } catch (e) {
      // Not authenticated, stay on landing page
    }
  };

  const redirectBasedOnRole = (userData) => {
    // Direct role-based redirect using backend user data
    if (userData.role === 'admin') {
      navigate('/admin');
    } else if (userData.role === 'restaurant') {
      navigate('/restaurant/dashboard');
    } else if (userData.role === 'driver') {
      navigate('/driver');
    } else {
      navigate('/home');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <SmartEatsLogo size="md" />

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-[#F25C23] transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-[#F25C23] transition-colors">How it Works</a>
              <a href="#partner" className="text-gray-600 hover:text-[#F25C23] transition-colors">Partner with Us</a>
              <a href="#demo" className="text-gray-600 hover:text-[#F25C23] transition-colors">Demo Access</a>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleLogin}
                className="text-gray-700 hover:text-[#F25C23]"
              >
                Login
              </Button>
              <Button
                onClick={handleSignUp}
                className="bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7F2] via-white to-white" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#F25C23]/10 to-[#FFC043]/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-[#F25C23]/10 text-[#F25C23] border-0 mb-6">
                <Sparkles className="w-3 h-3 mr-1" />
                #1 Food Delivery in Bangalore
              </Badge>

              <h1 className="text-5xl md:text-6xl font-bold text-[#1D1D1F] leading-tight mb-6">
                Delicious Food,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F25C23] to-[#D94A18]">
                  Delivered Fast
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Order from 500+ restaurants. Track in real-time.
                Delivered to your doorstep in 30 minutes or less.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <Button
                  size="lg"
                  onClick={handleSignUp}
                  className="bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl h-14 px-8 text-lg"
                >
                  Order Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl h-14 px-8 text-lg border-gray-300"
                  asChild
                >
                  <a href="#demo">
                    <Play className="w-5 h-5 mr-2" />
                    View Demo
                  </a>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8">
                {[
                  { value: "500+", label: "Restaurants" },
                  { value: "50K+", label: "Happy Users" },
                  { value: "30 min", label: "Avg Delivery" },
                ].map((stat, idx) => (
                  <div key={idx}>
                    <p className="text-3xl font-bold text-[#1D1D1F]">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
                  alt="Delicious food"
                  className="w-full h-full object-cover rounded-3xl shadow-2xl"
                />

                {/* Floating Cards */}
                <div className="absolute -left-8 top-1/4 bg-white rounded-2xl p-4 shadow-xl animate-bounce">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Fast Delivery</p>
                      <p className="text-sm text-gray-500">Under 30 mins</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-1/4 bg-white rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F25C23] to-[#FFC043] border-2 border-white" />
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[#FFC043] text-[#FFC043]" />
                        <span className="font-bold">4.8</span>
                      </div>
                      <p className="text-xs text-gray-500">50K+ reviews</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1D1D1F] mb-4">
              Why Choose SmartEats?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the future of food delivery with our AI-powered platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "30 min average delivery", color: "bg-yellow-100 text-yellow-600" },
              { icon: MapPin, title: "Live Tracking", desc: "Track your order in real-time", color: "bg-blue-100 text-blue-600" },
              { icon: Sparkles, title: "AI Assistant", desc: "Get personalized recommendations", color: "bg-purple-100 text-purple-600" },
              { icon: Heart, title: "500+ Restaurants", desc: "Cuisines for every craving", color: "bg-red-100 text-red-600" },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1D1D1F] mb-4">
              How it Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Choose Restaurant", desc: "Browse 500+ restaurants and pick your favorite", icon: Store },
              { step: "02", title: "Place Order", desc: "Select dishes, add to cart and checkout", icon: ChefHat },
              { step: "03", title: "Get Delivered", desc: "Track your order and enjoy your food", icon: Truck },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#F25C23] to-[#D94A18] rounded-2xl flex items-center justify-center mx-auto">
                    <item.icon className="w-10 h-10 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-[#FFC043] rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Section */}
      <section id="partner" className="py-20 px-4 bg-[#1D1D1F]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Restaurant Partner */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white">
              <Store className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Partner Your Restaurant</h3>
              <p className="text-blue-100 mb-6">
                Reach thousands of new customers and grow your business with SmartEats
              </p>
              <ul className="space-y-3 mb-8">
                {["Increase revenue by 30%", "Real-time order management", "Marketing support"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate('/register/restaurant')}
                className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl"
              >
                Register Restaurant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Delivery Partner */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white">
              <Truck className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Become a Delivery Partner</h3>
              <p className="text-green-100 mb-6">
                Be your own boss. Flexible hours, daily earnings, and more.
              </p>
              <ul className="space-y-3 mb-8">
                {["Earn ₹500+ per day", "Weekly payouts", "Insurance coverage"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate('/register/driver')}
                className="bg-white text-green-600 hover:bg-green-50 rounded-xl"
              >
                Start Delivering
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <SmartEatsLogo size="md" className="justify-center mb-4" />
          <p>© 2024 SmartEats. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}