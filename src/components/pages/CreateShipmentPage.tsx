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
  MapPin,
  User,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { useRouterStore } from "@/store/routerStore";
import { useAuth } from "@/hooks/useAuth";
import { shipmentsApi, publicApi } from "@/lib/api/services";
import { usePublicData, useCustomers } from "@/hooks/useData";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader, BackButton } from "@/components/common/PageHeader";
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
import { formatSAR, halToSar } from "@/lib/format";
import type {
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

  // Sender
  const [senderCityId, setSenderCityId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");

  // Receiver
  const [receiverCityId, setReceiverCityId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");

  // Shipment
  const [carrierId, setCarrierId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("PREPAID");
  const [codAmount, setCodAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [packages, setPackages] = useState<ShipmentPackage[]>([
    { weightGrams: 1000, description: "", quantity: 1 },
  ]);

  // Quote state
  const [quoting, setQuoting] = useState(false);
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResult | null>(null);
  const [creating, setCreating] = useState(false);

  const totalWeightGrams = packages.reduce(
    (sum, p) =>
      sum + (Number(p.weightGrams) || 0) * (Number(p.quantity) || 1),
    0
  );
  const totalPieces = packages.reduce(
    (sum, p) => sum + (Number(p.quantity) || 1),
    0
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

  const handleQuote = async () => {
    if (!senderCityId || !receiverCityId) {
      toast.error("الرجاء تحديد مدينتي الإرسال والاستلام");
      return;
    }
    if (packages.length === 0 || totalWeightGrams === 0) {
      toast.error("الرجاء إضافة قطعة واحدة على الأقل بوزن صحيح");
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
          description: p.description ?? "طرد",
          quantity: Number(p.quantity ?? 1),
        })),
      };
      const res = token
        ? await shipmentsApi.quote(token, payload)
        : await publicApi.quote(payload);
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
    if (!receiverName || !receiverPhone) {
      toast.error("الرجاء إكمال بيانات المستلم");
      return;
    }
    if (!senderName || !senderPhone) {
      toast.error("الرجاء إكمال بيانات المرسل");
      return;
    }
    setCreating(true);
    try {
      const senderCity = cities.find((c) => c.id === senderCityId);
      const receiverCity = cities.find((c) => c.id === receiverCityId);
      const payload = {
        originCityId: senderCityId,
        destCityId: receiverCityId,
        senderName,
        senderPhone,
        senderCity: senderCity?.nameAr ?? "",
        senderCityId,
        senderAddress,
        receiverName,
        receiverPhone,
        receiverCity: receiverCity?.nameAr ?? "",
        receiverCityId,
        receiverAddress,
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
        packages: packages.map((p) => ({
          weightGrams: Number(p.weightGrams ?? 0),
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
      toast.success("تم إنشاء الشحنة بنجاح");
      navigate("shipment-details", { id: shipment.id });
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          {/* SENDER */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                بيانات المرسل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Input
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    placeholder="الحي، الشارع"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RECEIVER */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                بيانات المستلم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Input
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder="الحي، الشارع"
                  />
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
                  className="relative grid grid-cols-12 gap-2 items-end rounded-lg border border-border p-3 bg-muted/20"
                >
                  <div className="col-span-6 sm:col-span-3 space-y-1">
                    <Label className="text-xs">الوزن (غرام) *</Label>
                    <Input
                      type="number"
                      min="100"
                      step="100"
                      value={p.weightGrams ?? ""}
                      onChange={(e) =>
                        updatePackage(i, {
                          weightGrams: Number(e.target.value),
                        })
                      }
                      dir="ltr"
                      placeholder="1000"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2 space-y-1">
                    <Label className="text-xs">الكمية</Label>
                    <Input
                      type="number"
                      min="1"
                      value={p.quantity ?? 1}
                      onChange={(e) =>
                        updatePackage(i, { quantity: Number(e.target.value) })
                      }
                      dir="ltr"
                    />
                  </div>
                  <div className="col-span-10 sm:col-span-6 space-y-1">
                    <Label className="text-xs">وصف القطعة *</Label>
                    <Input
                      value={p.description ?? ""}
                      onChange={(e) =>
                        updatePackage(i, { description: e.target.value })
                      }
                      placeholder="مثال: ملابس، كتب، إلكترونيات"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
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
                </div>
              ))}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">الإجمالي:</span>
                <div className="flex items-center gap-4 font-medium">
                  <span>{totalPieces} قطعة</span>
                  <span dir="ltr">{totalWeightGrams} غرام</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PAYMENT */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">طريقة الدفع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  اضغط على زر التسعير لعرض عروض الأسعار المتاحة.
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full gap-2 h-12 text-base font-semibold"
            onClick={handleCreate}
            disabled={creating || !selectedQuote}
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
    </div>
  );
}
