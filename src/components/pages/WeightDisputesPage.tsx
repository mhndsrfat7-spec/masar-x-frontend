"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, FileUp, Loader2, MessageSquareWarning, Plus, RefreshCw, Scale, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { isDemoMode, shipmentsApi, uploadsApi, weightDisputesApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { formatDateTime, formatSAR } from "@/lib/format";
import { useTranslation } from "@/i18n";
import type { Shipment, WeightDispute, WeightDisputeReasonCode, WeightDisputeStatus } from "@/types/api";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const STATUS_CLASS_MAP: Record<WeightDisputeStatus, string> = {
  SUBMITTED: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  NEED_MORE_INFO: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  CLOSED: "bg-muted text-muted-foreground border-border",
};

const REASON_CODES: WeightDisputeReasonCode[] = [
  "WEIGHT_MISMATCH",
  "DIMENSION_MISMATCH",
  "DUPLICATE_CHARGE",
  "OTHER",
];

function unwrapList<T>(value: T[] | { data?: T[] } | undefined): T[] {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.data) ? value.data : [];
}

export function WeightDisputesPage() {
  const { token } = useAuth();
  const { t, dict } = useTranslation();
  const [disputes, setDisputes] = useState<WeightDispute[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shipmentId, setShipmentId] = useState("");
  const [reasonCode, setReasonCode] = useState<WeightDisputeReasonCode>("WEIGHT_MISMATCH");
  const [description, setDescription] = useState("");
  const [measuredWeightKg, setMeasuredWeightKg] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [disputesResponse, shipmentsResponse] = await Promise.all([
        weightDisputesApi.list(token, { limit: 50, offset: 0 }),
        shipmentsApi.list(token, { limit: 100, offset: 0 }),
      ]);
      setDisputes(unwrapList(disputesResponse as WeightDispute[] | { data?: WeightDispute[] }));
      setShipments(unwrapList(shipmentsResponse as Shipment[] | { data?: Shipment[] }));
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : t("weightDisputesPage.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => { void reload(); }, [reload]);

  const filtered = useMemo(() => disputes.filter((item) => {
    const matchesStatus = filter === "all" || item.status === filter;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [item.trackingNumber, item.id, item.carrierNameAr, item.description]
      .some((value) => String(value ?? "").toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  }), [disputes, filter, search]);

  const resetForm = () => {
    setShipmentId("");
    setReasonCode("WEIGHT_MISMATCH");
    setDescription("");
    setMeasuredWeightKg("");
    setFiles([]);
  };

  const addFiles = (selected: FileList | null) => {
    if (!selected) return;
    const next = Array.from(selected);
    const invalid = next.find((file) => !ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE);
    if (invalid) {
      toast.error(t("weightDisputesPage.errors.unsupportedFile", { name: invalid.name }));
      return;
    }
    setFiles((current) => {
      const combined = [...current, ...next];
      if (combined.length > MAX_FILES) {
        toast.error(t("weightDisputesPage.errors.maxFilesLimit", { max: MAX_FILES }));
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const submitDispute = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!shipmentId) { toast.error(t("weightDisputesPage.errors.selectShipmentFirst")); return; }
    if (description.trim().length < 20) { toast.error(t("weightDisputesPage.errors.descMin20Chars")); return; }
    if (measuredWeightKg && (!Number.isFinite(Number(measuredWeightKg)) || Number(measuredWeightKg) < 0.1)) {
      toast.error(t("weightDisputesPage.errors.minWeight01Kg")); return;
    }

    setSaving(true);
    try {
      const created = await weightDisputesApi.create(token, shipmentId, {
        reasonCode,
        description: description.trim(),
        customerMeasuredWeightGrams: measuredWeightKg ? Math.round(Number(measuredWeightKg) * 1000) : undefined,
        requestedReview: true,
      });

      let attachmentsFailed = 0;
      for (const file of files) {
        try {
          const receipt = await uploadsApi.uploadWeightEvidence(token, created.id, file);
          await weightDisputesApi.attach(token, created.id, receipt);
        } catch {
          attachmentsFailed += 1;
        }
      }

      setDialogOpen(false);
      resetForm();
      await reload();
      if (attachmentsFailed > 0) {
        toast.warning(t("weightDisputesPage.errors.attachmentsPartialWarning", { id: created.id, count: attachmentsFailed }));
      } else {
        toast.success(t("weightDisputesPage.errors.disputeSubmittedSuccess"));
      }
    } catch (submitError) {
      toast.error(submitError instanceof ApiClientError ? submitError.message : t("weightDisputesPage.errors.submitFailed"));
    } finally {
      setSaving(false);
    }
  };

  const eligibleShipments = shipments.filter((shipment) => shipment.status !== "CANCELLED");
  const statusLabels = dict.weightDisputesPage.statuses as Record<WeightDisputeStatus, string>;
  const reasonLabels = dict.weightDisputesPage.reasons as Record<WeightDisputeReasonCode, string>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("weightDisputesPage.title")}
        description={t("weightDisputesPage.description")}
        action={<Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("weightDisputesPage.newDisputeBtn")}</Button>}
      />

      {isDemoMode() && <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">{t("weightDisputesPage.demoNotice")}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label={t("weightDisputesPage.totalDisputes")} value={String(disputes.length)} icon={<MessageSquareWarning className="h-4 w-4" />} />
        <SummaryCard label={t("weightDisputesPage.underReviewCount")} value={String(disputes.filter((d) => d.status === "SUBMITTED" || d.status === "UNDER_REVIEW" || d.status === "NEED_MORE_INFO").length)} icon={<Clock3 className="h-4 w-4" />} />
        <SummaryCard label={t("weightDisputesPage.approvedCount")} value={String(disputes.filter((d) => d.status === "APPROVED").length)} icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> {t("weightDisputesPage.disputesLogTitle")}</CardTitle>
            <Button size="sm" variant="outline" onClick={() => void reload()} className="gap-2"><RefreshCw className="h-3.5 w-3.5" /> {t("common.refresh")}</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-2 pt-2">
            <div className="relative"><Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" placeholder={t("weightDisputesPage.searchPlaceholder")} /></div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">{t("weightDisputesPage.allStatuses")}</option>
              {(Object.keys(STATUS_CLASS_MAP) as WeightDisputeStatus[]).map((value) => (
                <option key={value} value={value}>{statusLabels[value]}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <LoadingState message={t("weightDisputesPage.loadingDisputes")} /> : error ? <ErrorState message={error} onRetry={() => void reload()} /> : filtered.length === 0 ? (
            <EmptyState title={t("weightDisputesPage.emptyDisputesTitle")} description={t("weightDisputesPage.emptyDisputesDesc")} icon={Scale} action={<Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2"><Plus className="h-4 w-4" /> {t("weightDisputesPage.submitDisputeBtn")}</Button>} />
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => <DisputeRow key={item.id} item={item} />)}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open && !saving) resetForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("weightDisputesPage.dialogTitle")}</DialogTitle></DialogHeader>
          <form onSubmit={submitDispute} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("weightDisputesPage.disputedShipmentLabel")}</Label>
              <select value={shipmentId} onChange={(e) => setShipmentId(e.target.value)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">{t("weightDisputesPage.selectWaybillPlaceholder")}</option>
                {eligibleShipments.map((item) => <option key={item.id} value={item.id}>{item.trackingNumber ?? item.id} — {item.carrierNameAr ?? item.carrierName ?? item.carrierCode ?? t("dashboard.quoteWidget.carrierFallback")}</option>)}
              </select>
              {eligibleShipments.length === 0 && <p className="text-xs text-muted-foreground">{t("weightDisputesPage.noEligibleShipmentsHint")}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("weightDisputesPage.disputeTypeLabel")}</Label>
              <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value as WeightDisputeReasonCode)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {REASON_CODES.map((code) => <option key={code} value={code}>{reasonLabels[code]}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("weightDisputesPage.measuredWeightLabel")}</Label>
              <Input type="number" min="0.1" step="0.01" value={measuredWeightKg} onChange={(e) => setMeasuredWeightKg(e.target.value)} dir="ltr" placeholder={t("weightDisputesPage.measuredWeightPlaceholder")} />
              <p className="text-[11px] text-muted-foreground">{t("weightDisputesPage.measuredWeightHint")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("weightDisputesPage.disputeDescLabel")}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={20} rows={4} placeholder={t("weightDisputesPage.disputeDescPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("weightDisputesPage.attachmentsLabel")}</Label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground hover:bg-muted/40">
                <FileUp className="h-4 w-4" /> {t("weightDisputesPage.attachFileBtn")}
                <input type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
              </label>
              {files.length > 0 && <div className="space-y-1">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-xs"><span className="truncate">{file.name}</span><span className="text-muted-foreground" dir="ltr">{(file.size / 1024 / 1024).toFixed(2)} MB</span></div>)}</div>}
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-muted-foreground"><AlertCircle className="inline h-3.5 w-3.5 me-1 text-amber-600" /> {t("weightDisputesPage.disclaimerNote")}</div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={saving || !shipmentId || eligibleShipments.length === 0} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("weightDisputesPage.sendDisputeBtn")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{value}</p></div><div className="rounded-xl bg-primary/10 p-3 text-primary">{icon}</div></CardContent></Card>;
}

function DisputeRow({ item }: { item: WeightDispute }) {
  const { t, dict } = useTranslation();
  const statusLabels = dict.weightDisputesPage.statuses as Record<WeightDisputeStatus, string>;
  const reasonLabels = dict.weightDisputesPage.reasons as Record<WeightDisputeReasonCode, string>;
  const statusClass = STATUS_CLASS_MAP[item.status] ?? STATUS_CLASS_MAP.SUBMITTED;
  const statusLabel = statusLabels[item.status] ?? statusLabels.SUBMITTED;
  const reason = reasonLabels[item.reasonCode] ?? item.reasonCode;
  const delta = item.carrierMeasuredWeightGrams != null && item.customerMeasuredWeightGrams != null
    ? (item.carrierMeasuredWeightGrams - item.customerMeasuredWeightGrams) / 1000
    : null;
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-primary" dir="ltr">{item.trackingNumber ?? item.id}</span><Badge variant="outline" className={statusClass}>{statusLabel}</Badge></div>
          <p className="text-xs text-muted-foreground">{item.carrierNameAr ?? item.carrierCode ?? t("weightDisputesPage.unspecifiedCarrier")} · {reason}</p>
        </div>
        <div className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</div>
      </div>
      <p className="mt-3 text-sm leading-6">{item.description}</p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Metric label={t("weightDisputesPage.customerWeight")} value={item.customerMeasuredWeightGrams != null ? `${(item.customerMeasuredWeightGrams / 1000).toFixed(2)} ${t("common.kg")}` : t("weightDisputesPage.notRecorded")} />
        <Metric label={t("weightDisputesPage.carrierWeight")} value={item.carrierMeasuredWeightGrams != null ? `${(item.carrierMeasuredWeightGrams / 1000).toFixed(2)} ${t("common.kg")}` : t("weightDisputesPage.awaitingData")} />
        <Metric label={t("weightDisputesPage.weightDifference")} value={delta != null ? `${delta > 0 ? "+" : ""}${delta.toFixed(2)} ${t("common.kg")}` : t("common.none")} />
        <Metric label={t("weightDisputesPage.feeDifference")} value={item.chargeDifferenceHal != null ? formatSAR(item.chargeDifferenceHal / 100) : t("weightDisputesPage.awaitingSettlement")} />
      </div>
      {item.resolutionMessage && <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs leading-5"><strong>{t("weightDisputesPage.reviewDecision")}</strong>{item.resolutionMessage}</div>}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{t("weightDisputesPage.attachmentsCount", { count: item.attachments?.length ?? 0 })}</span><span>·</span><span className="font-mono" dir="ltr">{item.id}</span></div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/30 p-2"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-semibold">{value}</p></div>;
}
