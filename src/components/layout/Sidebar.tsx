// // "use client";

// // import {
// //   LayoutDashboard,
// //   Package,
// //   Plus,
// //   Wallet,
// //   User,
// //   Search,
// //   Bell,
// //   Menu,
// //   X,
// //   LogOut,
// //   MapPin,
// //   FileText,
// //   Truck,
// //   ScanSearch,
// //   Scale,
// //   Network,
// //   SlidersHorizontal,
// // } from "lucide-react";
// // import { Logo, LogoMark } from "@/components/brand/Logo";
// // import { cn } from "@/lib/utils";
// // import { useRouterStore, type RouteName } from "@/store/routerStore";
// // import { useAuth } from "@/hooks/useAuth";
// // import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// // import { Badge } from "@/components/ui/badge";
// // import { Input } from "@/components/ui/input";
// // import { Button } from "@/components/ui/button";
// // import {
// //   Sheet,
// //   SheetContent,
// //   SheetTrigger,
// //   SheetTitle,
// //   SheetHeader,
// // } from "@/components/ui/sheet";
// // import { initials } from "@/lib/format";
// // import { useNotifications } from "@/hooks/useData";
// // import { isDemoMode } from "@/lib/api/services";
// // import { useState } from "react";

// // interface NavItem {
// //   route: RouteName;
// //   label: string;
// //   icon: React.ReactNode;
// // }

// // /** Desktop horizontal nav items — shown inline in topbar (lg+ only). */
// // const DESKTOP_NAV: NavItem[] = [
// //   { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-4 w-4" /> },
// //   { route: "shipments", label: "الشحنات", icon: <Package className="h-4 w-4" /> },
// //   { route: "create-shipment", label: "شحنة جديدة", icon: <Plus className="h-4 w-4" /> },
// //   { route: "wallet", label: "المحفظة", icon: <Wallet className="h-4 w-4" /> },
// //   { route: "address-book", label: "العناوين", icon: <MapPin className="h-4 w-4" /> },
// //   { route: "invoices", label: "الفواتير", icon: <FileText className="h-4 w-4" /> },
// //   { route: "tracking", label: "التتبّع", icon: <Truck className="h-4 w-4" /> },
// //   { route: "address-lookup", label: "العنوان المختصر", icon: <ScanSearch className="h-4 w-4" /> },
// //   { route: "weight-disputes", label: "اعتراضات الوزن", icon: <Scale className="h-4 w-4" /> },
// //   { route: "carriers", label: "شركات الشحن", icon: <SlidersHorizontal className="h-4 w-4" /> },
// //   { route: "integrations", label: "التكاملات", icon: <Network className="h-4 w-4" /> },
// // ];

// // /** Mobile bottom nav — 5 buttons with center + FAB. */
// // const BOTTOM_NAV_ITEMS: NavItem[] = [
// //   { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
// //   { route: "shipments", label: "شحناتي", icon: <Package className="h-5 w-5" /> },
// //   { route: "create-shipment", label: "شحنة", icon: <Plus className="h-6 w-6" /> },
// //   { route: "wallet", label: "المحفظة", icon: <Wallet className="h-5 w-5" /> },
// //   { route: "profile", label: "حسابي", icon: <User className="h-5 w-5" /> },
// // ];

// // /**
// //  * Topbar — single horizontal bar (no sidebar).
// //  *
// //  * Desktop (lg+): Logo | inline nav items | spacer | search | notifications | avatar
// //  * Mobile: Hamburger | page title | notifications | avatar
// //  */
// // export function Topbar({ title }: { title: string }) {
// //   const route = useRouterStore((s) => s.route);
// //   const navigate = useRouterStore((s) => s.navigate);
// //   const { user, logout } = useAuth();
// //   const { list: notifs } = useNotifications(useAuth().token);
// //   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// //   const unread = notifs.filter((n) => !(n.read ?? n.isRead)).length;
// //   const role = String(user?.role ?? "").toUpperCase();
// //   const canManageIntegrations = isDemoMode() || role === "ADMIN" || role === "SUPER_ADMIN";
// //   const visibleDesktopNav = canManageIntegrations ? DESKTOP_NAV : DESKTOP_NAV.filter((item) => item.route !== "integrations");

// //   return (
// //     <header className="sticky top-0 z-30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 border-b border-border shadow-card-soft">
// //       {/* Top row — universal */}
// //       <div className="flex h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6">
// //         {/* Mobile hamburger — opens Sheet with full nav */}
// //         <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
// //           <SheetTrigger asChild>
// //             <Button
// //               variant="ghost"
// //               size="icon"
// //               className="lg:hidden"
// //               aria-label="فتح القائمة"
// //             >
// //               <Menu className="h-5 w-5" />
// //             </Button>
// //           </SheetTrigger>
// //           <SheetContent side="right" className="w-72 p-0">
// //             <SheetHeader className="sr-only">
// //               <SheetTitle>قائمة التنقّل</SheetTitle>
// //             </SheetHeader>
// //             <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
// //           </SheetContent>
// //         </Sheet>

// //         {/* Logo — always visible */}
// //         <button
// //           type="button"
// //           onClick={() => navigate("dashboard")}
// //           className="flex items-center gap-2 hover:opacity-80 transition-opacity"
// //         >
// //           <LogoMark size={36} />
// //           <div className="hidden sm:flex flex-col leading-none">
// //             <span className="text-sm font-extrabold text-foreground">مسار إكس</span>
// //             <span className="text-[9px] font-medium tracking-[0.2em] text-muted-foreground">
// //               MASAR X
// //             </span>
// //           </div>
// //         </button>

// //         {/* Page title — mobile only */}
// //         <h1 className="lg:hidden flex-1 text-base font-bold text-foreground truncate pr-2">
// //           {title}
// //         </h1>

// //         {/* Desktop inline nav items */}
// //         <nav className="hidden lg:flex max-w-[62vw] items-center gap-1 mr-4 overflow-x-auto scrollbar-thin">
// //           {visibleDesktopNav.map((item) => {
// //             const active =
// //               route === item.route ||
// //               (item.route === "shipments" && route === "shipment-details");
// //             return (
// //               <button
// //                 key={item.route}
// //                 type="button"
// //                 onClick={() => navigate(item.route)}
// //                 className={cn(
// //                   "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
// //                   active
// //                     ? "bg-primary/10 text-primary"
// //                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
// //                 )}
// //               >
// //                 {item.icon}
// //                 <span>{item.label}</span>
// //               </button>
// //             );
// //           })}
// //         </nav>

// //         {/* Spacer */}
// //         <div className="flex-1 hidden lg:block" />

// //         {/* Desktop search */}
// //         <div className="hidden md:flex items-center w-48 lg:w-64">
// //           <div className="relative w-full">
// //             <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //             <Input
// //               placeholder="بحث…"
// //               className="pr-9 h-9 bg-muted/40 border-transparent focus-visible:border-border text-sm"
// //               onKeyDown={(e) => {
// //                 if (e.key === "Enter") {
// //                   const value = (e.target as HTMLInputElement).value.trim();
// //                   if (value) navigate("tracking", { trackingNumber: value });
// //                 }
// //               }}
// //             />
// //           </div>
// //         </div>

// //         {/* Notifications */}
// //         <button
// //           type="button"
// //           onClick={() => navigate("notifications")}
// //           className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
// //           aria-label="الإشعارات"
// //         >
// //           <Bell className="h-4 w-4" />
// //           {unread > 0 && (
// //             <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
// //               {unread > 9 ? "9+" : unread}
// //             </span>
// //           )}
// //         </button>

// //         {/* Avatar */}
// //         <button
// //           type="button"
// //           onClick={() => navigate("profile")}
// //           className="flex items-center gap-2 rounded-full border border-border bg-card hover:bg-muted transition-colors"
// //           aria-label="الملف الشخصي"
// //         >
// //           <Avatar className="h-8 w-8">
// //             <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
// //               {initials(user?.name)}
// //             </AvatarFallback>
// //           </Avatar>
// //         </button>

// //         {/* Mobile logout */}
// //         <Button
// //           variant="ghost"
// //           size="icon"
// //           className="lg:hidden text-muted-foreground hover:text-destructive"
// //           onClick={logout}
// //           aria-label="تسجيل الخروج"
// //         >
// //           <LogOut className="h-5 w-5 rtl-flip" />
// //         </Button>
// //       </div>
// //     </header>
// //   );
// // }

// // /**
// //  * Mobile nav menu — opened via hamburger Sheet.
// //  * Lists all routes vertically with icons + labels.
// //  * Also exported as `Sidebar` for compatibility with Topbar.tsx.
// //  */
// // export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
// //   const route = useRouterStore((s) => s.route);
// //   const navigate = useRouterStore((s) => s.navigate);
// //   const { user, logout } = useAuth();
// //   const role = String(user?.role ?? "").toUpperCase();
// //   const canManageIntegrations = isDemoMode() || role === "ADMIN" || role === "SUPER_ADMIN";

// //   const allItems: NavItem[] = ([
// //     { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
// //     { route: "shipments", label: "الشحنات", icon: <Package className="h-5 w-5" /> },
// //     { route: "create-shipment", label: "شحنة جديدة", icon: <Plus className="h-5 w-5" /> },
// //     { route: "wallet", label: "المحفظة", icon: <Wallet className="h-5 w-5" /> },
// //     { route: "address-book", label: "دفتر العناوين", icon: <MapPin className="h-5 w-5" /> },
// //     { route: "address-lookup", label: "جلب العنوان المختصر", icon: <ScanSearch className="h-5 w-5" /> },
// //     { route: "weight-disputes", label: "اعتراضات الوزن", icon: <Scale className="h-5 w-5" /> },
// //     { route: "carriers", label: "شركات الشحن والخدمات", icon: <SlidersHorizontal className="h-5 w-5" /> },
// //     { route: "integrations", label: "مركز التكاملات", icon: <Network className="h-5 w-5" /> },
// //     { route: "customers", label: "العملاء", icon: <User className="h-5 w-5" /> },
// //     { route: "invoices", label: "الفواتير", icon: <FileText className="h-5 w-5" /> },
// //     { route: "tracking", label: "تتبّع شحنة", icon: <Truck className="h-5 w-5" /> },
// //     { route: "profile", label: "الملف الشخصي", icon: <User className="h-5 w-5" /> },
// //   ] as NavItem[]).filter((item) => canManageIntegrations || item.route !== "integrations");

// //   return (
// //     <div className="flex h-full flex-col bg-sidebar">
// //       {/* Logo header */}
// //       <div className="flex h-16 items-center border-b border-sidebar-border px-4">
// //         <Logo size={32} />
// //       </div>

// //       {/* User card */}
// //       <div className="p-4 border-b border-sidebar-border">
// //         <div className="flex items-center gap-3 rounded-xl bg-accent p-3">
// //           <Avatar className="h-10 w-10 border border-sidebar-border">
// //             <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
// //               {initials(user?.name)}
// //             </AvatarFallback>
// //           </Avatar>
// //           <div className="flex-1 min-w-0 text-right">
// //             <p className="truncate text-sm font-semibold text-foreground">
// //               {user?.name ?? "مستخدم مسار"}
// //             </p>
// //             <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
// //               {user?.phone ?? ""}
// //             </p>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Nav */}
// //       <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1">
// //         {allItems.map((item) => {
// //           const active =
// //             route === item.route ||
// //             (item.route === "shipments" && route === "shipment-details");
// //           return (
// //             <button
// //               key={item.route}
// //               type="button"
// //               onClick={() => {
// //                 navigate(item.route);
// //                 onNavigate?.();
// //               }}
// //               className={cn(
// //                 "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
// //                 active
// //                   ? "bg-primary text-primary-foreground"
// //                   : "text-sidebar-foreground hover:bg-sidebar-accent"
// //               )}
// //             >
// //               <span className={active ? "" : "text-muted-foreground"}>
// //                 {item.icon}
// //               </span>
// //               <span className="flex-1 text-right">{item.label}</span>
// //             </button>
// //           );
// //         })}
// //       </nav>

// //       {/* Logout */}
// //       <div className="border-t border-sidebar-border p-3">
// //         <button
// //           type="button"
// //           onClick={() => {
// //             onNavigate?.();
// //             logout();
// //           }}
// //           className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
// //         >
// //           <LogOut className="h-5 w-5 rtl-flip" />
// //           <span className="flex-1 text-right">تسجيل الخروج</span>
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

// // /**
// //  * Bottom navigation bar — mobile only.
// //  * 5 buttons with center + FAB-style. Matches brand reference.
// //  */
// // export function BottomNav() {
// //   const route = useRouterStore((s) => s.route);
// //   const navigate = useRouterStore((s) => s.navigate);

// //   return (
// //     <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(15,23,42,0.05)] safe-area-bottom">
// //       <div className="grid grid-cols-5 h-16">
// //         {BOTTOM_NAV_ITEMS.map((item, idx) => {
// //           const isCenter = idx === 2; // The "+" create button
// //           const active =
// //             route === item.route ||
// //             (item.route === "shipments" && route === "shipment-details");
// //           return (
// //             <button
// //               key={item.route}
// //               type="button"
// //               onClick={() => navigate(item.route)}
// //               className={cn(
// //                 "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative",
// //                 isCenter
// //                   ? "text-emerald-600"
// //                   : active
// //                   ? "text-emerald-600"
// //                   : "text-muted-foreground"
// //               )}
// //             >
// //               {isCenter ? (
// //                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-emerald -mt-6 ring-4 ring-card">
// //                   {item.icon}
// //                 </div>
// //               ) : (
// //                 <span
// //                   className={cn(
// //                     "transition-transform",
// //                     active && "scale-110"
// //                   )}
// //                 >
// //                   {item.icon}
// //                 </span>
// //               )}
// //               {!isCenter && <span>{item.label}</span>}
// //               {active && !isCenter && (
// //                 <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
// //               )}
// //             </button>
// //           );
// //         })}
// //       </div>
// //     </nav>
// //   );
// // }



// "use client";

// import {
//   LayoutDashboard,
//   Package,
//   Plus,
//   Wallet,
//   User,
//   Search,
//   Bell,
//   Menu,
//   LogOut,
//   MapPin,
//   FileText,
//   Truck,
//   ScanSearch,
//   Scale,
//   Network,
//   SlidersHorizontal,
//   ChevronDown,
//   MoreHorizontal,
// } from "lucide-react";
// import { Logo, LogoMark } from "@/components/brand/Logo";
// import { cn } from "@/lib/utils";
// import { useRouterStore, type RouteName } from "@/store/routerStore";
// import { useAuth } from "@/hooks/useAuth";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   Sheet,
//   SheetContent,
//   SheetTrigger,
//   SheetTitle,
//   SheetHeader,
// } from "@/components/ui/sheet";
// import { initials } from "@/lib/format";
// import { useNotifications } from "@/hooks/useData";
// import { isDemoMode } from "@/lib/api/services";
// import { useState, useRef, useEffect } from "react";

// export interface NavItem {
//   route: RouteName;
//   label: string;
//   icon: React.ReactNode;
//   /**
//    * Controls when the item appears inline on desktop before collapsing into "المزيد":
//    * - "lg": Always visible inline on laptop/desktop (lg+)
//    * - "xl": Visible inline on xl+ screens; collapses into "المزيد" on lg
//    * - "2xl": Visible inline on 2xl+ screens; collapses into "المزيد" on lg/xl
//    * - "more": Always placed inside the "المزيد" dropdown on desktop
//    */
//   desktopVisibility?: "lg" | "xl" | "2xl" | "more";
// }

// /**
//  * Desktop navigation items with smart responsive collapsing rules.
//  * Keeps the topbar strictly centered and prevents any text wrapping or stretching.
//  */
// const DESKTOP_NAV: NavItem[] = [
//   {
//     route: "dashboard",
//     label: "الرئيسية",
//     icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "lg",
//   },
//   {
//     route: "shipments",
//     label: "الشحنات",
//     icon: <Package className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "lg",
//   },
//   {
//     route: "create-shipment",
//     label: "شحنة جديدة",
//     icon: <Plus className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "lg",
//   },
//   {
//     route: "wallet",
//     label: "المحفظة",
//     icon: <Wallet className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "lg",
//   },
//   {
//     route: "tracking",
//     label: "التتبّع",
//     icon: <Truck className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "lg",
//   },
//   {
//     route: "invoices",
//     label: "الفواتير",
//     icon: <FileText className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "xl",
//   },
//   {
//     route: "address-book",
//     label: "العناوين",
//     icon: <MapPin className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "2xl",
//   },
//   {
//     route: "address-lookup",
//     label: "العنوان المختصر",
//     icon: <ScanSearch className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "more",
//   },
//   {
//     route: "weight-disputes",
//     label: "اعتراضات الوزن",
//     icon: <Scale className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "more",
//   },
//   {
//     route: "carriers",
//     label: "شركات الشحن",
//     icon: <SlidersHorizontal className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "more",
//   },
//   {
//     route: "customers",
//     label: "العملاء",
//     icon: <User className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "more",
//   },
//   {
//     route: "integrations",
//     label: "التكاملات",
//     icon: <Network className="h-4 w-4 shrink-0" />,
//     desktopVisibility: "more",
//   },
// ];

// /** Mobile bottom nav — 5 buttons with center + FAB. */
// const BOTTOM_NAV_ITEMS: NavItem[] = [
//   { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
//   { route: "shipments", label: "شحناتي", icon: <Package className="h-5 w-5" /> },
//   { route: "create-shipment", label: "شحنة", icon: <Plus className="h-6 w-6" /> },
//   { route: "wallet", label: "المحفظة", icon: <Wallet className="h-5 w-5" /> },
//   { route: "profile", label: "حسابي", icon: <User className="h-5 w-5" /> },
// ];

// export interface TopbarProps {
//   title: string;
//   onToggleSidebar?: () => void;
// }

// /**
//  * Topbar — disciplined, non-stretching horizontal bar with centered desktop navigation.
//  *
//  * Desktop (lg+): 3-column grid [Logo (Right) | Centered Nav + Smart "More" Menu (Center) | Search + Actions (Left)]
//  * Mobile (<lg): Hamburger | Page Title | Notifications | Avatar | Logout
//  */
// export function Topbar({ title }: TopbarProps) {
//   const route = useRouterStore((s) => s.route);
//   const navigate = useRouterStore((s) => s.navigate);
//   const { user, token, logout } = useAuth();
//   const { list: notifs } = useNotifications(token);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [moreMenuOpen, setMoreMenuOpen] = useState(false);
//   const moreMenuRef = useRef<HTMLDivElement>(null);

//   const unread = notifs.filter((n) => !(n.read ?? n.isRead)).length;
//   const role = String(user?.role ?? "").toUpperCase();
//   const canManageIntegrations =
//     isDemoMode() || role === "ADMIN" || role === "SUPER_ADMIN";

//   const visibleDesktopNav = canManageIntegrations
//     ? DESKTOP_NAV
//     : DESKTOP_NAV.filter((item) => item.route !== "integrations");

//   const inlineItems = visibleDesktopNav.filter(
//     (item) => item.desktopVisibility !== "more"
//   );
//   const overflowItems = visibleDesktopNav.filter(
//     (item) => item.desktopVisibility !== "lg"
//   );

//   const isRouteActive = (itemRoute: RouteName) =>
//     route === itemRoute ||
//     (itemRoute === "shipments" && route === "shipment-details");

//   // Check if any route inside the "More" menu is currently active
//   const activeOverflowItem = overflowItems.find((item) =>
//     isRouteActive(item.route)
//   );

//   // Close the "More" dropdown on outside click or Escape key
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (
//         moreMenuRef.current &&
//         !moreMenuRef.current.contains(event.target as Node)
//       ) {
//         setMoreMenuOpen(false);
//       }
//     }
//     function handleKeyDown(event: KeyboardEvent) {
//       if (event.key === "Escape") {
//         setMoreMenuOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     document.addEventListener("keydown", handleKeyDown);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, []);

//   return (
//     <header className="sticky top-0 z-30 h-16 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 border-b border-border shadow-card-soft">
//       <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4 lg:px-6">
//         {/* RIGHT ZONE: Mobile Hamburger + Brand Logo */}
//         <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
//           {/* Mobile hamburger — opens Sheet with full nav */}
//           <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
//             <SheetTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="lg:hidden shrink-0"
//                 aria-label="فتح القائمة"
//               >
//                 <Menu className="h-5 w-5" />
//               </Button>
//             </SheetTrigger>
//             <SheetContent side="right" className="w-72 p-0">
//               <SheetHeader className="sr-only">
//                 <SheetTitle>قائمة التنقّل</SheetTitle>
//               </SheetHeader>
//               <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
//             </SheetContent>
//           </Sheet>

//           {/* Brand Logo — strictly non-shrinking & non-wrapping */}
//           <button
//             type="button"
//             onClick={() => navigate("dashboard")}
//             className="flex shrink-0 items-center gap-2.5 whitespace-nowrap hover:opacity-85 transition-opacity"
//           >
//             <LogoMark size={36} />
//             <div className="hidden sm:flex flex-col items-start leading-none whitespace-nowrap">
//               <span className="text-sm font-extrabold text-foreground whitespace-nowrap">
//                 مسار إكس
//               </span>
//               <span className="mt-0.5 text-[9px] font-medium tracking-[0.2em] text-muted-foreground whitespace-nowrap">
//                 MASAR X
//               </span>
//             </div>
//           </button>
//         </div>

//         {/* MOBILE PAGE TITLE (only visible below lg) */}
//         <h1 className="lg:hidden flex-1 min-w-0 text-base font-bold text-foreground truncate px-2">
//           {title}
//         </h1>

//         {/* CENTER ZONE (Desktop lg+): Perfectly centered, non-stretching navigation */}
//         <nav
//           aria-label="التنقل الرئيسي"
//           className="hidden lg:flex items-center justify-center justify-self-center gap-1 min-w-0 max-w-full"
//         >
//           {inlineItems.map((item) => {
//             const active = isRouteActive(item.route);
//             const visibilityClass =
//               item.desktopVisibility === "xl"
//                 ? "hidden xl:inline-flex"
//                 : item.desktopVisibility === "2xl"
//                 ? "hidden 2xl:inline-flex"
//                 : "inline-flex";

//             return (
//               <button
//                 key={item.route}
//                 type="button"
//                 onClick={() => navigate(item.route)}
//                 className={cn(
//                   visibilityClass,
//                   "h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 xl:px-3 text-xs xl:text-sm font-medium whitespace-nowrap select-none transition-colors",
//                   active
//                     ? "bg-primary/10 text-primary font-semibold"
//                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
//                 )}
//               >
//                 {item.icon}
//                 <span className="whitespace-nowrap">{item.label}</span>
//               </button>
//             );
//           })}

//           {/* Smart "More" (المزيد) dropdown for secondary & responsively collapsed items */}
//           <div ref={moreMenuRef} className="relative shrink-0">
//             <button
//               type="button"
//               onClick={() => setMoreMenuOpen((prev) => !prev)}
//               aria-expanded={moreMenuOpen}
//               aria-haspopup="menu"
//               className={cn(
//                 "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 xl:px-3 text-xs xl:text-sm font-medium whitespace-nowrap select-none transition-colors",
//                 activeOverflowItem || moreMenuOpen
//                   ? "bg-primary/10 text-primary font-semibold"
//                   : "text-muted-foreground hover:bg-muted hover:text-foreground"
//               )}
//             >
//               <MoreHorizontal className="h-4 w-4 shrink-0" />
//               <span className="whitespace-nowrap">المزيد</span>
//               {activeOverflowItem && (
//                 <span
//                   className={cn(
//                     "max-w-[96px] truncate rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary",
//                     activeOverflowItem.desktopVisibility === "xl" && "xl:hidden",
//                     activeOverflowItem.desktopVisibility === "2xl" && "2xl:hidden"
//                   )}
//                 >
//                   {activeOverflowItem.label}
//                 </span>
//               )}
//               <ChevronDown
//                 className={cn(
//                   "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
//                   moreMenuOpen && "rotate-180"
//                 )}
//               />
//             </button>

//             {moreMenuOpen && (
//               <div
//                 role="menu"
//                 className="absolute left-0 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg ring-1 ring-black/5 z-50"
//               >
//                 {overflowItems.map((item) => {
//                   const active = isRouteActive(item.route);
//                   // Hide items from dropdown if they are already visible inline at the current breakpoint
//                   const dropdownVisibilityClass =
//                     item.desktopVisibility === "xl"
//                       ? "flex xl:hidden"
//                       : item.desktopVisibility === "2xl"
//                       ? "flex 2xl:hidden"
//                       : "flex";

//                   return (
//                     <button
//                       key={item.route}
//                       type="button"
//                       role="menuitem"
//                       onClick={() => {
//                         navigate(item.route);
//                         setMoreMenuOpen(false);
//                       }}
//                       className={cn(
//                         dropdownVisibilityClass,
//                         "w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs xl:text-sm font-medium whitespace-nowrap transition-colors",
//                         active
//                           ? "bg-primary/10 text-primary font-semibold"
//                           : "text-foreground/80 hover:bg-muted hover:text-foreground"
//                       )}
//                     >
//                       <span
//                         className={cn(
//                           "shrink-0",
//                           active ? "text-primary" : "text-muted-foreground"
//                         )}
//                       >
//                         {item.icon}
//                       </span>
//                       <span className="flex-1 text-right truncate">
//                         {item.label}
//                       </span>
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         </nav>

//         {/* LEFT ZONE: Compact Search + Notifications + Profile Avatar */}
//         <div className="flex items-center justify-end gap-2 shrink-0">
//           {/* Desktop search — compact width on laptop, expands smoothly on focus */}
//           <div className="hidden md:flex items-center w-36 lg:w-40 xl:w-48 focus-within:w-48 xl:focus-within:w-60 transition-all duration-200 shrink-0">
//             <div className="relative w-full">
//               <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="بحث برقم التتبّع…"
//                 className="pr-9 h-9 bg-muted/40 border-transparent focus-visible:border-border text-xs xl:text-sm w-full"
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     const value = (e.target as HTMLInputElement).value.trim();
//                     if (value) navigate("tracking", { trackingNumber: value });
//                   }
//                 }}
//               />
//             </div>
//           </div>

//           {/* Notifications */}
//           <button
//             type="button"
//             onClick={() => navigate("notifications")}
//             className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
//             aria-label="الإشعارات"
//           >
//             <Bell className="h-4 w-4 shrink-0" />
//             {unread > 0 && (
//               <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
//                 {unread > 9 ? "9+" : unread}
//               </span>
//             )}
//           </button>

//           {/* Avatar */}
//           <button
//             type="button"
//             onClick={() => navigate("profile")}
//             className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card p-0.5 xl:pl-2.5 hover:bg-muted transition-colors"
//             aria-label="الملف الشخصي"
//           >
//             <Avatar className="h-8 w-8 shrink-0">
//               <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
//                 {initials(user?.name)}
//               </AvatarFallback>
//             </Avatar>
//             <span className="hidden xl:inline-block max-w-[88px] truncate text-xs font-medium text-foreground">
//               {user?.name ?? "حسابي"}
//             </span>
//           </button>

//           {/* Mobile logout */}
//           <Button
//             variant="ghost"
//             size="icon"
//             className="lg:hidden shrink-0 text-muted-foreground hover:text-destructive"
//             onClick={logout}
//             aria-label="تسجيل الخروج"
//           >
//             <LogOut className="h-5 w-5 rtl-flip" />
//           </Button>
//         </div>
//       </div>
//     </header>
//   );
// }

// /**
//  * Mobile nav menu — opened via hamburger Sheet.
//  * Lists all routes vertically with icons + labels.
//  * Also exported as `Sidebar` for compatibility with Topbar.tsx.
//  */
// export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
//   const route = useRouterStore((s) => s.route);
//   const navigate = useRouterStore((s) => s.navigate);
//   const { user, logout } = useAuth();
//   const role = String(user?.role ?? "").toUpperCase();
//   const canManageIntegrations =
//     isDemoMode() || role === "ADMIN" || role === "SUPER_ADMIN";

//   const allItems: NavItem[] = (
//     [
//       { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
//       { route: "shipments", label: "الشحنات", icon: <Package className="h-5 w-5" /> },
//       { route: "create-shipment", label: "شحنة جديدة", icon: <Plus className="h-5 w-5" /> },
//       { route: "wallet", label: "المحفظة", icon: <Wallet className="h-5 w-5" /> },
//       { route: "address-book", label: "دفتر العناوين", icon: <MapPin className="h-5 w-5" /> },
//       { route: "address-lookup", label: "جلب العنوان المختصر", icon: <ScanSearch className="h-5 w-5" /> },
//       { route: "weight-disputes", label: "اعتراضات الوزن", icon: <Scale className="h-5 w-5" /> },
//       { route: "carriers", label: "شركات الشحن والخدمات", icon: <SlidersHorizontal className="h-5 w-5" /> },
//       { route: "integrations", label: "مركز التكاملات", icon: <Network className="h-5 w-5" /> },
//       { route: "customers", label: "العملاء", icon: <User className="h-5 w-5" /> },
//       { route: "invoices", label: "الفواتير", icon: <FileText className="h-5 w-5" /> },
//       { route: "tracking", label: "تتبّع شحنة", icon: <Truck className="h-5 w-5" /> },
//       { route: "profile", label: "الملف الشخصي", icon: <User className="h-5 w-5" /> },
//     ] as NavItem[]
//   ).filter((item) => canManageIntegrations || item.route !== "integrations");

//   return (
//     <div className="flex h-full flex-col bg-sidebar">
//       {/* Logo header */}
//       <div className="flex h-16 items-center border-b border-sidebar-border px-4">
//         <Logo size={32} />
//       </div>

//       {/* User card */}
//       <div className="p-4 border-b border-sidebar-border">
//         <div className="flex items-center gap-3 rounded-xl bg-accent p-3">
//           <Avatar className="h-10 w-10 shrink-0 border border-sidebar-border">
//             <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
//               {initials(user?.name)}
//             </AvatarFallback>
//           </Avatar>
//           <div className="flex-1 min-w-0 text-right">
//             <p className="truncate text-sm font-semibold text-foreground">
//               {user?.name ?? "مستخدم مسار"}
//             </p>
//             <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
//               {user?.phone ?? ""}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1">
//         {allItems.map((item) => {
//           const active =
//             route === item.route ||
//             (item.route === "shipments" && route === "shipment-details");
//           return (
//             <button
//               key={item.route}
//               type="button"
//               onClick={() => {
//                 navigate(item.route);
//                 onNavigate?.();
//               }}
//               className={cn(
//                 "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
//                 active
//                   ? "bg-primary text-primary-foreground"
//                   : "text-sidebar-foreground hover:bg-sidebar-accent"
//               )}
//             >
//               <span className={cn("shrink-0", active ? "" : "text-muted-foreground")}>
//                 {item.icon}
//               </span>
//               <span className="flex-1 text-right truncate">{item.label}</span>
//             </button>
//           );
//         })}
//       </nav>

//       {/* Logout */}
//       <div className="border-t border-sidebar-border p-3">
//         <button
//           type="button"
//           onClick={() => {
//             onNavigate?.();
//             logout();
//           }}
//           className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
//         >
//           <LogOut className="h-5 w-5 shrink-0 rtl-flip" />
//           <span className="flex-1 text-right">تسجيل الخروج</span>
//         </button>
//       </div>
//     </div>
//   );
// }

// /**
//  * Bottom navigation bar — mobile only.
//  * 5 buttons with center + FAB-style. Matches brand reference.
//  */
// export function BottomNav() {
//   const route = useRouterStore((s) => s.route);
//   const navigate = useRouterStore((s) => s.navigate);

//   return (
//     <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(15,23,42,0.05)] safe-area-bottom">
//       <div className="grid grid-cols-5 h-16">
//         {BOTTOM_NAV_ITEMS.map((item, idx) => {
//           const isCenter = idx === 2; // The "+" create button
//           const active =
//             route === item.route ||
//             (item.route === "shipments" && route === "shipment-details");
//           return (
//             <button
//               key={item.route}
//               type="button"
//               onClick={() => navigate(item.route)}
//               className={cn(
//                 "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative",
//                 isCenter
//                   ? "text-emerald-600"
//                   : active
//                   ? "text-emerald-600"
//                   : "text-muted-foreground"
//               )}
//             >
//               {isCenter ? (
//                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-emerald -mt-6 ring-4 ring-card">
//                   {item.icon}
//                 </div>
//               ) : (
//                 <span
//                   className={cn(
//                     "transition-transform",
//                     active && "scale-110"
//                   )}
//                 >
//                   {item.icon}
//                 </span>
//               )}
//               {!isCenter && <span className="truncate max-w-full px-1">{item.label}</span>}
//               {active && !isCenter && (
//                 <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
//               )}
//             </button>
//           );
//         })}
//       </div>
//     </nav>
//   );
// }




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
import { Logo, LogoMark } from "@/components/brand/Logo";
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
import { useState, useRef, useEffect } from "react";

export interface NavItem {
  route: RouteName;
  label: string;
  description?: string;
  icon: React.ReactNode;
}

export interface DesktopNavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Direct route if this item is a single link (e.g. Dashboard) */
  route?: RouteName;
  /** Dropdown sub-items if this is a grouped category */
  items?: NavItem[];
}

/** Mobile bottom nav — 5 buttons with center + FAB. */
const BOTTOM_NAV_ITEMS: NavItem[] = [
  { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
  { route: "shipments", label: "شحناتي", icon: <Package className="h-5 w-5" /> },
  { route: "create-shipment", label: "شحنة", icon: <Plus className="h-6 w-6" /> },
  { route: "wallet", label: "المحفظة", icon: <Wallet className="h-5 w-5" /> },
  { route: "profile", label: "حسابي", icon: <User className="h-5 w-5" /> },
];

export interface TopbarProps {
  title: string;
  onToggleSidebar?: () => void;
}

/**
 * Topbar — collision-free 3-column desktop bar with hover-triggered dropdown menus (lg+ only).
 *
 * Desktop (lg+):
 *   Right: Brand Logo (fixed, non-shrinking)
 *   Center: 5 concise main headings that open smoothly on mouse hover (with hover bridge)
 *   Left: Quick "+ شحنة جديدة" CTA | Expandable Search | Notifications | Profile
 *
 * Mobile (<lg):
 *   Hamburger Sheet | Page Title | Notifications | Avatar | Logout
 */
export function Topbar({ title }: TopbarProps) {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const { user, token, logout } = useAuth();
  const { list: notifs } = useNotifications(token);
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
   * Concise titles prevent any horizontal crowding or overlap on 1024px+ laptops.
   */
  const desktopGroups: DesktopNavGroup[] = [
    {
      id: "home",
      label: "الرئيسية",
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
      route: "dashboard",
    },
    {
      id: "shipments-group",
      label: "الشحنات",
      icon: <Boxes className="h-4 w-4 shrink-0" />,
      items: [
        {
          route: "shipments",
          label: "سجل الشحنات",
          description: "عرض وإدارة جميع البوالص والحالات",
          icon: <Package className="h-4 w-4 shrink-0" />,
        },
        {
          route: "create-shipment",
          label: "إنشاء شحنة جديدة",
          description: "إصدار بوليصة شحن سريعة خطوة بخطوة",
          icon: <Plus className="h-4 w-4 shrink-0" />,
        },
        {
          route: "tracking",
          label: "تتبّع الشحنات",
          description: "متابعة مسار وحالة الشحنة لحظياً",
          icon: <Truck className="h-4 w-4 shrink-0" />,
        },
        {
          route: "weight-disputes",
          label: "اعتراضات الوزن",
          description: "مراجعة ومطالبات فروقات الأوزان",
          icon: <Scale className="h-4 w-4 shrink-0" />,
        },
      ],
    },
    {
      id: "finance-group",
      label: "المالية",
      icon: <Landmark className="h-4 w-4 shrink-0" />,
      items: [
        {
          route: "wallet",
          label: "المحفظة والرصيد",
          description: "شحن الرصيد وسجل العمليات المالية",
          icon: <Wallet className="h-4 w-4 shrink-0" />,
        },
        {
          route: "invoices",
          label: "الفواتير الضريبية",
          description: "كشوف الحساب وتحميل الفواتير",
          icon: <FileText className="h-4 w-4 shrink-0" />,
        },
      ],
    },
    {
      id: "addresses-group",
      label: "العناوين والعملاء",
      icon: <BookUser className="h-4 w-4 shrink-0" />,
      items: [
        {
          route: "address-book",
          label: "دفتر العناوين",
          description: "إدارة عناوين المستودعات والمرسلين",
          icon: <MapPin className="h-4 w-4 shrink-0" />,
        },
        {
          route: "address-lookup",
          label: "جلب العنوان المختصر",
          description: "البحث والتحقق السريع من العنوان الوطني",
          icon: <ScanSearch className="h-4 w-4 shrink-0" />,
        },
        {
          route: "customers",
          label: "سجل العملاء",
          description: "قاعدة بيانات المستلمين وبيانات التواصل",
          icon: <User className="h-4 w-4 shrink-0" />,
        },
      ],
    },
    {
      id: "operations-group",
      label: "الناقلين والربط",
      icon: <Settings2 className="h-4 w-4 shrink-0" />,
      items: [
        {
          route: "carriers",
          label: "شركات الشحن والخدمات",
          description: "تفعيل الناقلين ومقارنة أسعار الشحن",
          icon: <SlidersHorizontal className="h-4 w-4 shrink-0" />,
        },
        ...(canManageIntegrations
          ? [
              {
                route: "integrations" as RouteName,
                label: "مركز التكاملات",
                description: "ربط المتاجر الإلكترونية ومفاتيح الـ API",
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
      dir="rtl"
      className="sticky top-0 z-50 h-16 w-full bg-card border-b border-border shadow-sm"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-3 xl:gap-6 lg:px-6">
        {/* RIGHT ZONE: Mobile Hamburger + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile hamburger — opens Sheet with full nav */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>قائمة التنقّل</SheetTitle>
              </SheetHeader>
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Brand Logo — strictly non-shrinking & non-wrapping */}
          <button
            type="button"
            onClick={() => {
              closeAllMenus();
              navigate("dashboard");
            }}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap hover:opacity-85 transition-opacity"
          >
            <LogoMark size={34} />
            <div className="hidden sm:flex flex-col items-start leading-none whitespace-nowrap">
              <span className="text-sm font-extrabold text-foreground whitespace-nowrap">
                مسار إكس
              </span>
              <span className="mt-0.5 text-[9px] font-medium tracking-[0.18em] text-muted-foreground whitespace-nowrap">
                MASAR X
              </span>
            </div>
          </button>
        </div>

        {/* MOBILE PAGE TITLE (only visible below lg) */}
        <h1 className="lg:hidden flex-1 min-w-0 text-base font-bold text-foreground truncate px-2 text-right">
          {title}
        </h1>

        {/* CENTER ZONE (Laptop/Desktop lg+ only): Perfectly centered, hover-activated dropdown groups */}
        <nav
          ref={navRef}
          aria-label="التنقل الرئيسي"
          className="hidden lg:flex items-center justify-center justify-self-center gap-1 xl:gap-1.5 min-w-0"
        >
          {desktopGroups.map((group) => {
            // Single direct link (e.g. الرئيسية)
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
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 xl:px-3 text-xs xl:text-sm font-medium whitespace-nowrap select-none transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {group.icon}
                  <span className="whitespace-nowrap">{group.label}</span>
                </button>
              );
            }

            // Dropdown group — opens smoothly on mouse hover or click
            const subItems = group.items ?? [];
            const activeSubItem = subItems.find((sub) =>
              isRouteActive(sub.route)
            );
            const isOpen = openGroupId === group.id;

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
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 xl:px-3 text-xs xl:text-sm font-medium whitespace-nowrap select-none transition-colors",
                    activeSubItem || isOpen
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {group.icon}
                  <span className="whitespace-nowrap">{group.label}</span>
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

                {/* Hover bridge wrapper (pt-2 keeps hover active between button and menu) */}
                {isOpen && (
                  <div className="absolute right-0 top-full pt-2 z-[100] w-68 sm:w-72">
                    <div
                      role="menu"
                      className="w-72 rounded-2xl border border-border bg-white dark:bg-slate-900 p-2 shadow-2xl ring-1 ring-black/10"
                    >
                      <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground border-b border-border/60 mb-1.5">
                        <span>{group.label}</span>
                        {activeSubItem && (
                          <span className="text-[10px] font-bold text-primary truncate max-w-[130px]">
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
                                "flex w-full items-center gap-3 rounded-xl p-2.5 text-right transition-colors",
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
                              <div className="flex-1 min-w-0 text-right">
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
                                      النشط
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

        {/* LEFT ZONE: Quick Create Button + Compact Search + Notifications + Profile Avatar */}
        <div className="flex items-center justify-end gap-1.5 xl:gap-2 shrink-0">
          {/* Quick CTA for Create Shipment on Laptop/Desktop */}
          <Button
            size="sm"
            onClick={() => {
              closeAllMenus();
              navigate("create-shipment");
            }}
            className="hidden lg:inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 xl:px-3 text-xs font-semibold whitespace-nowrap shadow-sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden xl:inline whitespace-nowrap">شحنة جديدة</span>
          </Button>

          {/* Desktop search — compact width on laptop, expands smoothly on focus */}
          <div className="hidden md:flex items-center w-28 lg:w-32 xl:w-44 focus-within:w-40 xl:focus-within:w-52 transition-all duration-200 shrink-0">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="بحث بالتتبّع…"
                className="pr-8 pl-2 h-9 bg-muted/40 border-transparent focus-visible:border-border text-xs w-full"
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

          {/* Notifications */}
          <button
            type="button"
            onClick={() => {
              closeAllMenus();
              navigate("notifications");
            }}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="الإشعارات"
          >
            <Bell className="h-4 w-4 shrink-0" />
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
            className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card p-0.5 2xl:pl-2.5 hover:bg-muted transition-colors"
            aria-label="الملف الشخصي"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
                {initials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden 2xl:inline-block max-w-[80px] truncate text-xs font-medium text-foreground">
              {user?.name ?? "حسابي"}
            </span>
          </button>

          {/* Mobile logout */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 text-muted-foreground hover:text-destructive"
            onClick={logout}
            aria-label="تسجيل الخروج"
          >
            <LogOut className="h-5 w-5 rtl-flip" />
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Mobile nav menu — opened via hamburger Sheet.
 * Lists all routes vertically with icons + labels.
 * Also exported as `Sidebar` for compatibility with Topbar.tsx.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const { user, logout } = useAuth();
  const role = String(user?.role ?? "").toUpperCase();
  const canManageIntegrations =
    isDemoMode() || role === "ADMIN" || role === "SUPER_ADMIN";

  const allItems: NavItem[] = (
    [
      { route: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
      { route: "shipments", label: "الشحنات", icon: <Package className="h-5 w-5" /> },
      { route: "create-shipment", label: "شحنة جديدة", icon: <Plus className="h-5 w-5" /> },
      { route: "wallet", label: "المحفظة", icon: <Wallet className="h-5 w-5" /> },
      { route: "address-book", label: "دفتر العناوين", icon: <MapPin className="h-5 w-5" /> },
      { route: "address-lookup", label: "جلب العنوان المختصر", icon: <ScanSearch className="h-5 w-5" /> },
      { route: "weight-disputes", label: "اعتراضات الوزن", icon: <Scale className="h-5 w-5" /> },
      { route: "carriers", label: "شركات الشحن والخدمات", icon: <SlidersHorizontal className="h-5 w-5" /> },
      { route: "integrations", label: "مركز التكاملات", icon: <Network className="h-5 w-5" /> },
      { route: "customers", label: "العملاء", icon: <User className="h-5 w-5" /> },
      { route: "invoices", label: "الفواتير", icon: <FileText className="h-5 w-5" /> },
      { route: "tracking", label: "تتبّع شحنة", icon: <Truck className="h-5 w-5" /> },
      { route: "profile", label: "الملف الشخصي", icon: <User className="h-5 w-5" /> },
    ] as NavItem[]
  ).filter((item) => canManageIntegrations || item.route !== "integrations");

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Logo size={32} />
      </div>

      {/* User card */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 rounded-xl bg-accent p-3">
          <Avatar className="h-10 w-10 shrink-0 border border-sidebar-border">
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
              <span className="flex-1 text-right truncate">{item.label}</span>
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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(15,23,42,0.05)] safe-area-bottom">
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
                  ? "text-emerald-600"
                  : active
                  ? "text-emerald-600"
                  : "text-muted-foreground"
              )}
            >
              {isCenter ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-emerald -mt-6 ring-4 ring-card">
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