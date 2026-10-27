"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

/**
 * Saudi phone input — fixed +966 prefix with Saudi flag.
 * The user only types the local number (5XXXXXXXX).
 * Auto-formats as "5 XXXX XXXX" for readability.
 */
export function PhoneInput({
  value,
  onChange,
  className,
  disabled,
  error,
}: PhoneInputProps) {
  // Normalize stored phone: strip +966 / 966 / leading 0, keep 9 digits.
  const local = value
    .replace(/^\+966/, "")
    .replace(/^966/, "")
    .replace(/^0+/, "")
    .replace(/[^\d]/g, "")
    .slice(0, 9);

  const handleChange = (raw: string) => {
    const digits = raw
      .replace(/^\+966/, "")
      .replace(/^966/, "")
      .replace(/^0+/, "")
      .replace(/[^\d]/g, "")
      .slice(0, 9);
    onChange(digits);
  };

  return (
    <div
      className={cn(
        "flex items-stretch rounded-xl border-2 bg-card overflow-hidden transition-colors",
        error
          ? "border-destructive focus-within:border-destructive"
          : "border-border focus-within:border-primary",
        disabled && "opacity-60",
        className
      )}
      dir="ltr"
    >
      {/* Saudi flag + code */}
      <div className="flex items-center gap-2 px-3 border-l-2 border-border bg-muted/50">
        <SaudiFlag className="h-5 w-7 rounded-sm" />
        <span className="text-sm font-medium text-foreground" dir="ltr">
          +966
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      {/* Number input */}
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        dir="ltr"
        disabled={disabled}
        value={formatLocal(local)}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="5 1999 9999"
        className="flex-1 bg-transparent px-3 py-3 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal"
      />
    </div>
  );
}

function formatLocal(digits: string): string {
  // 9 digits → "5 XXXX XXXX"
  const d = digits.slice(0, 9);
  const part1 = d.slice(0, 1);
  const part2 = d.slice(1, 5);
  const part3 = d.slice(5, 9);
  return [part1, part2, part3].filter(Boolean).join(" ").trim();
}

export function SaudiFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="علم المملكة العربية السعودية"
      role="img"
    >
      <rect width="24" height="16" fill="#006C35" />
      {/* Crescent moon + sword (simplified) */}
      <g fill="white">
        <path d="M16 5.5 a2.5 2.5 0 1 0 0 5 a3 3 0 1 1 0 -5 z" />
        <rect x="8" y="9.7" width="9" height="0.5" rx="0.25" />
      </g>
    </svg>
  );
}
