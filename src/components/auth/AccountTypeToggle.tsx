"use client";

import { Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UiAccountType } from "@/hooks/useAuth";

interface AccountTypeToggleProps {
  value: UiAccountType;
  onChange: (v: UiAccountType) => void;
  className?: string;
}

/**
 * Visual toggle between Merchant (تاجر) and Customer (عميل) accounts.
 * Matches the brand reference: 2 cards with icons + check badge on the active one.
 */
export function AccountTypeToggle({
  value,
  onChange,
  className,
}: AccountTypeToggleProps) {
  const options: {
    value: UiAccountType;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "merchant",
      label: "حساب تاجر",
      desc: "متجر / نشاط تجاري",
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      value: "customer",
      label: "حساب عميل",
      desc: "فرد / مستلم",
      icon: <User className="h-4 w-4" />,
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl border-2 p-3 text-right transition-all",
              active
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
            )}
            aria-pressed={active}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10"
              )}
            >
              {opt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold truncate",
                  active ? "text-primary" : "text-foreground"
                )}
              >
                {opt.label}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {opt.desc}
              </p>
            </div>
            {active && (
              <span className="absolute top-2 left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2 5L4.5 7.5L8.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
