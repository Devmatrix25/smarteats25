import React, { useState } from "react";
import { Navigation, Map, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV_APPS = [
  {
    id: 'google_maps',
    name: 'Google Maps',
    icon: '🗺️',
    getUrl: (lat, lng, address) => 
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(address || '')}`
  },
  {
    id: 'waze',
    name: 'Waze',
    icon: '🚗',
    getUrl: (lat, lng) => 
      `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }
];

export default function NavigationPreference({ 
  latitude, 
  longitude, 
  address,
  driverEmail,
  onPreferenceSaved
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [savedPreference, setSavedPreference] = useState(() => {
    // Load from localStorage
    return localStorage.getItem(`nav_pref_${driverEmail}`) || null;
  });

  const navigateTo = (appId) => {
    const app = NAV_APPS.find(a => a.id === appId);
    if (!app) return;

    const url = app.getUrl(latitude, longitude, address);
    window.open(url, '_blank');
    
    // Save preference
    localStorage.setItem(`nav_pref_${driverEmail}`, appId);
    setSavedPreference(appId);
    setShowDialog(false);
    
    if (onPreferenceSaved) {
      onPreferenceSaved(appId);
    }
  };

  const handleNavigate = () => {
    if (savedPreference) {
      // Use saved preference
      navigateTo(savedPreference);
    } else {
      // Show selection dialog
      setShowDialog(true);
    }
  };

  const handleChangePreference = (e) => {
    e.stopPropagation();
    setShowDialog(true);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1 rounded-xl"
          onClick={handleNavigate}
        >
          <Navigation className="w-4 h-4 mr-2" />
          Navigate
          {savedPreference && (
            <span className="ml-2 text-xs opacity-70">
              ({NAV_APPS.find(a => a.id === savedPreference)?.name})
            </span>
          )}
        </Button>
        {savedPreference && (
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-xl"
            onClick={handleChangePreference}
          >
            <Map className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose Navigation App</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {NAV_APPS.map(app => (
              <button
                key={app.id}
                onClick={() => navigateTo(app.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:border-blue-500",
                  savedPreference === app.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                )}
              >
                <span className="text-3xl">{app.icon}</span>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{app.name}</p>
                  <p className="text-sm text-gray-500">
                    {savedPreference === app.id ? 'Your preferred app' : 'Tap to navigate'}
                  </p>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            Your preference will be remembered for future deliveries
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}