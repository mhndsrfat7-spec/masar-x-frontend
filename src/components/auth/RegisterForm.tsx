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
import { useTranslation } from "@/i18n";
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
  const { t } = useTranslation();

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
      setError(t("auth.errors.invalidSaudiPhone"));
      return;
    }
    if (!agree) {
      setError(t("auth.errors.mustAgreeTerms"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestOtp(fullPhone, accountType);
      setStep("otp");
      toast.success(t("auth.errors.otpSentToPhoneToast"));
    } catch (e2) {
      const msg = e2 instanceof ApiClientError ? e2.message : t("auth.errors.sendOtpFailed");
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
      setError(t("auth.errors.pleaseEnterOtp"));
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
      toast.success(t("auth.errors.otpVerifiedCompleteProfile"));
    } catch (e2) {
      const msg = e2 instanceof ApiClientError ? e2.message : t("auth.errors.invalidOtpCode");
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
      setError(t("auth.errors.completeAllFieldsCorrectly"));
      return;
    }
    const accessToken = heldSession?.accessToken;
    if (!accessToken) {
      setError(t("auth.errors.sessionExpiredReverify"));
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
      toast.success(t("auth.errors.accountCreatedSuccess"));
      if (profileSaveFailed) {
        toast.warning(t("auth.errors.profileSaveWarning"));
      }
      if (storeSaveFailed) {
        toast.warning(t("auth.errors.storeSaveWarning"));
      }
      navigate("dashboard");
    } catch (e2) {
      const msg = e2 instanceof ApiClientError ? e2.message : t("auth.errors.completeRegistrationFailed");
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
      setError(t("auth.errors.sessionExpiredReverify"));
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
    toast.info(t("auth.errors.restrictedBrowsingEntered"));
    navigate("dashboard");
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="lg:hidden mb-4 flex justify-center">
          <LogoMark size={56} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t("auth.registerTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("auth.registerSubtitle")}
        </p>
        {/* Step indicator (in-place, no page movement) */}
        <StepIndicator step={step} />
      </div>

      {step === "phone" && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <AccountTypeToggle value={accountType} onChange={setAccountType} variant="cards" />

          <div className="space-y-2">
            <Label htmlFor="phone">{t("auth.phoneLabel")}</Label>
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
              {t("auth.iAgreeTo")}{" "}
              <a href="#" className="text-primary hover:underline">
                {t("auth.termsOfUse")}
              </a>{" "}
              {t("auth.and")}{" "}
              <a href="#" className="text-primary hover:underline">
                {t("auth.privacyPolicy")}
              </a>{" "}
              {t("auth.termsPlatformSuffix")}
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
                {t("auth.confirmAndSendOtp")}
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
              {t("auth.otpSentTo")}
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
              {t("auth.editPhoneNumber")}
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">{t("auth.otpCodeLabel")}</Label>
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
                {t("auth.confirmCodeAndContinue")}
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
                <Label htmlFor="register-store-name">{t("auth.storeNameLabel")}</Label>
                <Input
                  id="register-store-name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={t("auth.storeNamePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="register-cr">{t("auth.crNumberLabel")}</Label>
                <Input
                  id="register-cr"
                  value={commercialRegister}
                  onChange={(e) => setCommercialRegister(e.target.value)}
                  placeholder={t("auth.crNumberPlaceholder")}
                  dir="ltr"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t("auth.fullNameLabel")}</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("auth.fullNamePlaceholder")}
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.emailLabel")}</Label>
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
            <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
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
                aria-label={showPass ? t("auth.hidePassword") : t("auth.showPassword")}
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
            <Label htmlFor="confirm-password">{t("auth.confirmPasswordLabel")}</Label>
            <Input
              id="confirm-password"
              type="password"
              dir="ltr"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("auth.confirmPasswordPlaceholder")}
              autoComplete="new-password"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">{t("auth.passwordMismatch")}</p>
            )}
          </div>

          {!isDemoMode() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              {t("auth.realRegisterBackendNotice")}
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
                {t("auth.saveAndCompleteRegister")}
                <Check className="h-4 w-4" />
              </>
            )}
          </Button>

          <div className="flex items-center gap-3 my-1">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t("common.or")}</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 h-11"
            onClick={handleSkipProfile}
            disabled={busy}
          >
            {t("auth.skipNowCompleteLater")}
            <ArrowLeft className="h-4 w-4 rtl-flip" />
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.alreadyHaveAccount")}{" "}
        <button
          type="button"
          onClick={() => navigate("login")}
          className="font-semibold text-primary hover:underline"
        >
          {t("auth.loginLink")}
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
  const { t } = useTranslation();
  const steps: { id: RegisterStep; label: string }[] = [
    { id: "phone", label: t("auth.stepPhone") },
    { id: "otp", label: t("auth.stepOtp") },
    { id: "profile", label: t("auth.stepProfile") },
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
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(loadStoredAvatar);
  const isMerchant = accountType === "merchant";
  const label = isMerchant ? t("auth.storeLogo") : t("auth.profilePicture");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("auth.errors.imageSizeMax5MB"));
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
      toast.success(t("auth.errors.imageSavedToast", { label }));
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
          title={t("auth.uploadLabel", { label })}
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
          {t("auth.avatarHelpText")}
        </p>
      </div>
    </div>
  );
}
