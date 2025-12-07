import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  User, Bell, Shield, Globe, Moon, Volume2, MapPin,
  CreditCard, ChevronRight, Check, Smartphone, Mail,
  Eye, Lock, HelpCircle, FileText, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: true,
      recommendations: true,
      email: true,
      sms: false
    },
    privacy: {
      shareOrderHistory: false,
      personalizedAds: true,
      locationTracking: true
    },
    preferences: {
      language: "english",
      darkMode: false,
      soundEffects: true
    }
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl("Index"));
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
      if (userData.settings) {
        setSettings(prev => ({ ...prev, ...userData.settings }));
      }
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await base44.auth.updateMe({ settings: newSettings });
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Failed to save settings");
    }
  };

  const handleToggle = (category, key) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: !settings[category][key]
      }
    };
    saveSettings(newSettings);
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = createPageUrl("Index");
  };

  if (isAuthLoading || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Account Section */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#F25C23]" />
            Account
          </h2>
        </div>
        
        <Link to={createPageUrl("Profile")} className="flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F25C23] to-[#FFC043] flex items-center justify-center text-white font-bold">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-medium">{user.full_name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        
        <Separator />
        
        <button 
          onClick={() => setShowPasswordDialog(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-500" />
            <span>Change Password</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F25C23]" />
            Notifications
          </h2>
        </div>
        
        {[
          { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified about your order status' },
          { key: 'promotions', label: 'Promotions & Offers', desc: 'Receive special deals and discounts' },
          { key: 'recommendations', label: 'Recommendations', desc: 'Get personalized food suggestions' },
          { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
          { key: 'sms', label: 'SMS Notifications', desc: 'Receive updates via SMS' },
        ].map((item, idx) => (
          <React.Fragment key={item.key}>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <Switch
                checked={settings.notifications[item.key]}
                onCheckedChange={() => handleToggle('notifications', item.key)}
              />
            </div>
            {idx < 4 && <Separator />}
          </React.Fragment>
        ))}
      </div>

      {/* Privacy Section */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F25C23]" />
            Privacy
          </h2>
        </div>
        
        {[
          { key: 'shareOrderHistory', label: 'Share Order History', desc: 'Allow restaurants to see your order history' },
          { key: 'personalizedAds', label: 'Personalized Ads', desc: 'See ads based on your preferences' },
          { key: 'locationTracking', label: 'Location Services', desc: 'Allow location access for delivery' },
        ].map((item, idx) => (
          <React.Fragment key={item.key}>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <Switch
                checked={settings.privacy[item.key]}
                onCheckedChange={() => handleToggle('privacy', item.key)}
              />
            </div>
            {idx < 2 && <Separator />}
          </React.Fragment>
        ))}
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#F25C23]" />
            Preferences
          </h2>
        </div>
        
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-500" />
            <span>Language</span>
          </div>
          <Select 
            value={settings.preferences.language}
            onValueChange={(v) => saveSettings({
              ...settings,
              preferences: { ...settings.preferences, language: v }
            })}
          >
            <SelectTrigger className="w-32 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="hindi">हिंदी</SelectItem>
              <SelectItem value="kannada">ಕನ್ನಡ</SelectItem>
              <SelectItem value="tamil">தமிழ்</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-gray-500" />
            <span>Dark Mode</span>
          </div>
          <Switch
            checked={settings.preferences.darkMode}
            onCheckedChange={() => handleToggle('preferences', 'darkMode')}
          />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-gray-500" />
            <span>Sound Effects</span>
          </div>
          <Switch
            checked={settings.preferences.soundEffects}
            onCheckedChange={() => handleToggle('preferences', 'soundEffects')}
          />
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Support</h2>
        </div>
        
        {[
          { icon: HelpCircle, label: 'Help Center' },
          { icon: FileText, label: 'Terms of Service' },
          { icon: Shield, label: 'Privacy Policy' },
        ].map((item, idx) => (
          <React.Fragment key={idx}>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-500" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            {idx < 2 && <Separator />}
          </React.Fragment>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <Button 
          variant="outline"
          onClick={handleLogout}
          className="w-full rounded-xl border-gray-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => setShowDeleteDialog(true)}
          className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
        >
          Delete Account
        </Button>
      </div>

      <p className="text-center text-gray-400 text-sm mt-6">
        SmartEats v1.0.0 • Made with ❤️ in India
      </p>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input type="password" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" className="mt-1 rounded-xl" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl">
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500">
            Are you sure you want to delete your account? This action cannot be undone.
            All your data including order history, addresses, and preferences will be permanently deleted.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 rounded-xl">
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}