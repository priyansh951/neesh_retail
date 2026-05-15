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
  LineChart,
  Line,
  Legend
} from "recharts";
import { format, getDay, startOfWeek, endOfWeek, eachDayOfInterval, subMonths, isSameMonth } from "date-fns";
import { cn, parseBroadwayDate } from "@/lib/utils";
import { motion } from "motion/react";

interface SalesTrendsProps {
  data: SalesData[];
}

export function SalesTrends({ data }: SalesTrendsProps) {
  const dayOfWeekData = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    data.forEach(item => {
      const day = getDay(parseBroadwayDate(item["Bill Date"]));
      dayMap[day] += parseFloat(item["Net Sale Amt"]) || 0;
    });

    return days.map((name, i) => ({
      name,
      revenue: Math.round(dayMap[i])
    }));
  }, [data]);

  const monthlyComparison = useMemo(() => {
    const currentMonth = new Date();
    const lastMonth = subMonths(new Date(), 1);
    
    let currentTotal = 0;
    let lastTotal = 0;

    data.forEach(item => {
      const date = parseBroadwayDate(item["Bill Date"]);
      if (isSameMonth(date, currentMonth)) currentTotal += parseFloat(item["Net Sale Amt"]) || 0;
      if (isSameMonth(date, lastMonth)) lastTotal += parseFloat(item["Net Sale Amt"]) || 0;
    });

    return [
      { name: format(lastMonth, "MMMM"), revenue: Math.round(lastTotal) },
      { name: format(currentMonth, "MMMM"), revenue: Math.round(currentTotal) },
    ];
  }, [data]);

  const paymentModes = useMemo(() => {
    const modeMap: Record<string, number> = {};
    data.forEach(item => {
      const mode = item["Payment Mode"] || "Unknown";
      modeMap[mode] = (modeMap[mode] || 0) + parseFloat(item["Net Sale Amt"]);
    });
    return Object.entries(modeMap).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [data]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Analysis */}
        <div className="p-8 rounded-2xl bg-bg-card border border-white/5">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-8">Sales by Day of Week</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: "#111112", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                <Bar dataKey="revenue" fill="rgba(212, 175, 55, 0.4)" radius={[2, 2, 0, 0]} barSize={32}>
                   {dayOfWeekData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === "Saturday" || entry.name === "Sunday" ? "#D4AF37" : "rgba(212, 175, 55, 0.4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-4 uppercase tracking-[0.2em] font-medium">Gold indicates Peak Holiday/Weekend demand</p>
        </div>

        {/* Payment Mode Distribution */}
        <div className="p-8 rounded-2xl bg-bg-card border border-white/5">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-8">Payment Mode Preference</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentModes} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "#111112", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                <Bar dataKey="value" fill="#D4AF37" radius={[0, 2, 2, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="lg:col-span-2 p-8 rounded-2xl bg-bg-card border border-white/5">
           <div className="flex items-center justify-between mb-10">
             <div>
               <h2 className="text-sm font-semibold text-white tracking-tight">Month-on-Month Reality</h2>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Growth trajectory confirmation</p>
             </div>
             <div className="flex items-center gap-4">
                {monthlyComparison.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-white/10" : "bg-gold")} />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.name}</span>
                  </div>
                ))}
             </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {monthlyComparison.map((m, i) => (
                <div key={m.name} className="p-10 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">{m.name} Gross</p>
                  <h3 className={cn("text-4xl font-semibold mb-6 tracking-tight", i === 1 ? "text-white" : "text-slate-500")}>
                    ₹{m.revenue.toLocaleString()}
                  </h3>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: i === 1 ? "85%" : "70%" }} 
                      className={cn("h-full rounded-full", i === 1 ? "bg-gold" : "bg-white/20")}
                    />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
