import React, { useState, useEffect, useCallback } from "react";
import { MapPin, Search, Loader2, CheckCircle, AlertCircle, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Custom marker icon
const locationIcon = new L.DivIcon({
  html: `<div style="width: 40px; height: 40px; background: #F25C23; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white;">
    <div style="transform: rotate(45deg); font-size: 18px;">📍</div>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Bangalore bounding box for validation
const BANGALORE_BOUNDS = {
  north: 13.1986,
  south: 12.7342,
  east: 77.8542,
  west: 77.3467
};

// Map click handler
function LocationPicker({ position, onPositionChange }) {
  useMapEvents({
    click: (e) => {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  return position ? (
    <Marker position={[position.lat, position.lng]} icon={locationIcon} />
  ) : null;
}

// Map center updater
function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 16);
    }
  }, [center, map]);
  return null;
}

export default function AddressValidator({ 
  value, 
  onChange, 
  onValidAddress,
  showMap = true,
  placeholder = "Enter your complete address"
}) {
  const [addressInput, setAddressInput] = useState(value?.full_address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(
    value?.latitude && value?.longitude 
      ? { lat: value.latitude, lng: value.longitude }
      : null
  );
  const [validationStatus, setValidationStatus] = useState(null); // 'valid', 'invalid', 'warning'
  const [validationMessage, setValidationMessage] = useState("");

  // Search for address using Nominatim (OpenStreetMap)
  const searchAddress = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + 
        new URLSearchParams({
          q: query + ", Bangalore, Karnataka, India",
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'in'
        })
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (e) {
      console.log('Address search failed');
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddress(addressInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [addressInput, searchAddress]);

  // Validate address is within delivery area
  const validateLocation = (lat, lng) => {
    const isInBangalore = 
      lat >= BANGALORE_BOUNDS.south &&
      lat <= BANGALORE_BOUNDS.north &&
      lng >= BANGALORE_BOUNDS.west &&
      lng <= BANGALORE_BOUNDS.east;

    if (isInBangalore) {
      setValidationStatus('valid');
      setValidationMessage('Address is within our delivery area');
      return true;
    } else {
      setValidationStatus('invalid');
      setValidationMessage('Sorry, this address is outside our delivery area (Bangalore only)');
      return false;
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    setAddressInput(suggestion.display_name);
    setSelectedPosition({ lat, lng });
    setSuggestions([]);

    const isValid = validateLocation(lat, lng);

    const addressData = {
      full_address: suggestion.display_name,
      latitude: lat,
      longitude: lng,
      city: suggestion.address?.city || suggestion.address?.town || "Bangalore",
      pincode: suggestion.address?.postcode || "",
      isValid
    };

    onChange(addressData);
    if (isValid && onValidAddress) {
      onValidAddress(addressData);
    }
  };

  // Handle map click
  const handleMapClick = async (position) => {
    setSelectedPosition(position);
    
    // Reverse geocode
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        new URLSearchParams({
          lat: position.lat.toString(),
          lon: position.lng.toString(),
          format: 'json',
          addressdetails: '1'
        })
      );
      const data = await response.json();
      
      if (data.display_name) {
        setAddressInput(data.display_name);
        
        const isValid = validateLocation(position.lat, position.lng);

        const addressData = {
          full_address: data.display_name,
          latitude: position.lat,
          longitude: position.lng,
          city: data.address?.city || data.address?.town || "Bangalore",
          pincode: data.address?.postcode || "",
          isValid
        };

        onChange(addressData);
        if (isValid && onValidAddress) {
          onValidAddress(addressData);
        }
      }
    } catch (e) {
      console.log('Reverse geocode failed');
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await handleMapClick({ lat: latitude, lng: longitude });
        setIsSearching(false);
        toast.success("Location detected!");
      },
      (error) => {
        setIsSearching(false);
        toast.error("Could not get your location");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Label className="mb-2 block">Delivery Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-24 h-12 rounded-xl"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={getCurrentLocation}
              className="h-8 w-8"
              title="Use current location"
            >
              <Navigation className="w-4 h-4 text-[#F25C23]" />
            </Button>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b last:border-b-0"
              >
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm line-clamp-2">{suggestion.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Validation Status */}
      {validationStatus && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-xl",
          validationStatus === 'valid' && "bg-green-50 text-green-700",
          validationStatus === 'invalid' && "bg-red-50 text-red-700",
          validationStatus === 'warning' && "bg-yellow-50 text-yellow-700"
        )}>
          {validationStatus === 'valid' && <CheckCircle className="w-5 h-5" />}
          {validationStatus === 'invalid' && <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{validationMessage}</span>
        </div>
      )}

      {/* Map */}
      {showMap && (
        <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
          <MapContainer
            center={selectedPosition || [12.9716, 77.5946]}
            zoom={selectedPosition ? 16 : 12}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <LocationPicker 
              position={selectedPosition} 
              onPositionChange={handleMapClick} 
            />
            {selectedPosition && <MapCenterUpdater center={selectedPosition} />}
          </MapContainer>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Click on the map or search to set your delivery location
      </p>
    </div>
  );
}