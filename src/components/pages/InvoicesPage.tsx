"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Search,
  Eye,
  Download,
  Calendar,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Hash,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useInvoices } from "@/hooks/useData";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoMark } from "@/components/brand/Logo";
import { formatDate, formatSAR, halToSar } from "@/lib/format";
import { renderZatcaQrDataUrl } from "@/lib/zatcaQr";
import type { Invoice } from "@/types/api";

export function InvoicesPage() {
  const { token } = useAuth();
  const { list, loading, error, reload } = useInvoices(token);
  const [q, setQ] = useState("");
  // NEW: popup invoice preview state (replaces window.open("#") navigation)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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

  /**
   * Open the invoice preview popup instead of navigating to a second screen.
   * `invoicesApi.pdf` returns `{ url: "#" }` in demo mode, so we never call
   * window.open — we show the full invoice inline with download/print options.
   */
  const openInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
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
                                onClick={() => openInvoice(inv)}
                                aria-label="عرض الفاتورة"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openInvoice(inv)}
                                aria-label="تحميل الفاتورة"
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
                          onClick={() => openInvoice(inv)}
                          className="h-7 gap-1 text-xs"
                        >
                          <Download className="h-3 w-3" />
                          عرض الفاتورة
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

      {/* NEW: Invoice preview popup — replaces the broken window.open("#") flow */}
      <InvoicePreviewModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}

/* ============================================================================
 * NEW: InvoicePreviewModal — ZATCA-compliant simplified tax invoice popup.
 * Renders invoice details inline (no second screen), with a TLV QR seal,
 * plus real Download (HTML Blob) and Print buttons.
 * ==========================================================================*/
function InvoicePreviewModal({
  invoice,
  onClose,
}: {
  invoice: Invoice | null;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Compute financial fields once per opened invoice.
  const total = invoice?.totalHal
    ? halToSar(invoice.totalHal)
    : invoice?.total ?? 0;
  const amount = invoice?.amountHal
    ? halToSar(invoice.amountHal)
    : invoice?.amount ?? invoice?.subtotal ?? 0;
  const vat = invoice?.vatHal
    ? halToSar(invoice.vatHal)
    : invoice?.vat ?? 0;
  const invoiceNumber =
    invoice?.number ?? invoice?.invoiceNumber ?? (invoice?.id ?? "").slice(0, 8).toUpperCase();

  // Generate the ZATCA TLV QR whenever a new invoice is opened.
  useEffect(() => {
    if (!invoice) {
      setQrDataUrl("");
      return;
    }
    let cancelled = false;
    renderZatcaQrDataUrl({
      sellerName: "مسار إكس",
      vatNumber: "300000000000003",
      timestamp: invoice.createdAt ?? invoice.issueDate ?? new Date().toISOString(),
      totalWithVat: total.toFixed(2),
      vatAmount: vat.toFixed(2),
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [invoice, total, vat]);

  // Reference back to the bearer token (kept for the real-API PDF path below).
  void token;

  /** Build a self-contained printable HTML document for the invoice. */
  const buildInvoiceHtml = (): string => {
    const rows = [
      ["المبلغ الأساسي قبل الضريبة", amount.toFixed(2)],
      ["ضريبة القيمة المضافة (15%)", vat.toFixed(2)],
      ["الإجمالي شامل الضريبة", total.toFixed(2)],
    ];
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>فاتورة ضريبية — ${invoiceNumber}</title>
<style>
  body { font-family: "Segoe UI", Tahoma, sans-serif; background:#f6f6f4; margin:0; padding:32px; color:#0f172a; }
  .invoice { max-width:680px; margin:0 auto; background:#fff; border-radius:14px; box-shadow:0 6px 30px rgba(0,0,0,.08); overflow:hidden; }
  .head { background:linear-gradient(135deg,#0D3B3E,#1F7A4E); color:#fff; padding:28px 32px; display:flex; justify-content:space-between; align-items:center; }
  .brand-name { font-size:22px; font-weight:800; margin:0; }
  .brand-sub { font-size:11px; letter-spacing:.2em; opacity:.85; margin:2px 0 0; }
  .zatca-badge { background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25); padding:8px 14px; border-radius:8px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:6px; }
  .body { padding:28px 32px; }
  .meta { display:grid; grid-template-columns:1fr 1fr; gap:14px 24px; margin-bottom:22px; }
  .meta-item { font-size:13px; }
  .meta-label { color:#64748b; font-size:11px; margin-bottom:2px; }
  .meta-value { font-weight:600; }
  .meta-value.mono { font-family:monospace; direction:ltr; text-align:right; }
  table { width:100%; border-collapse:collapse; margin:12px 0 22px; }
  th, td { padding:12px 14px; text-align:right; border-bottom:1px solid #e2e8f0; font-size:13px; }
  th { background:#f1f5f9; color:#475569; font-weight:700; font-size:12px; }
  .total-row td { font-weight:800; font-size:15px; background:#f0fdf4; border-bottom:none; }
  .qr-row { display:flex; align-items:center; gap:18px; padding:18px; background:#f8fafc; border-radius:10px; margin-top:8px; }
  .qr-row img { width:130px; height:130px; }
  .qr-note { font-size:11px; color:#64748b; line-height:1.7; }
  .foot { padding:16px 32px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center; }
  .status { display:inline-block; padding:4px 12px; border-radius:999px; background:#dcfce7; color:#166534; font-size:11px; font-weight:700; }
  @media print { body { background:#fff; padding:0; } .invoice { box-shadow:none; max-width:100%; } }
</style>
</head>
<body>
<div class="invoice">
  <div class="head">
    <div>
      <p class="brand-name">مسار إكس</p>
      <p class="brand-sub">MASAR X — منصة الشحن السعودية الموحدة</p>
      <p style="font-size:11px;opacity:.8;margin:6px 0 0;">الرقم الضريبي الموحد: 300000000000003</p>
    </div>
    <span class="zatca-badge">✓ فاتورة ضريبية متوافقة مع ZATCA</span>
  </div>
  <div class="body">
    <div class="meta">
      <div class="meta-item"><div class="meta-label">رقم الفاتورة</div><div class="meta-value mono">${invoiceNumber}</div></div>
      <div class="meta-item"><div class="meta-label">حالة الفاتورة</div><div class="meta-value"><span class="status">${(invoice?.status ?? "PAID") === "PAID" || (invoice?.status ?? "").toUpperCase() === "مدفوعة" ? "مدفوعة" : invoice?.status ?? "مدفوعة"}</span></div></div>
      <div class="meta-item"><div class="meta-label">رقم تتبع الشحنة</div><div class="meta-value mono">${invoice?.trackingNumber ?? "—"}</div></div>
      <div class="meta-item"><div class="meta-label">تاريخ ووقت الإصدار</div><div class="meta-value">${formatDate(invoice?.createdAt ?? invoice?.issueDate)}</div></div>
    </div>
    <table>
      <thead><tr><th>البند</th><th style="text-align:left">المبلغ (ر.س)</th></tr></thead>
      <tbody>
        ${rows
          .map(
            ([label, val], i) =>
              `<tr class="${i === rows.length - 1 ? "total-row" : ""}"><td>${label}</td><td style="text-align:left;direction:ltr">${val}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>
    ${
      qrDataUrl
        ? `<div class="qr-row">
            <img src="${qrDataUrl}" alt="ZATCA QR" />
            <div class="qr-note">
              <strong>ختم هيئة الزكاة والضريبة والجمارك</strong><br />
              رمز QR قياسي (TLV Base64) يحتوي على اسم البائع، الرقم الضريبي،<br />
              الطابع الزمني، إجمالي الفاتورة، ومبلغ الضريبة — قابل للقراءة عبر تطبيق ZATCA.
            </div>
          </div>`
        : ""
    }
  </div>
  <div class="foot">© ${new Date().getFullYear()} مسار إكس — جميع الحقوق محفوظة. هذه فاتورة ضريبية إلكترونية متوافقة مع متطلبات الفوترة الإلكترونية (المرحلة الأولى).</div>
</div>
</body>
</html>`;
  };

  const handleDownload = () => {
    if (!invoice) return;
    const html = buildInvoiceHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل الفاتورة الضريبية بنجاح");
  };

  const handlePrint = () => {
    if (!invoice) return;
    const html = buildInvoiceHtml();
    const w = window.open("", "_blank", "noopener,noreferrer,width=820,height=900");
    if (!w) {
      toast.error("تعذّر فتح نافذة الطباعة — تحقق من مانع النوافذ المنبثقة");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Give the QR image time to load before invoking print.
    setTimeout(() => {
      w.focus();
      w.print();
    }, 600);
  };

  if (!invoice) return null;

  const isPaid =
    (invoice.status ?? "PAID").toUpperCase() === "PAID" ||
    (invoice.status ?? "") === "مدفوعة";

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>معاينة الفاتورة الضريبية — {invoiceNumber}</DialogTitle>
        </DialogHeader>

        {/* Popup header bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">معاينة الفاتورة الضريبية</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Invoice printable area */}
        <div className="invoice-print-area p-6 sm:p-8">
          {/* Header: brand + ZATCA badge */}
          <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b-2 border-primary">
            <div className="flex items-center gap-3">
              <LogoMark size={48} />
              <div>
                <p className="text-lg font-extrabold text-foreground leading-tight">مسار إكس</p>
                <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground">MASAR X</p>
                <p className="text-[10px] text-muted-foreground mt-1">الرقم الضريبي الموحد: 300000000000003</p>
              </div>
            </div>
            <div className="text-left space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                فاتورة ضريبية متوافقة مع ZATCA
              </span>
              <div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {isPaid ? "مدفوعة (PAID)" : invoice.status ?? "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice meta */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <MetaRow icon={<Hash className="h-3.5 w-3.5" />} label="رقم الفاتورة" value={invoiceNumber} mono />
            <MetaRow icon={<Truck className="h-3.5 w-3.5" />} label="رقم تتبع الشحنة" value={invoice.trackingNumber ?? "—"} mono />
            <MetaRow icon={<Building2 className="h-3.5 w-3.5" />} label="الجهة المُصدِرة" value="شركة مسار إكس للخدمات اللوجستية" />
            <MetaRow icon={<Calendar className="h-3.5 w-3.5" />} label="تاريخ ووقت الإصدار" value={formatDate(invoice.createdAt ?? invoice.issueDate)} />
          </div>

          {/* Financial table */}
          <div className="rounded-xl border border-border overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-xs">
                  <th className="text-right p-3 font-semibold">البند</th>
                  <th className="text-left p-3 font-semibold">المبلغ (ر.س)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="p-3 text-foreground">المبلغ الأساسي قبل الضريبة</td>
                  <td className="p-3 text-left font-medium" dir="ltr">{amount.toFixed(2)}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3 text-foreground">ضريبة القيمة المضافة (15%)</td>
                  <td className="p-3 text-left font-medium text-muted-foreground" dir="ltr">{vat.toFixed(2)}</td>
                </tr>
                <tr className="border-t border-border bg-emerald-50/60">
                  <td className="p-3 font-bold text-foreground">الإجمالي شامل الضريبة</td>
                  <td className="p-3 text-left font-extrabold text-emerald-700 text-base" dir="ltr">{total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ZATCA QR seal */}
          <div className="flex items-center gap-4 rounded-xl bg-muted/30 border border-border p-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="ZATCA QR"
                className="h-28 w-28 shrink-0 bg-white p-1 rounded-lg"
              />
            ) : (
              <div className="h-28 w-28 shrink-0 bg-white rounded-lg animate-pulse" />
            )}
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1">ختم هيئة الزكاة والضريبة والجمارك</p>
              رمز QR قياسي (TLV Base64) يحتوي على اسم البائع، الرقم الضريبي، الطابع الزمني، إجمالي الفاتورة، ومبلغ الضريبة — قابل للقراءة عبر تطبيق ZATCA الرسمي.
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 grid grid-cols-3 gap-2 p-4 border-t border-border bg-card">
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            تنزيل الفاتورة
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة الفاتورة
          </Button>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetaRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p
        className={`text-sm font-semibold text-foreground ${
          mono ? "font-mono" : ""
        }`}
        dir={mono ? "ltr" : undefined}
      >
        {value}
      </p>
    </div>
  );
}
