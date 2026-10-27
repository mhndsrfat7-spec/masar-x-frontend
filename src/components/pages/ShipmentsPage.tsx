"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Filter, Download } from "lucide-react";
import { useRouterStore } from "@/store/routerStore";
import { useAuth } from "@/hooks/useAuth";
import { useShipments } from "@/hooks/useShipments";
import { PageHeader } from "@/components/common/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/common/StateViews";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatSAR, halToSar } from "@/lib/format";
import type { ShipmentStatus } from "@/types/api";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "DRAFT", label: "مسودة" },
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "PROCESSING", label: "قيد المعالجة" },
  { value: "IN_TRANSIT", label: "قيد التوصيل" },
  { value: "DELIVERED", label: "تم التسليم" },
  { value: "CANCELLED", label: "ملغاة" },
];

export function ShipmentsPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { token } = useAuth();
  const { list, loading, error, reload } = useShipments(token);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return list.filter((s) => {
      const matchesQ =
        !q ||
        (s.trackingNumber ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (s.receiverName ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (s.receiverCity ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (s.senderCity ?? "").toLowerCase().includes(q.toLowerCase());
      const matchesStatus =
        status === "all" ||
        String(s.status).toUpperCase() === status;
      return matchesQ && matchesStatus;
    });
  }, [list, q, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="الشحنات"
        description="إدارة وتتبّع جميع شحناتك في مكان واحد."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              تصدير
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => navigate("create-shipment")}
            >
              <Plus className="h-4 w-4" />
              شحنة جديدة
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم التتبع، المدينة، المستلم…"
              className="pr-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-44 gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message="جارٍ تحميل الشحنات…" className="py-16" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="py-16" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                q || status !== "all" ? "لا توجد نتائج مطابقة" : "لا توجد شحنات بعد"
              }
              description={
                q || status !== "all"
                  ? "جرّب تعديل البحث أو الفلتر."
                  : "ابدأ بإنشاء شحنتك الأولى."
              }
              icon={Plus}
              action={
                !q && status === "all" ? (
                  <Button
                    size="sm"
                    onClick={() => navigate("create-shipment")}
                  >
                    إنشاء شحنة
                  </Button>
                ) : undefined
              }
              className="py-16"
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-right">رقم التتبع</TableHead>
                      <TableHead className="text-right">المسار</TableHead>
                      <TableHead className="text-right">المستلم</TableHead>
                      <TableHead className="text-right">الناقل</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">القيمة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => {
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
                            {s.trackingNumber ??
                              s.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">
                                {s.senderCity ?? "—"}
                              </span>
                              <span className="text-muted-foreground">←</span>
                              <span className="font-medium text-foreground">
                                {s.receiverCity ?? "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.receiverName ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.carrierNameAr ?? s.carrierName ?? "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={s.status as ShipmentStatus}
                              size="sm"
                            />
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden divide-y divide-border">
                {filtered.map((s) => {
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
                        <StatusBadge
                          status={s.status as ShipmentStatus}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium">
                          {s.senderCity ?? "—"}
                        </span>
                        <span className="text-muted-foreground">←</span>
                        <span className="font-medium">
                          {s.receiverCity ?? "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {s.carrierNameAr ?? s.carrier ?? "—"}
                        </span>
                        <span>{formatDate(s.createdAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
