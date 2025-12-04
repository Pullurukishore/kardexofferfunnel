"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import {
  Menu,
  LogOut,
  ChevronDown,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";

interface NavbarProps {
  onMenuClick?: () => void;
  collapsed?: boolean;
}

export function Navbar({ onMenuClick, collapsed = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [hydrated, setHydrated] = React.useState(false);
  

  React.useEffect(() => {
    setHydrated(true);
  }, []);

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
  const effectiveRole = (user?.role || cookieRole || lsRole) as UserRole | undefined;

  // Fallback email from session storage cached user
  let cachedEmail: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem('currentUser');
      if (cached) {
        const parsed = JSON.parse(cached);
        cachedEmail = parsed?.email || null;
      }
    } catch {}
  }
  const effectiveEmail = user?.email || cachedEmail || '';

  const getUserInitials = () => {
    if (!effectiveEmail) return "U";
    return effectiveEmail.charAt(0).toUpperCase();
  };

  const getRoleBadge = () => {
    if (effectiveRole === UserRole.ADMIN) {
      return { text: "Admin", variant: "default" as const, color: "from-violet-600 to-purple-600" };
    } else if (effectiveRole === UserRole.ZONE_USER) {
      return { text: "Zone User", variant: "secondary" as const, color: "from-blue-600 to-indigo-600" };
    }
    return { text: "User", variant: "outline" as const, color: "from-slate-600 to-slate-700" };
  };

  const getPageTitle = () => {
    const paths = pathname?.split("/").filter(Boolean) || [];
    if (paths.length === 0) return "Home";
    const lastPath = paths[paths.length - 1];
    return lastPath.charAt(0).toUpperCase() + lastPath.slice(1).replace(/-/g, " ");
  };

  const getBreadcrumbs = () => {
    const paths = pathname?.split("/").filter(Boolean) || [];
    const toTitle = (seg: string) => seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return ["Home", ...paths.map(toTitle)];
  };

  

  return (
    <div 
      suppressHydrationWarning
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        collapsed ? "lg:ml-0" : "lg:ml-0"
      )}
    >
      {/* Glassmorphic Navbar */}
      <div className="relative">
        {/* Background with blur */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/50" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        
        {/* Content */}
        <div className="relative flex h-16 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors hover:scale-105 active:scale-95"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5 text-slate-700" />
            </button>

            {/* Project Name - Desktop */}
            <div className="hidden lg:flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Offer Funnel
              </h1>
            </div>

            {/* Project Name - Mobile/Tablet */}
            <div className="lg:hidden flex items-center">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Offer Funnel
              </h1>
            </div>

            {/* Breadcrumbs + Title */}
            <div className="hidden md:flex flex-col min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 truncate" aria-label="Breadcrumbs">
                {getBreadcrumbs().map((c, idx) => (
                  <span key={idx} className="truncate">
                    {idx > 0 && <span className="mx-1 text-slate-300">/</span>}
                    {c}
                  </span>
                ))}
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent truncate">
                {getPageTitle()}
              </h1>
            </div>

            
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Quick Action - New Offer */}
            {hydrated && effectiveRole === UserRole.ADMIN && (
              <Button
                size="sm"
                onClick={() => router.push("/admin/offers/new")}
                className="hidden sm:flex h-9 gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-0 hover:scale-102 active:scale-98"
              >
                <Plus className="h-4 w-4" />
                <span className="font-semibold">New Offer</span>
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
            )}

            

            {/* User Menu */}
            {hydrated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2.5 h-10 pl-2 pr-3 hover:bg-slate-100 rounded-xl transition-all hover:scale-102 active:scale-98"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8 ring-2 ring-white shadow-lg">
                        <AvatarFallback
                          suppressHydrationWarning
                          className={cn(
                            "bg-gradient-to-br text-white font-bold text-sm",
                            getRoleBadge().color
                          )}
                        >
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                    </div>
                    <div className="hidden xl:block text-left">
                      <p className="text-sm font-semibold text-slate-900" suppressHydrationWarning>
                        {user?.email?.split("@")[0] || "User"}
                      </p>
                      <p className="text-xs text-slate-500" suppressHydrationWarning>
                        {getRoleBadge().text}
                      </p>
                    </div>
                    <ChevronDown className="hidden lg:block h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-2xl shadow-2xl border-slate-200 bg-white p-2">
                  {/* User Info Header */}
                  <div className="px-3 py-4 mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14 ring-2 ring-slate-200 shadow-lg">
                        <AvatarFallback
                          suppressHydrationWarning
                          className={cn(
                            "bg-gradient-to-br text-white font-bold text-lg",
                            getRoleBadge().color
                          )}
                        >
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {effectiveEmail}
                        </p>
                        <Badge
                          variant={getRoleBadge().variant}
                          className="mt-1.5 text-xs font-semibold"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {getRoleBadge().text}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="my-2" />
                  
                  <DropdownMenuItem
                    className="cursor-pointer px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 group"
                    onClick={() => logout()}
                  >
                    <LogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
