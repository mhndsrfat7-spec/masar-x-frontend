"use client";

import { useMemo, useState, useEffect } from "react";
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
  Download,
  Apple,
  Smartphone,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  ArrowDownToLine,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { usePagination } from "@/hooks/useDebounce";
import { walletApi, bankAccountsApi, type SavedBankAccount } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import { SavedBankAccounts } from "@/components/common/SavedBankAccounts";
import { PasswordConfirmModal } from "@/components/common/PasswordConfirmModal";
import {
  ProfileRestrictionAlert,
  useIsProfileRestricted,
} from "@/components/common/ProfileRestrictionAlert";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatSAR,
  timeAgo,
  formatDateTime,
  halToSar,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WalletTransaction } from "@/types/api";

export function WalletPage() {
  const { token } = useAuth();
  const { wallet, transactions, loading, error, reload } = useWallet(token);
  const isProfileRestricted = useIsProfileRestricted();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"card" | "bank_transfer">("card");
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // NEW: card payment method (Apple Pay, Mada/Visa, STC Pay, PayPal)
  const [cardMethod, setCardMethod] = useState<"apple_pay" | "card" | "stc_pay" | "paypal">("card");
  // NEW: bank transfer — selected saved account + reference + receipt
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");
  const [bankAccounts, setBankAccounts] = useState<SavedBankAccount[]>([]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [copiedIban, setCopiedIban] = useState(false);

  // NEW: withdraw modal state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankAccountId, setWithdrawBankAccountId] = useState("");
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<"withdraw" | "topup-bank" | null>(null);

  // Load saved bank accounts for the topup/withdraw dropdowns
  useEffect(() => {
    if (!token) return;
    bankAccountsApi.list(token).then(setBankAccounts).catch(() => {});
  }, [token]);

  const companyBankInfo = {
    bankName: "مصرف الراجحي",
    accountName: "شركة مسار إكس للخدمات اللوجستية",
    iban: "SA0080000000000000000000",
    swiftCode: "RJHISARI",
  };

  const handleCopyIban = async () => {
    try {
      await navigator.clipboard.writeText(companyBankInfo.iban);
      setCopiedIban(true);
      toast.success("تم نسخ رقم الآيبان");
      setTimeout(() => setCopiedIban(false), 2000);
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

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

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const month = today.slice(0, 7);

    return transactions.filter((transaction) => {
      const createdAt = transaction.createdAt ? new Date(transaction.createdAt) : null;
      const validDate = createdAt && !Number.isNaN(createdAt.getTime());
      const transactionDate = validDate
        ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(createdAt.getDate()).padStart(2, "0")}`
        : "";
      const typeText = `${transaction.type ?? ""} ${transaction.description ?? ""} ${transaction.descriptionAr ?? ""}`.toLowerCase();

      if (period === "today" && transactionDate !== today) return false;
      if (period === "month" && !transactionDate.startsWith(month)) return false;
      if (period === "cod" && !/(cod|الدفع عند الاستلام|تحصيل عند الاستلام)/i.test(typeText)) return false;
      if (period === "custom") {
        if (!validDate) return false;
        if (dateFrom && transactionDate < dateFrom) return false;
        if (dateTo && transactionDate > dateTo) return false;
      }
      return true;
    });
  }, [transactions, period, dateFrom, dateTo]);

  // NEW: paginate the filtered transactions list (20 per page) like ShipmentsPage.
  const {
    paginated: paginatedTransactions,
    page: txPage,
    totalPages: txTotalPages,
    hasNext: txHasNext,
    hasPrev: txHasPrev,
    nextPage: txNextPage,
    prevPage: txPrevPage,
  } = usePagination(filteredTransactions, 20);

  const handleTopup = async () => {
    if (!token) return;
    if (isProfileRestricted) {
      toast.warning("حسابك في وضع التصفح المقيّد — أكمل بيانات ملفك الشخصي أولاً لإجراء عمليات الشحن");
      return;
    }
    const value = Number(amount);
    if (!value || value < 1) {
      toast.error("الرجاء إدخال مبلغ صحيح");
      return;
    }
    // Bank transfers require password confirmation before submission,
    // because they move real funds from the customer's bank to Masar X.
    if (method === "bank_transfer") {
      if (bankAccounts.length === 0) {
        toast.error("أضف حساباً بنكياً محفوظاً من بطاقة الحسابات البنكية بالأسفل أولاً");
        return;
      }
      if (!selectedBankAccountId) {
        toast.error("اختر الحساب البنكي المحفوظ الذي ستحوّل منه");
        return;
      }
      if (!referenceNumber.trim()) {
        toast.error("أدخل الرقم المرجعي للحوالة البنكية");
        return;
      }
      setPasswordAction("topup-bank");
      setPasswordModalOpen(true);
      return;
    }
    setBusy(true);
    try {
      const res = await walletApi.topup(token, {
        amount: value,
        amountHal: Math.round(value * 100),
        currency: "SAR",
        paymentMethod: cardMethod === "apple_pay" ? "apple_pay" : cardMethod === "stc_pay" ? "stc_pay" : "card",
      });
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        toast.success(`تم إنشاء طلب الشحن عبر ${cardMethod === "apple_pay" ? "Apple Pay" : cardMethod === "stc_pay" ? "STC Pay" : "بطاقة مدى/فيزا"}`);
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

  /** Runs after the password modal confirms a bank-transfer topup. */
  const confirmTopupBank = async () => {
    if (!token) return;
    const value = Number(amount);
    if (!value || value < 1) return;
    setBusy(true);
    try {
      await walletApi.topupBankTransfer(token, {
        amount: value,
        amountHal: Math.round(value * 100),
        currency: "SAR",
        paymentMethod: "bank_transfer",
      });
      toast.success("تم تسجيل طلب الحوالة البنكية — سيُعتمد خلال 24 ساعة عمل");
      toast.info("للتسريع، أرسل إيصال الحوالة عبر واتساب للمالية: wa.me/9665XXXXXXXX");
      setOpen(false);
      setAmount("");
      setReferenceNumber("");
      setSelectedBankAccountId("");
      setPasswordAction(null);
      reload();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "تعذّر تسجيل طلب الحوالة"
      );
    } finally {
      setBusy(false);
    }
  };

  /** Open the withdraw dialog (button is always visible on the balance card). */
  const openWithdraw = () => {
    if (isProfileRestricted) {
      toast.warning("حسابك في وضع التصفح المقيّد — أكمل بيانات ملفك الشخصي أولاً لإجراء عمليات السحب");
      return;
    }
    if (balance <= 0) {
      toast.error("لا يوجد رصيد متاح للسحب");
      return;
    }
    setWithdrawAmount("");
    setWithdrawBankAccountId(bankAccounts.find((a) => a.isDefault)?.id ?? "");
    setWithdrawOpen(true);
  };

  /** Runs after the password modal confirms a withdrawal. */
  const confirmWithdraw = async () => {
    if (!token) return;
    const value = Number(withdrawAmount);
    if (!value || value < 1) {
      toast.error("أدخل مبلغ سحب صحيح");
      return;
    }
    if (value > balance) {
      toast.error("المبلغ يتجاوز الرصيد المتاح");
      return;
    }
    if (!withdrawBankAccountId) {
      toast.error("اختر الحساب البنكي الذي تريد السحب إليه");
      return;
    }
    setWithdrawBusy(true);
    try {
      await walletApi.withdraw(token, {
        amount: value,
        amountHal: Math.round(value * 100),
        bankAccountId: withdrawBankAccountId,
      });
      toast.success("تم تنفيذ طلب السحب — سيصل إلى حسابك خلال 1-2 يوم عمل");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setPasswordAction(null);
      reload();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "تعذّر تنفيذ طلب السحب"
      );
    } finally {
      setWithdrawBusy(false);
    }
  };

  /** Dispatch the confirmed action based on which flow triggered the password modal. */
  const handlePasswordConfirmed = async () => {
    if (passwordAction === "withdraw") {
      await confirmWithdraw();
    } else if (passwordAction === "topup-bank") {
      await confirmTopupBank();
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

                {/* NEW: card sub-method selection (Mada/Visa, Apple Pay, STC Pay, PayPal) */}
                {method === "card" && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "card", label: "بطاقة مدى / فيزا", icon: CreditCard },
                      { id: "apple_pay", label: "Apple Pay", icon: Apple },
                      { id: "stc_pay", label: "STC Pay", icon: Smartphone },
                      { id: "paypal", label: "PayPal", icon: ShieldCheck },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = cardMethod === (opt.id as typeof cardMethod);
                      const isComingSoon = opt.id === "paypal";
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isComingSoon}
                          onClick={() => !isComingSoon && setCardMethod(opt.id as typeof cardMethod)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all",
                            active
                              ? "border-primary bg-primary/5 text-primary"
                              : isComingSoon
                                ? "border-dashed border-border text-muted-foreground/60 cursor-not-allowed"
                                : "border-border text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {opt.label}
                          {isComingSoon && (
                            <span className="text-[9px] text-amber-600 mr-auto">قريباً</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* NEW: bank transfer details — company account + customer saved account + reference */}
                {method === "bank_transfer" && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-xs font-semibold text-foreground">حوّل إلى حساب شركة مسار إكس:</p>
                    <div className="rounded-lg bg-card border border-border p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">المصرف</span>
                        <span className="font-medium text-foreground">{companyBankInfo.bankName}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">اسم المستفيد</span>
                        <span className="font-medium text-foreground">{companyBankInfo.accountName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">الآيبان</span>
                        <button
                          type="button"
                          onClick={handleCopyIban}
                          className="flex items-center gap-1 font-mono text-primary hover:underline"
                          dir="ltr"
                        >
                          {companyBankInfo.iban}
                          {copiedIban ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">SWIFT</span>
                        <span className="font-mono text-foreground" dir="ltr">{companyBankInfo.swiftCode}</span>
                      </div>
                    </div>

                    {bankAccounts.length === 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        لا يوجد حساب بنكي محفوظ لديك. أضف حساباً من بطاقة «الحسابات البنكية المحفوظة» بالأسفل لتسريع الحوالات.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-xs">اختر حسابك المصدر للحوالة</Label>
                        <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="اختر الحساب المحفوظ" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.bankName} ••{a.iban.slice(-4)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="bank-ref" className="text-xs">الرقم المرجعي للحوالة *</Label>
                      <Input
                        id="bank-ref"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="مثال: TR-123456789"
                        dir="ltr"
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        سيُطلب تأكيد كلمة المرور قبل تسجيل الحوالة لأمان العملية.
                      </p>
                    </div>
                  </div>
                )}
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

      {/* Restricted-browsing guidance card */}
      <ProfileRestrictionAlert />

      {/* Balance + stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 overflow-hidden bg-brand-gradient text-white border-0 shadow-brand-lg relative">
          {/* Decorative dotted map */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none" aria-hidden>
            <svg viewBox="0 0 400 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="wallet-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="400" height="200" fill="url(#wallet-grid)" />
              <g fill="none" stroke="#A3D9A5" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.6">
                <path d="M40 100 Q150 40 280 90 T380 130" />
              </g>
              <g fill="#A3D9A5" opacity="0.8">
                <circle cx="40" cy="100" r="4" />
                <circle cx="280" cy="90" r="4" />
                <circle cx="380" cy="130" r="4" />
              </g>
            </svg>
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <WalletIcon className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-white/80 font-medium">الرصيد المتاح</p>
              </div>
              <Badge className="bg-white/15 text-white border-white/20">
                SAR
              </Badge>
            </div>
            <p className="text-4xl font-extrabold tracking-tight" dir="ltr">
              {formatSAR(balance, { withSymbol: false })}
              <span className="text-base font-medium text-white/70 ms-1">
                ر.س
              </span>
            </p>
            <p className="text-xs text-white/70 mt-2">
              الحساب {wallet?.negativeBalance ? "مدين" : "نشط"} • آخر تحديث: الآن
            </p>
            {/* NEW: withdraw button — always visible when there is an available balance */}
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 gap-1.5 bg-white text-primary hover:bg-white/90"
              onClick={openWithdraw}
              disabled={balance <= 0}
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              سحب الرصيد
            </Button>
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
          color="text-emerald-600"
          bg="bg-emerald-50"
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

      {/* NEW: Saved bank accounts management */}
      <Card>
        <CardContent className="p-4">
          <SavedBankAccounts token={token} />
        </CardContent>
      </Card>

      {/* NEW: Monthly summary cards — show totals for the filtered period */}
      <SummaryCards transactions={filteredTransactions} />

      {/* Transactions */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">سجل المعاملات</h2>
                <p className="text-xs text-muted-foreground mt-1">تصفية السجل حسب الفترة أو حركات الدفع عند الاستلام.</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="sm:w-56">
                    <SelectValue placeholder="كل الفترات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفترات</SelectItem>
                    <SelectItem value="today">عمليات اليوم</SelectItem>
                    <SelectItem value="month">الشهر الحالي</SelectItem>
                    <SelectItem value="cod">عمليات COD</SelectItem>
                    <SelectItem value="custom">فترة مخصصة</SelectItem>
                  </SelectContent>
                </Select>
                {/* NEW: Export/Print button with 31-day limit rule */}
                <PrintReportButton
                  transactions={filteredTransactions}
                  period={period}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                />
              </div>
            </div>
            {period === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="wallet-date-from" className="text-xs">من تاريخ</Label>
                  <Input id="wallet-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wallet-date-to" className="text-xs">إلى تاريخ</Label>
                  <Input id="wallet-date-to" type="date" min={dateFrom || undefined} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          {loading ? (
            <LoadingState message="جارٍ تحميل المعاملات…" className="py-12" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="py-12" />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title={transactions.length === 0 ? "لا توجد معاملات" : "لا توجد معاملات ضمن الفلتر المحدد"}
              description={transactions.length === 0 ? "ستظهر جميع معاملاتك المالية هنا." : "غيّر الفترة أو امسح الفلاتر لعرض بقية السجل."}
              icon={Banknote}
              className="py-12"
            />
          ) : (
            <>
            <ul className="divide-y divide-border">
              {paginatedTransactions.map((t) => {
                const dir = (t.direction ?? "").toUpperCase();
                const isIn =
                  dir === "IN" || dir === "CREDIT" || t.direction === "in";
                const amount = t.amountHal
                  ? halToSar(t.amountHal)
                  : (t.amount ?? 0);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isIn
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
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
                    <div className="text-end shrink-0">
                      <p
                        className={`text-sm font-bold tabular-nums ${
                          isIn ? "text-emerald-600" : "text-red-600"
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
            {/* NEW: pagination controls for the transactions table */}
            {txTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 py-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={txPrevPage}
                  disabled={!txHasPrev}
                  className="gap-1.5"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 rtl-flip rotate-180" />
                  السابق
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  صفحة {txPage} من {txTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={txNextPage}
                  disabled={!txHasNext}
                  className="gap-1.5"
                >
                  التالي
                  <ArrowDownLeft className="h-3.5 w-3.5 rtl-flip rotate-180" />
                </Button>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      {/* NEW: Withdraw dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
              سحب الرصيد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              الرصيد المتاح للسحب:{" "}
              <span className="font-bold" dir="ltr">{formatSAR(balance)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">المبلغ المراد سحبه (ر.س)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min="1"
                max={balance || undefined}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={String(balance || 0)}
                dir="ltr"
              />
            </div>
            {bankAccounts.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  لا يوجد حساب بنكي محفوظ. أضف حساباً من بطاقة «الحسابات البنكية المحفوظة» بالأعلى لاستلام السحب.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="withdraw-account">الحساب البنكي المستلم</Label>
                <Select value={withdrawBankAccountId} onValueChange={setWithdrawBankAccountId}>
                  <SelectTrigger id="withdraw-account">
                    <SelectValue placeholder="اختر الحساب المحفوظ" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.bankName} ••{a.iban.slice(-4)}
                        {a.isDefault ? " (افتراضي)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              سيُطلب تأكيد كلمة المرور قبل تنفيذ طلب السحب لأمان العملية.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={withdrawBusy}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (Number(withdrawAmount) > balance) {
                  toast.error("المبلغ يتجاوز الرصيد المتاح");
                  return;
                }
                if (!withdrawBankAccountId) {
                  toast.error("اختر الحساب البنكي المستلم");
                  return;
                }
                setPasswordAction("withdraw");
                setPasswordModalOpen(true);
              }}
              disabled={withdrawBusy || balance <= 0 || bankAccounts.length === 0 || !withdrawAmount}
              className="gap-2"
            >
              {withdrawBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              تأكيد طلب السحب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW: password confirmation gate for withdrawals and bank-transfer topups */}
      <PasswordConfirmModal
        open={passwordModalOpen}
        onOpenChange={(o) => {
          setPasswordModalOpen(o);
          if (!o) setPasswordAction(null);
        }}
        token={token}
        actionDescription={
          passwordAction === "withdraw"
            ? "تأكيد طلب سحب الرصيد إلى حسابك البنكي المحفوظ."
            : passwordAction === "topup-bank"
              ? "تأكيد طلب شحن المحفظة عبر حوالة بنكية."
              : "تأكيد العملية المالية."
        }
        onConfirmed={handlePasswordConfirmed}
      />
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

/* ============================================================================
 * NEW: SummaryCards — monthly/daily financial summary for the filtered period.
 * Shows: total topups, total shipping spend, pending COD, weight surcharges.
 * ==========================================================================*/
function SummaryCards({ transactions }: { transactions: WalletTransaction[] }) {
  const totalTopups = transactions
    .filter((t) => (t.type ?? "").toLowerCase() === "topup" && (t.direction ?? "").toUpperCase() === "IN")
    .reduce((sum, t) => sum + (t.amountHal ? halToSar(t.amountHal) : t.amount ?? 0), 0);
  const topupsCount = transactions.filter(
    (t) => (t.type ?? "").toLowerCase() === "topup" && (t.direction ?? "").toUpperCase() === "IN"
  ).length;

  const totalShipping = transactions
    .filter((t) => (t.type ?? "").toLowerCase() === "shipment" && (t.direction ?? "").toUpperCase() === "OUT")
    .reduce((sum, t) => sum + (t.amountHal ? halToSar(t.amountHal) : t.amount ?? 0), 0);

  const pendingCOD = transactions
    .filter((t) => (t.type ?? "").toLowerCase() === "cod" && (t.direction ?? "").toUpperCase() === "IN")
    .reduce((sum, t) => sum + (t.amountHal ? halToSar(t.amountHal) : t.amount ?? 0), 0);

  const weightSurcharges = transactions
    .filter((t) => (t.type ?? "").toLowerCase() === "fee" || (t.type ?? "").toLowerCase() === "adjustment")
    .reduce((sum, t) => sum + (t.amountHal ? halToSar(t.amountHal) : t.amount ?? 0), 0);

  const cards = [
    {
      label: "إجمالي الحوالات المشحونة",
      value: totalTopups,
      count: topupsCount,
      icon: ArrowDownLeft,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      label: "مصروفات الشحنات",
      value: totalShipping,
      icon: ArrowUpRight,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: "مبالغ COD معلّقة",
      value: pendingCOD,
      icon: Clock,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      label: "خصومات الوزن الزائد",
      value: weightSurcharges,
      icon: TrendingUp,
      bg: "bg-rose-50",
      color: "text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="shadow-card-soft">
            <CardContent className="p-4">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg mb-3", c.bg, c.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-[11px] text-muted-foreground mb-1 truncate">{c.label}</p>
              <p className="text-lg font-bold text-foreground tabular-nums" dir="ltr">
                {formatSAR(c.value, { withSymbol: false })}
                <span className="text-xs font-normal text-muted-foreground ms-1">ر.س</span>
              </p>
              {"count" in c && c.count !== undefined && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.count} عملية</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * NEW: PrintReportButton — exports CSV / prints transactions, but enforces
 * the 31-day rule: if the selected period exceeds 31 days, shows a message
 * directing the user to contact admin for the official financial report.
 * ==========================================================================*/
function PrintReportButton({
  transactions,
  period,
  dateFrom,
  dateTo,
}: {
  transactions: WalletTransaction[];
  period: string;
  dateFrom: string;
  dateTo: string;
}) {
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const getPeriodDays = (): number => {
    if (period === "today") return 1;
    if (period === "month") return 30;
    if (period === "custom" && dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const diff = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1;
      return diff;
    }
    if (period === "all") {
      // For "all", check actual transaction span
      if (transactions.length === 0) return 0;
      const dates = transactions
        .map((t) => t.createdAt ? new Date(t.createdAt).getTime() : 0)
        .filter(Boolean);
      if (dates.length === 0) return 0;
      const span = Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86400000) + 1;
      return span;
    }
    return 31; // default safe
  };

  const handleExport = () => {
    const days = getPeriodDays();
    if (days > 31) {
      setShowLimitDialog(true);
      return;
    }
    // Export CSV
    const headers = ["التاريخ", "النوع", "الاتجاه", "المبلغ", "الوصف", "المرجع", "الرصيد بعد"];
    const rows = transactions.map((t) => [
      t.createdAt ? new Date(t.createdAt).toLocaleString("ar-SA") : "",
      t.type ?? "",
      t.direction ?? "",
      String(t.amountHal ? halToSar(t.amountHal) : t.amount ?? 0),
      t.description ?? t.descriptionAr ?? "",
      t.reference ?? "",
      String(t.balanceAfterHal ? halToSar(t.balanceAfterHal) : t.balanceAfter ?? 0),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `masarx-wallet-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير التقرير (CSV)");
  };

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
        <Download className="h-3.5 w-3.5" />
        تصدير
      </Button>
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              تجاوز حد الطباعة المسموح
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-foreground">
              الفترة المحددة تتجاوز <strong>شهراً واحداً (31 يوماً)</strong>.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              لطباعة التقارير المالية لفترات تتجاوز شهراً واحداً (أو التقارير السنوية)،
              يرجى الضغط هنا للتواصل مع الإدارة لتزويدكم بالتقرير المالي المعتمد.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                className="flex-1 gap-2"
                onClick={() => {
                  window.location.href = "mailto:support@masarx.sa?subject=طلب تقرير مالي معتمد";
                }}
              >
                <Receipt className="h-4 w-4" />
                التواصل مع الإدارة
              </Button>
              <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
