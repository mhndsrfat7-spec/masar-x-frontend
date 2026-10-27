"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Lock,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand/Logo";
import { AccountTypeToggle } from "./AccountTypeToggle";
import { PhoneInput } from "./PhoneInput";
import { SecureFooter } from "./SecureFooter";
import { Button } from "@/components/ui/button";
import { useAuth, type UiAccountType } from "@/hooks/useAuth";
import { useRouterStore } from "@/store/routerStore";
import { ApiClientError } from "@/lib/api/client";
import { isValidSaudiPhone, normalizeSaudiPhone } from "@/lib/format";
import { isDemoMode } from "@/lib/api/services";

/**
 * Login form — phone + password (matches brand reference image).
 *
 * Behavior:
 *  - Demo mode: password is ignored, login auto-succeeds with mock OTP "1234".
 *  - Real mode: sends an OTP request first; UI then prompts for the OTP code.
 *    A "نسيت كلمة المرور؟" link is shown (currently a placeholder).
 *
 * NOTE: The backend currently exposes OTP-only auth for merchants. When a
 * password-login endpoint is added, swap loginWithPassword() for it.
 * See BACKEND_NOTES.md.
 */
export function LoginForm() {
  const { loginWithPassword } = useAuth();
  const navigate = useRouterStore((s) => s.navigate);

  const [accountType, setAccountType] = useState<UiAccountType>("merchant");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = normalizeSaudiPhone(phone);
  const phoneValid = isValidSaudiPhone(phone);
  const passwordValid = password.length >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneValid) {
      setError("الرجاء إدخال رقم جوال سعودي صحيح");
      return;
    }
    if (!passwordValid) {
      setError("كلمة المرور يجب أن تكون 4 أحرف على الأقل");
      return;
    }

    setSubmitting(true);
    try {
      await loginWithPassword(fullPhone, password, accountType);
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (e) {
      const err = e as ApiClientError;
      if (err.code === "OTP_REQUIRED") {
        // OTP flow required — show prompt below
        setError(err.message || "تم إرسال رمز تحقق، الرجاء إدخاله");
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

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="lg:hidden mb-4">
          <LogoMark size={56} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          مرحباً بك في مسار إكس — شحنك أدق وأعمالك أسرع
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AccountTypeToggle value={accountType} onChange={setAccountType} />

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            رقم الجوال
          </label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            error={!!error && !phoneValid}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              كلمة المرور
            </label>
            <button
              type="button"
              onClick={() => {
                toast.info("سيتم توفير استعادة كلمة المرور قريباً");
              }}
              className="text-xs text-primary hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
          <div
            className={`relative flex items-stretch rounded-xl border-2 bg-card overflow-hidden transition-colors ${
              error && !passwordValid
                ? "border-destructive focus-within:border-destructive"
                : "border-border focus-within:border-primary"
            }`}
            dir="ltr"
          >
            <div className="flex items-center px-3 border-l-2 border-border bg-muted/50">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="password"
              type={showPass ? "text" : "password"}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="flex-1 bg-transparent px-3 py-3 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="flex items-center px-3 border-r-2 border-border bg-muted/30 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPass ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs text-destructive flex items-start gap-2">
            <KeyRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isDemoMode() && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
            <strong>وضع تجريبي:</strong> استخدم أي رقم جوال سعودي + أي كلمة مرور
            (4 أحرف على الأقل) لتسجيل الدخول.
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 text-base font-semibold h-12"
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
        </Button>
      </form>

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
