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
import { useTranslation } from "@/i18n";

type DeliveryScope = "BRANCH" | "DOOR";

export function QuickQuoteWidget() {
  const { cities, loading: citiesLoading } = usePublicData();
  const navigate = useRouterStore((s) => s.navigate);
  const { t, locale } = useTranslation();
  const [originCityId, setOriginCityId] = useState("");
  const [destCityId, setDestCityId] = useState("");
  const [weightKg, setWeightKg] = useState("1");
  const [deliveryScope, setDeliveryScope] = useState<DeliveryScope>("DOOR");
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cities.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOriginCityId((current) => current || cities[0].id);
    setDestCityId((current) => current || cities[Math.min(1, cities.length - 1)].id);
  }, [cities]);

  const cityById = useMemo(
    () =>
      new Map(
        cities.map((city) => [
          city.id,
          locale === "en"
            ? city.nameEn || city.nameAr || city.id
            : city.nameAr || city.nameEn || city.id,
        ])
      ),
    [cities, locale]
  );

  const calculate = async () => {
    const weight = Number(weightKg);
    if (!originCityId || !destCityId) {
      toast.error(t("dashboard.quoteWidget.selectOriginAndDestFirst"));
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0 || weight > 1000) {
      toast.error(t("dashboard.quoteWidget.enterValidWeight"));
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
            description: t("dashboard.quoteWidget.parcelDefaultDesc"),
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
        toast.info(t("dashboard.quoteWidget.noQuotesAvailable"));
      }
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : t("dashboard.quoteWidget.fetchQuotesFailed")
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
    const carrierDisplayName =
      locale === "en"
        ? quote.carrierNameEn ?? quote.carrierName ?? quote.carrierNameAr ?? t("dashboard.quoteWidget.carrierFallback")
        : quote.carrierNameAr ?? quote.carrierName ?? t("dashboard.quoteWidget.carrierFallback");
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
    toast.success(t("dashboard.quoteWidget.preparingShipmentToast", { carrier: carrierDisplayName }));
  };

  return (
    <Card>
      <CardHeader className="px-3 pt-3 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-primary" />
          {t("dashboard.quoteWidget.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.quoteWidget.subtitle")}
        </p>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-3 sm:p-6 sm:space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="min-w-0 space-y-1">
            <Label>{t("dashboard.quoteWidget.originCity")}</Label>
            <Select value={originCityId} onValueChange={setOriginCityId}>
              <SelectTrigger className="h-9 text-xs" disabled={citiesLoading || cities.length === 0}>
                <SelectValue placeholder={t("dashboard.quoteWidget.selectOriginCity")} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {locale === "en"
                      ? city.nameEn || city.nameAr || city.id
                      : city.nameAr || city.nameEn || city.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1">
            <Label>{t("dashboard.quoteWidget.destCity")}</Label>
            <Select value={destCityId} onValueChange={setDestCityId}>
              <SelectTrigger className="h-9 text-xs" disabled={citiesLoading || cities.length === 0}>
                <SelectValue placeholder={t("dashboard.quoteWidget.selectDestCity")} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {locale === "en"
                      ? city.nameEn || city.nameAr || city.id
                      : city.nameAr || city.nameEn || city.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1">
            <Label>{t("dashboard.quoteWidget.estimatedWeightKg")}</Label>
            <Input
            className="h-9 text-sm"
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
          <div className="min-w-0 space-y-1">
            <Label>{t("dashboard.quoteWidget.deliveryMethod")}</Label>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setDeliveryScope("BRANCH")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all",
                  deliveryScope === "BRANCH"
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={t("dashboard.quoteWidget.branchTooltip")}
              >
                <Store className="h-3.5 w-3.5" />
                {t("dashboard.quoteWidget.branch")}
              </button>
              <button
                type="button"
                onClick={() => setDeliveryScope("DOOR")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all",
                  deliveryScope === "DOOR"
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={t("dashboard.quoteWidget.doorTooltip")}
              >
                <Truck className="h-3.5 w-3.5" />
                {t("dashboard.quoteWidget.door")}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {cityById.get(originCityId) ?? t("common.none")} {locale === "en" ? "→" : "←"} {cityById.get(destCityId) ?? t("common.none")}
            {deliveryScope === "BRANCH" && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {t("dashboard.quoteWidget.save5SarBranch")}
              </span>
            )}
          </div>
          <Button type="button" onClick={calculate} disabled={busy || citiesLoading} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            {t("dashboard.quoteWidget.comparePrices")}
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
                    <p className="text-sm font-semibold">
                      {locale === "en"
                        ? quote.carrierNameEn ?? quote.carrierName ?? quote.carrierNameAr ?? t("dashboard.quoteWidget.carrierFallback")
                        : quote.carrierNameAr ?? quote.carrierName ?? t("dashboard.quoteWidget.carrierFallback")}
                    </p>
                    {quote.totalHal === bestPrice && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {t("dashboard.quoteWidget.lowestPrice")}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-primary" dir="ltr">
                    {formatSAR(halToSar(Number(quote.totalHal)), { withSymbol: false })} {t("common.sar")}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{quote.serviceCode ?? quote.serviceType ?? t("dashboard.quoteWidget.standardService")}</span>
                    <span>{quote.etaTextAr ?? t("dashboard.quoteWidget.etaUnspecified")}</span>
                  </div>
                  {/* "Ship with this offer" button — passes data to CreateShipmentPage */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleShipWithThis(quote)}
                    className="gap-1.5 mt-1 w-full bg-[#C5D86D] text-[#0F352E] hover:bg-[#d3e47e] font-bold"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {t("dashboard.quoteWidget.shipWithThisOffer")}
                  </Button>
                </div>
              ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">
          {t("dashboard.quoteWidget.disclaimer")}
        </p>
      </CardContent>
    </Card>
  );
}
