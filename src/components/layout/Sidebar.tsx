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
  LogOut,
  MapPin,
  FileText,
  Truck,
  ScanSearch,
  Scale,
  Network,
  SlidersHorizontal,
  ChevronDown,
  Boxes,
  Landmark,
  BookUser,
  Settings2,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { useRouterStore, type RouteName } from "@/store/routerStore";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { isDemoMode } from "@/lib/api/services";
import { useTranslation } from "@/i18n";
import { useState, useRef, useEffect } from "react";

export interface NavItem {
  route: RouteName;
  label: string;
  description?: string;
  icon: React.ReactNode;
}

export interface DesktopNavGroup {
  id: string;
  /** Short, single-line button label displayed in the top bar */
  buttonLabel: string;
  /** Full descriptive heading displayed inside the dropdown header */
  menuTitle: string;
  icon: React.ReactNode;
  /** Direct route if this item is a single link (e.g. Dashboard) */
  route?: RouteName;
  /** Dropdown sub-items if this is a grouped category */
  items?: NavItem[];
}

export interface TopbarProps {
  title: string;
  onToggleSidebar?: () => void;
}

/**
 * Topbar — collision-free responsive desktop bar with hover-triggered dropdown menus (lg+ only).
 *
 * Desktop (lg+):
 *   Start: Brand Logo (fixed, non-shrinking)
 *   Center: 5 concise main headings that open smoothly on mouse hover (with hover bridge)
 *   End: Quick "+ New Shipment" CTA | Search | Language Switcher | Notifications | Profile
 *
 * Mobile (<lg):
 *   Hamburger Sheet | Page Title | Language Switcher | Notifications | Avatar | Logout
 */
export function Topbar({ title }: TopbarProps) {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const { user, token, logout } = useAuth();
  const { list: notifs } = useNotifications(token);
  const { t, dir, isRTL } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unread = notifs.filter((n) => !(n.read ?? n.isRead)).length;
  const role = String(user?.role ?? "").toUpperCase();
  const canManageIntegrations =
    isDemoMode() || role === "ADMIN" || role === "SUPER_ADMIN";

  const isRouteActive = (itemRoute: RouteName) =>
    route === itemRoute ||
    (itemRoute === "shipments" && route === "shipment-details");

  /** Smooth hover open/close handlers with 130ms grace delay */
  const handleGroupMouseEnter = (groupId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenGroupId(groupId);
  };

  const handleGroupMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpenGroupId(null);
    }, 130);
  };

  const closeAllMenus = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenGroupId(null);
  };

  /**
   * Categorized desktop navigation groups (Laptop/Desktop lg+ only).
   * `buttonLabel` is always kept concise so the 5 buttons fit comfortably inside `max-w-7xl`
   * at every laptop resolution (1024px, 1280px, 1366px, 1536px+) in both Arabic and English.
   */
  const desktopGroups: DesktopNavGroup[] = [
    {
      id: "home",
      buttonLabel: t("nav.home"),
      menuTitle: t("nav.home"),
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
      route: "dashboard",
    },
    {
      id: "shipments-group",
      buttonLabel: t("nav.groups.shipments"),
      menuTitle: t("nav.groups.shipments"),
      icon: <Boxes className="h-4 w-4 shrink-0" />,
      items: [
        {
          route: "shipments",
          label: t("nav.items.shipmentsLog"),
          description: t("nav.items.shipmentsLogDesc"),
          icon: <Package className="h-4 w-4 shrink-0" />,
        },
        {
          route: "create-shipment",
          label: t("nav.items.createNewShipment"),
          description: t("nav.items.createNewShipmentDesc"),
          icon: <Plus className="h-4 w-4 shrink-0" />,
        },
        {
          route: "tracking",
          label: t("nav.items.trackShipments"),
          description: t("nav.items.trackShipmentsDesc"),
          icon: <Truck className="h-4 w-4 shrink-0" />,
        },
        {
          route: "weight-disputes",
          label: t("nav.items.weightDisputes"),
          description: t("nav.items.weightDisputesDesc"),
          icon: <Scale className="h-4 w-4 shrink-0" />,
        },
      ],
    },
    {
      id: "finance-group",
      buttonLabel: t("nav.groups.finance"),
      menuTitle: t("nav.groups.finance"),
      icon: <Landmark className="h-4 w-4 shrink-0" />,
      items: [
        {
          route: "wallet",
          label: t("nav.items.walletAndBalance"),
          description: t("nav.items.walletAndBalanceDesc"),
          icon: <Wallet className="h-4 w-4 shrink-0" />,
        },
        {
          route: "invoices",
          label: t("nav.items.taxInvoices"),
          description: t("nav.items.taxInvoicesDesc"),
          icon: <FileText className="h-4 w-4 shrink-0" />,
        },
      ],
    },
    {
      id: "addresses-group",
      buttonLabel: isRTL
        ? t("nav.groups.addressesAndCustomers")
        : t("nav.items.addressBook"),
      menuTitle: t("nav.groups.addressesAndCustomers"),
      icon: <BookUser className="h-4 w-4 shrink-0" />,
      items: [
        {
          route: "address-book",
          label: t("nav.items.addressBook"),
          description: t("nav.items.addressBookDesc"),
          icon: <MapPin className="h-4 w-4 shrink-0" />,
        },
        {
          route: "address-lookup",
          label: t("nav.items.shortAddressLookup"),
          description: t("nav.items.shortAddressLookupDesc"),
          icon: <ScanSearch className="h-4 w-4 shrink-0" />,
        },
        {
          route: "customers",
          label: t("nav.items.customersLog"),
          description: t("nav.items.customersLogDesc"),
          icon: <User className="h-4 w-4 shrink-0" />,
        },
      ],
    },
    {
      id: "operations-group",
      buttonLabel: isRTL
        ? t("nav.groups.operationsAndIntegrations")
        : t("dashboard.quickActions.carriers"),
      menuTitle: t("nav.groups.operationsAndIntegrations"),
      icon: <Settings2 className="h-4 w-4 shrink-0" />,
      items: [
        {
          route: "carriers",
          label: t("nav.items.carriersAndServices"),
          description: t("nav.items.carriersAndServicesDesc"),
          icon: <SlidersHorizontal className="h-4 w-4 shrink-0" />,
        },
        ...(canManageIntegrations
          ? [
              {
                route: "integrations" as RouteName,
                label: t("nav.items.integrationsHub"),
                description: t("nav.items.integrationsHubDesc"),
                icon: <Network className="h-4 w-4 shrink-0" />,
              },
            ]
          : []),
      ],
    },
  ];

  // Close open dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        closeAllMenus();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAllMenus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header
      dir={dir}
      className="sticky top-0 z-50 h-16 w-full bg-card border-b border-border shadow-sm"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-1 px-2 sm:gap-2 sm:px-4 lg:gap-3 xl:gap-4 lg:px-5">
        {/* START ZONE: Mobile Hamburger + Brand Logo */}
        <div className="flex min-w-0 items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile hamburger — opens Sheet with full nav */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8 shrink-0 p-0 sm:h-9 sm:w-9"
                aria-label={t("nav.openMenu")}
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "right" : "left"} className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{t("nav.navigationMenu")}</SheetTitle>
              </SheetHeader>
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Brand Logo — strictly non-shrinking & bounded width */}
          <button
            type="button"
            onClick={() => {
              closeAllMenus();
              navigate("dashboard");
            }}
            className="flex w-[78px] sm:w-auto min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap overflow-hidden hover:opacity-85 transition-opacity"
          >
            <img
              src="/masar-x-dashboard-logo.svg"
              alt={`${t("common.brandName")} - ${t("common.brandNameEn")}`}
              className="block h-6 w-full max-w-full sm:h-8 sm:w-auto sm:max-w-[125px] xl:h-9 xl:max-w-[150px] object-contain object-center"
              draggable={false}
            />
          </button>
        </div>

        {/* MOBILE PAGE TITLE (only visible below lg) */}
        <h1 className="lg:hidden flex-1 min-w-0 text-[13px] sm:text-base font-bold text-foreground truncate px-1 sm:px-2 text-start">
          {title}
        </h1>

        {/* CENTER ZONE (Laptop/Desktop lg+ only): Flex-1 centered navigation that never overflows into side zones */}
        <nav
          ref={navRef}
          aria-label={t("nav.mainNavigation")}
          className="hidden lg:flex flex-1 items-center justify-center gap-0.5 xl:gap-1 min-w-0"
        >
          {desktopGroups.map((group, groupIndex) => {
            // Single direct link (e.g. الرئيسية / Home)
            if (group.route && !group.items) {
              const active = isRouteActive(group.route);
              return (
                <button
                  key={group.id}
                  type="button"
                  onMouseEnter={closeAllMenus}
                  onClick={() => {
                    closeAllMenus();
                    navigate(group.route!);
                  }}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 xl:px-2.5 text-xs xl:text-[13px] font-medium whitespace-nowrap select-none transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {group.icon}
                  <span className="whitespace-nowrap">{group.buttonLabel}</span>
                </button>
              );
            }

            // Dropdown group — opens smoothly on mouse hover or click
            const subItems = group.items ?? [];
            const activeSubItem = subItems.find((sub) =>
              isRouteActive(sub.route)
            );
            const isOpen = openGroupId === group.id;
            // Anchor last 2 groups safely toward the inside of the viewport so dropdown never clips
            const isEndAlignedGroup = groupIndex >= desktopGroups.length - 2;

            return (
              <div
                key={group.id}
                className="relative shrink-0"
                onMouseEnter={() => handleGroupMouseEnter(group.id)}
                onMouseLeave={handleGroupMouseLeave}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroupId((prev) =>
                      prev === group.id ? null : group.id
                    )
                  }
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1 xl:gap-1.5 rounded-lg px-2 xl:px-2.5 text-xs xl:text-[13px] font-medium whitespace-nowrap select-none transition-colors",
                    activeSubItem || isOpen
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {group.icon}
                  <span className="whitespace-nowrap">{group.buttonLabel}</span>
                  {activeSubItem && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                      title={activeSubItem.label}
                    />
                  )}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 opacity-75 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Hover bridge wrapper — explicitly anchored with left-0 / right-0 for full LTR & RTL compatibility */}
                {isOpen && (
                  <div
                    className={cn(
                      "absolute top-full pt-2 z-[100] w-72",
                      isRTL
                        ? isEndAlignedGroup
                          ? "left-0"
                          : "right-0"
                        : isEndAlignedGroup
                          ? "right-0"
                          : "left-0"
                    )}
                  >
                    <div
                      role="menu"
                      className="w-72 rounded-2xl border border-border bg-white dark:bg-slate-900 p-2 shadow-2xl ring-1 ring-black/10"
                    >
                      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground border-b border-border/60 mb-1.5">
                        <span className="truncate">{group.menuTitle}</span>
                        {activeSubItem && (
                          <span className="text-[10px] font-bold text-primary truncate max-w-[130px] shrink-0">
                            {activeSubItem.label}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        {subItems.map((sub) => {
                          const subActive = isRouteActive(sub.route);
                          return (
                            <button
                              key={sub.route}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                closeAllMenus();
                                navigate(sub.route);
                              }}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl p-2.5 text-start transition-colors",
                                subActive
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted text-foreground"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                                  subActive
                                    ? "border-primary/20 bg-primary text-primary-foreground"
                                    : "border-border/70 bg-muted/60 text-muted-foreground"
                                )}
                              >
                                {sub.icon}
                              </div>
                              <div className="flex-1 min-w-0 text-start">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={cn(
                                      "text-xs xl:text-sm truncate block",
                                      subActive ? "font-bold" : "font-semibold"
                                    )}
                                  >
                                    {sub.label}
                                  </span>
                                  {subActive && (
                                    <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                      {t("common.active")}
                                    </span>
                                  )}
                                </div>
                                {sub.description && (
                                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground truncate">
                                    {sub.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* END ZONE: Quick Create Button + Compact Search + Language Switcher + Notifications + Profile Avatar */}
        <div className="flex items-center justify-end gap-1.5 xl:gap-2 shrink-0">
          {/* Quick CTA for Create Shipment on Laptop/Desktop */}
          <Button
            size="sm"
            onClick={() => {
              closeAllMenus();
              navigate("create-shipment");
            }}
            title={t("nav.newShipment")}
            className="hidden lg:inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 xl:px-3 text-xs font-semibold whitespace-nowrap shadow-sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden xl:inline whitespace-nowrap">
              {t("nav.newShipment")}
            </span>
          </Button>

          {/* Desktop search — explicit left/right icon positioning and bounded width so it never collides with nav */}
          <div className="hidden md:flex items-center w-28 lg:w-32 xl:w-36 focus-within:w-36 xl:focus-within:w-44 transition-all duration-200 shrink-0">
            <div className="relative w-full">
              <Search
                className={cn(
                  "pointer-events-none absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground",
                  isRTL ? "right-2.5" : "left-2.5"
                )}
              />
              <Input
                placeholder={t("nav.searchByTracking")}
                className={cn(
                  "h-9 bg-muted/40 border-transparent focus-visible:border-border text-xs w-full",
                  isRTL ? "pr-8 pl-2" : "pl-8 pr-2"
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      closeAllMenus();
                      navigate("tracking", { trackingNumber: value });
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Language Switcher — visible on BOTH Mobile (<lg) and Laptop/Desktop (lg+) */}
          <LanguageSwitcher variant="topbar" className="h-8 gap-1 px-1.5 text-[10px] sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs" />

          {/* Notifications */}
          <button
            type="button"
            onClick={() => {
              closeAllMenus();
              navigate("notifications");
            }}
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t("nav.notifications")}
          >
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Avatar */}
          <button
            type="button"
            onClick={() => {
              closeAllMenus();
              navigate("profile");
            }}
            title={user?.name ?? t("nav.myAccount")}
            className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card p-0.5 hover:bg-muted transition-colors"
            aria-label={t("nav.profile")}
          >
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
                {initials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Mobile logout */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 shrink-0 p-0 text-muted-foreground hover:text-destructive"
            onClick={logout}
            aria-label={t("nav.logout")}
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 rtl-flip" />
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Mobile nav menu — opened via hamburger Sheet.
 * Lists all routes vertically with icons + labels, plus a dedicated Language Switcher.
 * Also exported as `Sidebar` for compatibility with Topbar.tsx.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const { user, logout } = useAuth();
  const { t, dir } = useTranslation();
  const role = String(user?.role ?? "").toUpperCase();
  const canManageIntegrations =
    isDemoMode() || role === "ADMIN" || role === "SUPER_ADMIN";

  const allItems: NavItem[] = (
    [
      { route: "dashboard", label: t("nav.home"), icon: <LayoutDashboard className="h-5 w-5" /> },
      { route: "shipments", label: t("nav.shipments"), icon: <Package className="h-5 w-5" /> },
      { route: "create-shipment", label: t("nav.newShipment"), icon: <Plus className="h-5 w-5" /> },
      { route: "wallet", label: t("nav.wallet"), icon: <Wallet className="h-5 w-5" /> },
      { route: "address-book", label: t("nav.items.addressBook"), icon: <MapPin className="h-5 w-5" /> },
      { route: "address-lookup", label: t("nav.items.shortAddressLookup"), icon: <ScanSearch className="h-5 w-5" /> },
      { route: "weight-disputes", label: t("nav.items.weightDisputes"), icon: <Scale className="h-5 w-5" /> },
      { route: "carriers", label: t("nav.items.carriersAndServices"), icon: <SlidersHorizontal className="h-5 w-5" /> },
      { route: "integrations", label: t("nav.items.integrationsHub"), icon: <Network className="h-5 w-5" /> },
      { route: "customers", label: t("nav.items.customers"), icon: <User className="h-5 w-5" /> },
      { route: "invoices", label: t("nav.items.invoices"), icon: <FileText className="h-5 w-5" /> },
      { route: "tracking", label: t("nav.items.trackShipment"), icon: <Truck className="h-5 w-5" /> },
      { route: "profile", label: t("nav.profile"), icon: <User className="h-5 w-5" /> },
    ] as NavItem[]
  ).filter((item) => canManageIntegrations || item.route !== "integrations");

  return (
    <div dir={dir} className="flex h-full flex-col bg-sidebar">
      {/* Logo header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Logo size={32} />
      </div>

      {/* User card */}
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-accent p-3">
          <Avatar className="h-10 w-10 shrink-0 border border-sidebar-border">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-start">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? t("nav.masarUser")}
            </p>
            <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
              {user?.phone ?? ""}
            </p>
          </div>
        </div>

        {/* Dedicated mobile drawer language switcher */}
        <LanguageSwitcher variant="sidebar" />
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
                onNavigate?.();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <span className={cn("shrink-0", active ? "" : "text-muted-foreground")}>
                {item.icon}
              </span>
              <span className="flex-1 text-start truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0 rtl-flip" />
          <span className="flex-1 text-start">{t("nav.logout")}</span>
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
  const { t, dir } = useTranslation();

  const bottomNavItems: NavItem[] = [
    { route: "dashboard", label: t("nav.home"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { route: "shipments", label: t("nav.myShipments"), icon: <Package className="h-5 w-5" /> },
    { route: "create-shipment", label: t("nav.shipmentShort"), icon: <Plus className="h-6 w-6" /> },
    { route: "wallet", label: t("nav.wallet"), icon: <Wallet className="h-5 w-5" /> },
    { route: "profile", label: t("nav.myAccount"), icon: <User className="h-5 w-5" /> },
  ];

  return (
    <nav
      dir={dir}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(15,23,42,0.05)] safe-area-bottom"
    >
      <div className="grid grid-cols-5 h-16">
        {bottomNavItems.map((item, idx) => {
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
                  ? "text-emerald-600"
                  : active
                    ? "text-emerald-600"
                    : "text-muted-foreground"
              )}
            >
              {isCenter ? (
                <div
                  className="relative -mt-6 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-white ring-4 ring-card transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, #0D5B43 0%, #13865B 52%, #24A875 100%)",
                    boxShadow:
                      "0 8px 20px -6px rgba(13, 107, 76, 0.58), inset 0 1px 0 rgba(255,255,255,0.28)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.28), transparent 48%)",
                    }}
                  />
                  <span className="relative z-10">{item.icon}</span>
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
              {!isCenter && <span className="truncate max-w-full px-1">{item.label}</span>}
              {active && !isCenter && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}