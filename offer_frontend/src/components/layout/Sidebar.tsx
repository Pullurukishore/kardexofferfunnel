"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { preloadRoute } from "@/lib/browser";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Bell,
  BarChart2,
  MapPin,
  Menu,
  ChevronLeft,
  LogOut,
  ChevronRight,
  X,
  Package,
  Wrench,
  TrendingUp,
  Zap,
  Target,
  DollarSign,
  Building2,
  Activity,
  Sparkles,
  Star,
  Clock,
  Folder,
  MoreHorizontal,
  Rocket,
  Layers,
  Grid3X3,
  Home,
  Award,
  Gem,
  CircleDot,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  children?: NavItem[];
  disabled?: boolean;
  badge?: string;
  iconColor?: string;
  iconBgColor?: string;
};

const navigation: NavItem[] = [
  // Admin
  { 
    title: "Dashboard", 
    href: "/admin/dashboard", 
    icon: Home, 
    roles: [UserRole.ADMIN],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent",
  },
  { 
    title: "Offers", 
    href: "/admin/offers", 
    icon: Rocket, 
    roles: [UserRole.ADMIN],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Customers", 
    href: "/admin/customers", 
    icon: Building2, 
    roles: [UserRole.ADMIN],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Spare Parts", 
    href: "/admin/spare-parts", 
    icon: Layers, 
    roles: [UserRole.ADMIN],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Zones", 
    href: "/admin/zones", 
    icon: Grid3X3, 
    roles: [UserRole.ADMIN],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Users", 
    href: "/admin/users", 
    icon: Users, 
    roles: [UserRole.ADMIN],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Reports", 
    href: "/admin/reports", 
    icon: BarChart2, 
    roles: [UserRole.ADMIN],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Targets", 
    href: "/admin/targets", 
    icon: Target, 
    roles: [UserRole.ADMIN],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Activity", 
    href: "/admin/activity", 
    icon: Activity, 
    roles: [UserRole.ADMIN],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },

  // Zone User
  { 
    title: "Dashboard", 
    href: "/zone-user/dashboard", 
    icon: Home, 
    roles: [UserRole.ZONE_USER],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Offers", 
    href: "/zone-user/offers", 
    icon: Rocket, 
    roles: [UserRole.ZONE_USER],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Targets", 
    href: "/zone-user/targets", 
    icon: Target, 
    roles: [UserRole.ZONE_USER],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
  { 
    title: "Reports", 
    href: "/zone-user/reports", 
    icon: BarChart2, 
    roles: [UserRole.ZONE_USER],
    iconColor: "text-slate-700",
    iconBgColor: "bg-transparent"
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  userRole?: UserRole;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  onClose?: () => void;
}

export function Sidebar({
  userRole,
  onClose,
  className,
  collapsed = false,
  setCollapsed,
}: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle initial load animation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);


  const filteredNavItems = React.useMemo(() => {
    if (!userRole) return [];
    return navigation.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  const handleItemClick = React.useCallback((e: React.MouseEvent, item: NavItem) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    router.push(item.href);
    
    if (isMobile) {
      onClose?.();
    }
  }, [router, onClose, isMobile]);

  const handleItemHover = React.useCallback((item: NavItem) => {
    if (!isMobile && !item.disabled) {
      setHoveredItem(item.href);
      preloadRoute(item.href);
    }
  }, [isMobile]);

  const handleItemLeave = React.useCallback(() => {
    if (!isMobile) {
      setHoveredItem(null);
    }
  }, [isMobile]);

  const renderNavItem = React.useCallback((item: NavItem, index: number) => {
    const isActive = pathname?.startsWith(item.href) ?? false;
    const Icon = item.icon;
    const isHovered = hoveredItem === item.href;

    if (item.disabled) {
      return null;
    }

    return (
      <motion.div
        key={item.href}
        initial={isInitialLoad ? { opacity: 0, x: -10 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ 
          duration: 0.15,
          delay: isInitialLoad ? index * 0.02 : 0,
          ease: "easeOut" 
        }}
        suppressHydrationWarning
      >
        <motion.div
          whileHover={{ scale: isMobile ? 1 : 1.01, y: isMobile ? 0 : -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <button
            onClick={(e) => handleItemClick(e, item)}
            onMouseEnter={() => handleItemHover(item)}
            onMouseLeave={handleItemLeave}
            onTouchStart={() => isMobile && setHoveredItem(item.href)}
            onTouchEnd={() => isMobile && setHoveredItem(null)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.title}
            className={cn(
              "group relative flex items-center transition-all duration-300 w-full focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-2 focus:ring-offset-transparent",
              isMobile ? "px-4 py-3.5 mx-3 my-1 rounded-2xl" : collapsed ? "px-2 py-3 mx-2 my-1 rounded-xl" : "px-3 py-2.5 mx-3 my-0.5 rounded-xl",
              isActive
                ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25 scale-[1.02]"
                : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
              isMobile ? "touch-manipulation" : ""
            )}
            title={collapsed && !isMobile ? item.title : undefined}
          >
            <AnimatePresence>
              {isActive && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "3px", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-full bg-white shadow-lg shadow-white/50" 
                />
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {isHovered && !isActive && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-slate-100/50 to-slate-50/50" 
                />
              )}
            </AnimatePresence>
            
            <div className={cn(
              "flex-shrink-0 transition-all duration-300 relative z-10 flex items-center justify-center",
              isMobile ? "h-10 w-10" : collapsed ? "h-9 w-9" : "h-8 w-8",
              isActive
                ? ""
                : "group-hover:scale-110"
            )}>
              <Icon
                className={cn(
                  "transition-all duration-300",
                  isMobile ? "h-5 w-5" : collapsed ? "h-5 w-5" : "h-4.5 w-4.5",
                  isActive
                    ? "text-white drop-shadow-lg"
                    : "text-slate-500 group-hover:text-slate-900"
                )}
              />
            </div>
            
            {(!collapsed || isMobile) && (
              <span className={cn(
                "flex flex-1 items-center justify-between relative z-10",
                isMobile ? "ml-3" : "ml-2.5"
              )}>
                <span className={cn(
                  "truncate font-medium",
                  isMobile ? "text-sm" : "text-[13px]",
                  isActive && "font-semibold"
                )}>{item.title}</span>
                {item.badge && (
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      "ml-auto rounded-full font-bold shadow-sm",
                      isActive 
                        ? "bg-white/20 text-white px-2 py-0.5 text-[10px]"
                        : "bg-violet-100 text-violet-700 px-2 py-0.5 text-[10px]"
                    )}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </span>
            )}
            {collapsed && !isMobile && (
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-full ml-2 z-50"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg blur opacity-70" />
                      <div className="relative bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xl">
                        <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                        {item.badge && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.badge}</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </button>
        </motion.div>
      </motion.div>
    );
  }, [pathname, collapsed, hoveredItem, isMobile, isInitialLoad, handleItemClick, handleItemHover, handleItemLeave]);

  const navItems = React.useMemo(() => {
    return filteredNavItems.map((item, index) => renderNavItem(item, index));
  }, [filteredNavItems, renderNavItem]);

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-[60] flex h-screen flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isMobile 
          ? "w-80 bg-white border-r border-slate-200 shadow-2xl"
          : collapsed ? "w-[88px] bg-slate-50 border-r border-slate-200/50" : "w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/70",
        className
      )}
      role="navigation"
      aria-label="Primary"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Modern Header */}
      <div className={cn(
        "relative flex items-center justify-between backdrop-blur-sm bg-white/50 border-b border-slate-200/50 z-10",
        isMobile ? "h-16 px-6" : collapsed ? "h-20 px-3" : "h-20 px-5"
      )}>
        <div suppressHydrationWarning className="flex items-center justify-center w-full">
          {(!collapsed || isMobile) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              {/* Modern Logo Design */}
              <div className="flex items-center gap-3">
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-lg group-hover:blur-xl transition-all opacity-70" />
                  <div className="relative h-12 w-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center transform transition-transform group-hover:scale-110">
                    <Gem className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Offer Funnel</span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{userRole === UserRole.ADMIN ? 'Admin' : 'Zone'}</span>
                </div>
              </div>
            </motion.div>
          )}
          {collapsed && !isMobile && (
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur-md group-hover:blur-lg transition-all opacity-70" />
              <div className="relative h-10 w-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Gem className="h-5 w-5 text-white" />
              </div>
            </motion.div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-slate-500 hover:text-slate-700 hover:bg-white/80 hover:shadow-sm rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent",
            isMobile ? "h-10 w-10" : "h-9 w-9"
          )}
          onClick={() => isMobile ? onClose?.() : setCollapsed?.(!collapsed)}
        >
          {isMobile ? (
            <X className={cn("transition-transform duration-300", isMobile ? "h-5 w-5" : "h-4 w-4")} />
          ) : collapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform duration-300" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
          )}
        </Button>
      </div>

      {/* Navigation Section with Categories */}
      <ScrollArea className={cn(
        "flex-1 relative",
        isMobile ? "py-2" : "py-3"
      )}>
        <div suppressHydrationWarning>
          
          {/* Navigation Items */}
          <motion.nav 
            initial={isInitialLoad ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative"
          >
            {!collapsed && !isMobile && (
              <div className="px-4 mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Navigation</span>
              </div>
            )}
            <AnimatePresence mode="wait">
              {navItems}
            </AnimatePresence>
          </motion.nav>
        </div>
      </ScrollArea>

      {/* Bottom Section with User Profile and Logout */}
      <div className={cn(
        "border-t border-slate-200/50 relative z-10",
        collapsed ? "bg-slate-50" : "bg-gradient-to-b from-white to-slate-50",
        isMobile ? "px-3 py-4" : collapsed ? "px-2 py-3" : "px-3 py-3"
      )}>
        {/* User Profile Mini Card */}
        {!collapsed && !isMobile && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 p-2.5 bg-white rounded-xl border border-slate-200/50 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-slate-500">{user.role}</div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Logout Button */}
        <button
          onClick={() => logout?.()}
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Logout"
          className={cn(
            "group w-full flex items-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/30",
            collapsed 
              ? "justify-center px-2 py-2.5 rounded-xl hover:bg-red-50"
              : "px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50",
            "text-slate-600 hover:text-red-600"
          )}
        >
          <LogOut className={cn(
            "transition-all duration-300 group-hover:scale-110",
            collapsed ? "h-5 w-5" : "h-4 w-4"
          )} />
          {(!collapsed || isMobile) && (
            <span className={cn(
              "font-medium transition-colors",
              collapsed ? "" : "ml-2.5",
              "text-[13px]"
            )}>Logout</span>
          )}
          {collapsed && !isMobile && (
            <AnimatePresence>
              {hoveredItem === 'logout' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-full ml-2 z-50"
                >
                  <div className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg">
                    Logout
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </button>
        
        {/* Bottom Decorative Line */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
      </div>
    </div>
  );
}
