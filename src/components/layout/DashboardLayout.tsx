import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  TrendingUp, 
  RefreshCw, 
  Download, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  User,
  LogOut
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { DashboardPage } from "@/lib/types";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
  key?: string | number;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: SidebarItemProps) => (
  <button
    role="menuitem"
    onClick={onClick}
    className={cn(
      "flex items-center w-full px-4 py-3 transition-all duration-200 group relative",
      active 
        ? "bg-white/5 text-white border-l-2 border-gold" 
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-gold" : "group-hover:text-white opacity-70")} />
    {!collapsed && (
      <span className="ml-3 text-sm font-medium transition-opacity duration-200">
        {label}
      </span>
    )}
  </button>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: DashboardPage;
  onPageChange: (page: DashboardPage) => void;
  lastUpdated: Date | null;
  onRefresh: (force?: boolean) => void;
  loading?: boolean;
}

export function DashboardLayout({ 
  children, 
  currentPage, 
  onPageChange, 
  lastUpdated, 
  onRefresh,
  loading 
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems: { id: DashboardPage; label: string; icon: any }[] = [
    { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
    { id: "stores", label: "Store Analytics", icon: Store },
    { id: "products", label: "Product Analytics", icon: Package },
    { id: "trends", label: "Sales Trends", icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen bg-bg-deep text-slate-200 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col border-r border-white/5 bg-bg-sidebar transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="p-8 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm gold-gradient flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <span className="text-black font-bold text-lg font-serif italic">N</span>
              </div>
              <span className="text-white tracking-[0.2em] font-light text-xl uppercase">NEESH</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-sm gold-gradient mx-auto flex items-center justify-center">
              <span className="text-black font-bold text-lg font-serif italic">N</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1" role="menu">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={currentPage === item.id}
              onClick={() => onPageChange(item.id)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {!collapsed && (
          <div className="p-6 mt-auto">
            <div className="p-4 rounded-xl bg-gradient-to-b from-gold/10 to-transparent border border-gold/20 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-widest text-gold font-bold mb-2">Premium Plan</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">Enterprise-grade analytics enabled for all locations.</p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/5">
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            onClick={() => {}} 
            collapsed={collapsed}
          />
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full mt-4 py-2 text-slate-600 hover:text-slate-400 transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 bg-bg-deep px-10 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-slate-400"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </Button>
            <div>
              <h1 className="text-xl font-medium text-white tracking-tight">
                {menuItems.find(i => i.id === currentPage)?.label}
              </h1>
              <p className="text-xs text-slate-500">Real-time insights for NEESH Broadway Outlets</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Last 30 Days</span>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onRefresh(true)}
              disabled={loading}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 gap-2 h-9"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Sync</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <div className="w-10 h-10 rounded-full border border-gold/50 p-0.5 cursor-pointer hover:border-gold transition-colors">
                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white uppercase">
                      AN
                    </div>
                  </div>
                }
              />
              <DropdownMenuContent align="end" className="w-56 bg-bg-card border-white/10 text-slate-300">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                  <User className="mr-2" size={16} /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                  <Settings className="mr-2" size={16} /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer text-red-400/80">
                  <LogOut className="mr-2" size={16} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-bg-deep">
          {children}
        </div>
      </main>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-zinc-900 border-r border-zinc-800 z-[101] md:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-amber-400 flex items-center justify-center">
                    <span className="text-black font-bold text-xl font-serif italic">N</span>
                  </div>
                  <span className="font-serif italic font-bold text-xl text-amber-400 uppercase tracking-wider">NEESH</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X />
                </Button>
              </div>

              <nav className="flex-1">
                {menuItems.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={currentPage === item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                  />
                ))}
              </nav>

              <div className="pt-6 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-4">Account</p>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-800/30">
                  <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">
                    AN
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">Admin User</p>
                    <p className="text-xs text-zinc-500 truncate">admin@neesh.in</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
