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
import { useTranslation } from "@/i18n";

interface QuickNavItem {
  route: RouteName;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  /** Whether this item appears in the 3-item mobile strip (<lg) */
  showOnMobile: boolean;
}

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
  const { t, dir } = useTranslation();

  const navItems: QuickNavItem[] = [
    {
      route: "shipments",
      label: t("dashboard.quickNav.shipments"),
      icon: Package,
      showOnMobile: false,
    },
    {
      route: "carriers",
      label: t("dashboard.quickNav.availableCarriers"),
      mobileLabel: t("dashboard.quickNav.availableCarriers"),
      icon: Truck,
      showOnMobile: true,
    },
    {
      route: "tracking",
      label: t("dashboard.quickNav.trackShipments"),
      mobileLabel: t("dashboard.quickNav.trackShipmentsMobile"),
      icon: Search,
      showOnMobile: true,
    },
    {
      route: "address-book",
      label: t("dashboard.quickNav.addressBook"),
      mobileLabel: t("dashboard.quickNav.addressBook"),
      icon: MapPin,
      showOnMobile: true,
    },
    {
      route: "wallet",
      label: t("dashboard.quickNav.digitalWallet"),
      icon: Wallet,
      showOnMobile: false,
    },
    {
      route: "weight-disputes",
      label: t("dashboard.quickNav.weightDisputes"),
      icon: Scale,
      showOnMobile: false,
    },
  ];

  return (
    <nav
      dir={dir}
      aria-label={t("dashboard.quickNav.ariaLabel")}
      className="w-full rounded-full border border-border bg-card p-1 sm:p-1.5 lg:px-3 lg:py-1.5 shadow-card-soft"
    >
      <ul className="grid grid-cols-3 lg:grid-cols-6 items-center w-full">
        {navItems.map((item, idx) => {
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
                  className="lg:hidden absolute start-0 top-1/2 -translate-y-1/2 h-5 w-px bg-border/80"
                  aria-hidden
                />
              )}

              {/* Vertical divider on Laptop/Desktop (lg+) between all 6 items */}
              {idx > 0 && (
                <span
                  className="hidden lg:block absolute start-0 top-1/2 -translate-y-1/2 h-6 w-px bg-border/80"
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
  const { t, dir } = useTranslation();

  return (
    <div
      dir={dir}
      className="brand-promo-surface brand-wave-surface relative overflow-hidden rounded-2xl text-white shadow-brand-lg p-4 sm:p-5 lg:p-6 lg:h-[420px] h-full flex flex-col justify-between gap-3 lg:gap-0"
    >
      {/* Clean animated waves and soft light — no dotted texture. */}
      <div className="brand-wave-lines" aria-hidden="true">
        <svg viewBox="0 0 900 520" preserveAspectRatio="none">
          <path className="brand-wave-line brand-wave-line-one" d="M-30 355 C130 260 250 425 410 330 S700 255 930 340" />
          <path className="brand-wave-line brand-wave-line-two" d="M-30 405 C145 315 270 470 455 382 S720 310 930 390" />
          <path className="brand-wave-line brand-wave-line-three" d="M-30 300 C155 390 290 225 470 300 S735 395 930 285" />
        </svg>
      </div>
      <div className="brand-promo-glow brand-promo-glow-one" aria-hidden="true" />
      <div className="brand-promo-glow brand-promo-glow-two" aria-hidden="true" />

      {/* Top row: status badge + floating icon */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 lg:px-3 lg:py-1 text-[10px] lg:text-[11px] font-semibold text-white">
          <ShieldCheck className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-emerald-200 shrink-0" />
          {t("dashboard.quickNav.promoBadge")}
        </span>
        <div className="flex h-7 w-7 lg:h-9 lg:w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
          <Plane className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white/90 animate-float" />
        </div>
      </div>

      {/* Center visual emblem — Laptop only (lg+) so mobile stays compact */}
      <div className="hidden lg:flex relative z-10 my-auto py-4 flex-col items-center justify-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
          <Globe2 className="h-10 w-10 text-emerald-200" />
          <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md border border-white/30">
            <Truck className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-[11px] text-white/85">
          <span>{t("dashboard.quickNav.promoCarriersCount")}</span>
          <span className="h-1 w-1 rounded-full bg-[#C5D86D]" />
          <span>{t("dashboard.quickNav.promoInstantTracking")}</span>
        </div>
      </div>

      {/* Bottom copy + CTA (compact on mobile, spacious on laptop) */}
      <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-stretch justify-between gap-2.5 lg:space-y-3 text-start">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold leading-tight">
            {t("dashboard.quickNav.promoTitle")}
          </h3>
          <p className="text-[11px] sm:text-xs lg:text-sm text-white/85 leading-relaxed line-clamp-2 lg:line-clamp-none">
            {t("dashboard.quickNav.promoDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("create-shipment")}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-emerald-300 text-[#082A2C] px-4 py-2 lg:px-5 lg:py-2.5 text-xs font-bold shadow-md hover:bg-emerald-200 transition-colors"
        >
          {t("dashboard.quickNav.promoCta")}
          <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
        </button>
      </div>
    </div>
  );
}