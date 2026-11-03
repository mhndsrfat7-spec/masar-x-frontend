"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { securityApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { useTranslation } from "@/i18n";

interface PasswordConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Bearer token of the authenticated user. */
  token: string | null;
  /** Human-readable description of the action being confirmed. */
  actionDescription: string;
  /** Called after password verification succeeds. */
  onConfirmed: () => void | Promise<void>;
}

/**
 * Lightweight password-only confirmation modal.
 *
 * Used before sensitive actions (withdraw to bank, bank-account edit,
 * bank-transfer topup submit) so the merchant doesn't re-enter bank details
 * — just confirms identity with their account password.
 */
export function PasswordConfirmModal({
  open,
  onOpenChange,
  token,
  actionDescription,
  onConfirmed,
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPassword("");
      setBusy(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(t("passwordModal.enterPasswordError"));
      return;
    }
    if (!token) {
      setError(t("common.sessionExpiredLoginAgain"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await securityApi.verifyPassword(token, password);
      await onConfirmed();
      onOpenChange(false);
    } catch (e) {
      const err = e as ApiClientError;
      const msg = err.message || t("passwordModal.wrongPasswordError");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            {t("passwordModal.title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {actionDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 pt-3 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
              {t("passwordModal.passwordLabel")}
            </label>
            <div className="relative flex items-stretch rounded-lg border border-border bg-card overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15" dir="ltr">
              <div className="flex items-center px-3 border-l border-border bg-muted/40 text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="confirm-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                placeholder="••••••••"
                className="flex-1 bg-transparent px-3 py-2.5 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70 placeholder:font-normal"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={busy || !password}
              className="flex-1 gap-2"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("auth.verifying")}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  {t("common.confirm")}
                </>
              )}
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            {t("passwordModal.securityNote")}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
