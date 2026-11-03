"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Truck, Loader2, Package, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useRouterStore } from "@/store/routerStore";
import { publicApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/common/StateViews";
import { StatusBadge, getStatusMeta } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { useTranslation } from "@/i18n";
import type { TrackingResult } from "@/types/api";

export function TrackingPage() {
  const { trackingNumber: initial } = useRouterStore((s) => s.params);
  const { t } = useTranslation();
  const [trackingNumber, setTrackingNumber] = useState(initial ?? "");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = async (tn: string) => {
    const v = tn.trim();
    if (!v) {
      setError(t("trackingPage.enterTrackingNumberError"));
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await publicApi.track(v);
      setResult(res);
      if (res) toast.success(t("trackingPage.shipmentFoundToast"));
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : t("trackingPage.shipmentNotFoundError");
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) {
      setTrackingNumber(initial);
      void runSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const events =
    result?.events ?? result?.history ?? result?.timeline ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("trackingPage.title")}
        description={t("trackingPage.description")}
      />

      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch(trackingNumber);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("trackingPage.inputPlaceholder")}
                className="pr-9 h-11"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                dir="ltr"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="gap-2 h-11"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {t("trackingPage.trackBtn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!searched ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              title={t("trackingPage.startTrackingTitle")}
              description={t("trackingPage.startTrackingDesc")}
              icon={Package}
            />
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="py-16">
            <LoadingState message={t("trackingPage.searchingShipment")} />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-16">
            <ErrorState message={error} onRetry={() => runSearch(trackingNumber)} />
          </CardContent>
        </Card>
      ) : result ? (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t("trackingPage.trackingNumberLabel")}</span>
                    <span className="font-mono text-sm font-bold text-primary" dir="ltr">
                      {result.trackingNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <StatusBadge status={result.status ?? "PENDING"} />
                    {(result.carrier ?? result.carrierNameAr) && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Truck className="h-3.5 w-3.5" />
                        {result.carrier ?? result.carrierNameAr}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-center">
                    <p className="text-[11px] text-muted-foreground">{t("trackingPage.originLabel")}</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {result.origin ?? result.originCity ?? t("common.none")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-muted-foreground">{t("trackingPage.destinationLabel")}</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {result.destination ?? result.destinationCity ?? t("common.none")}
                    </p>
                  </div>
                  {result.estimatedDelivery && (
                    <div className="text-center">
                      <p className="text-[11px] text-muted-foreground">{t("trackingPage.estimatedDeliveryLabel")}</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {formatDateTime(result.estimatedDelivery)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("trackingPage.timelineTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <EmptyState
                  title={t("trackingPage.noUpdatesTitle")}
                  description={t("trackingPage.noUpdatesDesc")}
                  icon={Package}
                  className="py-8"
                />
              ) : (
                <ol className="relative space-y-5 ps-5 border-s-2 border-border">
                  {events.map((ev, i) => {
                    const meta = getStatusMeta(ev.status ?? "");
                    const Icon = meta.icon;
                    return (
                      <li key={i} className="relative">
                        <span
                          className={`absolute -start-[1.55rem] top-1 h-3 w-3 rounded-full ring-4 ring-background ${meta.dot}`}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                              <Icon className="h-4 w-4" />
                              {ev.description ??
                                ev.message ??
                                ev.messageAr ??
                                ev.status ??
                                t("shipmentDetailsPage.updateFallback")}
                            </p>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(ev.timestamp ?? ev.createdAt)}
                            </span>
                          </div>
                          {(ev.location ?? ev.city) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {ev.location ?? ev.city}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
