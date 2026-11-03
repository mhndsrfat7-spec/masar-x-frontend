"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Star,
  Copy,
  Check,
  Landmark,
  Loader2,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { bankAccountsApi, type SavedBankAccount } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

interface SavedBankAccountsProps {
  token: string | null;
  /** When provided, clicking an account calls onSelect instead of just highlighting. */
  onSelect?: (account: SavedBankAccount) => void;
  /** Compact mode: hides the "add new" button (useful inside topup dialogs). */
  compact?: boolean;
}

const BANK_KEYS = [
  "alrajhi",
  "alinma",
  "snb",
  "riyad",
  "sabb",
  "anb",
  "aljazira",
  "albilad",
  "mcb",
  "saib",
  "gib",
  "albaraka",
  "stcpay",
  "other",
] as const;

function isValidSaudiIban(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  return /^SA\d{22}$/.test(cleaned);
}

export function SavedBankAccounts({
  token,
  onSelect,
  compact = false,
}: SavedBankAccountsProps) {
  const { t, dict } = useTranslation();
  const saudiBanks = BANK_KEYS.map((k) => dict.bankAccounts.banks[k]);

  const [accounts, setAccounts] = useState<SavedBankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState(saudiBanks[0]);
  const [iban, setIban] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await bankAccountsApi.list(token);
      setAccounts(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setLabel("");
    setHolderName("");
    setBankName(saudiBanks[0]);
    setIban("");
    setIsDefault(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!holderName.trim()) {
      toast.error(t("bankAccounts.enterHolderNameError"));
      return;
    }
    if (!isValidSaudiIban(iban)) {
      toast.error(t("bankAccounts.invalidSaudiIbanError"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: label.trim() || `${bankName} — ${iban.slice(-4)}`,
        accountHolderName: holderName.trim(),
        bankName,
        iban: iban.replace(/\s/g, "").toUpperCase(),
        isDefault,
      };
      if (editingId) {
        await bankAccountsApi.update(token, editingId, payload);
        toast.success(t("bankAccounts.accountUpdatedToast"));
      } else {
        await bankAccountsApi.create(token, payload);
        toast.success(t("bankAccounts.accountSavedToast"));
      }
      resetForm();
      setAddOpen(false);
      void load();
    } catch (e) {
      const err = e as ApiClientError;
      toast.error(err.message || t("bankAccounts.saveAccountFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm(t("bankAccounts.confirmDeleteAccount"))) return;
    try {
      await bankAccountsApi.delete(token, id);
      toast.success(t("bankAccounts.accountDeletedToast"));
      void load();
    } catch (e) {
      const err = e as ApiClientError;
      toast.error(err.message || t("bankAccounts.deleteFailed"));
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    try {
      await bankAccountsApi.update(token, id, { isDefault: true });
      void load();
    } catch {
      toast.error(t("bankAccounts.setDefaultFailed"));
    }
  };

  const handleCopyIban = async (acct: SavedBankAccount) => {
    try {
      await navigator.clipboard.writeText(acct.iban);
      setCopiedId(acct.id);
      toast.success(t("bankAccounts.ibanCopiedToast"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(t("common.copyFailed"));
    }
  };

  const handleEdit = (acct: SavedBankAccount) => {
    setEditingId(acct.id);
    setLabel(acct.label);
    setHolderName(acct.accountHolderName);
    setBankName(acct.bankName);
    setIban(acct.iban);
    setIsDefault(acct.isDefault);
    setAddOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary" />
          {t("bankAccounts.title")}
        </h3>
        {!compact && (
          <Dialog
            open={addOpen}
            onOpenChange={(v) => {
              setAddOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {t("bankAccounts.addAccount")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? t("bankAccounts.editAccountTitle") : t("bankAccounts.addAccountTitle")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ba-label">{t("bankAccounts.shortLabel")}</Label>
                  <Input
                    id="ba-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={t("bankAccounts.shortLabelPlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ba-holder">{t("bankAccounts.holderNameLabel")}</Label>
                  <Input
                    id="ba-holder"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder={t("bankAccounts.holderNamePlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ba-bank">{t("bankAccounts.bankLabel")}</Label>
                  <select
                    id="ba-bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    {saudiBanks.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ba-iban">{t("bankAccounts.ibanLabel")}</Label>
                  <Input
                    id="ba-iban"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="SA0080000000000000000000"
                    dir="ltr"
                    className="font-mono"
                    required
                  />
                  {iban && !isValidSaudiIban(iban) && (
                    <p className="text-[11px] text-destructive">{t("bankAccounts.invalidIbanFormat")}</p>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">{t("bankAccounts.setAsDefaultCheckbox")}</span>
                </label>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setAddOpen(false); resetForm(); }}
                    disabled={saving}
                    className="flex-1"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingId ? t("bankAccounts.saveEdit") : t("bankAccounts.saveAccount")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("bankAccounts.loadingAccounts")}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            {t("bankAccounts.emptyAccounts")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {accounts.map((acct) => (
            <li
              key={acct.id}
              className={cn(
                "group flex items-center gap-3 rounded-lg border p-3 transition-all",
                acct.isDefault
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card hover:border-primary/20"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                acct.isDefault ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Landmark className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{acct.label}</p>
                  {acct.isDefault && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      {t("common.default")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{acct.bankName} — {acct.accountHolderName}</p>
                <button
                  type="button"
                  onClick={() => handleCopyIban(acct)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary font-mono mt-0.5"
                  dir="ltr"
                >
                  {copiedId === acct.id ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {acct.iban}
                </button>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onSelect && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelect(acct)}
                    className="h-7 px-2 text-xs"
                  >
                    {t("common.select")}
                  </Button>
                )}
                {!onSelect && (
                  <>
                    {!acct.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(acct.id)}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title={t("common.setAsDefault")}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(acct)}
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title={t("common.edit")}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(acct.id)}
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
