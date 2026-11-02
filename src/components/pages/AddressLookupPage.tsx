"use client";

import { useState } from "react";
import { ArrowLeftRight, CheckCircle2, Loader2, MapPin, Search, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { addressLookupApi, isDemoMode } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { useRouterStore } from "@/store/routerStore";
import { useShipmentPrefillStore, type ShipmentContactTarget } from "@/store/shipmentPrefillStore";
import type { ShortCodeLookupResult } from "@/types/api";

export function AddressLookupPage() {
  const { token } = useAuth();
  const navigate = useRouterStore((s) => s.navigate);
  const setPrefill = useShipmentPrefillStore((s) => s.setPrefill);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ShortCodeLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError("أدخل العنوان المختصر أو رمز جهة الاتصال أولاً.");
      return;
    }
    if (!token) {
      setError("انتهت جلسة الدخول. سجّل الدخول ثم أعد المحاولة.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await addressLookupApi.lookup(token, normalized);
      setResult(response);
      toast.success("تم استرجاع بيانات العنوان");
    } catch (lookupError) {
      const message = lookupError instanceof ApiClientError
        ? lookupError.message
        : lookupError instanceof Error
          ? lookupError.message
          : "تعذّر استرجاع العنوان";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const useContact = (target: ShipmentContactTarget) => {
    if (!result?.contact) return;
    setPrefill(result.contact, target, result.code);
    navigate("create-shipment");
  };

  const contact = result?.contact;

  return (
    <div className="space-y-6">
      <PageHeader
        title="جلب العنوان المختصر"
        description="ابحث باستخدام رمز العنوان الوطني أو المعرّف المختصر لجهة اتصال محفوظة، ثم انقل البيانات إلى نموذج الشحنة دون إعادة إدخالها."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-gradient-to-l from-primary/10 via-card to-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">البحث عن عنوان أو جهة اتصال</h2>
              <p className="text-xs text-muted-foreground mt-1">أمثلة للمدخلات: SPL Code أو Customer Alias مثل #MX-1024</p>
            </div>
          </div>
        </div>
        <CardContent className="p-5">
          <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="أدخل الرمز المختصر…"
                className="h-12 pr-10 font-mono"
                dir="ltr"
                autoComplete="off"
                maxLength={64}
              />
            </div>
            <Button type="submit" className="h-12 gap-2 sm:min-w-36" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              جلب البيانات
            </Button>
          </form>
          {isDemoMode() && <p className="mt-3 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-700">وضع العرض التجريبي: نتائج البحث من بيانات عينة محلية، وليست خدمة SPL حقيقية.</p>}
          {error && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <p>يتم طلب البيانات من الخادم بعد تسجيل الدخول. لا تُخزّن بيانات العنوان في المتصفح، ويجب أن يطبّق الخادم صلاحيات الوصول وإخفاء البيانات غير المصرّح بها.</p>
          </div>
        </CardContent>
      </Card>

      {contact && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
              <div>
                <CardTitle className="text-base">بيانات جهة الاتصال</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">تم العثور على السجل المرتبط بالرمز {result?.code}</p>
              </div>
            </div>
            <Badge variant="secondary">{result?.source === "SPL" ? "عنوان وطني" : "معرّف جهة اتصال"}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Detail label="الاسم" value={contact.name ?? contact.fullName ?? "—"} />
              <Detail label="رقم الجوال" value={contact.phone ?? "—"} dir="ltr" />
              <Detail label="المدينة" value={contact.cityName ?? contact.city ?? "—"} />
              <Detail label="العنوان" value={contact.address ?? "—"} />
              <Detail label="نوع جهة الاتصال" value={contact.type === "SENDER" ? "مرسل" : contact.type === "RECEIVER" ? "مستلم" : "مرسل ومستلم"} />
              <Detail label="معرّف السجل" value={contact.id} dir="ltr" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 border-t border-border pt-4">
              <Button onClick={() => useContact("sender")} className="gap-2 flex-1"><ArrowLeftRight className="h-4 w-4" /> استخدام كمرسل</Button>
              <Button onClick={() => useContact("receiver")} variant="outline" className="gap-2 flex-1"><ArrowLeftRight className="h-4 w-4" /> استخدام كمستلم</Button>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> ستُنقل البيانات مباشرة إلى نموذج إنشاء الشحنة عبر حالة مؤقتة داخل التطبيق.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Detail({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return <div className="rounded-xl border border-border bg-muted/20 p-3 min-w-0"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium" dir={dir ?? "auto"}>{value}</p></div>;
}
