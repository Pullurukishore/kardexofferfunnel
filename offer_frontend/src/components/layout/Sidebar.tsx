"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { preloadRoute } from "@/lib/browser";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  BarChart2,
  MapPin,
  ChevronLeft,
  LogOut,
  ChevronRight,
  X,
  Package,
  Target,
  Building2,
  Activity,
  Sparkles,
  Rocket,
  Layers,
  Grid3X3,
  Home,
  Zap,
  TrendingUp,
  Gem,
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
    iconColor: "text-blue-600",
    iconBgColor: "bg-blue-50",
  },
  { 
    title: "Offers", 
    href: "/admin/offers", 
    icon: Rocket, 
    roles: [UserRole.ADMIN],
    iconColor: "text-purple-600",
    iconBgColor: "bg-purple-50"
  },
  { 
    title: "Customers", 
    href: "/admin/customers", 
    icon: Building2, 
    roles: [UserRole.ADMIN],
    iconColor: "text-emerald-600",
    iconBgColor: "bg-emerald-50"
  },
  { 
    title: "Spare Parts", 
    href: "/admin/spare-parts", 
    icon: Package, 
    roles: [UserRole.ADMIN],
    iconColor: "text-orange-600",
    iconBgColor: "bg-orange-50"
  },
  { 
    title: "Targets", 
    href: "/admin/targets", 
    icon: Target, 
    roles: [UserRole.ADMIN],
    iconColor: "text-amber-600",
    iconBgColor: "bg-amber-50"
  },
  { 
    title: "Forecast", 
    href: "/admin/forecast", 
    icon: TrendingUp, 
    roles: [UserRole.ADMIN],
    iconColor: "text-teal-600",
    iconBgColor: "bg-teal-50"
  },
  { 
    title: "Reports", 
    href: "/admin/reports", 
    icon: BarChart2, 
    roles: [UserRole.ADMIN],
    iconColor: "text-violet-600",
    iconBgColor: "bg-violet-50"
  },
  { 
    title: "Zones", 
    href: "/admin/zones", 
    icon: MapPin, 
    roles: [UserRole.ADMIN],
    iconColor: "text-cyan-600",
    iconBgColor: "bg-cyan-50"
  },
  { 
    title: "Users", 
    href: "/admin/users", 
    icon: Users, 
    roles: [UserRole.ADMIN],
    iconColor: "text-indigo-600",
    iconBgColor: "bg-indigo-50"
  },
  { 
    title: "Activity", 
    href: "/admin/activity", 
    icon: Activity, 
    roles: [UserRole.ADMIN],
    iconColor: "text-pink-600",
    iconBgColor: "bg-pink-50"
  },

  // Zone Manager
  { 
    title: "Dashboard", 
    href: "/zone-manager/dashboard", 
    icon: Home, 
    roles: [UserRole.ZONE_MANAGER],
    iconColor: "text-blue-600",
    iconBgColor: "bg-blue-50"
  },
  { 
    title: "Offers", 
    href: "/zone-manager/offers", 
    icon: Rocket, 
    roles: [UserRole.ZONE_MANAGER],
    iconColor: "text-purple-600",
    iconBgColor: "bg-purple-50"
  },
  { 
    title: "Customers", 
    href: "/zone-manager/customers", 
    icon: Building2, 
    roles: [UserRole.ZONE_MANAGER],
    iconColor: "text-emerald-600",
    iconBgColor: "bg-emerald-50"
  },
  { 
    title: "Spare Parts", 
    href: "/zone-manager/spare-parts", 
    icon: Package, 
    roles: [UserRole.ZONE_MANAGER],
    iconColor: "text-orange-600",
    iconBgColor: "bg-orange-50"
  },
  { 
    title: "Reports", 
    href: "/zone-manager/reports", 
    icon: BarChart2, 
    roles: [UserRole.ZONE_MANAGER],
    iconColor: "text-violet-600",
    iconBgColor: "bg-violet-50"
  },
  { 
    title: "Activity", 
    href: "/zone-manager/activity", 
    icon: Activity, 
    roles: [UserRole.ZONE_MANAGER],
    iconColor: "text-pink-600",
    iconBgColor: "bg-pink-50"
  },

  // Zone User
  { 
    title: "Dashboard", 
    href: "/zone-user/dashboard", 
    icon: Home, 
    roles: [UserRole.ZONE_USER],
    iconColor: "text-blue-600",
    iconBgColor: "bg-blue-50"
  },
  { 
    title: "Offers", 
    href: "/zone-user/offers", 
    icon: Rocket, 
    roles: [UserRole.ZONE_USER],
    iconColor: "text-purple-600",
    iconBgColor: "bg-purple-50"
  },
  { 
    title: "Customers", 
    href: "/zone-user/customers", 
    icon: Building2, 
    roles: [UserRole.ZONE_USER],
    iconColor: "text-emerald-600",
    iconBgColor: "bg-emerald-50"
  },
  { 
    title: "Spare Parts", 
    href: "/zone-user/spare-parts", 
    icon: Package, 
    roles: [UserRole.ZONE_USER],
    iconColor: "text-orange-600",
    iconBgColor: "bg-orange-50"
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
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  // Fast role fallback from cookies/localStorage to avoid flicker on reload
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };
  const cookieRole = getCookie('userRole') as UserRole | null;
  const lsRole = typeof window !== 'undefined' 
    ? ((localStorage.getItem('cookie_userRole') || localStorage.getItem('dev_userRole')) as UserRole | null)
    : null;
  const effectiveRole = (userRole || user?.role || cookieRole || lsRole) as UserRole | undefined;

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Respect prefers-reduced-motion for accessibility
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  // Handle initial load animation - reduced delay (50ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  // Persist collapsed state across sessions
  React.useEffect(() => {
    if (typeof window === 'undefined' || !setCollapsed) return;
    try {
      const saved = localStorage.getItem('of_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === '1');
      }
    } catch {}
  }, [setCollapsed]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('of_sidebar_collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  // Auto-scroll active item into view on mount/route change
  const activeItemRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {}
  }, [hydrated, pathname, collapsed]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed?.(!collapsed);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCollapsed, collapsed]);


  const filteredNavItems = React.useMemo(() => {
    if (!effectiveRole) return [];
    return navigation.filter((item) => item.roles.includes(effectiveRole));
  }, [effectiveRole]);

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
        <motion.button
          onClick={(e) => handleItemClick(e, item)}
          onMouseEnter={() => handleItemHover(item)}
          onMouseLeave={handleItemLeave}
          whileHover={{ x: isActive ? 0 : 4 }}
          whileTap={{ scale: 0.97 }}
          aria-current={isActive ? 'page' : undefined}
          aria-label={item.title}
          ref={isActive ? activeItemRef : undefined}
          className={cn(
            "group relative flex items-center w-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
            isMobile ? "px-3 py-3 mx-2 my-1 rounded-2xl" : collapsed ? "px-2 py-3 mx-2 my-1 rounded-xl justify-center" : "px-3 py-2.5 mx-2 my-0.5 rounded-xl",
            isActive
              ? "bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 ring-1 ring-blue-200/60"
              : "text-slate-700 hover:bg-slate-50",
          )}
        >
          {isHovered && !isActive && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/8 via-indigo-500/8 to-purple-500/8" />
          )}
          {isActive && (
            <div className="absolute left-0 top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r-full bg-blue-600" />
          )}
          {/* Icon Container */}
          <div className={cn(
            "relative flex items-center justify-center rounded-lg transition-all duration-200",
            isMobile ? "h-10 w-10" : collapsed ? "h-9 w-9" : "h-9 w-9",
            isActive 
              ? "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-md" 
              : cn(item.iconBgColor, "group-hover:scale-110")
          )}>
            <Icon
              className={cn(
                "transition-all duration-200",
                isMobile ? "h-5 w-5" : collapsed ? "h-5 w-5" : "h-5 w-5",
                isActive
                  ? "text-white"
                  : item.iconColor
              )}
            />
            {collapsed && !isMobile && isActive && (
              <span className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
            )}
          </div>
          
          {/* Label */}
          {(!collapsed || isMobile) && (
            <div className="flex flex-1 items-center justify-between ml-3">
              <span className={cn(
                "font-semibold truncate",
                isMobile ? "text-sm" : "text-sm",
                isActive ? "text-slate-900" : "text-slate-700"
              )}>
                {item.title}
              </span>
              {item.badge && (
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn(
                    "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold",
                    isActive 
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {item.badge}
                </motion.span>
              )}
            </div>
          )}
          
          {/* Tooltip for collapsed state */}
          {collapsed && !isMobile && isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full ml-3 z-50 pointer-events-none"
            >
              <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-xl whitespace-nowrap">
                {item.title}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </motion.div>
          )}
        </motion.button>
      </motion.div>
    );
  }, [pathname, collapsed, hoveredItem, isMobile, isInitialLoad, handleItemClick, handleItemHover, handleItemLeave]);

  const navItems = React.useMemo(() => {
    if (!hydrated) return [];
    return filteredNavItems.map((item, index) => renderNavItem(item, index));
  }, [filteredNavItems, renderNavItem, hydrated]);

  return (
    <motion.div
      initial={false}
      animate={{ x: 0 }}
      suppressHydrationWarning
      className={cn(
        "fixed left-0 top-0 z-[60] flex h-screen flex-col transition-all duration-300",
        isMobile 
          ? "w-72 bg-white shadow-2xl"
          : collapsed ? "w-20 bg-white border-r border-slate-200" : "w-64 bg-white border-r border-slate-200",
        className
      )}
      role="navigation"
      aria-label="Primary"
    >
      {/* Header */}
      <div className={cn(
        "relative flex items-center border-b border-slate-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50",
        isMobile ? "h-16 px-4 justify-between" : collapsed ? "h-16 px-2 justify-center" : "h-16 px-4 justify-between"
      )}>
        {(!collapsed || isMobile) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Gem className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Offer Funnel
              </h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide" suppressHydrationWarning>
                {hydrated
                  ? (effectiveRole === UserRole.ADMIN
                      ? 'Admin Panel'
                      : effectiveRole === UserRole.ZONE_MANAGER
                        ? 'Zone Manager'
                        : 'Zone Panel')
                  : 'Zone Panel'}
              </p>
            </div>
          </motion.div>
        )}
        
        {collapsed && !isMobile && (
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="h-9 w-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Gem className="h-5 w-5 text-white" />
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "p-2 rounded-xl hover:bg-white transition-colors",
            collapsed && !isMobile && "hidden"
          )}
          onClick={() => isMobile ? onClose?.() : setCollapsed?.(!collapsed)}
        >
          {isMobile ? (
            <X className="h-5 w-5 text-slate-600" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          )}
        </motion.button>
        
        {!isMobile && !collapsed && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
            onClick={() => setCollapsed?.(!collapsed)}
          >
            <ChevronLeft className="h-3 w-3 text-slate-600" />
          </motion.button>
        )}
        
        {!isMobile && collapsed && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
            onClick={() => setCollapsed?.(!collapsed)}
          >
            <ChevronRight className="h-3 w-3 text-slate-600" />
          </motion.button>
        )}
      </div>

      {/* Navigation Section */}
      <ScrollArea className="flex-1 py-4 overflow-hidden">
        <div suppressHydrationWarning className="h-full flex flex-col">
          {/* Sticky Menu Label */}
          {!collapsed && !isMobile && (
            <div className="sticky top-0 z-10 px-4 mb-3 bg-white pb-2 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menu</p>
            </div>
          )}
          
          {/* Scrollable Navigation */}
          <nav suppressHydrationWarning className="flex-1 overflow-y-auto pr-4">
            <div data-hydration-anchor suppressHydrationWarning>
              {hydrated ? navItems : null}
            </div>
          </nav>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className={cn(
        "border-t border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50",
        isMobile ? "px-3 py-4" : collapsed ? "px-2 py-3" : "px-3 py-4"
      )}>
        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => logout?.()}
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
          className={cn(
            "group w-full flex items-center gap-3 transition-all duration-200 rounded-xl",
            collapsed 
              ? "justify-center px-2 py-3 hover:bg-red-50"
              : "px-3 py-2.5 hover:bg-red-50",
            "text-slate-700 hover:text-red-600"
          )}
        >
          <div className={cn(
            "flex items-center justify-center rounded-lg transition-all",
            collapsed ? "h-9 w-9" : "h-9 w-9",
            "bg-red-50 group-hover:bg-red-100"
          )}>
            <LogOut className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-semibold text-sm">Logout</span>
          )}
          
          {/* Tooltip */}
          {collapsed && !isMobile && hoveredItem === 'logout' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full ml-3 z-50 pointer-events-none"
            >
              <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-xl whitespace-nowrap">
                Logout
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </motion.div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
