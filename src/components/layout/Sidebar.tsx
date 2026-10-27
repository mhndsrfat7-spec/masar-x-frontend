"use client";

import {
  LayoutDashboard,
  Package,
  Plus,
  Wallet,
  User,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  MapPin,
  FileText,
  Truck,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useRouterStore, type RouteName } from "@/store/routerStore";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { initials } from "@/lib/format";
import { useNotifications } from "@/hooks/useData";
import { useState } from "react";

interface NavItem {
  route: RouteName;
  label: string;
  icon: React.ReactNode;
}

/** Desktop horizontal nav items — shown inline in topbar (lg+ only). */
const DESKTOP_NAV: NavItem[] = [
  { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-4 w-4" /> },
  { route: "shipments", label: "الشحنات", icon: <Package className="h-4 w-4" /> },
  { route: "create-shipment", label: "شحنة جديدة", icon: <Plus className="h-4 w-4" /> },
  { route: "wallet", label: "المحفظة", icon: <Wallet className="h-4 w-4" /> },
  { route: "address-book", label: "العناوين", icon: <MapPin className="h-4 w-4" /> },
  { route: "invoices", label: "الفواتير", icon: <FileText className="h-4 w-4" /> },
  { route: "tracking", label: "التتبّع", icon: <Truck className="h-4 w-4" /> },
];

/** Mobile bottom nav — 5 buttons with center + FAB. */
const BOTTOM_NAV_ITEMS: NavItem[] = [
  { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
  { route: "shipments", label: "شحناتي", icon: <Package className="h-5 w-5" /> },
  { route: "create-shipment", label: "شحنة", icon: <Plus className="h-6 w-6" /> },
  { route: "wallet", label: "المحفظة", icon: <Wallet className="h-5 w-5" /> },
  { route: "profile", label: "حسابي", icon: <User className="h-5 w-5" /> },
];

/**
 * Topbar — single horizontal bar (no sidebar).
 *
 * Desktop (lg+): Logo | inline nav items | spacer | search | notifications | avatar
 * Mobile: Hamburger | page title | notifications | avatar
 */
export function Topbar({ title }: { title: string }) {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const { user, logout } = useAuth();
  const { list: notifs } = useNotifications(useAuth().token);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unread = notifs.filter((n) => !(n.read ?? n.isRead)).length;

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
      {/* Top row — universal */}
      <div className="flex h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6">
        {/* Mobile hamburger — opens Sheet with full nav */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>قائمة التنقّل</SheetTitle>
            </SheetHeader>
            <MobileNavMenu onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Logo — always visible */}
        <button
          type="button"
          onClick={() => navigate("dashboard")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <LogoMark size={36} />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-extrabold text-foreground">مسار إكس</span>
            <span className="text-[9px] font-medium tracking-[0.2em] text-muted-foreground">
              MASAR X
            </span>
          </div>
        </button>

        {/* Page title — mobile only */}
        <h1 className="lg:hidden flex-1 text-base font-bold text-foreground truncate pr-2">
          {title}
        </h1>

        {/* Desktop inline nav items */}
        <nav className="hidden lg:flex items-center gap-1 mr-4">
          {DESKTOP_NAV.map((item) => {
            const active =
              route === item.route ||
              (item.route === "shipments" && route === "shipment-details");
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => navigate(item.route)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1 hidden lg:block" />

        {/* Desktop search */}
        <div className="hidden md:flex items-center w-48 lg:w-64">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث…"
              className="pr-9 h-9 bg-muted/40 border-transparent focus-visible:border-border text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) navigate("tracking", { trackingNumber: value });
                }
              }}
            />
          </div>
        </div>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => navigate("notifications")}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="الإشعارات"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Avatar */}
        <button
          type="button"
          onClick={() => navigate("profile")}
          className="flex items-center gap-2 rounded-full border border-border bg-card hover:bg-muted transition-colors"
          aria-label="الملف الشخصي"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* Mobile logout */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground hover:text-destructive"
          onClick={logout}
          aria-label="تسجيل الخروج"
        >
          <LogOut className="h-5 w-5 rtl-flip" />
        </Button>
      </div>
    </header>
  );
}

/**
 * Mobile nav menu — opened via hamburger Sheet.
 * Lists all routes vertically with icons + labels.
 */
function MobileNavMenu({ onNavigate }: { onNavigate: () => void }) {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const { user, logout } = useAuth();

  const allItems: NavItem[] = [
    { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
    { route: "shipments", label: "الشحنات", icon: <Package className="h-5 w-5" /> },
    { route: "create-shipment", label: "شحنة جديدة", icon: <Plus className="h-5 w-5" /> },
    { route: "wallet", label: "المحفظة", icon: <Wallet className="h-5 w-5" /> },
    { route: "address-book", label: "دفتر العناوين", icon: <MapPin className="h-5 w-5" /> },
    { route: "customers", label: "العملاء", icon: <User className="h-5 w-5" /> },
    { route: "invoices", label: "الفواتير", icon: <FileText className="h-5 w-5" /> },
    { route: "tracking", label: "تتبّع شحنة", icon: <Truck className="h-5 w-5" /> },
    { route: "profile", label: "الملف الشخصي", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Logo size={32} />
      </div>

      {/* User card */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 rounded-xl bg-accent p-3">
          <Avatar className="h-10 w-10 border border-sidebar-border">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? "مستخدم مسار"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
              {user?.phone ?? ""}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1">
        {allItems.map((item) => {
          const active =
            route === item.route ||
            (item.route === "shipments" && route === "shipment-details");
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => {
                navigate(item.route);
                onNavigate();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <span className={active ? "" : "text-muted-foreground"}>
                {item.icon}
              </span>
              <span className="flex-1 text-right">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => {
            onNavigate();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5 rtl-flip" />
          <span className="flex-1 text-right">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Bottom navigation bar — mobile only.
 * 5 buttons with center + FAB-style. Matches brand reference.
 */
export function BottomNav() {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {BOTTOM_NAV_ITEMS.map((item, idx) => {
          const isCenter = idx === 2; // The "+" create button
          const active =
            route === item.route ||
            (item.route === "shipments" && route === "shipment-details");
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative",
                isCenter
                  ? "text-primary"
                  : active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {isCenter ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-brand -mt-4">
                  {item.icon}
                </div>
              ) : (
                <span
                  className={cn(
                    "transition-transform",
                    active && "scale-110"
                  )}
                >
                  {item.icon}
                </span>
              )}
              {!isCenter && <span>{item.label}</span>}
              {active && !isCenter && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
