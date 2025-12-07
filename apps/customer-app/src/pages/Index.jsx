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
import LoginModal from "@/components/auth/LoginModal";
import SignupModal from "@/components/auth/SignupModal";

export default function Index() {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

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

  const redirectBasedOnRole = async (userData) => {
    console.log("Redirecting user:", userData);

    // Check admin first
    if (userData.role === 'admin') {
      window.location.href = createPageUrl("AdminDashboard");
      return;
    }

    // Check if driver
    try {
      const drivers = await base44.entities.Driver.filter({ email: userData.email });
      if (drivers.length > 0 && drivers[0].status === 'approved') {
        window.location.href = createPageUrl("DriverDashboard");
        return;
      }
    } catch (e) { }

    // Check if restaurant owner
    try {
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      if (restaurants.length > 0 && restaurants[0].status === 'approved') {
        window.location.href = createPageUrl("RestaurantDashboard");
        return;
      }
    } catch (e) { }

    // Default to customer home
    console.log("Redirecting to Home");
    window.location.href = createPageUrl("Home");
  };

  const handleLogin = () => { setShowLoginModal(true); };
  const handleSignup = () => { setShowSignupModal(true); };
  const handleAuthSuccess = (user) => { setShowLoginModal(false); setShowSignupModal(false); redirectBasedOnRole(user); };

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
                onClick={handleSignup} className="bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl"
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
                  onClick={handleSignup} className="bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl h-14 px-8 text-lg"
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
      <section id="partner" className="py-20 px-4 bg-[#1D1D1F] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F25C23]/20 rounded-full blur-3xl" />

          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Become a Partner
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Join our network of restaurants and delivery partners.
                Grow your business with SmartEats.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-[#F25C23]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-1">For Restaurants</h3>
                    <p className="text-gray-400 mb-3">Reach more customers and increase sales</p>
                    <Button variant="link" className="text-[#F25C23] p-0 h-auto">
                      Register Restaurant <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6 text-[#FFC043]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-1">For Delivery Partners</h3>
                    <p className="text-gray-400 mb-3">Earn money on your own schedule</p>
                    <Button variant="link" className="text-[#FFC043] p-0 h-auto">
                      Join as Driver <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Quick Onboarding</p>
                    <p className="text-sm text-gray-400">Start in 24 hours</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    "Zero commission for first month",
                    "Weekly payments",
                    "Dedicated support team",
                    "Marketing tools included"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-[#F25C23]" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <SmartEatsLogo size="md" />
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-[#F25C23]">Privacy Policy</a>
              <a href="#" className="hover:text-[#F25C23]">Terms of Service</a>
              <a href="#" className="hover:text-[#F25C23]">Contact</a>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 SmartEats. Made with ❤️ in Hyderabad
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToSignup={() => { setShowLoginModal(false); setShowSignupModal(true); }}
      />
      <SignupModal
        open={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => { setShowSignupModal(false); setShowLoginModal(true); }}
      />
    </div>
  );
}
