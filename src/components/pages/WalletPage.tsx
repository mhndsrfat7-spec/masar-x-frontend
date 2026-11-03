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
  formatDateTime,
  halToSar,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslation, tStatic } from "@/i18n";
import type { WalletTransaction } from "@/types/api";

export function WalletPage() {
  const { token } = useAuth();
  const { wallet, transactions, loading, error, reload } = useWallet(token);
  const isProfileRestricted = useIsProfileRestricted();
  const { t } = useTranslation();

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
    bankName: t("walletPage.companyBankName"),
    accountName: t("walletPage.companyAccountName"),
    iban: "SA0080000000000000000000",
    swiftCode: "RJHISARI",
  };

  const handleCopyIban = async () => {
    try {
      await navigator.clipboard.writeText(companyBankInfo.iban);
      setCopiedIban(true);
      toast.success(t("bankAccounts.ibanCopiedToast"));
      setTimeout(() => setCopiedIban(false), 2000);
    } catch {
      toast.error(t("common.copyFailed"));
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
      toast.warning(t("walletPage.errors.restrictedTopupWarning"));
      return;
    }
    const value = Number(amount);
    if (!value || value < 1) {
      toast.error(t("walletPage.errors.enterValidAmount"));
      return;
    }
    if (method === "bank_transfer") {
      if (bankAccounts.length === 0) {
        toast.error(t("walletPage.errors.addSavedBankAccountFirst"));
        return;
      }
      if (!selectedBankAccountId) {
        toast.error(t("walletPage.errors.selectSourceBankAccountError"));
        return;
      }
      if (!referenceNumber.trim()) {
        toast.error(t("walletPage.errors.enterTransferRefError"));
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
        const methodName =
          cardMethod === "apple_pay"
            ? t("walletPage.applePay")
            : cardMethod === "stc_pay"
              ? t("walletPage.stcPay")
              : t("walletPage.madaVisaTitle");
        toast.success(t("walletPage.errors.topupRequestCreatedToast", { method: methodName }));
        setOpen(false);
        setAmount("");
        reload();
      }
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("walletPage.errors.topupFailed")
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
      toast.success(t("walletPage.errors.bankTransferSubmittedToast"));
      toast.info(t("walletPage.errors.bankTransferWhatsappHint"));
      setOpen(false);
      setAmount("");
      setReferenceNumber("");
      setSelectedBankAccountId("");
      setPasswordAction(null);
      reload();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("walletPage.errors.bankTransferSubmitFailed")
      );
    } finally {
      setBusy(false);
    }
  };

  /** Open the withdraw dialog (button is always visible on the balance card). */
  const openWithdraw = () => {
    if (isProfileRestricted) {
      toast.warning(t("walletPage.errors.restrictedWithdrawWarning"));
      return;
    }
    if (balance <= 0) {
      toast.error(t("walletPage.errors.noBalanceToWithdraw"));
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
      toast.error(t("walletPage.errors.enterValidWithdrawAmount"));
      return;
    }
    if (value > balance) {
      toast.error(t("walletPage.errors.amountExceedsBalance"));
      return;
    }
    if (!withdrawBankAccountId) {
      toast.error(t("walletPage.errors.selectReceivingBankAccount"));
      return;
    }
    setWithdrawBusy(true);
    try {
      await walletApi.withdraw(token, {
        amount: value,
        amountHal: Math.round(value * 100),
        bankAccountId: withdrawBankAccountId,
      });
      toast.success(t("walletPage.errors.withdrawSuccessToast"));
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setPasswordAction(null);
      reload();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("walletPage.errors.withdrawFailed")
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
        title={t("walletPage.title")}
        description={t("walletPage.description")}
      />

      {/* Restricted-browsing guidance card */}
      <ProfileRestrictionAlert />

      {/* Premium wallet balance card */}
      <div className="w-full">
        <Card className="relative isolate overflow-hidden rounded-3xl border-0 bg-[linear-gradient(125deg,#082A2C_0%,#0D3B3E_52%,#145B50_100%)] text-white shadow-[0_18px_48px_-18px_rgba(8,42,44,0.55)]">
          <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-24 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -start-16 h-64 w-64 rounded-full bg-teal-200/10 blur-3xl" />
          <CardContent className="relative z-10 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 shadow-inner">
                    <WalletIcon className="h-[18px] w-[18px] text-emerald-100" />
                  </span>
                  <p className="text-sm font-semibold tracking-wide text-white/80">{t("walletPage.availableBalance")}</p>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1" dir="ltr">
                  <span className="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">{formatSAR(balance, { withSymbol: false })}</span>
                  <span className="text-sm font-semibold text-emerald-100/75">{t("common.sar")}</span>
                </div>
                <p className="mt-1 text-[10px] font-medium text-white/55">
                  {t("walletPage.accountStatusLine", { status: wallet?.negativeBalance ? t("walletPage.statusDebit") : t("walletPage.statusActive") })}
                </p>
              </div>
              <Badge className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold text-white shadow-none hover:bg-white/10">{t("common.sarCode")}</Badge>
            </div>

            <div className="my-3 h-px bg-gradient-to-r from-white/25 via-white/10 to-transparent" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid flex-1 grid-cols-2 gap-2 sm:max-w-[430px] sm:gap-4">
                <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2">
                  <div className="mb-1 flex items-center gap-1.5 text-white/65">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-300/15 text-amber-200"><Clock className="h-3 w-3" /></span>
                    <span className="truncate text-[10px] font-medium">{t("walletPage.pendingStat")}</span>
                  </div>
                  <p className="truncate text-sm font-bold tabular-nums text-white sm:text-base" dir="ltr">
                    {formatSAR(pending, { withSymbol: false })}<span className="ms-1 text-[9px] font-medium text-white/55">{t("common.sar")}</span>
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2">
                  <div className="mb-1 flex items-center gap-1.5 text-white/65">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-300/15 text-emerald-200"><TrendingUp className="h-3 w-3" /></span>
                    <span className="truncate text-[10px] font-medium">{t("walletPage.codCollectedStat")}</span>
                  </div>
                  <p className="truncate text-sm font-bold tabular-nums text-white sm:text-base" dir="ltr">
                    {formatSAR(codCollected, { withSymbol: false })}<span className="ms-1 text-[9px] font-medium text-white/55">{t("common.sar")}</span>
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:min-w-[260px]">
                <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 min-w-0 flex-1 gap-1.5 rounded-xl border border-white/15 bg-white px-2 text-xs font-semibold text-[#0D3B3E] shadow-sm hover:bg-emerald-50 sm:h-10 sm:px-4 sm:text-sm">
                <Plus className="h-4 w-4" />
                {t("walletPage.topupWalletBtn")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("walletPage.topupDialogTitle")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>{t("walletPage.amountSarLabel")}</Label>
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
                        {v} {t("common.sar")}
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
                      <p className="text-sm font-medium">{t("walletPage.madaVisaTitle")}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("walletPage.madaVisaDesc")}
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
                      <p className="text-sm font-medium">{t("walletPage.bankTransferTitle")}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("walletPage.bankTransferDesc")}
                      </p>
                    </div>
                  </label>
                </RadioGroup>

                {/* NEW: card sub-method selection (Mada/Visa, Apple Pay, STC Pay, PayPal) */}
                {method === "card" && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "card", label: t("walletPage.madaVisaTitle"), icon: CreditCard },
                      { id: "apple_pay", label: t("walletPage.applePay"), icon: Apple },
                      { id: "stc_pay", label: t("walletPage.stcPay"), icon: Smartphone },
                      { id: "paypal", label: t("walletPage.paypal"), icon: ShieldCheck },
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
                            <span className="text-[9px] text-amber-600 ms-auto">{t("common.comingSoon")}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* NEW: bank transfer details — company account + customer saved account + reference */}
                {method === "bank_transfer" && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-xs font-semibold text-foreground">{t("walletPage.transferToMasarAccount")}</p>
                    <div className="rounded-lg bg-card border border-border p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t("walletPage.bankLabel")}</span>
                        <span className="font-medium text-foreground">{companyBankInfo.bankName}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t("walletPage.beneficiaryNameLabel")}</span>
                        <span className="font-medium text-foreground">{companyBankInfo.accountName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{t("walletPage.ibanLabel")}</span>
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
                        <span className="text-muted-foreground">{t("walletPage.swiftLabel")}</span>
                        <span className="font-mono text-foreground" dir="ltr">{companyBankInfo.swiftCode}</span>
                      </div>
                    </div>

                    {bankAccounts.length === 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {t("walletPage.noSavedBankAccountAlert")}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("walletPage.selectSourceBankAccount")}</Label>
                        <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder={t("walletPage.selectSavedAccountPlaceholder")} />
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
                      <Label htmlFor="bank-ref" className="text-xs">{t("walletPage.transferRefNumberLabel")}</Label>
                      <Input
                        id="bank-ref"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder={t("walletPage.transferRefPlaceholder")}
                        dir="ltr"
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {t("walletPage.passwordRequiredForTransferHint")}
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
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleTopup}
                  disabled={busy}
                  className="gap-2"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("walletPage.confirmTopupBtn")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
                <Button size="sm" variant="secondary" className="h-9 min-w-0 flex-1 gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2 text-xs font-semibold text-white shadow-sm hover:bg-white/20 sm:h-10 sm:px-4 sm:text-sm" onClick={openWithdraw} disabled={balance <= 0}>
                  <ArrowDownToLine className="h-4 w-4 shrink-0" /><span className="truncate">{t("walletPage.withdrawBalanceBtn")}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* COD info banner */}
      {codPending > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {t("walletPage.codPendingBannerTitle", { amount: formatSAR(codPending) })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("walletPage.codPendingBannerDesc")}
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
                <h2 className="text-base font-semibold text-foreground">{t("walletPage.transactionsTitle")}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t("walletPage.transactionsSubtitle")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="sm:w-56">
                    <SelectValue placeholder={t("walletPage.periods.all")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("walletPage.periods.all")}</SelectItem>
                    <SelectItem value="today">{t("walletPage.periods.today")}</SelectItem>
                    <SelectItem value="month">{t("walletPage.periods.month")}</SelectItem>
                    <SelectItem value="cod">{t("walletPage.periods.cod")}</SelectItem>
                    <SelectItem value="custom">{t("walletPage.periods.custom")}</SelectItem>
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
                  <Label htmlFor="wallet-date-from" className="text-xs">{t("walletPage.fromDateLabel")}</Label>
                  <Input id="wallet-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wallet-date-to" className="text-xs">{t("walletPage.toDateLabel")}</Label>
                  <Input id="wallet-date-to" type="date" min={dateFrom || undefined} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          {loading ? (
            <LoadingState message={t("walletPage.loadingTransactions")} className="py-12" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="py-12" />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title={transactions.length === 0 ? t("walletPage.emptyTransactions") : t("walletPage.emptyTransactionsFiltered")}
              description={transactions.length === 0 ? t("walletPage.emptyTransactionsDesc") : t("walletPage.emptyTransactionsFilteredDesc")}
              icon={Banknote}
              className="py-12"
            />
          ) : (
            <>
              <ul className="divide-y divide-border">
                {paginatedTransactions.map((tx) => {
                  const dir = (tx.direction ?? "").toUpperCase();
                  const isIn =
                    dir === "IN" || dir === "CREDIT" || tx.direction === "in";
                  const amountVal = tx.amountHal
                    ? halToSar(tx.amountHal)
                    : (tx.amount ?? 0);
                  return (
                    <li
                      key={tx.id}
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
                          {tx.description ??
                            tx.descriptionAr ??
                            labelForType(tx.type)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateTime(tx.createdAt)}
                          {tx.reference ? ` • ${tx.reference}` : ""}
                          {tx.status ? ` • ${tx.status}` : ""}
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
                          {formatSAR(amountVal, { withSymbol: false })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tx.balanceAfterHal
                            ? t("walletPage.balanceAfterPrefix", {
                                amount: formatSAR(halToSar(tx.balanceAfterHal), { withSymbol: false }),
                              })
                            : tx.balanceAfter
                            ? t("walletPage.balanceAfterPrefix", {
                                amount: formatSAR(tx.balanceAfter, { withSymbol: false }),
                              })
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
                    {t("common.previous")}
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("common.pageOf", { page: txPage, total: txTotalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={txNextPage}
                    disabled={!txHasNext}
                    className="gap-1.5"
                  >
                    {t("common.next")}
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
              {t("walletPage.withdrawDialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              {t("walletPage.availableForWithdraw")}{" "}
              <span className="font-bold" dir="ltr">{formatSAR(balance)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">{t("walletPage.withdrawAmountLabel")}</Label>
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
                  {t("walletPage.noSavedAccountForWithdraw")}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="withdraw-account">{t("walletPage.receivingBankAccountLabel")}</Label>
                <Select value={withdrawBankAccountId} onValueChange={setWithdrawBankAccountId}>
                  <SelectTrigger id="withdraw-account">
                    <SelectValue placeholder={t("walletPage.selectSavedAccountPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.bankName} ••{a.iban.slice(-4)}
                        {a.isDefault ? t("walletPage.defaultAccountSuffix") : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {t("walletPage.passwordRequiredForWithdrawHint")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={withdrawBusy}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (Number(withdrawAmount) > balance) {
                  toast.error(t("walletPage.errors.amountExceedsBalance"));
                  return;
                }
                if (!withdrawBankAccountId) {
                  toast.error(t("walletPage.errors.selectReceivingAccountShort"));
                  return;
                }
                setPasswordAction("withdraw");
                setPasswordModalOpen(true);
              }}
              disabled={withdrawBusy || balance <= 0 || bankAccounts.length === 0 || !withdrawAmount}
              className="gap-2"
            >
              {withdrawBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {t("walletPage.confirmWithdrawRequestBtn")}
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
            ? t("walletPage.passwordConfirmWithdrawDesc")
            : passwordAction === "topup-bank"
              ? t("walletPage.passwordConfirmTopupBankDesc")
              : t("walletPage.passwordConfirmDefaultDesc")
        }
        onConfirmed={handlePasswordConfirmed}
      />
    </div>
  );
}

function labelForType(type?: string): string {
  if (!type) return tStatic("dashboard.recentTransactions.types.default");
  const t = type.toLowerCase();
  switch (t) {
    case "topup":
      return tStatic("dashboard.recentTransactions.types.topup");
    case "shipment":
      return tStatic("dashboard.recentTransactions.types.shipment");
    case "refund":
      return tStatic("dashboard.recentTransactions.types.refund");
    case "cod":
      return tStatic("dashboard.recentTransactions.types.cod");
    case "fee":
      return tStatic("dashboard.recentTransactions.types.fee");
    case "adjustment":
      return tStatic("dashboard.recentTransactions.types.adjustment");
    default:
      return tStatic("dashboard.recentTransactions.types.default");
  }
}

/* ============================================================================
 * NEW: SummaryCards — monthly/daily financial summary for the filtered period.
 * Shows: total topups, total shipping spend, pending COD, weight surcharges.
 * ==========================================================================*/
function SummaryCards({ transactions }: { transactions: WalletTransaction[] }) {
  const { t } = useTranslation();

  const totalTopups = transactions
    .filter((tx) => (tx.type ?? "").toLowerCase() === "topup" && (tx.direction ?? "").toUpperCase() === "IN")
    .reduce((sum, tx) => sum + (tx.amountHal ? halToSar(tx.amountHal) : tx.amount ?? 0), 0);
  const topupsCount = transactions.filter(
    (tx) => (tx.type ?? "").toLowerCase() === "topup" && (tx.direction ?? "").toUpperCase() === "IN"
  ).length;

  const totalShipping = transactions
    .filter((tx) => (tx.type ?? "").toLowerCase() === "shipment" && (tx.direction ?? "").toUpperCase() === "OUT")
    .reduce((sum, tx) => sum + (tx.amountHal ? halToSar(tx.amountHal) : tx.amount ?? 0), 0);

  const pendingCOD = transactions
    .filter((tx) => (tx.type ?? "").toLowerCase() === "cod" && (tx.direction ?? "").toUpperCase() === "IN")
    .reduce((sum, tx) => sum + (tx.amountHal ? halToSar(tx.amountHal) : tx.amount ?? 0), 0);

  const weightSurcharges = transactions
    .filter((tx) => (tx.type ?? "").toLowerCase() === "fee" || (tx.type ?? "").toLowerCase() === "adjustment")
    .reduce((sum, tx) => sum + (tx.amountHal ? halToSar(tx.amountHal) : tx.amount ?? 0), 0);

  const cards = [
    {
      label: t("walletPage.summary.totalTopups"),
      value: totalTopups,
      count: topupsCount,
      icon: ArrowDownLeft,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      label: t("walletPage.summary.shippingExpenses"),
      value: totalShipping,
      icon: ArrowUpRight,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: t("walletPage.summary.pendingCod"),
      value: pendingCOD,
      icon: Clock,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      label: t("walletPage.summary.overweightDeductions"),
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
                <span className="text-xs font-normal text-muted-foreground ms-1">{t("common.sar")}</span>
              </p>
              {"count" in c && c.count !== undefined && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("walletPage.summary.operationsCount", { count: c.count })}</p>
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
  const { t, locale } = useTranslation();

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
      if (transactions.length === 0) return 0;
      const dates = transactions
        .map((tx) => tx.createdAt ? new Date(tx.createdAt).getTime() : 0)
        .filter(Boolean);
      if (dates.length === 0) return 0;
      const span = Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86400000) + 1;
      return span;
    }
    return 31;
  };

  const handleExport = () => {
    const days = getPeriodDays();
    if (days > 31) {
      setShowLimitDialog(true);
      return;
    }
    const dateLocale = locale === "en" ? "en-US" : "ar-SA";
    const headers = [
      t("walletPage.csvHeaders.date"),
      t("walletPage.csvHeaders.type"),
      t("walletPage.csvHeaders.direction"),
      t("walletPage.csvHeaders.amount"),
      t("walletPage.csvHeaders.description"),
      t("walletPage.csvHeaders.reference"),
      t("walletPage.csvHeaders.balanceAfter"),
    ];
    const rows = transactions.map((tx) => [
      tx.createdAt ? new Date(tx.createdAt).toLocaleString(dateLocale) : "",
      tx.type ?? "",
      tx.direction ?? "",
      String(tx.amountHal ? halToSar(tx.amountHal) : tx.amount ?? 0),
      tx.description ?? tx.descriptionAr ?? "",
      tx.reference ?? "",
      String(tx.balanceAfterHal ? halToSar(tx.balanceAfterHal) : tx.balanceAfter ?? 0),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `masarx-wallet-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("walletPage.reportExportedToast"));
  };

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
        <Download className="h-3.5 w-3.5" />
        {t("common.export")}
      </Button>
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {t("walletPage.printLimitDialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm font-semibold text-foreground">
              {t("walletPage.printLimitExceededText")}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("walletPage.printLimitContactAdminDesc")}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                className="flex-1 gap-2"
                onClick={() => {
                  window.location.href = "mailto:support@masarx.sa?subject=Official%20Financial%20Report%20Request";
                }}
              >
                <Receipt className="h-4 w-4" />
                {t("walletPage.contactAdminBtn")}
              </Button>
              <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
