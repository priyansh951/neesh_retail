import React, { useMemo } from "react";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Users,
  Award
} from "lucide-react";
import { StatCard } from "../ui/StatCard";
import { SalesData } from "@/lib/types";
import { cn, parseBroadwayDate } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { format, startOfDay, eachDayOfInterval, subDays } from "date-fns";
import { motion } from "motion/react";

interface OverviewProps {
  data: SalesData[];
  previousData: SalesData[];
  loading?: boolean;
}

export function Overview({ data, previousData, loading }: OverviewProps) {
  const stats = useMemo(() => {
    const calculateMetrics = (dataset: SalesData[]) => {
      const netSales = dataset.reduce((acc, curr) => acc + (parseFloat(curr["Net Sale Amt"]) || 0), 0);
      const grossSales = dataset.reduce((acc, curr) => {
        const basic = parseFloat(curr["Basic Amt"]) || 0;
        const promo = parseFloat(curr["Promo Amt"]) || 0;
        const coupon = parseFloat(curr["Coupon Amt"]) || 0;
        return acc + basic + promo + coupon;
      }, 0);
      
      const billCounts = new Set();
      dataset.forEach(item => {
        const billKey = item["Bill No"] || `${item["Bill Date"]}-${item.Store}-${item.MRP}`;
        billCounts.add(billKey);
      });

      const totalUnits = dataset.reduce((acc, curr) => acc + (parseInt(curr.Qty) || 0), 0);
      const totalBills = billCounts.size || dataset.length;
      const aov = totalBills > 0 ? netSales / totalBills : 0;
      const upt = totalBills > 0 ? totalUnits / totalBills : 0;
      const discountPct = grossSales > 0 ? ((grossSales - netSales) / grossSales) * 100 : 0;

      return { netSales, grossSales, totalUnits, totalBills, aov, upt, discountPct };
    };

    const current = calculateMetrics(data);
    const previous = calculateMetrics(previousData);

    const getGrowth = (curr: number, prev: number) => {
      if (prev <= 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    // Store Analysis
    const storeSales: Record<string, number> = {};
    data.forEach(item => {
      const sale = parseFloat(item["Net Sale Amt"]) || 0;
      storeSales[item.Store] = (storeSales[item.Store] || 0) + sale;
    });

    const sortedStores = Object.entries(storeSales).sort((a,b) => b[1] - a[1]);
    const bestStore = sortedStores[0]?.[0] || "N/A";
    const bestStorePerf = sortedStores[0] ? (sortedStores[0][1] / (current.netSales || 1)) * 100 : 0;

    // Best product
    const productSales: Record<string, number> = {};
    data.forEach(item => {
      const sale = parseFloat(item["Net Sale Amt"]) || 0;
      productSales[item["Product Name"]] = (productSales[item["Product Name"]] || 0) + sale;
    });
    const bestProduct = Object.entries(productSales).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
      netSales: { 
        value: current.netSales, 
        trend: getGrowth(current.netSales, previous.netSales) 
      },
      totalBills: { 
        value: current.totalBills, 
        trend: getGrowth(current.totalBills, previous.totalBills) 
      },
      totalUnits: { 
        value: current.totalUnits, 
        trend: getGrowth(current.totalUnits, previous.totalUnits) 
      },
      aov: { 
        value: current.aov, 
        trend: getGrowth(current.aov, previous.aov) 
      },
      upt: {
        value: current.upt,
        trend: getGrowth(current.upt, previous.upt)
      },
      discountPct: current.discountPct,
      bestStore,
      bestStorePerf,
      bestProduct
    };
  }, [data, previousData]);

  const dailyTrendData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    data.forEach(item => {
      const date = parseBroadwayDate(item["Bill Date"]);
      const dateStr = format(date, "yyyy-MM-dd");
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + parseFloat(item["Net Sale Amt"]);
    });

    // Fill last 30 days
    const interval = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return interval.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      return {
        date: format(date, "MMM dd"),
        revenue: Math.round(dailyMap[dateStr] || 0)
      };
    });
  }, [data]);

  const storeRevenueData = useMemo(() => {
    const storeMap: Record<string, number> = {};
    data.forEach(item => {
      storeMap[item.Store] = (storeMap[item.Store] || 0) + parseFloat(item["Net Sale Amt"]);
    });
    return Object.entries(storeMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const salesByDept = useMemo(() => {
    const deptMap: Record<string, number> = {};
    data.forEach(item => {
      deptMap[item.Department] = (deptMap[item.Department] || 0) + parseFloat(item["Net Sale Amt"]);
    });
    const colors = ["#fbbf24", "#d97706", "#92400e", "#451a03"];
    return Object.entries(deptMap).map(([name, value], i) => ({
      name,
      value: Math.round(value),
      color: colors[i % colors.length]
    }));
  }, [data]);

  const topProducts = useMemo(() => {
    const prodMap: Record<string, number> = {};
    data.forEach(item => {
      prodMap[item["Product Name"]] = (prodMap[item["Product Name"]] || 0) + parseFloat(item["Net Sale Amt"]);
    });
    return Object.entries(prodMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Net Sales" 
          value={formatCurrency(stats.netSales.value)} 
          trend={stats.netSales.trend} 
          icon={DollarSign} 
        />
        <StatCard 
          title="Total Transactions" 
          value={stats.totalBills.value.toString()} 
          trend={stats.totalBills.trend} 
          icon={ShoppingCart} 
        />
        <StatCard 
          title="Avg Order Value" 
          value={formatCurrency(stats.aov.value)} 
          trend={stats.aov.trend} 
          icon={Target} 
        />
        <StatCard 
          title="Best Store" 
          value={stats.bestStore} 
          subValue={`${stats.bestStorePerf.toFixed(1)}% Contribution`}
          icon={Award} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Units Per Transaction" 
          value={stats.upt.value.toFixed(2)} 
          trend={stats.upt.trend}
          subValue="Avg. items/bill"
          icon={Package} 
        />
        <StatCard 
          title="Units Sold" 
          value={stats.totalUnits.value.toString()} 
          trend={stats.totalUnits.trend}
          icon={Package} 
        />
        <StatCard 
          title="Avg Discount %" 
          value={`${stats.discountPct.toFixed(1)}%`} 
          subValue="Discount Dependency"
          icon={TrendingUp} 
        />
        <StatCard 
          title="Star Product" 
          value={stats.bestProduct} 
          subValue="Top Revenue Driver"
          icon={Package} 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-8 p-8 rounded-2xl bg-bg-card border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Revenue Trends</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Daily net overview (30 Days)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold" /> 
                <span className="text-[10px] text-slate-400 uppercase font-medium">Net Sales</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111112", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  itemStyle={{ color: "#D4AF37" }}
                  cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#D4AF37" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Contribution */}
        <div className="lg:col-span-4 p-8 rounded-2xl bg-bg-card border border-white/5 flex flex-col">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-8">Revenue by Category</h2>
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <div className="w-full aspect-square max-w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByDept}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {salesByDept.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? "#D4AF37" : index === 1 ? "rgba(212, 175, 55, 0.4)" : "rgba(212, 175, 55, 0.1)"} 
                        stroke="none" 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-4">
              {salesByDept.map((dept, i) => (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">{dept.name} Range</span>
                    <span className="text-white font-bold tracking-tight">₹{Math.round(dept.value/1000)}k</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(dept.value / stats.netSales) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        i === 0 ? "bg-gold" : "bg-white/20"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
