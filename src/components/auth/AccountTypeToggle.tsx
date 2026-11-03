"use client";

import { Building2, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UiAccountType } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n";

interface AccountTypeToggleProps {
  value: UiAccountType;
  onChange: (v: UiAccountType) => void;
  className?: string;
  /**
   * "segmented" (default) — pill-shaped segmented control, compact.
   * "cards" — two large side-by-side cards with descriptions, used on
   *   register page and on the login phone-input screen per brand reference.
   */
  variant?: "segmented" | "cards";
}

/**
 * Toggle between Merchant (تاجر) and Customer (عميل) account types.
 *
 * Two visual variants:
 *  - "segmented": pill control — used in login form (compact).
 *  - "cards": two large cards with check badge — used in register form
 *    and matches the brand reference (images 2 & 4).
 */
export function AccountTypeToggle({
  value,
  onChange,
  className,
  variant = "segmented",
}: AccountTypeToggleProps) {
  if (variant === "cards") {
    return <CardsVariant value={value} onChange={onChange} className={className} />;
  }
  return <SegmentedVariant value={value} onChange={onChange} className={className} />;
}

/* ============================= Segmented ============================= */
function SegmentedVariant({
  value,
  onChange,
  className,
}: {
  value: UiAccountType;
  onChange: (v: UiAccountType) => void;
  className?: string;
}) {
  const { t } = useTranslation();

  const options: {
    value: UiAccountType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "merchant",
      label: t("auth.merchantAccount"),
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      value: "customer",
      label: t("auth.customerAccount"),
      icon: <User className="h-4 w-4" />,
    },
  ];

  return (
    <div
      className={cn(
        "relative grid grid-cols-2 gap-1 rounded-full bg-muted p-1",
        className
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn(active ? "text-primary-foreground" : "text-muted-foreground")}>
              {opt.icon}
            </span>
            <span>{opt.label}</span>
            {active && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* =============================== Cards ===============================
 * Matches brand reference: two large cards, active one with green border
 * (#689F38) + soft green background (#EFF5EA) + circular check badge.
 * ==================================================================== */
function CardsVariant({
  value,
  onChange,
  className,
}: {
  value: UiAccountType;
  onChange: (v: UiAccountType) => void;
  className?: string;
}) {
  const { t } = useTranslation();

  const options: {
    value: UiAccountType;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "merchant",
      label: t("auth.merchantAccount"),
      desc: t("auth.merchantAccountDesc"),
      icon: <Building2 className="h-6 w-6" />,
    },
    {
      value: "customer",
      label: t("auth.customerAccount"),
      desc: t("auth.customerAccountDesc"),
      icon: <User className="h-6 w-6" />,
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)} role="tablist">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all",
              active
                ? "shadow-sm"
                : "border-border bg-card hover:border-[#689F38]/40 hover:bg-muted/30"
            )}
            style={
              active
                ? {
                    borderColor: "#689F38",
                    backgroundColor: "#EFF5EA",
                  }
                : undefined
            }
          >
            {/* Circular check badge */}
            {active && (
              <span
                className="absolute top-2.5 end-2.5 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm"
                style={{ backgroundColor: "#689F38" }}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}

            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                active ? "text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
              )}
              style={active ? { backgroundColor: "#689F38" } : undefined}
            >
              {opt.icon}
            </div>

            <div className="space-y-0.5">
              <p
                className={cn(
                  "text-sm font-bold",
                  active ? "text-[#0F352E]" : "text-foreground"
                )}
              >
                {opt.label}
              </p>
              <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
