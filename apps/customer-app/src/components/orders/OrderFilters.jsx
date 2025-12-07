import React from "react";
import { Filter, Calendar, Store, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function OrderFilters({ 
  filters, 
  onFilterChange, 
  restaurants = [],
  onClearFilters 
}) {
  const hasActiveFilters = filters.status !== 'all' || 
                           filters.restaurant !== 'all' || 
                           filters.dateRange.from || 
                           filters.sortBy !== 'date_desc';

  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">Active</Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs">
            Clear All
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <Select 
          value={filters.status} 
          onValueChange={(v) => onFilterChange({ ...filters, status: v })}
        >
          <SelectTrigger className="w-[140px] rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>

        {/* Restaurant Filter */}
        <Select 
          value={filters.restaurant} 
          onValueChange={(v) => onFilterChange({ ...filters, restaurant: v })}
        >
          <SelectTrigger className="w-[160px] rounded-lg">
            <Store className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Restaurant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Restaurants</SelectItem>
            {restaurants.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(
              "rounded-lg gap-2",
              filters.dateRange.from && "border-[#F25C23] text-[#F25C23]"
            )}>
              <Calendar className="w-4 h-4" />
              {filters.dateRange.from ? (
                filters.dateRange.to ? (
                  `${format(filters.dateRange.from, "MMM d")} - ${format(filters.dateRange.to, "MMM d")}`
                ) : (
                  format(filters.dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Date Range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={filters.dateRange}
              onSelect={(range) => onFilterChange({ 
                ...filters, 
                dateRange: range || { from: null, to: null } 
              })}
              numberOfMonths={1}
            />
            {filters.dateRange.from && (
              <div className="p-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onFilterChange({ ...filters, dateRange: { from: null, to: null } })}
                >
                  Clear Date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Select 
          value={filters.sortBy} 
          onValueChange={(v) => onFilterChange({ ...filters, sortBy: v })}
        >
          <SelectTrigger className="w-[150px] rounded-lg">
            <ArrowUpDown className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest First</SelectItem>
            <SelectItem value="date_asc">Oldest First</SelectItem>
            <SelectItem value="amount_desc">Highest Amount</SelectItem>
            <SelectItem value="amount_asc">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}