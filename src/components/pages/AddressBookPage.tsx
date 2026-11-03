"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  MapPin,
  Trash2,
  Loader2,
  Phone,
  Mail,
  Send,
  Package,
  Pencil,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials, timeAgo } from "@/lib/format";
import { useTranslation } from "@/i18n";
import type { Customer } from "@/types/api";

/**
 * Address book page — manages both senders (مرسلين) and receivers (مستلمين).
 */
export function AddressBookPage() {
  const { token } = useAuth();
  const { list, loading, error, reload } = useCustomers(token);
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "sender" | "receiver">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<"SENDER" | "RECEIVER" | "BOTH">("BOTH");

  const filtered = useMemo(() => {
    let r = list;
    if (filter !== "all") {
      const want = filter === "sender" ? "SENDER" : "RECEIVER";
      r = r.filter(
        (c) =>
          (c.type ?? "BOTH") === want || (c.type ?? "BOTH") === "BOTH"
      );
    }
    if (q) {
      const lq = q.toLowerCase();
      r = r.filter(
        (c) =>
          (c.name ?? "").toLowerCase().includes(lq) ||
          (c.phone ?? "").toLowerCase().includes(lq) ||
          (c.email ?? "").toLowerCase().includes(lq)
      );
    }
    return r;
  }, [list, q, filter]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setCity("");
    setAddress("");
    setNotes("");
    setType("BOTH");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setName(c.name ?? "");
    setPhone(c.phone ?? "");
    setEmail(c.email ?? "");
    setCity(c.city ?? "");
    setAddress(c.address ?? "");
    setNotes(c.notes ?? "");
    setType((c.type as "SENDER" | "RECEIVER" | "BOTH") ?? "BOTH");
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!name || !phone) {
      toast.error(t("addressBookPage.nameAndPhoneRequired"));
      return;
    }
    setCreating(true);
    try {
      const payload: Partial<Customer> = {
        name,
        fullName: name,
        phone,
        email: email || undefined,
        city,
        address,
        notes: notes || undefined,
        type,
      };
      if (editing) {
        await customersApi.update(token, editing.id, payload);
        toast.success(t("addressBookPage.contactUpdatedToast"));
      } else {
        await customersApi.create(token, payload);
        toast.success(t("addressBookPage.contactAddedToast"));
      }
      setOpen(false);
      resetForm();
      reload();
    } catch (e2) {
      toast.error(
        e2 instanceof ApiClientError
          ? e2.message
          : t("addressBookPage.saveContactFailed")
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm(t("addressBookPage.confirmDeleteContact"))) return;
    try {
      await customersApi.delete(token, id);
      toast.success(t("addressBookPage.deletedToast"));
      reload();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : t("addressBookPage.deleteFailed")
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("addressBookPage.title")}
        description={t("addressBookPage.description")}
        action={
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("addressBookPage.addContactBtn")}
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("addressBookPage.searchPlaceholder")}
            className="ps-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {[
            { v: "all", label: t("addressBookPage.filterAll") },
            { v: "sender", label: t("addressBookPage.filterSenders") },
            { v: "receiver", label: t("addressBookPage.filterReceivers") },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setFilter(opt.v as typeof filter)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === opt.v
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message={t("addressBookPage.loading")} className="py-16" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} className="py-16" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title={q || filter !== "all" ? t("common.noResults") : t("addressBookPage.emptyBookTitle")}
              description={
                q || filter !== "all"
                  ? t("common.tryAdjustingSearch")
                  : t("addressBookPage.emptyBookDesc")
              }
              icon={MapPin}
              action={
                !q && filter === "all" ? (
                  <Button onClick={openCreate} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    {t("addressBookPage.addContactBtn")}
                  </Button>
                ) : undefined
              }
              className="py-16"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={() => openEdit(c)}
              onDelete={() => handleDelete(c.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("addressBookPage.editContactTitle") : t("addressBookPage.addContactTitle")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("addressBookPage.contactTypeLabel")}</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as typeof type)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTH">{t("addressBookPage.typeBoth")}</SelectItem>
                  <SelectItem value="SENDER">{t("addressBookPage.typeSenderOnly")}</SelectItem>
                  <SelectItem value="RECEIVER">{t("addressBookPage.typeReceiverOnly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("addressBookPage.nameLabel")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("addressBookPage.namePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("addressBookPage.phoneLabel")}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("addressBookPage.emailLabel")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("addressBookPage.cityLabel")}</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("addressBookPage.addressLabel")}</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("addressBookPage.notesLabel")}</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("addressBookPage.notesPlaceholder")}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={creating}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? t("common.saveChanges") : t("addressBookPage.addContactSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Customer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const contactType = (contact.type ?? "BOTH") as string;
  const isSender = contactType === "SENDER" || contactType === "BOTH";
  const isReceiver = contactType === "RECEIVER" || contactType === "BOTH";

  return (
    <Card className="group relative hover:shadow-brand transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 border border-border shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials(contact.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {contact.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {contact.shipmentsCount
                ? t("addressBookPage.shipmentsCount", { count: contact.shipmentsCount })
                : t("addressBookPage.newBadge")}
              {contact.createdAt && ` • ${timeAgo(contact.createdAt)}`}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
              aria-label={t("common.edit")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label={t("common.delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Type badges */}
        <div className="flex flex-wrap gap-1">
          {isSender && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 gap-1">
              <Send className="h-3 w-3" />
              {t("addressBookPage.senderBadge")}
            </Badge>
          )}
          {isReceiver && (
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 gap-1">
              <Package className="h-3 w-3" />
              {t("addressBookPage.receiverBadge")}
            </Badge>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span className="font-mono" dir="ltr">
              {contact.phone ?? t("common.none")}
            </span>
          </div>
          {contact.email && (
            <div className="flex items-center gap-2 text-muted-foreground truncate">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {(contact.city || contact.address) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {contact.city}
                {contact.address ? ` — ${contact.address}` : ""}
              </span>
            </div>
          )}
        </div>

        {contact.notes && (
          <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
            {contact.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
