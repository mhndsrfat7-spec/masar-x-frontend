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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { storesApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
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

  // Profile fields
  const [name, setName] = useState(user?.name ?? user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [nationalId, setNationalId] = useState(user?.nationalId ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [address, setAddress] = useState(user?.address ?? "");

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
    setSaving(true);
    try {
      await completeProfile({
        name,
        fullName: name,
        email: email || undefined,
        nationalId: nationalId || undefined,
        city: city || undefined,
        address: address || undefined,
      });
      toast.success("تم تحديث الملف الشخصي");
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
      toast.success("تم تحديث بيانات المتجر");
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
              <Avatar className="h-20 w-20 border-4 border-card shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
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
                    user?.accountType === "customer"
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
