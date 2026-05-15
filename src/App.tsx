import React, { useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardFilters } from "./components/dashboard/DashboardFilters";
import { Overview } from "./components/dashboard/Overview";
import { StoreAnalytics } from "./components/dashboard/StoreAnalytics";
import { ProductAnalytics } from "./components/dashboard/ProductAnalytics";
import { SalesTrends } from "./components/dashboard/SalesTrends";
import { useSalesData } from "./hooks/useSalesData";
import { DashboardPage, DashboardFilters as FilterState } from "./lib/types";
import { Button } from "./components/ui/button";
import { Download, FileDown, Camera } from "lucide-react";
import Papa from "papaparse";
import { toPng } from "html-to-image";
import { TooltipProvider } from "./components/ui/tooltip";

export default function App() {
  const [currentPage, setCurrentPage] = useState<DashboardPage>("overview");
  const { 
    rawData, 
    filteredData, 
    previousData,
    filters,
    loading, 
    error, 
    lastUpdated, 
    refresh, 
    applyFilters,
    resetFilters
  } = useSalesData();

  const handleExportCSV = useCallback(() => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NEESH_Sales_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredData]);

  const handleExportPNG = useCallback(() => {
    const node = document.getElementById("dashboard-content");
    if (!node) return;

    toPng(node, { backgroundColor: "#050505" })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `NEESH_Analytics_Snapshot_${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error("Oops, something went wrong!", error);
      });
  }, []);

  return (
    <TooltipProvider>
      <DashboardLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={loading}
      >
        <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Refresh Progress Indicator */}
          {loading && rawData.length > 0 && (
            <div className="fixed bottom-10 right-10 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-gold text-bg-main font-bold text-[10px] tracking-widest uppercase shadow-2xl animate-in slide-in-from-bottom-4">
              <div className="w-2 h-2 rounded-full bg-bg-main animate-ping" />
              Syncing Live Data...
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <p className="text-[10px] text-gold font-bold uppercase tracking-[0.4em] mb-2">Retailer Analytics</p>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-white tracking-tight">
                Broadway <span className="italic">Performance</span> Dashboard
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV}
                className="border-white/10 bg-white/5 hover:bg-gold hover:text-black transition-all gap-2 h-9 px-4 rounded-lg text-xs font-medium"
              >
                <FileDown size={14} /> Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPNG}
                className="border-white/10 bg-white/5 hover:bg-gold hover:text-black transition-all gap-2 h-9 px-4 rounded-lg text-xs font-medium"
              >
                <Camera size={14} /> Snapshot
              </Button>
            </div>
          </div>

          <DashboardFilters 
            rawData={rawData} 
            filters={filters}
            onFilterChange={applyFilters} 
            onReset={resetFilters}
          />

          {error && (
            <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">{error}</p>
              </div>
            </div>
          )}

          <div id="dashboard-content">
            {currentPage === "overview" && (
              <Overview 
                data={filteredData} 
                previousData={previousData}
                loading={loading} 
              />
            )}
            {currentPage === "stores" && <StoreAnalytics data={filteredData} />}
            {currentPage === "products" && <ProductAnalytics data={filteredData} />}
            {currentPage === "trends" && <SalesTrends data={filteredData} />}
          </div>
          
          <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-[9px] uppercase tracking-[0.3em] font-medium">
             <p>© 2026 NEESH PERFUMES — PROPRIETARY BI PLATFORM</p>
             <div className="flex items-center gap-8">
                <p className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  Status: All Stores Online
                </p>
                <p>Sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</p>
             </div>
          </footer>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
