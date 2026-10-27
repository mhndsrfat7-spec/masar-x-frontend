"use client";

import { useState, useMemo } from "react";
import { FileText, Search, Eye, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useInvoices } from "@/hooks/useData";
import { invoicesApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatSAR, halToSar } from "@/lib/format";

export function InvoicesPage() {
  const { token } = useAuth();
  const { list, loading, error, reload } = useInvoices(token);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return list;
    const lq = q.toLowerCase();
    return list.filter(
      (i) =>
        (i.number ?? i.invoiceNumber ?? "")
          .toLowerCase()
          .includes(lq) ||
        (i.trackingNumber ?? "").toLowerCase().includes(lq)
    );
  }, [list, q]);

  const handlePdf = async (id: string) => {
    if (!token) return;
    try {
      const res = await invoicesApi.pdf(token, id);
      if (res?.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        toast.info("لا تتوفر فاتورة PDF لهذه الشحنة بعد");
      }
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "تعذّر جلب الفاتورة"
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الفواتير"
        description="الفواتير الضريبية المتوافقة مع ZATCA لجميع شحناتك."
      />

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث برقم الفاتورة أو رقم التتبع…"
          className="pr-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message="جارٍ تحميل الفواتير…" className="py-16" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="py-16" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={q ? "لا توجد نتائج" : "لا توجد فواتير"}
              description={
                q
                  ? "جرّب تعديل البحث"
                  : "تُصدر الفواتير تلقائياً عند تأكيد الشحنات."
              }
              icon={FileText}
              className="py-16"
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-right">رقم الفاتورة</TableHead>
                      <TableHead className="text-right">رقم التتبع</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الضريبة</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => {
                      const total = inv.totalHal
                        ? halToSar(inv.totalHal)
                        : inv.total ?? 0;
                      const amount = inv.amountHal
                        ? halToSar(inv.amountHal)
                        : inv.amount ?? inv.subtotal ?? 0;
                      const vat = inv.vatHal
                        ? halToSar(inv.vatHal)
                        : inv.vat ?? 0;
                      return (
                        <TableRow key={inv.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {inv.number ?? inv.invoiceNumber ?? inv.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {inv.trackingNumber ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm" dir="ltr">
                            {amount ? formatSAR(amount) : "—"}
                          </TableCell>
                          <TableCell
                            className="text-sm text-muted-foreground"
                            dir="ltr"
                          >
                            {vat ? formatSAR(vat) : "—"}
                          </TableCell>
                          <TableCell className="text-sm font-bold" dir="ltr">
                            {total ? formatSAR(total) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-muted/30">
                              {inv.status ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(inv.createdAt ?? inv.issueDate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handlePdf(inv.id)}
                                aria-label="عرض الفاتورة"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handlePdf(inv.id)}
                                aria-label="تحميل PDF"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden divide-y divide-border">
                {filtered.map((inv) => {
                  const total = inv.totalHal
                    ? halToSar(inv.totalHal)
                    : inv.total ?? 0;
                  return (
                    <div key={inv.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {inv.number ?? inv.invoiceNumber ?? inv.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Badge variant="outline">{inv.status ?? "—"}</Badge>
                      </div>
                      {inv.trackingNumber && (
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {inv.trackingNumber}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">الإجمالي</span>
                        <span className="font-bold" dir="ltr">
                          {total ? formatSAR(total) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(inv.createdAt ?? inv.issueDate)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePdf(inv.id)}
                          className="h-7 gap-1 text-xs"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </Button>
                      </div>
                    </div>
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
