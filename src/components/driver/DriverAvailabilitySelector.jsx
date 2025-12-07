import React from "react";
import { Coffee, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const availabilityOptions = [
  { 
    value: "available", 
    label: "Available", 
    icon: CheckCircle, 
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "Ready to accept deliveries"
  },
  { 
    value: "on_break", 
    label: "On Break", 
    icon: Coffee, 
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    description: "Taking a short break"
  },
  { 
    value: "unavailable", 
    label: "Unavailable", 
    icon: XCircle, 
    color: "text-red-600",
    bgColor: "bg-red-100",
    description: "Not accepting orders"
  }
];

export function getAvailabilityInfo(status) {
  return availabilityOptions.find(o => o.value === status) || availabilityOptions[0];
}

export default function DriverAvailabilitySelector({ currentStatus, onStatusChange, disabled }) {
  const currentOption = getAvailabilityInfo(currentStatus);
  const Icon = currentOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button 
          variant="outline" 
          className={cn(
            "rounded-xl gap-2",
            currentOption.bgColor,
            "border-0 hover:opacity-80"
          )}
        >
          <Icon className={cn("w-4 h-4", currentOption.color)} />
          <span className={currentOption.color}>{currentOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {availabilityOptions.map((option) => {
          const OptionIcon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={cn(
                "flex items-center gap-3 py-3 cursor-pointer",
                currentStatus === option.value && option.bgColor
              )}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", option.bgColor)}>
                <OptionIcon className={cn("w-4 h-4", option.color)} />
              </div>
              <div>
                <p className="font-medium">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}