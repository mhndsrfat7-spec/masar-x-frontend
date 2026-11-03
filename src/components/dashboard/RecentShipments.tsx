"use client";

import { useState } from "react";
import { Link2, ArrowLeft, Package, Eye, Printer } from "lucide-react";
import { useRouterStore } from "@/store/routerStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AwbWaybillModal } from "@/components/common/AwbWaybillModal";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/common/StateViews";
import { formatDate, formatSAR, halToSar } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import type { Shipment } from "@/types/api";

interface RecentShipmentsProps {
  items: Shipment[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * RecentShipments:
 * - Mobile (<lg): Shows ONLY the last 4 shipments with tight, clean spacing.
 * - Laptop (lg+): Shows up to 5 shipments locked at `lg:h-[420px] h-full` to match `BrandPromoCard`.
 */
export function RecentShipments({
  items,
  loading,
  error,
  onRetry,
}: RecentShipmentsProps) {
  const navigate = useRouterStore((s) => s.navigate);
  const { t, dir } = useTranslation();
  // Slice 5 items max; 5th item is hidden on mobile (<lg) so mobile shows strictly 4 shipments
  const recent = items.slice(0, 5);
  const [awbShipment, setAwbShipment] = useState<Shipment | null>(null);
  const [awbOpen, setAwbOpen] = useState(false);

  const openAwb = (e: React.MouseEvent, s: Shipment) => {
    e.stopPropagation();
    setAwbShipment(s);
    setAwbOpen(true);
  };

  return (
    <Card
      dir={dir}
      className="overflow-hidden h-full lg:h-[420px] flex flex-col shadow-card-soft"
    >
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-50 shrink-0">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {t("dashboard.recentShipments.title")}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 sm:h-8 gap-1 px-2 text-[11px] sm:text-xs text-primary hover:text-primary hover:bg-primary/5"
            onClick={() => navigate("shipments")}
          >
            {t("common.viewAll")}
            <Link2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 rtl-flip" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          {loading ? (
            <LoadingState message={t("dashboard.recentShipments.loading")} className="py-8" />
          ) : error ? (
            <ErrorState message={error} onRetry={onRetry} className="py-8" />
          ) : recent.length === 0 ? (
            <EmptyState
              title={t("dashboard.recentShipments.emptyTitle")}
              description={t("dashboard.recentShipments.emptyDesc")}
              icon={Link2}
              action={
                <Button size="sm" onClick={() => navigate("create-shipment")}>
                  {t("dashboard.recentShipments.createShipment")}
                </Button>
              }
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((s, idx) => {
                const price = s.totalHal
                  ? halToSar(s.totalHal)
                  : s.price ?? 0;
                const tracking =
                  s.trackingNumber ?? s.id.slice(0, 8).toUpperCase();
                return (
                  <li
                    key={s.id}
                    className={cn(idx >= 4 && "hidden lg:block")}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate("shipment-details", { id: s.id })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate("shipment-details", { id: s.id });
                        }
                      }}
                      className="w-full flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 text-start hover:bg-muted/30 transition-colors group cursor-pointer"
                    >
                      {/* Status badge column */}
                      <div className="shrink-0 min-w-[76px] sm:min-w-[84px]">
                        <StatusBadge status={s.status} size="sm" />
                      </div>

                      {/* Route + tracking */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <span className="font-semibold text-foreground truncate">
                            {s.receiverCity ?? t("common.none")}
                          </span>
                          <ArrowLeft className="h-3 w-3 text-muted-foreground rtl-flip shrink-0" />
                          <span className="text-muted-foreground text-[11px] sm:text-xs truncate">
                            {s.senderCity ?? t("common.none")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="font-mono text-[10px] sm:text-[11px] text-muted-foreground"
                            dir="ltr"
                          >
                            #{tracking}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70">
                            {formatDate(s.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      {price > 0 && (
                        <div
                          className="text-xs sm:text-sm font-semibold text-foreground shrink-0"
                          dir="ltr"
                        >
                          {formatSAR(price)}
                        </div>
                      )}

                      {/* Quick AWB / waybill button */}
                      <button
                        type="button"
                        onClick={(e) => openAwb(e, s)}
                        title={t("dashboard.recentShipments.previewWaybill")}
                        aria-label={t("dashboard.recentShipments.previewWaybill")}
                        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>

                      {/* Action icon */}
                      <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>

      {/* AWB waybill modal */}
      <AwbWaybillModal
        open={awbOpen}
        onOpenChange={setAwbOpen}
        shipment={awbShipment}
      />
    </Card>
  );
}