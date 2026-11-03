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
import { useTranslation } from "@/i18n";
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
  const { t } = useTranslation();

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
      toast.success(t("awbModal.copiedWaybillToast"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.copyFailed"));
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
      toast.info(t("awbModal.zatcaDemoToast"));
      // Real implementation would call invoicesApi.pdf(token, shipment.invoiceId)
    }
  };

  const handleShareWhatsApp = () => {
    const text = t("awbModal.whatsappShareText", {
      trackingNumber,
      sender: shipment.senderName ?? "-",
      receiver: shipment.receiverName ?? "-",
      origin: shipment.senderCity ?? "-",
      dest: shipment.receiverCity ?? "-",
      carrier: shipment.carrierNameAr ?? shipment.carrierName ?? "-",
      status: shipment.status,
    });
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("awbModal.srTitle", { trackingNumber })}</DialogTitle>
        </DialogHeader>

        {/* Header bar (no-print) */}
        <div className="no-print sticky top-0 z-10 flex items-center justify-between bg-card border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">{t("awbModal.title")}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
            aria-label={t("common.close")}
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
                <p className="text-lg font-extrabold text-foreground leading-tight">{t("common.brandName")}</p>
                <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground">{t("common.brandNameEn")}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{t("common.brandSubtitle")}</p>
              </div>
            </div>
            <div className="text-end">
              <div className="rounded-lg bg-primary/10 px-3 py-1.5 mb-1">
                <p className="text-[10px] text-muted-foreground">{t("awbModal.carrierLabel")}</p>
                <p className="text-sm font-bold text-primary">
                  {shipment.carrierNameAr ?? shipment.carrierName ?? shipment.carrier ?? t("common.none")}
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
                {isCOD ? t("awbModal.codBadge", { amount: formatSAR(codAmount) }) : t("awbModal.prepaidBadge")}
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
              <p className="text-[10px] font-bold text-emerald-700 mb-2 tracking-wider">{t("awbModal.senderFrom")}</p>
              <p className="text-sm font-bold text-foreground mb-1">{shipment.senderName ?? t("common.none")}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{shipment.senderPhone ?? t("common.none")}</p>
              <p className="text-xs text-foreground mt-2">{shipment.senderCity ?? t("common.none")}</p>
              <p className="text-[11px] text-muted-foreground">{shipment.senderAddress ?? t("common.none")}</p>
            </div>
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4">
              <p className="text-[10px] font-bold text-blue-700 mb-2 tracking-wider">{t("awbModal.receiverTo")}</p>
              <p className="text-sm font-bold text-foreground mb-1">{shipment.receiverName ?? t("common.none")}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{shipment.receiverPhone ?? t("common.none")}</p>
              <p className="text-xs text-foreground mt-2">{shipment.receiverCity ?? t("common.none")}</p>
              <p className="text-[11px] text-muted-foreground">{shipment.receiverAddress ?? t("common.none")}</p>
            </div>
          </div>

          {/* Shipment details grid */}
          <div className="grid grid-cols-4 gap-2 mb-6 text-center">
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[10px] text-muted-foreground">{t("awbModal.weight")}</p>
              <p className="text-sm font-bold text-foreground">
                {((shipment.weightGrams ?? shipment.weight ?? 0) / 1000).toFixed(2)} {t("common.kg")}
              </p>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[10px] text-muted-foreground">{t("awbModal.piecesCount")}</p>
              <p className="text-sm font-bold text-foreground">{shipment.pieces ?? shipment.quantity ?? 1}</p>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[10px] text-muted-foreground">{t("awbModal.serviceType")}</p>
              <p className="text-sm font-bold text-foreground">{shipment.serviceType ?? t("common.none")}</p>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <p className="text-[10px] text-muted-foreground">{t("awbModal.cost")}</p>
              <p className="text-sm font-bold text-foreground" dir="ltr">{formatSAR(totalSar)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border text-[10px] text-muted-foreground">
            <span>{t("awbModal.issueDate", { date: formatDate(shipment.createdAt ?? new Date().toISOString()) })}</span>
            <span>{t("awbModal.footerRights")}</span>
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
            {t("awbModal.thermal4x6")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePrint("a4")}
            className="gap-2"
            disabled={printMode !== null}
          >
            <FileText className="h-4 w-4" />
            {t("awbModal.paperA4")}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadInvoice}
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            {t("awbModal.zatcaInvoice")}
          </Button>
          <Button
            variant="outline"
            onClick={handleShareWhatsApp}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            {t("awbModal.shareWhatsapp")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
