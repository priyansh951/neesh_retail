import { useState, useEffect, useCallback, useMemo } from "react";
import { SalesData, DashboardFilters } from "../lib/types";
import { isWithinInterval, subDays, differenceInDays } from "date-fns";
import { parseBroadwayDate } from "../lib/utils";

export function useSalesData() {
  const [rawData, setRawData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    stores: [],
    departments: [],
    products: [],
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    const startTime = Date.now();
    try {
      if (forceRefresh) setLoading(true);
      setError(null);
      
      const fetchUrl = `/api/sales?t=${startTime}`;
      console.log(`[${new Date().toLocaleTimeString()}] Dashboard Sync initiated...`);
      
      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const result = await response.json();

      if (result.success && result.data) {
        console.log(`[Sync Completed] Rows: ${result.data.length} | Latency: ${Date.now() - startTime}ms`);
        setRawData(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || "No data available.");
      }
    } catch (err: any) {
      console.error("[Sync Failed]", err);
      setError(err.message || "Failed to connect to Broadway API.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync every 30 seconds
  useEffect(() => {
    fetchData(true); // Initial load (true to skip first manual loader if desired, or skip param)
    const intervalId = setInterval(() => fetchData(false), 30000); // Background poll
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const applyFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
      stores: [],
      departments: [],
      products: [],
    });
  }, []);

  const getFilteredSubset = useCallback((data: SalesData[], activeFilters: DashboardFilters, customRange?: { from: Date; to: Date }) => {
    let filtered = [...data];

    // 1. Date Range Filter
    const targetRange = customRange || activeFilters.dateRange;
    if (targetRange?.from && targetRange?.to) {
      filtered = filtered.filter((item) => {
        const date = parseBroadwayDate(item["Bill Date"]);
        return isWithinInterval(date, { 
          start: targetRange.from!, 
          end: targetRange.to! 
        });
      });
    }

    // 2. Store Filter
    if (activeFilters.stores.length > 0) {
      filtered = filtered.filter((item) => activeFilters.stores.includes(item.Store));
    }

    // 3. Department Filter
    if (activeFilters.departments.length > 0) {
      filtered = filtered.filter((item) => activeFilters.departments.includes(item.Department));
    }

    // 4. Product Filter
    if (activeFilters.products.length > 0) {
      filtered = filtered.filter((item) => activeFilters.products.includes(item["Product Name"]));
    }

    return filtered;
  }, []);

  // Derived State: Current vs Previous Data
  const analytics = useMemo(() => {
    const current = getFilteredSubset(rawData, filters);
    
    let previous: SalesData[] = [];
    if (filters.dateRange?.from && filters.dateRange?.to) {
      // Calculate length of period in days
      const daysDiff = differenceInDays(filters.dateRange.to, filters.dateRange.from) + 1;
      
      // Previous equivalent period
      const prevRange = {
        from: subDays(filters.dateRange.from, daysDiff),
        to: subDays(filters.dateRange.from, 1),
      };
      
      previous = getFilteredSubset(rawData, filters, prevRange);
    }

    return { current, previous };
  }, [rawData, filters, getFilteredSubset]);

  return {
    rawData,
    filteredData: analytics.current,
    previousData: analytics.previous,
    filters,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
    applyFilters,
    resetFilters
  };
}
