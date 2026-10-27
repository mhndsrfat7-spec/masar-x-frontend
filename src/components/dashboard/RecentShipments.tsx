"use client";

import { Link2, Eye, ArrowLeft } from "lucide-react";
import { useRouterStore } from "@/store/routerStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/common/StateViews";
import { SectionTitle } from "@/components/common/PageHeader";
import { formatDate, formatSAR, halToSar } from "@/lib/format";
import type { Shipment } from "@/types/api";

interface RecentShipmentsProps {
  items: Shipment[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function RecentShipments({
  items,
  loading,
  error,
  onRetry,
}: RecentShipmentsProps) {
  const navigate = useRouterStore((s) => s.navigate);
  const recent = items.slice(0, 6);

  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border">
          <SectionTitle
            title="أحدث الشحنات"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-primary"
                onClick={() => navigate("shipments")}
              >
                عرض الكل
                <Link2 className="h-3.5 w-3.5" />
              </Button>
            }
          />
        </div>

        {loading ? (
          <LoadingState message="جارٍ تحميل الشحنات…" className="py-12" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} className="py-12" />
        ) : recent.length === 0 ? (
          <EmptyState
            title="لا توجد شحنات بعد"
            description="ابدأ بإنشاء شحنتك الأولى لرؤيتها هنا."
            icon={Link2}
            action={
              <Button size="sm" onClick={() => navigate("create-shipment")}>
                إنشاء شحنة
              </Button>
            }
            className="py-12"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-right">رقم التتبع</TableHead>
                    <TableHead className="text-right">المسار</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((s) => {
                    const price = s.totalHal
                      ? halToSar(s.totalHal)
                      : s.price ?? 0;
                    return (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() =>
                          navigate("shipment-details", { id: s.id })
                        }
                      >
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {s.trackingNumber ?? s.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">
                              {s.senderCity ?? "—"}
                            </span>
                            <ArrowLeft className="h-3 w-3 text-muted-foreground rtl-flip" />
                            <span className="font-medium">
                              {s.receiverCity ?? "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} size="sm" />
                        </TableCell>
                        <TableCell
                          className="text-sm font-semibold"
                          dir="ltr"
                        >
                          {price ? formatSAR(price) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(s.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("shipment-details", { id: s.id });
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {recent.map((s) => {
                const price = s.totalHal
                  ? halToSar(s.totalHal)
                  : s.price ?? 0;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      navigate("shipment-details", { id: s.id })
                    }
                    className="w-full flex flex-col gap-2 p-4 text-right hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {s.trackingNumber ??
                          s.id.slice(0, 8).toUpperCase()}
                      </span>
                      <StatusBadge status={s.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium">{s.senderCity ?? "—"}</span>
                      <ArrowLeft className="h-3 w-3 text-muted-foreground rtl-flip" />
                      <span className="font-medium">
                        {s.receiverCity ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{formatDate(s.createdAt)}</span>
                      <span dir="ltr">
                        {price ? formatSAR(price) : "—"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
