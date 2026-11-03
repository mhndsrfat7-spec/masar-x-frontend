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
import { useTranslation } from "@/i18n";
import type { ShortCodeLookupResult } from "@/types/api";

export function AddressLookupPage() {
  const { token } = useAuth();
  const navigate = useRouterStore((s) => s.navigate);
  const setPrefill = useShipmentPrefillStore((s) => s.setPrefill);
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ShortCodeLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError(t("addressLookupPage.enterCodeFirstError"));
      return;
    }
    if (!token) {
      setError(t("addressLookupPage.sessionExpiredError"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await addressLookupApi.lookup(token, normalized);
      setResult(response);
      toast.success(t("addressLookupPage.addressRetrievedToast"));
    } catch (lookupError) {
      const message = lookupError instanceof ApiClientError
        ? lookupError.message
        : lookupError instanceof Error
          ? lookupError.message
          : t("addressLookupPage.retrieveFailedError");
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
        title={t("addressLookupPage.title")}
        description={t("addressLookupPage.description")}
      />

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-gradient-to-l from-primary/10 via-card to-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">{t("addressLookupPage.cardTitle")}</h2>
              <p className="text-xs text-muted-foreground mt-1">{t("addressLookupPage.cardSubtitle")}</p>
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
                placeholder={t("addressLookupPage.inputPlaceholder")}
                className="h-12 pr-10 font-mono"
                dir="ltr"
                autoComplete="off"
                maxLength={64}
              />
            </div>
            <Button type="submit" className="h-12 gap-2 sm:min-w-36" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t("addressLookupPage.fetchDataBtn")}
            </Button>
          </form>
          {isDemoMode() && <p className="mt-3 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-700">{t("addressLookupPage.demoNotice")}</p>}
          {error && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <p>{t("addressLookupPage.securityNotice")}</p>
          </div>
        </CardContent>
      </Card>

      {contact && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
              <div>
                <CardTitle className="text-base">{t("addressLookupPage.contactDetailsTitle")}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{t("addressLookupPage.recordFoundForCode", { code: result?.code })}</p>
              </div>
            </div>
            <Badge variant="secondary">{result?.source === "SPL" ? t("addressLookupPage.nationalAddressBadge") : t("addressLookupPage.contactAliasBadge")}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Detail label={t("addressLookupPage.nameLabel")} value={contact.name ?? contact.fullName ?? t("common.none")} />
              <Detail label={t("addressLookupPage.phoneLabel")} value={contact.phone ?? t("common.none")} dir="ltr" />
              <Detail label={t("addressLookupPage.cityLabel")} value={contact.cityName ?? contact.city ?? t("common.none")} />
              <Detail label={t("addressLookupPage.addressLabel")} value={contact.address ?? t("common.none")} />
              <Detail label={t("addressLookupPage.contactTypeLabel")} value={contact.type === "SENDER" ? t("addressLookupPage.typeSender") : contact.type === "RECEIVER" ? t("addressLookupPage.typeReceiver") : t("addressLookupPage.typeBoth")} />
              <Detail label={t("addressLookupPage.recordIdLabel")} value={contact.id} dir="ltr" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 border-t border-border pt-4">
              <Button onClick={() => useContact("sender")} className="gap-2 flex-1"><ArrowLeftRight className="h-4 w-4" /> {t("addressLookupPage.useAsSenderBtn")}</Button>
              <Button onClick={() => useContact("receiver")} variant="outline" className="gap-2 flex-1"><ArrowLeftRight className="h-4 w-4" /> {t("addressLookupPage.useAsReceiverBtn")}</Button>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {t("addressLookupPage.prefillNote")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Detail({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return <div className="rounded-xl border border-border bg-muted/20 p-3 min-w-0"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium" dir={dir ?? "auto"}>{value}</p></div>;
}
