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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";

export function ProfilePage() {
  const { user, token, completeProfile, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      toast.error("صيغة الآيبان السعودي غير صحيحة؛ يجب أن يبدأ بـ SA ويتكوّن من 24 خانة");
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
        toast.success("تم تحديث الملف الشخصي — أُنشئت صلاحيات إنشاء الشحنات والعمليات المالية بالكامل");
      } else {
        toast.success("تم تحديث الملف الشخصي");
      }
    } catch (e2) {
      toast.error(
        e2 instanceof ApiClientError
          ? e2.message
          : "تعذّر حفظ التعديلات"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword.length < 8) { toast.error("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف"); return; }
    if (newPassword !== confirmPassword) { toast.error("تأكيد كلمة المرور غير مطابق"); return; }
    setChangingPassword(true);
    try {
      await authApi.changePassword(token, { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("تم تحديث كلمة المرور");
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "تعذّر تغيير كلمة المرور");
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
        toast.success("تم تحديث بيانات المتجر — أُنشئت صلاحيات إنشاء الشحنات بالكامل");
      } else {
        toast.success("تم تحديث بيانات المتجر");
      }
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "تعذّر حفظ بيانات المتجر"
      );
    } finally {
      setSavingStore(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الملف الشخصي"
        description="إدارة بياناتك الشخصية وبيانات متجرك."
        action={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 rtl-flip" />
            تسجيل الخروج
          </Button>
        }
      />

      {/* Profile header card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Cover banner */}
          <div className="h-24 bg-brand-gradient relative">
            <div className="absolute inset-0 opacity-20">
              <svg
                viewBox="0 0 800 100"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <pattern
                  id="cover-dots"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1" fill="white" />
                </pattern>
                <rect width="800" height="100" fill="url(#cover-dots)" />
              </svg>
            </div>
          </div>
          <div className="px-5 pb-5 -mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* NEW: Avatar with upload overlay */}
              <ProfileAvatar accountType={user?.accountType === "INDIVIDUAL" ? "customer" : "merchant"} name={user?.name} />
              <div className="flex-1 space-y-1 pt-2">
                <h2 className="text-xl font-bold text-foreground">
                  {user?.name ?? user?.fullName ?? "مستخدم مسار"}
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
                      ? "عميل"
                      : "تاجر"}
                  </Badge>
                  {user?.store?.name && (
                    <Badge variant="outline">{user.store.name}</Badge>
                  )}
                  {user?.status && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {user.status === "ACTIVE" ? "نشط" : user.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              البيانات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Field icon={<User className="h-4 w-4" />} label="الاسم الكامل">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field icon={<Mail className="h-4 w-4" />} label="البريد الإلكتروني">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field icon={<Phone className="h-4 w-4" />} label="رقم الجوال">
                <Input
                  value={user?.phone ?? ""}
                  disabled
                  dir="ltr"
                />
              </Field>
              <Field
                icon={<Hash className="h-4 w-4" />}
                label="الهوية الوطنية / الإقامة"
              >
                <Input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field icon={<MapPin className="h-4 w-4" />} label="المدينة">
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
              <Field icon={<MapPin className="h-4 w-4" />} label="العنوان">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Field>
              <Field icon={<Building2 className="h-4 w-4" />} label="اسم البنك لتحويل مبالغ COD">
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="اسم البنك"
                />
              </Field>
              <Field icon={<CreditCard className="h-4 w-4" />} label="رقم الآيبان لاستلام مستحقات COD">
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
                حفظ التعديلات
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Store info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              بيانات المتجر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveStore} className="space-y-4">
              <Field
                icon={<Building2 className="h-4 w-4" />}
                label="اسم المتجر"
              >
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </Field>
              <Field icon={<Phone className="h-4 w-4" />} label="هاتف المتجر">
                <Input
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field icon={<MapPin className="h-4 w-4" />} label="مدينة المتجر">
                <Input
                  value={storeCity}
                  onChange={(e) => setStoreCity(e.target.value)}
                />
              </Field>
              <Field icon={<MapPin className="h-4 w-4" />} label="عنوان المتجر">
                <Input
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </Field>
              <Separator />
              <Field
                icon={<CreditCard className="h-4 w-4" />}
                label="الرقم الضريبي (VAT)"
              >
                <Input
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field icon={<Hash className="h-4 w-4" />} label="السجل التجاري">
                <Input
                  value={commercialRegister}
                  onChange={(e) => setCommercialRegister(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Button type="submit" disabled={savingStore} className="gap-2">
                {savingStore && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                حفظ بيانات المتجر
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> تغيير كلمة المرور
          </CardTitle>
          <p className="text-xs text-muted-foreground">تُرسل عملية التغيير إلى الخادم بعد التحقق من كلمة المرور الحالية.</p>
          {isDemoMode() && <p className="rounded-md bg-amber-500/5 px-3 py-2 text-xs text-amber-700">وضع العرض التجريبي: هذه العملية محاكاة ولا تغيّر بيانات اعتماد حساب حقيقي.</p>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2"><Label>كلمة المرور الحالية</Label><Input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label>كلمة المرور الجديدة</Label><Input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
            <div className="space-y-2"><Label>تأكيد كلمة المرور الجديدة</Label><Input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
            <div className="md:col-span-3"><Button type="submit" disabled={changingPassword || !token} className="gap-2">{changingPassword && <Loader2 className="h-4 w-4 animate-spin" />} تحديث كلمة المرور</Button></div>
          </form>
        </CardContent>
      </Card>

      {/* Quick settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            إعدادات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingRow
            icon={<Bell className="h-4 w-4" />}
            title="الإشعارات"
            desc="إدارة تفضيلات الإشعارات"
          />
          <SettingRow
            icon={<Globe className="h-4 w-4" />}
            title="اللغة"
            desc="العربية"
          />
          <SettingRow
            icon={<Shield className="h-4 w-4" />}
            title="الأمان والخصوصية"
            desc="كلمة المرور والجلسات النشطة"
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
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors text-right"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
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
  const [preview, setPreview] = useState<string | null>(loadStoredAvatar);
  const label = accountType === "merchant" ? "شعار المتجر" : "الصورة الشخصية";

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
      toast.success(`تم تحديث ${label}`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative shrink-0">
      <div className="h-20 w-20 rounded-full border-4 border-card bg-primary/10 overflow-hidden flex items-center justify-center">
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
        className="absolute bottom-0 left-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
        title={`تحميل ${label}`}
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
