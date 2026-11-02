"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, PackageCheck, RefreshCw, Settings2, ShieldCheck, Truck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePublicData } from "@/hooks/useData";
import { carrierCapabilitiesApi, isDemoMode } from "@/lib/api/services";
import { useRouterStore } from "@/store/routerStore";
import { ApiClientError } from "@/lib/api/client";
import type { Carrier, CarrierCapabilityResponse } from "@/types/api";

const CAPABILITY_LABELS: Record<string, string> = {
  CREATE_SHIPMENT: "إنشاء بوليصة",
  CANCEL_SHIPMENT: "إلغاء الشحنة",
  TRACK: "تتبع الشحنة",
  DOWNLOAD_LABEL: "تحميل البوليصة",
  COD_SUPPORTED: "الدفع عند الاستلام",
  COD_REMITTANCE: "تسوية مبالغ COD",
  REQUEST_PICKUP: "طلب استلام من الموقع",
  MULTIPLE_SERVICES: "عدة خدمات شحن",
  INTERNATIONAL: "شحن دولي",
  FRAGILE: "طرود قابلة للكسر",
  REFRIGERATED: "شحن مبرد",
  SCHEDULED_PICKUP: "استلام مجدول",
  RETURNS_SERVICE: "خدمة المرتجعات",
  INSURANCE: "تأمين الشحنات",
  BULK_CREATE: "إنشاء شحنات جماعي",
  FETCH_WEIGHT_STATEMENT: "بيان الوزن من الناقل",
};

export function CarrierCapabilitiesPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { carriers, loading, reload } = usePublicData();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [details, setDetails] = useState<CarrierCapabilityResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const selectedCarrier = useMemo(() => carriers.find((carrier) => carrier.code === selectedCode) ?? null, [carriers, selectedCode]);

  useEffect(() => {
    if (!selectedCode) { setDetails(null); return; }
    let active = true;
    setDetailsLoading(true);
    setDetailsError(null);
    carrierCapabilitiesApi.get(selectedCode)
      .then((response) => { if (active) setDetails(response); })
      .catch((error) => {
        if (!active) return;
        setDetailsError(error instanceof ApiClientError ? error.message : "تعذّر جلب إمكانات الناقل والحقول الديناميكية");
        setDetails(null);
      })
      .finally(() => { if (active) setDetailsLoading(false); });
    return () => { active = false; };
  }, [selectedCode]);

  const statusLabel = (carrier: Carrier) => {
    if (carrier.apiMode === "API") return { text: "اتصال API", className: "bg-emerald-500/10 text-emerald-700" };
    if (carrier.apiMode === "MANUAL") return { text: "تشغيل يدوي", className: "bg-amber-500/10 text-amber-700" };
    return { text: "وضع تجريبي / غير محدد", className: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="شركات الشحن والخدمات"
        description="استعرض شركات الشحن النشطة، الخدمات المدعومة، ومتطلبات البيانات الإضافية لكل ناقل قبل إصدار البوليصة."
        action={<Button variant="outline" onClick={() => { reload(); if (selectedCode) setSelectedCode(selectedCode); }} className="gap-2"><RefreshCw className="h-4 w-4" /> تحديث الشركات</Button>}
      />

      {isDemoMode() && <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">وضع العرض التجريبي: قدرات الناقل والحقول المعروضة بيانات نموذجية، ويجب استبدالها بعقد Backend المنشور قبل تشغيل الإصدار الحقيقي.</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <Card className="lg:col-span-5">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> الناقلون المتاحون</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? <LoadingState message="جارٍ تحميل شركات الشحن…" /> : carriers.length === 0 ? <EmptyState title="لا توجد شركات نشطة" description="تحقق من إعدادات الناقلين في الباك إند." icon={Truck} /> : carriers.map((carrier) => {
              const status = statusLabel(carrier);
              const active = selectedCode === carrier.code;
              return (
                <button key={carrier.id} type="button" onClick={() => setSelectedCode(carrier.code)} className={`w-full rounded-xl border p-3 text-right transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm">{carrier.nameAr}</div>
                    <Badge variant="outline" className={status.className}>{status.text}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span dir="ltr">{carrier.code}</span><span>·</span><span>{carrier.services?.length ?? 0} خدمة</span><span>·</span><span>{carrier.codSupported ? "يدعم COD" : "COD غير متاح"}</span></div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="lg:col-span-7 space-y-4">
          {!selectedCarrier ? (
            <Card><CardContent className="py-16"><EmptyState title="اختر شركة شحن" description="ستظهر هنا قدرات الناقل وخدماته والحقول الإضافية المطلوبة لإتمام الشحنة." icon={PackageCheck} /></CardContent></Card>
          ) : detailsLoading ? (
            <Card><CardContent className="py-16"><LoadingState message="جارٍ تحميل مواصفات الناقل…" /></CardContent></Card>
          ) : detailsError ? (
            <Card><CardContent className="py-10"><ErrorState message={`${detailsError}. يجب على الباك إند توفير GET /api/v1/public/carriers/{code}/capabilities.`} onRetry={() => setSelectedCode(selectedCarrier.code)} /></CardContent></Card>
          ) : details ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div><CardTitle className="text-lg">{details.carrier.nameAr}</CardTitle><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{details.carrier.nameEn} · {details.carrier.code}</p></div>
                  <Badge variant="secondary">{details.carrier.apiMode ?? "غير محدد"}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(details.capabilities ?? []).map((capability) => <Badge key={capability} variant="outline" className="gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-600" />{CAPABILITY_LABELS[capability] ?? capability}</Badge>)}
                    {details.capabilities.length === 0 && <p className="text-xs text-muted-foreground">لم يرسل الخادم قائمة بالقدرات لهذا الناقل.</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Metric label="الدفع عند الاستلام" value={details.carrier.codSupported ? "مدعوم" : "غير مدعوم"} icon={<ShieldCheck className="h-4 w-4" />} />
                    <Metric label="الخدمات المعرفة" value={String(details.services?.length ?? 0)} icon={<Settings2 className="h-4 w-4" />} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">الخدمات المتاحة</h3>
                    {details.services?.length ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{details.services.map((service) => <div key={service.code ?? service.name} className="rounded-lg border border-border p-3"><p className="text-sm font-medium">{service.nameAr ?? service.name ?? service.code}</p><p className="mt-1 text-[11px] text-muted-foreground">{service.domestic ? "محلي" : ""}{service.domestic && service.international ? " · " : ""}{service.international ? "دولي" : ""}</p></div>)}</div> : <p className="text-xs text-muted-foreground">لا توجد تفاصيل خدمات منشورة.</p>}
                  </div>
                  <Button className="w-full gap-2" onClick={() => navigate("create-shipment")}><PackageCheck className="h-4 w-4" /> إنشاء شحنة بهذا الناقل</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> الحقول الديناميكية المطلوبة</CardTitle><p className="text-xs text-muted-foreground">هذه الحقول تُعرّف من إعدادات الناقل في الخادم، ويعرضها نموذج الشحنة بحسب تعريف كل شركة.</p></CardHeader>
                <CardContent className="space-y-2">
                  {details.customFields?.length ? details.customFields.map((field) => <div key={field.key} className="rounded-lg border border-border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{field.labelAr}</p><div className="flex gap-2"><Badge variant="outline">{field.type}</Badge><Badge variant={field.required ? "destructive" : "secondary"}>{field.required ? "إلزامي" : "اختياري"}</Badge></div></div><p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">{field.key}</p>{field.helpTextAr && <p className="mt-1 text-xs text-muted-foreground">{field.helpTextAr}</p>}</div>) : <EmptyState title="لا توجد حقول مخصصة" description="هذا الناقل لا يتطلب بيانات إضافية وفق آخر إعدادات الخادم." icon={CheckCircle2} />}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="flex items-center gap-3 rounded-xl border border-border p-3"><div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div><div><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-semibold">{value}</p></div></div>;
}
