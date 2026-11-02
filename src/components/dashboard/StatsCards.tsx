// // "use client";

// // import {
// //   Package,
// //   Truck,
// //   CheckCircle2,
// //   Clock,
// //   TrendingUp,
// //   Banknote,
// //   type LucideIcon,
// // } from "lucide-react";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { cn } from "@/lib/utils";
// // import { formatSAR, halToSar } from "@/lib/format";
// // import type { ShipmentStats } from "@/types/api";

// // interface StatsCardsProps {
// //   stats: ShipmentStats | null;
// //   loading?: boolean;
// // }

// // interface StatItem {
// //   label: string;
// //   value: number;
// //   icon: LucideIcon;
// //   color: string;
// //   bg: string;
// //   isMoney?: boolean;
// // }

// // export function StatsCards({ stats, loading }: StatsCardsProps) {
// //   // Handle both UPPERCASE and lowercase stat shapes
// //   const total = stats?.total ?? 0;
// //   const inTransit =
// //     (stats?.inTransit ?? stats?.in_transit ?? 0) +
// //     (stats?.processing ?? 0);
// //   const delivered = stats?.delivered ?? 0;
// //   const pending = stats?.pending ?? 0;
// //   const totalValue = stats?.totalValueHal
// //     ? halToSar(stats.totalValueHal)
// //     : stats?.totalValue ?? 0;
// //   const codCollected = stats?.codCollected ?? 0;

// //   const items: StatItem[] = [
// //     {
// //       label: "إجمالي الشحنات",
// //       value: total,
// //       icon: Package,
// //       color: "text-emerald-600",
// //       bg: "bg-emerald-50",
// //     },
// //     {
// //       label: "قيد التوصيل",
// //       value: inTransit,
// //       icon: Truck,
// //       color: "text-blue-600",
// //       bg: "bg-blue-50",
// //     },
// //     {
// //       label: "تم التسليم",
// //       value: delivered,
// //       icon: CheckCircle2,
// //       color: "text-teal-600",
// //       bg: "bg-teal-50",
// //     },
// //     {
// //       label: "قيد المعالجة",
// //       value: pending,
// //       icon: Clock,
// //       color: "text-amber-600",
// //       bg: "bg-amber-50",
// //     },
// //     {
// //       label: "قيمة الشحنات",
// //       value: totalValue,
// //       icon: TrendingUp,
// //       color: "text-purple-600",
// //       bg: "bg-purple-50",
// //       isMoney: true,
// //     },
// //     {
// //       label: "تحصيل COD",
// //       value: codCollected,
// //       icon: Banknote,
// //       color: "text-rose-600",
// //       bg: "bg-rose-50",
// //       isMoney: true,
// //     },
// //   ];

// //   return (
// //     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
// //       {items.map((it) => {
// //         const Icon = it.icon;
// //         return (
// //           <Card
// //             key={it.label}
// //             className="overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all shadow-card-soft"
// //           >
// //             <CardContent className="p-4">
// //               <div className="flex items-center justify-between mb-3">
// //                 <div
// //                   className={cn(
// //                     "flex h-9 w-9 items-center justify-center rounded-lg",
// //                     it.bg,
// //                     it.color
// //                   )}
// //                 >
// //                   <Icon className="h-5 w-5" />
// //                 </div>
// //               </div>
// //               <p className="text-[11px] text-muted-foreground mb-1 truncate">
// //                 {it.label}
// //               </p>
// //               {loading ? (
// //                 <div className="shimmer h-6 w-16 rounded" />
// //               ) : (
// //                 <p
// //                   className={cn(
// //                     "text-lg font-bold text-foreground tabular-nums",
// //                     it.isMoney && "text-base"
// //                   )}
// //                   dir={it.isMoney ? "ltr" : undefined}
// //                 >
// //                   {it.isMoney
// //                     ? formatSAR(Number(it.value) || 0, {
// //                         withSymbol: false,
// //                       })
// //                     : new Intl.NumberFormat("ar-SA").format(
// //                         Number(it.value) || 0
// //                       )}
// //                   {it.isMoney && (
// //                     <span className="text-xs font-normal text-muted-foreground ms-1">
// //                       ر.س
// //                     </span>
// //                   )}
// //                 </p>
// //               )}
// //             </CardContent>
// //           </Card>
// //         );
// //       })}
// //     </div>
// //   );
// // }



// "use client";

// import {
//   Package,
//   Truck,
//   CheckCircle2,
//   Clock,
//   TrendingUp,
//   Banknote,
//   type LucideIcon,
// } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { cn } from "@/lib/utils";
// import { formatSAR, halToSar } from "@/lib/format";
// import type { ShipmentStats } from "@/types/api";

// interface StatsCardsProps {
//   stats: ShipmentStats | null;
//   loading?: boolean;
// }

// interface StatItem {
//   label: string;
//   value: number;
//   icon: LucideIcon;
//   color: string;
//   bg: string;
//   isMoney?: boolean;
// }

// export function StatsCards({ stats, loading }: StatsCardsProps) {
//   // Handle both UPPERCASE and lowercase stat shapes
//   const total = stats?.total ?? 0;
//   const inTransit =
//     (stats?.inTransit ?? stats?.in_transit ?? 0) +
//     (stats?.processing ?? 0);
//   const delivered = stats?.delivered ?? 0;
//   const pending = stats?.pending ?? 0;
//   const totalValue = stats?.totalValueHal
//     ? halToSar(stats.totalValueHal)
//     : stats?.totalValue ?? 0;
//   const codCollected = stats?.codCollected ?? 0;

//   const items: StatItem[] = [
//     {
//       label: "إجمالي الشحنات",
//       value: total,
//       icon: Package,
//       color: "text-emerald-600",
//       bg: "bg-emerald-50",
//     },
//     {
//       label: "قيد التوصيل",
//       value: inTransit,
//       icon: Truck,
//       color: "text-blue-600",
//       bg: "bg-blue-50",
//     },
//     {
//       label: "تم التسليم",
//       value: delivered,
//       icon: CheckCircle2,
//       color: "text-teal-600",
//       bg: "bg-teal-50",
//     },
//     {
//       label: "قيد المعالجة",
//       value: pending,
//       icon: Clock,
//       color: "text-amber-600",
//       bg: "bg-amber-50",
//     },
//     {
//       label: "قيمة الشحنات",
//       value: totalValue,
//       icon: TrendingUp,
//       color: "text-purple-600",
//       bg: "bg-purple-50",
//       isMoney: true,
//     },
//     {
//       label: "تحصيل COD",
//       value: codCollected,
//       icon: Banknote,
//       color: "text-rose-600",
//       bg: "bg-rose-50",
//       isMoney: true,
//     },
//   ];

//   return (
//     <div
//       dir="rtl"
//       className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
//     >
//       {items.map((it) => {
//         const Icon = it.icon;
//         return (
//           <Card
//             key={it.label}
//             className="overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all shadow-card-soft"
//           >
//             <CardContent className="p-3.5 sm:p-4 flex flex-col items-center justify-center text-center">
//               <div
//                 className={cn(
//                   "flex h-10 w-10 items-center justify-center rounded-xl mb-2.5 shrink-0",
//                   it.bg,
//                   it.color
//                 )}
//               >
//                 <Icon className="h-5 w-5" />
//               </div>
//               <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1 truncate max-w-full">
//                 {it.label}
//               </p>
//               {loading ? (
//                 <div className="shimmer h-6 w-16 rounded mx-auto" />
//               ) : (
//                 <p
//                   className={cn(
//                     "text-base sm:text-lg font-extrabold text-foreground tabular-nums",
//                     it.isMoney && "text-sm sm:text-base"
//                   )}
//                   dir={it.isMoney ? "ltr" : undefined}
//                 >
//                   {it.isMoney
//                     ? formatSAR(Number(it.value) || 0, {
//                         withSymbol: false,
//                       })
//                     : new Intl.NumberFormat("ar-SA").format(
//                         Number(it.value) || 0
//                       )}
//                   {it.isMoney && (
//                     <span className="text-xs font-normal text-muted-foreground ms-1">
//                       ر.س
//                     </span>
//                   )}
//                 </p>
//               )}
//             </CardContent>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }


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
      label: "إجمالي الشحنات",
      mobileLabel: "الإجمالي",
      value: total,
      icon: Package,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "قيد التوصيل",
      mobileLabel: "بالتوصيل",
      value: inTransit,
      icon: Truck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "تم التسليم",
      mobileLabel: "مُسلّمة",
      value: delivered,
      icon: CheckCircle2,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "قيد المعالجة",
      mobileLabel: "بالمعالجة",
      value: pending,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "قيمة الشحنات",
      mobileLabel: "القيمة",
      value: totalValue,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      isMoney: true,
    },
    {
      label: "تحصيل COD",
      mobileLabel: "الـ COD",
      value: codCollected,
      icon: Banknote,
      color: "text-rose-600",
      bg: "bg-rose-50",
      isMoney: true,
    },
  ];

  return (
    <div dir="rtl" className="grid grid-cols-6 gap-1.5 sm:gap-2.5 lg:gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card
            key={it.label}
            className="overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all shadow-card-soft"
          >
            <CardContent className="px-1 py-2 sm:p-3 flex flex-col items-center justify-center text-center">
              <div
                className={cn(
                  "flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg mb-1 sm:mb-1.5 shrink-0",
                  it.bg,
                  it.color
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>

              {/* Short label on small mobile so 6 fit in 1 row cleanly; full label on sm+ */}
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
                    : new Intl.NumberFormat("ar-SA").format(
                        Number(it.value) || 0
                      )}
                  {it.isMoney && (
                    <span className="hidden sm:inline text-[10px] font-normal text-muted-foreground ms-0.5">
                      ر.س
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