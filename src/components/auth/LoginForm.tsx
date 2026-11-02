"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Lock,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand/Logo";
import { AccountTypeToggle } from "./AccountTypeToggle";
import { PhoneInput } from "./PhoneInput";
import { SecureFooter } from "./SecureFooter";
import { Button } from "@/components/ui/button";
import { useAuth, toApiType, type UiAccountType } from "@/hooks/useAuth";
import { useRouterStore } from "@/store/routerStore";
import { ApiClientError } from "@/lib/api/client";
import { isValidSaudiPhone, normalizeSaudiPhone } from "@/lib/format";
import { authApi, isDemoMode } from "@/lib/api/services";

/**
 * Login form — phone + password (matches brand reference image).
 *
 * Behavior:
 *  - Demo mode: uses the mock password-login contract and never stores the password.
 *  - Real mode: calls POST /auth/login; falls back to OTP only when that route
 *    is not deployed yet (404/405/501). Invalid credentials are not downgraded.
 *  - Recovery uses POST /auth/forgot-password and POST /auth/reset-password.
 * See BACKEND_HANDOFF_AR.md for the backend contract.
 */
export function LoginForm() {
  const { loginWithPassword, verifyOtp, requestOtp } = useAuth();
  const navigate = useRouterStore((s) => s.navigate);

  const [accountType, setAccountType] = useState<UiAccountType>("merchant");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryOtpRequested, setRecoveryOtpRequested] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = normalizeSaudiPhone(phone);
  const phoneValid = isValidSaudiPhone(phone);
  const passwordValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneValid) {
      setError("الرجاء إدخال رقم جوال سعودي صحيح");
      return;
    }
    if (!passwordValid) {
      setError("كلمة المرور يجب ألا تقل عن 8 أحرف");
      return;
    }

    setSubmitting(true);
    try {
      await loginWithPassword(fullPhone, password, accountType);
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (e) {
      const err = e as ApiClientError;
      if (err.code === "OTP_REQUIRED") {
        setOtpRequired(true);
        setError(null);
        toast.info(err.message || "تم إرسال رمز تحقق إلى جوالك");
      } else {
        const msg = err.message || "تعذّر تسجيل الدخول، تحقّق من البيانات";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      setError("أدخل رمز التحقق المكوّن من 6 أرقام");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await verifyOtp(fullPhone, otpCode, accountType);
      toast.success("تم التحقق وتسجيل الدخول بنجاح");
    } catch (e) {
      const message = e instanceof ApiClientError ? e.message : "تعذّر التحقق من الرمز";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await requestOtp(fullPhone, accountType);
      setOtpCode("");
      toast.success("تم طلب رمز تحقق جديد");
    } catch (e) {
      const message = e instanceof ApiClientError ? e.message : "تعذّر إعادة إرسال الرمز";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const requestRecoveryCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeSaudiPhone(recoveryPhone);
    if (!isValidSaudiPhone(recoveryPhone)) {
      toast.error("أدخل رقم جوال سعودي صحيح لاستعادة كلمة المرور");
      return;
    }
    setRecoveryBusy(true);
    try {
      await authApi.forgotPassword({ phone: normalized, accountType: toApiType(accountType) });
      setRecoveryPhone(normalized);
      setRecoveryOtpRequested(true);
      toast.success("تم طلب رمز استعادة كلمة المرور");
    } catch (recoveryError) {
      toast.error(recoveryError instanceof ApiClientError ? recoveryError.message : "تعذّر طلب رمز الاستعادة");
    } finally {
      setRecoveryBusy(false);
    }
  };

  const submitNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(recoveryCode)) { toast.error("أدخل رمز التحقق المكوّن من 6 أرقام"); return; }
    if (newPassword.length < 8) { toast.error("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف"); return; }
    if (newPassword !== confirmNewPassword) { toast.error("تأكيد كلمة المرور غير مطابق"); return; }
    setRecoveryBusy(true);
    try {
      await authApi.resetPassword({
        phone: recoveryPhone,
        accountType: toApiType(accountType),
        code: recoveryCode,
        newPassword,
      });
      setRecovering(false);
      setRecoveryOtpRequested(false);
      setRecoveryCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPassword("");
      toast.success("تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.");
    } catch (recoveryError) {
      toast.error(recoveryError instanceof ApiClientError ? recoveryError.message : "تعذّر إعادة تعيين كلمة المرور");
    } finally {
      setRecoveryBusy(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header — title + subtitle */}
      <div className="mb-6">
        <div className="lg:hidden mb-4 flex justify-center">
          <LogoMark size={56} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          مرحباً بك في مسار إكس — شحنك أدق وأعمالك أسرع
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!otpRequired && <AccountTypeToggle value={accountType} onChange={setAccountType} variant="cards" />}

        {!otpRequired && <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            رقم الجوال
          </label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            error={!!error && !phoneValid}
          />
        </div>}

        {otpRequired && (
          <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">التحقق من رقم الجوال</p>
              <p className="text-xs text-muted-foreground mt-1" dir="ltr">{fullPhone}</p>
            </div>
            <label htmlFor="login-otp-code" className="text-sm font-medium text-foreground">
              رمز التحقق (6 أرقام)
            </label>
            <input
              id="login-otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              dir="ltr"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="••••••"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" className="flex-1" onClick={handleVerifyOtp} disabled={submitting || otpCode.length !== 6}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحقق وتسجيل الدخول"}
              </Button>
              <Button type="button" variant="outline" onClick={handleResendOtp} disabled={submitting}>
                إعادة إرسال الرمز
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setOtpRequired(false); setOtpCode(""); setError(null); }} disabled={submitting}>
                رجوع
              </Button>
            </div>
          </div>
        )}

        {!otpRequired && <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              كلمة المرور
            </label>
            <button
              type="button"
              onClick={() => {
                setRecoveryPhone(phone);
                setRecovering(true);
                setRecoveryOtpRequested(false);
                setRecoveryCode("");
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
          <div
            className={`relative flex items-stretch rounded-xl border bg-card overflow-hidden transition-colors ${
              error && !passwordValid
                ? "border-destructive focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
                : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
            }`}
            dir="ltr"
          >
            <div className="flex items-center px-3 border-l border-border bg-muted/40 text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPass ? "text" : "password"}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="flex-1 bg-transparent px-3 py-3 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70 placeholder:font-normal"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="flex items-center px-3 border-r border-border bg-muted/30 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPass ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>}

        {error && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs text-destructive flex items-start gap-2">
            <KeyRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isDemoMode() ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>وضع تجريبي:</strong> استخدم أي رقم جوال سعودي + أي كلمة مرور
              (4 أحرف على الأقل) لتسجيل الدخول.
            </span>
          </div>
        ) : !otpRequired ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
            <span>
              تحاول المنصة تسجيل الدخول بكلمة المرور عبر API. عند عدم تفعيل المسار في الخادم، تنتقل مؤقتًا إلى التحقق عبر OTP.
            </span>
          </div>
        ) : null}

        {!otpRequired && <Button
          type="submit"
          size="lg"
          className="w-full gap-2 text-base font-semibold h-12 shadow-brand"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ التحقق…
            </>
          ) : (
            <>
              تسجيل الدخول
              <ArrowLeft className="h-4 w-4 rtl-flip" />
            </>
          )}
        </Button>}
      </form>

      {recovering && (
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-sm">استعادة كلمة المرور</h2>
              <p className="mt-1 text-xs text-muted-foreground">سيتم التحقق من ملكية رقم الجوال قبل تعيين كلمة مرور جديدة.</p>
            </div>
            <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setRecovering(false); setRecoveryOtpRequested(false); }}>إغلاق</button>
          </div>
          {!recoveryOtpRequested ? (
            <form onSubmit={requestRecoveryCode} className="space-y-3">
              <label className="block text-xs font-medium">رقم الجوال</label>
              <PhoneInput value={recoveryPhone} onChange={setRecoveryPhone} />
              <Button type="submit" className="w-full" disabled={recoveryBusy}>{recoveryBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال رمز الاستعادة"}</Button>
            </form>
          ) : (
            <form onSubmit={submitNewPassword} className="space-y-3">
              <p className="text-xs text-muted-foreground" dir="ltr">{recoveryPhone}</p>
              <label className="block text-xs font-medium">رمز الاستعادة (6 أرقام)</label>
              <input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={6} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-center font-mono tracking-[0.3em]" />
              <label className="block text-xs font-medium">كلمة المرور الجديدة</label>
              <input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" minLength={8} />
              <label className="block text-xs font-medium">تأكيد كلمة المرور الجديدة</label>
              <input type="password" autoComplete="new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" minLength={8} />
              <Button type="submit" className="w-full" disabled={recoveryBusy}>{recoveryBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "تعيين كلمة المرور الجديدة"}</Button>
              <Button type="button" variant="ghost" className="w-full" disabled={recoveryBusy} onClick={() => { setRecoveryOtpRequested(false); setRecoveryCode(""); }}>تغيير رقم الجوال</Button>
            </form>
          )}
          {isDemoMode() && <p className="text-[11px] text-amber-700">وضع تجريبي: لا يُرسل OTP حقيقي ولا يتم تغيير كلمة مرور في نظام إنتاجي.</p>}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{" "}
        <button
          type="button"
          onClick={() => navigate("register")}
          className="font-semibold text-primary hover:underline"
        >
          أنشئ حساباً جديداً
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <SecureFooter />
      </div>
    </div>
  );
}
