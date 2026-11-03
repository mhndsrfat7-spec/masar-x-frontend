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
import { useTranslation } from "@/i18n";
import type { IntegrationConnection, IntegrationEvent, IntegrationEventDetails, IntegrationsOverview } from "@/types/api";

function unwrapEvents(value: IntegrationEvent[] | { data?: IntegrationEvent[] } | undefined): IntegrationEvent[] {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.data) ? value.data : [];
}

export function IntegrationsPage() {
  const { token, user } = useAuth();
  const { t, locale } = useTranslation();
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
      setError(loadError instanceof ApiClientError ? loadError.message : t("integrationsPage.loadFailedError"));
    } finally {
      setLoading(false);
    }
  }, [token, canManageIntegrations, filter, t]);

  useEffect(() => { if (canManageIntegrations) void reload(); }, [reload, canManageIntegrations]);

  const whatsappConnection = overview?.connections.find((item) => item.provider === "WHATSAPP");
  const filteredEvents = useMemo(() => events.filter((event) => filter === "all" || event.provider === filter), [events, filter]);

  const connectWhatsApp = async () => {
    if (!token) return;
    if (isDemoMode()) { toast.info(t("integrationsPage.demoConnectInfo")); return; }
    setConnecting(true);
    try {
      const result = await integrationsApi.connectWhatsApp(token);
      const target = new URL(result.authorizationUrl);
      const allowedMetaHosts = ["facebook.com", "www.facebook.com", "business.facebook.com"];
      if (target.protocol !== "https:" || !allowedMetaHosts.includes(target.hostname)) {
        throw new Error(t("integrationsPage.untrustedAuthUrlError"));
      }
      window.location.assign(target.toString());
    } catch (connectError) {
      toast.error(connectError instanceof ApiClientError ? connectError.message : t("integrationsPage.connectWhatsappFailed"));
      setConnecting(false);
    }
  };

  const disconnectWhatsApp = async () => {
    if (!token || !confirm(t("integrationsPage.confirmDisconnectWhatsapp"))) return;
    try {
      await integrationsApi.disconnectWhatsApp(token);
      toast.success(t("integrationsPage.disconnectRequestedToast"));
      await reload();
    } catch (disconnectError) {
      toast.error(disconnectError instanceof ApiClientError ? disconnectError.message : t("integrationsPage.disconnectFailed"));
    }
  };

  const openEvent = async (id: string) => {
    if (!token) return;
    setEventLoading(true);
    setEventDetails(null);
    try {
      setEventDetails(await integrationsApi.eventDetails(token, id));
    } catch (eventError) {
      toast.error(eventError instanceof ApiClientError ? eventError.message : t("integrationsPage.loadEventDetailsFailed"));
    } finally {
      setEventLoading(false);
    }
  };

  if (!canManageIntegrations) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("integrationsPage.title")} description={t("integrationsPage.shortDesc")} />
        <Card><CardContent className="py-16 text-center space-y-3"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground"><LockKeyhole className="h-7 w-7" /></div><h2 className="font-semibold">{t("integrationsPage.adminRequiredTitle")}</h2><p className="mx-auto max-w-lg text-sm text-muted-foreground">{t("integrationsPage.adminRequiredDesc")}</p></CardContent></Card>
      </div>
    );
  }

  const dateLocale = locale === "en" ? "en-US" : "ar-SA";

  return (
    <div className="space-y-6">
      <PageHeader title={t("integrationsPage.title")} description={t("integrationsPage.description")} action={<Button variant="outline" onClick={() => void reload()} className="gap-2"><RefreshCw className="h-4 w-4" /> {t("integrationsPage.refreshStatusBtn")}</Button>} />

      {isDemoMode() && <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-muted-foreground"><AlertTriangle className="inline h-4 w-4 me-1 text-amber-600" /> {t("integrationsPage.demoNotice")}</div>}

      {loading ? <LoadingState message={t("integrationsPage.loadingIntegrations")} /> : error ? <ErrorState message={`${error}. ${t("integrationsPage.endpointsRequiredNote")}`} onRetry={() => void reload()} /> : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><MessageCircle className="h-4 w-4 text-primary" /> {t("integrationsPage.whatsappCardTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{t("integrationsPage.connectionStatusLabel")}</p><p className="mt-1 text-xs text-muted-foreground">{t("integrationsPage.tokenSecurityNote")}</p></div><StatusPill status={overview?.whatsapp?.status ?? whatsappConnection?.status ?? "NOT_CONFIGURED"} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Info label={t("integrationsPage.displayPhoneLabel")} value={overview?.whatsapp?.displayPhoneNumber ?? t("integrationsPage.notLinked")} />
                  <Info label={t("integrationsPage.verifiedBusinessNameLabel")} value={overview?.whatsapp?.verifiedName ?? t("common.none")} />
                  <Info label={t("integrationsPage.phoneNumberIdLabel")} value={overview?.whatsapp?.phoneNumberId ?? t("common.none")} ltr />
                  <Info label={t("integrationsPage.wabaIdLabel")} value={overview?.whatsapp?.businessAccountId ?? t("common.none")} ltr />
                </div>
                <div className="rounded-lg border border-border p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{t("integrationsPage.webhookVerificationLabel")}</span>{overview?.whatsapp?.webhookVerified ? <Badge className="bg-emerald-500/10 text-emerald-700"><CheckCircle2 className="h-3 w-3 me-1" /> {t("integrationsPage.verifiedBadge")}</Badge> : <Badge variant="outline"><AlertTriangle className="h-3 w-3 me-1" /> {t("integrationsPage.unverifiedBadge")}</Badge>}</div><p className="mt-1 text-[11px] text-muted-foreground">{t("integrationsPage.webhookSignatureNote")}</p></div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => void connectWhatsApp()} disabled={connecting || isDemoMode()} className="flex-1 gap-2">{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} {t("integrationsPage.connectWhatsappBtn")}</Button>
                  <Button variant="outline" onClick={() => void disconnectWhatsApp()} disabled={isDemoMode() || (overview?.whatsapp?.status !== "CONNECTED" && whatsappConnection?.status !== "CONNECTED")} className="gap-2"><Unplug className="h-4 w-4" /> {t("integrationsPage.disconnectBtn")}</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Webhook className="h-4 w-4 text-primary" /> {t("integrationsPage.externalServicesTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(overview?.connections ?? []).filter((item) => item.provider !== "WHATSAPP").map((connection) => <ConnectionRow key={connection.id} connection={connection} />)}
                {(overview?.connections ?? []).filter((item) => item.provider !== "WHATSAPP").length === 0 && <EmptyState title={t("integrationsPage.noConnectionsDefinedTitle")} description={t("integrationsPage.noConnectionsDefinedDesc")} icon={Webhook} />}
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="inline h-4 w-4 me-1 text-primary" /> {t("integrationsPage.keysSecurityFooter")}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" /> {t("integrationsPage.webhookEventsTitle")}</CardTitle><select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs"><option value="all">{t("integrationsPage.allServicesFilter")}</option><option value="WHATSAPP">{t("integrationsPage.whatsappFilter")}</option><option value="MOYASAR">{t("integrationsPage.moyasarFilter")}</option><option value="PAYPAL">{t("integrationsPage.paypalFilter")}</option><option value="CARRIER">{t("integrationsPage.carriersFilter")}</option></select></div><p className="text-xs text-muted-foreground">{t("integrationsPage.webhookEventsSubtitle")}</p></CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? <EmptyState title={t("integrationsPage.noEventsTitle")} description={t("integrationsPage.noEventsDesc")} icon={Activity} /> : <div className="space-y-2">{filteredEvents.map((event) => <button key={event.id} type="button" onClick={() => void openEvent(event.id)} className="w-full rounded-xl border border-border p-3 text-start hover:bg-muted/30 transition-colors"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div className="min-w-0"><p className="font-semibold text-sm">{event.summaryAr ?? event.eventType}</p><p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">{event.provider} · {event.eventType}</p></div><div className="flex items-center gap-2"><EventStatus status={event.status} /><span className="text-[11px] text-muted-foreground">{new Date(event.occurredAt).toLocaleString(dateLocale)}</span></div></div>{event.errorMessageAr && <p className="mt-2 text-xs text-destructive">{event.errorMessageAr}</p>}</button>)}</div>}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!eventDetails || eventLoading} onOpenChange={(open) => { if (!open) setEventDetails(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{t("integrationsPage.eventDetailsDialogTitle")}</DialogTitle></DialogHeader>{eventLoading ? <LoadingState message={t("integrationsPage.loadingEventDetails")} /> : eventDetails && <div className="space-y-3"><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Info label={t("integrationsPage.eventIdLabel")} value={eventDetails.id} ltr /><Info label={t("integrationsPage.eventTypeLabel")} value={eventDetails.eventType} ltr /><Info label={t("integrationsPage.providerLabel")} value={eventDetails.provider} /><Info label={t("integrationsPage.statusLabel")} value={eventDetails.status} /><Info label={t("integrationsPage.externalIdLabel")} value={eventDetails.externalId ?? t("common.none")} ltr /><Info label={t("integrationsPage.attemptCountLabel")} value={String(eventDetails.attemptCount ?? 0)} /></div><SafeJson title={t("integrationsPage.sanitizedPayloadTitle")} value={eventDetails.safePayload} /><SafeJson title={t("integrationsPage.sanitizedResponseTitle")} value={eventDetails.safeResponse} /></div>}</DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { dict } = useTranslation();
  const statusLabels = dict.integrationsPage.statuses as Record<string, string>;
  const classNamesMap: Record<string, string> = {
    CONNECTED: "bg-emerald-500/10 text-emerald-700",
    PENDING: "bg-amber-500/10 text-amber-700",
    ERROR: "bg-destructive/10 text-destructive",
    NOT_CONFIGURED: "bg-muted text-muted-foreground",
    DISCONNECTED: "bg-muted text-muted-foreground",
  };
  const label = statusLabels[status] ?? statusLabels.NOT_CONFIGURED;
  const className = classNamesMap[status] ?? classNamesMap.NOT_CONFIGURED;
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

function EventStatus({ status }: { status: string }) {
  const icon = status === "PROCESSED" ? <CheckCircle2 className="h-3.5 w-3.5" /> : status === "FAILED" ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />;
  return <Badge variant="outline" className="gap-1">{icon}{status}</Badge>;
}

function ConnectionRow({ connection }: { connection: IntegrationConnection }) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? "en-US" : "ar-SA";
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{connection.nameAr}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {connection.provider}
          {connection.lastCheckedAt
            ? ` · ${t("integrationsPage.lastCheckedPrefix", { date: new Date(connection.lastCheckedAt).toLocaleString(dateLocale) })}`
            : ""}
        </p>
        {connection.lastErrorMessageAr && <p className="mt-1 text-xs text-destructive">{connection.lastErrorMessageAr}</p>}
      </div>
      <StatusPill status={connection.status} />
    </div>
  );
}

function Info({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return <div className="rounded-lg bg-muted/30 p-3 min-w-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 break-all text-xs font-medium" dir={ltr ? "ltr" : "auto"}>{value}</p></div>;
}

function SafeJson({ title, value }: { title: string; value?: Record<string, unknown> }) {
  const { t } = useTranslation();
  return <div><p className="mb-1 text-xs font-semibold">{title}</p><pre className="max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 text-[11px] leading-5" dir="ltr">{value ? JSON.stringify(value, null, 2) : t("common.noDataAvailable")}</pre></div>;
}
