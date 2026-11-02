"use client";

import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  AlertCircle,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShipmentStatus } from "@/types/api";

interface StatusMeta {
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  dot: string;
}

const STATUS_MAP: Record<string, StatusMeta> = {
  // UPPERCASE (real backend values)
  DRAFT: {
    label: "مسودة",
    short: "مسودة",
    icon: Package,
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  PENDING: {
    label: "قيد الانتظار",
    short: "بانتظار",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  PROCESSING: {
    label: "قيد المعالجة",
    short: "معالجة",
    icon: Clock,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  IN_TRANSIT: {
    label: "قيد التوصيل",
    short: "توصيل",
    icon: Truck,
    className: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  OUT_FOR_DELIVERY: {
    label: "خرج للتسليم",
    short: "خرج",
    icon: Truck,
    className: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  DELIVERED: {
    label: "تم التسليم",
    short: "تم التسليم",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-600",
  },
  CANCELLED: {
    label: "ملغاة",
    short: "ملغاة",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  CANCELED: {
    label: "ملغاة",
    short: "ملغاة",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  RETURNED: {
    label: "مسترجعة",
    short: "إرجاع",
    icon: RotateCcw,
    className: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  FAILED: {
    label: "فشل التسليم",
    short: "فشل",
    icon: AlertCircle,
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  // LOWERCASE (mock / fallback values)
  draft: { label: "مسودة", short: "مسودة", icon: Package, className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  pending: { label: "قيد الانتظار", short: "بانتظار", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  processing: { label: "قيد المعالجة", short: "معالجة", icon: Clock, className: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  in_transit: { label: "قيد التوصيل", short: "توصيل", icon: Truck, className: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  out_for_delivery: { label: "خرج للتسليم", short: "خرج", icon: Truck, className: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  delivered: { label: "تم التسليم", short: "تم التسليم", icon: CheckCircle2, className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-600" },
  cancelled: { label: "ملغاة", short: "ملغاة", icon: XCircle, className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  canceled: { label: "ملغاة", short: "ملغاة", icon: XCircle, className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  returned: { label: "مسترجعة", short: "إرجاع", icon: RotateCcw, className: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  failed: { label: "فشل التسليم", short: "فشل", icon: AlertCircle, className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

const FALLBACK: StatusMeta = {
  label: "غير معروف",
  short: "غير معروف",
  icon: PackageCheck,
  className: "bg-muted text-muted-foreground border-border",
  dot: "bg-muted-foreground",
};

export function getStatusMeta(status: ShipmentStatus): StatusMeta {
  if (!status) return FALLBACK;
  const key = String(status).toUpperCase();
  return STATUS_MAP[key] ?? STATUS_MAP[String(status).toLowerCase()] ?? FALLBACK;
}

export function StatusBadge({
  status,
  size = "md",
  withIcon = false,
}: {
  status: ShipmentStatus;
  size?: "sm" | "md";
  withIcon?: boolean;
}) {
  const meta = getStatusMeta(status);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap",
        meta.className,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
      {meta.label}
      {withIcon && Icon && (
        <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      )}
    </span>
  );
}
