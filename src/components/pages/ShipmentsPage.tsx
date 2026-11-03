"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search, Filter, Download } from "lucide-react";
import { useRouterStore } from "@/store/routerStore";
import { useAuth } from "@/hooks/useAuth";
import { useShipments } from "@/hooks/useShipments";
import { useDebouncedValue, usePagination } from "@/hooks/useDebounce";
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
import { useTranslation } from "@/i18n";
import type { ShipmentStatus } from "@/types/api";

export function ShipmentsPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { token } = useAuth();
  const { list, loading, error, reload } = useShipments(token);
  const { t, locale } = useTranslation();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [carrier, setCarrier] = useState<string>("all");

  const debouncedQ = useDebouncedValue(q, 250);

  const statusFilters: { value: string; label: string }[] = [
    { value: "all", label: t("shipmentsPage.allStatuses") },
    { value: "DRAFT", label: t("status.DRAFT.label") },
    { value: "PENDING", label: t("status.PENDING.label") },
    { value: "PROCESSING", label: t("status.PROCESSING.label") },
    { value: "IN_TRANSIT", label: t("status.IN_TRANSIT.label") },
    { value: "DELIVERED", label: t("status.DELIVERED.label") },
    { value: "CANCELLED", label: t("status.CANCELLED.label") },
  ];

  const carrierOptions = useMemo(() => {
    const values = list
      .map((s) => s.carrierNameAr ?? s.carrierName ?? s.carrier ?? s.carrierCode ?? "")
      .map((value) => value.trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, locale));
  }, [list, locale]);

  const filtered = useMemo(() => {
    return list.filter((s) => {
      const matchesQ =
        !debouncedQ ||
        (s.trackingNumber ?? "").toLowerCase().includes(debouncedQ.toLowerCase()) ||
        (s.receiverName ?? "").toLowerCase().includes(debouncedQ.toLowerCase()) ||
        (s.receiverPhone ?? "").toLowerCase().includes(debouncedQ.toLowerCase()) ||
        (s.receiverCity ?? "").toLowerCase().includes(debouncedQ.toLowerCase()) ||
        (s.senderCity ?? "").toLowerCase().includes(debouncedQ.toLowerCase());
      const matchesStatus =
        status === "all" ||
        String(s.status).toUpperCase() === status;
      const shipmentCarrier = (s.carrierNameAr ?? s.carrierName ?? s.carrier ?? s.carrierCode ?? "").trim();
      const matchesCarrier = carrier === "all" || shipmentCarrier === carrier;
      return matchesQ && matchesStatus && matchesCarrier;
    });
  }, [list, debouncedQ, status, carrier]);

  const { paginated, page, totalPages, hasNext, hasPrev, nextPage, prevPage } = usePagination(filtered, 20);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info(t("shipmentsPage.noShipmentsToExport"));
      return;
    }
    const csvCell = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      [
        t("shipmentsPage.csvHeaders.trackingNumber"),
        t("shipmentsPage.csvHeaders.carrier"),
        t("shipmentsPage.csvHeaders.receiverName"),
        t("shipmentsPage.csvHeaders.receiverPhone"),
        t("shipmentsPage.csvHeaders.senderCity"),
        t("shipmentsPage.csvHeaders.receiverCity"),
        t("shipmentsPage.csvHeaders.status"),
        t("shipmentsPage.csvHeaders.amountSar"),
        t("shipmentsPage.csvHeaders.createdAt"),
      ],
      ...filtered.map((s) => [
        s.trackingNumber ?? s.id,
        s.carrierNameAr ?? s.carrierName ?? s.carrier ?? s.carrierCode ?? "",
        s.receiverName ?? "",
        s.receiverPhone ?? "",
        s.senderCity ?? "",
        s.receiverCity ?? "",
        s.status ?? "",
        s.totalHal != null ? halToSar(s.totalHal) : s.price ?? 0,
        s.createdAt ?? "",
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `masarx-shipments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(t("shipmentsPage.exportedCountToast", { count: filtered.length }));
  };

  const arrowChar = locale === "en" ? "→" : "←";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("shipmentsPage.title")}
        description={t("shipmentsPage.description")}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="h-4 w-4" />
              {t("common.export")}
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => navigate("create-shipment")}
            >
              <Plus className="h-4 w-4" />
              {t("nav.newShipment")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("shipmentsPage.searchPlaceholder")}
              className="ps-9"
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
              {statusFilters.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder={t("shipmentsPage.allCarriers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("shipmentsPage.allCarriers")}</SelectItem>
              {carrierOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message={t("shipmentsPage.loading")} className="py-16" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="py-16" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                q || status !== "all" || carrier !== "all"
                  ? t("common.noMatchingResults")
                  : t("shipmentsPage.emptyTitle")
              }
              description={
                q || status !== "all" || carrier !== "all"
                  ? t("common.tryAdjustingSearch")
                  : t("shipmentsPage.emptyDesc")
              }
              icon={Plus}
              action={
                !q && status === "all" ? (
                  <Button
                    size="sm"
                    onClick={() => navigate("create-shipment")}
                  >
                    {t("shipmentsPage.createShipment")}
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
                      <TableHead className="text-start">{t("shipmentsPage.table.trackingNumber")}</TableHead>
                      <TableHead className="text-start">{t("shipmentsPage.table.route")}</TableHead>
                      <TableHead className="text-start">{t("shipmentsPage.table.receiver")}</TableHead>
                      <TableHead className="text-start">{t("shipmentsPage.table.carrier")}</TableHead>
                      <TableHead className="text-start">{t("shipmentsPage.table.status")}</TableHead>
                      <TableHead className="text-start">{t("shipmentsPage.table.amount")}</TableHead>
                      <TableHead className="text-start">{t("shipmentsPage.table.date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((s) => {
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
                                {s.senderCity ?? t("common.none")}
                              </span>
                              <span className="text-muted-foreground">{arrowChar}</span>
                              <span className="font-medium text-foreground">
                                {s.receiverCity ?? t("common.none")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.receiverName ?? t("common.none")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.carrierNameAr ?? s.carrierName ?? t("common.none")}
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
                            {price ? formatSAR(price) : t("common.none")}
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
                {paginated.map((s) => {
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        navigate("shipment-details", { id: s.id })
                      }
                      className="w-full flex flex-col gap-2 p-4 text-start hover:bg-muted/30"
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
                          {s.senderCity ?? t("common.none")}
                        </span>
                        <span className="text-muted-foreground">{arrowChar}</span>
                        <span className="font-medium">
                          {s.receiverCity ?? t("common.none")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {s.carrierNameAr ?? s.carrier ?? t("common.none")}
                        </span>
                        <span>{formatDate(s.createdAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={!hasPrev}
                  >
                    {t("common.previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t("common.pageOf", { page, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={!hasNext}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
