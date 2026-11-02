"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, Link2, Loader2, LockKeyhole, MessageCircle, RefreshCw, ShieldCheck, Unplug, Webhook, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { integrationsApi, isDemoMode } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import type { IntegrationConnection, IntegrationEvent, IntegrationEventDetails, IntegrationsOverview } from "@/types/api";

const STATUS: Record<string, { label: string; className: string }> = {
  CONNECTED: { label: "متصل", className: "bg-emerald-500/10 text-emerald-700" },
  PENDING: { label: "بانتظار التحقق", className: "bg-amber-500/10 text-amber-700" },
  ERROR: { label: "يوجد خطأ", className: "bg-destructive/10 text-destructive" },
  NOT_CONFIGURED: { label: "غير مهيأ", className: "bg-muted text-muted-foreground" },
  DISCONNECTED: { label: "غير متصل", className: "bg-muted text-muted-foreground" },
};

function unwrapEvents(value: IntegrationEvent[] | { data?: IntegrationEvent[] } | undefined): IntegrationEvent[] {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.data) ? value.data : [];
}

export function IntegrationsPage() {
  const { token, user } = useAuth();
  const role = String(user?.role ?? "").toUpperCase();
  const canManageIntegrations = isDemoMode() || role === "ADMIN" || role === "SUPER_ADMIN";
  const [overview, setOverview] = useState<IntegrationsOverview | null>(null);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [eventDetails, setEventDetails] = useState<IntegrationEventDetails | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const reload = useCallback(async () => {
    if (!token || !canManageIntegrations) return;
    setLoading(true);
    setError(null);
    try {
      const [summary, eventResponse] = await Promise.all([
        integrationsApi.overview(token),
        integrationsApi.events(token, { limit: 30, offset: 0, ...(filter === "all" ? {} : { provider: filter }) }),
      ]);
      setOverview(summary);
      setEvents(unwrapEvents(eventResponse as IntegrationEvent[] | { data?: IntegrationEvent[] }));
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "تعذّر تحميل حالة التكاملات وسجل الأحداث");
    } finally {
      setLoading(false);
    }
  }, [token, canManageIntegrations, filter]);

  useEffect(() => { if (canManageIntegrations) void reload(); }, [reload, canManageIntegrations]);

  const whatsappConnection = overview?.connections.find((item) => item.provider === "WHATSAPP");
  const filteredEvents = useMemo(() => events.filter((event) => filter === "all" || event.provider === filter), [events, filter]);

  const connectWhatsApp = async () => {
    if (!token) return;
    if (isDemoMode()) { toast.info("هذه الصفحة في وضع التجربة. حوّل NEXT_PUBLIC_API_MODE إلى real بعد تفعيل API التكاملات في الخادم."); return; }
    setConnecting(true);
    try {
      const result = await integrationsApi.connectWhatsApp(token);
      const target = new URL(result.authorizationUrl);
      const allowedMetaHosts = ["facebook.com", "www.facebook.com", "business.facebook.com"];
      if (target.protocol !== "https:" || !allowedMetaHosts.includes(target.hostname)) {
        throw new Error("رابط التفويض غير موثوق. يجب أن يصدر الخادم رابط HTTPS رسميًا من Meta.");
      }
      window.location.assign(target.toString());
    } catch (connectError) {
      toast.error(connectError instanceof ApiClientError ? connectError.message : "تعذّر بدء ربط واتساب للأعمال");
      setConnecting(false);
    }
  };

  const disconnectWhatsApp = async () => {
    if (!token || !confirm("سيؤدي فصل الاتصال إلى إيقاف إرسال رسائل واتساب من المنصة. هل تريد المتابعة؟")) return;
    try {
      await integrationsApi.disconnectWhatsApp(token);
      toast.success("تم طلب فصل اتصال واتساب");
      await reload();
    } catch (disconnectError) {
      toast.error(disconnectError instanceof ApiClientError ? disconnectError.message : "تعذّر فصل الاتصال");
    }
  };

  const openEvent = async (id: string) => {
    if (!token) return;
    setEventLoading(true);
    setEventDetails(null);
    try {
      setEventDetails(await integrationsApi.eventDetails(token, id));
    } catch (eventError) {
      toast.error(eventError instanceof ApiClientError ? eventError.message : "تعذّر تحميل تفاصيل الحدث");
    } finally {
      setEventLoading(false);
    }
  };

  if (!canManageIntegrations) {
    return (
      <div className="space-y-6">
        <PageHeader title="مركز التكاملات" description="إدارة اتصالات المنصة وسجلات Webhooks." />
        <Card><CardContent className="py-16 text-center space-y-3"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground"><LockKeyhole className="h-7 w-7" /></div><h2 className="font-semibold">صلاحية مسؤول النظام مطلوبة</h2><p className="mx-auto max-w-lg text-sm text-muted-foreground">هذه الصفحة مخصصة لمستخدم ADMIN أو SUPER_ADMIN. يجب على Backend فرض الصلاحيات نفسها على جميع مسارات التكاملات؛ إخفاء الصفحة في الفرونت ليس بديلًا عن التفويض في الخادم.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مركز التكاملات" description="تابع اتصال المنصة بشركات الشحن وبوابات الدفع وواتساب، وراجع أحداث Webhooks والأخطاء التشغيلية." action={<Button variant="outline" onClick={() => void reload()} className="gap-2"><RefreshCw className="h-4 w-4" /> تحديث الحالة</Button>} />

      {isDemoMode() && <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-muted-foreground"><AlertTriangle className="inline h-4 w-4 ml-1 text-amber-600" /> وضع العرض التجريبي مفعّل. بيانات الاتصال تجريبية، ولا يتم إنشاء ربط خارجي أو إرسال رسائل حقيقية.</div>}

      {loading ? <LoadingState message="جارٍ تحميل حالة التكاملات…" /> : error ? <ErrorState message={`${error}. يتطلب هذا القسم GET /api/v1/integrations وGET /api/v1/integrations/events.`} onRetry={() => void reload()} /> : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><MessageCircle className="h-4 w-4 text-primary" /> واتساب للأعمال (Meta Cloud API)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">حالة الاتصال</p><p className="mt-1 text-xs text-muted-foreground">لا تحفظ Access Token في المتصفح؛ يحتفظ به الخادم فقط.</p></div><StatusPill status={overview?.whatsapp?.status ?? whatsappConnection?.status ?? "NOT_CONFIGURED"} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Info label="رقم واتساب المعروض" value={overview?.whatsapp?.displayPhoneNumber ?? "غير مربوط"} />
                  <Info label="اسم النشاط الموثق" value={overview?.whatsapp?.verifiedName ?? "—"} />
                  <Info label="Phone Number ID" value={overview?.whatsapp?.phoneNumberId ?? "—"} ltr />
                  <Info label="WABA ID" value={overview?.whatsapp?.businessAccountId ?? "—"} ltr />
                </div>
                <div className="rounded-lg border border-border p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">التحقق من Webhook</span>{overview?.whatsapp?.webhookVerified ? <Badge className="bg-emerald-500/10 text-emerald-700"><CheckCircle2 className="h-3 w-3 ml-1" /> متحقق</Badge> : <Badge variant="outline"><AlertTriangle className="h-3 w-3 ml-1" /> غير متحقق</Badge>}</div><p className="mt-1 text-[11px] text-muted-foreground">يجب أن ينفذ الخادم تحدي التحقق والتحقق من توقيع X-Hub-Signature-256 قبل قبول الأحداث.</p></div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => void connectWhatsApp()} disabled={connecting || isDemoMode()} className="flex-1 gap-2">{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} ربط حساب واتساب</Button>
                  <Button variant="outline" onClick={() => void disconnectWhatsApp()} disabled={isDemoMode() || (overview?.whatsapp?.status !== "CONNECTED" && whatsappConnection?.status !== "CONNECTED")} className="gap-2"><Unplug className="h-4 w-4" /> فصل الاتصال</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Webhook className="h-4 w-4 text-primary" /> اتصالات الخدمات الخارجية</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(overview?.connections ?? []).filter((item) => item.provider !== "WHATSAPP").map((connection) => <ConnectionRow key={connection.id} connection={connection} />)}
                {(overview?.connections ?? []).filter((item) => item.provider !== "WHATSAPP").length === 0 && <EmptyState title="لا توجد اتصالات معرفة" description="أضف إعدادات شركات الشحن وبوابات الدفع من لوحة إدارة التكاملات في Backend." icon={Webhook} />}
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="inline h-4 w-4 ml-1 text-primary" /> جميع مفاتيح الناقلين وبوابات الدفع يجب أن تبقى في الخادم. تعرض هذه الواجهة حالة الربط وبيانات التعريف العامة فقط.</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" /> سجل أحداث التكاملات (Webhook Events)</CardTitle><select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs"><option value="all">جميع الخدمات</option><option value="WHATSAPP">واتساب</option><option value="MOYASAR">ميسر</option><option value="PAYPAL">PayPal</option><option value="CARRIER">شركات الشحن</option></select></div><p className="text-xs text-muted-foreground">يعرض حالة الاستقبال والمعالجة، دون إظهار مفاتيح أو بيانات دفع حساسة داخل سجل الأحداث.</p></CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? <EmptyState title="لا توجد أحداث مسجلة" description="ستظهر هنا إشعارات الناقلين ونتائج Webhooks وعمليات مزامنة الحالات بعد ربط الخدمات." icon={Activity} /> : <div className="space-y-2">{filteredEvents.map((event) => <button key={event.id} type="button" onClick={() => void openEvent(event.id)} className="w-full rounded-xl border border-border p-3 text-right hover:bg-muted/30 transition-colors"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div className="min-w-0"><p className="font-semibold text-sm">{event.summaryAr ?? event.eventType}</p><p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">{event.provider} · {event.eventType}</p></div><div className="flex items-center gap-2"><EventStatus status={event.status} /><span className="text-[11px] text-muted-foreground">{new Date(event.occurredAt).toLocaleString("ar-SA")}</span></div></div>{event.errorMessageAr && <p className="mt-2 text-xs text-destructive">{event.errorMessageAr}</p>}</button>)}</div>}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!eventDetails || eventLoading} onOpenChange={(open) => { if (!open) setEventDetails(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>تفاصيل حدث التكامل</DialogTitle></DialogHeader>{eventLoading ? <LoadingState message="جارٍ تحميل تفاصيل الحدث…" /> : eventDetails && <div className="space-y-3"><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Info label="معرّف الحدث" value={eventDetails.id} ltr /><Info label="نوع الحدث" value={eventDetails.eventType} ltr /><Info label="المزود" value={eventDetails.provider} /><Info label="الحالة" value={eventDetails.status} /><Info label="المعرف الخارجي" value={eventDetails.externalId ?? "—"} ltr /><Info label="عدد المحاولات" value={String(eventDetails.attemptCount ?? 0)} /></div><SafeJson title="البيانات الواردة المنقحة" value={eventDetails.safePayload} /><SafeJson title="استجابة المعالجة المنقحة" value={eventDetails.safeResponse} /></div>}</DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ status }: { status: string }) { const meta = STATUS[status] ?? STATUS.NOT_CONFIGURED; return <Badge variant="outline" className={meta.className}>{meta.label}</Badge>; }
function EventStatus({ status }: { status: string }) { const icon = status === "PROCESSED" ? <CheckCircle2 className="h-3.5 w-3.5" /> : status === "FAILED" ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />; return <Badge variant="outline" className="gap-1">{icon}{status}</Badge>; }
function ConnectionRow({ connection }: { connection: IntegrationConnection }) { return <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0"><p className="text-sm font-medium">{connection.nameAr}</p><p className="mt-1 text-[11px] text-muted-foreground">{connection.provider}{connection.lastCheckedAt ? ` · آخر فحص ${new Date(connection.lastCheckedAt).toLocaleString("ar-SA")}` : ""}</p>{connection.lastErrorMessageAr && <p className="mt-1 text-xs text-destructive">{connection.lastErrorMessageAr}</p>}</div><StatusPill status={connection.status} /></div>; }
function Info({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) { return <div className="rounded-lg bg-muted/30 p-3 min-w-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 break-all text-xs font-medium" dir={ltr ? "ltr" : "auto"}>{value}</p></div>; }
function SafeJson({ title, value }: { title: string; value?: Record<string, unknown> }) { return <div><p className="mb-1 text-xs font-semibold">{title}</p><pre className="max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 text-[11px] leading-5" dir="ltr">{value ? JSON.stringify(value, null, 2) : "لا توجد بيانات"}</pre></div>; }
