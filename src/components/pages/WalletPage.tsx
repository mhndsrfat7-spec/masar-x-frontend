"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Banknote,
  Loader2,
  CreditCard,
  Info,
  Wallet as WalletIcon,
  TrendingUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { walletApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  formatSAR,
  timeAgo,
  formatDateTime,
  halToSar,
} from "@/lib/format";

export function WalletPage() {
  const { token } = useAuth();
  const { wallet, transactions, loading, error, reload } = useWallet(token);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"card" | "bank_transfer">("card");
  const [busy, setBusy] = useState(false);

  const balance = wallet?.balanceHal
    ? halToSar(wallet.balanceHal)
    : (wallet?.balance ?? 0);
  const pending = wallet?.pendingHal
    ? halToSar(wallet.pendingHal)
    : (wallet?.pending ?? 0);
  const codPending = wallet?.codPendingHal
    ? halToSar(wallet.codPendingHal)
    : (wallet?.codPending ?? 0);
  const codCollected = wallet?.codCollectedHal
    ? halToSar(wallet.codCollectedHal)
    : (wallet?.codCollected ?? 0);

  const handleTopup = async () => {
    if (!token) return;
    const value = Number(amount);
    if (!value || value < 1) {
      toast.error("الرجاء إدخال مبلغ صحيح");
      return;
    }
    setBusy(true);
    try {
      if (method === "card") {
        const res = await walletApi.topup(token, {
          amount: value,
          amountHal: Math.round(value * 100),
          currency: "SAR",
          paymentMethod: "card",
        });
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          toast.success("تم إنشاء طلب الشحن");
          setOpen(false);
          setAmount("");
          reload();
        }
      } else {
        await walletApi.topupBankTransfer(token, {
          amount: value,
          amountHal: Math.round(value * 100),
          currency: "SAR",
          paymentMethod: "bank_transfer",
        });
        toast.success("تم تسجيل طلب الحوالة البنكية");
        setOpen(false);
        setAmount("");
        reload();
      }
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "تعذّر إتمام عملية الشحن"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="المحفظة الرقمية"
        description="إدارة رصيدك ومعاملاتك المالية."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                شحن المحفظة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>شحن المحفظة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>المبلغ (ر.س)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    dir="ltr"
                  />
                  <div className="flex gap-2 flex-wrap pt-1">
                    {[50, 100, 250, 500, 1000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmount(String(v))}
                        className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:border-primary/40 hover:bg-primary/5"
                      >
                        {v} ر.س
                      </button>
                    ))}
                  </div>
                </div>
                <RadioGroup
                  value={method}
                  onValueChange={(v) =>
                    setMethod(v as "card" | "bank_transfer")
                  }
                  className="space-y-2"
                >
                  <label
                    htmlFor="card"
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                      method === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <RadioGroupItem value="card" id="card" />
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">بطاقة مدى / فيزا</p>
                      <p className="text-[11px] text-muted-foreground">
                        شحن فوري عبر بوابة Moyasar
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="bank"
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                      method === "bank_transfer"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <RadioGroupItem value="bank_transfer" id="bank" />
                    <Banknote className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">حوالة بنكية</p>
                      <p className="text-[11px] text-muted-foreground">
                        تُعتمد خلال 24 ساعة
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleTopup}
                  disabled={busy}
                  className="gap-2"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  تأكيد الشحن
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Balance + stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 overflow-hidden bg-brand-gradient text-white border-0 shadow-brand-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/80">الرصيد المتاح</p>
              <Badge className="bg-white/15 text-white border-white/20">
                SAR
              </Badge>
            </div>
            <p className="text-4xl font-extrabold tracking-tight" dir="ltr">
              {formatSAR(balance, { withSymbol: false })}
              <span className="text-base font-medium text-white/70 mr-1">
                {" "}
                ر.س
              </span>
            </p>
            <p className="text-xs text-white/70 mt-2">
              الحساب {wallet?.negativeBalance ? "مدين" : "نشط"} • آخر تحديث:
              الآن
            </p>
          </CardContent>
        </Card>

        <StatBox
          label="قيد التعليق"
          value={formatSAR(pending, { withSymbol: false })}
          icon={<Clock className="h-4 w-4" />}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatBox
          label="COD محصّل"
          value={formatSAR(codCollected, { withSymbol: false })}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-green-700"
          bg="bg-green-50"
        />
      </div>

      {/* COD info banner */}
      {codPending > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              لديك مبالغ COD قيد التحصيل بقيمة {formatSAR(codPending)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              سيتم إضافتها إلى رصيدك تلقائياً بعد تسليم الشحنات المعنية.
            </p>
          </div>
        </div>
      )}

      {/* Transactions */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">
              سجل المعاملات
            </h2>
          </div>
          {loading ? (
            <LoadingState message="جارٍ تحميل المعاملات…" className="py-12" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="py-12" />
          ) : transactions.length === 0 ? (
            <EmptyState
              title="لا توجد معاملات"
              description="ستظهر جميع معاملاتك المالية هنا."
              icon={Banknote}
              className="py-12"
            />
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((t) => {
                const dir = (t.direction ?? "").toUpperCase();
                const isIn =
                  dir === "IN" || dir === "CREDIT" || t.direction === "in";
                const amount = t.amountHal
                  ? halToSar(t.amountHal)
                  : (t.amount ?? 0);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/30"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isIn
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {isIn ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {t.description ??
                          t.descriptionAr ??
                          labelForType(t.type)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateTime(t.createdAt)}
                        {t.reference ? ` • ${t.reference}` : ""}
                        {t.status ? ` • ${t.status}` : ""}
                      </p>
                    </div>
                    <div className="text-end">
                      <p
                        className={`text-sm font-bold ${
                          isIn ? "text-green-700" : "text-red-700"
                        }`}
                        dir="ltr"
                      >
                        {isIn ? "+" : "−"}
                        {formatSAR(amount, { withSymbol: false })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.balanceAfterHal
                          ? `رصيد: ${formatSAR(halToSar(t.balanceAfterHal), { withSymbol: false })}`
                          : t.balanceAfter
                          ? `رصيد: ${formatSAR(t.balanceAfter, { withSymbol: false })}`
                          : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color} mb-3`}
        >
          {icon}
        </div>
        <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold text-foreground" dir="ltr">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function labelForType(type?: string): string {
  if (!type) return "معاملة";
  const t = type.toLowerCase();
  switch (t) {
    case "topup":
      return "شحن المحفظة";
    case "shipment":
      return "دفع شحنة";
    case "refund":
      return "استرداد";
    case "cod":
      return "تحصيل COD";
    case "fee":
      return "رسوم";
    case "adjustment":
      return "تسوية";
    default:
      return "معاملة";
  }
}
