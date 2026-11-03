"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

interface LogoProps {
  size?: number;
  withText?: boolean;
  textClassName?: string;
  variant?: "light" | "dark";
  className?: string;
}

/**
 * Masar X brand lockup — logo mark + Arabic + Latin name.
 * Variant "light" is for dark backgrounds (e.g. BrandPanel).
 */
export function Logo({
  size = 44,
  withText = true,
  textClassName,
  variant = "dark",
  className,
}: LogoProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "text-lg font-extrabold tracking-tight",
              variant === "light" ? "text-white" : "text-foreground",
              textClassName
            )}
          >
            {t("common.brandName")}
          </span>
          <span
            className={cn(
              "text-[10px] font-medium tracking-[0.2em] mt-0.5",
              variant === "light" ? "text-white/60" : "text-muted-foreground"
            )}
          >
            {t("common.brandNameEn")}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * The M logo mark — a square tile with the letter M drawn as a route/path,
 * matching the brand reference (deep green gradient + mint accent).
 */
export function LogoMark({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label={t("common.brandName")}
      role="img"
    >
      <defs>
        <linearGradient id="masar-mark-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#0D3B3E" />
          <stop offset="100%" stopColor="#082A2C" />
        </linearGradient>
        <linearGradient id="masar-mint-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A3D9A5" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      {/* Rounded tile background */}
      <rect width="48" height="48" rx="12" fill="url(#masar-mark-grad)" />
      {/* Decorative dotted map pattern */}
      <g opacity="0.15" fill="white">
        <circle cx="8" cy="8" r="0.8" />
        <circle cx="14" cy="8" r="0.8" />
        <circle cx="20" cy="8" r="0.8" />
        <circle cx="38" cy="40" r="0.8" />
        <circle cx="40" cy="38" r="0.8" />
        <circle cx="42" cy="36" r="0.8" />
      </g>
      {/* The M drawn as a route path (left side, white) */}
      <path
        d="M12 33V16L18 24L24 16V33"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Route X mark (right side, mint gradient) */}
      <path
        d="M28 33V18L36 33V15"
        stroke="url(#masar-mint-grad)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Small location pin dot at the end of the route */}
      <circle cx="36" cy="15" r="2" fill="#A3D9A5" />
      <circle cx="36" cy="15" r="3.5" fill="#A3D9A5" opacity="0.25" />
    </svg>
  );
}
