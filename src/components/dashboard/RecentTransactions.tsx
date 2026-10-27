"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet as WalletIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/common/PageHeader";
import {
  EmptyState,
  LoadingState,
} from "@/components/common/StateViews";
import { formatSAR, timeAgo, halToSar } from "@/lib/format";
import type { WalletTransaction } from "@/types/api";

interface RecentTransactionsProps {
  items: WalletTransaction[];
  loading?: boolean;
}

export function RecentTransactions({
  items,
  loading,
}: RecentTransactionsProps) {
  const recent = items.slice(0, 6);

  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border">
          <SectionTitle title="أحدث المعاملات" />
        </div>
        {loading ? (
          <LoadingState message="جارٍ تحميل المعاملات…" className="py-12" />
        ) : recent.length === 0 ? (
          <EmptyState
            title="لا توجد معاملات"
            description="ستظهر معاملاتك المالية هنا."
            icon={WalletIcon}
            className="py-12"
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((t) => {
              const dir = (t.direction ?? "").toUpperCase();
              const isIn = dir === "IN" || dir === "CREDIT" || t.direction === "in";
              const amount = t.amountHal
                ? halToSar(t.amountHal)
                : (t.amount ?? 0);
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/30"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isIn
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {isIn ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {t.description ?? t.descriptionAr ?? labelForType(t.type)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {timeAgo(t.createdAt)}
                      {t.reference ? ` • ${t.reference}` : ""}
                    </p>
                  </div>
                  <div className="text-end">
                    <p
                      className={`text-sm font-bold ${
                        isIn ? "text-green-700" : "text-red-700"
                      }`}
                      dir="ltr"
                    >
                      {isIn ? "+" : "−"}
                      {formatSAR(amount, { withSymbol: false })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">ر.س</p>
                  </div>
                </li>
              );
            })}
          </ul>
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
