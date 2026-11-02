"use client";

import { Printer, FileText, Receipt, Share2, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { BarcodeSvg } from "@/components/common/BarcodeSvg";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatSAR, halToSar, formatDate } from "@/lib/format";
import type { Shipment } from "@/types/api";

interface AwbWaybillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment | null;
}

/**
 * AWB / Waybill preview modal — official-looking printable air waybill
 * with barcode, sender/receiver blocks, and 4 action buttons:
 *   1. Thermal 4x6 inch label print (CSS @page size 4in 6in)
 *   2. Standard A4 print
 *   3. ZATCA VAT invoice download
 *   4. WhatsApp share
 */
export function AwbWaybillModal({
  open,
  onOpenChange,
  shipment,
}: AwbWaybillModalProps) {
  const [printMode, setPrintMode] = useState<"thermal" | "a4" | null>(null);
  const [copied, setCopied] = useState(false);

  if (!shipment) return null;

  const trackingNumber = shipment.trackingNumber ?? shipment.id;
  const totalHal = shipment.totalHal ?? 0;
  const totalSar = halToSar(totalHal);
  const isCOD = shipment.paymentMode === "COD" || shipment.paymentMethod === "COD";
  const codAmount = shipment.codAmount ?? halToSar(shipment.codAmountHal ?? 0);

  const handleCopyTracking = async () => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      toast.success("تم نسخ رقم البوليصة");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  const handlePrint = (mode: "thermal" | "a4") => {
    setPrintMode(mode);
    // Inject print CSS for the chosen page size, then trigger print.
    const styleId = "awb-print-style";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent =
      mode === "thermal"
        ? `@media print { @page { size: 4in 6in; margin: 0; } body * { visibility: hidden; } .awb-print-area, .awb-print-area * { visibility: visible; } .awb-print-area { position: absolute; left: 0; top: 0; width: 4in; } .no-print { display: none !important; } }`
        : `@media print { @page { size: A4; margin: 12mm; } body * { visibility: hidden; } .awb-print-area, .awb-print-area * { visibility: visible; } .awb-print-area { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`;

    // Allow React to flush the style change, then print.
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
  };

  const handleDownloadInvoice = () => {
    // In demo: generate a simple text invoice. In real: open the invoice PDF URL.
    if (shipment.id) {
      toast.info("في الوضع الحقيقي سيتم فتح ملف الفاتورة الضريبية (ZATCA VAT) من الخادم");
      // Real implementation would call invoicesApi.pdf(token, shipment.invoiceId)
    }
  };

  const handleShareWhatsApp = () => {
    const text = `شحنة مسار إكس #${trackingNumber}%0A%0Aالمرسِل: ${shipment.senderName ?? "-"}%0Aالمستلِم: ${shipment.receiverName ?? "-"}%0Aالمسار: ${shipment.senderCity ?? "-"} ← ${shipment.receiverCity ?? "-"}%0Aالناقل: ${shipment.carrierNameAr ?? shipment.carrierName ?? "-"}%0Aالحالة: ${shipment.status}%0A%0Aتتبّع الشحنة: https://masarx.sa/track/${trackingNumber}`;
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>معاينة بوليصة الشحن — {trackingNumber}</DialogTitle>
        </DialogHeader>

        {/* Header bar (no-print) */}
        <div className="no-print sticky top-0 z-10 flex items-center justify-between bg-card border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">بوليصة الشحن الإلكترونية</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* AWB printable area */}
        <div className="awb-print-area p-6 sm:p-8">
          {/* Top: brand + carrier + payment */}
          <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b-2 border-primary">
            <div className="flex items-center gap-3">
              <LogoMark size={48} />
              <div>
                <p className="text-lg font-extrabold text-foreground leading-tight">مسار إكس</p>
                <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground">MASAR X</p>
                <p className="text-[10px] text-muted-foreground mt-1">منصة الشحن السعودية الموحدة</p>
              </div>
            </div>
            <div className="text-left">
              <div className="rounded-lg bg-primary/10 px-3 py-1.5 mb-1">
                <p className="text-[10px] text-muted-foreground">شركة الشحن</p>
                <p className="text-sm font-bold text-primary">
                  {shipment.carrierNameAr ?? shipment.carrierName ?? shipment.carrier ?? "—"}
                </p>
              </div>
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-1 text-[10px] font-bold",
                  isCOD
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                )}
              >
                {isCOD ? `COD: ${formatSAR(codAmount)}` : "مدفوع مسبقاً (PREPAID)"}
              </span>
            </div>
          </div>

          {/* Barcode block */}
          <div className="flex flex-col items-center mb-6 py-4 bg-muted/30 rounded-xl border border-border">
            <BarcodeSvg value={trackingNumber} width={360} height={72} />
            <button
              type="button"
              onClick={handleCopyTracking}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {trackingNumber}
            </button>
          </div>

          {/* Sender + Receiver grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50/40 p-4">
              <p className="text-[10px] font-bold text-emerald-700 mb-2 tracking-wider">المرسِل (FROM)</p>
              <p className="text-sm font-bold text-foreground mb-1">{shipment.senderName ?? "—"}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{shipment.senderPhone ?? "—"}</p>
              <p className="text-xs text-foreground mt-2">{shipment.senderCity ?? "—"}</p>
              <p className="text-[11px] text-muted-foreground">{shipment.senderAddress ?? "—"}</p>
            </div>
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4">
              <p className="text-[10px] font-bold text-blue-700 mb-2 tracking-wider">المستلِم (TO)</p>
              <p className="text-sm font-bold text-foreground mb-1">{shipment.receiverName ?? "—"}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{shipment.receiverPhone ?? "—"}</p>
              <p className="text-xs text-foreground mt-2">{shipment.receiverCity ?? "—"}</p>
              <p className="text-[11px] text-muted-foreground">{shipment.receiverAddress ?? "—"}</p>
            </div>
          </div>

          {/* Shipment details grid */}
          <div className="grid grid-cols-4 gap-2 mb-6 text-center">
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[10px] text-muted-foreground">الوزن</p>
              <p className="text-sm font-bold text-foreground">
                {((shipment.weightGrams ?? shipment.weight ?? 0) / 1000).toFixed(2)} كجم
              </p>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[10px] text-muted-foreground">عدد القطع</p>
              <p className="text-sm font-bold text-foreground">{shipment.pieces ?? shipment.quantity ?? 1}</p>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[10px] text-muted-foreground">نوع الخدمة</p>
              <p className="text-sm font-bold text-foreground">{shipment.serviceType ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[10px] text-muted-foreground">التكلفة</p>
              <p className="text-sm font-bold text-foreground" dir="ltr">{formatSAR(totalSar)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border text-[10px] text-muted-foreground">
            <span>تاريخ الإصدار: {formatDate(shipment.createdAt ?? new Date().toISOString())}</span>
            <span>مسار إكس — جميع الحقوق محفوظة</span>
          </div>
        </div>

        {/* Action buttons (no-print) */}
        <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-2 p-5 border-t border-border bg-muted/30">
          <Button
            onClick={() => handlePrint("thermal")}
            className="gap-2"
            disabled={printMode !== null}
          >
            <Printer className="h-4 w-4" />
            حراري 4×6
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePrint("a4")}
            className="gap-2"
            disabled={printMode !== null}
          >
            <FileText className="h-4 w-4" />
            ورق A4
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadInvoice}
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            فاتورة ZATCA
          </Button>
          <Button
            variant="outline"
            onClick={handleShareWhatsApp}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            مشاركة واتساب
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
