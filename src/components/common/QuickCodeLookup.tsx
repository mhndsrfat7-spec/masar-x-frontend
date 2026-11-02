"use client";

import { useState } from "react";
import { Zap, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { addressLookupApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import type { Customer } from "@/types/api";
import { cn } from "@/lib/utils";

interface QuickCodeLookupProps {
  token: string | null;
  /** Which side this lookup fills — used in success message. */
  target: "sender" | "receiver";
  /** Called when a contact is resolved — caller fills its form fields. */
  onResolved: (contact: Customer, code: string) => void;
  className?: string;
}

/**
 * Inline short-code lookup (SPL like RRMA2929 or customer #MX-1024).
 *
 * Sits at the top of the Sender / Receiver cards in CreateShipmentPage.
 * On success, fires `onResolved` and the parent flashes the fields green
 * (ring-2 ring-emerald-500 transition-all) without leaving the page.
 */
export function QuickCodeLookup({
  token,
  target,
  onResolved,
  className,
}: QuickCodeLookupProps) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("أدخل رمزاً للبحث");
      return;
    }
    if (!token) {
      toast.error("الرجاء تسجيل الدخول أولاً");
      return;
    }
    setBusy(true);
    try {
      const result = await addressLookupApi.lookup(token, trimmed);
      onResolved(result.contact, result.code);
      setCode("");
      // Trigger green flash effect
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
      toast.success(
        `تم جلب بيانات ${target === "sender" ? "المرسِل" : "المستلِم"} من ${result.source === "SPL" ? "العنوان الوطني" : "جهة الاتصال"}`
      );
    } catch (e) {
      const err = e as ApiClientError;
      toast.error(err.message || "لم يتم العثور على سجل بهذا الرمز");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleLookup}
      className={cn(
        "rounded-lg border bg-emerald-50/40 p-2.5 transition-all",
        flash ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-emerald-200",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-emerald-600 shrink-0 ms-1" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="إدخال سريع: رمز SPL (RRMA2929) أو معرّف العميل (#MX-1024)"
          className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/70"
          dir="ltr"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Zap className="h-3 w-3" />
          )}
          جلب بالرمز
        </button>
      </div>
    </form>
  );
}
