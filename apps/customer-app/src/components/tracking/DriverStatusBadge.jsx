import React from "react";
import { CheckCircle, Coffee, XCircle, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  available: {
    label: "Available",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 border-green-200"
  },
  on_break: {
    label: "On Break",
    icon: Coffee,
    className: "bg-yellow-100 text-yellow-700 border-yellow-200"
  },
  unavailable: {
    label: "Unavailable",
    icon: XCircle,
    className: "bg-red-100 text-red-700 border-red-200"
  },
  delivering: {
    label: "Delivering",
    icon: Truck,
    className: "bg-blue-100 text-blue-700 border-blue-200"
  }
};

export default function DriverStatusBadge({ status, isBusy, showIcon = true, size = "default" }) {
  // If driver is busy (on delivery), show delivering status
  const effectiveStatus = isBusy ? "delivering" : (status || "available");
  const config = statusConfig[effectiveStatus] || statusConfig.available;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1",
        config.className,
        size === "sm" && "text-xs px-2 py-0.5"
      )}
    >
      {showIcon && <Icon className={cn("w-3 h-3", size === "sm" && "w-2.5 h-2.5")} />}
      {config.label}
    </Badge>
  );
}