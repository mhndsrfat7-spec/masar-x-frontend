"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Check,
  Camera,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand/Logo";
import { AccountTypeToggle } from "./AccountTypeToggle";
import { PhoneInput } from "./PhoneInput";
import { SecureFooter } from "./SecureFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuth, toApiType, type UiAccountType } from "@/hooks/useAuth";
import { useRouterStore } from "@/store/routerStore";
import { useAuthStore } from "@/store/authStore";
import { ApiClientError } from "@/lib/api/client";
import { isValidSaudiPhone, isValidEmail, normalizeSaudiPhone } from "@/lib/format";
import { authApi, storesApi, isDemoMode } from "@/lib/api/services";
import {
  setProfileIncompleteFlag,
  clearProfileRestriction,
} from "@/lib/profileCompletion";
import type { AuthSession, UserProfile } from "@/types/api";

type RegisterStep = "phone" | "otp" | "profile";

/**
 * Register form — 3-step in-place card flow (no page movement):
 *   1. phone  — account type + Saudi phone + terms agreement → request OTP
 *   2. otp    — verify OTP code → hold session, move to profile step
 *   3. profile — avatar + merchant fields + name/email/password → complete
 *               OR "skip now" → enter restricted browsing mode
 *
 * The auth session is committed to the store only at the end of step 3,
 * so the AppRouter does not redirect away mid-flow.
 */
export function RegisterForm() {
  const { requestOtp } = useAuth();
  const navigate = useRouterStore((s) => s.navigate);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const setAuthSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<RegisterStep>("phone");

  // Shared account fields
  const [accountType, setAccountType] = useState<UiAccountType>("merchant");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);

  // OTP
  const [code, setCode] = useState("");
  // Held session from OTP verification — committed only at profile completion.
  const [heldSession, setHeldSession] = useState<AuthSession | null>(null);

  // Profile fields (step 3)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [storeName, setStoreName] = useState("");
  const [commercialRegister, setCommercialRegister] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = normalizeSaudiPhone(phone);

  // --- Per-step validation ---
  const phoneStepValid = isValidSaudiPhone(phone) && agree;
  const otpStepValid = code.replace(/\s/g, "").length >= 4;
  const profileStepValid =
    fullName.trim().length >= 3 &&
    (!email || isValidEmail(email)) &&
    password.length >= 4 &&
    password === confirmPassword &&
    (accountType !== "merchant" || (storeName.trim().length >= 2 && commercialRegister.trim().length >= 4));

  // ===== Step 1: phone + terms → request OTP =====
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidSaudiPhone(phone)) {
      setError("الرجاء إدخال رقم جوال سعودي صحيح");
      return;
    }
    if (!agree) {
      setError("يجب الموافقة على الشروط والسياسة للمتابعة");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestOtp(fullPhone, accountType);
      setStep("otp");
      toast.success("تم إرسال رمز التحقق إلى رقم جوالك");
    } catch (e2) {
      const msg = e2 instanceof ApiClientError ? e2.message : "تعذّر إرسال رمز التحقق";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // ===== Step 2: verify OTP → hold session, move to profile =====
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpStepValid) {
      setError("الرجاء إدخال رمز التحقق");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await authApi.verifyOtp(
        fullPhone,
        code.replace(/\s/g, ""),
        toApiType(accountType)
      );
      if (!session.accessToken) throw new Error("missing_access_token");
      // Hold the session locally — do NOT commit to the auth store yet,
      // otherwise the AppRouter would redirect away before the profile step.
      setHeldSession(session);
      setStep("profile");
      toast.success("تم التحقق من الرمز — أكمل بيانات حسابك");
    } catch (e2) {
      const msg = e2 instanceof ApiClientError ? e2.message : "رمز التحقق غير صحيح";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // ===== Step 3a: complete profile → commit session → dashboard (full access) =====
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileStepValid) {
      setError("الرجاء إكمال جميع الحقول بشكل صحيح");
      return;
    }
    const accessToken = heldSession?.accessToken;
    if (!accessToken) {
      setError("انتهت الجلسة، الرجاء إعادة التحقق من الرمز");
      setStep("phone");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const normalized = heldSession as AuthSession & Partial<UserProfile>;
      const verifiedUser: UserProfile = {
        ...(normalized.user ?? {}),
        id: normalized.user?.id ?? normalized.id,
        name: fullName.trim(),
        fullName: fullName.trim(),
        phone: fullPhone,
        email: email.trim() || normalized.user?.email || normalized.email,
        accountType: toApiType(accountType),
      };

      // 1. Persist profile fields (name, email).
      let profileSaveFailed = false;
      try {
        const savedProfile = await authApi.updateMe(accessToken, {
          name: fullName.trim(),
          fullName: fullName.trim(),
          email: email.trim() || undefined,
        });
        setAuthUser({ ...verifiedUser, ...savedProfile });
      } catch {
        profileSaveFailed = true;
      }

      // 2. Persist merchant store fields (merchant only).
      let storeSaveFailed = false;
      if (accountType === "merchant") {
        try {
          const savedStore = await storesApi.update(accessToken, {
            name: storeName.trim(),
            storeName: storeName.trim(),
            commercialRegister: commercialRegister.trim(),
            crNumber: commercialRegister.trim(),
          });
          const currentUser = useAuthStore.getState().user ?? verifiedUser;
          setAuthUser({
            ...currentUser,
            store: { ...(currentUser.store ?? {}), ...savedStore },
          });
        } catch {
          storeSaveFailed = true;
        }
      }

      // 3. Commit the authenticated session — this triggers the dashboard redirect.
      setAuthUser(useAuthStore.getState().user ?? verifiedUser);
      setAuthSession({
        accessToken,
        refreshToken: heldSession.refreshToken,
        expiresAt: heldSession.expiresAt,
        accountType: toApiType(accountType),
        phone: fullPhone,
      });
      // Profile is complete → clear any prior restriction flag.
      clearProfileRestriction();
      toast.success("تم إنشاء حسابك بنجاح");
      if (profileSaveFailed) {
        toast.warning("تم إنشاء الحساب، لكن تعذّر حفظ الاسم والبريد. راجع الملف الشخصي لإكمالهما.");
      }
      if (storeSaveFailed) {
        toast.warning("تم إنشاء الحساب، لكن تعذّر حفظ بيانات المتجر. أكملها من الملف الشخصي أو راجع الدعم.");
      }
      navigate("dashboard");
    } catch (e2) {
      const msg = e2 instanceof ApiClientError ? e2.message : "تعذّر إكمال التسجيل";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // ===== Step 3b: skip now → commit session → dashboard (restricted browsing) =====
  const handleSkipProfile = () => {
    const accessToken = heldSession?.accessToken;
    if (!accessToken) {
      setError("انتهت الجلسة، الرجاء إعادة التحقق من الرمز");
      setStep("phone");
      return;
    }
    const normalized = heldSession as AuthSession & Partial<UserProfile>;
    const minimalUser: UserProfile = {
      ...(normalized.user ?? {}),
      id: normalized.user?.id ?? normalized.id,
      phone: fullPhone,
      accountType: toApiType(accountType),
    };
    // Mark the account as incomplete → restricted browsing mode.
    setProfileIncompleteFlag(true);
    setAuthUser(minimalUser);
    setAuthSession({
      accessToken,
      refreshToken: heldSession.refreshToken,
      expiresAt: heldSession.expiresAt,
      accountType: toApiType(accountType),
      phone: fullPhone,
    });
    toast.info("تم الدخول في وضع التصفح المقيّد — أكمل بيانات ملفك الشخصي لتفعيل إنشاء الشحنات");
    navigate("dashboard");
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="lg:hidden mb-4 flex justify-center">
          <LogoMark size={56} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">إنشاء حساب جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ابدأ رحلتك في الشحن مع مسار إكس
        </p>
        {/* Step indicator (in-place, no page movement) */}
        <StepIndicator step={step} />
      </div>

      {step === "phone" && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <AccountTypeToggle value={accountType} onChange={setAccountType} variant="cards" />

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال</Label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              error={!!error && !isValidSaudiPhone(phone)}
            />
          </div>

          <label
            htmlFor="agree"
            className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer"
          >
            <Checkbox
              id="agree"
              checked={agree}
              onCheckedChange={(v) => setAgree(v === true)}
              className="mt-0.5"
            />
            <span>
              أوافق على{" "}
              <a href="#" className="text-primary hover:underline">
                شروط الاستخدام
              </a>{" "}
              و{" "}
              <a href="#" className="text-primary hover:underline">
                سياسة الخصوصية
              </a>{" "}
              الخاصة بمنصة مسار إكس.
            </span>
          </label>

          {error && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 text-base font-semibold h-12"
            disabled={busy || !phoneStepValid}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                تأكيد وإرسال رمز التحقق
                <ArrowLeft className="h-4 w-4 rtl-flip" />
              </>
            )}
          </Button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              تم إرسال رمز التحقق إلى
            </p>
            <p className="text-sm font-mono text-primary" dir="ltr">
              {fullPhone}
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="text-xs text-muted-foreground hover:text-primary underline"
            >
              تعديل الرقم
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">رمز التحقق</Label>
            <Input
              id="otp"
              type="text"
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
              }
              placeholder="••••"
              className="text-center text-xl tracking-[0.5em] font-semibold h-12"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 text-base font-semibold h-12"
            disabled={busy || !otpStepValid}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                تأكيد الرمز والمتابعة
                <ArrowLeft className="h-4 w-4 rtl-flip" />
              </>
            )}
          </Button>
        </form>
      )}

      {step === "profile" && (
        <form onSubmit={handleCompleteProfile} className="space-y-4">
          <AvatarUpload accountType={accountType} />

          {accountType === "merchant" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-muted/20 p-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="register-store-name">الاسم التجاري / اسم المتجر *</Label>
                <Input
                  id="register-store-name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="اسم المتجر المسجل"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="register-cr">السجل التجاري / وثيقة العمل الحر *</Label>
                <Input
                  id="register-cr"
                  value={commercialRegister}
                  onChange={(e) => setCommercialRegister(e.target.value)}
                  placeholder="رقم السجل أو الوثيقة"
                  dir="ltr"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: محمد عبدالله"
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                tabIndex={-1}
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
            <Input
              id="confirm-password"
              type="password"
              dir="ltr"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              autoComplete="new-password"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين.</p>
            )}
          </div>

          {!isDemoMode() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              الخادم الحالي ينشئ الحساب بالتحقق عبر OTP فقط، ولا يوفر بعد واجهة لحفظ كلمة المرور أو تسجيل الدخول بها. لا تستخدم كلمة المرور هذه كوسيلة دخول فعلية حتى يضيف الباك إند دعم بيانات الاعتماد.
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 text-base font-semibold h-12"
            disabled={busy || !profileStepValid}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                حفظ البيانات وإكمال التسجيل
                <Check className="h-4 w-4" />
              </>
            )}
          </Button>

          <div className="flex items-center gap-3 my-1">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">أو</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 h-11"
            onClick={handleSkipProfile}
            disabled={busy}
          >
            تخطي الآن وإكمال البيانات لاحقاً
            <ArrowLeft className="h-4 w-4 rtl-flip" />
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{" "}
        <button
          type="button"
          onClick={() => navigate("login")}
          className="font-semibold text-primary hover:underline"
        >
          تسجيل الدخول
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <SecureFooter />
      </div>
    </div>
  );
}

/* ============================================================================
 * StepIndicator — shows the 3-step progress inline (no page movement).
 * ==========================================================================*/
function StepIndicator({ step }: { step: RegisterStep }) {
  const steps: { id: RegisterStep; label: string }[] = [
    { id: "phone", label: "الجوال" },
    { id: "otp", label: "التحقق" },
    { id: "profile", label: "البيانات" },
  ];
  const currentIndex = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.id} className="flex items-center gap-1.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={`text-[11px] ${
                active ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-5 ${done ? "bg-emerald-400" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.5 12.2c0-.7-.06-1.4-.18-2.06H12v3.9h5.92a5.07 5.07 0 0 1-2.2 3.33v2.77h3.55c2.08-1.92 3.28-4.74 3.28-7.94z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.77c-.98.66-2.24 1.05-3.73 1.05-2.87 0-5.3-1.94-6.17-4.55H2.18v2.86A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.83 14.07a6.6 6.6 0 0 1 0-4.14V7.07H2.18a11 11 0 0 0 0 9.86l3.65-2.86z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.46 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.65 2.86C6.7 7.31 9.13 5.38 12 5.38z"
      />
    </svg>
  );
}

/* ============================================================================
 * NEW: AvatarUpload — for customer avatar or merchant store logo.
 * Saves the chosen data URL to localStorage so it persists across page navigation.
 * ==========================================================================*/
const AVATAR_STORAGE_KEY = "masar-x-avatar";

function loadStoredAvatar(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AVATAR_STORAGE_KEY);
  } catch {
    return null;
  }
}

function AvatarUpload({ accountType }: { accountType: "merchant" | "customer" }) {
  const [preview, setPreview] = useState<string | null>(loadStoredAvatar);
  const isMerchant = accountType === "merchant";
  const label = isMerchant ? "شعار المتجر" : "الصورة الشخصية";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      try {
        window.localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl);
      } catch {
        // ignore storage errors
      }
      toast.success(`تم حفظ ${label}`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <label
          htmlFor="avatar-upload"
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer shadow-sm hover:bg-primary/90"
          title={`رفع ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">
          اختياري — PNG/JPG/WebP حتى 5 ميجابايت. تُحفظ الصورة وتظهر حتى بعد التنقل.
        </p>
      </div>
    </div>
  );
}
