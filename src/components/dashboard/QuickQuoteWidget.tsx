"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Loader2, ArrowLeftRight, Truck, Store, Zap } from "lucide-react";
import { toast } from "sonner";
import { publicApi } from "@/lib/api/services";
import { usePublicData } from "@/hooks/useData";
import { ApiClientError } from "@/lib/api/client";
import { formatSAR, halToSar } from "@/lib/format";
import type { QuoteResponse, QuoteResult } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouterStore } from "@/store/routerStore";
import { cn } from "@/lib/utils";

type DeliveryScope = "BRANCH" | "DOOR";

export function QuickQuoteWidget() {
  const { cities, loading: citiesLoading } = usePublicData();
  const navigate = useRouterStore((s) => s.navigate);
  const [originCityId, setOriginCityId] = useState("");
  const [destCityId, setDestCityId] = useState("");
  const [weightKg, setWeightKg] = useState("1");
  const [deliveryScope, setDeliveryScope] = useState<DeliveryScope>("DOOR");
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cities.length === 0) return;
    setOriginCityId((current) => current || cities[0].id);
    setDestCityId((current) => current || cities[Math.min(1, cities.length - 1)].id);
  }, [cities]);

  const cityById = useMemo(
    () => new Map(cities.map((city) => [city.id, city.nameAr || city.nameEn || city.id])),
    [cities]
  );

  const calculate = async () => {
    const weight = Number(weightKg);
    if (!originCityId || !destCityId) {
      toast.error("اختر مدينة الإرسال والاستلام أولاً");
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0 || weight > 1000) {
      toast.error("أدخل وزناً صحيحاً بين 0.1 و1000 كجم");
      return;
    }

    setBusy(true);
    setQuotes([]);
    try {
      const response = await publicApi.quote({
        originCityId,
        destCityId,
        paymentMode: "PREPAID",
        // Pass deliveryScope as a carrierField hint — backend can apply surcharges.
        ...(deliveryScope === "BRANCH" ? { carrierFields: { deliveryScope: "BRANCH" } } : {}),
        packages: [
          {
            weightGrams: Math.round(weight * 1000),
            description: "طرد",
            quantity: 1,
          },
        ],
      } as Parameters<typeof publicApi.quote>[0]);
      const list = Array.isArray(response)
        ? response
        : ((response as QuoteResponse).quotes ??
            ((response as QuoteResponse).best ? [(response as QuoteResponse).best as QuoteResult] : []));
      // Apply branch discount client-side for demo (5 SAR off)
      const adjusted = list.map((q) => {
        if (deliveryScope === "BRANCH" && q.totalHal) {
          return {
            ...q,
            totalHal: Math.max(0, q.totalHal - 500),
            shippingPriceHal: q.shippingPriceHal ? Math.max(0, q.shippingPriceHal - 500) : undefined,
          };
        }
        return q;
      });
      const validQuotes = adjusted.filter((quote) => typeof quote.totalHal === "number");
      setQuotes(validQuotes);
      if (validQuotes.length === 0) {
        toast.info("لا توجد عروض أسعار متاحة لهذا المسار والوزن");
      }
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : "تعذّر جلب عروض الأسعار"
      );
    } finally {
      setBusy(false);
    }
  };

  const bestPrice = quotes.reduce<number | null>(
    (best, quote) =>
      best === null || Number(quote.totalHal) < best
        ? Number(quote.totalHal)
        : best,
    null
  );

  /** Pre-fill CreateShipmentPage via the router store params. */
  const handleShipWithThis = (quote: QuoteResult) => {
    navigate("create-shipment", {
      originCityId: String(originCityId),
      destCityId: String(destCityId),
      weightKg: String(weightKg),
      deliveryScope: String(deliveryScope),
      carrierCode: quote.carrierCode ?? "",
      carrierNameAr: quote.carrierNameAr ?? "",
      serviceType: quote.serviceCode ?? quote.serviceType ?? "",
      totalHal: String(quote.totalHal ?? 0),
    });
    toast.success(`جارٍ تحضير شحنة مع ${quote.carrierNameAr ?? quote.carrierName ?? "الناقل"}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-primary" />
          مقارنة أسعار شركات الشحن
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          احصل على عروض الناقلين النشطين مباشرة من خدمة التسعير، ثم اشحن بأقل سعر.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>مدينة الإرسال</Label>
            <Select value={originCityId} onValueChange={setOriginCityId}>
              <SelectTrigger disabled={citiesLoading || cities.length === 0}>
                <SelectValue placeholder="اختر مدينة الإرسال" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.nameAr || city.nameEn || city.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>مدينة الاستلام</Label>
            <Select value={destCityId} onValueChange={setDestCityId}>
              <SelectTrigger disabled={citiesLoading || cities.length === 0}>
                <SelectValue placeholder="اختر مدينة الاستلام" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.nameAr || city.nameEn || city.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الوزن التقديري (كجم)</Label>
            <Input
              type="number"
              min="0.1"
              max="1000"
              step="0.1"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              dir="ltr"
            />
          </div>
          {/* Delivery scope: BRANCH vs DOOR */}
          <div className="space-y-2">
            <Label>طريقة التسليم</Label>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setDeliveryScope("BRANCH")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all",
                  deliveryScope === "BRANCH"
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="استلام وتسليم من فرع الشركة — أقل رسوم"
              >
                <Store className="h-3.5 w-3.5" />
                فرع
              </button>
              <button
                type="button"
                onClick={() => setDeliveryScope("DOOR")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all",
                  deliveryScope === "DOOR"
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="توصيل لباب المنزل/الموقع"
              >
                <Truck className="h-3.5 w-3.5" />
                باب المنزل
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {cityById.get(originCityId) ?? "—"} ← {cityById.get(destCityId) ?? "—"}
            {deliveryScope === "BRANCH" && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                وفّر 5 ر.س (فرع)
              </span>
            )}
          </div>
          <Button type="button" onClick={calculate} disabled={busy || citiesLoading} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            قارن الأسعار
          </Button>
        </div>

        {quotes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-border pt-4">
            {quotes
              .slice()
              .sort((a, b) => Number(a.totalHal) - Number(b.totalHal))
              .map((quote, index) => (
                <div
                  key={`${quote.carrierCode ?? quote.carrierId ?? index}-${quote.serviceCode ?? "service"}`}
                  className={cn(
                    "rounded-xl border p-3 flex flex-col gap-2",
                    quote.totalHal === bestPrice
                      ? "border-emerald-300 bg-emerald-50/40"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{quote.carrierNameAr ?? quote.carrierName ?? "ناقل"}</p>
                    {quote.totalHal === bestPrice && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        الأقل سعراً
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-primary" dir="ltr">
                    {formatSAR(halToSar(Number(quote.totalHal)), { withSymbol: false })} ر.س
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{quote.serviceCode ?? quote.serviceType ?? "خدمة قياسية"}</span>
                    <span>{quote.etaTextAr ?? "المدة غير محددة"}</span>
                  </div>
                  {/* "Ship with this offer" button — passes data to CreateShipmentPage */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleShipWithThis(quote)}
                    className="gap-1.5 mt-1 w-full bg-[#C5D86D] text-[#0F352E] hover:bg-[#d3e47e] font-bold"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    اشحن بهذا العرض
                  </Button>
                </div>
              ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">
          السعر استرشادي للوزن المدخل. السعر النهائي واحتساب الوزن الحجمي والرسوم الإضافية يعتمد على بيانات الشحنة التفصيلية وقواعد الناقل.
        </p>
      </CardContent>
    </Card>
  );
}
