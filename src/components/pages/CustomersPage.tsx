"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Users as UsersIcon,
  Phone,
  MapPin,
  Trash2,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useData";
import { customersApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, timeAgo } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Customer } from "@/types/api";

/**
 * Customers page — alias for the address book (legacy).
 * For sender/receiver management use the dedicated /address-book page.
 */
export function CustomersPage() {
  const { token } = useAuth();
  const { list, loading, error, reload } = useCustomers(token);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const filtered = useMemo(() => {
    if (!q) return list;
    const lq = q.toLowerCase();
    return list.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(lq) ||
        (c.phone ?? "").toLowerCase().includes(lq) ||
        (c.email ?? "").toLowerCase().includes(lq)
    );
  }, [list, q]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!name || !phone) {
      toast.error("الاسم ورقم الجوال مطلوبان");
      return;
    }
    setCreating(true);
    try {
      await customersApi.create(token, {
        name,
        fullName: name,
        phone,
        email,
        city,
        address,
      });
      toast.success("تم إضافة العميل بنجاح");
      setOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setCity("");
      setAddress("");
      reload();
    } catch (e2) {
      toast.error(e2 instanceof ApiClientError ? e2.message : "تعذّر إضافة العميل");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    try {
      await customersApi.delete(token, id);
      toast.success("تم حذف العميل");
      reload();
    } catch (e) {
      toast.error(e instanceof ApiClientError ? e.message : "تعذّر حذف العميل");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="العملاء"
        description="إدارة عملائك ودفتر العناوين."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة عميل جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>الاسم *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الجوال *</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    placeholder="05XXXXXXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>المدينة</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={creating} className="gap-2">
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    حفظ العميل
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو الجوال أو البريد…"
          className="pr-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingState message="جارٍ تحميل العملاء…" className="py-16" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} className="py-16" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title={q ? "لا توجد نتائج" : "لا يوجد عملاء بعد"}
              description={q ? "جرّب تعديل البحث" : "أضف أول عميل لبدء تنظيم دفتر العناوين."}
              icon={UsersIcon}
              action={
                !q && (
                  <Button onClick={() => setOpen(true)} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    إضافة عميل
                  </Button>
                )
              }
              className="py-16"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              onDelete={() => handleDelete(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerCard({
  customer,
  onDelete,
}: {
  customer: Customer;
  onDelete: () => void;
}) {
  return (
    <Card className="group relative hover:shadow-brand transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 border border-border shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {customer.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {customer.shipmentsCount
                ? `${customer.shipmentsCount} شحنة`
                : "عميل جديد"}
              {customer.createdAt && ` • ${timeAgo(customer.createdAt)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="حذف العميل"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span className="font-mono" dir="ltr">
              {customer.phone ?? "—"}
            </span>
          </div>
          {customer.email && (
            <div className="flex items-center gap-2 text-muted-foreground truncate">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {(customer.city || customer.address) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">
                {customer.city}
                {customer.address ? ` — ${customer.address}` : ""}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
