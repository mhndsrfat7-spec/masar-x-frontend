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
import { useTranslation } from "@/i18n";
import type { Invoice } from "@/types/api";

export function InvoicesPage() {
  const { token } = useAuth();
  const { list, loading, error, reload } = useInvoices(token);
  const { t } = useTranslation();
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

  const openInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("invoicesPage.title")}
        description={t("invoicesPage.description")}
      />

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("invoicesPage.searchPlaceholder")}
          className="ps-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message={t("invoicesPage.loading")} className="py-16" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="py-16" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={q ? t("common.noResults") : t("invoicesPage.emptyTitle")}
              description={
                q
                  ? t("common.tryAdjustingSearchOnly")
                  : t("invoicesPage.emptyDesc")
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
                      <TableHead className="text-start">{t("invoicesPage.table.invoiceNumber")}</TableHead>
                      <TableHead className="text-start">{t("invoicesPage.table.trackingNumber")}</TableHead>
                      <TableHead className="text-start">{t("invoicesPage.table.amount")}</TableHead>
                      <TableHead className="text-start">{t("invoicesPage.table.vat")}</TableHead>
                      <TableHead className="text-start">{t("invoicesPage.table.total")}</TableHead>
                      <TableHead className="text-start">{t("invoicesPage.table.status")}</TableHead>
                      <TableHead className="text-start">{t("invoicesPage.table.date")}</TableHead>
                      <TableHead className="text-start">{t("invoicesPage.table.action")}</TableHead>
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
                            {inv.trackingNumber ?? t("common.none")}
                          </TableCell>
                          <TableCell className="text-sm" dir="ltr">
                            {amount ? formatSAR(amount) : t("common.none")}
                          </TableCell>
                          <TableCell
                            className="text-sm text-muted-foreground"
                            dir="ltr"
                          >
                            {vat ? formatSAR(vat) : t("common.none")}
                          </TableCell>
                          <TableCell className="text-sm font-bold" dir="ltr">
                            {total ? formatSAR(total) : t("common.none")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-muted/30">
                              {inv.status ?? t("common.none")}
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
                                aria-label={t("invoicesPage.viewInvoiceBtn")}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openInvoice(inv)}
                                aria-label={t("invoicesPage.downloadInvoiceAria")}
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
                        <Badge variant="outline">{inv.status ?? t("common.none")}</Badge>
                      </div>
                      {inv.trackingNumber && (
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {inv.trackingNumber}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("invoicesPage.table.total")}</span>
                        <span className="font-bold" dir="ltr">
                          {total ? formatSAR(total) : t("common.none")}
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
                          {t("invoicesPage.viewInvoiceBtn")}
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
  const { t, locale, dir } = useTranslation();
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
      sellerName: t("common.brandName"),
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
  }, [invoice, total, vat, t]);

  void token;

  /** Build a self-contained printable HTML document for the invoice. */
  const buildInvoiceHtml = (): string => {
    const rows = [
      [t("invoicesPage.subtotalBeforeVat"), amount.toFixed(2)],
      [t("invoicesPage.vat15Percent"), vat.toFixed(2)],
      [t("invoicesPage.totalWithVat"), total.toFixed(2)],
    ];
    return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${t("invoicesPage.previewDialogTitle")} — ${invoiceNumber}</title>
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
  .meta-value.mono { font-family:monospace; direction:ltr; }
  table { width:100%; border-collapse:collapse; margin:12px 0 22px; }
  th, td { padding:12px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; }
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
      <p class="brand-name">${t("common.brandName")}</p>
      <p class="brand-sub">${t("common.brandNameEn")} — ${t("common.brandSubtitle")}</p>
      <p style="font-size:11px;opacity:.8;margin:6px 0 0;">${t("invoicesPage.unifiedVatNumber")}</p>
    </div>
    <span class="zatca-badge">✓ ${t("invoicesPage.zatcaCompliantBadge")}</span>
  </div>
  <div class="body">
    <div class="meta">
      <div class="meta-item"><div class="meta-label">${t("invoicesPage.table.invoiceNumber")}</div><div class="meta-value mono">${invoiceNumber}</div></div>
      <div class="meta-item"><div class="meta-label">${t("invoicesPage.invoiceStatusLabel")}</div><div class="meta-value"><span class="status">${(invoice?.status ?? "PAID") === "PAID" || (invoice?.status ?? "").toUpperCase() === "مدفوعة" ? t("invoicesPage.paidText") : invoice?.status ?? t("invoicesPage.paidText")}</span></div></div>
      <div class="meta-item"><div class="meta-label">${t("invoicesPage.shipmentTrackingLabel")}</div><div class="meta-value mono">${invoice?.trackingNumber ?? t("common.none")}</div></div>
      <div class="meta-item"><div class="meta-label">${t("invoicesPage.issueDateTimeLabel")}</div><div class="meta-value">${formatDate(invoice?.createdAt ?? invoice?.issueDate)}</div></div>
    </div>
    <table>
      <thead><tr><th>${t("invoicesPage.itemHeader")}</th><th style="text-align:end">${t("invoicesPage.amountSarHeader")}</th></tr></thead>
      <tbody>
        ${rows
          .map(
            ([label, val], i) =>
              `<tr class="${i === rows.length - 1 ? "total-row" : ""}"><td>${label}</td><td style="text-align:end;direction:ltr">${val}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>
    ${
      qrDataUrl
        ? `<div class="qr-row">
            <img src="${qrDataUrl}" alt="ZATCA QR" />
            <div class="qr-note">
              <strong>${t("invoicesPage.zatcaSealTitle")}</strong><br />
              ${t("invoicesPage.zatcaSealDesc")}
            </div>
          </div>`
        : ""
    }
  </div>
  <div class="foot">${t("invoicesPage.invoiceHtmlFooter", { year: new Date().getFullYear() })}</div>
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
    toast.success(t("invoicesPage.invoiceDownloadedToast"));
  };

  const handlePrint = () => {
    if (!invoice) return;
    const html = buildInvoiceHtml();
    const w = window.open("", "_blank", "noopener,noreferrer,width=820,height=900");
    if (!w) {
      toast.error(t("invoicesPage.popupBlockedError"));
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
          <DialogTitle>{t("invoicesPage.previewDialogSrTitle", { number: invoiceNumber })}</DialogTitle>
        </DialogHeader>

        {/* Popup header bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">{t("invoicesPage.previewDialogTitle")}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label={t("common.close")}
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
                <p className="text-lg font-extrabold text-foreground leading-tight">{t("common.brandName")}</p>
                <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground">{t("common.brandNameEn")}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{t("invoicesPage.unifiedVatNumber")}</p>
              </div>
            </div>
            <div className="text-end space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("invoicesPage.zatcaCompliantBadge")}
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
                  {isPaid ? t("invoicesPage.paidBadge") : invoice.status ?? t("common.none")}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice meta */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <MetaRow icon={<Hash className="h-3.5 w-3.5" />} label={t("invoicesPage.table.invoiceNumber")} value={invoiceNumber} mono />
            <MetaRow icon={<Truck className="h-3.5 w-3.5" />} label={t("invoicesPage.shipmentTrackingLabel")} value={invoice.trackingNumber ?? t("common.none")} mono />
            <MetaRow icon={<Building2 className="h-3.5 w-3.5" />} label={t("invoicesPage.issuerEntityLabel")} value={t("invoicesPage.issuerEntityValue")} />
            <MetaRow icon={<Calendar className="h-3.5 w-3.5" />} label={t("invoicesPage.issueDateTimeLabel")} value={formatDate(invoice.createdAt ?? invoice.issueDate)} />
          </div>

          {/* Financial table */}
          <div className="rounded-xl border border-border overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-xs">
                  <th className="text-start p-3 font-semibold">{t("invoicesPage.itemHeader")}</th>
                  <th className="text-end p-3 font-semibold">{t("invoicesPage.amountSarHeader")}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="p-3 text-foreground">{t("invoicesPage.subtotalBeforeVat")}</td>
                  <td className="p-3 text-end font-medium" dir="ltr">{amount.toFixed(2)}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3 text-foreground">{t("invoicesPage.vat15Percent")}</td>
                  <td className="p-3 text-end font-medium text-muted-foreground" dir="ltr">{vat.toFixed(2)}</td>
                </tr>
                <tr className="border-t border-border bg-emerald-50/60">
                  <td className="p-3 font-bold text-foreground">{t("invoicesPage.totalWithVat")}</td>
                  <td className="p-3 text-end font-extrabold text-emerald-700 text-base" dir="ltr">{total.toFixed(2)}</td>
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
              <p className="font-semibold text-foreground mb-1">{t("invoicesPage.zatcaSealTitle")}</p>
              {t("invoicesPage.zatcaSealDesc")}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 grid grid-cols-3 gap-2 p-4 border-t border-border bg-card">
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            {t("invoicesPage.downloadInvoiceBtn")}
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            {t("invoicesPage.printInvoiceBtn")}
          </Button>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            {t("common.close")}
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
