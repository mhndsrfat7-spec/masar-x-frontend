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
import type { Shipment, WeightDispute, WeightDisputeReasonCode, WeightDisputeStatus } from "@/types/api";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const STATUS_META: Record<WeightDisputeStatus, { label: string; className: string }> = {
  SUBMITTED: { label: "تم الإرسال", className: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  UNDER_REVIEW: { label: "قيد المراجعة", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  NEED_MORE_INFO: { label: "مطلوب معلومات إضافية", className: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
  APPROVED: { label: "تم قبول الاعتراض", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  REJECTED: { label: "مرفوض", className: "bg-destructive/10 text-destructive border-destructive/20" },
  CLOSED: { label: "مغلق", className: "bg-muted text-muted-foreground border-border" },
};

const REASONS: { value: WeightDisputeReasonCode; label: string }[] = [
  { value: "WEIGHT_MISMATCH", label: "اختلاف الوزن المسجل لدى الناقل" },
  { value: "DIMENSION_MISMATCH", label: "اختلاف الأبعاد أو الوزن الحجمي" },
  { value: "DUPLICATE_CHARGE", label: "تكرار خصم رسوم الوزن" },
  { value: "OTHER", label: "سبب آخر" },
];

function unwrapList<T>(value: T[] | { data?: T[] } | undefined): T[] {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.data) ? value.data : [];
}

export function WeightDisputesPage() {
  const { token } = useAuth();
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
      setError(loadError instanceof ApiClientError ? loadError.message : "تعذّر تحميل الاعتراضات والشحنات المرتبطة بها");
    } finally {
      setLoading(false);
    }
  }, [token]);

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
      toast.error(`الملف ${invalid.name} غير مدعوم. الصيغ المقبولة JPG وPNG وWEBP وPDF وبحد أقصى 10MB للملف.`);
      return;
    }
    setFiles((current) => {
      const combined = [...current, ...next];
      if (combined.length > MAX_FILES) {
        toast.error(`الحد الأعلى ${MAX_FILES} مرفقات لكل اعتراض`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const submitDispute = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!shipmentId) { toast.error("اختر الشحنة المطلوب الاعتراض عليها"); return; }
    if (description.trim().length < 20) { toast.error("اكتب وصفًا لا يقل عن 20 حرفًا لتوضيح سبب الاعتراض"); return; }
    if (measuredWeightKg && (!Number.isFinite(Number(measuredWeightKg)) || Number(measuredWeightKg) < 0.1)) {
      toast.error("الوزن الذي قسته يجب أن يكون 0.1 كجم على الأقل"); return;
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
        toast.warning(`تم تسجيل الاعتراض ${created.id} لكن تعذر رفع ${attachmentsFailed} مرفق. أعد المحاولة أو أرسل رقم الاعتراض للدعم.`);
      } else {
        toast.success("تم تسجيل الاعتراض وإرفاق الأدلة بنجاح");
      }
    } catch (submitError) {
      toast.error(submitError instanceof ApiClientError ? submitError.message : "تعذّر تسجيل الاعتراض. تحقق من تفعيل خدمة الاعتراضات في الخادم.");
    } finally {
      setSaving(false);
    }
  };

  const eligibleShipments = shipments.filter((shipment) => shipment.status !== "CANCELLED");

  return (
    <div className="space-y-6">
      <PageHeader
        title="اعتراضات فروقات الوزن"
        description="تابع الفروقات المسجلة من شركة الشحن، وقدّم طلب مراجعة مدعومًا بالصور أو مستندات الوزن."
        action={<Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> اعتراض جديد</Button>}
      />

      {isDemoMode() && <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">وضع العرض التجريبي: الاعتراضات والمرفقات محاكاة محلية ولا تُرسل إلى الناقل أو تسوية مالية حقيقية.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label="إجمالي الاعتراضات" value={String(disputes.length)} icon={<MessageSquareWarning className="h-4 w-4" />} />
        <SummaryCard label="قيد المراجعة" value={String(disputes.filter((d) => d.status === "SUBMITTED" || d.status === "UNDER_REVIEW" || d.status === "NEED_MORE_INFO").length)} icon={<Clock3 className="h-4 w-4" />} />
        <SummaryCard label="تم قبولها" value={String(disputes.filter((d) => d.status === "APPROVED").length)} icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> سجل الاعتراضات</CardTitle>
            <Button size="sm" variant="outline" onClick={() => void reload()} className="gap-2"><RefreshCw className="h-3.5 w-3.5" /> تحديث</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-2 pt-2">
            <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" placeholder="بحث برقم الشحنة أو رقم الاعتراض…" /></div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">كل الحالات</option>
              {Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <LoadingState message="جارٍ تحميل الاعتراضات…" /> : error ? <ErrorState message={error} onRetry={() => void reload()} /> : filtered.length === 0 ? (
            <EmptyState title="لا توجد اعتراضات مطابقة" description="عند تسجيل فرق وزن أو أبعاد، يمكنك تقديم اعتراض ومتابعة قرار المراجعة من هنا." icon={Scale} action={<Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2"><Plus className="h-4 w-4" /> تقديم اعتراض</Button>} />
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => <DisputeRow key={item.id} item={item} />)}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open && !saving) resetForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تقديم اعتراض على فرق وزن</DialogTitle></DialogHeader>
          <form onSubmit={submitDispute} className="space-y-4">
            <div className="space-y-2">
              <Label>الشحنة محل الاعتراض *</Label>
              <select value={shipmentId} onChange={(e) => setShipmentId(e.target.value)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">اختر رقم البوليصة</option>
                {eligibleShipments.map((item) => <option key={item.id} value={item.id}>{item.trackingNumber ?? item.id} — {item.carrierNameAr ?? item.carrierName ?? item.carrierCode ?? "ناقل"}</option>)}
              </select>
              {eligibleShipments.length === 0 && <p className="text-xs text-muted-foreground">لا توجد شحنات متاحة في القائمة. تأكد من تحميل بيانات الشحنات.</p>}
            </div>
            <div className="space-y-2">
              <Label>نوع الاعتراض *</Label>
              <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value as WeightDisputeReasonCode)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {REASONS.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>وزن الطرد بعد قياسك (كجم) — اختياري</Label>
              <Input type="number" min="0.1" step="0.01" value={measuredWeightKg} onChange={(e) => setMeasuredWeightKg(e.target.value)} dir="ltr" placeholder="مثال: 3.25" />
              <p className="text-[11px] text-muted-foreground">الوزن المعتمد لدى الناقل ومبلغ الخصم يجب أن يأتيان من سجلات الخادم، وليس من إدخال العميل.</p>
            </div>
            <div className="space-y-2">
              <Label>شرح الاعتراض *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={20} rows={4} placeholder="اشرح سبب اعتراضك، وتاريخ الوزن، وما الذي تطلب مراجعته…" />
            </div>
            <div className="space-y-2">
              <Label>المرفقات الداعمة (حتى 5 ملفات، 10MB لكل ملف)</Label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground hover:bg-muted/40">
                <FileUp className="h-4 w-4" /> إرفاق صورة الميزان أو مستند
                <input type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
              </label>
              {files.length > 0 && <div className="space-y-1">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-xs"><span className="truncate">{file.name}</span><span className="text-muted-foreground" dir="ltr">{(file.size / 1024 / 1024).toFixed(2)} MB</span></div>)}</div>}
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-muted-foreground"><AlertCircle className="inline h-3.5 w-3.5 ml-1 text-amber-600" /> تقديم الاعتراض لا يعني قبول المطالبة أو إرجاع المبلغ تلقائيًا. تتم المراجعة بناءً على بيانات الناقل والمرفقات وقرار فريق التسويات.</div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>إلغاء</Button>
              <Button type="submit" disabled={saving || !shipmentId || eligibleShipments.length === 0} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} إرسال الاعتراض</Button>
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
  const status = STATUS_META[item.status] ?? STATUS_META.SUBMITTED;
  const reason = REASONS.find((r) => r.value === item.reasonCode)?.label ?? item.reasonCode;
  const delta = item.carrierMeasuredWeightGrams != null && item.customerMeasuredWeightGrams != null
    ? (item.carrierMeasuredWeightGrams - item.customerMeasuredWeightGrams) / 1000
    : null;
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-primary" dir="ltr">{item.trackingNumber ?? item.id}</span><Badge variant="outline" className={status.className}>{status.label}</Badge></div>
          <p className="text-xs text-muted-foreground">{item.carrierNameAr ?? item.carrierCode ?? "ناقل غير محدد"} · {reason}</p>
        </div>
        <div className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</div>
      </div>
      <p className="mt-3 text-sm leading-6">{item.description}</p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Metric label="وزن العميل" value={item.customerMeasuredWeightGrams != null ? `${(item.customerMeasuredWeightGrams / 1000).toFixed(2)} كجم` : "غير مسجل"} />
        <Metric label="وزن الناقل" value={item.carrierMeasuredWeightGrams != null ? `${(item.carrierMeasuredWeightGrams / 1000).toFixed(2)} كجم` : "بانتظار البيانات"} />
        <Metric label="فرق الوزن" value={delta != null ? `${delta > 0 ? "+" : ""}${delta.toFixed(2)} كجم` : "—"} />
        <Metric label="فرق الرسوم" value={item.chargeDifferenceHal != null ? formatSAR(item.chargeDifferenceHal / 100) : "بانتظار التسوية"} />
      </div>
      {item.resolutionMessage && <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs leading-5"><strong>قرار المراجعة: </strong>{item.resolutionMessage}</div>}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{item.attachments?.length ?? 0} مرفق</span><span>·</span><span className="font-mono" dir="ltr">{item.id}</span></div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/30 p-2"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-semibold">{value}</p></div>;
}
