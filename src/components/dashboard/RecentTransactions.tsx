// "use client";

// import {
//   ArrowDownLeft,
//   ArrowUpRight,
//   Wallet as WalletIcon,
//   CreditCard,
//   Receipt,
//   TrendingUp,
//   Link2,
//   type LucideIcon,
// } from "lucide-react";
// import { useRouterStore } from "@/store/routerStore";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   EmptyState,
//   LoadingState,
// } from "@/components/common/StateViews";
// import { formatSAR, timeAgo, halToSar } from "@/lib/format";
// import { cn } from "@/lib/utils";
// import type { WalletTransaction } from "@/types/api";

// interface RecentTransactionsProps {
//   items: WalletTransaction[];
//   loading?: boolean;
// }

// interface TxVisual {
//   icon: LucideIcon;
//   bg: string;
//   color: string;
//   amountColor: string;
// }

// function visualFor(type: string | undefined, isIn: boolean): TxVisual {
//   const t = (type ?? "").toLowerCase();
//   switch (t) {
//     case "topup":
//     case "deposit":
//       return {
//         icon: TrendingUp,
//         bg: "bg-emerald-50",
//         color: "text-emerald-600",
//         amountColor: "text-emerald-600",
//       };
//     case "shipment":
//     case "fee":
//       return {
//         icon: Receipt,
//         bg: "bg-blue-50",
//         color: "text-blue-600",
//         amountColor: "text-red-600",
//       };
//     case "refund":
//       return {
//         icon: ArrowDownLeft,
//         bg: "bg-purple-50",
//         color: "text-purple-600",
//         amountColor: "text-emerald-600",
//       };
//     case "cod":
//       return {
//         icon: CreditCard,
//         bg: "bg-amber-50",
//         color: "text-amber-600",
//         amountColor: "text-emerald-600",
//       };
//     default:
//       return isIn
//         ? {
//             icon: ArrowDownLeft,
//             bg: "bg-emerald-50",
//             color: "text-emerald-600",
//             amountColor: "text-emerald-600",
//           }
//         : {
//             icon: ArrowUpRight,
//             bg: "bg-red-50",
//             color: "text-red-600",
//             amountColor: "text-red-600",
//           };
//   }
// }

// export function RecentTransactions({
//   items,
//   loading,
// }: RecentTransactionsProps) {
//   const navigate = useRouterStore((s) => s.navigate);
//   // NEW: show the last 4 transactions as a horizontal card grid.
//   const recent = items.slice(0, 4);

//   return (
//     <Card className="overflow-hidden h-full shadow-card-soft">
//       <CardContent className="p-0">
//         <div className="flex items-center justify-between p-4 border-b border-border">
//           <div className="flex items-center gap-2">
//             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
//               <WalletIcon className="h-4 w-4 text-teal-600" />
//             </div>
//             <h3 className="text-base font-bold text-foreground">عملياتك المالية الأخيرة</h3>
//           </div>
//           <button
//             type="button"
//             onClick={() => navigate("wallet")}
//             className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
//           >
//             عرض الكل
//             <Link2 className="h-3 w-3 rtl-flip" />
//           </button>
//         </div>
//         {loading ? (
//           <LoadingState message="جارٍ تحميل المعاملات…" className="py-12" />
//         ) : recent.length === 0 ? (
//           <EmptyState
//             title="لا توجد معاملات"
//             description="ستظهر معاملاتك المالية هنا."
//             icon={WalletIcon}
//             className="py-12"
//           />
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
//             {recent.map((t) => {
//               const dir = (t.direction ?? "").toUpperCase();
//               const isIn = dir === "IN" || dir === "CREDIT" || t.direction === "in";
//               const amount = t.amountHal
//                 ? halToSar(t.amountHal)
//                 : (t.amount ?? 0);
//               const visual = visualFor(t.type, isIn);
//               const Icon = visual.icon;
//               return (
//                 <button
//                   key={t.id}
//                   type="button"
//                   onClick={() => navigate("wallet")}
//                   className="group text-right rounded-xl border border-border bg-card p-3 hover:border-primary/40 hover:shadow-card-soft transition-all"
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div
//                       className={cn(
//                         "flex h-8 w-8 items-center justify-center rounded-lg",
//                         visual.bg,
//                         visual.color
//                       )}
//                     >
//                       <Icon className="h-4 w-4" />
//                     </div>
//                     <span
//                       className={cn("text-sm font-bold tabular-nums", visual.amountColor)}
//                       dir="ltr"
//                     >
//                       {isIn ? "+" : "−"}
//                       {formatSAR(amount, { withSymbol: false })}
//                     </span>
//                   </div>
//                   <p className="text-xs font-medium text-foreground truncate">
//                     {t.description ?? t.descriptionAr ?? labelForType(t.type)}
//                   </p>
//                   <p className="text-[10px] text-muted-foreground mt-0.5">
//                     {timeAgo(t.createdAt)}
//                     {t.reference ? ` • ${t.reference}` : ""}
//                   </p>
//                 </button>
//               );
//             })}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// function labelForType(type?: string): string {
//   if (!type) return "معاملة";
//   const t = type.toLowerCase();
//   switch (t) {
//     case "topup":
//       return "شحن المحفظة";
//     case "shipment":
//       return "دفع شحنة";
//     case "refund":
//       return "استرداد";
//     case "cod":
//       return "تحصيل COD";
//     case "fee":
//       return "رسوم";
//     case "adjustment":
//       return "تسوية";
//     default:
//       return "معاملة";
//   }
// }



"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet as WalletIcon,
  CreditCard,
  Receipt,
  TrendingUp,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { useRouterStore } from "@/store/routerStore";
import { Card, CardContent } from "@/components/ui/card";
import {
  EmptyState,
  LoadingState,
} from "@/components/common/StateViews";
import { formatSAR, timeAgo, halToSar } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WalletTransaction } from "@/types/api";

interface RecentTransactionsProps {
  items: WalletTransaction[];
  loading?: boolean;
}

interface TxVisual {
  icon: LucideIcon;
  bg: string;
  color: string;
  amountColor: string;
}

function visualFor(type: string | undefined, isIn: boolean): TxVisual {
  const t = (type ?? "").toLowerCase();
  switch (t) {
    case "topup":
    case "deposit":
      return {
        icon: TrendingUp,
        bg: "bg-emerald-50",
        color: "text-emerald-600",
        amountColor: "text-emerald-600",
      };
    case "shipment":
    case "fee":
      return {
        icon: Receipt,
        bg: "bg-blue-50",
        color: "text-blue-600",
        amountColor: "text-red-600",
      };
    case "refund":
      return {
        icon: ArrowDownLeft,
        bg: "bg-purple-50",
        color: "text-purple-600",
        amountColor: "text-emerald-600",
      };
    case "cod":
      return {
        icon: CreditCard,
        bg: "bg-amber-50",
        color: "text-amber-600",
        amountColor: "text-emerald-600",
      };
    default:
      return isIn
        ? {
            icon: ArrowDownLeft,
            bg: "bg-emerald-50",
            color: "text-emerald-600",
            amountColor: "text-emerald-600",
          }
        : {
            icon: ArrowUpRight,
            bg: "bg-red-50",
            color: "text-red-600",
            amountColor: "text-red-600",
          };
  }
}

/**
 * RecentTransactions — compact horizontal row-cards on mobile (matching the rhythm
 * of `RecentShipments` without bloated vertical whitespace) and 4-column grid on desktop.
 */
export function RecentTransactions({
  items,
  loading,
}: RecentTransactionsProps) {
  const navigate = useRouterStore((s) => s.navigate);
  const recent = items.slice(0, 4);

  return (
    <Card dir="rtl" className="overflow-hidden h-full shadow-card-soft">
      <CardContent className="p-0">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-teal-50 shrink-0">
              <WalletIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              عملياتك المالية الأخيرة
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate("wallet")}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-primary hover:underline"
          >
            عرض الكل
            <Link2 className="h-3 w-3 rtl-flip" />
          </button>
        </div>

        {loading ? (
          <LoadingState message="جارٍ تحميل المعاملات…" className="py-8" />
        ) : recent.length === 0 ? (
          <EmptyState
            title="لا توجد معاملات"
            description="ستظهر معاملاتك المالية هنا."
            icon={WalletIcon}
            className="py-8"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-3.5">
            {recent.map((t) => {
              const dir = (t.direction ?? "").toUpperCase();
              const isIn =
                dir === "IN" || dir === "CREDIT" || t.direction === "in";
              const amount = t.amountHal
                ? halToSar(t.amountHal)
                : (t.amount ?? 0);
              const visual = visualFor(t.type, isIn);
              const Icon = visual.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate("wallet")}
                  className="group flex items-center justify-between gap-2.5 rounded-xl border border-border bg-card px-3 py-2 sm:p-3 text-right hover:border-primary/40 hover:shadow-card-soft transition-all"
                >
                  {/* Icon + Details (Horizontal like RecentShipments) */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        visual.bg,
                        visual.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {t.description ??
                          t.descriptionAr ??
                          labelForType(t.type)}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {timeAgo(t.createdAt)}
                        {t.reference ? ` • ${t.reference}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-left" dir="ltr">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-bold tabular-nums",
                        visual.amountColor
                      )}
                    >
                      {isIn ? "+" : "−"}
                      {formatSAR(amount, { withSymbol: false })}
                    </span>
                    <span className="text-[10px] text-muted-foreground ms-0.5">
                      ر.س
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function labelForType(type?: string): string {
  if (!type) return "معاملة";
  const t = type.toLowerCase();
  switch (t) {
    case "topup":
      return "شحن المحفظة";
    case "shipment":
      return "دفع شحنة";
    case "refund":
      return "استرداد";
    case "cod":
      return "تحصيل COD";
    case "fee":
      return "رسوم";
    case "adjustment":
      return "تسوية";
    default:
      return "معاملة";
  }
}