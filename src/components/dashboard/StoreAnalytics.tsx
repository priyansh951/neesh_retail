import React, { useMemo } from "react";
import { SalesData } from "@/lib/types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from "recharts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

interface StoreAnalyticsProps {
  data: SalesData[];
}

export function StoreAnalytics({ data }: StoreAnalyticsProps) {
  const storeMetrics = useMemo(() => {
    const metrics: Record<string, any> = {};
    
    data.forEach(item => {
      if (!metrics[item.Store]) {
        metrics[item.Store] = {
          name: item.Store,
          revenue: 0,
          gross: 0,
          units: 0,
          orders: 0,
          products: {},
        };
      }
      
      const netSales = parseFloat(item["Net Sale Amt"]) || 0;
      const basic = parseFloat(item["Basic Amt"]) || 0;
      const promo = parseFloat(item["Promo Amt"]) || 0;
      const coupon = parseFloat(item["Coupon Amt"]) || 0;
      
      metrics[item.Store].revenue += netSales;
      metrics[item.Store].gross += (basic + promo + coupon);
      metrics[item.Store].units += (parseInt(item.Qty) || 0);
      metrics[item.Store].orders += 1;
      
      const prodName = item["Product Name"];
      metrics[item.Store].products[prodName] = (metrics[item.Store].products[prodName] || 0) + netSales;
    });

    return Object.values(metrics).map(s => {
      const sortedProds = Object.entries(s.products).sort((a: any, b: any) => b[1] - a[1]);
      return {
        ...s,
        aov: s.orders > 0 ? s.revenue / s.orders : 0,
        discountDependency: s.gross > 0 ? ((s.gross - s.revenue) / s.gross) * 100 : 0,
        bestSeller: sortedProds[0]?.[0] || "N/A",
        slowestSeller: sortedProds[sortedProds.length - 1]?.[0] || "N/A"
      };
    });
  }, [data]);

  const comparisonData = useMemo(() => {
    return storeMetrics.map(s => ({
      name: s.name,
      Revenue: Math.round(s.revenue),
      Units: s.units
    })).sort((a,b) => b.Revenue - a.Revenue);
  }, [storeMetrics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Store Ranking Table */}
      <div className="rounded-2xl border border-white/5 bg-bg-card overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Store Performance Ranking</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Benchmarking outlet efficiency</p>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5">
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] px-8">Store Location</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em]">Net Revenue</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] text-center">Units</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] text-center">AOV</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] text-center">Disc. Dep.</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em]">Star Product (SKU)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {storeMetrics.sort((a,b) => b.revenue - a.revenue).map((store) => (
              <TableRow key={store.name} className="border-white/5 hover:bg-white/5 transition-colors group">
                <TableCell className="px-8 font-medium text-white">{store.name}</TableCell>
                <TableCell className="text-gold font-bold">₹{Math.round(store.revenue).toLocaleString()}</TableCell>
                <TableCell className="text-center text-slate-400">{store.units}</TableCell>
                <TableCell className="text-center text-slate-400">₹{Math.round(store.aov).toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn(
                    "font-bold text-[10px] rounded-sm",
                    store.discountDependency > 15 ? "border-rose-500/20 text-rose-400 bg-rose-500/5" : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                  )}>
                    {store.discountDependency.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300 italic text-xs">{store.bestSeller}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-8 rounded-2xl bg-bg-card border border-white/5">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-8">Revenue Comparison</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: "#111112", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                />
                <Bar dataKey="Revenue" fill="#D4AF37" radius={[2, 2, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-bg-card border border-white/5">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-8">Units Sold Comparison</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: "#111112", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                />
                <Bar dataKey="Units" fill="rgba(212, 175, 55, 0.4)" radius={[2, 2, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
