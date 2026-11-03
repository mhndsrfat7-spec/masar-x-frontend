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
import { useTranslation, tStatic } from "@/i18n";
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
  const { t, dir } = useTranslation();
  const recent = items.slice(0, 4);

  return (
    <Card dir={dir} className="overflow-hidden h-full shadow-card-soft">
      <CardContent className="p-0">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-teal-50 shrink-0">
              <WalletIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {t("dashboard.recentTransactions.title")}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate("wallet")}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-primary hover:underline"
          >
            {t("common.viewAll")}
            <Link2 className="h-3 w-3 rtl-flip" />
          </button>
        </div>

        {loading ? (
          <LoadingState message={t("dashboard.recentTransactions.loading")} className="py-8" />
        ) : recent.length === 0 ? (
          <EmptyState
            title={t("dashboard.recentTransactions.emptyTitle")}
            description={t("dashboard.recentTransactions.emptyDesc")}
            icon={WalletIcon}
            className="py-8"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-3.5">
            {recent.map((tx) => {
              const txDir = (tx.direction ?? "").toUpperCase();
              const isIn =
                txDir === "IN" || txDir === "CREDIT" || tx.direction === "in";
              const amount = tx.amountHal
                ? halToSar(tx.amountHal)
                : (tx.amount ?? 0);
              const visual = visualFor(tx.type, isIn);
              const Icon = visual.icon;
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => navigate("wallet")}
                  className="group flex items-center justify-between gap-2.5 rounded-xl border border-border bg-card px-3 py-2 sm:p-3 text-start hover:border-primary/40 hover:shadow-card-soft transition-all"
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
                        {tx.description ??
                          tx.descriptionAr ??
                          labelForType(tx.type)}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {timeAgo(tx.createdAt)}
                        {tx.reference ? ` • ${tx.reference}` : ""}
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
                      {t("common.sar")}
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
  if (!type) return tStatic("dashboard.recentTransactions.types.default");
  const t = type.toLowerCase();
  switch (t) {
    case "topup":
      return tStatic("dashboard.recentTransactions.types.topup");
    case "shipment":
      return tStatic("dashboard.recentTransactions.types.shipment");
    case "refund":
      return tStatic("dashboard.recentTransactions.types.refund");
    case "cod":
      return tStatic("dashboard.recentTransactions.types.cod");
    case "fee":
      return tStatic("dashboard.recentTransactions.types.fee");
    case "adjustment":
      return tStatic("dashboard.recentTransactions.types.adjustment");
    default:
      return tStatic("dashboard.recentTransactions.types.default");
  }
}