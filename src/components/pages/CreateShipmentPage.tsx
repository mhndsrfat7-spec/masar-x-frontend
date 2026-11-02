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
    toast.success(`تم إدراج بيانات ${target === "sender" ? "المرسل" : "المستلم"} من الرمز المختصر`);
  }, [consumePrefill, cities]);

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
      setCarrierSchemaError("تعذّر تحديد رمز شركة الشحن للتحقق من متطلباتها. حدّث الأسعار أو اختر ناقلًا آخر.");
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
        setCarrierSchemaError(error instanceof ApiClientError ? error.message : "تعذّر تحميل الحقول الخاصة بالناقل");
      })
      .finally(() => { if (active) setCarrierSchemaLoading(false); });
    return () => { active = false; };
  }, [selectedCarrierCode]);

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
  // The client specification uses cm and a volumetric divisor of 5000.
  // The backend remains authoritative for the final chargeable weight and price.
  const hasPartialDimensions = packages.some((p) => {
    const rawDimensions = [p.length, p.width, p.height];
    const entered = rawDimensions.some(
      (value) => value !== undefined && value !== null
    );
    if (!entered) return false;
    return rawDimensions.some((value) => {
      const dimension = Number(value);
      return value === undefined || value === null ||
        !Number.isFinite(dimension) || dimension <= 0;
    });
  });
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
    // cm³ / 5000 = kg; multiply by 1000 to store/display grams.
    return sum + Math.ceil((length * width * height * 1000) / 5000) * quantity;
  }, 0);
  const estimatedChargeableWeightGrams = Math.max(
    totalWeightGrams,
    totalVolumetricWeightGrams
  );

  const addPackage = () =>
    setPackages((p) => [
      ...p,
      { weightGrams: 1000, description: "", quantity: 1 },
    ]);

  const removePackage = (idx: number) =>
    setPackages((p) => p.filter((_, i) => i !== idx));

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
      // Match city by name
      const city = cities.find(
        (ct) => ct.nameAr === c.city || ct.nameEn === c.city
      );
      if (city) setSenderCityId(city.id);
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
      setPackages([{ weightGrams: Math.round(kg * 1000), description: "طرد", quantity: 1 }]);
    }
    if (params.deliveryScope) setDeliveryScope(params.deliveryScope as "BRANCH" | "DOOR");
  }, [cities]);

  const handleQuote = async () => {
    if (!senderCityId || !receiverCityId) {
      toast.error("الرجاء تحديد مدينتي الإرسال والاستلام");
      return;
    }
    if (packages.length === 0 || invalidPackages) {
      toast.error("تحقق من وزن كل قطعة (100 غرام على الأقل)، والكمية الصحيحة، ووصف المحتويات");
      return;
    }
    if (hasPartialDimensions) {
      toast.error("أكمل الطول والعرض والارتفاع لكل قطعة أو اترك الأبعاد فارغة بالكامل");
      return;
    }
    if (paymentMode === "COD" && (!Number.isFinite(Number(codAmount)) || Number(codAmount) <= 0)) {
      toast.error("أدخل مبلغ تحصيل COD أكبر من صفر");
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
          description: p.description ?? "طرد",
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
        toast.success(`تم العثور على ${arr.length} عرض سعر`);
      } else {
        toast.info("لا توجد عروض أسعار متاحة لهذا المسار");
      }
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "تعذّر حساب التسعير"
      );
    } finally {
      setQuoting(false);
    }
  };

  const handleCreate = async () => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول أولاً");
      return;
    }
    // Restricted-browsing gate: block shipment creation until profile is complete.
    if (isProfileRestricted) {
      toast.warning("حسابك في وضع التصفح المقيّد — أكمل بيانات ملفك الشخصي أولاً لتفعيل إنشاء الشحنات");
      return;
    }
    if (!receiverName || !receiverPhone) {
      toast.error("الرجاء إكمال بيانات المستلم");
      return;
    }
    if (!senderName || !senderPhone) {
      toast.error("الرجاء إكمال بيانات المرسل");
      return;
    }
    if (!selectedQuote) {
      toast.error("احسب الأسعار واختر عرضاً قبل إنشاء الشحنة");
      return;
    }
    if (invalidPackages) {
      toast.error("تحقق من وزن كل قطعة وكميتها ووصفها قبل إنشاء الشحنة");
      return;
    }
    if (paymentMode === "COD" && (!Number.isFinite(Number(codAmount)) || Number(codAmount) <= 0)) {
      toast.error("أدخل مبلغ تحصيل COD أكبر من صفر");
      return;
    }
    if (!legalAcknowledged) {
      toast.error("يجب الإقرار بصحة بيانات الشحنة والموافقة على سياسة الوزن الزائد");
      return;
    }
    if (hasPartialDimensions) {
      toast.error("أكمل أبعاد القطع أو اتركها فارغة بالكامل قبل إنشاء الشحنة");
      return;
    }
    if (carrierSchemaLoading || carrierSchemaError) {
      toast.error("تعذّر التحقق من الحقول المطلوبة للناقل. حدّث إعدادات الناقل أو حاول مجددًا قبل الإصدار.");
      return;
    }
    if (requiredCarrierFieldsMissing) {
      toast.error("أكمل جميع الحقول الإلزامية الخاصة بشركة الشحن المحددة");
      return;
    }
    if (invalidCarrierFields.length > 0) {
      toast.error("تحقق من نطاق القيم أو تنسيق الحقول الإضافية الخاصة بالناقل");
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
        // NEW: delivery scope (BRANCH/DOOR) + declared value passed as carrierFields hint
        ...(deliveryScope === "BRANCH" ? { carrierFields: { ...carrierFieldValues, deliveryScope: "BRANCH" } } : {}),
        ...(declaredValue && Number(declaredValue) > 0 ? { declaredValue: Number(declaredValue), declaredValueHal: Math.round(Number(declaredValue) * 100) } : {}),
        packages: packages.map((p) => ({
          weightGrams: Number(p.weightGrams ?? 0),
          ...(Number(p.length ?? 0) > 0 ? { length: Number(p.length) } : {}),
          ...(Number(p.width ?? 0) > 0 ? { width: Number(p.width) } : {}),
          ...(Number(p.height ?? 0) > 0 ? { height: Number(p.height) } : {}),
          description: p.description ?? "طرد",
          quantity: Number(p.quantity ?? 1),
        })),
        weightGrams: totalWeightGrams,
        pieces: totalPieces,
        // Pricing (from selected quote — halalas)
        price: selectedQuote ? halToSar(selectedQuote.totalHal) : undefined,
        totalHal: selectedQuote?.totalHal,
        shippingPriceHal: selectedQuote?.shippingPriceHal,
        vatHal: selectedQuote?.vatHal,
        currency: "SAR",
      };
      const shipment = await shipmentsApi.create(token, payload);
      toast.success("تم إنشاء الشحنة بنجاح — يمكنك معاينة البوليصة وطباعتها");
      // NEW: open AWB waybill modal automatically instead of navigating away
      setAwbShipment(shipment);
      setAwbOpen(true);
      // Invalidate cached lists so the new shipment appears in dashboard
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
        e instanceof ApiClientError ? e.message : "تعذّر إنشاء الشحنة"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={() => navigate("shipments")} />
      <PageHeader
        title="إنشاء شحنة جديدة"
        description="أدخل بيانات الشحنة واحصل على تسعير فوري من كافة الناقلين."
      />

      {/* Restricted-browsing guidance card */}
      <ProfileRestrictionAlert />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          {/* SENDER */}
          <Card className={cn("transition-all", senderFlash && "ring-2 ring-emerald-500/50 border-emerald-400")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                بيانات المرسل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NEW: SPL short-code lookup */}
              <QuickCodeLookup
                token={token}
                target="sender"
                onResolved={handleSenderLookup}
              />
              {contacts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    اختيار سريع من دفتر العناوين
                  </Label>
                  <Select onValueChange={fillSender}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مرسلاً محفوظاً" />
                    </SelectTrigger>
                    <SelectContent>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المرسل *</Label>
                  <Input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="مثال: متجر الأمل"
                  />
                </div>
                <div className="space-y-2">
                  <Label>جوال المرسل *</Label>
                  <Input
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>مدينة الإرسال *</Label>
                  <Select
                    value={senderCityId}
                    onValueChange={setSenderCityId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nameAr} — {c.regionAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>عنوان المرسل</Label>
                  <Input value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} placeholder="الحي، الشارع" />
                  {senderAddressCode && <p className="text-[11px] text-emerald-700">تم الجلب بالرمز: <span dir="ltr" className="font-mono">{senderAddressCode}</span></p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RECEIVER */}
          <Card className={cn("transition-all", receiverFlash && "ring-2 ring-emerald-500/50 border-emerald-400")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                بيانات المستلم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NEW: SPL short-code lookup */}
              <QuickCodeLookup
                token={token}
                target="receiver"
                onResolved={handleReceiverLookup}
              />
              {contacts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    اختيار سريع من دفتر العناوين
                  </Label>
                  <Select onValueChange={fillReceiver}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستلماً محفوظاً" />
                    </SelectTrigger>
                    <SelectContent>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المستلم *</Label>
                  <Input
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="مثال: شركة النور"
                  />
                </div>
                <div className="space-y-2">
                  <Label>جوال المستلم *</Label>
                  <Input
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>مدينة الاستلام *</Label>
                  <Select
                    value={receiverCityId}
                    onValueChange={setReceiverCityId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nameAr} — {c.regionAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>عنوان المستلم</Label>
                  <Input value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} placeholder="الحي، الشارع" />
                  {receiverAddressCode && <p className="text-[11px] text-emerald-700">تم الجلب بالرمز: <span dir="ltr" className="font-mono">{receiverAddressCode}</span></p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PACKAGES */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">القطع</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={addPackage}
              >
                <Plus className="h-4 w-4" />
                إضافة قطعة
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {packages.map((p, i) => (
                <div
                  key={i}
                  className="relative grid grid-cols-1 sm:grid-cols-12 gap-2 items-end rounded-lg border border-border p-3 bg-muted/20"
                >
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">الوزن (كجم) *</Label>
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
                    <Label className="text-xs">الكمية</Label>
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
                    <Label className="text-xs">وصف القطعة *</Label>
                    <Input
                      value={p.description ?? ""}
                      onChange={(e) =>
                        updatePackage(i, { description: e.target.value })
                      }
                      placeholder="مثال: ملابس، كتب، إلكترونيات"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePackage(i)}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="حذف القطعة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs">الطول (سم)</Label>
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
                      placeholder="اختياري"
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs">العرض (سم)</Label>
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
                      placeholder="اختياري"
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs">الارتفاع (سم)</Label>
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
                      placeholder="اختياري"
                    />
                  </div>
                </div>
              ))}
              {hasPartialDimensions && (
                <p className="text-xs text-destructive" role="alert">
                  يجب إدخال الطول والعرض والارتفاع معاً لكل قطعة تريد احتساب وزنها الحجمي.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-muted/40 p-3 text-sm">
                <WeightSummary label="عدد القطع" value={`${totalPieces} قطعة`} />
                <WeightSummary label="الوزن الفعلي" value={`${(totalWeightGrams / 1000).toFixed(2)} كجم`} />
                <WeightSummary label="الوزن الحجمي التقديري" value={`${(totalVolumetricWeightGrams / 1000).toFixed(2)} كجم`} />
                <WeightSummary label="الوزن الأعلى التقديري" value={`${(estimatedChargeableWeightGrams / 1000).toFixed(2)} كجم`} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                الوزن الحجمي التقديري = الطول × العرض × الارتفاع ÷ 5000 (الأبعاد بالسم). الوزن النهائي المعتمد والسعر يصدران من تسعير الناقل عبر الخادم، وقد تختلف قاعدة الوزن حسب شركة الشحن.
              </p>
            </CardContent>
          </Card>

          {/* PAYMENT + DELIVERY SCOPE + DECLARED VALUE */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">طريقة الدفع والتسليم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NEW: delivery scope (BRANCH vs DOOR) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">نطاق التوصيل</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryScope("BRANCH")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 p-3 text-right transition-all",
                      deliveryScope === "BRANCH"
                        ? "border-emerald-400 bg-emerald-50/50"
                        : "border-border hover:border-emerald-200"
                    )}
                  >
                    <Store className={cn("h-5 w-5", deliveryScope === "BRANCH" ? "text-emerald-600" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-semibold">استلام وتسليم من الفرع</p>
                      <p className="text-[10px] text-muted-foreground">رسوم أقل — وفّر 5 ر.س</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryScope("DOOR")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 p-3 text-right transition-all",
                      deliveryScope === "DOOR"
                        ? "border-emerald-400 bg-emerald-50/50"
                        : "border-border hover:border-emerald-200"
                    )}
                  >
                    <Truck className={cn("h-5 w-5", deliveryScope === "DOOR" ? "text-emerald-600" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-semibold">توصيل لباب المنزل</p>
                      <p className="text-[10px] text-muted-foreground">توصيل كامل من الباب للباب</p>
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
                    <p className="text-sm font-semibold">مدفوع مسبقاً</p>
                    <p className="text-[11px] text-muted-foreground">
                      يُخصم من المحفظة عند التأكيد
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
                    <p className="text-sm font-semibold">الدفع عند الاستلام</p>
                    <p className="text-[11px] text-muted-foreground">
                      يجمعه المندوب من المستلم
                    </p>
                  </div>
                </label>
              </RadioGroup>
              {paymentMode === "COD" && (
                <div className="space-y-2">
                  <Label>مبلغ التحصيل (ر.س)</Label>
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
                  القيمة التقديرية للبضاعة (ر.س) — اختياري
                </Label>
                <Input
                  id="declared-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  placeholder="مثال: 500"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground">
                  تُستخدم لحساب التأمين على البضاعة في حال تطلب الناقل ذلك.
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
                  أقر بصحة بيانات الشحنة والأوزان والأبعاد، وأنها لا تحتوي على مواد محظورة، وأوافق على مراجعة أي فرق وزن يثبته الناقل وفق سياسة المنصة.
                </label>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات إضافية (اختياري)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي تعليمات خاصة بالشحنة"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: quote + actions */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                التسعير
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
                احصل على عروض الأسعار
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
                        className={`w-full text-right rounded-xl border-2 p-3 transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {q.carrierNameAr ?? q.carrierName ?? "ناقل"}
                          </span>
                          <span
                            className="text-base font-bold text-primary"
                            dir="ltr"
                          >
                            {q.totalHal
                              ? formatSAR(halToSar(q.totalHal))
                              : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-muted-foreground">
                            {q.serviceCode ?? "خدمة قياسية"}
                          </span>
                          {q.etaTextAr && (
                            <span className="text-[11px] text-muted-foreground">
                              {q.etaTextAr}
                            </span>
                          )}
                        </div>
                        {(q.weightBreakdown?.chargeableGrams ?? q.chargeableGrams) != null && (
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            الوزن المعتمد لدى التسعير: {(
                              Number(q.weightBreakdown?.chargeableGrams ?? q.chargeableGrams) / 1000
                            ).toFixed(2)} كجم
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  اضغط على زر التسعير لعرض عروض الأسعار المتاحة.
                </p>
              )}

              {selectedQuote && (
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">حقول الناقل الإضافية</p>
                    {carrierSchemaLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : carrierSchemaError ? <Badge variant="destructive">تعذر التحميل</Badge> : <Badge variant="outline">{carrierSchema?.customFields.length ?? 0} حقل</Badge>}
                  </div>
                  {carrierSchemaLoading ? <p className="text-xs text-muted-foreground">جارٍ تحميل متطلبات الناقل…</p> : carrierSchemaError ? (
                    <p className="rounded-lg bg-destructive/10 p-2 text-xs leading-5 text-destructive">لم يتم التحقق من الحقول الديناميكية. يجب أن يوفر الخادم GET /api/v1/public/carriers/{"{code}"}/capabilities قبل إصدار هذا الناقل.</p>
                  ) : carrierSchema?.customFields.length ? carrierSchema.customFields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs">{field.labelAr}{field.required ? " *" : ""}</Label>
                      {field.type === "SELECT" ? (
                        <select value={String(carrierFieldValues[field.key] ?? "")} onChange={(event) => setCarrierFieldValues((current) => ({ ...current, [field.key]: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option value="">اختر قيمة</option>
                          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      ) : field.type === "BOOLEAN" ? (
                        <label className="flex items-center gap-2 rounded-md border border-input p-2 text-xs"><Checkbox checked={carrierFieldValues[field.key] === true} onCheckedChange={(checked) => setCarrierFieldValues((current) => ({ ...current, [field.key]: checked === true }))} /> نعم</label>
                      ) : (
                        <Input type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"} min={field.min} max={field.max} pattern={field.pattern} required={field.required} placeholder={field.placeholder ?? "أدخل القيمة"} value={String(carrierFieldValues[field.key] ?? "")} onChange={(event) => setCarrierFieldValues((current) => ({ ...current, [field.key]: field.type === "NUMBER" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value }))} />
                      )}
                      {field.helpTextAr && <p className="text-[10px] text-muted-foreground">{field.helpTextAr}</p>}
                    </div>
                  )) : <p className="text-xs text-muted-foreground">لا توجد حقول إضافية مطلوبة لهذا الناقل.</p>}
                  {invalidCarrierFields.length > 0 && <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">تحقق من القيم التالية: {invalidCarrierFields.map((field) => field.labelAr).join("، ")}</p>}
                  {requiredCarrierFieldsMissing && <p className="text-xs text-amber-700">أكمل الحقول الإلزامية قبل إصدار البوليصة.</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full gap-2 h-12 text-base font-semibold"
            onClick={handleCreate}
            disabled={creating || !selectedQuote || !legalAcknowledged || hasPartialDimensions || invalidPackages || carrierSchemaLoading || !!carrierSchemaError || requiredCarrierFieldsMissing || invalidCarrierFields.length > 0 || (paymentMode === "COD" && Number(codAmount) <= 0)}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            إنشاء الشحنة
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
            // When closed, navigate to shipment details
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
