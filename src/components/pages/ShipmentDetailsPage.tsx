"use client";

import { useEffect, useState } from "react";
import {
  Printer,
  XCircle,
  CheckCircle2,
  Truck,
  MapPin,
  User,
  Phone,
  Building2,
  Package,
  Banknote,
  Calendar,
  Hash,
  Loader2,
  Send,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useRouterStore } from "@/store/routerStore";
import { useAuth } from "@/hooks/useAuth";
import { useShipmentDetails } from "@/hooks/useShipments";
import { shipmentsApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader, BackButton } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/StateViews";
import { StatusBadge, getStatusMeta } from "@/components/common/StatusBadge";
import { AwbWaybillModal } from "@/components/common/AwbWaybillModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  formatDateTime,
  formatSAR,
  halToSar,
} from "@/lib/format";
import { useTranslation } from "@/i18n";
import type { ShipmentHistoryItem } from "@/types/api";

export function ShipmentDetailsPage() {
  const { id } = useRouterStore((s) => s.params);
  const navigate = useRouterStore((s) => s.navigate);
  const { token } = useAuth();
  const { item, loading, error, reload } = useShipmentDetails(token, id);
  const { t } = useTranslation();

  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [printing, setPrinting] = useState(false);
  // NEW: AWB modal state
  const [awbOpen, setAwbOpen] = useState(false);

  useEffect(() => {
    if (!id) navigate("shipments");
  }, [id, navigate]);

  if (!id) return null;

  if (loading && !item) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate("shipments")} />
        <LoadingState message={t("shipmentDetailsPage.loading")} />
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate("shipments")} />
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (!item) return null;

  const meta = getStatusMeta(item.status);
  const statusKey = String(item.status).toUpperCase();
  const canCancel = !["DELIVERED", "CANCELLED", "CANCELED", "RETURNED"].includes(
    statusKey
  );
  const canConfirm = statusKey === "DRAFT" || statusKey === "PENDING";
  const history: ShipmentHistoryItem[] =
    item.history ?? item.events ?? item.timeline ?? [];

  const handleCancel = async () => {
    if (!token) return;
    setCancelling(true);
    try {
      await shipmentsApi.cancel(token, item.id);
      toast.success(t("shipmentDetailsPage.cancelledToast"));
      reload();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("shipmentDetailsPage.cancelFailedToast")
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirm = async () => {
    if (!token) return;
    setConfirming(true);
    try {
      await shipmentsApi.confirm(token, item.id);
      toast.success(t("shipmentDetailsPage.confirmedToast"));
      reload();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("shipmentDetailsPage.confirmFailedToast")
      );
    } finally {
      setConfirming(false);
    }
  };

  const handlePrint = async () => {
    if (!token) return;
    setPrinting(true);
    try {
      const res = await shipmentsApi.label(token, item.id);
      if (res?.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        toast.info(t("shipmentDetailsPage.noLabelAvailableToast"));
      }
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("shipmentDetailsPage.fetchLabelFailedToast")
      );
    } finally {
      setPrinting(false);
    }
  };

  const price = item.totalHal ? halToSar(item.totalHal) : item.price ?? 0;
  const codAmount = item.codAmountHal
    ? halToSar(item.codAmountHal)
    : item.codAmount ?? 0;

  return (
    <div className="space-y-6">
      <BackButton onClick={() => navigate("shipments")} />

      <PageHeader
        title={t("shipmentDetailsPage.titlePrefix", {
          number: item.trackingNumber ?? item.id.slice(0, 8).toUpperCase(),
        })}
        description={t("shipmentDetailsPage.description")}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handlePrint}
              disabled={printing}
            >
              {printing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {t("shipmentDetailsPage.shippingLabelBtn")}
            </Button>
            {/* NEW: AWB waybill preview modal button */}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setAwbOpen(true)}
            >
              <FileText className="h-4 w-4" />
              {t("shipmentDetailsPage.previewWaybillBtn")}
            </Button>
            {canConfirm && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {t("shipmentDetailsPage.confirmShipmentBtn")}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {t("shipmentDetailsPage.cancelBtn")}
              </Button>
            )}
          </div>
        }
      />

      {/* Status hero */}
      <Card className="overflow-hidden">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.className}`}
            >
              <meta.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("shipmentDetailsPage.currentStatus")}</p>
              <p className="text-lg font-bold text-foreground">{meta.label}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={item.status} />
            {(item.carrierNameAr ?? item.carrierName) && (
              <Badge variant="outline" className="gap-1.5">
                <Truck className="h-3 w-3" />
                {item.carrierNameAr ?? item.carrierName}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Sender */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                {t("shipmentDetailsPage.senderInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow
                icon={<User className="h-4 w-4" />}
                label={t("shipmentDetailsPage.name")}
                value={item.senderName ?? t("common.none")}
              />
              <DetailRow
                icon={<Phone className="h-4 w-4" />}
                label={t("shipmentDetailsPage.phone")}
                value={item.senderPhone ?? t("common.none")}
                ltr
              />
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label={t("shipmentDetailsPage.city")}
                value={item.senderCity ?? t("common.none")}
              />
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label={t("shipmentDetailsPage.address")}
                value={item.senderAddress ?? t("common.none")}
              />
            </CardContent>
          </Card>

          {/* Receiver */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {t("shipmentDetailsPage.receiverInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow
                icon={<User className="h-4 w-4" />}
                label={t("shipmentDetailsPage.name")}
                value={item.receiverName ?? t("common.none")}
              />
              <DetailRow
                icon={<Phone className="h-4 w-4" />}
                label={t("shipmentDetailsPage.phone")}
                value={item.receiverPhone ?? t("common.none")}
                ltr
              />
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label={t("shipmentDetailsPage.city")}
                value={item.receiverCity ?? t("common.none")}
              />
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label={t("shipmentDetailsPage.address")}
                value={item.receiverAddress ?? t("common.none")}
              />
            </CardContent>
          </Card>

          {/* Shipment details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                {t("shipmentDetailsPage.shipmentInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label={t("shipmentDetailsPage.fromCity")}
                value={item.senderCity ?? t("common.none")}
              />
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label={t("shipmentDetailsPage.toCity")}
                value={item.receiverCity ?? t("common.none")}
              />
              <DetailRow
                icon={<Building2 className="h-4 w-4" />}
                label={t("shipmentDetailsPage.carrier")}
                value={item.carrierNameAr ?? item.carrierName ?? t("common.none")}
              />
              {item.serviceType && (
                <DetailRow
                  icon={<Truck className="h-4 w-4" />}
                  label={t("shipmentDetailsPage.serviceType")}
                  value={item.serviceType}
                />
              )}
              <DetailRow
                icon={<Package className="h-4 w-4" />}
                label={t("shipmentDetailsPage.piecesCount")}
                value={String(item.pieces ?? item.packages?.length ?? 1)}
              />
              <DetailRow
                icon={<Hash className="h-4 w-4" />}
                label={t("shipmentDetailsPage.weightGrams")}
                value={
                  item.weightGrams
                    ? String(item.weightGrams)
                    : item.weight
                    ? String(item.weight * 1000)
                    : t("common.none")
                }
                ltr
              />
              <DetailRow
                icon={<Banknote className="h-4 w-4" />}
                label={t("shipmentDetailsPage.paymentMethod")}
                value={
                  item.paymentMode === "COD" || item.paymentMethod === "COD"
                    ? t("shipmentDetailsPage.cod")
                    : t("shipmentDetailsPage.prepaid")
                }
              />
              {codAmount ? (
                <DetailRow
                  icon={<Banknote className="h-4 w-4" />}
                  label={t("shipmentDetailsPage.codAmount")}
                  value={formatSAR(codAmount)}
                  ltr
                />
              ) : null}
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label={t("shipmentDetailsPage.createdAt")}
                value={formatDateTime(item.createdAt)}
              />
              <DetailRow
                icon={<Banknote className="h-4 w-4" />}
                label={t("shipmentDetailsPage.cost")}
                value={price ? formatSAR(price) : t("common.none")}
                ltr
              />
            </CardContent>
          </Card>

          {/* Packages */}
          {item.packages && item.packages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {t("shipmentDetailsPage.packagesTitle", { count: item.packages.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {item.packages.map((p, i) => (
                    <div
                      key={p.id ?? i}
                      className="rounded-lg border border-border bg-muted/20 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">
                          {t("shipmentDetailsPage.pieceNumber", { index: i + 1 })}
                        </span>
                        {p.weightGrams && (
                          <span
                            className="text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {t("shipmentDetailsPage.gramsUnit", { weight: p.weightGrams })}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.description ?? t("shipmentDetailsPage.noDescription")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: timeline + summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("shipmentDetailsPage.financialSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("shipmentDetailsPage.shippingPrice")}</span>
                <span className="font-medium" dir="ltr">
                  {price ? formatSAR(price) : t("common.none")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("shipmentDetailsPage.paymentMethod")}</span>
                <span className="font-medium">
                  {item.paymentMode === "COD" ? "COD" : t("shipmentDetailsPage.prepaidShort")}
                </span>
              </div>
              {codAmount ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("shipmentDetailsPage.codAmount")}</span>
                  <span className="font-medium" dir="ltr">
                    {formatSAR(codAmount)}
                  </span>
                </div>
              ) : null}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("shipmentDetailsPage.statusLabel")}</span>
                <StatusBadge status={item.status} size="sm" />
              </div>
            </CardContent>
          </Card>

          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("shipmentDetailsPage.statusHistory")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative space-y-4 ps-4 border-s-2 border-border">
                  {history.map((h, i) => {
                    const hMeta = getStatusMeta(h.status ?? "");
                    const Icon = hMeta.icon;
                    return (
                      <li key={i} className="relative">
                        <span
                          className={`absolute -start-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full ${hMeta.dot} ring-4 ring-primary/10`}
                        />
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Icon className="h-4 w-4" />
                            {h.description ??
                              h.message ??
                              h.messageAr ??
                              h.status ??
                              t("shipmentDetailsPage.updateFallback")}
                          </p>
                          {h.location && (
                            <p className="text-xs text-muted-foreground">
                              {h.location}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            {formatDateTime(h.timestamp ?? h.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* NEW: AWB waybill preview modal */}
      <AwbWaybillModal
        open={awbOpen}
        onOpenChange={setAwbOpen}
        shipment={item}
      />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  ltr,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span
        className={`text-sm font-medium text-foreground ${
          ltr ? "font-mono" : ""
        }`}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </span>
    </div>
  );
}
