"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Calculator,
  CheckCircle2,
  Send,
  Package,
  Store,
  Truck,
  UserRound,
  MapPin,
  Phone,
  Pencil,
  Weight,
} from "lucide-react";
import { toast } from "sonner";
import { useRouterStore } from "@/store/routerStore";
import { useAuth } from "@/hooks/useAuth";
import { shipmentsApi, publicApi, carrierCapabilitiesApi } from "@/lib/api/services";
import { usePublicData, useCustomers } from "@/hooks/useData";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader, BackButton } from "@/components/common/PageHeader";
import { QuickCodeLookup } from "@/components/common/QuickCodeLookup";
import { AwbWaybillModal } from "@/components/common/AwbWaybillModal";
import {
  ProfileRestrictionAlert,
  useIsProfileRestricted,
} from "@/components/common/ProfileRestrictionAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatSAR, halToSar } from "@/lib/format";
import { useShipmentPrefillStore } from "@/store/shipmentPrefillStore";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import type { CarrierCapabilityResponse, Shipment, Customer } from "@/types/api";
import type {
  CreateShipmentRequest,
  PaymentMode,
  QuoteResult,
  QuoteResponse,
  ShipmentPackage,
} from "@/types/api";

/**
 * Create shipment page — 3 sections in a 2-column grid:
 *   Left (col-span-2): Sender info + Receiver info + Packages + Payment
 *   Right (col-span-1): Quote panel + Create button (sticky)
 *
 * The sender + receiver can be picked from the address book OR typed inline.
 */
export function CreateShipmentPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { token } = useAuth();
  const { cities, carriers } = usePublicData();
  const { list: contacts } = useCustomers(token);
  const consumePrefill = useShipmentPrefillStore((s) => s.consumePrefill);
  const isProfileRestricted = useIsProfileRestricted();
  const { t, locale } = useTranslation();

  // Sender
  const [senderCityId, setSenderCityId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderAddressCode, setSenderAddressCode] = useState("");

  // Receiver
  const [receiverCityId, setReceiverCityId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverAddressCode, setReceiverAddressCode] = useState("");

  // Shipment
  const [carrierId, setCarrierId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("PREPAID");
  const [codAmount, setCodAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [legalAcknowledged, setLegalAcknowledged] = useState(false);
  const [packages, setPackages] = useState<ShipmentPackage[]>([
    { weightGrams: 1000, description: "", quantity: 1 },
  ]);

  // NEW: delivery scope (BRANCH = pickup/drop at branch, DOOR = door-to-door)
  const [deliveryScope, setDeliveryScope] = useState<"BRANCH" | "DOOR">("DOOR");
  // NEW: declared value (estimated goods value for insurance)
  const [declaredValue, setDeclaredValue] = useState("");

  // Quote state
  const [quoting, setQuoting] = useState(false);
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [carrierSchema, setCarrierSchema] = useState<CarrierCapabilityResponse | null>(null);
  const [carrierSchemaLoading, setCarrierSchemaLoading] = useState(false);
  const [carrierSchemaError, setCarrierSchemaError] = useState<string | null>(null);
  const [carrierFieldValues, setCarrierFieldValues] = useState<Record<string, string | number | boolean>>({});

  // NEW: AWB modal — opens automatically after successful shipment creation
  const [awbShipment, setAwbShipment] = useState<Shipment | null>(null);
  const [awbOpen, setAwbOpen] = useState(false);

  // NEW: flash state for SPL lookup success
  const [senderFlash, setSenderFlash] = useState(false);
  const [receiverFlash, setReceiverFlash] = useState(false);

  // Presentation-only expansion state; shipment data and API contracts remain unchanged.
  const [senderEditing, setSenderEditing] = useState(true);
  const [receiverEditing, setReceiverEditing] = useState(true);
  const [expandedPackageIndex, setExpandedPackageIndex] = useState<number | null>(0);

  // Close editable summaries on an actual outside pointer interaction.
  // Radix popovers/select menus render in portals and must not count as outside clicks.
  useEffect(() => {
    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // Radix Select/Popover content is rendered in a portal outside the Card DOM.
      // Interacting with a city selector option is still an interaction with its
      // owning form card, so it must never collapse that card.
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      const overlaySelector = '[data-radix-portal], [data-radix-popper-content-wrapper], [data-radix-select-content], [data-radix-select-viewport], [data-radix-collection-item], [role="listbox"], [role="option"], [data-shipment-select-content]';
      const isRadixOverlay = path.some((node) =>
        node instanceof Element && (node.matches(overlaySelector) || Boolean(node.closest(overlaySelector)))
      );
      if (isRadixOverlay) return;

      const senderCard = target.closest('[data-shipment-edit-panel="sender"]');
      const receiverCard = target.closest('[data-shipment-edit-panel="receiver"]');
      const activePackage = expandedPackageIndex === null ? null : target.closest(`[data-package-editor="${expandedPackageIndex}"]`);

      // Only a true outside interaction closes a completed card. Any field,
      // button, trigger, or control inside that card keeps it open.
      if (!senderCard && senderName.trim() && senderPhone.trim() && senderCityId) setSenderEditing(false);
      if (!receiverCard && receiverName.trim() && receiverPhone.trim() && receiverCityId) setReceiverEditing(false);
      if (expandedPackageIndex !== null && !activePackage) {
        const current = packages[expandedPackageIndex];
        if (current && String(current.description ?? "").trim() && Number(current.weightGrams) >= 100 && Number.isInteger(Number(current.quantity ?? 1)) && Number(current.quantity ?? 1) >= 1) setExpandedPackageIndex(null);
      }
    };
    // Bubble phase lets Radix process portalled controls before outside-collapse logic.
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [senderName, senderPhone, senderCityId, receiverName, receiverPhone, receiverCityId, expandedPackageIndex, packages]);

  useEffect(() => {
    if (cities.length === 0) return;
    const prefill = consumePrefill();
    if (!prefill) return;
    const { contact, target, code } = prefill;
    const cityId = contact.cityId || cities.find((city) => city.nameAr === contact.city || city.nameEn === contact.city || city.nameAr === contact.cityName)?.id || "";
    if (target === "sender") {
      setSenderName(contact.name ?? contact.fullName ?? "");
      setSenderPhone(contact.phone ?? "");
      setSenderAddress(contact.address ?? "");
      setSenderAddressCode(code);
      if (cityId) setSenderCityId(cityId);
    } else {
      setReceiverName(contact.name ?? contact.fullName ?? "");
      setReceiverPhone(contact.phone ?? "");
      setReceiverAddress(contact.address ?? "");
      setReceiverAddressCode(code);
      if (cityId) setReceiverCityId(cityId);
    }
    toast.success(
      t("createShipmentPage.prefillInsertedToast", {
        target: target === "sender" ? t("quickLookup.sender") : t("quickLookup.receiver"),
      })
    );
  }, [consumePrefill, cities, t]);

  const selectedCarrierCode = selectedQuote?.carrierCode ?? carriers.find((item) => item.id === selectedQuote?.carrierId)?.code;

  useEffect(() => {
    if (!selectedQuote) {
      setCarrierSchema(null);
      setCarrierSchemaError(null);
      setCarrierFieldValues({});
      setCarrierSchemaLoading(false);
      return;
    }
    if (!selectedCarrierCode) {
      setCarrierSchema(null);
      setCarrierFieldValues({});
      setCarrierSchemaError(t("createShipmentPage.errors.missingCarrierCode"));
      setCarrierSchemaLoading(false);
      return;
    }
    let active = true;
    setCarrierSchemaLoading(true);
    setCarrierSchemaError(null);
    setCarrierFieldValues({});
    carrierCapabilitiesApi.get(selectedCarrierCode)
      .then((response) => { if (active) setCarrierSchema(response); })
      .catch((error) => {
        if (!active) return;
        setCarrierSchema(null);
        setCarrierSchemaError(error instanceof ApiClientError ? error.message : t("createShipmentPage.errors.loadCarrierFieldsFailed"));
      })
      .finally(() => { if (active) setCarrierSchemaLoading(false); });
    return () => { active = false; };
  }, [selectedCarrierCode, selectedQuote, t]);

  const carrierFields = carrierSchema?.customFields ?? [];
  const requiredCarrierFieldsMissing = carrierFields.some((field) => {
    if (!field.required) return false;
    const value = carrierFieldValues[field.key];
    return value === undefined || value === null || value === "";
  });
  const invalidCarrierFields = carrierFields.filter((field) => {
    const rawValue = carrierFieldValues[field.key];
    if (rawValue === undefined || rawValue === null || rawValue === "") return false;
    if (field.type === "NUMBER") {
      const numericValue = Number(rawValue);
      return !Number.isFinite(numericValue) ||
        (field.min !== undefined && numericValue < field.min) ||
        (field.max !== undefined && numericValue > field.max);
    }
    if (field.type === "SELECT") {
      return !!field.options?.length && !field.options.some((option) => option.value === String(rawValue));
    }
    if (field.pattern && typeof rawValue === "string") {
      try { return !new RegExp(field.pattern).test(rawValue); } catch { return true; }
    }
    return false;
  });

  const totalWeightGrams = packages.reduce(
    (sum, p) =>
      sum + (Number(p.weightGrams) || 0) * (Number(p.quantity) || 1),
    0
  );
  const totalPieces = packages.reduce(
    (sum, p) => sum + (Number(p.quantity) || 1),
    0
  );
  const invalidPackages = packages.some((p) => {
    const weight = Number(p.weightGrams ?? 0);
    const quantity = Number(p.quantity ?? 1);
    return (
      !Number.isFinite(weight) || weight < 100 ||
      !Number.isInteger(quantity) || quantity < 1 ||
      !String(p.description ?? "").trim()
    );
  });
  const totalVolumetricWeightGrams = packages.reduce((sum, p) => {
    const length = Number(p.length ?? 0);
    const width = Number(p.width ?? 0);
    const height = Number(p.height ?? 0);
    if (!(length > 0 && width > 0 && height > 0)) return sum;
    const quantity = Math.max(1, Number(p.quantity ?? 1));
    return sum + Math.ceil((length * width * height * 1000) / 5000) * quantity;
  }, 0);
  const estimatedChargeableWeightGrams = Math.max(
    totalWeightGrams,
    totalVolumetricWeightGrams
  );

  const addPackage = () => {
    setExpandedPackageIndex(packages.length);
    setPackages((p) => [...p, { weightGrams: 1000, description: "", quantity: 1 }]);
  };

  const removePackage = (idx: number) => {
    setPackages((p) => p.filter((_, i) => i !== idx));
    setExpandedPackageIndex((current) => current === idx ? null : current !== null && current > idx ? current - 1 : current);
  };

  const updatePackage = (idx: number, patch: Partial<ShipmentPackage>) =>
    setPackages((p) =>
      p.map((pkg, i) => (i === idx ? { ...pkg, ...patch } : pkg))
    );

  const fillSender = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    if (c) {
      setSenderName(c.name ?? "");
      setSenderPhone(c.phone ?? "");
      setSenderAddress(c.address ?? "");
      const city = cities.find(
        (ct) => ct.nameAr === c.city || ct.nameEn === c.city
      );
      if (city) setSenderCityId(city.id);
      setSenderEditing(false);
    }
  };

  const fillReceiver = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    if (c) {
      setReceiverName(c.name ?? "");
      setReceiverPhone(c.phone ?? "");
      setReceiverAddress(c.address ?? "");
      const city = cities.find(
        (ct) => ct.nameAr === c.city || ct.nameEn === c.city
      );
      if (city) setReceiverCityId(city.id);
      setReceiverEditing(false);
    }
  };

  /** NEW: SPL short-code lookup → fills sender fields + flashes green */
  const handleSenderLookup = (contact: Customer, code: string) => {
    setSenderName(contact.name ?? contact.fullName ?? "");
    setSenderPhone(contact.phone ?? "");
    setSenderAddress(contact.address ?? "");
    setSenderAddressCode(code);
    if (contact.cityId) {
      setSenderCityId(contact.cityId);
    } else if (contact.city) {
      const city = cities.find((ct) => ct.nameAr === contact.city || ct.nameEn === contact.city);
      if (city) setSenderCityId(city.id);
    }
    setSenderEditing(false);
    setSenderFlash(true);
    setTimeout(() => setSenderFlash(false), 1500);
  };

  /** NEW: SPL short-code lookup → fills receiver fields + flashes green */
  const handleReceiverLookup = (contact: Customer, code: string) => {
    setReceiverName(contact.name ?? contact.fullName ?? "");
    setReceiverPhone(contact.phone ?? "");
    setReceiverAddress(contact.address ?? "");
    setReceiverAddressCode(code);
    if (contact.cityId) {
      setReceiverCityId(contact.cityId);
    } else if (contact.city) {
      const city = cities.find((ct) => ct.nameAr === contact.city || ct.nameEn === contact.city);
      if (city) setReceiverCityId(city.id);
    }
    setReceiverEditing(false);
    setReceiverFlash(true);
    setTimeout(() => setReceiverFlash(false), 1500);
  };

  /** NEW: prefill from QuickQuoteWidget "اشحن بهذا العرض" */
  useEffect(() => {
    const params = useRouterStore.getState?.()?.params;
    if (!params || !cities.length) return;
    if (params.originCityId) setSenderCityId(String(params.originCityId));
    if (params.destCityId) setReceiverCityId(String(params.destCityId));
    if (params.weightKg) {
      const kg = Number(params.weightKg);
      setPackages([{ weightGrams: Math.round(kg * 1000), description: t("dashboard.quoteWidget.parcelDefaultDesc"), quantity: 1 }]);
    }
    if (params.deliveryScope) setDeliveryScope(params.deliveryScope as "BRANCH" | "DOOR");
  }, [cities, t]);

  const handleQuote = async () => {
    if (!senderCityId || !receiverCityId) {
      toast.error(t("createShipmentPage.errors.selectOriginAndDestCities"));
      return;
    }
    if (packages.length === 0 || invalidPackages) {
      toast.error(t("createShipmentPage.errors.invalidPackagesCheck"));
      return;
    }
    if (paymentMode === "COD" && (!Number.isFinite(Number(codAmount)) || Number(codAmount) <= 0)) {
      toast.error(t("createShipmentPage.errors.enterPositiveCodAmount"));
      return;
    }
    setQuoting(true);
    setQuotes([]);
    setSelectedQuote(null);
    try {
      const payload = {
        originCityId: senderCityId,
        destCityId: receiverCityId,
        carrierId: carrierId || undefined,
        serviceType: serviceType || undefined,
        paymentMode,
        codAmountHal:
          paymentMode === "COD"
            ? Math.round(Number(codAmount || 0) * 100)
            : undefined,
        packages: packages.map((p) => ({
          weightGrams: Number(p.weightGrams ?? 0),
          ...(Number(p.length ?? 0) > 0 ? { length: Number(p.length) } : {}),
          ...(Number(p.width ?? 0) > 0 ? { width: Number(p.width) } : {}),
          ...(Number(p.height ?? 0) > 0 ? { height: Number(p.height) } : {}),
          description: p.description ?? t("dashboard.quoteWidget.parcelDefaultDesc"),
          quantity: Number(p.quantity ?? 1),
        })),
      } as unknown as CreateShipmentRequest;
      const res = token
        ? await shipmentsApi.quote(token, payload as unknown as Parameters<typeof shipmentsApi.quote>[1])
        : await publicApi.quote(payload as unknown as Parameters<typeof publicApi.quote>[0]);
      const arr: QuoteResult[] = Array.isArray(res)
        ? res
        : (res as QuoteResponse)?.quotes ?? [];
      setQuotes(arr);
      if (arr.length > 0) {
        setSelectedQuote(arr[0]);
        toast.success(t("createShipmentPage.errors.quotesFoundToast", { count: arr.length }));
      } else {
        toast.info(t("createShipmentPage.errors.noQuotesForRoute"));
      }
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("createShipmentPage.errors.calculateQuoteFailed")
      );
    } finally {
      setQuoting(false);
    }
  };

  const handleCreate = async () => {
    if (!token) {
      toast.error(t("common.loginFirst"));
      return;
    }
    if (isProfileRestricted) {
      toast.warning(t("createShipmentPage.errors.restrictedModeWarning"));
      return;
    }
    if (!receiverName || !receiverPhone) {
      toast.error(t("createShipmentPage.errors.completeReceiverInfo"));
      return;
    }
    if (!senderName || !senderPhone) {
      toast.error(t("createShipmentPage.errors.completeSenderInfo"));
      return;
    }
    if (!selectedQuote) {
      toast.error(t("createShipmentPage.errors.calculateAndSelectQuoteFirst"));
      return;
    }
    if (invalidPackages) {
      toast.error(t("createShipmentPage.errors.checkPackagesBeforeCreate"));
      return;
    }
    if (paymentMode === "COD" && (!Number.isFinite(Number(codAmount)) || Number(codAmount) <= 0)) {
      toast.error(t("createShipmentPage.errors.enterPositiveCodAmount"));
      return;
    }
    if (!legalAcknowledged) {
      toast.error(t("createShipmentPage.errors.mustAcknowledgeLegal"));
      return;
    }
    if (carrierSchemaLoading || carrierSchemaError) {
      toast.error(t("createShipmentPage.errors.carrierSchemaVerifyFailed"));
      return;
    }
    if (requiredCarrierFieldsMissing) {
      toast.error(t("createShipmentPage.errors.completeRequiredCarrierFields"));
      return;
    }
    if (invalidCarrierFields.length > 0) {
      toast.error(t("createShipmentPage.errors.invalidCarrierFieldValues"));
      return;
    }
    setCreating(true);
    try {
      const senderCity = cities.find((c) => c.id === senderCityId);
      const receiverCity = cities.find((c) => c.id === receiverCityId);
      const payload: CreateShipmentRequest = {
        originCityId: senderCityId,
        destCityId: receiverCityId,
        senderName,
        senderPhone,
        senderCity: senderCity?.nameAr ?? "",
        senderCityId,
        senderAddress,
        senderAddressCode: senderAddressCode || undefined,
        receiverName,
        receiverPhone,
        receiverCity: receiverCity?.nameAr ?? "",
        receiverCityId,
        receiverAddress,
        receiverAddressCode: receiverAddressCode || undefined,
        carrierId: selectedQuote?.carrierId ?? carrierId,
        carrierCode: selectedQuote?.carrierCode ?? "",
        carrierName: selectedQuote?.carrierNameAr ?? "",
        carrierNameAr: selectedQuote?.carrierNameAr ?? "",
        serviceType: selectedQuote?.serviceCode ?? serviceType,
        paymentMode,
        codAmount: paymentMode === "COD" ? Number(codAmount || 0) : undefined,
        codAmountHal:
          paymentMode === "COD"
            ? Math.round(Number(codAmount || 0) * 100)
            : undefined,
        notes,
        carrierFields: Object.keys(carrierFieldValues).length ? carrierFieldValues : undefined,
        ...(deliveryScope === "BRANCH" ? { carrierFields: { ...carrierFieldValues, deliveryScope: "BRANCH" } } : {}),
        ...(declaredValue && Number(declaredValue) > 0 ? { declaredValue: Number(declaredValue), declaredValueHal: Math.round(Number(declaredValue) * 100) } : {}),
        packages: packages.map((p) => ({
          weightGrams: Number(p.weightGrams ?? 0),
          ...(Number(p.length ?? 0) > 0 ? { length: Number(p.length) } : {}),
          ...(Number(p.width ?? 0) > 0 ? { width: Number(p.width) } : {}),
          ...(Number(p.height ?? 0) > 0 ? { height: Number(p.height) } : {}),
          description: p.description ?? t("dashboard.quoteWidget.parcelDefaultDesc"),
          quantity: Number(p.quantity ?? 1),
        })),
        weightGrams: totalWeightGrams,
        pieces: totalPieces,
        price: selectedQuote ? halToSar(selectedQuote.totalHal) : undefined,
        totalHal: selectedQuote?.totalHal,
        shippingPriceHal: selectedQuote?.shippingPriceHal,
        vatHal: selectedQuote?.vatHal,
        currency: "SAR",
      };
      const shipment = await shipmentsApi.create(token, payload);
      toast.success(t("createShipmentPage.errors.shipmentCreatedSuccess"));
      setAwbShipment(shipment);
      setAwbOpen(true);
      import("@/lib/api/swrCache").then(({ invalidateSwr }) => {
        if (token) {
          invalidateSwr(`shipments:${token}`);
          invalidateSwr(`shipment-stats:${token}`);
          invalidateSwr(`wallet:${token}`);
          invalidateSwr(`wallet-tx:${token}`);
          invalidateSwr(`notifications:${token}`);
        }
      });
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("createShipmentPage.errors.createShipmentFailed")
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={() => navigate("shipments")} />
      <PageHeader
        title={t("createShipmentPage.title")}
        description={t("createShipmentPage.description")}
      />

      {/* Restricted-browsing guidance card */}
      <ProfileRestrictionAlert />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-5">
          {/* SENDER */}
          <Card data-shipment-edit-panel="sender" className={cn("transition-all", senderFlash && "ring-2 ring-emerald-500/50 border-emerald-400")}>
            <CardHeader className="px-3 pb-2 pt-3 sm:px-6 sm:pb-3 sm:pt-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                {t("createShipmentPage.senderSectionTitle")}
              </CardTitle>
              {!senderEditing && senderName.trim() && senderPhone.trim() && senderCityId && (
                <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-primary" onClick={() => setSenderEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> {locale === "en" ? "Edit" : "تعديل"}
                </Button>
              )}
            </CardHeader>
            {!senderEditing && senderName.trim() && senderPhone.trim() && senderCityId ? (
              <CardContent className="pt-0">
                <button type="button" onClick={() => setSenderEditing(true)} className="group flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3 py-2.5 text-start transition-colors hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4 shrink-0 text-emerald-700" /> <span className="truncate">{senderName}</span></span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" /><bdi dir="ltr">{senderPhone}</bdi></span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{cities.find((c) => c.id === senderCityId)?.[locale === "en" ? "nameEn" : "nameAr"] || "—"}</span>
                  <span className="ms-auto inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700"><Pencil className="h-3 w-3" />{locale === "en" ? "Edit details" : "تعديل البيانات"}</span>
                </button>
              </CardContent>
            ) : <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-6">
              {/* NEW: SPL short-code lookup */}
              <QuickCodeLookup
                token={token}
                target="sender"
                onResolved={handleSenderLookup}
              />
              {contacts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("createShipmentPage.quickSelectFromAddressBook")}
                  </Label>
                  <Select onValueChange={fillSender}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("createShipmentPage.selectSavedSender")} />
                    </SelectTrigger>
                    <SelectContent data-shipment-select-content="true">
                      {contacts
                        .filter(
                          (c) =>
                            c.type === "SENDER" ||
                            c.type === "BOTH" ||
                            !c.type
                        )
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} — {c.phone}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>{t("createShipmentPage.senderNameLabel")}</Label>
                  <Input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={t("createShipmentPage.senderNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("createShipmentPage.senderPhoneLabel")}</Label>
                  <Input
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("createShipmentPage.senderCityLabel")}</Label>
                  <Select
                    value={senderCityId}
                    onValueChange={setSenderCityId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("createShipmentPage.selectCityPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent data-shipment-select-content="true">
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {locale === "en"
                            ? `${c.nameEn || c.nameAr}${c.regionEn || c.regionAr ? ` — ${c.regionEn || c.regionAr}` : ""}`
                            : `${c.nameAr} — ${c.regionAr}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("createShipmentPage.senderAddressLabel")}</Label>
                  <Input value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} placeholder={t("createShipmentPage.addressPlaceholder")} />
                  {senderAddressCode && <p className="text-[11px] text-emerald-700">{t("createShipmentPage.fetchedByCode")} <span dir="ltr" className="font-mono">{senderAddressCode}</span></p>}
                </div>
              </div>
            </CardContent>}
          </Card>

          {/* RECEIVER */}
          <Card data-shipment-edit-panel="receiver" className={cn("transition-all", receiverFlash && "ring-2 ring-emerald-500/50 border-emerald-400")}>
            <CardHeader className="px-3 pb-2 pt-3 sm:px-6 sm:pb-3 sm:pt-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                {t("createShipmentPage.receiverSectionTitle")}
              </CardTitle>
              {!receiverEditing && receiverName.trim() && receiverPhone.trim() && receiverCityId && (
                <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-primary" onClick={() => setReceiverEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> {locale === "en" ? "Edit" : "تعديل"}
                </Button>
              )}
            </CardHeader>
            {!receiverEditing && receiverName.trim() && receiverPhone.trim() && receiverCityId ? (
              <CardContent className="pt-0">
                <button type="button" onClick={() => setReceiverEditing(true)} className="group flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-sky-200/80 bg-sky-50/60 px-3 py-2.5 text-start transition-colors hover:bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/20">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4 shrink-0 text-sky-700" /> <span className="truncate">{receiverName}</span></span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" /><bdi dir="ltr">{receiverPhone}</bdi></span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{cities.find((c) => c.id === receiverCityId)?.[locale === "en" ? "nameEn" : "nameAr"] || "—"}</span>
                  <span className="ms-auto inline-flex items-center gap-1 text-[11px] font-medium text-sky-700"><Pencil className="h-3 w-3" />{locale === "en" ? "Edit details" : "تعديل البيانات"}</span>
                </button>
              </CardContent>
            ) : <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-6">
              {/* NEW: SPL short-code lookup */}
              <QuickCodeLookup
                token={token}
                target="receiver"
                onResolved={handleReceiverLookup}
              />
              {contacts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("createShipmentPage.quickSelectFromAddressBook")}
                  </Label>
                  <Select onValueChange={fillReceiver}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("createShipmentPage.selectSavedReceiver")} />
                    </SelectTrigger>
                    <SelectContent data-shipment-select-content="true">
                      {contacts
                        .filter(
                          (c) =>
                            c.type === "RECEIVER" ||
                            c.type === "BOTH" ||
                            !c.type
                        )
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} — {c.phone}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>{t("createShipmentPage.receiverNameLabel")}</Label>
                  <Input
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder={t("createShipmentPage.receiverNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("createShipmentPage.receiverPhoneLabel")}</Label>
                  <Input
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("createShipmentPage.receiverCityLabel")}</Label>
                  <Select
                    value={receiverCityId}
                    onValueChange={setReceiverCityId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("createShipmentPage.selectCityPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent data-shipment-select-content="true">
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {locale === "en"
                            ? `${c.nameEn || c.nameAr}${c.regionEn || c.regionAr ? ` — ${c.regionEn || c.regionAr}` : ""}`
                            : `${c.nameAr} — ${c.regionAr}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("createShipmentPage.receiverAddressLabel")}</Label>
                  <Input value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} placeholder={t("createShipmentPage.addressPlaceholder")} />
                  {receiverAddressCode && <p className="text-[11px] text-emerald-700">{t("createShipmentPage.fetchedByCode")} <span dir="ltr" className="font-mono">{receiverAddressCode}</span></p>}
                </div>
              </div>
            </CardContent>}
          </Card>

          {/* PACKAGES */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("createShipmentPage.packagesSectionTitle")}</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={addPackage}
              >
                <Plus className="h-4 w-4" />
                {t("createShipmentPage.addPackageBtn")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {packages.map((p, i) => (
                <div key={i} data-package-editor={i} className="space-y-2">
                  {expandedPackageIndex !== i && String(p.description ?? "").trim() && Number(p.weightGrams) >= 100 && Number.isInteger(Number(p.quantity ?? 1)) && Number(p.quantity ?? 1) >= 1 ? (
                    <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-2 py-2 shadow-sm transition-all hover:border-primary/40">
                      <button type="button" onClick={() => setExpandedPackageIndex(i)} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-1 py-0.5 text-start">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Package className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.description}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{locale === "en" ? `Package ${i + 1}` : `القطعة ${i + 1}`} · {p.quantity ?? 1} × {(Number(p.weightGrams) / 1000).toFixed(2)} {t("common.kg")}{Number(p.length) > 0 && Number(p.width) > 0 && Number(p.height) > 0 ? ` · ${p.length} × ${p.width} × ${p.height} ${locale === "en" ? "cm" : "سم"}` : ""}</span></span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground"><Weight className="h-3 w-3" />{((Number(p.weightGrams) * Number(p.quantity ?? 1)) / 1000).toFixed(2)} {t("common.kg")}</span>
                        <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </button>
                      {packages.length > 1 && <button type="button" onClick={() => removePackage(i)} className="rounded-md p-2 text-destructive transition-colors hover:bg-destructive/10" aria-label={t("createShipmentPage.removePackageAria")}><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  ) : <div className="relative grid grid-cols-1 sm:grid-cols-12 gap-2 items-end rounded-xl border border-primary/20 bg-muted/20 p-2.5 sm:p-3 shadow-sm">
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">{t("createShipmentPage.weightKgLabel")}</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={p.weightGrams ? (p.weightGrams / 1000).toString() : ""}
                      onChange={(e) =>
                        updatePackage(i, {
                          weightGrams: Math.round(Number(e.target.value) * 1000),
                        })
                      }
                      dir="ltr"
                      placeholder="2.5"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">{t("createShipmentPage.quantityLabel")}</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={p.quantity ?? 1}
                      onChange={(e) =>
                        updatePackage(i, { quantity: Number(e.target.value) })
                      }
                      dir="ltr"
                    />
                  </div>
                  <div className="sm:col-span-5 space-y-1">
                    <Label className="text-xs">{t("createShipmentPage.packageDescLabel")}</Label>
                    <Input
                      value={p.description ?? ""}
                      onChange={(e) =>
                        updatePackage(i, { description: e.target.value })
                      }
                      placeholder={t("createShipmentPage.packageDescPlaceholder")}
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePackage(i)}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={t("createShipmentPage.removePackageAria")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs">{t("createShipmentPage.lengthCmLabel")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={p.length ?? ""}
                      onChange={(e) =>
                        updatePackage(i, {
                          length: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      dir="ltr"
                      placeholder={t("common.optional")}
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs">{t("createShipmentPage.widthCmLabel")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={p.width ?? ""}
                      onChange={(e) =>
                        updatePackage(i, {
                          width: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      dir="ltr"
                      placeholder={t("common.optional")}
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs">{t("createShipmentPage.heightCmLabel")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={p.height ?? ""}
                      onChange={(e) =>
                        updatePackage(i, {
                          height: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      dir="ltr"
                      placeholder={t("common.optional")}
                    />
                  </div>
                  </div>}
                </div>
              ))}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-border bg-muted/30 p-3 text-sm">
                <WeightSummary label={t("createShipmentPage.piecesCountSummary")} value={t("createShipmentPage.piecesUnit", { count: totalPieces })} />
                <WeightSummary label={t("createShipmentPage.actualWeightSummary")} value={`${(totalWeightGrams / 1000).toFixed(2)} ${t("common.kg")}`} />
                <WeightSummary label={t("createShipmentPage.volumetricWeightSummary")} value={`${(totalVolumetricWeightGrams / 1000).toFixed(2)} ${t("common.kg")}`} />
                <WeightSummary label={t("createShipmentPage.chargeableWeightSummary")} value={`${(estimatedChargeableWeightGrams / 1000).toFixed(2)} ${t("common.kg")}`} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("createShipmentPage.volumetricDisclaimer")}
              </p>
            </CardContent>
          </Card>

          {/* PAYMENT + DELIVERY SCOPE + DECLARED VALUE */}
          <Card>
            <CardHeader className="px-3 pb-2 pt-3 sm:px-6 sm:pb-3 sm:pt-6">
              <CardTitle className="text-base">{t("createShipmentPage.paymentAndDeliveryTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-6">
              {/* NEW: delivery scope (BRANCH vs DOOR) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">{t("createShipmentPage.deliveryScopeLabel")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryScope("BRANCH")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 p-3 text-start transition-all",
                      deliveryScope === "BRANCH"
                        ? "border-emerald-400 bg-emerald-50/50"
                        : "border-border hover:border-emerald-200"
                    )}
                  >
                    <Store className={cn("h-5 w-5", deliveryScope === "BRANCH" ? "text-emerald-600" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-semibold">{t("createShipmentPage.branchDeliveryTitle")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("createShipmentPage.branchDeliveryDesc")}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryScope("DOOR")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 p-3 text-start transition-all",
                      deliveryScope === "DOOR"
                        ? "border-emerald-400 bg-emerald-50/50"
                        : "border-border hover:border-emerald-200"
                    )}
                  >
                    <Truck className={cn("h-5 w-5", deliveryScope === "DOOR" ? "text-emerald-600" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-semibold">{t("createShipmentPage.doorDeliveryTitle")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("createShipmentPage.doorDeliveryDesc")}</p>
                    </div>
                  </button>
                </div>
              </div>

              <RadioGroup
                value={paymentMode}
                onValueChange={(v) => setPaymentMode(v as PaymentMode)}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  htmlFor="prepaid"
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                    paymentMode === "PREPAID"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem
                    value="PREPAID"
                    id="prepaid"
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold">{t("createShipmentPage.prepaidTitle")}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("createShipmentPage.prepaidDesc")}
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="cod"
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                    paymentMode === "COD"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value="COD" id="cod" className="mt-1" />
                  <div>
                    <p className="text-sm font-semibold">{t("createShipmentPage.codTitle")}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("createShipmentPage.codDesc")}
                    </p>
                  </div>
                </label>
              </RadioGroup>
              {paymentMode === "COD" && (
                <div className="space-y-2">
                  <Label>{t("createShipmentPage.codAmountLabel")}</Label>
                  <Input
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                    placeholder="100.00"
                    dir="ltr"
                  />
                </div>
              )}
              {/* NEW: declared value (estimated goods value for insurance) */}
              <div className="space-y-2">
                <Label htmlFor="declared-value" className="text-xs font-medium">
                  {t("createShipmentPage.declaredValueLabel")}
                </Label>
                <Input
                  id="declared-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  placeholder={t("createShipmentPage.declaredValuePlaceholder")}
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground">
                  {t("createShipmentPage.declaredValueHint")}
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <Checkbox
                  id="legal-acknowledgement"
                  checked={legalAcknowledged}
                  onCheckedChange={(checked) => setLegalAcknowledged(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="legal-acknowledgement" className="text-xs leading-6 text-muted-foreground cursor-pointer">
                  {t("createShipmentPage.legalAcknowledgement")}
                </label>
              </div>
              <div className="space-y-2">
                <Label>{t("createShipmentPage.notesLabel")}</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("createShipmentPage.notesPlaceholder")}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: quote + actions */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader className="px-3 pb-2 pt-3 sm:px-6 sm:pb-3 sm:pt-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                {t("createShipmentPage.pricingCardTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                className="w-full gap-2"
                onClick={handleQuote}
                disabled={quoting}
              >
                {quoting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                {t("createShipmentPage.getQuotesBtn")}
              </Button>

              {quotes.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {quotes.map((q, i) => {
                    const selected =
                      selectedQuote?.carrierCode === q.carrierCode &&
                      selectedQuote?.totalHal === q.totalHal;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedQuote(q)}
                        className={`w-full text-start rounded-xl border-2 p-3 transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {locale === "en"
                              ? q.carrierNameEn ?? q.carrierName ?? q.carrierNameAr ?? t("dashboard.quoteWidget.carrierFallback")
                              : q.carrierNameAr ?? q.carrierName ?? t("dashboard.quoteWidget.carrierFallback")}
                          </span>
                          <span
                            className="text-base font-bold text-primary"
                            dir="ltr"
                          >
                            {q.totalHal
                              ? formatSAR(halToSar(q.totalHal))
                              : t("common.none")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-muted-foreground">
                            {q.serviceCode ?? t("dashboard.quoteWidget.standardService")}
                          </span>
                          {q.etaTextAr && (
                            <span className="text-[11px] text-muted-foreground">
                              {q.etaTextAr}
                            </span>
                          )}
                        </div>
                        {(q.weightBreakdown?.chargeableGrams ?? q.chargeableGrams) != null && (
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {t("createShipmentPage.chargeableWeightAtQuote", {
                              weight: (
                                Number(q.weightBreakdown?.chargeableGrams ?? q.chargeableGrams) / 1000
                              ).toFixed(2),
                            })}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  {t("createShipmentPage.clickPricingHint")}
                </p>
              )}

              {selectedQuote && (
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{t("createShipmentPage.additionalCarrierFieldsTitle")}</p>
                    {carrierSchemaLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : carrierSchemaError ? <Badge variant="destructive">{t("createShipmentPage.failedToLoadBadge")}</Badge> : <Badge variant="outline">{t("createShipmentPage.fieldsCountBadge", { count: carrierSchema?.customFields.length ?? 0 })}</Badge>}
                  </div>
                  {carrierSchemaLoading ? <p className="text-xs text-muted-foreground">{t("createShipmentPage.loadingCarrierRequirements")}</p> : carrierSchemaError ? (
                    <p className="rounded-lg bg-destructive/10 p-2 text-xs leading-5 text-destructive">{t("createShipmentPage.carrierCapabilitiesEndpointError")}</p>
                  ) : carrierSchema?.customFields.length ? carrierSchema.customFields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs">{locale === "en" ? field.labelEn || field.labelAr : field.labelAr}{field.required ? " *" : ""}</Label>
                      {field.type === "SELECT" ? (
                        <select value={String(carrierFieldValues[field.key] ?? "")} onChange={(event) => setCarrierFieldValues((current) => ({ ...current, [field.key]: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option value="">{t("createShipmentPage.selectValuePlaceholder")}</option>
                          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      ) : field.type === "BOOLEAN" ? (
                        <label className="flex items-center gap-2 rounded-md border border-input p-2 text-xs"><Checkbox checked={carrierFieldValues[field.key] === true} onCheckedChange={(checked) => setCarrierFieldValues((current) => ({ ...current, [field.key]: checked === true }))} /> {t("common.yes")}</label>
                      ) : (
                        <Input type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"} min={field.min} max={field.max} pattern={field.pattern} required={field.required} placeholder={field.placeholder ?? t("createShipmentPage.enterValuePlaceholder")} value={String(carrierFieldValues[field.key] ?? "")} onChange={(event) => setCarrierFieldValues((current) => ({ ...current, [field.key]: field.type === "NUMBER" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value }))} />
                      )}
                      {field.helpTextAr && <p className="text-[10px] text-muted-foreground">{field.helpTextAr}</p>}
                    </div>
                  )) : <p className="text-xs text-muted-foreground">{t("createShipmentPage.noAdditionalFieldsRequired")}</p>}
                  {invalidCarrierFields.length > 0 && <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{t("createShipmentPage.checkFollowingValuesError", { fields: invalidCarrierFields.map((field) => locale === "en" ? field.labelEn || field.labelAr : field.labelAr).join(", ") })}</p>}
                  {requiredCarrierFieldsMissing && <p className="text-xs text-amber-700">{t("createShipmentPage.completeRequiredFieldsHint")}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full gap-2 h-12 text-base font-semibold"
            onClick={handleCreate}
            disabled={creating || !selectedQuote || !legalAcknowledged || invalidPackages || carrierSchemaLoading || !!carrierSchemaError || requiredCarrierFieldsMissing || invalidCarrierFields.length > 0 || (paymentMode === "COD" && Number(codAmount) <= 0)}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {t("createShipmentPage.createShipmentBtn")}
            <ArrowRight className="h-4 w-4 rtl-flip" />
          </Button>
        </div>
      </div>

      {/* NEW: AWB waybill modal — opens after successful shipment creation */}
      <AwbWaybillModal
        open={awbOpen}
        onOpenChange={(v) => {
          setAwbOpen(v);
          if (!v) {
            if (awbShipment) {
              navigate("shipment-details", { id: awbShipment.id });
            }
          }
        }}
        shipment={awbShipment}
      />
    </div>
  );
}

function WeightSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground" dir="auto">{value}</p>
    </div>
  );
}
