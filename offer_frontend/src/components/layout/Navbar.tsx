"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { apiService } from "@/services/api";
import {
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  IndianRupee,
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface NavbarProps {
  onMenuClick?: () => void;
  collapsed?: boolean;
}

export function Navbar({ onMenuClick, collapsed = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const [navbarStats, setNavbarStats] = React.useState<any>(null);

  // Fetch navbar stats
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = user?.role === UserRole.ADMIN 
          ? await apiService.getAdminDashboard()
          : await apiService.getSidebarStats();
        setNavbarStats(data);
      } catch (error) {
        console.error('Failed to fetch navbar stats:', error);
      }
    };

    if (user && pathname?.includes('/dashboard')) {
      fetchStats();
    }
  }, [user, pathname]);

  const formatCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value}`;
  };

  // Get breadcrumbs from pathname
  const breadcrumbs = React.useMemo(() => {
    const paths = pathname?.split("/").filter(Boolean) || [];
    return paths.map((path, index) => ({
      name: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " "),
      href: "/" + paths.slice(0, index + 1).join("/"),
      isLast: index === paths.length - 1,
    }));
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search:", searchQuery);
  };


  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getRoleBadge = () => {
    if (user?.role === UserRole.ADMIN) {
      return { text: "Admin", variant: "default" as const };
    } else if (user?.role === UserRole.ZONE_USER) {
      return { text: "Zone User", variant: "secondary" as const };
    }
    return { text: "User", variant: "outline" as const };
  };

  return (
    <div className={cn(
      "sticky top-0 z-40 transition-all duration-300",
      collapsed ? "lg:ml-0" : "lg:ml-0"
    )}>
      {/* Main Navbar */}
      <div className="flex h-16 shrink-0 items-center gap-x-4 border-b border-emerald-100/50 bg-gradient-to-r from-white via-emerald-50/30 to-blue-50/30 backdrop-blur-xl px-4 shadow-md sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-slate-100 rounded-xl transition-all"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </Button>

        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
              <button
                onClick={() => !breadcrumb.isLast && router.push(breadcrumb.href)}
                className={cn(
                  "font-medium transition-colors hover:text-blue-600",
                  breadcrumb.isLast
                    ? "text-slate-900 cursor-default"
                    : "text-slate-500 hover:text-blue-600"
                )}
              >
                {breadcrumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search bar */}
        <div className="flex flex-1 gap-x-4 items-center lg:gap-x-6">
          <form
            className="relative flex flex-1 items-center max-w-2xl"
            onSubmit={handleSearch}
          >
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search offers, customers, zones..."
              className="w-full pl-10 pr-4 h-10 bg-white/80 border-emerald-200/60 focus:bg-white focus:border-emerald-400 transition-all rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-100"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 h-8 px-3 hover:bg-slate-100 rounded-lg"
                onClick={() => setSearchQuery("")}
              >
                Clear
              </Button>
            )}
          </form>
        </div>

        {/* Right section - Quick Actions & User Menu */}
        <div className="flex items-center gap-x-2 lg:gap-x-3">
          {/* Quick Actions (Desktop) */}
          {user?.role === UserRole.ADMIN && (
            <div className="hidden lg:flex items-center gap-2">
              <Button
                size="sm"
                className="h-9 gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all"
                onClick={() => router.push("/admin/offers/new")}
              >
                <Plus className="h-4 w-4" />
                <span className="font-semibold">New Offer</span>
                <Sparkles className="h-3 w-3" />
              </Button>
            </div>
          )}


          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2.5 h-10 pl-2 pr-3 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Avatar className="h-8 w-8 ring-2 ring-slate-200 ring-offset-2">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-md">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden xl:block text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {getRoleBadge().text}
                  </p>
                </div>
                <ChevronDown className="hidden lg:block h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-slate-200">
              <DropdownMenuLabel className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-slate-200">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.email}
                    </p>
                    <Badge
                      variant={getRoleBadge().variant}
                      className="mt-1 text-xs"
                    >
                      {getRoleBadge().text}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer px-4 py-2.5 rounded-lg mx-2 hover:bg-slate-100"
                onClick={() => router.push("/profile")}
              >
                <User className="mr-3 h-4 w-4 text-slate-600" />
                <span className="font-medium">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer px-4 py-2.5 rounded-lg mx-2 hover:bg-slate-100"
                onClick={() => router.push("/settings")}
              >
                <Settings className="mr-3 h-4 w-4 text-slate-600" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer px-4 py-2.5 rounded-lg mx-2 mb-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => logout()}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sales Stats Bar (Dashboard Only) */}
      {pathname?.includes("/dashboard") && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50/30 via-white to-blue-50/30 px-4 py-4 sm:px-6 lg:px-8"
        >
          <div className="flex items-center gap-8 overflow-x-auto">
            {/* Pipeline Value */}
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Pipeline Value</p>
                <p className="text-base font-bold text-emerald-700">
                  {navbarStats?.stats?.totalValue ? formatCurrency(navbarStats.stats.totalValue) : '...'}
                </p>
              </div>
            </div>
            
            {/* Deals Won */}
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Won This Month</p>
                <div className="flex items-center gap-1">
                  <p className="text-base font-bold text-blue-700">
                    {navbarStats?.stats?.wonThisMonth ?? '...'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Win Rate */}
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-200">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Win Rate</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-bold text-purple-700">
                    {navbarStats?.stats?.winRate 
                      ? `${typeof navbarStats.stats.winRate === 'number' ? navbarStats.stats.winRate.toFixed(1) : navbarStats.stats.winRate}%` 
                      : '...'}
                  </p>
                  {navbarStats?.stats?.closedOffers !== undefined && (
                    <span className="text-[10px] text-slate-500">
                      ({navbarStats.stats.closedOffers} closed)
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Avg. Deal Size */}
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Avg. Deal Size</p>
                <p className="text-base font-bold text-amber-700">
                  {navbarStats?.stats?.avgOfferValue ? formatCurrency(navbarStats.stats.avgOfferValue) : '...'}
                </p>
              </div>
            </div>
            
            {/* Pending Follow-ups */}
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-200">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Active Offers</p>
                <p className="text-base font-bold text-rose-700">
                  {navbarStats?.stats?.activeOffers ?? navbarStats?.activeOffers ?? '...'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
