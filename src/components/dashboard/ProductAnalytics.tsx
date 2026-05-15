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
  Line,
  ComposedChart,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

interface ProductAnalyticsProps {
  data: SalesData[];
}

export function ProductAnalytics({ data }: ProductAnalyticsProps) {
  const productMetrics = useMemo(() => {
    const metrics: Record<string, any> = {};
    data.forEach(item => {
      const name = item["Product Name"];
      if (!metrics[name]) {
        metrics[name] = {
          name,
          revenue: 0,
          qty: 0,
          gross: 0,
          dept: item.Department
        };
      }
      const net = parseFloat(item["Net Sale Amt"]) || 0;
      const basic = parseFloat(item["Basic Amt"]) || 0;
      const promo = parseFloat(item["Promo Amt"]) || 0;
      const coupon = parseFloat(item["Coupon Amt"]) || 0;
      
      metrics[name].revenue += net;
      metrics[name].qty += parseInt(item.Qty) || 0;
      metrics[name].gross += (basic + promo + coupon);
    });

    return Object.values(metrics).map(p => ({
      ...p,
      discountPct: p.gross > 0 ? ((p.gross - p.revenue) / p.gross) * 100 : 0
    })).sort((a,b) => b.revenue - a.revenue);
  }, [data]);

  const paretoData = useMemo(() => {
    const totalRev = productMetrics.reduce((acc, curr) => acc + curr.revenue, 0);
    let cumulative = 0;
    return productMetrics.slice(0, 15).map(p => {
      cumulative += p.revenue;
      return {
        name: p.name,
        revenue: Math.round(p.revenue),
        percentage: Math.round((cumulative / totalRev) * 100)
      };
    });
  }, [productMetrics]);

  const treemapData = useMemo(() => {
    const deptMap: Record<string, any> = {};
    data.forEach(item => {
      const dept = item.Department;
      const prod = item["Product Name"];
      const rev = parseFloat(item["Net Sale Amt"]) || 0;
      
      if (!deptMap[dept]) deptMap[dept] = { name: dept, children: [] };
      const existingProd = deptMap[dept].children.find((c: any) => c.name === prod);
      if (existingProd) {
        existingProd.value += rev;
      } else {
        deptMap[dept].children.push({ name: prod, value: rev });
      }
    });

    return Object.values(deptMap).map((d: any) => ({
      name: d.name,
      children: d.children.sort((a: any, b: any) => b.value - a.value).slice(0, 10)
    }));
  }, [data]);

  const bubbleData = useMemo(() => {
    return productMetrics.slice(0, 20).map(p => ({
      name: p.name,
      x: p.qty,
      y: Math.round(p.revenue),
      z: p.revenue
    }));
  }, [productMetrics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pareto Chart */}
        <div className="p-8 rounded-2xl bg-bg-card border border-white/5">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-8">Pareto Analysis (Top 15)</h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 8 }} interval={0} angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#D4AF37", fontSize: 9 }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#111112", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                <Bar yAxisId="left" dataKey="revenue" fill="rgba(212, 175, 55, 0.1)" radius={[2, 2, 0, 0]} barSize={25} />
                <Line yAxisId="right" type="monotone" dataKey="percentage" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: "#D4AF37", r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Treemap */}
        <div className="p-8 rounded-2xl bg-bg-card border border-white/5">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-8">Revenue Treemap by Dept</h2>
          <div className="h-[350px] overflow-hidden rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#050505"
                fill="#D4AF37"
              >
                 <Tooltip contentStyle={{ backgroundColor: "#111112", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Product Depth Table */}
        <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-bg-card overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white tracking-tight">Product Performance Matrix</h2>
          </div>
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5">
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] px-8">Product Name</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em]">Net Revenue</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] text-center">Qty</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] text-center">Disc%</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] text-center">Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productMetrics.slice(0, 15).map((prod) => (
                <TableRow key={prod.name} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="px-8 font-medium text-white text-xs">{prod.name}</TableCell>
                  <TableCell className="text-gold font-bold text-xs">₹{Math.round(prod.revenue).toLocaleString()}</TableCell>
                  <TableCell className="text-center text-slate-400 text-xs">{prod.qty}</TableCell>
                  <TableCell className="text-center text-slate-400 text-xs">{prod.discountPct.toFixed(1)}%</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        prod.revenue > 50000 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : 
                        prod.revenue > 20000 ? "bg-gold shadow-[0_0_8px_rgba(212,175,55,0.4)]" : "bg-rose-500"
                      )} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Bubble Chart */}
        <div className="lg:col-span-4 p-8 rounded-2xl bg-bg-card border border-white/5">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-8">Rev vs Qty Correlation</h2>
          <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                 <XAxis type="number" dataKey="x" name="Quantity" unit=" units" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} />
                 <YAxis type="number" dataKey="y" name="Revenue" unit="₹" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} />
                 <ZAxis type="number" dataKey="z" range={[50, 400]} />
                 <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#111112", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                 <Scatter name="Products" data={bubbleData} fill="#D4AF37" />
               </ScatterChart>
             </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-4 uppercase tracking-[0.2em] font-medium">Higher bubble = Strategic Pricing Accuracy</p>
        </div>
      </div>
    </div>
  );
}
