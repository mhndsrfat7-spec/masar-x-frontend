"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  Loader2,
  LogOut,
  Hash,
  CreditCard,
  Shield,
  Settings,
  Bell,
  Globe,
  KeyRound,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { authApi, isDemoMode, storesApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { clearProfileRestriction } from "@/lib/profileCompletion";
import { PageHeader } from "@/components/common/PageHeader";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";
import { useTranslation } from "@/i18n";

export function ProfilePage() {
  const { user, token, completeProfile, logout, accountType } = useAuth();
  const { t, locale } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // The existing authenticated account type is the source of truth.
  // Also honor the already-present profile fields for older sessions.
  const isIndividualAccount =
    accountType === "customer" ||
    user?.accountType === "INDIVIDUAL" ||
    user?.accountType === ("customer" as never) ||
    user?.role === "CUSTOMER";

  // Profile fields
  const [name, setName] = useState(user?.name ?? user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [nationalId, setNationalId] = useState(user?.nationalId ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [iban, setIban] = useState(user?.iban ?? "");
  const [bankName, setBankName] = useState(user?.bankName ?? "");

  // Store fields
  const [storeName, setStoreName] = useState(user?.store?.name ?? "");
  const [storePhone, setStorePhone] = useState(user?.store?.phone ?? "");
  const [storeCity, setStoreCity] = useState(user?.store?.city ?? "");
  const [storeAddress, setStoreAddress] = useState(
    user?.store?.address ?? ""
  );
  const [vatNumber, setVatNumber] = useState(user?.store?.vatNumber ?? "");
  const [commercialRegister, setCommercialRegister] = useState(
    user?.store?.commercialRegister ?? user?.store?.crNumber ?? ""
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedIban = iban.replace(/\s+/g, "").toUpperCase();
    if (normalizedIban && !/^SA\d{22}$/.test(normalizedIban)) {
      toast.error(t("profilePage.errors.invalidSaudiIban"));
      return;
    }
    setSaving(true);
    try {
      await completeProfile({
        name,
        fullName: name,
        email: email || undefined,
        nationalId: nationalId || undefined,
        city: city || undefined,
        address: address || undefined,
        bankName: bankName.trim() || undefined,
        iban: normalizedIban || undefined,
      });
      // Profile saved with name + email → lift any restricted-browsing flag.
      if (name.trim().length >= 3 && email.trim()) {
        clearProfileRestriction();
        toast.success(t("profilePage.errors.profileUpdatedFullAccessToast"));
      } else {
        toast.success(t("profilePage.errors.profileUpdatedToast"));
      }
    } catch (e2) {
      toast.error(
        e2 instanceof ApiClientError
          ? e2.message
          : t("profilePage.errors.saveChangesFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword.length < 8) { toast.error(t("auth.errors.newPasswordMin8")); return; }
    if (newPassword !== confirmPassword) { toast.error(t("auth.errors.passwordConfirmationMismatch")); return; }
    setChangingPassword(true);
    try {
      await authApi.changePassword(token, { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("profilePage.errors.passwordUpdatedToast"));
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : t("profilePage.errors.changePasswordFailed"));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingStore(true);
    try {
      await storesApi.update(token, {
        name: storeName,
        storeName: storeName,
        phone: storePhone,
        city: storeCity,
        address: storeAddress,
        vatNumber,
        commercialRegister,
        crNumber: commercialRegister,
      });
      // Reflect the saved store on the auth user so isProfileComplete() sees it.
      useAuthStore.getState().update({
        store: {
          ...(user?.store ?? {}),
          name: storeName,
          storeName,
          phone: storePhone,
          city: storeCity,
          address: storeAddress,
          vatNumber,
          commercialRegister,
          crNumber: commercialRegister,
        },
      });
      // Merchant store details filled → lift restricted-browsing flag if profile is otherwise complete.
      if (storeName.trim().length >= 2 && commercialRegister.trim().length >= 4) {
        clearProfileRestriction();
        toast.success(t("profilePage.errors.storeUpdatedFullAccessToast"));
      } else {
        toast.success(t("profilePage.errors.storeUpdatedToast"));
      }
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("profilePage.errors.saveStoreFailed")
      );
    } finally {
      setSavingStore(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("profilePage.title")}
        description={t("profilePage.description")}
        action={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 rtl-flip" />
            {t("nav.logout")}
          </Button>
        }
      />

      {/* Profile header card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Cover banner */}
          <div className="profile-cover-surface brand-wave-surface relative h-24 overflow-hidden">
            <div className="brand-wave-lines" aria-hidden="true">
              <svg viewBox="0 0 900 180" preserveAspectRatio="none">
                <path className="brand-wave-line brand-wave-line-one" d="M0 112 C150 35 270 165 430 98 S700 42 900 105" />
                <path className="brand-wave-line brand-wave-line-two" d="M0 142 C170 72 300 190 480 128 S730 72 900 132" />
              </svg>
            </div>
            <div className="pointer-events-none absolute -end-8 -top-16 h-44 w-44 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -end-1 -top-9 h-28 w-28 rounded-full border border-white/[0.07]" />
          </div>
          <div className="px-5 pb-5 -mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* NEW: Avatar with upload overlay */}
              <ProfileAvatar accountType={isIndividualAccount ? "customer" : "merchant"} name={user?.name} />
              <div className="flex-1 space-y-1 pt-2">
                <h2 className="text-xl font-bold text-foreground">
                  {user?.name ?? user?.fullName ?? t("nav.masarUser")}
                </h2>
                <p
                  className="text-sm text-muted-foreground font-mono"
                  dir="ltr"
                >
                  {user?.phone ?? ""}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/20"
                  >
                    {user?.accountType === "INDIVIDUAL" ||
                    user?.accountType === ("customer" as never)
                      ? t("auth.customerBadge")
                      : t("auth.merchantBadge")}
                  </Badge>
                  {user?.store?.name && (
                    <Badge variant="outline">{user.store.name}</Badge>
                  )}
                  {user?.status && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {user.status === "ACTIVE" ? t("common.activeStatus") : user.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={`grid grid-cols-1 gap-6 ${isIndividualAccount ? "lg:grid-cols-1" : "lg:grid-cols-2"}`}>
        {/* Personal info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              {t("profilePage.personalInfoTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Field icon={<User className="h-4 w-4" />} label={t("profilePage.fullNameLabel")}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field icon={<Mail className="h-4 w-4" />} label={t("profilePage.emailLabel")}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field icon={<Phone className="h-4 w-4" />} label={t("profilePage.phoneLabel")}>
                <Input
                  value={user?.phone ?? ""}
                  disabled
                  dir="ltr"
                />
              </Field>
              <Field
                icon={<Hash className="h-4 w-4" />}
                label={t("profilePage.nationalIdLabel")}
              >
                <Input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field icon={<MapPin className="h-4 w-4" />} label={t("profilePage.cityLabel")}>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
              <Field icon={<MapPin className="h-4 w-4" />} label={t("profilePage.addressLabel")}>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Field>
              <Field icon={<Building2 className="h-4 w-4" />} label={t("profilePage.codBankNameLabel")}>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={t("profilePage.codBankNamePlaceholder")}
                />
              </Field>
              <Field icon={<CreditCard className="h-4 w-4" />} label={t("profilePage.codIbanLabel")}>
                <Input
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  placeholder="SA00 0000 0000 0000 0000 0000"
                  dir="ltr"
                  autoComplete="off"
                />
              </Field>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                {t("common.saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Store info — merchant accounts only */}
        {!isIndividualAccount && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {t("profilePage.storeInfoTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveStore} className="space-y-4">
              <Field
                icon={<Building2 className="h-4 w-4" />}
                label={t("profilePage.storeNameLabel")}
              >
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </Field>
              <Field icon={<Phone className="h-4 w-4" />} label={t("profilePage.storePhoneLabel")}>
                <Input
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field icon={<MapPin className="h-4 w-4" />} label={t("profilePage.storeCityLabel")}>
                <Input
                  value={storeCity}
                  onChange={(e) => setStoreCity(e.target.value)}
                />
              </Field>
              <Field icon={<MapPin className="h-4 w-4" />} label={t("profilePage.storeAddressLabel")}>
                <Input
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </Field>
              <Separator />
              <Field
                icon={<CreditCard className="h-4 w-4" />}
                label={t("profilePage.vatNumberLabel")}
              >
                <Input
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field icon={<Hash className="h-4 w-4" />} label={t("profilePage.crNumberLabel")}>
                <Input
                  value={commercialRegister}
                  onChange={(e) => setCommercialRegister(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Button type="submit" disabled={savingStore} className="gap-2">
                {savingStore && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                {t("profilePage.saveStoreBtn")}
              </Button>
            </form>
          </CardContent>
        </Card>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> {t("profilePage.changePasswordTitle")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t("profilePage.changePasswordDesc")}</p>
          {isDemoMode() && <p className="rounded-md bg-amber-500/5 px-3 py-2 text-xs text-amber-700">{t("profilePage.changePasswordDemoNotice")}</p>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2"><Label>{t("profilePage.currentPasswordLabel")}</Label><Input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("profilePage.newPasswordLabel")}</Label><Input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
            <div className="space-y-2"><Label>{t("profilePage.confirmNewPasswordLabel")}</Label><Input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
            <div className="md:col-span-3"><Button type="submit" disabled={changingPassword || !token} className="gap-2">{changingPassword && <Loader2 className="h-4 w-4 animate-spin" />} {t("profilePage.updatePasswordBtn")}</Button></div>
          </form>
        </CardContent>
      </Card>

      {/* Quick settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            {t("profilePage.quickSettingsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingRow
            icon={<Bell className="h-4 w-4" />}
            title={t("profilePage.notificationsSettingTitle")}
            desc={t("profilePage.notificationsSettingDesc")}
          />
          <SettingRow
            icon={<Globe className="h-4 w-4" />}
            title={t("profilePage.languageSettingTitle")}
            desc={locale === "ar" ? t("common.arabic") : t("common.english")}
            action={<LanguageSwitcher variant="settings" />}
          />
          <SettingRow
            icon={<Shield className="h-4 w-4" />}
            title={t("profilePage.securitySettingTitle")}
            desc={t("profilePage.securitySettingDesc")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}

function SettingRow({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors text-start">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {action}
    </div>
  );
}

/* ============================================================================
 * NEW: ProfileAvatar — avatar with upload overlay for customer/store logo.
 * Persists the chosen image to localStorage so it stays across page navigation.
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

function ProfileAvatar({
  accountType,
  name,
}: {
  accountType: "merchant" | "customer";
  name?: string;
}) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(loadStoredAvatar);
  const label = accountType === "merchant" ? t("auth.storeLogo") : t("auth.profilePicture");

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
      toast.success(t("auth.errors.imageUpdatedToast", { label }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative shrink-0">
      <div className="h-20 w-20 rounded-full border-4 border-card bg-emerald-50 overflow-hidden flex items-center justify-center">
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-primary text-2xl font-bold">
            {initials(name)}
          </span>
        )}
      </div>
      <label
        htmlFor="profile-avatar-upload"
        className="absolute bottom-0 end-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
        title={t("auth.uploadLabel", { label })}
      >
        <Camera className="h-3.5 w-3.5" />
      </label>
      <input
        id="profile-avatar-upload"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
