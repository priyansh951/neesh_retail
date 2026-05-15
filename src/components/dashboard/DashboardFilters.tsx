import React from "react";
import { Search, Filter, Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SalesData, DashboardFilters as FilterState } from "@/lib/types";

interface DashboardFiltersProps {
  rawData: SalesData[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
}

export function DashboardFilters({ rawData, filters, onFilterChange, onReset }: DashboardFiltersProps) {
  const uniqueStores = Array.from(new Set(rawData.map(d => d.Store))).sort();
  const uniqueDepts = Array.from(new Set(rawData.map(d => d.Department))).sort();
  const uniqueProducts = Array.from(new Set(rawData.map(d => d["Product Name"]))).sort().slice(0, 50);

  const toggleItem = (key: keyof FilterState, value: any) => {
    const current = filters[key] as any[];
    if (current.includes(value)) {
      onFilterChange({ [key]: current.filter(i => i !== value) });
    } else {
      onFilterChange({ [key]: [...current, value] });
    }
  };

  const hasActiveFilters = filters.stores.length > 0 || filters.departments.length > 0 || filters.products.length > 0 || !!filters.dateRange;

  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl bg-bg-card border border-white/5 shadow-sm mb-10">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-white/5">
          <Filter size={16} className="text-gold" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Global Filters</span>
        </div>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger 
            render={
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-medium border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 w-[240px] h-9 rounded-lg text-xs",
                  !filters.dateRange && "text-slate-500"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-gold/70" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "MMM dd")} - {format(filters.dateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(filters.dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  <span>Date Range</span>
                )}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0 bg-bg-card border-white/10 shadow-2xl" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={filters.dateRange}
              onSelect={(range: any) => onFilterChange({ dateRange: range })}
              numberOfMonths={2}
              className="text-slate-300"
            />
          </PopoverContent>
        </Popover>

        {/* Store Select */}
        <Select onValueChange={(val) => toggleItem("stores", val)}>
          <SelectTrigger className="w-[180px] border-white/10 bg-white/5 text-slate-300 h-9 rounded-lg text-xs font-medium">
            <SelectValue placeholder="Locations" />
          </SelectTrigger>
          <SelectContent className="bg-bg-card border-white/10 text-slate-300">
            {uniqueStores.map(store => (
              <SelectItem key={store} value={store} className="focus:bg-white/5 focus:text-white text-xs">
                {store}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Dept Select */}
        <Select onValueChange={(val) => toggleItem("departments", val)}>
          <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-slate-300 h-9 rounded-lg text-xs font-medium">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent className="bg-bg-card border-white/10 text-slate-300">
            {uniqueDepts.map(dept => (
              <SelectItem key={dept} value={dept} className="focus:bg-white/5 focus:text-white text-xs">
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="text-slate-500 hover:text-white hover:bg-white/5 gap-2 text-[10px] uppercase tracking-widest font-bold"
          >
            <X size={12} /> Reset
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {(filters.stores.length > 0 || filters.departments.length > 0) && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
          {filters.stores.map(store => (
            <Badge key={store} variant="secondary" className="bg-gold/10 text-gold border border-gold/20 px-2.5 py-0.5 gap-1.5 text-[10px] font-bold rounded-md">
              LOC: {store}
              <X size={10} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => toggleItem("stores", store)} />
            </Badge>
          ))}
          {filters.departments.map(dept => (
            <Badge key={dept} variant="secondary" className="bg-gold/10 text-gold border border-gold/20 px-2.5 py-0.5 gap-1.5 text-[10px] font-bold rounded-md">
              CAT: {dept}
              <X size={10} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => toggleItem("departments", dept)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
