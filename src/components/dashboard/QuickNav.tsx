// "use client";

// import {
//   Package,
//   Truck,
//   Search,
//   MapPin,
//   Wallet,
//   Scale,
//   ArrowLeft,
//   type LucideIcon,
// } from "lucide-react";
// import { useRouterStore, type RouteName } from "@/store/routerStore";
// import { cn } from "@/lib/utils";

// interface QuickNavItem {
//   route: RouteName;
//   label: string;
//   icon: LucideIcon;
// }

// const NAV_ITEMS: QuickNavItem[] = [
//   { route: "shipments", label: "الشحنات", icon: Package },
//   { route: "carriers", label: "الشركات المتاحة", icon: Truck },
//   { route: "tracking", label: "تتبّع الشحنات", icon: Search },
//   { route: "address-book", label: "دفتر العناوين", icon: MapPin },
//   { route: "wallet", label: "المحفظة الرقمية", icon: Wallet },
//   { route: "weight-disputes", label: "اعتراضات الوزن", icon: Scale },
// ];

// /**
//  * Capsule-style white quick-nav bar with 6 sections separated by soft
//  * vertical dividers. Matches the brand reference dashboard layout.
//  *
//  * On mobile: horizontally scrollable.
//  */
// export function QuickNav() {
//   const navigate = useRouterStore((s) => s.navigate);
//   const route = useRouterStore((s) => s.route);

//   return (
//     <nav className="rounded-full border border-border bg-card p-1.5 shadow-card-soft overflow-x-auto no-scrollbar">
//       <ul className="flex items-stretch gap-0 min-w-max">
//         {NAV_ITEMS.map((item, idx) => {
//           const Icon = item.icon;
//           const active =
//             route === item.route ||
//             (item.route === "shipments" && route === "shipment-details");
//           return (
//             <li key={item.route} className="flex items-center">
//               {idx > 0 && (
//                 <span className="h-6 w-px bg-border mx-1" aria-hidden />
//               )}
//               <button
//                 type="button"
//                 onClick={() => navigate(item.route)}
//                 className={cn(
//                   "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
//                   active
//                     ? "bg-primary text-primary-foreground shadow-sm"
//                     : "text-foreground hover:bg-muted"
//                 )}
//                 aria-current={active ? "page" : undefined}
//               >
//                 <Icon className="h-4 w-4 shrink-0" />
//                 <span>{item.label}</span>
//               </button>
//             </li>
//           );
//         })}
//       </ul>
//     </nav>
//   );
// }

// /**
//  * Tall illustrated brand promo card — "من حولك إلى العالم".
//  * Uses gradient + decorative shapes, no external images.
//  */
// export function BrandPromoCard() {
//   const navigate = useRouterStore((s) => s.navigate);
//   return (
//     <div className="relative overflow-hidden rounded-2xl bg-brand-gradient-emerald text-white shadow-brand-lg min-h-[280px] flex flex-col justify-between p-6">
//       {/* Decorative dots */}
//       <div className="absolute inset-0 opacity-[0.1]" aria-hidden>
//         <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
//           <defs>
//             <pattern id="brand-promo-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
//               <circle cx="2" cy="2" r="1" fill="white" />
//             </pattern>
//           </defs>
//           <rect width="200" height="280" fill="url(#brand-promo-dots)" />
//         </svg>
//       </div>

//       {/* Floating truck icon */}
//       <div className="absolute top-6 left-6 animate-float opacity-90" aria-hidden>
//         <Truck className="h-10 w-10 text-white/30" />
//       </div>

//       <div className="relative z-10 mt-auto space-y-3">
//         <h3 className="text-xl font-bold leading-tight">
//           من حولك إلى العالم
//         </h3>
//         <p className="text-sm text-white/80 leading-relaxed">
//           شحن موثوق.. لكل وجهة. اربط متجرك بأكثر من 5 شركات شحن سعودية ودولية من واجهة واحدة.
//         </p>
//         <button
//           type="button"
//           onClick={() => navigate("create-shipment")}
//           className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-2 text-xs font-semibold hover:bg-white/25 transition-colors"
//         >
//           ابدأ الآن
//           <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
//         </button>
//       </div>
//     </div>
//   );
// }



"use client";

import {
  Package,
  Truck,
  Search,
  MapPin,
  Wallet,
  Scale,
  ArrowLeft,
  Plane,
  ShieldCheck,
  Globe2,
  type LucideIcon,
} from "lucide-react";
import { useRouterStore, type RouteName } from "@/store/routerStore";
import { cn } from "@/lib/utils";

interface QuickNavItem {
  route: RouteName;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  /** Whether this item appears in the 3-item mobile strip (<lg) */
  showOnMobile: boolean;
}

const NAV_ITEMS: QuickNavItem[] = [
  {
    route: "shipments",
    label: "الشحنات",
    icon: Package,
    showOnMobile: false,
  },
  {
    route: "carriers",
    label: "الشركات المتاحة",
    mobileLabel: "الشركات المتاحة",
    icon: Truck,
    showOnMobile: true,
  },
  {
    route: "tracking",
    label: "تتبّع الشحنات",
    mobileLabel: "تتبّع الشحن",
    icon: Search,
    showOnMobile: true,
  },
  {
    route: "address-book",
    label: "دفتر العناوين",
    mobileLabel: "دفتر العناوين",
    icon: MapPin,
    showOnMobile: true,
  },
  {
    route: "wallet",
    label: "المحفظة الرقمية",
    icon: Wallet,
    showOnMobile: false,
  },
  {
    route: "weight-disputes",
    label: "اعتراضات الوزن",
    icon: Scale,
    showOnMobile: false,
  },
];

/**
 * Capsule-style quick-nav bar under the HeroBanner.
 *
 * - Mobile (<lg): Shows ONLY 3 items in a single sleek row:
 *   (الشركات المتاحة | تتبّع الشحن | دفتر العناوين)
 * - Laptop & Desktop (lg+): Full-width capsule bar with all 6 equal, centered slots.
 */
export function QuickNav() {
  const navigate = useRouterStore((s) => s.navigate);
  const route = useRouterStore((s) => s.route);

  return (
    <nav
      dir="rtl"
      aria-label="الوصول السريع"
      className="w-full rounded-full border border-border bg-card p-1 sm:p-1.5 lg:px-3 lg:py-1.5 shadow-card-soft"
    >
      <ul className="grid grid-cols-3 lg:grid-cols-6 items-center w-full">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const active =
            route === item.route ||
            (item.route === "shipments" && route === "shipment-details");

          // On mobile (<lg), only the 3 mobile items are visible; add divider before 2nd and 3rd mobile items
          const isFirstMobileItem = item.route === "carriers";

          return (
            <li
              key={item.route}
              className={cn(
                "relative items-center justify-center w-full",
                item.showOnMobile ? "flex" : "hidden lg:flex"
              )}
            >
              {/* Vertical divider on Mobile (<lg) between the 3 visible items */}
              {item.showOnMobile && !isFirstMobileItem && (
                <span
                  className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-border/80"
                  aria-hidden
                />
              )}

              {/* Vertical divider on Laptop/Desktop (lg+) between all 6 items */}
              {idx > 0 && (
                <span
                  className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 h-6 w-px bg-border/80"
                  aria-hidden
                />
              )}

              <button
                type="button"
                onClick={() => navigate(item.route)}
                className={cn(
                  "flex w-full lg:w-auto lg:min-w-[125px] xl:min-w-[145px] items-center justify-center gap-1.5 sm:gap-2 rounded-full px-2 py-2 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs lg:text-sm font-semibold transition-all whitespace-nowrap text-center",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/85 hover:bg-muted hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0",
                    active ? "text-primary-foreground" : "text-primary"
                  )}
                />
                <span className="truncate lg:hidden">
                  {item.mobileLabel ?? item.label}
                </span>
                <span className="truncate hidden lg:inline">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Brand promo card — "من حولك إلى العالم".
 *
 * - Mobile (<lg): Compact, low-height horizontal-friendly banner (`p-4`, no tall center spacer).
 * - Laptop (lg+): Tall `lg:h-[420px] h-full` card matching `RecentShipments` beside it.
 */
export function BrandPromoCard() {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <div
      dir="rtl"
      className="relative overflow-hidden rounded-2xl bg-brand-gradient-emerald text-white shadow-brand-lg p-4 sm:p-5 lg:p-6 lg:h-[420px] h-full flex flex-col justify-between gap-3 lg:gap-0"
    >
      {/* Decorative dotted pattern & route rings */}
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        aria-hidden
      >
        <svg
          viewBox="0 0 240 420"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="brand-promo-dots"
              x="0"
              y="0"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="white" />
            </pattern>
          </defs>
          <rect width="240" height="420" fill="url(#brand-promo-dots)" />
          <circle
            cx="120"
            cy="135"
            r="75"
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle
            cx="120"
            cy="135"
            r="48"
            fill="none"
            stroke="#C5D86D"
            strokeWidth="1.2"
            strokeDasharray="3 5"
          />
        </svg>
      </div>

      {/* Top row: status badge + floating icon */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 lg:px-3 lg:py-1 text-[10px] lg:text-[11px] font-semibold text-white">
          <ShieldCheck className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-[#C5D86D] shrink-0" />
          تغطية شحن ذكية
        </span>
        <div className="flex h-7 w-7 lg:h-9 lg:w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
          <Plane className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white/90 animate-float" />
        </div>
      </div>

      {/* Center visual emblem — Laptop only (lg+) so mobile stays compact */}
      <div className="hidden lg:flex relative z-10 my-auto py-4 flex-col items-center justify-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
          <Globe2 className="h-10 w-10 text-[#C5D86D]" />
          <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md border border-white/30">
            <Truck className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-[11px] text-white/85">
          <span>+5 ناقلين معتمدين</span>
          <span className="h-1 w-1 rounded-full bg-[#C5D86D]" />
          <span>تتبّع فوري</span>
        </div>
      </div>

      {/* Bottom copy + CTA (compact on mobile, spacious on laptop) */}
      <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-stretch justify-between gap-2.5 lg:space-y-3 text-right">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold leading-tight">
            من حولك إلى العالم
          </h3>
          <p className="text-[11px] sm:text-xs lg:text-sm text-white/85 leading-relaxed line-clamp-2 lg:line-clamp-none">
            شحن موثوق.. لكل وجهة. اربط متجرك بأبرز شركات الشحن السعودية والدولية
            من واجهة واحدة وبأقل الأسعار.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("create-shipment")}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#C5D86D] text-[#0F352E] px-4 py-2 lg:px-5 lg:py-2.5 text-xs font-bold shadow-md hover:bg-[#d3e47e] transition-colors"
        >
          ابدأ شحنتك الآن
          <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
        </button>
      </div>
    </div>
  );
}