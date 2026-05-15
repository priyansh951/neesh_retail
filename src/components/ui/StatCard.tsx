import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string | number;
  trend?: number; // percentage
  icon: React.ElementType;
  className?: string;
  loading?: boolean;
}

export function StatCard({ title, value, subValue, trend, icon: Icon, className, loading }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden p-6 rounded-2xl bg-bg-card border border-white/5 group transition-all",
        "hover:border-white/10 shadow-sm",
        className
      )}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gold/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
      
      <div className="relative flex flex-col gap-1">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-2xl font-semibold text-white tracking-tight">{value}</h3>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div>
            {trend !== undefined && (
              <p className={cn(
                "text-[10px] flex items-center gap-1",
                trend >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter",
                  trend >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                )}>
                  {trend >= 0 ? "+" : "-"} {Math.abs(trend).toFixed(1)}%
                </span>
                <span className="text-slate-600 font-bold uppercase text-[8px] tracking-wider ml-1">vs prev period</span>
              </p>
            )}
            {subValue && !trend && (
              <p className="text-[10px] text-gold uppercase tracking-tighter font-bold opacity-80">{subValue}</p>
            )}
          </div>
          
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-gold transition-colors">
            <Icon size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
