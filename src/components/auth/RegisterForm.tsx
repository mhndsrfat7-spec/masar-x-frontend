"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Check,
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
import { useAuth, type UiAccountType } from "@/hooks/useAuth";
import { useRouterStore } from "@/store/routerStore";
import { ApiClientError } from "@/lib/api/client";
import { isValidSaudiPhone, isValidEmail, normalizeSaudiPhone } from "@/lib/format";

/**
 * Register form — matches the brand reference: name + phone + email + password.
 *
 * After submit:
 *  - Demo: skips OTP and logs the user in directly.
 *  - Real: sends OTP request, then UI prompts for the OTP code in a second step.
 */
export function RegisterForm() {
  const { requestOtp, verifyOtp, completeProfile } = useAuth();
  const navigate = useRouterStore((s) => s.navigate);

  const [accountType, setAccountType] = useState<UiAccountType>("merchant");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);

  const [step, setStep] = useState<"form" | "otp">("form");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = normalizeSaudiPhone(phone);

  const formValid =
    fullName.trim().length >= 3 &&
    isValidSaudiPhone(phone) &&
    (!email || isValidEmail(email)) &&
    password.length >= 4 &&
    agree;

  const sendCode = async () => {
    if (!formValid) {
      setError("الرجاء إكمال جميع الحقول بشكل صحيح والموافقة على الشروط");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestOtp(fullPhone, accountType);
      setStep("otp");
      toast.success("تم إرسال رمز التحقق إلى رقم جوالك");
    } catch (e) {
      const msg =
        e instanceof ApiClientError ? e.message : "تعذّر إرسال رمز التحقق";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const verifyAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace(/\s/g, "").length < 4) {
      setError("الرجاء إدخال رمز التحقق");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // 1. verify OTP → creates session
      await verifyOtp(fullPhone, code.replace(/\s/g, ""), accountType);
      // 2. complete profile (name, email, etc.) — best-effort
      try {
        await completeProfile({
          name: fullName.trim(),
          fullName: fullName.trim(),
          email: email.trim() || undefined,
        });
      } catch {
        /* profile completion can be retried later from settings */
      }
      toast.success("تم إنشاء حسابك بنجاح");
      navigate("dashboard");
    } catch (e) {
      const msg =
        e instanceof ApiClientError ? e.message : "رمز التحقق غير صحيح";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="lg:hidden mb-4">
          <LogoMark size={56} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">إنشاء حساب جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ابدأ رحلتك في الشحن مع مسار إكس
        </p>
      </div>

      {step === "form" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode();
          }}
          className="space-y-4"
        >
          <AccountTypeToggle value={accountType} onChange={setAccountType} />

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
            <Label htmlFor="phone">رقم الجوال</Label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              error={!!error && !isValidSaudiPhone(phone)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
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
            disabled={busy || !formValid}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                إنشاء الحساب
                <ArrowLeft className="h-4 w-4 rtl-flip" />
              </>
            )}
          </Button>

          <div className="flex items-center gap-3 my-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">أو</span>
            <Separator className="flex-1" />
          </div>

          <Button type="button" variant="outline" className="w-full gap-3 h-11">
            <GoogleIcon className="h-4 w-4" />
            التسجيل عبر Google
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyAndComplete} className="space-y-4">
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
              onClick={() => setStep("form")}
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
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                تأكيد وإنشاء الحساب
                <ArrowLeft className="h-4 w-4 rtl-flip" />
              </>
            )}
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
