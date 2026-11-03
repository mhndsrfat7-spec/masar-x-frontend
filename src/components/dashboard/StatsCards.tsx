"use client";

import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Banknote,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatSAR, halToSar } from "@/lib/format";
import { useTranslation } from "@/i18n";
import type { ShipmentStats } from "@/types/api";

interface StatsCardsProps {
  stats: ShipmentStats | null;
  loading?: boolean;
}

interface StatItem {
  label: string;
  mobileLabel: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  isMoney?: boolean;
}

/**
 * StatsCards — all 6 status cards arranged in a SINGLE sleek row (`grid-cols-6`)
 * on both mobile and desktop, eliminating excessive vertical whitespace.
 */
export function StatsCards({ stats, loading }: StatsCardsProps) {
  const { t, dir, locale } = useTranslation();

  const total = stats?.total ?? 0;
  const inTransit =
    (stats?.inTransit ?? stats?.in_transit ?? 0) +
    (stats?.processing ?? 0);
  const delivered = stats?.delivered ?? 0;
  const pending = stats?.pending ?? 0;
  const totalValue = stats?.totalValueHal
    ? halToSar(stats.totalValueHal)
    : stats?.totalValue ?? 0;
  const codCollected = stats?.codCollected ?? 0;

  const items: StatItem[] = [
    {
      label: t("dashboard.stats.totalShipments"),
      mobileLabel: t("dashboard.stats.totalShort"),
      value: total,
      icon: Package,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: t("dashboard.stats.inTransit"),
      mobileLabel: t("dashboard.stats.inTransitShort"),
      value: inTransit,
      icon: Truck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: t("dashboard.stats.delivered"),
      mobileLabel: t("dashboard.stats.deliveredShort"),
      value: delivered,
      icon: CheckCircle2,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: t("dashboard.stats.processing"),
      mobileLabel: t("dashboard.stats.processingShort"),
      value: pending,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: t("dashboard.stats.shipmentsValue"),
      mobileLabel: t("dashboard.stats.shipmentsValueShort"),
      value: totalValue,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      isMoney: true,
    },
    {
      label: t("dashboard.stats.codCollected"),
      mobileLabel: t("dashboard.stats.codCollectedShort"),
      value: codCollected,
      icon: Banknote,
      color: "text-rose-600",
      bg: "bg-rose-50",
      isMoney: true,
    },
  ];

  const numberLocale = locale === "en" ? "en-US" : "ar-SA";

  return (
    <div dir={dir} className="grid grid-cols-6 gap-1.5 sm:gap-2.5 lg:gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card
  key={it.label}
  className="overflow-hidden border-0 bg-transparent shadow-none rounded-none sm:border sm:bg-card sm:rounded-xl sm:shadow-card-soft sm:hover:shadow-card-hover sm:hover:-translate-y-0.5 transition-all"
>
            <CardContent className="px-1 py-1 sm:p-3 flex flex-col items-center justify-center text-center">
              {/* Elegant circular icons on mobile; original style on desktop */}
              <div
                className={cn(
                  "flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full sm:rounded-lg mb-1.5 shrink-0 shadow-sm sm:shadow-none ring-2 ring-white/80 sm:ring-0",
                  it.bg,
                  it.color
                )}
              >
                <Icon className="h-4 w-4 sm:h-4 sm:w-4" />
              </div>

              {/* Short label on small mobile; full label on sm+ */}
              <p className="text-[9px] sm:hidden font-medium text-muted-foreground leading-tight truncate w-full mb-0.5">
                {it.mobileLabel}
              </p>
              <p className="hidden sm:block text-[11px] font-medium text-muted-foreground leading-tight truncate w-full mb-0.5">
                {it.label}
              </p>

              {loading ? (
                <div className="shimmer h-4 sm:h-5 w-10 sm:w-14 rounded mx-auto" />
              ) : (
                <p
                  className={cn(
                    "text-[11px] sm:text-sm lg:text-base font-extrabold text-foreground tabular-nums leading-tight truncate w-full",
                    it.isMoney && "text-[10px] sm:text-xs lg:text-sm"
                  )}
                  dir={it.isMoney ? "ltr" : undefined}
                >
                  {it.isMoney
                    ? formatSAR(Number(it.value) || 0, {
                        withSymbol: false,
                      })
                    : new Intl.NumberFormat(numberLocale).format(
                        Number(it.value) || 0
                      )}
                  {it.isMoney && (
                    <span className="hidden sm:inline text-[10px] font-normal text-muted-foreground ms-0.5">
                      {t("common.sar")}
                    </span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
