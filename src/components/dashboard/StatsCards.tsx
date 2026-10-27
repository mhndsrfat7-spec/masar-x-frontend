"use client";

import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Banknote,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatSAR, halToSar } from "@/lib/format";
import type { ShipmentStats } from "@/types/api";

interface StatsCardsProps {
  stats: ShipmentStats | null;
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  // Handle both UPPERCASE and lowercase stat shapes
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

  const items = [
    {
      label: "إجمالي الشحنات",
      value: total,
      icon: <Package className="h-5 w-5" />,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "قيد التوصيل",
      value: inTransit,
      icon: <Truck className="h-5 w-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "تم التسليم",
      value: delivered,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "قيد المعالجة",
      value: pending,
      icon: <Clock className="h-5 w-5" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "قيمة الشحنات",
      value: totalValue,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      isMoney: true,
    },
    {
      label: "تحصيل COD",
      value: codCollected,
      icon: <Banknote className="h-5 w-5" />,
      color: "text-rose-600",
      bg: "bg-rose-50",
      isMoney: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="overflow-hidden hover:shadow-brand transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  it.bg,
                  it.color
                )}
              >
                {it.icon}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mb-0.5">
              {it.label}
            </p>
            {loading ? (
              <div className="shimmer h-6 w-16 rounded" />
            ) : (
              <p
                className={cn(
                  "text-lg font-bold text-foreground",
                  it.isMoney && "text-base"
                )}
                dir={it.isMoney ? "ltr" : undefined}
              >
                {it.isMoney
                  ? formatSAR(Number(it.value) || 0, {
                      withSymbol: false,
                    })
                  : new Intl.NumberFormat("ar-SA").format(
                      Number(it.value) || 0
                    )}
                {it.isMoney && (
                  <span className="text-xs font-normal text-muted-foreground mr-1">
                    {" "}
                    ر.س
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
