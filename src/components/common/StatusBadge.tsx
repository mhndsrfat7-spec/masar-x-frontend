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
import { tStatic, useTranslation } from "@/i18n";
import type { ShipmentStatus } from "@/types/api";

interface StatusMeta {
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  dot: string;
}

interface StatusStyleMeta {
  key:
    | "DRAFT"
    | "PENDING"
    | "PROCESSING"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "CANCELED"
    | "RETURNED"
    | "FAILED";
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  dot: string;
}

const STATUS_STYLE_MAP: Record<string, StatusStyleMeta> = {
  DRAFT: {
    key: "DRAFT",
    icon: Package,
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  PENDING: {
    key: "PENDING",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  PROCESSING: {
    key: "PROCESSING",
    icon: Clock,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  IN_TRANSIT: {
    key: "IN_TRANSIT",
    icon: Truck,
    className: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  OUT_FOR_DELIVERY: {
    key: "OUT_FOR_DELIVERY",
    icon: Truck,
    className: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  DELIVERED: {
    key: "DELIVERED",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-600",
  },
  CANCELLED: {
    key: "CANCELLED",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  CANCELED: {
    key: "CANCELED",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  RETURNED: {
    key: "RETURNED",
    icon: RotateCcw,
    className: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  FAILED: {
    key: "FAILED",
    icon: AlertCircle,
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

export function getStatusMeta(status: ShipmentStatus): StatusMeta {
  const upperKey = status ? String(status).toUpperCase() : "";
  const style = STATUS_STYLE_MAP[upperKey];
  if (!style) {
    return {
      label: tStatic("status.UNKNOWN.label"),
      short: tStatic("status.UNKNOWN.short"),
      icon: PackageCheck,
      className: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground",
    };
  }
  return {
    label: tStatic(`status.${style.key}.label`),
    short: tStatic(`status.${style.key}.short`),
    icon: style.icon,
    className: style.className,
    dot: style.dot,
  };
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
  // Subscribe to active locale so StatusBadge re-renders when language changes
  useTranslation();
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
